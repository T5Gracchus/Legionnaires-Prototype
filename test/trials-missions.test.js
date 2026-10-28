import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {LEVELS,presetLoadout} from '../src/trials-data.js';
import {createTrial,act,endTurn,ground,lineClear,coverAt,canTarget,reachable} from '../src/trials-engine.js';
import {advanceGoals,reconcileGoals,goalLines} from '../src/trials-goals.js';
import {trialResult,createPlayClock} from '../src/trials-telemetry.js';
import {replayTrial} from '../scripts/replay-trial.mjs';
import {simulateTrial} from '../scripts/playtest-trials.mjs';
const tick=s=>advanceGoals(s,{ground,occupied:(s,x,y)=>s.units.some(u=>!u.extracted&&u.x===x&&u.y===y)||s.enemies.some(e=>e.hp>0&&e.x===x&&e.y===y)});
const fixed=()=>.5;
test('nine offworld missions plus linked Roman tutorial; authored arrivals and structures are legal',()=>{
  assert.equal(Object.keys(LEVELS).length,9);
  for(const id of Object.keys(LEVELS)){
    const s=createTrial(id);for(const r of s.reinforcements)assert.ok(ground(s,r.x,r.y),`${id}: arrival ${r.x},${r.y}`);
    for(const t of s.structures){assert.ok(!s.units.concat(s.enemies).some(u=>u.x===t.x&&u.y===t.y));assert.ok(!ground(s,t.x,t.y));}
  }
});
test('destruction spends ammunition and Act, opens ground and sightlines, removes cover, and replays',()=>{
  const s=createTrial('foundry');s.enemies=[];s.heights=s.heights.map(r=>'0'.repeat(12));s.structures=[{id:'test',name:'Test barrier',kind:'barricade',x:3,y:1,z:0,hp:5,maxHp:5,destroyed:false}];s.map=s.map.map(r=>r.replaceAll('W','.'));
  const u=s.units[0];u.x=2;u.y=1;s.telemetry.initialState=structuredClone((({telemetry,...rest})=>rest)(s));
  assert.equal(ground(s,3,1),false);assert.equal(lineClear(s,{x:2,y:1},{x:4,y:1}),false);assert.equal(coverAt(s,{x:3,y:2}),true);
  assert.ok(act(s,u.id,'attack',3,1));assert.equal(u.ammo,5);assert.equal(u.actions.act,false);assert.equal(s.structures[0].destroyed,true);
  assert.ok(ground(s,3,1));assert.ok(lineClear(s,{x:2,y:1},{x:4,y:1}));assert.equal(coverAt(s,{x:3,y:2}),false);
  assert.equal(canTarget(s,u,'attack',3,1),false);assert.ok(s.telemetry.events.some(e=>e.type==='terrain'));
  const result=trialResult(s,{timing:createPlayClock().read()});assert.deepEqual(replayTrial(result).structures,s.structures);
});
test('hold needs a living holder after enemy actions; contest pauses progress; extraction stays locked',()=>{
  const s=createTrial('crown');s.enemies=[];const u=s.units[0],o=s.objectives[0];u.x=o.x;u.y=o.y;u.z=Number(s.heights[o.y][o.x]);assert.ok(act(s,u.id,'objective',o.x,o.y));
  tick(s);assert.equal(s.mission.progress,1);s.enemies=[{x:o.x+1,y:o.y,hp:1}];tick(s);assert.equal(s.mission.progress,1);assert.equal(s.mission.contested,true);
  s.enemies=[];u.hp=0;tick(s);assert.equal(s.mission.progress,1);u.hp=1;for(let i=0;i<3;i++)tick(s);assert.ok(s.objectives[1].done);
});
test('defense cannot end early or skip a blocked wave; multiple arrivals queue until entry clears',()=>{
  const s=createTrial('ferry');s.enemies=[];s.objectives[0].done=true;s.mission.progress=6;tick(s);assert.equal(s.objectives[1].done,false);
  const u=s.units[0];u.x=11;u.y=1;endTurn(s,fixed);endTurn(s,fixed);assert.equal(s.enemies.length,1);assert.ok(s.mission.pending.includes(0));
  u.x=10;u.y=0;endTurn(s,fixed);assert.ok(s.mission.spawned.includes(0));assert.ok(s.mission.spawned.includes(1));
  s.mission.spawned=s.reinforcements.map((_,i)=>i);s.mission.pending=[];s.enemies=[];tick(s);assert.equal(s.objectives[1].done,true);
});
test('losing a protected cart/beacon fails immediately even with living recruits',()=>{
  for(const id of ['ferry','caravan']){const s=createTrial(id);s.mission.protected.hp=0;reconcileGoals(s);assert.equal(s.status,'defeat');assert.equal(s.mission.failed,true);}
});
test('an enemy actually attacks a protected target and its destruction ends the enemy phase',()=>{
  const s=createTrial('ferry');s.heights=s.heights.map(r=>'0'.repeat(12));s.mission.protected.hp=1;
  const e=s.enemies[0];Object.assign(e,{x:4,y:3,z:0,range:1,move:0});s.enemies=[e];
  assert.equal(canTarget(s,s.units[0],'attack',3,3),false,'The player cannot attack the friendly beacon');
  endTurn(s,fixed);assert.equal(s.status,'defeat');assert.equal(s.mission.protected.hp,0);assert.equal(s.metrics.protectedDamage,1);assert.ok(s.telemetry.events.some(e=>e.type==='combat'&&e.target==='protected'));
});
test('escort needs an adjacent standing guide, never teleports through an occupied route, and ends at the ferry',()=>{
  const s=createTrial('caravan');s.enemies=[];s.objectives[0].done=true;tick(s);assert.equal(s.mission.routeIndex,0);
  const u=s.units[0];u.x=3;u.y=2;const blocker=s.units[1];blocker.x=4;blocker.y=3;tick(s);assert.equal(s.mission.routeIndex,0);
  blocker.x=0;blocker.y=0;tick(s);assert.equal(s.mission.routeIndex,2);assert.equal(s.mission.protected.x,5);
  while(!s.objectives[1].done){u.x=s.mission.protected.x;u.y=2;tick(s);}assert.equal(s.mission.protected.x,10);assert.equal(s.mission.protected.hp,18);
});
test('linked controls require different living holders in the same uncontested phase',()=>{
  const s=createTrial('sluice');s.enemies=[];const [a,b]=s.objectives,[u,v]=s.units;u.x=a.x;u.y=a.y;tick(s);assert.equal(a.done,false);
  v.x=b.x;v.y=b.y;s.enemies=[{x:b.x+1,y:b.y,hp:1}];tick(s);assert.equal(a.done,false);s.enemies=[];for(let i=0;i<s.mission.required;i++)tick(s);assert.ok(a.done&&b.done);
});
test('raid order and archive seal delay cannot be bypassed, including by flying',()=>{
  const s=createTrial('archive');s.enemies=[];const u=s.units[1],[a,b,c]=s.objectives;
  u.x=c.x;u.y=c.y;assert.equal(canTarget(s,u,'objective',c.x,c.y),false);
  u.x=a.x;u.y=a.y;assert.ok(act(s,u.id,'objective',a.x,a.y));u.actions.interact=true;u.x=b.x;u.y=b.y;assert.ok(act(s,u.id,'objective',b.x,b.y));
  u.actions.interact=true;u.x=c.x;u.y=c.y;assert.equal(canTarget(s,u,'objective',c.x,c.y),false);assert.ok(goalLines(s).some(l=>l.includes('opens in round 3')));
  s.round=3;assert.ok(act(s,u.id,'objective',c.x,c.y));
});
test('all six full mission traces are legal, deterministic, and reproduce every event',()=>{
  for(const id of ['crown','ferry','foundry','caravan','sluice','archive']){
    const plan=simulateTrial(id,'mixed',42),s=createTrial(id,presetLoadout(),42);
    for(const a of plan.transcript)assert.ok(a.key==='endTurn'?endTurn(s):act(s,a.actor,a.key,a.x,a.y));
    assert.equal(s.status,plan.status,id);assert.equal(s.status,'success',id);assert.deepEqual(s.metrics,plan.metrics);
    assert.equal(replayTrial(trialResult(s,{timing:createPlayClock().read()})).status,'success');
  }
});
test('saved human 0.7 trial still replays exactly under its historical rules',async()=>{
  const path=new URL('../docs/playtests/2026-10-27T02-39-58-283Z-salvage-8e5c1916-e995-4965-a255-c0edaf53e151.json',import.meta.url);
  assert.equal(replayTrial(JSON.parse(await readFile(path,'utf8'))).status,'success');
});
