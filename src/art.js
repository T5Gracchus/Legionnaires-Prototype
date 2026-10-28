// Presentation only. Terrain and collision continue to come from mission.js.
import {battleSprite,terrainTexture,terrainProp} from './battle-assets.js';

// Illustration paths belong to menu/inspection UI. Battle assets deliberately use
// a separate mapping so replacing a map sprite cannot replace a preparation card.
export const spritePath = id => `/assets/sprites/${['centurion', 'shield', 'sword', 'enemy'].includes(id) ? id : 'legionnaire'}.png`;
export function spriteMarkup(id, label, extra = '') {
  return `<span class="unit-sprite sprite-${id} ${extra}" aria-hidden="true"><img src="${spritePath(id)}" alt="" draggable="false"><b class="unit-label">${label}</b></span>`;
}
const romanBattleId=id=>['centurion','shield','sword'].includes(id)?id:id==='enemy'?'spear':'legionnaire';
export function battleSpriteMarkup(id,label,extra='') {
  const mapped=romanBattleId(id);
  return `<span class="unit-sprite roman-battle-sprite sprite-${id} ${extra}" aria-hidden="true"><img src="${battleSprite(mapped,'se',extra.split(/\s+/).includes('fallen'))}" alt="" draggable="false"><b class="unit-label">${label}</b></span>`;
}
export function romanTerrainArt(type) {
  const kind={T:'tree',W:'wagon',R:'extraction'}[type];
  return kind?`<img class="roman-terrain-prop roman-prop-${kind}" src="${terrainProp('roman',kind)}" alt="" draggable="false">`:'';
}
export const romanTileTexture=type=>terrainTexture('roman',type==='~'?'water':'ground');
export const romanCasualtyArt=()=>`<img class="roman-casualty-art" src="${terrainProp('roman','casualty')}" alt="" draggable="false">`;
const svg = body => `<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${body}</svg>`;
export function terrainArt(type) {
  if (type === 'T') return svg('<ellipse cx="52" cy="81" rx="39" ry="12" fill="#17291d" opacity=".45"/><path d="M47 47h10l4 41H43z" fill="#5c4631"/><path d="M50 7 16 49h14L10 68h22L21 80h60L68 67h22L71 48h13z" fill="#233b2a" stroke="#192f22" stroke-width="3"/><path d="m50 9-22 39h17L25 67h23l-8 10h28L56 61h16L55 42h14z" fill="#476447"/><path d="m50 12-6 27 13-2z" fill="#769067" opacity=".6"/>');
  if (type === 'W') return svg('<ellipse cx="50" cy="77" rx="43" ry="13" fill="#211c13" opacity=".35"/><path d="m25 70-11 18m62-22 12 17" stroke="#9a7950" stroke-width="5"/><g fill="#322b23" stroke="#b29568" stroke-width="3"><circle cx="20" cy="38" r="11"/><circle cx="80" cy="38" r="11"/><circle cx="20" cy="68" r="11"/><circle cx="80" cy="68" r="11"/></g><path d="M23 20h54v54H23z" fill="#745639" stroke="#392c20" stroke-width="4"/><path d="M28 30h44M28 43h44M28 56h44M34 23v48M65 23v48" stroke="#b58d5a" stroke-width="3"/><path d="m33 27 27-5 10 29-31 6z" fill="#b8ac84" stroke="#6c6249" stroke-width="2"/><path d="m38 28 8 26m11-30 8 25" stroke="#74664b" stroke-width="3"/>');
  if (type === '~') return svg('<g fill="none" stroke-linecap="round"><path d="M-7 24q14-8 28 0t28 0 28 0 28 0M-8 57q14-8 28 0t28 0 28 0 28 0M7 85q14-6 28 0t28 0 28 0" stroke="#b6d5ce" stroke-width="2" opacity=".42"/><path d="M20 37h19m29 32h22M57 13h21" stroke="#d5e9d9" stroke-width="2" opacity=".35"/></g>');
  if (type === 'R') return svg('<path d="M68 19v62" stroke="#c8ae75" stroke-width="3"/><path d="m70 19 20 5-5 16-15-4z" fill="#bd5140" stroke="#753d30" stroke-width="2"/><path d="m73 23 11 3-2 8-9-2z" fill="#ddb774" opacity=".7"/>');
  return '';
}
export const casualtyArt = svg('<ellipse cx="50" cy="78" rx="38" ry="9" fill="#19251c" opacity=".4"/><path d="m18 67 56-35 14 23-56 35z" fill="#c7b78b" stroke="#5b5037" stroke-width="3"/><path d="m22 62 48-27m-40 48 48-28" stroke="#b08b56" stroke-width="4"/><circle cx="32" cy="65" r="11" fill="#a77d58" stroke="#443e2d" stroke-width="3"/><path d="m42 56 23-15 12 17-24 17z" fill="#a74737"/><path d="m68 68 9 9m-9 0 9-9" stroke="#f9e6b1" stroke-width="4"/>');
