import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, act as performAct, endTurn as finishTurn, reachable, canTarget, withdraw, canWithdraw, freshActions, passable, resolveHit, ENEMY_COMBAT } from '../src/mission.js';
// Midpoint damage; no dodge or block. Existing scenario tests stay deterministic.
const act = (s, id, action, x, y) => performAct(s, id, action, x, y, () => 0.5);
const endTurn = s => finishTurn(s, () => 0.5);
const rolls = (...values) => () => { assert.ok(values.length > 0, 'unexpected random draw'); return values.shift(); };

test('damage includes both endpoints and never goes below zero after reductions', () => {
  const t = { hp: 20, dodge: 0, block: 0 };
  assert.equal(resolveHit(t, [2, 4], rolls(0.9, 0, 0.9)).damage, 2);
  assert.equal(resolveHit(t, [2, 4], rolls(0.9, 0.99999, 0.9)).damage, 4);
  t.defending = true; t.block = 1;
  const result = resolveHit(t, [2, 4], rolls(0.9, 0, 0));
  assert.equal(result.damage, 0); assert.equal(result.reduction, 4);
  assert.equal(t.hp, 14);
});

test('dodge prevents damage; block reduces a non-dodged hit', () => {
  const t = { hp: 10, dodge: 0.2, block: 0.3 };
  assert.equal(resolveHit(t, [3, 5], rolls(0.19)).dodged, true);
  assert.equal(t.hp, 10);
  const result = resolveHit(t, [3, 5], rolls(0.2, 0.5, 0.29));
  assert.equal(result.blocked, true); assert.equal(result.damage, 2);
  assert.equal(t.hp, 8);
  assert.equal(resolveHit(t, [3, 5], rolls(0.2, 0.5, 0.3)).blocked, false);
});

test('dodged player throws still consume ammo and Act and explain the result', () => {
  const s = createMission(), u = s.units[0]; u.x = 9; u.y = 4;
  s.enemies = [{ ...ENEMY_COMBAT, id: 'e', x: 9, y: 6, hp: 5 }];
  assert.equal(performAct(s, u.id, 'javelin', 9, 6, rolls(0)), true);
  assert.equal(s.enemies[0].hp, 5); assert.equal(u.ammo, 1); assert.equal(u.actions.act, false);
  assert.match(s.log.at(-1), /dodged/);
});

test('enemy attacks use variable damage and respect soldier dodge and block', () => {
  for (const [random, damage, report] of [[rolls(0), 0, /dodged/], [rolls(0.9, 0.999, 0), 1, /blocked/], [rolls(0.9, 0.999, 0.9), 3, /3 damage/]]) {
    const s = createMission(), u = s.units[0]; s.units = [u];
    s.enemies = [{ ...ENEMY_COMBAT, id: 'e', x: 0, y: 3, hp: 5 }];
    finishTurn(s, random);
    assert.equal(u.hp, u.maxHp - damage); assert.match(s.log.at(-2), report);
  }
});

test('mission starts with every entity on distinct traversable ground', () => {
  const s = createMission(), positions = new Set();
  for (const entity of [...s.units, ...s.enemies, ...s.casualties]) {
    assert.ok(passable(entity.x, entity.y));
    const key = `${entity.x},${entity.y}`;
    assert.equal(positions.has(key), false); positions.add(key);
  }
});

test('movement respects blockers and consumes only Move', () => {
  const s = createMission(), u = s.units[0];
  assert.equal(reachable(s, u).has('4,3'), false); // Wagon.
  assert.equal(reachable(s, u).has('2,3'), false); // Ally.
  assert.equal(act(s, u.id, 'move', 0, 3), true);
  assert.deepEqual(u.actions, { move: false, act: true, interact: true });
  assert.equal(act(s, u.id, 'move', 0, 4), false);
});
test('attack, interaction, and movement remain separate budgets', () => {
  const s = createMission(), u = s.units[0];
  u.x = 6; u.y = 3; s.enemies[0].x = 7; s.enemies[0].y = 3;
  assert.equal(act(s, u.id, 'sword', 7, 3), true);
  assert.equal(act(s, u.id, 'pickup', 6, 2), true);
  assert.equal(u.actions.move, true);
  assert.equal(u.actions.act, false); assert.equal(u.actions.interact, false);
});
test('casualties require carrying and a rally drop to count as evacuated', () => {
  const s = createMission(), u = s.units[0];
  u.x = 6; u.y = 3;
  assert.equal(act(s, u.id, 'revive', 6, 2), false);
  assert.equal(act(s, u.id, 'pickup', 6, 2), true);
  assert.equal(s.rescued, 0);
  assert.ok([...reachable(s, u).values()].every(p => p.cost <= 2));
  assert.equal(canTarget(s, u, 'javelin', 8, 2), false);
  assert.equal(act(s, u.id, 'drop'), false); // Interaction spent.
  u.actions = freshActions(); u.x = 0; u.y = 3;
  assert.equal(act(s, u.id, 'drop'), true);
  assert.equal(s.rescued, 1); assert.equal(s.casualties[0].state, 'rescued');
  assert.equal(act(s, u.id, 'drop'), false);
});
test('normal revival restores low health without granting another turn', () => {
  const s = createMission(), u = s.units[0], target = s.units[3];
  target.hp = 0;
  assert.equal(act(s, u.id, 'revive', target.x, target.y), true);
  assert.equal(target.hp, Math.ceil(target.maxHp * 0.25));
  assert.deepEqual(target.actions, { move: false, act: false, interact: false });
});
test('full revival is centurion-only and once per mission', () => {
  const s = createMission(), u = s.units[0], target = s.units[3];
  target.hp = 0;
  assert.equal(act(s, 'shield', 'fullRevive', target.x, target.y), false);
  assert.equal(act(s, u.id, 'fullRevive', target.x, target.y), true);
  assert.equal(target.hp, target.maxHp); assert.equal(s.fullReviveUsed, true);
  target.hp = 0; u.actions = freshActions();
  assert.equal(act(s, u.id, 'fullRevive', target.x, target.y), false);
});
test('javelins consume ammo and cannot shoot through a wagon', () => {
  const s = createMission(), u = s.units[1];
  u.x = 3; u.y = 3; s.enemies[0].x = 5; s.enemies[0].y = 3;
  assert.equal(act(s, u.id, 'javelin', 5, 3), false);
  u.x = 5; u.y = 2;
  assert.equal(act(s, u.id, 'javelin', 5, 3), true);
  assert.equal(u.ammo, 2); assert.equal(s.enemies[0].hp, ENEMY_COMBAT.maxHp - 4);
});
test('javelins cross water in both directions without requiring a walking route', () => {
  for (const [fromY, toY] of [[4, 6], [6, 4]]) {
    const s = createMission(), u = s.units[0];
    s.units = [u]; u.x = 9; u.y = fromY;
    s.enemies = [{ id: 'across-stream', x: 9, y: toY, hp: 5 }];
    assert.equal(passable(9, 5), false);
    assert.equal(canTarget(s, u, 'javelin', 9, toY), true);
    assert.equal(act(s, u.id, 'javelin', 9, toY), true);
    assert.equal(s.enemies[0].hp, 2);
    assert.equal(u.ammo, 1);
    assert.deepEqual(u.actions, { move: true, act: false, interact: true });
  }
});

test('water does not bypass javelin range limits', () => {
  const s = createMission(), u = s.units[0];
  s.units = [u]; u.x = 9; u.y = 4;
  s.enemies = [{ id: 'far-bank', x: 9, y: 8, hp: 5 }];
  assert.equal(act(s, u.id, 'javelin', 9, 8), false);
  assert.equal(u.ammo, 2); assert.equal(u.actions.act, true);
});

test('defense protects during enemy turn then expires', () => {
  const s = createMission(), u = s.units[0];
  s.units = [u]; s.enemies = [{ id: 'e', x: 0, y: 3, hp: 5 }];
  act(s, u.id, 'defend'); endTurn(s);
  assert.equal(u.hp, u.maxHp); assert.equal(u.defending, false);
  assert.deepEqual(u.actions, freshActions());
  endTurn(s); assert.equal(u.hp, u.maxHp - 2);
});
test('fallen carriers drop their objective and cannot act', () => {
  const s = createMission(), u = s.units[0];
  u.x = 6; u.y = 3; u.hp = 1;
  act(s, u.id, 'pickup', 6, 2);
  s.enemies = [{ id: 'e', x: 5, y: 3, hp: 5 }]; endTurn(s);
  assert.equal(u.hp, 0); assert.equal(u.carrying, null);
  assert.equal(s.casualties[0].state, 'ground'); assert.equal(s.casualties[0].y, 3);
  assert.equal(act(s, u.id, 'defend'), false);
});
test('enemy pathfinding reaches and attacks a reachable soldier', () => {
  const s = createMission(); s.units = [s.units[0]];
  s.enemies = [{ id: 'e', x: 5, y: 3, hp: 5 }];
  for (let i = 0; i < 3; i++) endTurn(s);
  assert.ok(s.units[0].hp < s.units[0].maxHp);
});
test('whole-squad incapacitation ends the mission', () => {
  const s = createMission(); s.units.forEach(u => u.hp = 0); s.units[0].hp = 1;
  s.enemies = [{ id: 'e', x: 0, y: 3, hp: 5 }];
  endTurn(s); assert.equal(s.status, 'defeat'); assert.equal(endTurn(s), false);
});
test('withdrawal requires the entire standing squad, resolves into capture, and locks actions', () => {
  const s = createMission(); assert.equal(withdraw(s), false);
  s.units.forEach((u, i) => { u.x = i % 2; u.y = 2 + Math.floor(i / 2); });
  s.units[0].hp = 0; assert.equal(canWithdraw(s), false);
  s.units[0].hp = 1; assert.equal(canWithdraw(s), true);
  assert.equal(withdraw(s), true); assert.equal(s.status, 'captured');
  assert.equal(act(s, 'centurion', 'defend'), false); assert.equal(endTurn(s), false);
});
test('reinforcements are limited to the specified rounds', () => {
  const s = createMission(); s.enemies = [];
  for (let i = 0; i < 8; i++) {
    s.enemies.forEach(e => e.hp = 0); endTurn(s);
  }
  assert.equal(s.enemies.length, 3);
  for (const enemy of s.enemies) {
    assert.equal(enemy.maxHp, ENEMY_COMBAT.maxHp);
    assert.equal(enemy.dodge, ENEMY_COMBAT.dodge);
    assert.equal(enemy.block, ENEMY_COMBAT.block);
  }
});
