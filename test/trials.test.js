import test from 'node:test';
import assert from 'node:assert/strict';
import {LEVELS,RECRUITS,WEAPONS,ARMORS,presetLoadout,detectionBudget} from '../src/trials-data.js';
import {createTrial,act,endTurn,canTarget,reachable,active,musked,ground,distance} from '../src/trials-engine.js';
const fixed=()=>.5;
const quiet=()=>{const s=createTrial();s.enemies=[];return s;};

test('every level has valid starts, objectives, enemies and extraction routes',()=>{
  for(const level of Object.keys(LEVELS)){
    const s=createTrial(level),seen=new Set();
    assert.equal(s.map.length,8);assert.ok(s.map.every(r=>r.length===12));
    for(const p of [...s.units,...s.enemies,...s.objectives]){assert.ok(ground(s,p.x,p.y)||s.structures?.some(t=>t.x===p.x&&t.y===p.y&&p.structure===t.id));const k=`${p.x},${p.y}`;assert.ok(!seen.has(k));seen.add(k);}
    const groundSoldier={...s.units[0],id:'centurion'};
    for(const o of s.objectives)assert.ok([...reachable({...s,units:[groundSoldier],enemies:[]},groundSoldier,96).values()].some(p=>distance(p,o)<=1));
  }
});
test('reject duplicate recruits, invalid gear, and unknown encounters',()=>{
  const l=presetLoadout();l[1].id=l[0].id;assert.throws(()=>createTrial('salvage',l));
  const bad=presetLoadout();bad[0].weapon='secret';assert.throws(()=>createTrial('salvage',bad));assert.throws(()=>createTrial('unknown'));
});
test('gear reduces safe turns before deployment, including equipped but unused weapons',()=>{
  assert.equal(detectionBudget('salvage',presetLoadout('native')).turns,16);
  assert.equal(detectionBudget('salvage',presetLoadout('mixed')).turns,13);
  assert.equal(detectionBudget('salvage',presetLoadout('heavy')).turns,8);
  const l=presetLoadout('native');let previous=detectionBudget('salvage',l).turns;
  for(const key of ['musket','carbine','arc','singularity']){l[0].weapon=key;const turns=detectionBudget('salvage',l).turns;assert.ok(turns<=previous);previous=turns;}
  l.forEach(u=>{u.weapon='singularity';u.armor='aegis';});assert.equal(detectionBudget('salvage',l).turns,5);
});
test('all species can equip every weapon and armor, with valid budgets',()=>{
  for(const id of Object.keys(RECRUITS))for(const weapon of Object.keys(WEAPONS))for(const armor of Object.keys(ARMORS)){
    const extras=Object.keys(RECRUITS).filter(k=>k!==id).slice(0,3);
    const s=createTrial('salvage',[{id,weapon,armor},...extras.map(id=>({id,weapon:RECRUITS[id].weapon,armor:RECRUITS[id].armor}))]);
    assert.equal(s.units[0].maxHp,RECRUITS[id].hp+ARMORS[armor].hp);assert.ok(s.budget.turns>=5);
  }
});
test('flight crosses water, but cannot land in water or on occupied terrain',()=>{
  const s=quiet(),u=s.units.find(u=>u.id==='aer');u.x=9;u.y=2;
  assert.ok(canTarget(s,u,'move',9,4));assert.equal(canTarget(s,u,'move',9,3),false);
  const walker=s.units[0];walker.x=8;walker.y=2;
  assert.ok(!reachable(s,walker,2).has('8,4'));
  assert.equal(canTarget(s,u,'move',8,2),false);
});
test('Leap crosses obstacles, consumes only Item/Special, and respects landing and range',()=>{
  const s=quiet(),u=s.units.find(u=>u.id==='bound');u.x=8;u.y=2;
  assert.equal(act(s,u.id,'leap',8,3),false);
  assert.equal(act(s,u.id,'leap',8,7),false);
  assert.ok(act(s,u.id,'leap',8,4));assert.equal(u.actions.move,true);assert.equal(u.actions.act,true);assert.equal(u.actions.interact,false);
});
test('musk affects both sides, filtered armor and Murr resist, cloud lasts two phases',()=>{
  const s=quiet(),u=s.units.find(u=>u.id==='murr'),ally=s.units[0];u.x=5;u.y=2;ally.x=6;ally.y=2;
  assert.ok(act(s,u.id,'musk'));assert.equal(musked(s,u),false);assert.equal(musked(s,ally),true);assert.equal(musked(s,{x:6,y:2}),true);
  ally.armor='mesh';assert.equal(musked(s,ally),false);
  endTurn(s,fixed);assert.equal(s.clouds.length,1);endTurn(s,fixed);assert.equal(s.clouds.length,0);
});
test('objectives require adjacency and Item/Special; extraction requires both objectives',()=>{
  const s=quiet(),u=s.units[0],o=s.objectives[0];
  assert.equal(act(s,u.id,'extract'),false);assert.equal(act(s,u.id,'objective',o.x,o.y),false);
  u.x=o.x-1;u.y=o.y;assert.ok(act(s,u.id,'objective',o.x,o.y));assert.equal(s.objectives[0].done,true);assert.equal(u.actions.interact,false);
  s.objectives.forEach(o=>o.done=true);u.x=1;u.y=1;u.actions.interact=true;
  assert.ok(act(s,u.id,'extract'));assert.equal(u.extracted,true);assert.equal(active(u),false);assert.equal(act(s,u.id,'move',2,1),false);
});
test('revival grants no extra turn and cannot recover vaporized recruits',()=>{
  const s=quiet(),u=s.units[0],f=s.units[1];f.x=u.x+1;f.y=u.y;f.hp=0;
  assert.ok(act(s,u.id,'revive',f.x,f.y));assert.equal(f.hp,Math.ceil(f.maxHp*.3));assert.deepEqual(f.actions,{move:false,act:false,interact:false});
  endTurn(s,fixed);assert.equal(f.actions.move,true);f.hp=0;f.vaporized=true;
  assert.equal(act(s,u.id,'revive',f.x,f.y),false);
});
test('centurion retains a once-per-mission full revive distinct from normal revival',()=>{
  const s=quiet(),u=s.units[0],f=s.units[1];f.x=u.x+1;f.y=u.y;f.hp=0;
  assert.ok(act(s,u.id,'fullRevive',f.x,f.y));assert.equal(f.hp,f.maxHp);assert.equal(f.actions.move,false);
  endTurn(s,fixed);f.hp=0;assert.equal(act(s,u.id,'fullRevive',f.x,f.y),false);assert.ok(act(s,u.id,'revive',f.x,f.y));
});
test('dodge still consumes ammunition and Act; no ammo means sidearm is needed',()=>{
  const s=createTrial('salvage',presetLoadout(),1,{elevation:false}),u=s.units[0],e=s.enemies[0];u.x=e.x-1;u.y=e.y;
  const ammo=u.ammo;assert.ok(act(s,u.id,'attack',e.x,e.y,()=>0));assert.equal(u.ammo,ammo-1);assert.equal(u.actions.act,false);assert.equal(e.hp,e.maxHp);
  u.actions.act=true;u.ammo=0;assert.equal(act(s,u.id,'attack',e.x,e.y),false);assert.ok(act(s,u.id,'sidearm',e.x,e.y,fixed));
});
test('armor, musk, and Defend reduce damage without healing the target',()=>{
  const s=createTrial(),u=s.units[0],e=s.enemies[0];u.x=e.x-1;u.y=e.y;e.defending=true;e.armorValue=10;const before=e.hp;
  act(s,u.id,'attack',e.x,e.y,fixed);assert.equal(e.hp,before);
});
test('musk reduces actual weapon damage; arc chains only to one adjacent enemy',()=>{
  const s=createTrial(),u=s.units[0],e=s.enemies[0],p=s.units.find(u=>u.id==='murr');u.x=e.x-1;u.y=e.y;p.x=u.x-1;p.y=u.y;
  act(s,u.id,'attack',e.x,e.y,fixed);const normal=e.maxHp-e.hp;e.hp=e.maxHp;u.actions.act=true;
  act(s,p.id,'musk');act(s,u.id,'attack',e.x,e.y,fixed);assert.equal(e.maxHp-e.hp,normal-1);
  const a=createTrial('salvage',presetLoadout('heavy')),k=a.units.find(u=>u.id==='krag'),first=a.enemies[0],second=a.enemies[1];
  k.x=5;k.y=2;first.x=7;first.y=2;second.x=7;second.y=1;const before=second.hp;
  assert.ok(act(a,k.id,'attack',first.x,first.y,fixed));assert.equal(second.hp,before-2);
});
test('enforcement arrives exactly at zero and gives two player turns, with unavoidable marked beams',()=>{
  const s=quiet();s.remaining=1;endTurn(s,fixed);
  assert.equal(s.remaining,0);assert.equal(s.grace,2);assert.equal(s.police.length,2);const victim=s.marked;assert.ok(victim);
  endTurn(s,()=>0);assert.equal(s.grace,1);assert.equal(s.units.find(u=>u.id===victim).vaporized,true);
  endTurn(s,()=>0);assert.equal(s.grace,0);assert.equal(s.status,'defeat');assert.ok(s.units.every(u=>u.vaporized));assert.equal(endTurn(s),false);
});
test('extracting a marked recruit avoids their beam and permits a last-turn success',()=>{
  const s=quiet();s.remaining=1;s.objectives.forEach(o=>o.done=true);endTurn(s,fixed);
  const u=s.units.find(u=>u.id===s.marked);u.x=1;u.y=1;assert.ok(act(s,u.id,'extract'));assert.equal(s.marked,null);
  endTurn(s,fixed);assert.equal(u.vaporized,false);endTurn(s,fixed);assert.equal(s.status,'success');assert.equal(s.units.filter(active).length,0);
});
test('same seed and actions replay exactly; terminal states reject actions',()=>{
  const a=createTrial(),b=createTrial();for(let i=0;i<3;i++){endTurn(a);endTurn(b);}assert.deepEqual(a,b);
  a.status='defeat';assert.equal(act(a,a.units[0].id,'defend'),false);
});
