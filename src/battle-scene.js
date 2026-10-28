import {battleSprite,terrainTexture,terrainProp,enforcerSprite} from './battle-assets.js';

const NS='http://www.w3.org/2000/svg';
const views=new WeakMap();
const TILE_W=80,TILE_H=40,LEVEL_H=24;
const palettes={reedwater:{top:'#75845a',left:'#756148',right:'#514c3c',edge:'#b3b48a',water:'#315f67',haze:'#42573d'},basalt:{top:'#858776',left:'#625e56',right:'#424947',edge:'#b4b39a',water:'#385a64',haze:'#3f514d'},spores:{top:'#8c7e72',left:'#795e59',right:'#52494f',edge:'#c6b394',water:'#395c67',haze:'#5b4953'}};

function svg(tag,attrs={},parent){
  const node=document.createElementNS(NS,tag);
  for(const [key,value] of Object.entries(attrs))if(value!==undefined&&value!==null)node.setAttribute(key,String(value));
  if(parent)parent.append(node);return node;
}
function label(parent,text,x,y,cls,attrs={}){const node=svg('text',{x,y,class:cls,...attrs},parent);node.textContent=text;return node;}
const key=t=>`${t.x},${t.y}`;
const coord=t=>`${String.fromCharCode(65+t.x)}${t.y+1}`;
const at=(map,x,y)=>map?.[y]?.[x];
const altitude=(heights,x,y)=>Number(at(heights,x,y)||0);
const points=arr=>arr.map(p=>p.join(',')).join(' ');
const diamond=(p,inset=0)=>[[p.x,p.y-TILE_H/2+inset],[p.x+TILE_W/2-inset*2,p.y],[p.x,p.y+TILE_H/2-inset],[p.x-TILE_W/2+inset*2,p.y]];

export const cameraTurn=turn=>((turn%4)+4)%4;
export function rotateBattlePoint(x,y,turn=0){
  return [{x,y},{x:-y,y:x},{x:-x,y:-y},{x:y,y:-x}][cameraTurn(turn)];
}
export function cameraDirections(turn=0){
  return [[[1,0],[0,1]],[[0,-1],[1,0]],[[-1,0],[0,-1]],[[0,1],[-1,0]]][cameraTurn(turn)];
}
export function cameraFacing(facing='se',turn=0){
  const directions=['se','sw','nw','ne'],index=directions.indexOf(facing);
  return directions[cameraTurn((index<0?0:index)+turn)];
}
export function projectBattlePoint(x,y,z=0,relief=true,turn=0){
  ({x,y}=rotateBattlePoint(x,y,turn));
  return relief?{x:(x-y)*TILE_W/2,y:(x+y)*TILE_H/2-z*LEVEL_H}:{x:x*64,y:y*54};
}

function image(parent,url,x,y,width,height,cls,extra={}){
  if(!url)return null;
  const node=svg('image',{href:url,x,y,width,height,preserveAspectRatio:'xMidYMid meet',class:cls,...extra},parent);
  node.addEventListener('error',()=>{node.setAttribute('data-image-error','true');});return node;
}

function makeDefs(root,theme,id){
  const defs=svg('defs',{},root),palette=palettes[theme]||palettes.reedwater;
  for(const material of ['.','~','T','W','X','cliff']){
    const name=`${id}-tex-${material==='.'?'ground':material==='~'?'water':material}`;
    const pattern=svg('pattern',{id:name,patternUnits:'userSpaceOnUse',width:96,height:96},defs);
    const fill=material==='~'?palette.water:palette.top;
    svg('rect',{width:96,height:96,fill},pattern);
    image(pattern,terrainTexture(theme,material==='~'?'water':material),0,0,96,96,'scene-texture');
  }
  const grad=svg('linearGradient',{id:`${id}-face-light`,x1:0,x2:0,y1:0,y2:1},defs);
  svg('stop',{offset:0,'stop-color':'#fff6d0','stop-opacity':.16},grad);svg('stop',{offset:1,'stop-color':'#100f15','stop-opacity':.25},grad);
  const water=svg('linearGradient',{id:`${id}-water-glint`,x1:0,x2:1,y1:0,y2:1},defs);
  svg('stop',{offset:0,'stop-color':'#9adbd1','stop-opacity':.22},water);svg('stop',{offset:1,'stop-color':'#143b48','stop-opacity':.04},water);
  const shadow=svg('filter',{id:`${id}-soft-shadow`,x:'-30%',y:'-30%',width:'160%',height:'180%'},defs);
  svg('feGaussianBlur',{stdDeviation:1.7},shadow);
  const silhouette=svg('filter',{id:`${id}-silhouette`,x:'-10%',y:'-10%',width:'120%',height:'120%'},defs);
  svg('feColorMatrix',{type:'matrix',values:'0 0 0 0 0.75 0 0 0 0 0.95 0 0 0 0 0.86 0 0 0 0.6 0'},silhouette);
  return palette;
}

function drawFace(parent,edge,drop,color,id,side){
  if(drop<=0)return;
  const [a,b]=edge,poly=[a,b,[b[0],b[1]+drop],[a[0],a[1]+drop]];
  // Faces intentionally receive pointer events: clicking a cliff must not select
  // the obscured tile behind it. Only top-surface nodes issue an order.
  svg('polygon',{points:points(poly),fill:color,class:`scene-cliff scene-cliff-${side}`},parent);
  svg('polygon',{points:points(poly),fill:`url(#${id}-tex-cliff)`,class:'scene-cliff-grain','pointer-events':'none'},parent);
  svg('polygon',{points:points(poly),fill:`url(#${id}-face-light)`,'pointer-events':'none'},parent);
  for(let line=LEVEL_H;line<drop;line+=LEVEL_H)svg('path',{d:`M${a[0]},${a[1]+line}L${b[0]},${b[1]+line}`,class:'scene-height-band'},parent);
  // Sparse staggered fractures show scale without competing with unit outlines.
  const middle=(a[0]+b[0])/2;
  svg('path',{d:`M${middle},${(a[1]+b[1])/2+3}l-2,${Math.min(11,drop-4)}m5,5l-1,${Math.min(8,Math.max(0,drop-22))}`,class:'scene-rock-fracture'},parent);
}

function drawSurface(parent,t,p,context){
  const {relief,heights,palette,id,map}=context;
  let shape;
  if(relief){
    const shapePoints=diamond(p),z=t.z??altitude(heights,t.x,t.y);
    const [right,down]=cameraDirections(context.rotation);
    const neighbor=([dx,dy])=>at(map,t.x+dx,t.y+dy)===undefined?-1:altitude(heights,t.x+dx,t.y+dy);
    const nextX=neighbor(right),nextY=neighbor(down);
    drawFace(parent,[shapePoints[1],shapePoints[2]],Math.max(0,z-nextX)*LEVEL_H,palette.right,id,'right');
    drawFace(parent,[shapePoints[2],shapePoints[3]],Math.max(0,z-nextY)*LEVEL_H,palette.left,id,'left');
    shape=svg('polygon',{points:points(shapePoints)},parent);
  }else shape=svg('rect',{x:p.x-31,y:p.y-26,width:62,height:52,rx:1},parent);
  const material=t.terrain==='~'?'water':t.terrain==='.'?'ground':t.terrain==='R'?'X':t.terrain;
  shape.setAttribute('fill',`url(#${id}-tex-${material})`);
  shape.setAttribute('class',`tile scene-surface ${t.terrain==='~'?'scene-water':''} ${t.legal?'legal':''} ${t.selected?'selected':''} ${t.enemy?.role?`role-${t.enemy.role}`:''}`);
  shape.setAttribute('data-position',key(t));shape.setAttribute('data-x',t.x);shape.setAttribute('data-y',t.y);shape.setAttribute('data-z',t.z||0);
  shape.setAttribute('role','button');shape.setAttribute('tabindex','0');shape.setAttribute('aria-label',t.description||`${coord(t)}: Z${t.z||0}`);
  shape.setAttribute('aria-pressed',Boolean(t.selected));
  const title=svg('title',{},shape);title.textContent=t.description||`${coord(t)} / Z${t.z||0}`;
  shape.addEventListener('click',e=>{if(context.dragged)return;e.stopPropagation();context.onSelect?.(t);});
  shape.addEventListener('pointerenter',()=>context.onInspect?.(t));shape.addEventListener('focus',()=>context.onInspect?.(t));
  shape.addEventListener('keydown',e=>{
    if(e.key==='Enter'||e.key===' '){e.preventDefault();context.onSelect?.(t);}
    const [right,down]=cameraDirections(context.rotation);
    const offset={ArrowLeft:right.map(n=>-n),ArrowRight:right,ArrowUp:down.map(n=>-n),ArrowDown:down}[e.key];
    if(offset){e.preventDefault();context.container.querySelector(`[data-position="${t.x+offset[0]},${t.y+offset[1]}"]`)?.focus();}
  });
  if(t.terrain==='~'){
    const poly=relief?svg('polygon',{points:points(diamond(p,1)),fill:`url(#${id}-water-glint)`,class:'scene-water-glint'},parent):null;
    if(poly)svg('path',{d:`M${p.x-19},${p.y-3}q8,-4 16,0m4,4q8,-4 16,0`,class:'scene-water-ripple'},parent);
  }
  if(t.terrain==='X'||t.terrain==='R'){
    svg('polygon',{points:points(diamond(p,6)),class:'scene-extraction-surface'},parent);
    label(parent,'X',p.x,p.y+4,'scene-extraction-letter',{'text-anchor':'middle'});
  }
  if(t.musk)svg('ellipse',{cx:p.x,cy:p.y,rx:31,ry:13,class:'scene-musk-cloud'},parent);
  if(t.zone)svg('polygon',{points:points(diamond(p,2)),class:'scene-goal-zone'},parent);
  const route=svg('polygon',{points:points(diamond(p,4)),class:'scene-path-cell','data-path-position':key(t)},parent);
  route.setAttribute('hidden','');
  if(t.selected)svg('polygon',{points:points(diamond(p,3)),class:'scene-selection-ring'},parent);
  const text=label(parent,`${coord(t)} · Z${t.z||0}`,p.x,p.y+12,'scene-coordinate',{'text-anchor':'middle'});
  text.setAttribute('aria-hidden','true');
  return shape;
}

function drawProp(parent,t,p,context){
  const special=t.device||t.structure||t.scenery;
  if(special){
    const kind=special.destroyed?'barricade-broken':special.kind,size=special.kind==='escort-cart'?78:76;
    image(parent,terrainProp(context.theme,kind),p.x-size/2,p.y-size*.875,size,size,`scene-prop scene-mission-prop ${special.destroyed?'is-destroyed':''}`);
    if(special.hp!==undefined&&!special.destroyed){
      const health=svg('g',{'pointer-events':'none'},parent);
      svg('rect',{x:p.x-23,y:p.y-56,width:46,height:6,rx:2,class:'scene-structure-health-bg'},health);
      svg('rect',{x:p.x-23,y:p.y-56,width:46*special.hp/special.maxHp,height:6,rx:2,class:t.device?'scene-device-health':'scene-structure-health'},health);
      label(health,`${t.device?'PROTECT · ':''}${special.hp} HP`,p.x,p.y-59,'scene-structure-label',{'text-anchor':'middle'});
      context.structureLabels.push(health);
    }
  }
  const type=t.terrain==='T'?'tree':t.terrain==='W'?(context.theme==='roman'?'wagon':'rubble'):null;
  if(type){
    svg('ellipse',{cx:p.x+4,cy:p.y+6,rx:type==='tree'?23:26,ry:10,class:'scene-prop-shadow'},parent);
    const size=type==='tree'?106:type==='wagon'?91:81;
    image(parent,terrainProp(context.theme,type),p.x-size/2,p.y-size*.875,size,size,`scene-prop scene-prop-${type}`);
  }
  if(['X','R'].includes(t.terrain)&&!['X','R'].includes(at(context.map,t.x-1,t.y))&&!['X','R'].includes(at(context.map,t.x,t.y-1))){
    image(parent,terrainProp(context.theme,'extraction'),p.x-27,p.y-47,54,54,'scene-extraction-prop');
  }
  if(t.casualty){
    image(parent,terrainProp(context.theme,'casualty'),p.x-31,p.y-48,62,62,'scene-casualty-prop');
    label(parent,'WOUNDED',p.x,p.y+16,'scene-casualty-label',{'text-anchor':'middle'});
  }
  if(t.objective){
    const o=t.objective,size=o.kind==='captive'?62:59;
    if(!special&&(!o.done||['relay','control-spire','sluice','archive'].includes(o.kind)))image(parent,terrainProp(context.theme,o.kind||'salvage'),p.x-size/2,p.y-size*.875,size,size,`scene-objective ${o.done?'scene-objective-done':''}`);
    svg('polygon',{points:points([[p.x,p.y-34],[p.x+7,p.y-27],[p.x,p.y-20],[p.x-7,p.y-27]]),class:`scene-objective-sigil ${o.done?'is-done':''}`},parent);
    if(o.done)label(parent,'✓',p.x,p.y-23,'scene-objective-check',{'text-anchor':'middle'});
  }
}

function drawActor(parent,t,p,context){
  const actor=t.friend||t.enemy;if(!actor)return;
  const enemy=Boolean(t.enemy),id=enemy?(actor.type||actor.role||'spear'):actor.id;
  const fallen=actor.hp===0,large=id==='krag'||id==='brute',width=large?72:64,height=large?90:80;
  const source=battleSprite(id,cameraFacing(actor.facing||actor.direction||(enemy?'sw':'se'),context.rotation),fallen);
  svg('ellipse',{cx:p.x,cy:p.y+4,rx:enemy?18:20,ry:8,class:`scene-unit-base ${enemy?'scene-enemy-base':'scene-hero-base'} ${t.selected?'is-selected':''}`},parent);
  const x=p.x-width/2,y=p.y-height*.9;
  const art=image(parent,source,x,y,width,height,`scene-unit ${enemy?'scene-enemy':'scene-hero'} ${fallen?'scene-fallen':''}`,{'data-unit-id':actor.id});
  if(t.selected&&art)art.classList.add('scene-selected-unit');
  if(actor.defending)svg('path',{d:`M${p.x-20},${p.y-36}q20,-10 40,0l-3,24q-17,18 -34,0z`,class:'scene-defend-aura'},parent);
  if(actor.carrying)label(parent,'CARRYING',p.x,p.y-66,'scene-casualty-label',{'text-anchor':'middle'});
  const ratio=Math.max(0,Math.min(1,actor.hp/actor.maxHp));
  svg('rect',{x:p.x-18,y:p.y+9,width:36,height:4,rx:1,class:'scene-health-track'},parent);
  svg('rect',{x:p.x-17,y:p.y+10,width:34*ratio,height:2,fill:enemy?'#f3aa7d':'#c7e2b8',class:'scene-health-value'},parent);
  if(actor.symbol){
    svg('rect',{x:p.x+13,y:p.y-55,width:15,height:15,rx:3,class:`scene-role-panel role-${actor.role}`},parent);
    label(parent,actor.symbol,p.x+20.5,p.y-43,'scene-role-icon',{'text-anchor':'middle'});
  }
  label(parent,actor.token||actor.name?.slice(0,2)||'',p.x,p.y+23,'scene-unit-label',{'text-anchor':'middle'});
  context.actors.push({tile:t,point:p,source,x,y,width,height,id:actor.id});
}

function drawEnforcer(parent,t,p,context,index){
  const base=svg('g',{class:`scene-enforcer ${context.arrival?'is-arriving':''}`,'data-enforcer':index},parent);
  svg('ellipse',{cx:p.x,cy:p.y+3,rx:27,ry:12,class:'scene-enforcer-ground-ring'},base);
  svg('path',{d:`M${p.x},${p.y-132}V${p.y+6}`,class:'scene-arrival-seam'},base);
  image(base,enforcerSprite(),p.x-44,p.y-132,88,110,'scene-enforcer-body');
  const orbitFrame=svg('g',{transform:`translate(${p.x} ${p.y-91})`},base);
  svg('ellipse',{cx:0,cy:0,rx:35,ry:12,class:'scene-enforcer-orbit'},orbitFrame);
  svg('ellipse',{cx:0,cy:0,rx:22,ry:34,transform:'rotate(-33)',class:'scene-enforcer-orbit scene-enforcer-orbit-inner'},orbitFrame);
  label(base,'ENFORCER',p.x,p.y-145,'scene-enforcer-label',{'text-anchor':'middle'});
  context.enforcers.push(p);
}

function drawVisibleUnits(root,context){
  const {actors,tiles,relief}=context;if(!relief)return;
  for(const a of actors){
    const obstructed=tiles.some(t=>{
      if(context.depth(t)<=context.depth(a.tile)||key(t)===key(a.tile))return false;
      const p=context.project(t.x,t.y,t.z),hasProp=['T','W'].includes(t.terrain)||t.structure?.hp>0||t.device||t.scenery;
      const tall=(t.z||0)>(a.tile.z||0)||hasProp;if(!tall)return false;
      const left=p.x-(hasProp?37:40),right=p.x+(hasProp?37:40),top=p.y-(hasProp?76:20),bottom=p.y+20+(t.z||0)*LEVEL_H;
      return a.x+a.width>left&&a.x<right&&a.y+a.height>top&&a.y<bottom;
    });
    if(obstructed){
      image(root,a.source,a.x,a.y,a.width,a.height,'scene-occluded-unit');
      const proxy=svg('ellipse',{cx:a.point.x,cy:a.point.y+4,rx:21,ry:8,class:'scene-occluded-base','data-unit-proxy':a.id,'data-proxy-position':key(a.tile),'aria-label':`Select ${a.tile.friend?.name||a.tile.enemy?.name} behind terrain`},root);
      proxy.addEventListener('click',e=>{if(context.dragged)return;e.stopPropagation();context.onSelect?.(a.tile);});
      proxy.addEventListener('pointerenter',()=>context.onInspect?.(a.tile));
    }
  }
}

function drawEnforcement(root,context){
  const marked=context.tiles.find(t=>t.marked);if(!marked)return;
  const p=context.project(marked.x,marked.y,marked.z);
  const g=svg('g',{class:'scene-enforcement-lock'},root);
  for(const source of context.enforcers.slice(0,1))svg('path',{d:`M${source.x},${source.y-96}L${p.x},${p.y-81}`,class:'scene-enforcement-link'},g);
  svg('path',{d:`M${p.x},${p.y-95}V${p.y+4}`,class:'scene-target-thread'},g);
  svg('ellipse',{cx:p.x,cy:p.y-81,rx:21,ry:7,class:'scene-target-halo'},g);
  svg('ellipse',{cx:p.x,cy:p.y+3,rx:28,ry:13,class:'scene-target-reticle'},g);
  svg('path',{d:`M${p.x-35},${p.y+3}h13m44,0h13m-35,-19v9m0,20v9`,class:'scene-target-ticks'},g);
  label(g,'MARKED',p.x,p.y-98,'scene-target-label',{'text-anchor':'middle'});
}

function drawEffects(root,context,effects,state){
  for(const effect of effects){
    const effectId=String(effect.id??`${effect.type}:${effect.x},${effect.y}:${effect.round||0}`);
    if(state.seenEffects.has(effectId))continue;
    state.seenEffects.add(effectId);
    const p=context.project(effect.x,effect.y,effect.z||0),g=svg('g',{class:`scene-effect scene-effect-${effect.type}`,'data-effect-id':effectId,'pointer-events':'none'},root);
    if(effect.type==='move'){
      const path=effect.path||[];
      if(path.length>1&&!matchMedia('(prefers-reduced-motion: reduce)').matches){
        const spriteId=effect.spriteId||effect.unitId;
        const start=context.project(path[0].x,path[0].y,path[0].z||0),large=spriteId==='krag'||spriteId==='brute',width=large?72:64,height=large?90:80;
        const moving=svg('g',{class:'scene-moving-unit'},g);
        svg('ellipse',{cx:start.x,cy:start.y+4,rx:19,ry:8,class:'scene-unit-base'},moving);
        image(moving,battleSprite(effect.spriteId||effect.unitId,cameraFacing(effect.direction||'se',context.rotation),false),start.x-width/2,start.y-height*.9,width,height,'scene-unit');
        const final=context.container.querySelector(`.scene-unit[data-unit-id="${effect.unitId}"]`);
        if(final)final.style.opacity='0';
        const duration=Math.min(650,Math.max(180,(path.length-1)*125));g.setAttribute('data-duration',duration);
        const frames=path.map((point,i)=>{const v=context.project(point.x,point.y,point.z||0);return {transform:`translate(${v.x-start.x}px, ${v.y-start.y}px)`,offset:i/(path.length-1)};});
        const animation=moving.animate(frames,{duration,easing:'linear',fill:'forwards'});
        const finish=()=>{if(final)final.style.opacity='';g.remove();};
        animation.finished.then(finish,finish);
      }
    }else if(effect.type==='vaporize'){
      const source=context.enforcers[0]||{x:p.x,y:p.y-180};
      svg('path',{d:`M${source.x},${source.y-95}L${p.x},${p.y-50}L${p.x},${p.y+4}`,class:'scene-execution-beam'},g);
      if(effect.unitId)image(g,battleSprite(effect.unitId,cameraFacing(effect.direction||'se',context.rotation),false),p.x-32,p.y-72,64,80,'scene-execution-figure');
      for(let i=0;i<13;i++)svg('rect',{x:p.x-22+(i*13)%43,y:p.y-8-(i*17)%65,width:2+(i%3),height:2+(i%3),class:'scene-execution-particle',style:`--particle-delay:${i*25}ms`},g);
      svg('ellipse',{cx:p.x,cy:p.y+3,rx:23,ry:8,class:'scene-execution-ring'},g);
    }else if(effect.type==='heal'){
      for(let i=0;i<5;i++)label(g,'+',p.x-20+i*10,p.y-15-(i%2)*14,'scene-heal-mote');
      label(g,`+${effect.amount??4}`,p.x,p.y-68,'scene-heal-value',{'text-anchor':'middle'});
    }else if(effect.type==='command'){
      for(let i=0;i<3;i++)svg('ellipse',{cx:p.x,cy:p.y-5,rx:18+i*12,ry:7+i*5,class:'scene-command-ring',style:`animation-delay:${i*80}ms`},g);
    }else if(effect.type==='hit'){
      svg('path',{d:`M${p.x-24},${p.y-36}l48,18m-41,11 34-41`,class:'scene-hit-spark'},g);
      if(effect.amount)label(g,`−${effect.amount}`,p.x,p.y-66,'scene-hit-value',{'text-anchor':'middle'});
    }else if(effect.type==='debuff'){
      for(let i=0;i<6;i++)svg('circle',{cx:p.x-19+(i*17)%39,cy:p.y-15-(i*13)%34,r:2+(i%2),class:'scene-binding-mote',style:`animation-delay:${i*45}ms`},g);
      svg('ellipse',{cx:p.x,cy:p.y+2,rx:26,ry:10,class:'scene-binding-ring'},g);
    }
    setTimeout(()=>g.remove(),effect.type==='vaporize'?1200:850);
  }
  if(state.seenEffects.size>500)state.seenEffects=new Set([...state.seenEffects].slice(-200));
}

function makeToolbar(container,state){
  const toolbar=document.createElement('div');toolbar.className='scene-toolbar';toolbar.setAttribute('aria-label','Battlefield view controls');
  const add=(cls,text,title,action)=>{const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.title=title;b.setAttribute('aria-label',title);b.onclick=()=>{action();updateView(state);if(!b.isConnected)state.toolbar.querySelector(`.${cls}`)?.focus({preventScroll:true});};toolbar.append(b);return b;};
  add('scene-zoom-out','−','Zoom battlefield out',()=>state.zoom=Math.max(.65,state.zoom-.2));
  add('scene-zoom-in','+','Zoom battlefield in',()=>state.zoom=Math.min(2.5,state.zoom+.2));
  add('scene-pan-left','←','Pan battlefield left',()=>state.panX-=90/state.zoom);
  add('scene-pan-up','↑','Pan battlefield up',()=>state.panY-=65/state.zoom);
  add('scene-pan-down','↓','Pan battlefield down',()=>state.panY+=65/state.zoom);
  add('scene-pan-right','→','Pan battlefield right',()=>state.panX+=90/state.zoom);
  add('scene-rotate-left','↶ Rotate','Rotate battlefield left (Q)',()=>state.rotate(-1)).setAttribute('aria-keyshortcuts','Q');
  add('scene-rotate-right','Rotate ↷','Rotate battlefield right (E)',()=>state.rotate(1)).setAttribute('aria-keyshortcuts','E');
  const orientation=document.createElement('span');orientation.className='scene-orientation';orientation.setAttribute('role','status');toolbar.append(orientation);
  add('scene-reset','Reset','Reset battlefield view',()=>{state.zoom=1;state.panX=0;state.panY=0;state.rotation=0;state.redraw();});
  const labels=add('scene-labels','Coordinates','Toggle coordinate and height labels',()=>state.labels=!state.labels);labels.setAttribute('aria-pressed',state.labels);
  const hint=document.createElement('span');hint.className='scene-toolbar-hint';hint.textContent='Drag to pan · Q/E rotate · arrows navigate tiles';toolbar.append(hint);
  container.append(toolbar);state.toolbar=toolbar;
}

function updateView(state){
  const svgNode=state.svg;if(!svgNode)return;
  const width=state.container.clientWidth||900,height=Math.max(380,Math.min(650,width*.66));
  const fit=Math.min(width/state.bounds.width,height/state.bounds.height);
  const scale=Math.max(.8,fit)*state.zoom;
  const viewW=width/scale,viewH=height/scale;
  const x=state.bounds.x+state.bounds.width/2-viewW/2+state.panX,y=state.bounds.y+state.bounds.height/2-viewH/2+state.panY;
  svgNode.setAttribute('viewBox',`${x} ${y} ${viewW} ${viewH}`);svgNode.style.height=`${height}px`;
  svgNode.dataset.zoom=state.zoom.toFixed(2);svgNode.dataset.panX=state.panX;svgNode.dataset.panY=state.panY;
  svgNode.dataset.rotation=state.rotation;
  const north=(state.scene.relief?['↗','↘','↙','↖']:['↑','→','↓','←'])[state.rotation];
  const orientation=state.toolbar?.querySelector('.scene-orientation');if(orientation)orientation.textContent=`N ${north} · ${state.rotation+1}/4`;
  state.scene.onViewChange?.({rotation:state.rotation,north});
  state.container.classList.toggle('scene-hide-coordinates',!state.labels);
  state.toolbar?.querySelector('.scene-labels')?.setAttribute('aria-pressed',state.labels);
}

export function renderBattleScene(container,{map,heights,theme='reedwater',relief=true,tiles=[],effects=[],missionKey=null,onSelect,onInspect,onViewChange}){
  let state=views.get(container);
  if(!state){
    state={container,zoom:1,panX:0,panY:0,rotation:0,labels:false,path:[],lastMap:null,enforcing:false,seenEffects:new Set()};views.set(container,state);
    state.resizeObserver=new ResizeObserver(()=>updateView(state));state.resizeObserver.observe(container);
    container.addEventListener('keydown',event=>{
      if(event.ctrlKey||event.altKey||event.metaKey||!['q','e'].includes(event.key.toLowerCase()))return;
      event.preventDefault();const button=event.target.closest('button')?.className;state.rotate(event.key.toLowerCase()==='q'?-1:1);
      if(button)state.toolbar.querySelector(`.${button}`)?.focus({preventScroll:true});
    });
  }
  const mapKey=missionKey??map;
  if(state.lastMap!==mapKey){state.zoom=1;state.panX=0;state.panY=0;state.rotation=0;state.path=[];state.enforcing=false;state.seenEffects.clear();state.lastMap=mapKey;}
  state.scene={map,heights,theme,relief,tiles,missionKey:mapKey,onSelect,onInspect,onViewChange};
  state.redraw=()=>renderBattleScene(container,state.scene);
  state.rotate=step=>{
    const {panX:x,panY:y}=state;
    // Rotate the camera offset with the map so an existing pan remains useful.
    state.panX=step>0?(relief?-2*y:-64*y/54):(relief?2*y:64*y/54);
    state.panY=step>0?(relief?x/2:54*x/64):(relief?-x/2:-54*x/64);
    state.rotation=cameraTurn(state.rotation+step);state.redraw();
  };
  const project=(x,y,z=0)=>projectBattlePoint(x,y,z,relief,state.rotation);
  const depth=t=>{const p=rotateBattlePoint(t.x,t.y,state.rotation);return p.x+p.y;};
  const previousFocus=container.querySelector('[data-position]:focus')?.dataset.position;
  container.replaceChildren();container.classList.add('battle-scene-root');container.classList.toggle('scene-tactical-view',!relief);container.classList.toggle('scene-under-enforcement',tiles.some(t=>t.police));
  makeToolbar(container,state);
  const root=svg('svg',{class:'battle-scene-svg',role:'group','aria-label':`${relief?'Isometric battlefield. X and Y follow the ground plane; Z is terrain height.':'Tactical battlefield. Tile labels report terrain height.'} View ${state.rotation+1} of 4.`,preserveAspectRatio:'xMidYMid meet'},container);
  state.svg=root;const id=`scene-${container.id||'map'}`;
  const palette=makeDefs(root,theme,id),allPoints=tiles.map(t=>project(t.x,t.y,t.z));
  const minX=Math.min(...allPoints.map(p=>p.x))-80,maxX=Math.max(...allPoints.map(p=>p.x))+80,minY=Math.min(...allPoints.map(p=>p.y))-170,maxY=Math.max(...allPoints.map(p=>p.y))+90;
  state.bounds={x:minX,y:minY,width:maxX-minX,height:maxY-minY};
  const hasEnforcement=tiles.some(t=>t.police);
  const context={container,map,heights,theme,relief,tiles,palette,id,onSelect,onInspect,rotation:state.rotation,project,depth,actors:[],enforcers:[],structureLabels:[],dragged:false,arrival:hasEnforcement&&!state.enforcing};
  state.enforcing=hasEnforcement;
  const background=svg('rect',{x:minX-800,y:minY-800,width:maxX-minX+1600,height:maxY-minY+1600,class:'scene-background'},root);
  const board=svg('g',{class:'scene-world'},root);
  for(const t of [...tiles].sort((a,b)=>depth(a)-depth(b)||rotateBattlePoint(a.x,a.y,state.rotation).y-rotateBattlePoint(b.x,b.y,state.rotation).y)){
    const p=project(t.x,t.y,t.z),g=svg('g',{'data-world-position':key(t)},board);
    drawSurface(g,t,p,context);drawProp(g,t,p,context);drawActor(g,t,p,context);
  }
  const ghost=svg('g',{class:'scene-occlusion-overlay','pointer-events':'none'},root);drawVisibleUnits(ghost,context);
  const healthOverlay=svg('g',{class:'scene-structure-labels','pointer-events':'none'},root);healthOverlay.append(...context.structureLabels);
  const enforcement=svg('g',{class:'scene-enforcement-layer','pointer-events':'none'},root);
  let index=0;for(const t of tiles.filter(t=>t.police))drawEnforcer(enforcement,t,project(t.x,t.y,t.z),context,index++);
  drawEnforcement(enforcement,context);
  drawEffects(enforcement,context,effects,state);
  const axes=svg('g',{class:'scene-world-axes','pointer-events':'none'},root),turn=state.rotation;
  label(axes,`X ${(relief?['↘','↙','↖','↗']:['→','↓','←','↑'])[turn]}`,minX+42,maxY-22,'scene-axis-label');
  label(axes,`Y ${(relief?['↙','↖','↗','↘']:['↓','←','↑','→'])[turn]}`,minX+112,maxY-22,'scene-axis-label');
  label(axes,'Z ↑',minX+182,maxY-22,'scene-axis-label');
  let drag=null;
  root.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,panX:state.panX,panY:state.panY};context.dragged=false;});
  root.addEventListener('pointermove',e=>{if(!drag)return;const factor=(state.bounds.width/(container.clientWidth||900))/state.zoom;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)<=5&&!context.dragged)return;context.dragged=true;root.setPointerCapture(e.pointerId);state.panX=drag.panX-dx*factor;state.panY=drag.panY-dy*factor;updateView(state);});
  root.addEventListener('pointerup',e=>{drag=null;if(root.hasPointerCapture(e.pointerId))root.releasePointerCapture(e.pointerId);setTimeout(()=>context.dragged=false,0);});
  root.addEventListener('pointercancel',()=>drag=null);
  updateView(state);
  highlightScenePath(container,state.path);
  if(previousFocus)container.querySelector(`[data-position="${previousFocus}"]`)?.focus({preventScroll:true});
}

export function highlightScenePath(container,path=[]){
  const state=views.get(container);if(state)state.path=path.map(p=>({...p}));
  const keys=new Set(path.map(key));
  for(const node of container.querySelectorAll('[data-path-position]')){
    const active=keys.has(node.dataset.pathPosition);node.toggleAttribute('hidden',!active);node.classList.toggle('is-route',active);
  }
}
