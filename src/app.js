import { createMission, WIDTH, HEIGHT, terrain, unitAt, enemyAt, casualtyAt, canTarget, act, endTurn, withdraw, canWithdraw, weapon, RULES, ENEMY_COMBAT } from './mission.js';
import { OPENING_PREMISE, CHARACTER_CONTEXT, missionDebrief } from './story.js';

let state = createMission(), selected = 'centurion', order = 'move';
const $ = id => document.getElementById(id);
const orders = [
  ['move', 'Move', 'move', 'Select an outlined tile. Movement is spent in one action.'],
  ['sword', 'Sword', 'act', 'Strike an adjacent enemy.'],
  ['javelin', 'Javelin', 'act', 'Throw at an enemy in range. Trees and wagons block the shot.'],
  ['defend', 'Defend', 'act', 'Reduce incoming damage until the next player turn. Applies immediately.'],
  ['pickup', 'Carry wounded', 'interact', 'Select a carry-only casualty on this or an adjacent tile.'],
  ['drop', 'Put down / Evacuate', 'interact', 'Put down your casualty; on rally ground they are evacuated. Applies immediately.'],
  ['revive', 'Revive · 25%', 'interact', 'Select an adjacent fallen squad member. They act next round.'],
  ['fullRevive', 'Full revive', 'interact', 'Centurion only. Restore an adjacent fallen soldier to full health, once per mission.'],
];
const terrainNames = { '.': 'path', T: 'trees', W: 'wagon', '~': 'stream', R: 'rally ground' };
const percent = n => `${Math.round(n * 100)}%`;
const damageText = w => `${w.damage.join('–')} damage · range ${w.range}`;
function orderHelp(u, key, fallback) {
  if (key === 'sword' || key === 'javelin') return `${damageText(weapon(u, key))} tile${key === 'javelin' ? 's (horizontal + vertical distance). Throws cross water; trees and wagons block shots. Costs 1 Act and 1 javelin, even if dodged.' : '. Costs 1 Act, even if dodged.'} Damage is before block and Defend reductions.`;
  if (key === 'defend') return `Costs 1 Act. Reduces every incoming hit by ${RULES.defendReduction + (u.id === 'shield' ? 1 : 0)} until your next turn. Stacks with a successful block.`;
  return fallback;
}
function soldier() { return state.units.find(u => u.id === selected); }
function available(u, key, category) {
  if (state.status !== 'playing' || u.hp <= 0 || !u.actions[category]) return false;
  if (['sword', 'javelin', 'revive', 'fullRevive', 'pickup'].includes(key) && u.carrying) return false;
  if (key === 'javelin' && u.ammo === 0) return false;
  if (key === 'drop' && (!u.carrying || casualtyAt(state, u.x, u.y))) return false;
  if (key === 'fullRevive' && (u.id !== 'centurion' || state.fullReviveUsed)) return false;
  return true;
}
function select(id) { selected = id; order = 'move'; render(); }
function render() {
  const u = soldier();
  $('enemy-info').textContent = `Enemies: ${damageText(ENEMY_COMBAT)} · dodge ${percent(ENEMY_COMBAT.dodge)} · block ${percent(ENEMY_COMBAT.block)} on non-dodged hits (−${RULES.blockReduction} damage). Hover or focus an enemy for details.`;
  $('rescued').textContent = `${state.rescued} / 3`;
  $('phase').textContent = `ROUND ${String(state.round).padStart(2, '0')} / ${state.status === 'playing' ? 'YOUR TURN' : state.status.toUpperCase()}`;
  $('end-turn').disabled = state.status !== 'playing';
  $('withdraw').disabled = !canWithdraw(state);
  $('withdraw').title = 'Return all six standing soldiers to rally ground and put down carried casualties.';
  $('selected').innerHTML = `<p class="eyebrow">SELECTED SOLDIER</p><h2>${u.name}</h2><p class="role">${u.role}</p><div class="health"><span style="width:${100 * u.hp / u.maxHp}%"></span></div><p class="stats">${u.hp} / ${u.maxHp} health <span>${u.ammo} javelins</span></p><div class="budgets">${[['move', 'Move'], ['act', 'Act'], ['interact', 'Item / Special']].map(([k, label]) => `<span class="${u.hp > 0 && u.actions[k] ? 'ready' : 'spent'}">${u.hp > 0 && u.actions[k] ? '●' : '○'} ${label}</span>`).join('')}</div><p class="condition">${u.hp === 0 ? 'Fallen · needs an adjacent soldier to revive' : u.carrying ? 'Carrying wounded · move 2 · cannot attack' : u.defending ? 'Defending · protected this enemy turn' : `Move ${u.move}`}</p>`;
  $('actions').replaceChildren();
  $('selected').insertAdjacentHTML('beforeend', `<p class="condition">Dodge ${percent(u.dodge)} · Block ${percent(u.block)}<br>Block reduces damage by ${RULES.blockReduction} on a non-dodged hit.</p><p class="condition">Sword: ${damageText(weapon(u, 'sword'))}<br>Javelin: ${damageText(weapon(u, 'javelin'))}</p>`);
  const background = document.createElement('details');
  const backgroundLabel = document.createElement('summary'); backgroundLabel.textContent = 'About this soldier';
  const backgroundText = document.createElement('p'); backgroundText.textContent = CHARACTER_CONTEXT[u.id] || CHARACTER_CONTEXT.supporting;
  background.append(backgroundLabel, backgroundText); $('selected').append(background);
  for (const [key, label, category, help] of orders) {
    const b = document.createElement('button');
    b.innerHTML = `<span>${label}</span><small>${category === 'interact' ? 'ITEM / SPECIAL' : category.toUpperCase()}</small>`;
    if (key === 'sword' || key === 'javelin') b.insertAdjacentHTML('beforeend', `<span class="weapon-detail">${damageText(weapon(u, key))}</span>`);
    if (key === 'defend') b.insertAdjacentHTML('beforeend', `<span class="weapon-detail">−${RULES.defendReduction + (u.id === 'shield' ? 1 : 0)} incoming damage</span>`);
    b.className = order === key ? 'chosen' : '';
    b.disabled = !available(u, key, category); b.title = orderHelp(u, key, help);
    b.onclick = () => {
      if (key === 'defend' || key === 'drop') { act(state, selected, key); order = 'move'; }
      else order = key;
      render();
    };
    $('actions').append(b);
  }
  $('action-help').textContent = orderHelp(u, order, orders.find(a => a[0] === order)[3]);
  $('board').replaceChildren();
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const t = terrain(x, y), friend = unitAt(state, x, y), enemy = enemyAt(state, x, y), casualty = casualtyAt(state, x, y);
    const legal = canTarget(state, u, order, x, y);
    const tile = document.createElement('button');
    tile.className = `tile terrain-${t === '~' ? 'water' : t} ${legal ? 'legal' : ''} ${friend?.id === selected ? 'selected' : ''}`;
    tile.setAttribute('aria-label', `${String.fromCharCode(65 + x)}${y + 1}: ${terrainNames[t]}${friend ? `, ${friend.name}, ${friend.hp} health${friend.carrying ? ', carrying casualty' : ''}` : ''}${enemy ? `, enemy, ${enemy.hp} health` : ''}${casualty ? ', wounded casualty, carry to safety' : ''}${legal ? `, valid ${order} target` : ''}`);
    tile.title = tile.getAttribute('aria-label');
    if (enemy) {
      const info = `Enemy: ${damageText(enemy)}. Dodge ${percent(enemy.dodge)}, block ${percent(enemy.block)} (reduces damage by ${RULES.blockReduction}).`;
      tile.title += ` — ${info}`;
      tile.onmouseenter = tile.onfocus = () => { $('enemy-info').textContent = info; };
    }
    tile.innerHTML = `<span class="terrain-art" aria-hidden="true">${t === 'T' ? '♠' : t === 'W' ? '▤' : t === '~' ? '≈' : ''}</span>`;
    if (friend) tile.innerHTML += `<span class="token roman ${friend.hp === 0 ? 'fallen' : ''}">${friend.hp === 0 ? '↓' : friend.token}</span><span class="tile-health"><i style="width:${friend.hp / friend.maxHp * 100}%"></i></span>${friend.carrying ? '<span class="carry-badge">+</span>' : ''}`;
    if (enemy) tile.innerHTML += `<span class="token enemy">E</span><span class="tile-health enemy-health"><i style="width:${enemy.hp / enemy.maxHp * 100}%"></i></span>`;
    if (casualty) tile.innerHTML += `<span class="${friend || enemy ? 'casualty-badge' : 'token wounded'}">+</span>`;
    tile.onclick = () => {
      if (legal) { act(state, selected, order, x, y); render(); }
      else if (friend) select(friend.id);
      else $('hint').textContent = `No valid ${orders.find(a => a[0] === order)[1].toLowerCase()} target here. Choose an outlined tile or another order.`;
    };
    $('board').append(tile);
  }
  const currentOrder = orders.find(a => a[0] === order);
  const hasTargets = $('board').querySelector('.legal');
  $('hint').textContent = state.status !== 'playing' ? 'Mission ended. Review the battlefield or restart.' : !available(u, order, currentOrder[2]) ? `${u.name} · ${currentOrder[1]} unavailable. Choose another order or soldier.` : `${u.name} · ${currentOrder[1]} selected. ${hasTargets ? 'Outlined tiles are valid targets.' : 'No targets in reach. Choose another order or reposition.'}`;
  $('roster').replaceChildren();
  for (const member of state.units) {
    const card = document.createElement('button'); card.className = `roster-card ${member.id === selected ? 'chosen' : ''}`;
    card.innerHTML = `<span class="roster-token">${member.token}</span><strong>${member.name}</strong><span>${member.hp} / ${member.maxHp} HP ${member.carrying ? '· carrying +' : member.hp === 0 ? '· FALLEN' : ''}</span><small>${[['move', 'M'], ['act', 'A'], ['interact', 'I']].map(([k, l]) => `${l} ${member.hp > 0 && member.actions[k] ? '●' : '○'}`).join('　')}</small>`;
    card.onclick = () => select(member.id); $('roster').append(card);
  }
  $('log').replaceChildren(...state.log.slice(-7).reverse().map(message => { const li = document.createElement('li'); li.textContent = message; return li; }));
}
function ending() {
  const debrief = missionDebrief(state);
  if (!debrief) return;
  $('ending-label').textContent = debrief.label;
  $('ending-title').textContent = debrief.title;
  $('ending-summary').textContent = debrief.summary;
  $('ending-text').textContent = debrief.text;
  $('ending').showModal();
}
function reset() { state = createMission(); selected = 'centurion'; order = 'move'; $('ending').close(); render(); }
$('end-turn').onclick = () => { endTurn(state); order = 'move'; render(); ending(); };
$('withdraw').onclick = () => { if (withdraw(state)) { render(); ending(); } };
$('restart').onclick = () => { if (confirm('Restart this mission? Current progress will be lost.')) reset(); };
$('play-again').onclick = reset;
$('review').onclick = () => $('ending').close();
$('opening-premise').textContent = OPENING_PREMISE;
render();
