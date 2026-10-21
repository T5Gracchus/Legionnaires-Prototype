import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, withdraw } from '../src/mission.js';
import { missionDebrief } from '../src/story.js';

test('debrief is absent during play and reflects actual casualty states after withdrawal', () => {
  const s = createMission();
  assert.equal(missionDebrief(s), null);
  s.units.forEach((u,i) => { u.x = i % 2; u.y = 2 + Math.floor(i / 2); });
  s.casualties[0].state = 'rescued'; s.rescued = 1;
  assert.equal(withdraw(s), true);
  const before = structuredClone(s), result = missionDebrief(s);
  assert.equal(result.summary, '1 / 3 wounded evacuated · 2 not evacuated · 6 / 6 squad members standing');
  assert.match(result.text, /capture/);
  assert.deepEqual(s, before);
});

test('full rescue and defeat get distinct summaries without inventing casualty deaths', () => {
  const s = createMission(); s.status = 'captured'; s.casualties.forEach(c => c.state = 'rescued');
  assert.match(missionDebrief(s).summary, /3 \/ 3 wounded evacuated · 0 not evacuated/);
  s.status = 'defeat'; s.units.forEach(u => u.hp = 0);
  assert.equal(missionDebrief(s).label, 'MISSION FAILED');
  assert.match(missionDebrief(s).summary, /0 \/ 6 squad members standing/);
  assert.doesNotMatch(missionDebrief(s).text, /sold to/);
});
