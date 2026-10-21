# First playable experiment — build 0.4

These are implementation assumptions for testing, **not approved design decisions**. The sibling design workspace remains authoritative. The implementation preserves the confirmed three action categories, Defend, low-health revival, the centurion's full-health revival, carry-only mission casualties, and a capture ending.

October 8 design sync: build 0.4 adds optional mission/character context and a rescue debrief, retaining all build 0.3 combat rules. Detection, augmentation, ship progression, and the alien-veteran lesson are later proposals, not mechanics in this Roman mission. See [sync record](DESIGN_SYNC_2026-10-08.md).

## Run and verify

- `node scripts/serve.mjs` — open http://127.0.0.1:5173.
- `node --test` — exercise the combat rules. Node 22 or newer is required.
- No dependencies, package installation, or build step. `npm start` / `npm test` also work where npm is installed.

## Provisional choices

| System | Current experiment |
| --- | --- |
| Technology | Native JavaScript modules and a DOM grid; no engine commitment. Rules and mission data are isolated from presentation. |
| Scope | Six soldiers, three wounded objectives, 12 × 9 grid, team turns. |
| Movement | Cardinal movement, single uninterrupted action; normally 4 tiles, sword brother 5, carriers 2. Terrain and all soldiers block movement. |
| Action budget | Move, Act, Item/Special; any order, no exchanges. Sword, javelin, Defend consume Act. Pickup, put-down, either revive consume Item/Special. |
| Combat | Uniform integer damage rolls: centurion and sword brother sword 3–5; others sword 2–4, all range 1. Javelin 2–4 damage / range 3; shield brother 3–5 damage / range 4. Two javelins each, three for shield brother. Throws cross water; trees and wagons block shots. Range counts horizontal plus vertical distance. Attacks spend Act and throws spend ammunition even when dodged. |
| Dodge / block | Check dodge first (avoids all damage), then independently check block on non-dodged hits (reduces damage by 2). Block stacks with Defend; damage cannot fall below zero. Centurion: 10% dodge / 20% block; shield brother: 5% / 30%; sword brother: 15% / 10%; supporting soldiers: 5% / 15%; enemies: 5% / 10%. |
| Defend | Reduce each incoming hit by 2, or 3 for shield brother, through enemy phase; expires at next player turn. No adjacent protection yet. |
| Incapacitation | At 0 HP a soldier occupies their tile, cannot act, and is ignored by enemies. Supporting soldiers are also eligible for revival in this experiment. No permanent deaths. |
| Revival | Adjacency; 25% maximum HP rounded up. Centurion full revive once per mission. Both consume Item/Special. Revived soldiers receive no actions until next round. |
| Casualties | Pickup on same or adjacent tile; one per carrier. Carrier cannot attack or revive, but can defend. Put-down on rally ground counts as evacuation; elsewhere returns casualty to ground. A fallen carrier drops the casualty on their tile. |
| Enemies | 7 HP, move up to 2 via shortest open route to a standing Roman, then attack an adjacent Roman for 1–3 damage before defenses. Prefer lowest-health adjacent target. One reinforcement in rounds 3, 5, 7 if a spawn tile is free. Reinforcements use the same damage and defense chances. |
| Withdrawal | All six soldiers standing on rally tiles, none carrying. Explicit Withdraw button; rescuing fewer than three is allowed. Capture always follows, with rescued count recorded. No abandonment of squad members in this build. |
| Defeat | All six soldiers incapacitated. Restart is available at any time. |

## What to evaluate next

1. Does the three-category budget make turns clear, especially after pickup and revival?
2. Is the central crossing a meaningful tactical problem or just congestion?
3. Is rescuing the third casualty a meaningful choice? Current enemy pressure is deliberately modest.
4. Does full revive compete with casualty handling, and does Defend help carriers?
5. Should withdrawal permit abandoning supporting soldiers? The current requirement may force lengthy recoveries.

## Known limits

No save/load, undo, animations, sound, campaign, inventory items, command buffs, or authored brother abilities. The brothers currently differ through numerical traits. No engine or TypeScript tooling is installed. The ending uses brief placeholder text, leaving captors and sale staging unresolved. Numerical tuning lives in `src/mission.js`; browser presentation lives in `src/app.js` and `src/style.css`.

## Build 0.3 balance

Player HP: centurion 12, shield brother 11, sword brother 10, supporting soldiers 9 each. See [balance playtest report](BALANCE_PLAYTEST.md) for scenario definitions, results, rationale, and estimated duration limits.
