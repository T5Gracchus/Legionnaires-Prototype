import {record} from './trials-telemetry.js';
const xy=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const standing=u=>u.hp>0&&!u.extracted&&!u.vaporized;
const log=(s,t)=>{s.log.push(t);if(s.log.length>80)s.log.shift();};
export const structureAt=(s,x,y)=>(s.structures||[]).find(t=>t.x===x&&t.y===y);
export const protectedTarget=s=>s.mission?.protected;
export const availableObjective=(s,o)=>!o.done&&!o.auto&&(o.requires===undefined||s.objectives[o.requires]?.done&&(!o.delay||s.round>=s.objectives[o.requires].completedRound+o.delay));
export const objectivesComplete=s=>s.objectives.every(o=>o.done);
export function initializeGoals(s,level,structures=[]){
  s.structures=structures.map((t,i)=>({id:t.id||`b${i}`,name:t.kind==='generator'?'Crystal engine':'Timber barricade',kind:'barricade',...t,maxHp:t.hp,z:Number(s.heights[t.y][t.x]),destroyed:false}));
  for(const t of s.structures)if(t.replace)s.map[t.y]=s.map[t.y].slice(0,t.x)+'.'+s.map[t.y].slice(t.x+1);
  if(!level.mission)return;
  s.mission={...structuredClone(level.mission),progress:0,contested:false,routeIndex:0,spawned:[],pending:[],failed:false};
  if(s.mission.protected){const p=s.mission.protected;Object.assign(p,{id:'protected',maxHp:p.hp,dodge:0,block:0,z:Number(s.heights[p.y][p.x])});}
}
export function reconcileGoals(s){
  for(const o of s.objectives)if(o.structure)o.done=!!s.structures?.find(t=>t.id===o.structure)?.destroyed;
  if(s.mission?.protected?.hp===0&&s.status==='playing'){
    s.mission.failed=true;s.status='defeat';log(s,`${s.mission.protected.name} destroyed. The mission cannot be completed.`);record(s,'goal',{outcome:'protected-destroyed'});
  }
}
export function damageStructure(s,t,damage,actor){
  const before=t.hp;t.hp=Math.max(0,t.hp-damage);t.destroyed=t.hp===0;
  s.metrics.terrainDamage=(s.metrics.terrainDamage||0)+before-t.hp;
  if(t.destroyed)s.metrics.structuresDestroyed=(s.metrics.structuresDestroyed||0)+1;
  log(s,`${actor.name} → ${t.name}: ${before-t.hp} damage${t.destroyed?' · destroyed; movement and sightline opened':` · ${t.hp} HP left`}.`);
  record(s,'terrain',{actor:actor.id,target:t.id,x:t.x,y:t.y,damage:before-t.hp,hpBefore:before,hpAfter:t.hp,destroyed:t.destroyed});reconcileGoals(s);
}
// Objective progress advances only after the enemy phase, never on movement/UI renders.
export function advanceGoals(s,{occupied,ground}){
  const m=s.mission;if(!m||s.status!=='playing')return;
  const alive=s.units.filter(standing),near=(a,b)=>xy(a,b)<=1&&Math.abs(Number(s.heights[a.y][a.x])-Number(s.heights[b.y][b.x]))<=1;
  const contested=o=>s.enemies.some(e=>e.hp>0&&near(e,o));
  if(m.type==='hold'&&s.objectives[0].done&&!s.objectives[1].done){
    const o=s.objectives[0];m.contested=contested(o);m.occupied=alive.some(u=>near(u,o));
    if(m.occupied&&!m.contested)m.progress++;
    if(m.progress>=m.required)s.objectives[1].done=true;
    log(s,`Summit hold ${m.progress}/${m.required}${m.contested?' · contested; progress paused':!m.occupied?' · no standing holder':''}.`);
  }
  if(m.type==='defense'&&s.objectives[0].done){
    m.progress=Math.min(m.required,m.progress+1);
    const cleared=m.spawned.length===s.reinforcements.length&&!m.pending.length&&s.enemies.every(e=>e.hp===0);
    if(m.progress>=m.required&&cleared)s.objectives[1].done=true;
  }
  if(m.type==='linked'&&!objectivesComplete(s)){
    const [a,b]=s.objectives;m.contested=contested(a)||contested(b);
    const north=alive.filter(u=>near(u,a)),south=alive.filter(u=>near(u,b));
    m.occupied=north.length>0&&south.some(u=>north.some(v=>u.id!==v.id));
    if(m.occupied&&!m.contested)m.progress++;
    if(m.progress>=m.required){s.objectives.forEach(o=>o.done=true);log(s,'Both sluices held together. The waterworks are secured.');}
  }
  if(m.type==='escort'&&s.objectives[0].done&&!s.objectives[1].done){
    const p=m.protected,guide=alive.find(u=>near(u,p));m.occupied=!!guide;
    if(guide){
      for(let i=0;i<2;i++){
        const next=m.route[m.routeIndex];if(!next)break;
        const [x,y]=next;if(!ground(s,x,y)||occupied(s,x,y))break;
        p.x=x;p.y=y;p.z=Number(s.heights[y][x]);m.routeIndex++;
      }
      log(s,`Lantern cart: ${m.routeIndex}/${m.route.length} route squares.`);
    }
    if(m.routeIndex===m.route.length){s.objectives[1].done=true;log(s,'The cart reaches the ferry. Extract the squad.');}
  }
  reconcileGoals(s);record(s,'goal',{mission:m.type,progress:m.progress,routeIndex:m.routeIndex,contested:m.contested,complete:objectivesComplete(s)});
}
export function goalLines(s){
  const m=s.mission,lines=s.objectives.map(o=>`${o.done?'✓':o.requires!==undefined&&!s.objectives[o.requires]?.done?'LOCKED':'○'} ${o.name}`);
  if(m?.type==='hold')lines.push(`Hold: ${m.progress}/${m.required} phases${m.contested?' · CONTESTED':m.occupied?' · occupied':''}`);
  if(m?.type==='defense')lines.push(`Defense: ${m.progress}/${m.required} phases · waves: ${new Set(m.spawned.map(i=>s.reinforcements[i].round)).size}/3 · ${s.enemies.filter(e=>e.hp>0).length} enemies remain`);
  for(const o of s.objectives)if(o.delay&&s.objectives[o.requires]?.done&&!o.done&&s.round<s.objectives[o.requires].completedRound+o.delay)lines.push(`${o.name}: seal opens in round ${s.objectives[o.requires].completedRound+o.delay}.`);
  if(m?.type==='linked')lines.push(`Linked charge: ${m.progress}/${m.required} phases · different standing holders needed at both controls${m.contested?' · CONTESTED':''}.`);
  if(m?.type==='escort')lines.push(`Cart route: ${m.routeIndex}/${m.route.length}${m.occupied?' · guided':' · needs adjacent guide'}`);
  if(m?.protected)lines.push(`${m.protected.name}: ${m.protected.hp}/${m.protected.maxHp} HP`);
  const waves=s.reinforcements?.filter((r,i)=>!m?.spawned.includes(i))||[];
  if(waves.length)lines.push(`Incoming: ${[...new Set(waves.map(r=>r.round))].map(r=>`round ${r} (${waves.filter(w=>w.round===r).length})`).join(', ')}`);
  if(m?.pending.length)lines.push(`${m.pending.length} arrivals waiting for an open entry tile.`);
  return lines;
}
