// Playtest assumptions, not approved design rules. See docs/PLAYTEST_RULES.md.
export const RULES = { move: 4, carryMove: 2, defendReduction: 2, blockReduction: 2, reviveFraction: 0.25, enemyMove: 2 };
export const ENEMY_COMBAT = { maxHp: 7, dodge: 0.05, block: 0.1, damage: [1, 3], range: 1 };
export const PLAYER_DEFENSE = {
  centurion: { dodge: 0.1, block: 0.2 },
  shield: { dodge: 0.05, block: 0.3 },
  sword: { dodge: 0.15, block: 0.1 },
  supporting: { dodge: 0.05, block: 0.15 },
};
export const defenseReduction = u => u.defending ? RULES.defendReduction + (u.id === 'shield' ? 1 : 0) : 0;
export function weapon(u, action) {
  if (action === 'javelin') return { damage: u.id === 'shield' ? [3, 5] : [2, 4], range: u.id === 'shield' ? 4 : 3 };
  return { damage: [u.damage - 1, u.damage + 1], range: 1 };
}
// Dodge first; block is a separate chance on hits that were not dodged.
// Inject randomness in tests so combat assertions are repeatable.
export function resolveHit(target, damageRange, random = Math.random) {
  if (random() < (target.dodge ?? 0)) return { damage: 0, rolled: 0, dodged: true, blocked: false, reduction: 0 };
  const [min, max] = damageRange;
  const rolled = min + Math.floor(random() * (max - min + 1));
  const blocked = random() < (target.block ?? 0);
  const reduction = defenseReduction(target) + (blocked ? RULES.blockReduction : 0);
  const damage = Math.max(0, rolled - reduction);
  target.hp = Math.max(0, target.hp - damage);
  return { damage, rolled, dodged: false, blocked, reduction };
}
function hitReport(attacker, target, result) {
  if (result.dodged) return `${attacker} attacks ${target.name || 'enemy'}: dodged (0 damage).`;
  return `${attacker} attacks ${target.name || 'enemy'}: ${result.damage} damage (${result.rolled} rolled${result.blocked ? ', blocked' : ''}${result.reduction ? `, ${result.reduction} reduction` : ''})${target.hp === 0 ? ', target falls' : ''}.`;
}
export const MAP = [
  '..T.......TT',
  '.....T......',
  'RR..W...T...',
  'RR..W.......',
  'RR.....W....',
  '~~~~..~~~~~~',
  '....T...W...',
  '..T.........',
  '......T.....',
];
export const WIDTH = MAP[0].length;
export const HEIGHT = MAP.length;
export const terrain = (x, y) => MAP[y]?.[x];
export const passable = (x, y) => ['.', 'R'].includes(terrain(x, y));
export const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
export const freshActions = () => ({ move: true, act: true, interact: true });
export function createMission() {
  const specs = [
    ['centurion', 'Centurion', 'C', 1, 3, 12, 4, 4, 'Command / full revive'],
    ['shield', 'Shield brother', 'B1', 2, 2, 11, 3, 4, 'Javelin / defense'],
    ['sword', 'Sword brother', 'B2', 2, 4, 10, 4, 5, 'Speed / sword'],
    ['one', 'Legionnaire I', 'L1', 2, 3, 9, 3, 4, 'Supporting soldier'],
    ['two', 'Legionnaire II', 'L2', 3, 2, 9, 3, 4, 'Supporting soldier'],
    ['three', 'Legionnaire III', 'L3', 3, 4, 9, 3, 4, 'Supporting soldier'],
  ];
  return {
    round: 1, status: 'playing', fullReviveUsed: false, rescued: 0,
    units: specs.map(([id, name, token, x, y, maxHp, damage, move, role]) => ({ id, name, token, x, y, maxHp, hp: maxHp, damage, move, role, ...(PLAYER_DEFENSE[id] || PLAYER_DEFENSE.supporting), ammo: id === 'shield' ? 3 : 2, carrying: null, defending: false, actions: freshActions() })),
    casualties: [{ id: 'a', x: 6, y: 2 }, { id: 'b', x: 9, y: 4 }, { id: 'c', x: 7, y: 7 }].map(c => ({ ...c, state: 'ground' })),
    enemies: [{ id: 'e1', x: 8, y: 3 }, { id: 'e2', x: 10, y: 6 }, { id: 'e3', x: 5, y: 8 }].map(e => ({ ...e, ...ENEMY_COMBAT, hp: ENEMY_COMBAT.maxHp })),
    log: ['Recover the wounded and return to the rally ground. Capture follows withdrawal.'],
  };
}
export const unitAt = (s, x, y) => s.units.find(u => u.x === x && u.y === y);
export const enemyAt = (s, x, y) => s.enemies.find(e => e.hp > 0 && e.x === x && e.y === y);
export const casualtyAt = (s, x, y) => s.casualties.find(c => c.state === 'ground' && c.x === x && c.y === y);
const occupied = (s, x, y) => unitAt(s, x, y) || enemyAt(s, x, y);
const neighbors = p => [[p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]];
export function reachable(s, unit, allowance = unit.carrying ? RULES.carryMove : unit.move) {
  const result = new Map();
  const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
  const seen = new Set([`${unit.x},${unit.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p.cost >= allowance) continue;
    for (const [x, y] of neighbors(p)) {
      const key = `${x},${y}`;
      if (seen.has(key) || !passable(x, y) || occupied(s, x, y)) continue;
      seen.add(key);
      const next = { x, y, cost: p.cost + 1 };
      result.set(key, next); queue.push(next);
    }
  }
  return result;
}
function lineClear(a, b) {
  let x = a.x, y = a.y;
  const dx = Math.abs(b.x - x), dy = Math.abs(b.y - y);
  const sx = x < b.x ? 1 : -1, sy = y < b.y ? 1 : -1;
  let error = dx - dy;
  while (x !== b.x || y !== b.y) {
    const twice = 2 * error;
    if (twice > -dy) { error -= dy; x += sx; }
    if (twice < dx) { error += dx; y += sy; }
    if (['T', 'W'].includes(terrain(x, y))) return false;
  }
  return true;
}
export function canTarget(s, u, action, x, y) {
  if (s.status !== 'playing' || !u || u.hp <= 0) return false;
  const target = { x, y }, d = distance(u, target);
  const friend = unitAt(s, x, y), enemy = enemyAt(s, x, y);
  switch (action) {
    case 'move': return u.actions.move && reachable(s, u).has(`${x},${y}`);
    case 'sword': return u.actions.act && !u.carrying && !!enemy && d === 1;
    case 'javelin': return u.actions.act && !u.carrying && u.ammo > 0 && !!enemy && d <= weapon(u, action).range && lineClear(u, target);
    case 'pickup': return u.actions.interact && !u.carrying && d <= 1 && !!casualtyAt(s, x, y);
    case 'revive': case 'fullRevive': return u.actions.interact && !u.carrying && d === 1 && friend?.hp === 0 && (action !== 'fullRevive' || (u.id === 'centurion' && !s.fullReviveUsed));
    default: return false;
  }
}
const record = (s, message) => { s.log.push(message); if (s.log.length > 60) s.log.shift(); };
export function act(s, id, action, x, y, random = Math.random) {
  const u = s.units.find(u => u.id === id);
  if (s.status !== 'playing' || !u || u.hp <= 0) return false;
  if (action === 'defend') {
    if (!u.actions.act) return false;
    u.actions.act = false; u.defending = true;
    record(s, `${u.name} defends until the next player turn.`); return true;
  }
  if (action === 'drop') {
    if (!u.actions.interact || !u.carrying || casualtyAt(s, u.x, u.y)) return false;
    const c = s.casualties.find(c => c.id === u.carrying);
    c.x = u.x; c.y = u.y;
    c.state = terrain(u.x, u.y) === 'R' ? 'rescued' : 'ground';
    if (c.state === 'rescued') s.rescued++;
    u.carrying = null; u.actions.interact = false;
    record(s, c.state === 'rescued' ? `${u.name} evacuates a casualty (${s.rescued}/3).` : `${u.name} puts the casualty down.`);
    return true;
  }
  if (!canTarget(s, u, action, x, y)) return false;
  if (action === 'move') { u.x = x; u.y = y; u.actions.move = false; }
  if (action === 'sword' || action === 'javelin') {
    const e = enemyAt(s, x, y);
    const result = resolveHit(e, weapon(u, action).damage, random);
    u.actions.act = false;
    if (action === 'javelin') u.ammo--;
    record(s, hitReport(`${u.name} (${action})`, e, result));
  }
  if (action === 'pickup') {
    const c = casualtyAt(s, x, y); c.state = 'carried'; u.carrying = c.id; u.actions.interact = false;
    record(s, `${u.name} carries a casualty. Movement reduced to 2; attacks unavailable.`);
  }
  if (action === 'revive' || action === 'fullRevive') {
    const friend = unitAt(s, x, y);
    friend.hp = action === 'fullRevive' ? friend.maxHp : Math.ceil(friend.maxHp * RULES.reviveFraction);
    friend.actions = { move: false, act: false, interact: false };
    u.actions.interact = false;
    if (action === 'fullRevive') s.fullReviveUsed = true;
    record(s, `${u.name} revives ${friend.name} to ${friend.hp} health. They act next round.`);
  }
  return true;
}
function enemyStep(s, e) {
  // Breadth-first route to a tile adjacent to a standing Roman.
  const living = s.units.filter(u => u.hp > 0);
  const queue = [{ x: e.x, y: e.y, path: [] }], seen = new Set([`${e.x},${e.y}`]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (living.some(u => distance(p, u) === 1)) return p.path.slice(0, RULES.enemyMove).at(-1) || e;
    for (const [x, y] of neighbors(p)) {
      const key = `${x},${y}`;
      if (seen.has(key) || !passable(x, y) || occupied(s, x, y)) continue;
      seen.add(key); queue.push({ x, y, path: [...p.path, { x, y }] });
    }
  }
  return e;
}
export function endTurn(s, random = Math.random) {
  if (s.status !== 'playing') return false;
  for (const e of s.enemies.filter(e => e.hp > 0)) {
    const next = enemyStep(s, e); e.x = next.x; e.y = next.y;
    const target = s.units.filter(u => u.hp > 0 && distance(e, u) === 1).sort((a, b) => a.hp - b.hp)[0];
    if (target) {
      const result = resolveHit(target, e.damage || ENEMY_COMBAT.damage, random);
      record(s, hitReport('Enemy', target, result));
      if (target.hp === 0) {
        target.actions = { move: false, act: false, interact: false };
        if (target.carrying) {
          const c = s.casualties.find(c => c.id === target.carrying);
          c.state = 'ground'; c.x = target.x; c.y = target.y; target.carrying = null;
        }
      }
    }
  }
  if (s.units.every(u => u.hp === 0)) { s.status = 'defeat'; record(s, 'The squad has fallen. Restart to try again.'); return true; }
  s.round++;
  if ([3, 5, 7].includes(s.round)) {
    const spawn = [{ x: 11, y: 1 }, { x: 11, y: 8 }].find(p => !occupied(s, p.x, p.y));
    if (spawn) { s.enemies.push({ id: `reinforcement-${s.round}`, ...spawn, ...ENEMY_COMBAT, hp: ENEMY_COMBAT.maxHp }); record(s, 'An enemy reinforcement arrives from the east.'); }
  }
  for (const u of s.units) { u.defending = false; if (u.hp > 0) u.actions = freshActions(); }
  record(s, `Round ${s.round}: your orders.`); return true;
}
export const canWithdraw = s => s.status === 'playing' && s.units.every(u => u.hp > 0 && terrain(u.x, u.y) === 'R' && !u.carrying);
export function withdraw(s) {
  if (!canWithdraw(s)) return false;
  s.status = 'captured';
  record(s, `The squad escapes the ambush with ${s.rescued} of 3 casualties. Their apparent deliverance ends in capture.`);
  return true;
}
