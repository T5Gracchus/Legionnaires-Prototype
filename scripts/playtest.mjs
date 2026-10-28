import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createMission, act, endTurn, withdraw, canTarget, distance, passable, unitAt, enemyAt, terrain } from '../src/mission.js';

// Seeded, rules-driven playtests. No teleporting, free actions, or forced combat outcomes.
const profiles = {
  baseline: { hp: [12,10,9,8,8,8], dodge: [.1,.1,.2,.1,.1,.1], block: [.25,.3,.15,.15,.15,.15], enemyHp: 5, enemyDodge: .1, enemyBlock: .15 },
  hp6: { hp: [12,10,9,8,8,8], dodge: [.1,.1,.2,.1,.1,.1], block: [.25,.3,.15,.15,.15,.15], enemyHp: 6, enemyDodge: .1, enemyBlock: .15 },
  hp7: { hp: [12,10,9,8,8,8], dodge: [.1,.1,.2,.1,.1,.1], block: [.25,.3,.15,.15,.15,.15], enemyHp: 7, enemyDodge: .1, enemyBlock: .15 },
  steady: { hp: [12,11,10,9,9,9], dodge: [.1,.05,.15,.05,.05,.05], block: [.2,.3,.1,.15,.15,.15], enemyHp: 7, enemyDodge: .05, enemyBlock: .1 },
  balanced: { hp: [12,10,9,8,8,8], dodge: [.1,.05,.15,.05,.05,.05], block: [.2,.25,.1,.15,.15,.15], enemyHp: 7, enemyDodge: .05, enemyBlock: .1 },
  pressure: { hp: [11,10,9,8,8,8], dodge: [.1,.05,.15,.05,.05,.05], block: [.2,.25,.1,.1,.1,.1], enemyHp: 8, enemyDodge: .05, enemyBlock: .1 },
};
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t ^= t + Math.imul(t ^ t >>> 7, 61 | t); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function route(s, u, goal) {
  const queue = [{x:u.x,y:u.y,path:[]}], seen = new Set([`${u.x},${u.y}`]);
  for (const p of queue) {
    if (goal(p)) return p.path;
    for (const [x,y] of [[p.x+1,p.y],[p.x-1,p.y],[p.x,p.y+1],[p.x,p.y-1]]) {
      const key = `${x},${y}`;
      if (seen.has(key) || !passable(x,y) || unitAt(s,x,y) || enemyAt(s,x,y)) continue;
      seen.add(key); queue.push({x,y,path:[...p.path,{x,y}]});
    }
  }
  return null;
}
function run(profile, style, seed) {
  const s = createMission(), random = rng(seed); let actions = 0, falls = 0, received = 0;
  const trace = [];
  s.units.forEach((u,i) => Object.assign(u,{hp:profile.hp[i],maxHp:profile.hp[i],dodge:profile.dodge[i],block:profile.block[i]}));
  const tuneEnemies = () => s.enemies.filter(e => !e.tuned).forEach(e => Object.assign(e,{hp:profile.enemyHp,maxHp:profile.enemyHp,dodge:profile.enemyDodge,block:profile.enemyBlock,tuned:true}));
  tuneEnemies();
  const doAct = (u,a,p=u) => { const ok = act(s,u.id,a,p.x,p.y,random); if(ok) actions++; return ok; };
  const move = (u,goal) => { if(!u.actions.move) return; const path = route(s,u,goal); const p = path?.slice(0,u.carrying?2:u.move).at(-1); if(p) doAct(u,'move',p); };
  const attack = u => {
    if(style === 'careless' && s.round % 3 === 0) return; // Misses some attack opportunities; never defends.
    for (const a of ['sword','javelin']) {
      const target = s.enemies.filter(e => canTarget(s,u,a,e.x,e.y)).sort((a,b)=>a.hp-b.hp)[0];
      if(target) { doAct(u,a,target); return; }
    }
  };
  for (let turn=0;turn<35 && s.status==='playing';turn++) {
    const claims = new Set();
    // Front soldiers clear paths first; carriers get priority once returning.
    const order = [...s.units].sort((a,b)=>Number(!!b.carrying)-Number(!!a.carrying) || b.x-a.x);
    for (const u of order) {
      if(u.hp<=0) continue;
      const fallen = s.units.filter(v=>v.hp===0).sort((a,b)=>distance(u,a)-distance(u,b))[0];
      if(fallen && !u.carrying) {
        move(u,p=>distance(p,fallen)===1);
        doAct(u,u.id==='centurion' && !s.fullReviveUsed?'fullRevive':'revive',fallen);
      }
      attack(u);
      const livingEnemies = s.enemies.filter(e=>e.hp>0);
      const rescueNow = style !== 'cautious' || (livingEnemies.length===0 && s.round>=7);
      if (u.carrying) {
        move(u,p=>terrain(p.x,p.y)==='R');
        if(terrain(u.x,u.y)==='R') doAct(u,'drop');
      } else if (rescueNow && s.rescued<3 && !fallen) {
        const candidates = s.casualties.filter(c=>c.state==='ground' && !claims.has(c.id))
          .map(c=>({c,path:route(s,u,p=>distance(p,c)<=1)})).filter(v=>v.path)
          .sort((a,b)=>a.path.length-b.path.length);
        const chosen = candidates[0]?.c;
        if(chosen) {
          claims.add(chosen.id);
          if(canTarget(s,u,'pickup',chosen.x,chosen.y)) doAct(u,'pickup',chosen);
          move(u,p=>u.carrying?terrain(p.x,p.y)==='R':distance(p,chosen)<=1);
          if(!u.carrying) doAct(u,'pickup',chosen);
          if(u.carrying && terrain(u.x,u.y)==='R') doAct(u,'drop');
        } else if(livingEnemies.length) move(u,p=>livingEnemies.some(e=>distance(p,e)===1));
      } else if(livingEnemies.length && s.rescued<3) {
        move(u,p=>livingEnemies.some(e=>distance(p,e)===1));
      }
      attack(u);
      // Fill the back column first to avoid trapping others outside the rally ground.
      if(!u.carrying && (s.rescued===3 || terrain(u.x,u.y)==='R' || (!livingEnemies.length && !s.casualties.some(c=>c.state==='ground' && !claims.has(c.id))))) {
        const homes = [{x:0,y:2},{x:0,y:3},{x:0,y:4},{x:1,y:2},{x:1,y:3},{x:1,y:4}];
        const home = homes.find(p=>!unitAt(s,p.x,p.y) || unitAt(s,p.x,p.y)===u);
        if(home) move(u,p=>p.x===home.x && p.y===home.y);
      }
      if(style!=='careless' && s.enemies.some(e=>e.hp>0 && distance(u,e)<=5)) doAct(u,'defend');
    }
    if(s.rescued===3 && withdraw(s)) break;
    const before = s.units.map(u=>u.hp);
    endTurn(s,random); tuneEnemies();
    s.units.forEach((u,i)=>{ received+=Math.max(0,before[i]-u.hp); if(before[i]>0 && u.hp===0) falls++; });
    trace.push({round:s.round-1,rescued:s.rescued,hp:s.units.map(u=>u.hp),enemies:s.enemies.filter(e=>e.hp>0).length});
  }
  return {seed,status:s.status,rounds:s.round,rescued:s.rescued,actions,falls,received,hp:s.units.map(u=>u.hp),positions:s.units.map(u=>({id:u.id,x:u.x,y:u.y,carrying:u.carrying})),casualties:s.casualties,trace};
}
const count = Number(process.argv[2] || 100);
assert.ok(Number.isInteger(count) && count > 0, 'Run count must be a positive integer');
// Guard against documenting a selected profile different from the shipped defaults.
const live = createMission(), selected = profiles.steady;
assert.deepEqual(live.units.map(u=>u.maxHp), selected.hp);
assert.deepEqual(live.units.map(u=>u.dodge), selected.dodge);
assert.deepEqual(live.units.map(u=>u.block), selected.block);
for (const e of live.enemies) {
  assert.equal(e.hp, selected.enemyHp); assert.equal(e.dodge, selected.enemyDodge); assert.equal(e.block, selected.enemyBlock);
}
const results = [];
for (const [name,profile] of Object.entries(profiles)) for(const style of ['cautious','rescue','careless']) {
  const runs=Array.from({length:count},(_,i)=>run(profile,style,i+1));
  const won=runs.filter(r=>r.status==='captured');
  const avg=(rows,key)=>+(rows.reduce((n,r)=>n+r[key],0)/(rows.length||1)).toFixed(1);
  const sorted=won.map(r=>r.rounds).sort((a,b)=>a-b);
  const summary={profile:name,style,runs:count,completed:won.length,defeat:runs.filter(r=>r.status==='defeat').length,timeout:runs.filter(r=>r.status==='playing').length,rounds:avg(won,'rounds'),p90Rounds:sorted[Math.floor(sorted.length*.9)]??null,actions:avg(won,'actions'),p90EstimatedMinutes: won.map(r=>(90+r.actions*6+r.rounds*8)/60).sort((a,b)=>a-b)[Math.floor(won.length*.9)],falls:avg(runs,'falls'),damage:avg(runs,'received')};
  console.log(JSON.stringify(summary)); results.push({summary,runs:runs.map((r,i)=>i<3?r:(({trace,...rest})=>rest)(r))});
}
await mkdir(new URL('../docs/reports/simulations/',import.meta.url),{recursive:true});
await writeFile(new URL('../docs/reports/simulations/playtest-results.json',import.meta.url),JSON.stringify({profiles,results}));
