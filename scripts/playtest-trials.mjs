import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createTrial,act,endTurn,active,spatialDistance,reachable,canTarget,tileAt,unitAt,enemyAt,moveAllowance} from '../src/trials-engine.js';
import {LEVELS,PRESETS,presetLoadout,WEAPONS} from '../src/trials-data.js';
import {availableObjective,protectedTarget} from '../src/trials-goals.js';

function pathTo(s,u,goal){
  if(goal(u))return [];
  return [...reachable(s,u,96).values()].filter(goal).sort((a,b)=>a.cost-b.cost)[0]?.path||null;
}
export function simulateTrial(level,preset,seed,style='balanced',tuning={}){
  const s=createTrial(level,presetLoadout(preset),seed,{telemetry:false,...tuning.options}),trace=[],transcript=[];
  const distance=(a,b)=>spatialDistance(s,a,b);
  if(tuning.turns){s.remaining+=tuning.turns;s.budget.turns+=tuning.turns;}
  const tuned=new Set();const tune=()=>{for(const e of s.enemies)if(!tuned.has(e.id)){e.hp+=tuning.hp||0;e.maxHp=e.hp;tuned.add(e.id);}};tune();
  const perform=(u,key,p=u)=>{const action={actor:u.id,key,x:p.x,y:p.y};const ok=act(s,u.id,key,p.x,p.y);if(ok)transcript.push(action);return ok;};
  function attack(u){
    if(style==='novice'&&s.round%3===0)return;
    const options=['attack','sidearm'].flatMap(key=>s.enemies.filter(e=>canTarget(s,u,key,e.x,e.y)).map(e=>({key,e,score:e.hp+(key==='sidearm'?1:0)}))).sort((a,b)=>a.score-b.score);
    if(options[0])perform(u,options[0].key,options[0].e);
  }
  function walk(u,goal,allowLeap=true){
    if(!active(u))return;
    let path=pathTo(s,u,goal);
    if(allowLeap&&u.id==='bound'&&u.actions.interact&&path?.length>moveAllowance(s,u)){
      let best=null;
      for(let y=0;y<8;y++)for(let x=0;x<12;x++)if(canTarget(s,u,'leap',x,y)){
        const tail=pathTo(s,{...u,x,y},goal);
        if(tail&&tail.length<path.length-2&&(!best||tail.length<best.cost)){best={x,y,cost:tail.length};}
      }
      if(best){perform(u,'leap',best);path=pathTo(s,u,goal);}
    }
    if(!u.actions.move||!path?.length)return;
    // A glider may pass over blocked cells but its endpoint must be valid ground.
    for(let i=Math.min(moveAllowance(s,u),path.length)-1;i>=0;i--)if(canTarget(s,u,'move',path[i].x,path[i].y)){perform(u,'move',path[i]);return;}
  }
  function engage(u){
    const enemies=s.enemies.filter(e=>e.hp>0);if(!enemies.length)return;
    const goal=p=>enemies.some(e=>canTarget(s,{...u,x:p.x,y:p.y},'attack',e.x,e.y)||canTarget(s,{...u,x:p.x,y:p.y},'sidearm',e.x,e.y));
    if(pathTo(s,u,goal)!==null){walk(u,goal,true);attack(u);return;}
    // A blocked causeway calls for a real weapon/action/ammo expenditure.
    const barriers=(s.structures||[]).filter(t=>t.hp>0).map(t=>({t,path:pathTo(s,u,p=>canTarget(s,{...u,x:p.x,y:p.y},'attack',t.x,t.y)||canTarget(s,{...u,x:p.x,y:p.y},'sidearm',t.x,t.y))})).filter(v=>v.path!==null).sort((a,b)=>a.path.length-b.path.length);
    const t=barriers[0]?.t;if(t){walk(u,p=>canTarget(s,{...u,x:p.x,y:p.y},'attack',t.x,t.y)||canTarget(s,{...u,x:p.x,y:p.y},'sidearm',t.x,t.y));for(const key of ['attack','sidearm'])if(canTarget(s,u,key,t.x,t.y))perform(u,key,t);}
  }
  function missionOrder(u,claims){
    const m=s.mission;if(!m)return false;
    const near=(p,o)=>Math.abs(p.x-o.x)+Math.abs(p.y-o.y)<=1&&Math.abs(Number(s.heights[p.y][p.x])-Number(s.heights[o.y][o.x]))<=1;
    if(s.objectives.every(o=>o.done)){walk(u,p=>tileAt(s,p.x,p.y)==='X');perform(u,'extract');return true;}
    if(m.type==='demolition'){
      const targets=s.structures.filter(t=>t.kind==='generator'&&t.hp>0).map(o=>({o,path:pathTo(s,u,p=>canTarget(s,{...u,x:p.x,y:p.y},'attack',o.x,o.y)||canTarget(s,{...u,x:p.x,y:p.y},'sidearm',o.x,o.y))})).filter(v=>v.path!==null).sort((a,b)=>a.path.length-b.path.length);
      const goal=targets[0]?.o;
      if(goal){walk(u,p=>canTarget(s,{...u,x:p.x,y:p.y},'attack',goal.x,goal.y)||canTarget(s,{...u,x:p.x,y:p.y},'sidearm',goal.x,goal.y));for(const key of ['attack','sidearm'])if(canTarget(s,u,key,goal.x,goal.y))perform(u,key,goal);}else engage(u);return true;
    }
    if(m.type==='hold'){
      if(!claims.has('holder')){claims.add('holder');const o=s.objectives[0];walk(u,p=>near(p,o));if(canTarget(s,u,'objective',o.x,o.y))perform(u,'objective',o);}else engage(u);return true;
    }
    if(m.type==='linked'){
      const o=s.objectives.filter(o=>!claims.has(o.id)).map(o=>({o,path:pathTo(s,u,p=>near(p,o))})).filter(v=>v.path!==null).sort((a,b)=>a.path.length-b.path.length)[0]?.o;
      if(o){claims.add(o.id);walk(u,p=>near(p,o));}else engage(u);return true;
    }
    if(m.type==='defense'){
      const o=s.objectives[0];
      if(!o.done&&!claims.has('beacon')){claims.add('beacon');walk(u,p=>distance(p,o)<=1);if(canTarget(s,u,'objective',o.x,o.y))perform(u,'objective',o);}else engage(u);return true;
    }
    if(m.type==='escort'){
      if(!claims.has('guide')){
        claims.add('guide');const p=protectedTarget(s);walk(u,q=>near(q,p)&&!m.route.slice(m.routeIndex,m.routeIndex+2).some(([x,y])=>q.x===x&&q.y===y));
        const o=s.objectives[0];if(canTarget(s,u,'objective',o.x,o.y))perform(u,'objective',o);
      }else engage(u);return true;
    }
    // Ordered raid uses the regular interaction solver, filtering locked stages.
    return false;
  }
  for(let t=0;t<30&&s.status==='playing';t++){
    const claims=new Set();
    // Scouts receive objective priority; combat specialists clear the approaches.
    const priority=['bound','aer','sword','murr','centurion','shield','krag'];
    const units=[...s.units].sort((a,b)=>priority.indexOf(a.id)-priority.indexOf(b.id));
    for(const u of units){
      if(!active(u))continue;
      let rescuing=false;
      if(style!=='novice'){
        const fallen=s.units.filter(f=>f.hp===0&&!f.vaporized&&!f.extracted).sort((a,b)=>distance(u,a)-distance(u,b))[0];
        if(fallen&&s.grace===null){walk(u,p=>distance(p,fallen)===1,false);perform(u,u.id==='centurion'&&!u.fullReviveUsed?'fullRevive':'revive',fallen);rescuing=true;}
        const hurt=s.units.filter(f=>active(f)&&distance(u,f)<=1&&f.hp<=f.maxHp-4).sort((a,b)=>a.hp-b.hp)[0];
        if(u.id==='centurion'&&hurt)perform(u,'rally',hurt);
        if(u.id==='murr'&&s.enemies.some(e=>e.hp>0&&distance(u,e)<=2))perform(u,'musk');
      }
      attack(u);
      const handled=!rescuing&&missionOrder(u,claims);
      const missing=s.objectives.filter(o=>availableObjective(s,o)&&!claims.has(o.id));
      const goal=missing.map(o=>({o,path:pathTo(s,u,p=>distance(p,o)<=1)})).filter(v=>v.path!==null).sort((a,b)=>a.path.length-b.path.length)[0]?.o;
      if(rescuing||handled){ /* A rescue or mission-specific order already moved this recruit. */
      }else if(goal){
        claims.add(goal.id);
        if(canTarget(s,u,'objective',goal.x,goal.y))perform(u,'objective',goal);
        else{walk(u,p=>distance(p,goal)<=1);if(canTarget(s,u,'objective',goal.x,goal.y))perform(u,'objective',goal);}
      }else if(s.objectives.every(o=>o.done)){
        walk(u,p=>tileAt(s,p.x,p.y)==='X');perform(u,'extract');
      }else{
        const enemies=s.enemies.filter(e=>e.hp>0);
        if(enemies.length)walk(u,p=>enemies.some(e=>distance(p,e)<=WEAPONS[u.weapon].range&&canTarget({...s,units:s.units.map(v=>v===u?{...u,x:p.x,y:p.y}:v)},{...u,x:p.x,y:p.y},'attack',e.x,e.y)),false);
      }
      attack(u);
      if(s.objectives.every(o=>o.done)&&!rescuing){
        walk(u,p=>tileAt(s,p.x,p.y)==='X');perform(u,'extract');
      }
      if(style!=='novice'&&active(u))perform(u,'defend');
    }
    trace.push({round:s.round,remaining:s.remaining,grace:s.grace,objectives:s.objectives.filter(o=>o.done).length,extracted:s.units.filter(u=>u.extracted).length,hp:s.units.map(u=>u.hp)});
    if(s.status==='playing'){endTurn(s);transcript.push({key:'endTurn'});tune();}
  }
  return {level,preset,seed,style,status:s.status,rounds:s.round,extracted:s.units.filter(u=>u.extracted).length,objectives:s.objectives.filter(o=>o.done).length,deadline:s.budget.turns,metrics:s.metrics,positions:s.units.map(u=>({id:u.id,x:u.x,y:u.y,hp:u.hp,extracted:u.extracted,vaporized:u.vaporized})),trace,transcript};
}
export function summarize(runs){
  const win=runs.filter(r=>r.status==='success'),full=win.filter(r=>r.extracted===4),mean=(rows,fn)=>rows.length?+(rows.reduce((n,r)=>n+fn(r),0)/rows.length).toFixed(2):null;
  const times=win.map(r=>(90+r.metrics.actions*6+r.rounds*8)/60).sort((a,b)=>a-b);
  return {runs:runs.length,success:win.length,fullExtraction:full.length,meanRounds:mean(win,r=>r.rounds),meanActions:mean(win,r=>r.metrics.actions),meanKnockdowns:mean(runs,r=>r.metrics.knockdowns),meanDamage:mean(runs,r=>r.metrics.damageTaken),enforcementLosses:runs.reduce((n,r)=>n+r.metrics.enforcementDeaths,0),estimatedMedianMinutes:times[Math.floor(times.length*.5)]??null,estimatedP90Minutes:times[Math.floor(times.length*.9)]??null};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const count=Number(process.argv[2]||100),startSeed=Number(process.argv[3]||1),profile=process.argv[4]||'live';
  const tuning=profile==='gentle'?{hp:-1,turns:1}:profile==='pressure'?{hp:1,turns:-1}:{};
  const result={date:'2026-10-22',profile,count,startSeed,timingAssumption:'90 sec orientation + 6 sec per successful action + 8 sec per round; not human-timed',results:[]};
  for(const level of Object.keys(LEVELS))for(const preset of Object.keys(PRESETS))for(const style of ['balanced','novice']){
    const runs=Array.from({length:count},(_,i)=>simulateTrial(level,preset,startSeed+i,style,tuning));
    const summary={level,preset,style,...summarize(runs)};console.log(JSON.stringify(summary));
    result.results.push({summary,runs:runs.map((r,i)=>i<2?r:(({trace,transcript,...rest})=>rest)(r))});
  }
  await mkdir(new URL('../docs/reports/simulations/',import.meta.url),{recursive:true});
await writeFile(new URL(`../docs/reports/simulations/offworld-playtests-${profile}-${startSeed}.json`,import.meta.url),JSON.stringify(result));
}
