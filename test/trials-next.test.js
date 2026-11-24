import test from 'node:test';
import assert from 'node:assert/strict';
import {createTrial,act,endTurn,reachable,heightAt,spatialDistance,lineClear,coverAt,movementPreview,moveAllowance,slowed,refreshIntents} from '../src/trials-engine.js';
import {presetLoadout,ENEMIES,LEVELS,RECRUITS} from '../src/trials-data.js';
import {snapshot,createPlayClock,trialResult} from '../src/trials-telemetry.js';
const fixed=()=>.5;
function flat(){const s=createTrial('salvage',presetLoadout('heavy'),42,{elevation:false});s.map=Array(8).fill('.'.repeat(12));s.enemies=[];s.units.forEach((u,i)=>{u.x=0;u.y=i;u.z=0;});return s;}
function heights(s,values){s.heights=Array(8).fill('000000000000');for(const [x,y,z] of values){const r=[...s.heights[y]];r[x]=String(z);s.heights[y]=r.join('');}}
function enemy(s,type,x,y){const def=ENEMIES[type],e={...def,type,id:`e${s.enemies.length+1}`,token:`E${s.enemies.length+1}`,maxHp:def.hp,x,y,z:heightAt(s,x,y),vertical:3,climb:1,safeDrop:1,charges:def.charges||0,cooldown:0};s.enemies.push(e);return e;}

test('all terraces match the map and every recruit has ground and vertical traits',()=>{
  for(const l of Object.values(LEVELS)){assert.equal(l.heights.length,l.map.length);assert.ok(l.heights.every(r=>/^[0-3]{12}$/.test(r)));}
  for(const r of Object.values(RECRUITS)){assert.ok(r.move>0&&r.vertical>0&&r.climb>0&&r.safeDrop>0);}
});
test('a steep upward step is rejected; stepping up spends separate vertical allowance',()=>{
  const s=flat(),u=s.units[0];u.x=2;u.y=3;heights(s,[[3,3,2]]);
  assert.equal(movementPreview(s,u,'move',3,3),null);
  heights(s,[[3,3,1],[4,3,2],[5,3,3]]);
  assert.equal(reachable(s,u).get('4,3').vertical,2);assert.equal(reachable(s,u).has('5,3'),false);
  assert.ok(act(s,u.id,'move',4,3));assert.equal(u.z,2);assert.equal(u.actions.move,false);
});
test('a drop previews actual damage, cannot be dodged or blocked, and lethal drops are unavailable',()=>{
  const s=flat(),u=s.units[0];u.x=3;u.y=3;u.vertical=4;heights(s,[[3,3,3]]);
  assert.equal(movementPreview(s,u,'move',4,3).fall,6);u.dodge=1;u.block=1;u.defending=true;
  const hp=u.hp;assert.ok(act(s,u.id,'move',4,3));assert.equal(u.hp,hp-6);assert.equal(s.metrics.fallDamage,6);
  u.x=3;u.y=3;u.actions.move=true;u.hp=6;assert.equal(movementPreview(s,u,'move',4,3),null);
});
test('a safe detour is preferred to a damaging direct drop',()=>{
  const s=flat(),u=s.units[0];u.x=3;u.y=3;u.vertical=4;u.move=5;
  heights(s,[[3,3,2],[3,2,1],[4,2,0]]);
  const p=movementPreview(s,u,'move',4,3);assert.equal(p.fall,0);assert.ok(p.cost>1);
});
test('Flight ignores falls; Leap keeps its own height and landing restrictions',()=>{
  const s=flat(),fly=s.units.find(u=>u.id==='aer'),jump=s.units.find(u=>u.id==='bound');
  fly.x=3;fly.y=3;jump.x=3;jump.y=5;heights(s,[[3,3,3],[3,5,3],[7,5,0],[5,5,3]]);
  assert.equal(movementPreview(s,fly,'move',4,3).fall,0);
  assert.equal(movementPreview(s,jump,'leap',7,5).fall,3);
  jump.x=7;jump.y=5;assert.equal(movementPreview(s,jump,'leap',5,5),null);
});
test('height counts toward interactions and weapon range; ridges obstruct sight',()=>{
  const s=flat(),u=s.units[0];u.x=2;u.y=3;const e=enemy(s,'spear',3,3);heights(s,[[3,3,2]]);
  assert.equal(spatialDistance(s,u,e),3);assert.equal(act(s,u.id,'sidearm',e.x,e.y),false);
  heights(s,[[4,3,3]]);assert.equal(lineClear(s,{x:2,y:3},{x:6,y:3}),false);
  heights(s,[[2,3,3],[6,3,3],[4,3,1]]);assert.equal(lineClear(s,{x:2,y:3},{x:6,y:3}),true);
});
test('cover reduces ranged damage by one, and a higher shooter can bypass it',()=>{
  const s=flat(),u=s.units[0],e=enemy(s,'spear',4,3);u.x=2;u.y=3;
  s.map[2]='....T.......';assert.ok(coverAt(s,e));act(s,u.id,'attack',e.x,e.y,fixed);
  let hit=s.telemetry.events.find(e=>e.type==='combat');assert.equal(hit.cover,1);
  u.actions.act=true;e.hp=e.maxHp;heights(s,[[2,3,1]]);act(s,u.id,'attack',e.x,e.y,fixed);
  hit=s.telemetry.events.filter(e=>e.type==='combat').at(-1);assert.equal(hit.cover,0);
});
test('menders heal living allies, obey cooldown/charges, and never revive',()=>{
  const s=flat(),m=enemy(s,'healer',8,3),guard=enemy(s,'brute',9,3);guard.hp=4;refreshIntents(s);
  assert.match(m.intent,/Mend/);endTurn(s,fixed);assert.equal(guard.hp,8);assert.equal(m.charges,1);assert.equal(s.metrics.enemyHeals,1);
  endTurn(s,fixed);assert.equal(s.metrics.enemyHeals,1);endTurn(s,fixed);assert.equal(s.metrics.enemyHeals,2);assert.equal(m.charges,0);
  guard.hp=0;endTurn(s,fixed);assert.equal(guard.hp,0);
});
test('binding slows through the next turn then expires, without stacking',()=>{
  const s=flat(),u=s.units[0];u.x=5;u.y=3;enemy(s,'hexer',7,3);enemy(s,'hexer',8,3);
  endTurn(s,fixed);assert.ok(slowed(s,u));assert.equal(moveAllowance(s,u),u.move-1);assert.equal(s.metrics.enemyDebuffs,1);
  endTurn(s,fixed);assert.equal(slowed(s,u),false);assert.equal(moveAllowance(s,u),u.move);
});
test('command boosts normal attacks but never grants additional attacks and expires',()=>{
  const s=flat(),u=s.units[0];u.x=5;u.y=3;
  const guard=enemy(s,'spear',6,3),c=enemy(s,'commander',7,3);refreshIntents(s);assert.match(c.intent,/War chant/);
  endTurn(s,fixed);assert.equal(s.metrics.enemyCommands,1);assert.equal(s.metrics.enemyAttacks,1);
  assert.equal(s.telemetry.events.find(e=>e.type==='combat').command,1);assert.equal(guard.inspired,false);assert.equal(c.charges,1);
});
test('a ranged guard repositions away from an adjacent recruit and records its reason/path',()=>{
  const s=flat(),u=s.units[0];u.x=5;u.y=3;const e=enemy(s,'sling',6,3);endTurn(s,fixed);
  assert.ok(spatialDistance(s,e,u)>1);const decision=s.telemetry.events.find(v=>v.type==='enemy');assert.ok(decision.path.length);assert.match(decision.decision,/firing lane/);
});
test('dead support cannot act; basic AI and flat maps can be tested independently',()=>{
  const s=flat();const m=enemy(s,'healer',8,3),g=enemy(s,'brute',9,3);m.hp=0;g.hp=3;endTurn(s,fixed);assert.equal(s.metrics.enemyHeals,0);
  const a=createTrial('relay',presetLoadout(),42,{elevation:false,support:false,enemyAI:'legacy',telemetry:false});assert.ok(a.heights.every(r=>/^0+$/.test(r)));assert.equal(a.telemetry,undefined);assert.ok(a.enemies.every(e=>!e.role));
});
test('snapshots and events preserve RNG, movement, HP, ammo, and enemy decisions without recursion',()=>{
  const s=createTrial('rescue',presetLoadout('heavy'),42);act(s,s.units[0].id,'defend');endTurn(s);
  const a=s.telemetry.events.find(e=>e.type==='action');assert.ok(a.state);assert.equal(a.state.telemetry,undefined);assert.ok(a.state.units.every(u=>Number.isInteger(u.z)));assert.ok(s.telemetry.events.some(e=>e.type==='enemy'));
  const b=structuredClone(s.telemetry.initialState);for(const event of s.telemetry.events){if(event.type==='action')assert.ok(act(b,event.actor,event.action,event.target?.x,event.target?.y));if(event.type==='phase'&&event.phase==='enemy-start')endTurn(b);}
  assert.deepEqual(snapshot(b),snapshot(s));
});
test('clock separates activity, estimated idle, manual pause, and hidden time then freezes',()=>{
  let now=0;const c=createPlayClock(()=>now);now=90000;assert.equal(c.read().activeMs,60000);assert.equal(c.read().idleMs,30000);
  c.touch();now+=10000;c.pause(true);now+=20000;c.hidden(true);c.pause(false);now+=10000;c.hidden(false);now+=5000;c.stop();
  assert.deepEqual([c.read().activeMs,c.read().idleMs,c.read().pausedMs,c.read().totalMs],[75000,30000,30000,135000]);now+=999999;assert.equal(c.read().totalMs,135000);
});
test('browser precision timestamps serialize as bounded integer pause events',()=>{
  let now=10.25;const c=createPlayClock(()=>now);now=19.83;c.pause(true);now=31.42;c.pause(false);c.stop();
  const t=c.read();assert.ok(t.events.every(e=>Number.isInteger(e.elapsedMs)&&e.elapsedMs<=t.totalMs));assert.ok(Math.abs(t.totalMs-t.activeMs-t.idleMs-t.pausedMs)<=3);
});
test('result includes full start/end states, telemetry, timing and notes',()=>{
  const s=flat();act(s,s.units[0].id,'defend');const timing={totalMs:1000,activeMs:1000,idleMs:0,pausedMs:0,idleThresholdMs:60000,events:[]};
  const result=trialResult(s,{notes:'Try the ridge.',timing});assert.equal(result.version,'0.9.0');assert.equal(result.rulesVersion,'0.9.0');assert.equal(result.notes,'Try the ridge.');assert.ok(result.initialState);assert.ok(result.finalState);assert.equal(result.events.length,1);assert.equal(result.finalState.telemetry,undefined);
});
