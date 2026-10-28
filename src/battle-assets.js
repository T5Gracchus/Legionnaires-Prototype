// Battle assets are deliberately separate from assets/sprites, which remains
// the illustrated menu/portrait collection. Never redirect menu image helpers here.
const root='/assets/battle';
const ids=new Set(['centurion','shield','sword','legionnaire','aer','bound','murr','krag','spear','sling','brute','healer','hexer','commander']);
export function battleSprite(id,direction='se',fallen=false){
  const key=ids.has(id)?id:id==='enemy'?'spear':'legionnaire';
  return `${root}/units/${key}-${fallen?'fallen':['se','sw','ne','nw'].includes(direction)?direction:'se'}.png`;
}
export function terrainTexture(theme='reedwater',type='ground'){
  if(type==='water')return `${root}/terrain/water.png`;
  const key=theme==='roman'?'reedwater':['basalt','spores','reedwater'].includes(theme)?theme:'reedwater';
  return `${root}/terrain/${key}-ground.png`;
}
export function terrainProp(theme,type){
  const key={T:'tree',W:'rubble',X:'extraction',R:'extraction',stretcher:'casualty'}[type]||type;
  return `${root}/props/${['tree','rubble','wagon','casualty','extraction','relay','salvage','captive','control-spire','ferry-beacon','generator','escort-cart','archive','sluice','barricade','barricade-broken'].includes(key)?key:'rubble'}.png`;
}
export function enforcerSprite(){return `${root}/enforcer.png`;}
