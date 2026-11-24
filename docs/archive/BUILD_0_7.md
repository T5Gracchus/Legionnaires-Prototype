# Build 0.7 — elevation, enemy support, and playtest recording

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

October 26, 2026. Implements the approved next-build scope in the off-world laboratory. The Roman tutorial engine and movement rules are unchanged. The two human build 0.6.1 records remain intact in `docs/playtests/`.

## What to try

Run `node scripts/serve.mjs` and open `/offworld.html`. Choose **One advanced weapon** first. Inspect a support enemy for its intention and counters, hover/focus a destination for its path and costs, and try the lookout at A1. Use **Pause play** during breaks. Rate the finished mission and **Save to repo**.

The map has a relief view and an optional flat view. Tile badges show Z0–3; the key identifies X columns and Y rows. Phone maps scroll horizontally rather than shrinking the sprites to unreadable sizes. Terrain shades lighten with height. Role markers distinguish menders (✚), binders (✺), and callers (⚑); they currently share the guard illustration.

## Movement and elevation

X/Y are ground coordinates. Z is the one ground-surface height at each cell. There are no stacked bridges, underground cells, or arbitrary airborne positions in this build. JSON uses zero-based X/Y; UI columns A–L correspond to X1–12 and rows 1–8 to Y1–8. Z is zero-based everywhere.

| Recruit | Base ground steps | Total Z travel per Move | Maximum upward step | Safe drop |
| --- | ---: | ---: | ---: | ---: |
| Centurion | 4 | 2 | 1 | 1 |
| Shield brother | 4 | 1 | 1 | 1 |
| Sword brother | 5 | 3 | 1 | 1 |
| Seli | 5 | 5 | Flight | Flight |
| Tekk | 4 | 4 | 2 | 2 |
| Porr | 4 | 2 | 1 | 1 |
| Oru | 3 | 2 | 1 | 2 |

Armor still modifies ground movement; binding subtracts one ground step, minimum one. Each cardinal step costs one ground point. Climbing and descending additionally spend the absolute height change from the separate Z allowance. A normal Move remains one uninterrupted action, not several moves that can be split around attacks. No diagonal or 1.5-cost movement was introduced.

Drops beyond the recruit's safe distance deal **3 HP per excess level**, ignoring dodge, block, armor, and Defend. The planner prefers a safe route over a damaging one if both fit the allowance. Damaging routes show their exact expected damage and remaining HP, then require confirmation. Routes whose total falling damage would incapacitate the recruit are unavailable. The player cannot accidentally confirm a lethal fall.

Flight passes over obstacles/units and ignores drop damage. Its landing must be empty ground and within its vertical allowance relative to the origin. Transit cells in recorded flight paths identify the ground below, not a separately simulated airborne trajectory. Tekk's Leap still costs Item/Special and leaves Move available: up to four ground squares, two levels upward, four levels of height difference, with safe-drop/fall rules on landing. It cannot leap and secure an objective with the same Item/Special.

Weapon, healing, musk, and interaction distance uses **|ΔX| + |ΔY| + |ΔZ|**. A recruit cannot free someone directly across a tall cliff merely because their ground cells touch. Intervening terrain at or above the interpolated sight ray blocks a shot; trees and rubble extend two height levels above their surface. Water alone does not block shots. Adjacent trees/rubble give one damage reduction against ranged hits unless the shooter is higher. Elevation grants no direct damage bonus.

All three maps now have terraced approaches, elevated objectives, and a starting lookout with a stepped approach and a drop. Existing obstacles and river crossing remain. Bazaar reinforcements enter in round 4 instead of round 6.

## Enemy decisions and support

Tactical enemies evaluate reachable positions for a firing opportunity, distance, nearby recruits, cover, elevation, objective proximity, and travel cost. Ranged enemies penalize adjacency and prefer a useful firing distance. They avoid damaging falls. Targets favor exposed low-HP recruits over Defending ones. Support enemies act before moving when a useful target is already legal, otherwise reposition and reevaluate. These are deterministic tactical rules, not a learned model or omniscient campaign planner.

| Type | HP | Attack / range | Ability | Limits |
| --- | ---: | --- | --- | --- |
| Reed mender | 8 | 1–2 / 3 | Heal another living ally for up to 4 HP, range 3 and clear sight | Two uses; two-round cooldown; no resurrection |
| Spore binder | 8 | 1–2 / 3 | Apply −1 ground Move and −10 percentage points dodge, range 3 and clear sight | Three uses; two-round cooldown; no stacking; lasts through the next player turn and enemy phase |
| Shell caller | 10 | 2–3 / 2 | Nearby allies within 3 gain +1 attack damage for this enemy phase | Two uses; three-round cooldown; no additional attacks; no stacking |

Each support action replaces that enemy's attack. Commanders activate first so the buff is visible in subsequent combat reports. Intention text, support charges, and the next ready round are available by hovering/focusing a tile. Intentions are conditional: moving or defeating the intended target can change the eventual choice. Removing a caster prevents its next ability; binding already applied expires normally. Command and binding may combine with other distinct effects, including musk; binding itself cannot stack.

Basic guard HP and weapon strength were preserved. Initial experiments with six defenders and stronger support attacks were too punishing. The selected build uses five initial defenders and lower support attack damage, leaving their abilities as their main contribution. The river binder was moved behind the southern approach rather than overwhelming the crossing immediately.

## Recording and replay

New human results use schema version 2. In addition to notes, rating, seed, loadout, outcome and summary metrics, they retain:

- Full initial and final state: map/heights, units, enemies, positions, HP, ammunition, action budgets, status effects, objectives, countdown, support cooldowns/uses, and RNG state.
- A sequential event stream: successful player actions, paths and destinations, enemy movement/decisions, support effects, damage rolls, dodge/block rolls, reductions, actual HP damage, falls, arc chains, reinforcements, and phase transitions.
- Full snapshots after each successful player action, each enemy activation, and at phase boundaries. An event sequence number links player-action timing to the trace.
- Total time, estimated active time, idle time, paused/hidden time, and pause/visibility transitions. Foreground time without a pointer press or key event beyond 60 seconds becomes estimated idle. This can misclassify reading or thinking; it is not an attention measurement. Timing freezes at mission end and excludes writing feedback.

`node scripts/replay-trial.mjs docs/playtests/YOUR-FILE.json` reconstructs a run with matching build 0.7 rules and checks the final state plus every generated event and intermediate snapshot. The stored snapshots remain inspectable if later rules change. The historical 0.6.1 summaries cannot be retroactively replayed.

The local save endpoint now accepts up to 16 MiB, validates nested state/timing, and keeps its loopback/same-origin restrictions and unique server-generated paths. Tested browser records were approximately 0.7–1.3 MB before pretty printing. Failed saves retain feedback and the download option. Saving is not an automatic Git commit or push. Test runs write to temporary copies, not the human-results folder.

## Difficulty validation

Recorded **3,600 seeded runs**: four modes × three levels × three presets × 100 held-out seeds (1001–1100). Tuning used seeds 1–50 separately. The same map-aware balanced player policy routes objectives, fights, defends, revives, and extracts through ordinary engine rules.

Modes isolate a flat/basic control, elevation with basic enemies, tactical/support enemies on flat terrain, and the combined build. The control replaces support enemies with combat guards at the same new positions; it is **not** a replay of historical build 0.6. Changed gear and decisions consume different RNG draws, so paired seed labels do not guarantee identical combat rolls.

| Combined mode | Default mixed: all four out | Heavy: all four out | Native: all four out | Default estimated median / 90th percentile |
| --- | ---: | ---: | ---: | --- |
| Reedwater | 84/100 | 58/100 | 63/100 | 10.8 / 12.1 minutes |
| Basalt | 96/100 | 81/100 | 98/100 | 8.5 / 11.1 minutes |
| Bazaar | 97/100 | 84/100 | 86/100 | 9.1 / 12.1 minutes |

Default contract completion (at least one survivor) was 100/100 on each map. That is distinct from extracting everyone. Its mean damage taken was 26.4, 24.9, and 25.4 HP; mean enemy attack counts were 17.7, 14.4, and 13.2. These support more sustained interaction than the two earlier human runs, but are not a controlled human comparison. Default mean knockdowns remain about 2.3–2.5, so repeated revival warrants human review.

The time estimate remains **90 seconds orientation + six seconds per successful action + eight seconds per round**. It supports the roughly ten-minute target but is not human-timed evidence. Heavy weapons can still finish the bazaar faster (estimated median 6.7 minutes); the river remains their riskiest extraction. Support abilities are exercised across the recorded batches; the river mender rarely gets to heal with heavy firepower, which is a visible targeting/balance limitation.

Reproduce with `node scripts/playtest-next.mjs 100 1001`. Raw outcomes, summaries, and sample transcripts are in [the validation data](../reports/simulations/offworld-v07-validation-1001.json). Older simulation reports remain historical. Arbitrary custom equipment combinations, the Roman/musk presets in this new build, and actual human duration are not established by this batch.

## Verification and next human checks

The Node tests cover independent height/visibility/fall rules, support limits/expiry, tactical repositioning, deterministic telemetry/replay, timing, legacy saves, nested-state rejection, and large-file saving, alongside the original Roman and off-world tests.

`scripts/check-trials-browser.mjs` is an optional developer check using an installed Playwright module (`PLAYWRIGHT_MODULE`), headless Edge, and a temporary repository/server. It replays the three default seed-42 maps and an additional seed-7 bazaar success, compares metrics, saves actual browser traces, and verifies replay. Seed-42 bazaar defeats the test policy; this outcome is retained, not silently replaced by a success. Additional checks cover pause/resume, mobile overflow/panning, map modes, inspection, previews, a confirmed/cancelled fall, and the Roman opening. Screenshots are in `docs/screenshots/build-0.7-*.png`.

Next human questions: can you identify a support enemy before it acts; is moving up/down predictable; does the fall preview feel fair; are combat recovery and extraction engaging rather than repetitive; and do the new active/idle measurements match your actual session? Record impressions without changing several loadout items at once.
