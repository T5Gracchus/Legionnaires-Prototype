import { LEVELS,RECRUITS,WEAPONS,ARMORS,ENEMIES,detectionBudget,presetLoadout } from './trials-data.js';
import {record,snapshot,BUILD} from './trials-telemetry.js';
import {ORIGINAL_STRUCTURES} from './trials-missions.js';
import {structureAt,protectedTarget,availableObjective,objectivesComplete,initializeGoals,reconcileGoals,damageStructure,advanceGoals} from './trials-goals.js';
export const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const fresh=()=>({move:true,act:true,interact:true});
export const tileAt=(s,x,y)=>s.map[y]?.[x];
export const heightAt=(s,x,y)=>Number(s.heights?.[y]?.[x]||0);
export const spatialDistance=(s,a,b)=>distance(a,b)+Math.abs(heightAt(s,a.x,a.y)-heightAt(s,b.x,b.y));
export const ground=(s,x,y)=>['.','X'].includes(tileAt(s,x,y))&&!s.structures?.some(t=>t.x===x&&t.y===y&&t.hp>0);
export const active=u=>u.hp>0&&!u.extracted&&!u.vaporized;
export const unitAt=(s,x,y)=>s.units.find(u=>!u.extracted&&!u.vaporized&&u.x===x&&u.y===y);
export const enemyAt=(s,x,y)=>s.enemies.find(e=>e.hp>0&&e.x===x&&e.y===y);
const occupied=(s,x,y)=>unitAt(s,x,y)||enemyAt(s,x,y)||(protectedTarget(s)?.x===x&&protectedTarget(s)?.y===y);
const position=(s,u)=>({x:u.x,y:u.y,z:heightAt(s,u.x,u.y)});
export const slowed=(s,u)=>u.debuffUntil>=s.round;
export const moveAllowance=(s,u)=>Math.max(1,u.move-(slowed(s,u)?1:0));
export function roll(s){s.seed|=0;s.seed=s.seed+0x6D2B79F5|0;let t=Math.imul(s.seed^s.seed>>>15,1|s.seed);t^=t+Math.imul(t^t>>>7,61|t);const value=((t^t>>>14)>>>0)/4294967296;record(s,'roll',{value,rngState:s.seed});return value;}
const log=(s,text)=>{s.log.push(text);if(s.log.length>80)s.log.shift();};
const zSync=(s,u)=>{u.z=heightAt(s,u.x,u.y);};
const newEnemy=(s,type,x,y,id)=>({...ENEMIES[type],type,id,token:`E${id.slice(1)}`,maxHp:ENEMIES[type].hp,x,y,z:heightAt(s,x,y),home:{x,y},vertical:3,climb:1,safeDrop:1,cooldown:0,charges:ENEMIES[type].charges||0});
export function createTrial(levelId='salvage',loadout=presetLoadout(),seed=1,options={}){
  if(!LEVELS[levelId])throw new Error('Unknown trial');
  if(loadout.length!==4||new Set(loadout.map(u=>u.id)).size!==4)throw new Error('Choose four different recruits');
  for(const u of loadout)if(!RECRUITS[u.id]||!WEAPONS[u.weapon]||!ARMORS[u.armor])throw new Error('Invalid loadout');
  const level=LEVELS[levelId],budget=detectionBudget(levelId,loadout);
  const settings={elevation:options.elevation!==false,enemyAI:options.enemyAI||'tactical',support:options.support!==false,telemetry:options.telemetry!==false};
  const s={build:BUILD,options:settings,levelId,map:[...level.map],heights:settings.elevation?[...level.heights]:level.map.map(r=>'0'.repeat(r.length)),round:1,status:'playing',seed,initialSeed:seed,loadout:structuredClone(loadout),budget,remaining:budget.turns,grace:null,police:[],marked:null,clouds:[],log:[],objectives:level.objectives.map((o,i)=>({...o,id:`o${i}`,z:heightAt({heights:settings.elevation?level.heights:[]},o.x,o.y),done:false})),enemies:[],units:[],metrics:{actions:0,attacks:0,damageTaken:0,knockdowns:0,abilities:0,kills:0,revives:0,enforcementDeaths:0,enemyAttacks:0,enemyHeals:0,enemyDebuffs:0,enemyCommands:0,fallDamage:0}};
  s.units=loadout.map((l,i)=>{const r=RECRUITS[l.id],a=ARMORS[l.armor],x=level.starts[i][0],y=level.starts[i][1];return {...r,id:l.id,...l,x,y,z:heightAt(s,x,y),maxHp:r.hp+a.hp,hp:r.hp+a.hp,move:Math.max(2,r.move+a.move),dodge:r.dodge+a.dodge,ammo:WEAPONS[l.weapon].ammo,actions:fresh(),extracted:false,vaporized:false,defending:false,rallyUsed:false};});
  s.enemies=level.enemies.map(([type,x,y],i)=>newEnemy(s,settings.support?type:({healer:'sling',hexer:'sling',commander:'spear'}[type]||type),x,y,`e${i+1}`));
  initializeGoals(s,level,level.structures||ORIGINAL_STRUCTURES[levelId]||[]);
  s.reinforcements=structuredClone(level.reinforcements);
  if(!s.mission)s.arrivals={spawned:[],pending:[]};
  log(s,`${level.name}: ${s.remaining} safe turns, then two turns under enforcement. Complete the mission goals and extract each recruit from X tiles.`);
  refreshIntents(s);
  if(settings.telemetry){s.telemetry={initialState:snapshot(s),events:[]};}
  return s;
}
// Movement keeps multiple nondominated routes: a safer detour must not disappear
// behind a shorter route with a lethal drop or an exhausted vertical allowance.
export function reachable(s,u,limit=moveAllowance(s,u)){
  const verticalBudget=limit>moveAllowance(s,u)?96:(u.vertical??3);
  const result=new Map(),queue=[{x:u.x,y:u.y,z:heightAt(s,u.x,u.y),cost:0,vertical:0,fall:0,path:[]}],labels=new Map();
  labels.set(`${u.x},${u.y}`,[queue[0]]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];if(p.cost>=limit)continue;
    for(const [x,y] of [[p.x+1,p.y],[p.x-1,p.y],[p.x,p.y+1],[p.x,p.y-1]]){
      if(tileAt(s,x,y)===undefined)continue;
      const key=`${x},${y}`,canLand=ground(s,x,y)&&!occupied(s,x,y);
      if(u.id!=='aer'&&!canLand)continue;
      const z=heightAt(s,x,y),dz=z-p.z,vertical=u.id==='aer'?Math.abs(z-heightAt(s,u.x,u.y)):p.vertical+Math.abs(dz);
      if(u.id!=='aer'&&dz>(u.climb??1)||vertical>verticalBudget)continue;
      const fall=p.fall+(u.id==='aer'?0:Math.max(0,-dz-(u.safeDrop??1))*3);
      if(fall>=u.hp)continue; // Fatal routes are deliberately unavailable; preview never promises survival.
      const next={x,y,z,cost:p.cost+1,vertical,fall,path:[...p.path,{x,y,z}]};
      const prior=labels.get(key)||[];
      if(prior.some(a=>a.cost<=next.cost&&a.vertical<=vertical&&a.fall<=fall))continue;
      labels.set(key,[...prior.filter(a=>!(next.cost<=a.cost&&vertical<=a.vertical&&fall<=a.fall)),next]);
      queue.push(next);
      const old=result.get(key);
      if(canLand&&(!old||fall<old.fall||fall===old.fall&&next.cost<old.cost))result.set(key,next);
    }
  }
  result.delete(`${u.x},${u.y}`);return result;
}
export function lineClear(s,a,b){
  let x=a.x,y=a.y,dx=Math.abs(b.x-x),dy=Math.abs(b.y-y),sx=x<b.x?1:-1,sy=y<b.y?1:-1,err=dx-dy;
  const total=Math.max(dx,dy),az=heightAt(s,a.x,a.y)+1,bz=heightAt(s,b.x,b.y)+1;let step=0;
  while(x!==b.x||y!==b.y){const e=2*err;if(e>-dy){err-=dy;x+=sx;}if(e<dx){err+=dx;y+=sy;}step++;
    if(x===b.x&&y===b.y)break;
    const ray=az+(bz-az)*(step/total),top=heightAt(s,x,y)+(['T','W'].includes(tileAt(s,x,y))||structureAt(s,x,y)?.hp>0?2:0);
    if(top>=ray)return false;
  }return true;
}
export const coverAt=(s,target)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>['T','W'].includes(tileAt(s,target.x+dx,target.y+dy))||structureAt(s,target.x+dx,target.y+dy)?.hp>0);
export function musked(s,u){return u.id!=='murr'&&!ARMORS[u.armor]?.filter&&s.clouds.some(c=>spatialDistance(s,c,u)<=2);}
export function weaponFor(u,sidearm=false){return sidearm?{name:'Sidearm',damage:[2,3],range:1,pierce:0}:WEAPONS[u.weapon];}
export function movementPreview(s,u,action,x,y){
  if(action==='move')return reachable(s,u).get(`${x},${y}`)||null;
  if(action!=='leap'||u.id!=='bound'||!ground(s,x,y)||occupied(s,x,y)||distance(u,{x,y})>4||distance(u,{x,y})===0)return null;
  const dz=heightAt(s,x,y)-heightAt(s,u.x,u.y),fall=Math.max(0,-dz-u.safeDrop)*3;
  if(dz>u.climb||Math.abs(dz)>u.vertical||fall>=u.hp)return null;
  return {x,y,z:heightAt(s,x,y),cost:0,vertical:Math.abs(dz),fall,path:[position(s,u),{x,y,z:heightAt(s,x,y)}]};
}
export function canTarget(s,u,action,x,y){
  if(s.status!=='playing'||!u||!active(u))return false;
  const p={x,y},d=spatialDistance(s,u,p),friend=unitAt(s,x,y),enemy=enemyAt(s,x,y);
  switch(action){
    case 'move':return u.actions.move&&!!movementPreview(s,u,'move',x,y);
    case 'attack':case 'sidearm':{const w=weaponFor(u,action==='sidearm');return u.actions.act&&(!!enemy||structureAt(s,x,y)?.hp>0)&&(action==='sidearm'||u.ammo===null||u.ammo>0)&&d<=w.range&&lineClear(s,u,p);}
    case 'objective':return u.actions.interact&&d<=1&&s.objectives.some(o=>availableObjective(s,o)&&o.x===x&&o.y===y);
    case 'revive':case 'fullRevive':return u.actions.interact&&d===1&&friend?.hp===0&&!friend.vaporized&&(action!=='fullRevive'||u.id==='centurion'&&!u.fullReviveUsed);
    case 'leap':return u.actions.interact&&!!movementPreview(s,u,'leap',x,y);
    case 'rally':return u.id==='centurion'&&u.actions.interact&&!u.rallyUsed&&d<=1&&!!friend&&friend.hp>0&&friend.hp<friend.maxHp;
    default:return false;
  }
}
function hit(s,attacker,target,w,random){
  const ranged=spatialDistance(s,attacker,target)>1;
  const dodge=Math.max(0,target.dodge-(musked(s,target)?.1:0)-(slowed(s,target)?.1:0));
  const dodgeRoll=random();if(dodgeRoll<dodge){log(s,`${attacker.name} → ${target.name}: dodged.`);record(s,'combat',{attacker:attacker.id,target:target.id,dodgeRoll,dodge,damage:0,outcome:'dodge'});return;}
  const damageRoll=random(),rolled=w.damage[0]+Math.floor(damageRoll*(w.damage[1]-w.damage[0]+1)),blockRoll=random();
  const block=blockRoll<target.block?2:0;
  const armor=Math.max(0,(ARMORS[target.armor]?.armor||0)+(target.innateArmor||target.armorValue||0)-(w.pierce||0));
  const guard=target.defending?(['shield','krag'].includes(target.id)?3:2):0;
  const cover=ranged&&coverAt(s,target)&&heightAt(s,attacker.x,attacker.y)<=heightAt(s,target.x,target.y)?1:0;
  const smell=musked(s,attacker)?1:0,command=attacker.inspired?1:0;
  const damage=Math.max(0,rolled+command-block-armor-guard-smell-cover),before=target.hp;
  target.hp=Math.max(0,target.hp-damage);
  if(s.units.includes(target)){s.metrics.damageTaken+=Math.min(before,damage);if(target.hp===0){s.metrics.knockdowns++;target.actions={move:false,act:false,interact:false};}}
  else if(target.id==='protected')s.metrics.protectedDamage=(s.metrics.protectedDamage||0)+Math.min(before,damage);
  else if(target.hp===0)s.metrics.kills++;
  log(s,`${attacker.name} → ${target.name}: ${damage} damage (${rolled} rolled${command?', command +1':''}${block?', block −2':''}${armor?`, armor −${armor}`:''}${guard?`, Defend −${guard}`:''}${cover?', cover −1':''}${smell?', musk −1':''})${target.hp===0?' · fallen':''}.`);
  record(s,'combat',{attacker:attacker.id,target:target.id,from:position(s,attacker),to:position(s,target),dodgeRoll,dodge,damageRoll,blockRoll,rolled,block,armor,guard,cover,smell,command,damage,actualDamage:Math.min(before,damage),hpBefore:before,hpAfter:target.hp});
}
function checkEnd(s){reconcileGoals(s);if(s.status!=='playing')return;if(s.units.every(u=>!active(u))){s.status=objectivesComplete(s)&&s.units.some(u=>u.extracted)?'success':'defeat';log(s,s.status==='success'?'Objectives complete. Extraction finished.':'No squad member remains able to complete the mission.');}}
function fallDamage(s,u,amount){if(!amount)return;const before=u.hp;u.hp=Math.max(0,u.hp-amount);s.metrics.damageTaken+=Math.min(before,amount);s.metrics.fallDamage+=Math.min(before,amount);if(!u.hp){s.metrics.knockdowns++;u.actions={move:false,act:false,interact:false};}log(s,`${u.name} takes ${amount} fall damage.`);record(s,'fall',{actor:u.id,damage:amount,hpBefore:before,hpAfter:u.hp});}
export function act(s,id,action,x,y,random=()=>roll(s)){
  const u=s.units.find(u=>u.id===id);if(s.status!=='playing'||!u||!active(u))return false;
  const before=position(s,u);let path=null;
  if(action==='defend'){if(!u.actions.act)return false;u.actions.act=false;u.defending=true;log(s,`${u.name} defends.`);}
  else if(action==='musk'){if(u.id!=='murr'||!u.actions.interact)return false;u.actions.interact=false;s.clouds=s.clouds.filter(c=>c.owner!==id);s.clouds.push({...position(s,u),until:s.round+1,owner:id});s.metrics.abilities++;log(s,'Porr releases musk: radius 2, two enemy phases. Unfiltered allies are affected too.');}
  else if(action==='extract'){if(!u.actions.interact||tileAt(s,u.x,u.y)!=='X'||!s.objectives.every(o=>o.done))return false;u.actions.interact=false;u.extracted=true;log(s,`${u.name} extracts safely.`);if(s.marked===id)s.marked=null;}
  else{
    if(!canTarget(s,u,action,x,y))return false;
    if(action==='move'||action==='leap'){const preview=movementPreview(s,u,action,x,y);path=preview.path;u.x=x;u.y=y;zSync(s,u);u.actions[action==='move'?'move':'interact']=false;fallDamage(s,u,preview.fall);if(action==='leap')s.metrics.abilities++;log(s,`${u.name} ${action==='leap'?'leaps':'moves'} to ${String.fromCharCode(65+x)}${y+1} / Z${u.z}.`);}
    if(action==='attack'||action==='sidearm'){
      const target=enemyAt(s,x,y),structure=structureAt(s,x,y),w=weaponFor(u,action==='sidearm');u.actions.act=false;if(action==='attack'&&u.ammo!==null)u.ammo--;s.metrics.attacks++;
      if(target)hit(s,u,target,w,random);
      else damageStructure(s,structure,w.damage[0]+Math.floor(random()*(w.damage[1]-w.damage[0]+1)),u);
      if(target&&w.chain){const other=s.enemies.find(e=>e!==target&&e.hp>0&&spatialDistance(s,e,target)===1);if(other){const hp=other.hp;other.hp=Math.max(0,other.hp-w.chain);if(other.hp===0)s.metrics.kills++;log(s,`Arc jumps to ${other.token}: ${w.chain} damage.`);record(s,'chain',{attacker:u.id,target:other.id,damage:Math.min(hp,w.chain),hpAfter:other.hp});}}
    }
    if(action==='objective'){const o=s.objectives.find(o=>availableObjective(s,o)&&o.x===x&&o.y===y);o.done=true;if(s.mission)o.completedRound=s.round;u.actions.interact=false;log(s,`${u.name}: ${o.name} ${o.kind==='captive'?'freed and safely guided away':'secured'}.`);}
    if(action==='revive'||action==='fullRevive'){const f=unitAt(s,x,y);f.hp=action==='fullRevive'?f.maxHp:Math.ceil(f.maxHp*.3);if(action==='fullRevive'){u.fullReviveUsed=true;s.metrics.abilities++;}f.actions={move:false,act:false,interact:false};u.actions.interact=false;s.metrics.revives++;log(s,`${u.name} revives ${f.name} to ${f.hp} HP; they act next round.`);}
    if(action==='rally'){const f=unitAt(s,x,y);f.hp=Math.min(f.maxHp,f.hp+4);u.actions.interact=false;u.rallyUsed=true;log(s,`${u.name} rallies ${f.name}: +4 HP.`);s.metrics.abilities++;}
  }
  s.metrics.actions++;checkEnd(s);refreshIntents(s);record(s,'action',{actor:id,action,target:x===undefined?null:{x,y,z:heightAt(s,x,y)},from:before,to:position(s,u),path});return true;
}
const enemyCanHit=(s,e,p,u)=>spatialDistance(s,p,u)<=e.range&&lineClear(s,p,u);
function supportTarget(s,e){
  if(!s.options.support||e.charges<=0||e.cooldown>s.round)return null;
  if(e.role==='healer')return s.enemies.filter(a=>a!==e&&a.hp>0&&a.maxHp-a.hp>=3&&spatialDistance(s,e,a)<=e.supportRange&&lineClear(s,e,a)).sort((a,b)=>(b.maxHp-b.hp)-(a.maxHp-a.hp))[0]||null;
  if(e.role==='hexer')return s.units.filter(u=>active(u)&&!slowed(s,u)&&spatialDistance(s,e,u)<=e.supportRange&&lineClear(s,e,u)).sort((a,b)=>a.hp-b.hp)[0]||null;
  if(e.role==='commander')return s.enemies.find(a=>a!==e&&a.hp>0&&spatialDistance(s,e,a)<=e.supportRange&&s.units.some(u=>active(u)&&spatialDistance(s,a,u)<=a.range+a.move))||null;
  return null;
}
export function refreshIntents(s){
  for(const e of s.enemies.filter(e=>e.hp>0)){
    const support=supportTarget(s,e),target=[...s.units.filter(active),...(protectedTarget(s)?.hp>0?[protectedTarget(s)]:[])].sort((a,b)=>spatialDistance(s,e,a)-spatialDistance(s,e,b)||a.hp-b.hp)[0];
    e.intent=support?`${e.role==='healer'?'Mend':e.role==='hexer'?'Bind':'War chant near'} ${support.name} if still in range`:(target?`${e.range>1?'Seek firing position':'Intercept'}: ${target.name}`:'Hold objective');
  }
}
function supportAction(s,e){
  const t=supportTarget(s,e);if(!t)return false;e.charges--;
  if(e.role==='healer'){const hp=t.hp;t.hp=Math.min(t.maxHp,t.hp+4);e.cooldown=s.round+2;s.metrics.enemyHeals++;log(s,`${e.name} mends ${t.name}: +${t.hp-hp} HP.`);record(s,'support',{actor:e.id,ability:'mend',target:t.id,healed:t.hp-hp});}
  if(e.role==='hexer'){t.debuffUntil=s.round+1;e.cooldown=s.round+2;s.metrics.enemyDebuffs++;log(s,`${e.name} binds ${t.name}: −1 Move, −10% dodge through round ${s.round+1}.`);record(s,'support',{actor:e.id,ability:'binding',target:t.id,until:t.debuffUntil});}
  if(e.role==='commander'){const allies=s.enemies.filter(a=>a!==e&&a.hp>0&&spatialDistance(s,e,a)<=e.supportRange);allies.forEach(a=>a.inspired=true);e.cooldown=s.round+3;s.metrics.enemyCommands++;log(s,`${e.name} chants: ${allies.length} allies gain +1 damage this phase; no extra attacks.`);record(s,'support',{actor:e.id,ability:'command',targets:allies.map(a=>a.id)});}
  return true;
}
function enemyTurn(s,e,random){
  const targets=s.units.filter(active);if(!targets.length)return;
  if(protectedTarget(s)?.hp>0)targets.push(protectedTarget(s));
  const from=position(s,e);let path=[],reason='hold';
  if(s.options.enemyAI==='legacy'){
    if(!targets.some(u=>enemyCanHit(s,e,e,u))){const route=[...reachable(s,e,96).values()].filter(p=>p.fall===0&&targets.some(u=>enemyCanHit(s,e,p,u))).sort((a,b)=>a.cost-b.cost)[0]?.path;const p=route?.slice(0,e.move).at(-1);if(p){path=route.slice(0,e.move);e.x=p.x;e.y=p.y;zSync(s,e);}}
  }else{
    // Support acts before repositioning when a useful legal target is already present.
    if(supportAction(s,e)){record(s,'enemy',{actor:e.id,decision:'support',intent:e.intent,from,to:position(s,e),path});return;}
    const candidates=[{...position(s,e),cost:0,fall:0,path:[]},...[...reachable(s,e).values()].filter(p=>p.fall===0)];
    const score=p=>{
      const near=targets.reduce((a,b)=>spatialDistance(s,p,a)<spatialDistance(s,p,b)?a:b),d=spatialDistance(s,p,near);
      const canShoot=targets.some(u=>enemyCanHit(s,e,p,u));
      const adjacent=targets.filter(u=>spatialDistance(s,p,u)<=1).length;
      const objective=s.objectives.filter(o=>!o.done).reduce((m,o)=>Math.min(m,distance(p,o)),8);
      let value=(canShoot?12:0)-Math.max(0,d-e.range)*2+(coverAt(s,p)?1.5:0)+heightAt(s,p.x,p.y)*.3-p.cost*.12;
      if(e.range>1)value-=adjacent*4+Math.abs(Math.min(d,e.range)-Math.min(3,e.range))*.8;
      if(e.range===1)value-=d*.8;
      if(e.role==='healer')value+=s.enemies.filter(a=>a.hp>0&&a!==e&&a.hp<a.maxHp&&spatialDistance(s,p,a)<=3).length*4-adjacent*3;
      value-=objective*.1;
      return value;
    };
    const best=candidates.sort((a,b)=>score(b)-score(a))[0];
    if(best.cost){path=best.path;e.x=best.x;e.y=best.y;zSync(s,e);reason=e.range>1?'seek safe firing lane':'intercept exposed recruit';}
    if(supportAction(s,e)){record(s,'enemy',{actor:e.id,decision:reason+'; support',intent:e.intent,from,to:position(s,e),path});return;}
  }
  const threat=u=>u.id==='protected'?8:u.hp+(u.defending?4:0);
  const target=targets.filter(u=>active(u)&&enemyCanHit(s,e,e,u)).sort((a,b)=>threat(a)-threat(b))[0];
  if(target){s.metrics.enemyAttacks++;hit(s,e,target,{damage:e.damage},random);reason+='; attack '+target.id;}
  record(s,'enemy',{actor:e.id,decision:reason,intent:e.intent,target:target?.id||null,from,to:position(s,e),path});
}
function markTarget(s){const target=s.units.filter(active).sort((a,b)=>b.x-a.x||a.hp-b.hp)[0];s.marked=target?.id||null;if(target)log(s,`ENFORCEMENT: ${target.name} marked for vaporization at the end of this turn. Extract them to escape the beam.`);}
export function endTurn(s,random=()=>roll(s)){
  if(s.status!=='playing')return false;
  record(s,'phase',{phase:'enemy-start'});
  const enemies=s.enemies.filter(e=>e.hp>0).sort((a,b)=>(a.role==='commander'?-1:0)-(b.role==='commander'?-1:0));
  for(const e of enemies)if(e.hp>0){enemyTurn(s,e,random);if(protectedTarget(s)?.hp===0)break;}
  s.enemies.forEach(e=>e.inspired=false);
  advanceGoals(s,{occupied,ground});
  checkEnd(s);if(s.status!=='playing'){record(s,'end',{reason:'squad incapacitated'});return true;}
  if(s.grace===null){s.remaining=Math.max(0,s.remaining-1);if(s.remaining===0){s.grace=2;s.police=[{x:11,y:0},{x:11,y:7}];const victim=s.enemies.find(e=>e.hp>0);if(victim){victim.hp=0;log(s,`An enforcement beam vaporizes ${victim.name}. Conventional defenses are useless.`);}log(s,'ENFORCEMENT ARRIVES. Two player turns remain to finish objectives and extract. Marked recruits are vaporized at turn end.');markTarget(s);}}
  else{
    const victim=s.units.find(u=>u.id===s.marked&&!u.extracted&&!u.vaporized);if(victim){victim.hp=0;victim.vaporized=true;s.metrics.enforcementDeaths++;log(s,`${victim.name} vaporized by enforcement. They cannot be revived in this trial.`);}
    s.grace--;s.marked=null;checkEnd(s);
    if(s.grace===0&&s.status==='playing'){for(const u of s.units.filter(u=>!u.extracted&&!u.vaporized)){u.vaporized=true;u.hp=0;s.metrics.enforcementDeaths++;}s.status=s.objectives.every(o=>o.done)&&s.units.some(u=>u.extracted)?'success':'defeat';log(s,'Enforcement locks down the site. Everyone still on the ground is lost.');}
    else if(s.status==='playing')markTarget(s);
  }
  s.clouds=s.clouds.filter(c=>c.until>s.round);s.round++;
  if(s.status==='playing'){
    const arrivals=s.mission||s.arrivals;
    if(arrivals){
      s.reinforcements.forEach((r,i)=>{if(r.round<=s.round&&!arrivals.spawned.includes(i)&&!arrivals.pending.includes(i))arrivals.pending.push(i);});
      arrivals.pending=arrivals.pending.filter(i=>{
        const r=s.reinforcements[i];if(occupied(s,r.x,r.y)||!ground(s,r.x,r.y))return true;
        const type=s.options.support?r.type:({healer:'sling',hexer:'sling',commander:'spear'}[r.type]||r.type);s.enemies.push(newEnemy(s,type,r.x,r.y,`e${s.enemies.length+1}`));arrivals.spawned.push(i);
        log(s,`Reinforcement: ${s.enemies.at(-1).name} enters at ${String.fromCharCode(65+r.x)}${r.y+1}.`);record(s,'reinforcement',{enemy:s.enemies.at(-1).id,position:position(s,s.enemies.at(-1))});return false;
      });
    }else{
      // Historical recordings retain their original single-arrival behavior.
      const r=LEVELS[s.levelId].reinforcements.find(r=>r.round===s.round);
      if(r&&!occupied(s,r.x,r.y)){const type=s.options.support?r.type:({healer:'sling',hexer:'sling',commander:'spear'}[r.type]||r.type);s.enemies.push(newEnemy(s,type,r.x,r.y,`e${s.enemies.length+1}`));log(s,'A local reinforcement enters from the east.');record(s,'reinforcement',{enemy:s.enemies.at(-1).id,position:position(s,s.enemies.at(-1))});}
    }
    for(const u of s.units){u.defending=false;if(active(u))u.actions=fresh();}
  }
  refreshIntents(s);record(s,'phase',{phase:s.status==='playing'?'player-start':'mission-ended'});return true;
}
