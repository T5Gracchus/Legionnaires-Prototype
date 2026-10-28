import { createServer } from 'node:http';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve, extname, sep, relative, isAbsolute } from 'node:path';
import { LEVELS, RECRUITS, WEAPONS, ARMORS } from '../src/trials-data.js';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png' };
export const MAX_PLAYTEST_BYTES = 16 * 1024 * 1024;
const metricKeys = ['actions', 'attacks', 'damageTaken', 'knockdowns', 'abilities', 'kills', 'revives', 'enforcementDeaths'];
const extraMetrics = ['enemyAttacks','enemyHeals','enemyDebuffs','enemyCommands','fallDamage','terrainDamage','structuresDestroyed','protectedDamage'];
const integer = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

// Telemetry is data only: bounded nested JSON, with complete snapshots checked at
// the same boundary as the summary. It never becomes a filesystem destination.
function validTree(value,depth=0,budget={nodes:0}) {
  if(++budget.nodes>1500000||depth>24)return false;
  if(value===null||typeof value==='boolean')return true;
  if(typeof value==='number')return Number.isFinite(value);
  if(typeof value==='string')return value.length<=10000;
  if(Array.isArray(value))return value.length<=10000&&value.every(v=>validTree(v,depth+1,budget));
  return object(value)&&Object.keys(value).length<=100&&Object.entries(value).every(([k,v])=>!['__proto__','prototype','constructor'].includes(k)&&validTree(v,depth+1,budget));
}
function validSnapshot(s) {
  const position=u=>object(u)&&integer(u.x,0,11)&&integer(u.y,0,7)&&integer(u.z,0,3)&&integer(u.hp,0,1000)&&integer(u.maxHp,1,1000)&&u.hp<=u.maxHp;
  return object(s)&&Object.hasOwn(LEVELS,s.levelId)&&integer(s.round,1,10000)&&Number.isInteger(s.seed)&&
    Array.isArray(s.map)&&s.map.length===8&&s.map.every(r=>typeof r==='string'&&r.length===12&&/^[.XTW~]+$/.test(r))&&
    Array.isArray(s.heights)&&s.heights.length===8&&s.heights.every(r=>typeof r==='string'&&/^[0-3]{12}$/.test(r))&&
    Array.isArray(s.units)&&s.units.length===4&&new Set(s.units.map(u=>u?.id)).size===4&&s.units.every(u=>position(u)&&Object.hasOwn(RECRUITS,u.id)&&Object.hasOwn(WEAPONS,u.weapon)&&Object.hasOwn(ARMORS,u.armor)&&(u.ammo===null||integer(u.ammo,0,1000)))&&
    Array.isArray(s.enemies)&&s.enemies.length<=30&&s.enemies.every(position)&&
    Array.isArray(s.objectives)&&s.objectives.length>=1&&s.objectives.length<=8&&integer(s.remaining,0,1000)&&
    (s.build!=='0.9.0'||Array.isArray(s.structures)&&s.structures.length<=30&&s.structures.every(t=>position(t)&&typeof t.destroyed==='boolean'&&t.destroyed===(t.hp===0))&&
      Array.isArray(s.reinforcements)&&s.reinforcements.length<=30&&s.reinforcements.every(r=>object(r)&&integer(r.round,1,1000)&&integer(r.x,0,11)&&integer(r.y,0,7))&&
      (!s.mission||object(s.mission)&&['hold','defense','demolition','escort','linked','raid'].includes(s.mission.type)&&integer(s.mission.progress,0,1000)&&(!s.mission.protected||position(s.mission.protected))));
}
function validTiming(t) {
  return object(t)&&['totalMs','activeMs','idleMs','pausedMs'].every(k=>integer(t[k],0,31536000000))&&
    Math.abs(t.totalMs-t.activeMs-t.idleMs-t.pausedMs)<=3&&t.idleThresholdMs===60000&&
    Array.isArray(t.events)&&t.events.length<=10000&&t.events.every(e=>object(e)&&['pause','visibility'].includes(e.type)&&typeof e.value==='boolean'&&integer(e.elapsedMs,0,t.totalMs));
}

function validatedResult(data) {
  const invalid = () => { throw Object.assign(new Error('Invalid playtest result. Check the notes length and try again.'), { status: 400 }); };
  if (!object(data) || typeof data.version !== 'string' || data.version.length > 30 ||
      !Object.hasOwn(LEVELS, data.level) || !integer(data.seed, 1, 4294967295) ||
      !['success', 'defeat'].includes(data.status) || !integer(data.rounds, 1, 10000) ||
      !Number.isFinite(data.elapsedMinutes) || data.elapsedMinutes < 0 ||
      typeof data.notes !== 'string' || data.notes.length > 10000 ||
      !['', 'Too easy', 'About right', 'Too hard'].includes(data.rating)) invalid();
  if (!Array.isArray(data.loadout) || data.loadout.length !== 4 ||
      new Set(data.loadout.map(u => u?.id)).size !== 4 ||
      !data.loadout.every(u => object(u) && Object.hasOwn(RECRUITS, u.id) && Object.hasOwn(WEAPONS, u.weapon) && Object.hasOwn(ARMORS, u.armor))) invalid();
  if (!Array.isArray(data.extracted) || data.extracted.length > 4 || new Set(data.extracted).size !== data.extracted.length ||
      !data.extracted.every(id => data.loadout.some(u => u.id === id))) invalid();
  if (!Array.isArray(data.objectives) || (data.objectives.length < 1 || data.objectives.length > 8) ||
      !data.objectives.every(o => object(o) && typeof o.name === 'string' && o.name.length <= 100 &&
        typeof o.id === 'string' && o.id.length <= 30 && typeof o.kind === 'string' && o.kind.length <= 30 &&
        integer(o.x, 0, 11) && integer(o.y, 0, 7) && typeof o.done === 'boolean')) invalid();
  if (!object(data.metrics) || !metricKeys.every(k => integer(data.metrics[k], 0, 10000000)) ||
      !object(data.budget) || !['total', 'peak', 'penalty', 'turns', 'grace'].every(k => integer(data.budget[k], 0, 1000)) ||
      !Array.isArray(data.log) || data.log.length > 100 || !data.log.every(line => typeof line === 'string' && line.length <= 2000)) invalid();
  const enhanced=['0.7.0','0.8.0','0.9.0'].includes(data.version);
  if(data.version==='0.8.0'&&data.rulesVersion!=='0.7.0'||data.version==='0.9.0'&&data.rulesVersion!=='0.9.0')invalid();
  if(enhanced&&(!validTree({initialState:data.initialState,finalState:data.finalState,events:data.events,timing:data.timing,actionTimes:data.actionTimes})||
    !validTiming(data.timing)||!validSnapshot(data.initialState)||!validSnapshot(data.finalState)||
    data.initialState.levelId!==data.level||data.finalState.levelId!==data.level||data.finalState.status!==data.status||
    !Array.isArray(data.events)||data.events.length>10000||!data.events.every((e,i)=>object(e)&&e.seq===i&&integer(e.round,1,10000)&&['action','enemy','phase','end','roll','combat','support','fall','chain','reinforcement','terrain','goal'].includes(e.type)&&(!e.state||validSnapshot(e.state)))||
    !Array.isArray(data.actionTimes)||data.actionTimes.length>5000||!data.actionTimes.every(t=>object(t)&&integer(t.throughEvent,0,data.events.length-1)&&['totalMs','activeMs','idleMs','pausedMs'].every(k=>integer(t[k],0,data.timing.totalMs)))))invalid();
  if(extraMetrics.some(k=>Object.hasOwn(data.metrics,k)&&!integer(data.metrics[k],0,10000000)))invalid();
  // Copy only the documented result fields. Clients never choose a path or filename.
  return {
    version: data.version, level: data.level, seed: data.seed, status: data.status,
    rounds: data.rounds, elapsedMinutes: data.elapsedMinutes,
    loadout: data.loadout.map(({ id, weapon, armor }) => ({ id, weapon, armor })),
    extracted: data.extracted,
    objectives: data.objectives.map(({ id, name, kind, x, y, z, done }) => ({ id, name, kind, x, y, ...(integer(z,0,3)?{z}:{}), done })),
    metrics: Object.fromEntries([...metricKeys,...extraMetrics.filter(k=>Object.hasOwn(data.metrics,k))].map(k => [k, data.metrics[k]])),
    budget: Object.fromEntries(['total', 'peak', 'penalty', 'turns', 'grace'].map(k => [k, data.budget[k]])),
    rating: data.rating, notes: data.notes, log: data.log,
    ...(['0.8.0','0.9.0'].includes(data.version)?{rulesVersion:data.rulesVersion}:{}),
    ...(enhanced?{timing:data.timing,actionTimes:data.actionTimes,initialState:data.initialState,finalState:data.finalState,events:data.events}:{}),
  };
}

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

async function savePlaytest(req, res, root) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); json(res, 405, { error: 'Use POST to save a result.' }); return; }
  // Local, same-origin browser requests only. No cross-origin write API or arbitrary file writes.
  const host = req.headers.host;
  const allowedHosts = [`127.0.0.1:${req.socket.localPort}`, `localhost:${req.socket.localPort}`];
  if (!allowedHosts.includes(host) || req.headers.origin !== `http://${host}` || req.headers['sec-fetch-site'] === 'cross-site') {
    json(res, 403, { error: 'Open the prototype on this local server to save a result.' }); return;
  }
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    json(res, 415, { error: 'A JSON playtest result is required.' }); return;
  }
  if (Number(req.headers['content-length']) > MAX_PLAYTEST_BYTES) {
    json(res, 413, { error: 'Playtest result is too large.' }); return;
  }
  let bytes = 0;
  const chunks = [];
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    bytes += chunk.length;
    if (bytes > MAX_PLAYTEST_BYTES) { req.resume(); json(res, 413, { error: 'Playtest result is too large.' }); return; }
    chunks.push(chunk);
  }
  let data;
  try { data = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { json(res, 400, { error: 'The playtest result could not be read as JSON.' }); return; }
  const result = validatedResult(data);
  const output = resolve(root, 'docs', 'playtests');
  await mkdir(output, { recursive: true });
  const location = relative(await realpath(root), await realpath(output));
  if (isAbsolute(location) || location === '..' || location.startsWith(`..${sep}`)) throw new Error('Playtest folder resolves outside the repository.');
  const savedAt = new Date().toISOString();
  const filename = `${savedAt.replace(/[:.]/g, '-')}-${result.level}-${randomUUID()}.json`;
  await writeFile(resolve(output, filename), JSON.stringify({ schemaVersion: ['0.7.0','0.8.0','0.9.0'].includes(result.version)?2:1, savedAt, ...result }, null, 2) + '\n', { flag: 'wx', encoding: 'utf8' });
  json(res, 201, { path: `docs/playtests/${filename}`, savedAt });
}

export function createPrototypeServer({ root }) {
  return createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      if (pathname === '/api/playtests') { await savePlaytest(req, res, root); return; }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }).end(); return; }
      const path = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!path.startsWith(root.endsWith(sep) ? root : root + sep) || !types[extname(path)]) { res.writeHead(404).end(); return; }
      const data = await readFile(path), mime = types[extname(path)];
      res.writeHead(200, { 'Content-Type': mime + (mime.startsWith('image/') ? '' : '; charset=utf-8'), 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (req.url?.startsWith('/api/playtests')) {
        json(res, error.status || 500, { error: error.status ? error.message : 'Could not write the playtest file. Your notes have not been cleared; try again or download a copy.' });
      } else res.writeHead(404).end('Not found');
    }
  });
}
