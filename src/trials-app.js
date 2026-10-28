import {LEVELS,RECRUITS,WEAPONS,ARMORS,PRESETS,presetLoadout,detectionBudget} from './trials-data.js';
import {createTrial,act,endTurn,canTarget,active,tileAt,unitAt,enemyAt,reachable,distance,musked,weaponFor,heightAt,spatialDistance,movementPreview,moveAllowance,slowed} from './trials-engine.js';
import {BUILD,createPlayClock,trialResult} from './trials-telemetry.js';
import {renderBattleScene,highlightScenePath} from './battle-scene.js';
import {structureAt,protectedTarget,goalLines} from './trials-goals.js';
const $=id=>document.getElementById(id),percent=n=>`${Math.round(n*100)}%`,range=w=>`${w.damage.join('–')} damage · range ${w.range}`;
const image=id=>`/assets/sprites/${RECRUITS[id]?.sprite||'enemy'}.png`;
let levelId='salvage',loadout=presetLoadout('mixed'),recruited=new Set(loadout.map(u=>u.id)),state=null,selected=null,order='move',started=0,finished=null;
let savingResult=false,lastSavedPayload=null,clock=null,actionTimes=[],pendingMove=null,relief=true;
let facings=new Map(),lastPresentationEvent=-1,missionSerial=0,visualBusyUntil=0,shownUnits=new Map(),shownEnemies=new Map(),previousGrace=null,busyTimer=null;
const setText=(id,text)=>$(id).textContent=text;
const option=(value,text,current)=>{const o=document.createElement('option');o.value=value;o.textContent=text;o.selected=value===current;return o;};
function setup(){
  $('level-cards').replaceChildren();
  const roman=document.createElement('a');roman.href='/index.html';roman.className='level-card';roman.innerHTML='<small>MISSION 1 / ROMAN TUTORIAL</small><strong>The baggage rescue</strong><span>Teutoburg Forest · original standalone mission</span>';$('level-cards').append(roman);
  for(const [id,l] of Object.entries(LEVELS)){
    const b=document.createElement('button');b.className=`level-card ${id===levelId?'chosen':''}`;b.setAttribute('aria-pressed',id===levelId);
    b.innerHTML=`<small>MISSION ${Object.keys(LEVELS).indexOf(id)+2} / 10</small><strong>${l.name}</strong><span>${l.subtitle}</span>`;b.onclick=()=>{levelId=id;setup();};$('level-cards').append(b);
  }
  $('presets').replaceChildren();
  for(const [id,p] of Object.entries(PRESETS)){const b=document.createElement('button');b.textContent=p.name;b.title=p.note;b.onclick=()=>{loadout=presetLoadout(id);loadout.forEach(u=>recruited.add(u.id));setup();};$('presets').append(b);}
  $('loadout').replaceChildren();
  loadout.forEach((l,i)=>{
    const r=RECRUITS[l.id],w=WEAPONS[l.weapon],a=ARMORS[l.armor],card=document.createElement('article');card.className='panel loadout-card';
    card.innerHTML=`<img src="${image(l.id)}" alt=""><p class="eyebrow">SLOT ${i+1} / ${r.token}</p>`;
    for(const [field,label,values] of [['id','Recruit',RECRUITS],['weapon','Weapon',WEAPONS],['armor','Armor',ARMORS]]){
      const lab=document.createElement('label');lab.textContent=label;lab.htmlFor=`slot-${i}-${field}`;
      const select=document.createElement('select');select.id=lab.htmlFor;
      for(const [id,v] of Object.entries(values)){
        if(field==='id'&&!recruited.has(id))continue;
        const o=option(id,field==='id'?`${v.name} · ${v.species}`:`${v.name} · sig ${v.signature}`,l[field]);
        if(field==='id'&&id!==l.id&&loadout.some(other=>other.id===id))o.disabled=true;select.append(o);
      }
      select.onchange=()=>{l[field]=select.value;if(field==='id'){l.weapon=RECRUITS[l.id].weapon;l.armor=RECRUITS[l.id].armor;}setup();};card.append(lab,select);
    }
    const details=document.createElement('div');details.className='loadout-stats';
    details.innerHTML=`<p><strong>${range(w)}</strong><br>${w.ammo??'Unlimited'} ${w.ammo===null?'ammunition':'shots'} · armor reduction ${a.armor+(r.innateArmor||0)} · HP ${r.hp+a.hp}<br>Ground ${Math.max(2,r.move+a.move)} · Z travel ${r.vertical} · climb ${r.climb} · safe drop ${r.safeDrop}<br>Dodge ${percent(r.dodge+a.dodge)} · Block ${percent(r.block)}</p><p class="ability-description"><strong>${r.ability}</strong><br>${r.description}</p><p>${w.note} ${a.note}</p>`;card.append(details);$('loadout').append(card);
  });
  $('bench').replaceChildren();
  for(const [id,r] of Object.entries(RECRUITS)){
    const b=document.createElement('button');b.className='bench-card';b.innerHTML=`<img src="${image(id)}" alt=""><strong>${r.name}</strong><span>${r.species} · ${r.ability}</span><small>${recruited.has(id)?'IN YOUR TEST ROSTER':'RECRUIT'}</small>`;b.disabled=recruited.has(id);b.title=r.description;b.onclick=()=>{recruited.add(id);setup();};$('bench').append(b);
  }
  const b=detectionBudget(levelId,loadout);
  $('forecast').innerHTML=`<strong>${b.turns} safe turns <span>+ 2 enforcement turns</span></strong><p>Total signature ${b.total} · peak personal signature ${b.peak} · countdown penalty ${b.penalty}</p><p>${LEVELS[levelId].brief}</p>`;
  setText('setup-warning',b.turns<=7?'High risk: very short window. Use Flight/Leap, split objectives, and save movement for the return.':b.turns<=11?'Short window: firepower helps, but you will need a quick extraction route.':'More time for positioning; keep track of the extraction route.');
  $('setup-warning').className=b.turns<=7?'warning':'muted';
  if(levelId==='ferry'&&loadout.every(u=>WEAPONS[u.weapon].signature===0))setText('setup-warning','Native gear makes wave defense a harder, longer test. Start with One advanced weapon for the intended medium challenge.');
}
function launch(){
  const seed=Number($('seed').value);if(!Number.isInteger(seed)||seed<1||seed>4294967295){setText('setup-warning','Enter a scenario seed from 1 to 4294967295.');return;}
  clearTimeout(busyTimer);missionSerial++;facings=new Map();lastPresentationEvent=-1;shownUnits=new Map();shownEnemies=new Map();previousGrace=null;visualBusyUntil=0;clock?.stop();clock=createPlayClock();clock.hidden(document.hidden);actionTimes=[];pendingMove=null;state=createTrial(levelId,loadout,seed);selected=state.units[0].id;order='move';started=performance.now();finished=null;$('rating').value='';$('feedback').value='';$('view-result').hidden=true;
  savingResult=false;lastSavedPayload=null;$('save-repo').disabled=false;setText('save-status','');$('move-confirmation').hidden=true;
  $('setup').hidden=true;$('mission').hidden=false;render();$('mission').scrollIntoView({behavior:'instant'});
}
function orders(u){
  const w=weaponFor(u),special=u.id==='bound'?'leap':u.id==='murr'?'musk':u.id==='centurion'?'rally':null;
  return [
    {key:'move',label:u.id==='aer'?'Fly / Move':'Move',category:'move',detail:`${moveAllowance(state,u)} ground · ${u.vertical} Z`,help:u.id==='aer'?'Fly over obstacles and units; land on outlined empty ground. Costs Move.':`One Move: ${moveAllowance(state,u)} ground steps, ${u.vertical} total Z travel; climb at most ${u.climb} per step. Safe drop ${u.safeDrop}; excess drop costs 3 HP per level. Hover/focus to preview. Lethal drops are unavailable.`},
    {key:'attack',label:w.name,category:'act',detail:range(w),help:`${range(w)} · ${u.ammo??'unlimited'} shots left. Attack enemies, barricades or generators. Terrain cannot dodge or block; destroying it removes its cover and obstruction. Costs Act and ammunition even when dodged.${w.chain?' Chains 2 damage to one adjacent enemy.':''}`},
    {key:'sidearm',label:'Basic sidearm',category:'act',detail:'2–3 damage · range 1',help:'Unlimited close-range backup. Costs Act.'},
    {key:'defend',label:'Defend',category:'act',detail:`−${['shield','krag'].includes(u.id)?3:2} incoming damage`,help:'Costs Act. Lasts through the next enemy phase; stacks with armor and block.'},
    {key:'objective',label:'Secure / Free',category:'interact',detail:'Adjacent unlocked objective',help:'Costs Item/Special. Secure an unlocked diamond objective on this or an adjacent tile. Holding, defense, escort delivery, and linked controls resolve after the enemy phase; generators need weapon attacks.'},
    {key:'revive',label:'Revive',category:'interact',detail:'30% HP · adjacent',help:'Revive an adjacent fallen recruit. Costs Item/Special; they act next round. Vaporized recruits cannot be revived.'},
    ...(u.id==='centurion'?[{key:'fullRevive',label:'Full revive',category:'interact',detail:'Full HP · once per mission',help:'Centurion only. Item/Special: restore an adjacent fallen recruit to full health. They act next round. Cannot restore a vaporized recruit.'}]:[]),
    {key:special||'passive',label:u.ability,category:'interact',detail:special?'Item / Special':'Passive',help:RECRUITS[u.id].description},
    {key:'extract',label:'Extract',category:'interact',detail:'On X · all goals complete',help:'Costs Item/Special. Requires all mission goals and standing on an extraction tile. This recruit leaves the map safely.'},
  ];
}
function enabled(u,a){
  if(!active(u)||state.status!=='playing'||!u.actions[a.category]||a.key==='passive')return false;
  if(a.key==='attack'&&u.ammo===0)return false;
  if(a.key==='rally'&&u.rallyUsed)return false;
  if(a.key==='fullRevive'&&u.fullReviveUsed)return false;
  if(a.key==='extract')return tileAt(state,u.x,u.y)==='X'&&state.objectives.every(o=>o.done);
  return true;
}
function stamp(){const time=clock.read();actionTimes.push({throughEvent:state.telemetry.events.length-1,...time,events:undefined});}
function issue(key,x,y,confirmed=false){
  if(clock?.paused||performance.now()<visualBusyUntil)return;
  const u=state.units.find(u=>u.id===selected),preview=movementPreview(state,u,key,x,y);
  if(preview?.fall&&!confirmed){pendingMove={key,x,y};$('move-confirmation').hidden=false;setText('move-warning',`Drop to Z${preview.z}: ${preview.fall} fall damage. ${u.hp-preview.fall} HP will remain.`);return;}
  pendingMove=null;$('move-confirmation').hidden=true;
  if(act(state,selected,key,x,y)){stamp();render();showResult();}
}
function previewTile(u,key,x,y,description){
  const preview=state.status==='playing'&&active(u)&&u.actions[key==='move'?'move':'interact']?movementPreview(state,u,key,x,y):null;
  const detail=preview?` → X${x+1}, Y${y+1}, Z${preview.z} · ${preview.cost} ground steps · ${preview.vertical} Z travel · ${preview.fall} fall damage`:'';
  setText('target-info',description+detail);
  highlightScenePath($('trial-board'),preview?.path||[]);
  if(!preview&&state.enemies.some(e=>e.hp>0&&e.x===x&&e.y===y)){
    const e=enemyAt(state,x,y);setText('target-info',description+` · ${e.description||'Combat guard: seeks a useful approach and attacks exposed recruits.'} · Intent: ${e.intent} · support uses ${e.charges}, ready round ${Math.max(state.round,e.cooldown)}`);
  }
}

function direction(from,to){const dx=to.x-from.x,dy=to.y-from.y;return Math.abs(dx)>=Math.abs(dy)?dx>=0?'se':'nw':dy>=0?'sw':'ne';}
function presentationEffects(){
  const events=state.telemetry.events.filter(e=>e.seq>lastPresentationEvent),effects=[];
  for(const e of events){
    const eventState=e.state||events.find(v=>v.seq>=e.seq&&v.state)?.state||state;
    const find=id=>[...eventState.units,...eventState.enemies].find(u=>u.id===id);
    const add=(type,target,more={})=>{if(target)effects.push({id:`${missionSerial}:${e.seq}:${type}`,type,x:target.x,y:target.y,z:target.z??heightAt(state,target.x,target.y),...more});};
    if(e.type==='action'&&e.from&&e.to&&['move','leap'].includes(e.action)){
      const path=[e.from,...(e.path||[e.to])].filter((p,i,a)=>i===0||p.x!==a[i-1].x||p.y!==a[i-1].y);
      facings.set(e.actor,direction(path.at(-2)||e.from,e.to));add('move',e.to,{unitId:e.actor,path,direction:facings.get(e.actor)});
    }
    if(e.type==='action'&&['attack','sidearm'].includes(e.action)&&e.target)facings.set(e.actor,direction(e.from,e.target));
    if(e.type==='enemy'&&e.path?.length){facings.set(e.actor,direction(e.path.at(-2)||e.from,e.to));add('move',e.to,{unitId:e.actor,spriteId:find(e.actor)?.type,path:[e.from,...e.path],direction:facings.get(e.actor)});}
    if(e.type==='combat'&&e.actualDamage>0)add('hit',e.to||find(e.target),{amount:e.actualDamage});
    if(e.type==='support'&&e.ability==='mend')add('heal',find(e.target),{amount:e.healed});
    if(e.type==='support'&&e.ability==='command')add('command',find(e.actor));
    if(e.type==='support'&&e.ability==='binding')add('debuff',find(e.target));
    if(e.type==='action'&&e.action==='musk')add('debuff',find(e.actor));
  }
  for(const u of state.units)if(u.vaporized&&shownUnits.has(u.id)&&!shownUnits.get(u.id).vaporized)effects.push({id:`${missionSerial}:beam:${state.round}:${u.id}`,type:'vaporize',x:u.x,y:u.y,z:u.z,unitId:u.id});
  if(previousGrace===null&&state.grace!==null){
    const deaths=new Set(events.filter(e=>e.type==='combat'&&e.hpAfter===0).map(e=>e.target));
    for(const e of state.enemies)if(e.hp===0&&shownEnemies.get(e.id)?.hp>0&&!deaths.has(e.id))effects.push({id:`${missionSerial}:beam:${e.id}`,type:'vaporize',x:e.x,y:e.y,z:e.z,unitId:e.type});
  }
  shownUnits=new Map(state.units.map(u=>[u.id,{...u}]));shownEnemies=new Map(state.enemies.map(e=>[e.id,{...e}]));previousGrace=state.grace;
  lastPresentationEvent=state.telemetry.events.length-1;return effects;
}
function render(){
  const effects=presentationEffects();
  if(effects.some(e=>e.type==='move')&&!matchMedia('(prefers-reduced-motion: reduce)').matches){visualBusyUntil=performance.now()+680;const mission=missionSerial;clearTimeout(busyTimer);busyTimer=setTimeout(()=>{if(mission===missionSerial){visualBusyUntil=0;render();}},690);}
  const u=state.units.find(v=>v.id===selected),level=LEVELS[state.levelId];
  setText('trial-name',level.name);setText('trial-brief',level.brief);$('trial-board').className=`theme-${level.theme} ${relief?'relief-view':''}`;$('trial-board').inert=clock.paused||performance.now()<visualBusyUntil;setText('pause-trial',clock.paused?'Resume play':'Pause play');$('pause-panel').hidden=!clock.paused;
  setText('map-name',`${level.name.toUpperCase()} / SEED ${state.initialSeed}`);setText('trial-phase',`ROUND ${String(state.round).padStart(2,'0')} / ${state.status==='playing'?'YOUR TURN':state.status.toUpperCase()}`);
  setText('objective-count',`${state.objectives.filter(o=>o.done).length} / ${state.objectives.length} secured`);
  $('mission-goals').replaceChildren(...goalLines(state).map(line=>{const p=document.createElement('p');p.textContent=line;return p;}));
  $('trial-end').disabled=state.status!=='playing'||clock.paused||performance.now()<visualBusyUntil;
  $('view-result').hidden=state.status==='playing';
  $('clock').className=`detection-clock ${state.grace!==null?'enforcement':state.remaining<=3?'imminent':''}`;
  $('clock').innerHTML=state.grace===null?`<strong>${state.remaining}</strong><div><b>SAFE TURNS BEFORE DETECTION</b><span>Countdown advances when you end your turn. Then enforcement arrives with a two-turn exit window.</span></div>`:`<strong>${state.grace}</strong><div><b>ENFORCEMENT ACTIVE · TURNS TO ESCAPE</b><span>${state.marked?`${RECRUITS[state.marked].name} is marked: extract before ending this turn.`:'Site lockdown imminent. Finish objectives and extract now.'} Guards and armor cannot stop enforcement beams.</span></div>`;
  $('trial-selected').innerHTML=`<p class="eyebrow">SELECTED RECRUIT / ${u.token}</p><img class="selected-portrait" src="${image(u.id)}" alt=""><h2>${u.name}</h2><p class="role">${u.species} · ${u.ability}</p><div class="health"><span style="width:${100*u.hp/u.maxHp}%"></span></div><p>${u.hp}/${u.maxHp} HP · ${u.extracted?'EXTRACTED':u.vaporized?'VAPORIZED':u.hp===0?'FALLEN':slowed(state,u)?'BINDING: −1 MOVE / −10% DODGE':musked(state,u)?'MUSK DEBUFF':'Ready'}</p><div class="budgets">${Object.entries(u.actions).map(([key,on])=>`<span class="${on&&active(u)?'ready':'spent'}">${on&&active(u)?'●':'○'} ${key==='interact'?'Item/Special':key}</span>`).join('')}</div><p class="condition">${WEAPONS[u.weapon].name}: ${range(WEAPONS[u.weapon])}<br>Ammo ${u.ammo??'∞'} · ${ARMORS[u.armor].name}<br>Dodge ${percent(Math.max(0,u.dodge-(musked(state,u)?.1:0)-(slowed(state,u)?.1:0)))} · Block ${percent(u.block)}<br>Armor ${ARMORS[u.armor].armor+(u.innateArmor||0)} · Ground ${moveAllowance(state,u)}<br>X${u.x+1}, Y${u.y+1}, Z${heightAt(state,u.x,u.y)}<br>Z travel ${u.vertical} · climb ${u.climb} · safe drop ${u.safeDrop}</p><details><summary>Ability and gear</summary><p>${RECRUITS[u.id].description}</p><p>${ARMORS[u.armor].note}</p></details>`;
  const options=orders(u);if(!options.some(a=>a.key===order))order='move';
  $('trial-actions').replaceChildren();
  for(const a of options){const b=document.createElement('button');b.innerHTML=`<span>${a.label}</span><small>${a.detail}</small>`;b.disabled=clock.paused||performance.now()<visualBusyUntil||!enabled(u,a);b.className=order===a.key?'chosen':'';b.title=a.help;b.onclick=()=>{pendingMove=null;$('move-confirmation').hidden=true;if(['defend','musk','extract'].includes(a.key))issue(a.key);else{order=a.key;render();}};$('trial-actions').append(b);}
  setText('trial-help',options.find(a=>a.key===order).help);
  const moves=order==='move'&&active(u)&&u.actions.move?reachable(state,u):null;
  const tiles=[];
  for(let y=0;y<state.map.length;y++)for(let x=0;x<state.map[0].length;x++){
    const t=tileAt(state,x,y),friend=unitAt(state,x,y),enemy=enemyAt(state,x,y),objective=state.objectives.find(o=>o.x===x&&o.y===y&&o.mapMarker!==false&&!(o.hideAfterDone&&o.done)),p={x,y},structure=structureAt(state,x,y),device=protectedTarget(state)?.x===x&&protectedTarget(state)?.y===y?protectedTarget(state):null;
    const legal=order==='move'?state.status==='playing'&&moves?.has(`${x},${y}`):canTarget(state,u,order,x,y);
    const description=`${String.fromCharCode(65+x)}${y+1}: ${t==='~'?'water':t==='T'?'trees':t==='W'?'rubble':t==='X'?'extraction':'ground'}${friend?`, ${friend.name}, ${friend.hp} HP${friend.id===state.marked?', MARKED FOR VAPORIZATION':''}`:''}${enemy?`, ${enemy.token} ${enemy.name}, ${enemy.hp} HP, ${enemy.damage.join('–')} damage, range ${enemy.range}`:''}${objective?`, ${objective.name}, ${objective.done?'secured':'objective'}`:''}${state.police.some(p=>p.x===x&&p.y===y)?', enforcement drone, cannot be attacked':''}${legal?`, valid ${order} target`:''}, X${x+1} Y${y+1} Z${heightAt(state,x,y)}`;
    const extra=`${structure?` · ${structure.name} ${structure.hp}/${structure.maxHp} HP${structure.destroyed?' · walkable ruins':' · blocks movement and sight; provides cover; attack to destroy'}`:''}${device?` · PROTECT ${device.name} ${device.hp}/${device.maxHp} HP`:''}${objective?.requires!==undefined&&!state.objectives[objective.requires]?.done?' · LOCKED: complete the previous stage first':''}`;
    const zone=(state.mission?.type==='hold'?[state.objectives[0]]:state.mission?.type==='linked'?state.objectives:[]).some(o=>distance(o,p)<=1&&Math.abs(heightAt(state,o.x,o.y)-heightAt(state,x,y))<=1);
    tiles.push({x,y,z:heightAt(state,x,y),terrain:t,description:description+extra,legal:Boolean(legal),structure,device,zone,scenery:level.scenery?.find(o=>o.x===x&&o.y===y),selected:friend?.id===selected,friend:friend?{...friend,facing:facings.get(friend.id)||'se'}:null,enemy:enemy?{...enemy,facing:facings.get(enemy.id)||'sw'}:null,objective,police:state.police.some(p=>p.x===x&&p.y===y),marked:friend?.id===state.marked,musk:state.clouds.some(c=>spatialDistance(state,c,p)<=2)});
  }
  renderBattleScene($('trial-board'),{map:state.map,heights:state.heights,theme:level.theme,relief,tiles,effects,missionKey:missionSerial,
    onViewChange:view=>setText('camera-north',`NORTH ${view.north}`),
    onInspect:t=>previewTile(u,order,t.x,t.y,t.description),
    onSelect:t=>{
      if(clock.paused||performance.now()<visualBusyUntil)return;
      if(t.legal)issue(order,t.x,t.y);
      else if(t.friend){pendingMove=null;$('move-confirmation').hidden=true;selected=t.friend.id;order='move';render();}
      else previewTile(u,order,t.x,t.y,t.description);
    }});
  setText('trial-hint',state.status!=='playing'?'Mission ended. Review the map or choose another loadout.':`${u.name} · ${options.find(a=>a.key===order).label}. ${$('trial-board').querySelector('.legal')?'Outlined tiles are valid targets.':'No targets in reach for this order.'}`);
  $('trial-roster').replaceChildren();for(const m of state.units){const b=document.createElement('button');b.disabled=clock.paused||performance.now()<visualBusyUntil;b.className=`roster-card ${m.id===selected?'chosen':''}`;b.innerHTML=`<img class="roster-portrait ${m.hp===0?'portrait-fallen':''}" src="${image(m.id)}" alt=""><span class="roster-token">${m.token}</span><strong>${m.name}</strong><span>${m.hp}/${m.maxHp} HP · ${m.extracted?'Extracted':m.vaporized?'Vaporized':m.hp===0?'Fallen':m.id===state.marked?'MARKED':m.species}</span><small>${Object.entries(m.actions).map(([k,v])=>`${k[0].toUpperCase()} ${v&&active(m)?'●':'○'}`).join('　')}</small>`;b.onclick=()=>{if(clock.paused||performance.now()<visualBusyUntil)return;pendingMove=null;$('move-confirmation').hidden=true;selected=m.id;order='move';render();};$('trial-roster').append(b);}
  $('trial-log').replaceChildren(...state.log.slice(-9).reverse().map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
}
function showResult(){
  if(state.status==='playing'||finished!==null)return;clock.stop();finished=performance.now();const escaped=state.units.filter(u=>u.extracted).length;
  setText('result-label',state.status==='success'?'CONTRACT COMPLETE':'CONTRACT FAILED');setText('result-title',state.status==='success'?escaped===4?'Everyone made it out.':'Success came at a cost.':'The window closed.');
  setText('result-text',`${state.objectives.filter(o=>o.done).length}/${state.objectives.length} objectives · ${escaped}/4 recruits extracted · ${state.round} rounds. Trial losses reset when you deploy again.`);
  $('result-metrics').innerHTML=`<p>${(clock.read().activeMs/60000).toFixed(1)} active minutes · ${(clock.read().idleMs/60000).toFixed(1)} idle · ${(clock.read().pausedMs/60000).toFixed(1)} paused · ${(clock.read().totalMs/60000).toFixed(1)} total minutes · ${state.metrics.actions} actions · ${state.metrics.knockdowns} knockdowns · ${state.metrics.enforcementDeaths} vaporized</p><p>Starting deadline ${state.budget.turns} turns · total signature ${state.budget.total} · seed ${state.initialSeed}</p>`;
  $('result-metrics').insertAdjacentHTML('beforeend',`<p>${state.metrics.structuresDestroyed||0} structures destroyed · ${state.metrics.terrainDamage||0} terrain damage · ${state.metrics.protectedDamage||0} damage to protected targets</p>`);
  $('trial-ending').showModal();
}
function back(){if(state?.status==='playing'&&!confirm('Return to loadout and abandon this trial?'))return;clearTimeout(busyTimer);visualBusyUntil=0;clock?.stop();$('trial-ending').close();$('setup').hidden=false;$('mission').hidden=true;setup();$('setup').scrollIntoView({behavior:'instant'});}
$('launch').onclick=launch;$('trial-end').onclick=()=>{if(clock.paused||performance.now()<visualBusyUntil)return;pendingMove=null;$('move-confirmation').hidden=true;endTurn(state);stamp();order='move';render();showResult();};$('change-loadout').onclick=back;$('new-loadout').onclick=back;
$('retry-trial').onclick=()=>{$('trial-ending').close();launch();};$('review-trial').onclick=()=>$('trial-ending').close();
$('view-result').onclick=()=>$('trial-ending').showModal();
function resultData(){return trialResult(state,{rating:$('rating').value,notes:$('feedback').value,timing:clock.read(),actionTimes});}
$('download-result').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(resultData(),null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`legionnaires-${state.levelId}-${state.initialSeed}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('save-repo').onclick=async()=>{
  if(savingResult||!state||state.status==='playing')return;
  const mission=state,payload=JSON.stringify(resultData());savingResult=true;$('save-repo').disabled=true;setText('save-status','Saving to repo…');
  try{
    const response=await fetch('/api/playtests',{method:'POST',headers:{'Content-Type':'application/json'},body:payload});
    const saved=await response.json().catch(()=>null);
    if(!response.ok||typeof saved?.path!=='string')throw new Error(saved?.error||'Could not save. Keep your notes here and try again, or download a copy.');
    if(state!==mission)return;
    lastSavedPayload=payload;setText('save-status',`Saved to ${saved.path}${JSON.stringify(resultData())!==payload?' · You have unsaved changes.':''}`);
  }catch(error){if(state===mission)setText('save-status',error.message||'Could not save. Your notes are still here; try again or download a copy.');}
  finally{if(state===mission){savingResult=false;$('save-repo').disabled=JSON.stringify(resultData())===lastSavedPayload;}}
};
function notesChanged(){if(!state||state.status==='playing')return;$('save-repo').disabled=savingResult||JSON.stringify(resultData())===lastSavedPayload;if(!savingResult)setText('save-status',lastSavedPayload?'Unsaved changes. Save again to keep a new snapshot.':'');}
$('feedback').addEventListener('input',notesChanged);$('rating').addEventListener('change',notesChanged);
setup();

$('confirm-move').onclick=()=>{if(pendingMove)issue(pendingMove.key,pendingMove.x,pendingMove.y,true);};
$('cancel-move').onclick=()=>{pendingMove=null;$('move-confirmation').hidden=true;};
$('pause-trial').onclick=()=>{if(state?.status==='playing'){clock.pause(!clock.paused);render();}};
$('resume-trial').onclick=()=>{clock.pause(false);render();};
$('map-view').onclick=()=>{relief=!relief;setText('map-view',relief?'Use tactical view':'Use isometric view');if(state)render();};
for(const event of ['pointerdown','keydown'])document.addEventListener(event,()=>clock?.touch(),{passive:true});
document.addEventListener('visibilitychange',()=>{clock?.hidden(document.hidden);if(state&&state.status==='playing')render();});
setInterval(()=>{if(clock&&state?.status==='playing'){const t=clock.read();setText('play-timing',`${(t.activeMs/60000).toFixed(1)} active min · ${(t.idleMs/60000).toFixed(1)} idle · ${(t.pausedMs/60000).toFixed(1)} paused`);}},1000);
