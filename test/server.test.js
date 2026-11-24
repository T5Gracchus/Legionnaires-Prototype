import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve, dirname, basename } from 'node:path';
import { request } from 'node:http';
import { createPrototypeServer, MAX_PLAYTEST_BYTES } from '../scripts/server.mjs';
import { createTrial, act, endTurn } from '../src/trials-engine.js';
import { trialResult } from '../src/trials-telemetry.js';
import { replayTrial } from '../scripts/replay-trial.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'legionnaires-save-test-'));
  const server = createPrototypeServer({ root });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  t.after(async () => {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    assert.equal(dirname(root), resolve(tmpdir()));
    assert.ok(basename(root).startsWith('legionnaires-save-test-'));
    await rm(root, { recursive: true, force: true });
  });
  const s = createTrial();
  const payload = { version: '0.6.1', level: s.levelId, seed: s.initialSeed, loadout: s.loadout, status: 'defeat', rounds: 5, elapsedMinutes: 9.25, extracted: [], objectives: s.objectives, metrics: s.metrics, budget: s.budget, rating: 'About right', notes: 'Musk was useful.\nTry the sling next time — α 🛡', log: s.log };
  const post = (data = payload, headers = {}) => fetch(`${url}/api/playtests`, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: url, ...headers }, body: JSON.stringify(data) });
  return { root, url, payload, post };
}

test('save writes notes and mission context as unique, non-overwriting repo snapshots', async t => {
  const { root, payload, post } = await fixture(t);
  const response = await post(); assert.equal(response.status, 201);
  const saved = await response.json();
  assert.match(saved.path, /^docs\/playtests\/[A-Za-z0-9-]+\.json$/);
  const record = JSON.parse(await readFile(join(root, saved.path), 'utf8'));
  assert.deepEqual(record, { schemaVersion: 1, savedAt: saved.savedAt, ...payload });
  const second = await (await post({ ...payload, notes: 'Revised notes' })).json();
  assert.notEqual(second.path, saved.path);
  assert.equal(JSON.parse(await readFile(join(root, saved.path), 'utf8')).notes, payload.notes);
  assert.equal((await readdir(join(root, 'docs', 'playtests'))).length, 2);
});

test('writes reject missing/foreign origins, cross-site requests and rebound hostnames', async t => {
  const { root, payload, post, url } = await fixture(t);
  assert.equal((await post(payload, { Origin: 'https://example.com' })).status, 403);
  assert.equal((await post(payload, { Origin: '' })).status, 403);
  assert.equal((await post(payload, { Origin: 'null' })).status, 403);
  assert.equal((await post(payload, { 'Sec-Fetch-Site': 'cross-site' })).status, 403);
  const status = await new Promise((resolve, reject) => {
    const req = request(`${url}/api/playtests`, { method: 'POST', headers: { Host: 'attacker.invalid', Origin: 'http://attacker.invalid', 'Content-Type': 'application/json' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject); req.end(JSON.stringify(payload));
  });
  assert.equal(status, 403); assert.deepEqual(await readdir(root), []);
});

test('malformed, invalid, and oversized payloads do not create files', async t => {
  const { root, post, url, payload } = await fixture(t);
  assert.equal((await fetch(`${url}/api/playtests`, { method: 'POST', headers: { Origin: url, 'Content-Type': 'application/json' }, body: '{oops' })).status, 400);
  for (const data of [{}, null, { ...payload, level: '../escape' }, { ...payload, status: 'playing' }, { ...payload, notes: 'x'.repeat(10001) }, { ...payload, loadout: [] }]) assert.equal((await post(data)).status, 400);
  assert.equal((await post({ ...payload, notes: 'x'.repeat(MAX_PLAYTEST_BYTES) })).status, 413);
  // Chunked requests cannot bypass the size limit by omitting Content-Length.
  const status = await new Promise((resolve, reject) => {
    const req = request(`${url}/api/playtests`, { method: 'POST', headers: { Origin: url, 'Content-Type': 'application/json' } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
    req.on('error', reject); req.write('x'.repeat(MAX_PLAYTEST_BYTES)); req.end('x');
  });
  assert.equal(status, 413); assert.deepEqual(await readdir(root), []);
});

test('complete new-build saves preserve replayable states, events and timing',async t=>{
  const {root,post}=await fixture(t),s=createTrial('relay',undefined,42);
  act(s,s.units[0].id,'defend');while(s.status==='playing')endTurn(s);
  const timing={totalMs:100000,activeMs:60000,idleMs:10000,pausedMs:30000,idleThresholdMs:60000,events:[{type:'pause',value:true,elapsedMs:70000},{type:'pause',value:false,elapsedMs:100000}]};
  const payload=trialResult(s,{notes:'Inspect support decisions.',timing,actionTimes:[{throughEvent:s.telemetry.events.length-1,totalMs:100000,activeMs:60000,idleMs:10000,pausedMs:30000}]});
  assert.ok(JSON.stringify(payload).length>128*1024,'A real complete trace should exercise the expanded payload limit');
  const response=await post(payload);assert.equal(response.status,201,await response.clone().text());
  const saved=await response.json(),record=JSON.parse(await readFile(join(root,saved.path),'utf8'));
  assert.equal(record.schemaVersion,2);assert.deepEqual(record.events,payload.events);assert.deepEqual(record.initialState,payload.initialState);assert.deepEqual(record.finalState,payload.finalState);assert.deepEqual(record.timing,timing);
  assert.equal(replayTrial(record).status,s.status);
  const incompatible={...payload,rulesVersion:'0.8.0'};assert.equal((await post(incompatible)).status,400);
  const legacy=JSON.parse(await readFile(new URL('../docs/playtests/2026-10-27T02-39-58-283Z-salvage-8e5c1916-e995-4965-a255-c0edaf53e151.json',import.meta.url),'utf8'));
  const oldResponse=await post(legacy);assert.equal(oldResponse.status,201);
  const oldSaved=await oldResponse.json(),oldRecord=JSON.parse(await readFile(join(root,oldSaved.path),'utf8'));
  assert.equal(oldRecord.version,'0.7.0');assert.equal(oldRecord.schemaVersion,2);assert.equal(replayTrial(oldRecord).status,legacy.status);
  const bad=structuredClone(payload);bad.finalState.units[0].z=999;assert.equal((await post(bad)).status,400);
  const badTerrain=structuredClone(payload);badTerrain.finalState.structures[0].hp=-1;assert.equal((await post(badTerrain)).status,400);
  const badTiming=structuredClone(payload);badTiming.timing.activeMs=-1;assert.equal((await post(badTiming)).status,400);
  const badEvent=structuredClone(payload);badEvent.events[0].state.units[0].x=999;assert.equal((await post(badEvent)).status,400);
  assert.equal((await readdir(join(root,'docs/playtests'))).length,2);
});

test('client-supplied filenames are ignored and records are not statically exposed', async t => {
  const { root, url, post, payload } = await fixture(t);
  const saved = await (await post({ ...payload, path: '../../escape.txt', filename: '../README.md' })).json();
  assert.match(saved.path, /^docs\/playtests\//);
  const record = JSON.parse(await readFile(join(root, saved.path), 'utf8'));
  assert.equal(Object.hasOwn(record, 'path'), false); assert.equal(Object.hasOwn(record, 'filename'), false);
  assert.deepEqual(await readdir(root), ['docs']);
  assert.equal((await fetch(`${url}/${saved.path}`)).status, 404);
});

test('save failures report failure without claiming a saved file', async t => {
  const { root, post } = await fixture(t);
  await mkdir(join(root, 'docs')); await writeFile(join(root, 'docs', 'playtests'), 'A file blocks this directory.');
  const response = await post(); assert.equal(response.status, 500);
  const body = await response.json(); assert.equal(body.path, undefined); assert.match(body.error, /Could not write/);
});

test('static serving still works, unsupported methods and content types cannot write', async t => {
  const { root, url, post, payload } = await fixture(t);
  await writeFile(join(root, 'index.html'), '<h1>Prototype</h1>');
  const page = await fetch(url); assert.equal(page.status, 200); assert.match(await page.text(), /Prototype/);
  assert.equal((await fetch(url, { method: 'HEAD' })).status, 200);
  assert.equal((await fetch(`${url}/api/playtests`)).status, 405);
  assert.equal((await fetch(`${url}/api/playtests`, { method: 'OPTIONS' })).status, 405);
  assert.equal((await post(payload, { 'Content-Type': 'text/plain' })).status, 415);
  assert.equal((await fetch(`${url}/index.html`, { method: 'POST', body: 'overwrite' })).status, 405);
  assert.equal(await readFile(join(root, 'index.html'), 'utf8'), '<h1>Prototype</h1>');
});
