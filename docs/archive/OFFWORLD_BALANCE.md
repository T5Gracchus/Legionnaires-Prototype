# Off-world difficulty and duration tests — build 0.6

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

Executed October 22, 2026. Medium difficulty and approximately ten human minutes per level are design targets. Results below are seeded simulations and browser automation, not claims of human testing.

## Experiment design and reproducibility

The driver calls the actual game rules for every movement, ability, attack, objective, revival, extraction, and End Turn. It pays the same action/ammunition budgets and uses the same seeded randomness as the browser. It has no teleportation, forced hits, free equipment changes, or privileged objectives. All actors and objectives are visible in the playable missions too.

Five presets compare native mobility, a pulse-carbine mix, extreme technology, the Roman trio with a glider, and musk with filtered armor. Each was tested on all three levels with two policies:

- **Balanced:** fast recruits claim objectives; others fight; adjacent/distant downed allies are recovered where a route is found; the centurion uses Rally/full revive; Porr emits musk near guards; unused Act becomes Defend. Return and individually extract when objectives are done.
- **Novice stress proxy:** same automatic objective routing but skips attacks every third round, never Defends, and does not deliberately recover allies or use musk. This is deliberately reckless, not a statistical model of a beginner. It often succeeds with severe losses, so its short completion times should not be used to set normal pacing.

Three numeric profiles were compared: **gentle** (enemies −1 HP, safe window +1), **live/selected** (shipped stats), and **pressure** (enemies +1 HP, window −1). The live profile uses the enemy HP in `trials-data.js`: guards 9, slingers 8, wardens 12, with variable damage. The final presets were fixed before the separate validation seeds.

| Batch | Seeds | Presets × levels × policies | Runs |
| --- | --- | --- | --- |
| Live tuning | 1–100 | 5 × 3 × 2 | 3,000 |
| Gentle comparison | 1–50 | 5 × 3 × 2 | 1,500 |
| Pressure comparison | 1–50 | 5 × 3 × 2 | 1,500 |
| Held-out live validation | 1001–1200 | 5 × 3 × 2 | 6,000 |
| **Final recorded runs** | | | **12,000** |

Exploratory runs occurred before these final batches, including fixing an objective accidentally placed in trees, improving the test player's distant revival behavior, and restoring the centurion's full revive. Their earlier files were replaced by the final live results. The original heavy preset combined two advanced weapons with high-signature armor and proved too restrictive on the river map; the shipped heavy preset uses light native armor. An additional 150-run mesh variant was exploratory and is not included in the 12,000 recorded runs or the preset-selection evidence.

Run with Node 22+:

```text
node scripts/playtest-trials.mjs 100 1 live
node scripts/playtest-trials.mjs 50 1 gentle
node scripts/playtest-trials.mjs 50 1 pressure
node scripts/playtest-trials.mjs 200 1001 live
node --test
```

Results: `offworld-playtests-live-1.json`, `offworld-playtests-gentle-1.json`, `offworld-playtests-pressure-1.json`, and `offworld-playtests-live-1001.json`. The first two seeds of each scenario retain turn traces and action transcripts; every other run retains outcome, per-unit positions/state, and metrics. Identical seeds reproduce a run; changed gear/actions can consume different numbers of random draws. Treat cross-profile comparisons as sampled results, not identical individual dice outcomes.

## Difficulty selection

Full-squad extraction for the default mixed team, balanced policy, matched seeds 1–50:

| Profile | Reedwater | Basalt | Bazaar |
| --- | --- | --- | --- |
| Gentle | 45/50 | 50/50 | 50/50 |
| **Selected** | **44/50** | **48/50** | **48/50** |
| Pressure | 29/50 | 45/50 | 42/50 |

Pressure added excessive enforcement losses on the river map (21 versus 0 in the selected profile for these 50 runs) and more repeated knockdowns. Gentle reduced attrition and produced shorter encounters. The selected profile is a forgiving medium starting point: combat recovery and a return route matter, but a single mistake need not force a restart. Its high automated success rate reflects a map-aware policy with automatic routing, not an expected human win rate. First-time human testing may require further adjustment.

Held-out balanced-policy results, 200 seeds per cell; numbers are **all four recruits extracted**:

| Preset | Safe turns | Reedwater | Basalt | Bazaar |
| --- | --- | --- | --- | --- |
| Native expedition | 16 | 140/200 | 198/200 | 159/200 |
| **One advanced weapon — recommended first** | **13** | **180/200** | **193/200** | **196/200** |
| Heavy signature | 8 | 186/200 | 100/200 | 196/200 |
| Roman fireteam | 15 | 129/200 | 129/200 | 109/200 |
| Filtered musk team | 15 | 23/200 | 173/200 | 107/200 |

Contract completion can include losses. The default mixed team completed the objectives with at least one survivor in 200/200 Reedwater, 198/200 Basalt, and 200/200 Bazaar runs. The same team's reckless stress proxy completed only 4/200, 15/200, and 11/200 full extractions (see raw results for exact outcomes). Do not present contract completion as proof of an intact squad.

The balance is intentionally not uniform across all equipment: heavy firepower is strong on the open river/bazaar layouts, but the rubble raid sharply increases its extraction risk. Native gear remains especially viable on the relay raid. The filtered musk team performed poorly at full extraction on the river map despite high contract completion; its slow stoneback and test-player congestion/recovery behavior warrant human inspection. It is an experimental combo, not a recommended medium preset. The native bazaar runs can suffer repetitive knockdown/revive loops. These are visible limitations to evaluate, rather than reasons to silently discard failed runs or claim every combination is balanced.

## Duration target

Planning estimate: **90 seconds of orientation + 6 seconds per successful action + 8 seconds per round**. This is an explicit assumption for the ten-minute target. It excludes deep loadout experimentation, breaks, and reading every rule; automated browser completion takes far less real time and is not a substitute for human timing.

Held-out default mixed team, balanced policy:

| Level | Mean rounds | Mean actions | Estimated median | Estimated 90th percentile |
| --- | --- | --- | --- | --- |
| Reedwater | 10.25 | 63.90 | 9.4 min | 10.8 min |
| Basalt | 9.72 | 64.58 | 9.3 min | 11.0 min |
| Bazaar | 8.70 | 62.11 | 8.7 min | 10.2 min |

These values support an approximately ten-minute first target, **not a verified duration guarantee**. Slower decisions or native-only/recovery-heavy runs can take longer; extreme-weapon runs can finish faster. Use the result screen's actual elapsed-minute export and difficulty rating to calibrate after human play. It starts at deployment, so note loadout-planning time separately if relevant.

## Rule and browser verification

- 37 Node rule/story tests cover the original Roman game plus setup validity, every single recruit/weapon/armor combination, signature monotonicity, flight landing, leap costs, musk duration/immunity/damage, objectives, extraction, revival/full revive, arc chaining, seeded replay, terminal action locks, and enforcement's exact two-turn window.
- Three complete browser replays through ordinary controls, mixed team seed 42: Reedwater 12 rounds / 72 actions / 4 extracted; Basalt 9 rounds / 63 actions / 4 extracted; Bazaar 14 rounds / 87 actions / 4 extracted. Exported metrics matched the rules driver.
- Browser enforcement stress test: zero reached, two drones and a marked recruit visible, first vaporization applied, and final lockdown produced failure. No direct game-state injection was used.
- Deployment equipment changes updated the visible budget; all sprites decoded. Setup checked at desktop 1440 × 1100 and phone 390 × 844 with no horizontal overflow. No JavaScript errors or failed resource responses occurred.
- Additional phone-width controls check: recruited Oru through the bench, exchanged species/gear and verified the new deadline, flew Seli across water, leapt Tekk across it while retaining Move, emitted musk and observed the centurion's friendly debuff, then loaded the original Roman mode successfully. A phone ability screenshot is included.
- The Roman mission engine, its balance, and cardinal movement costs were preserved.

Screenshots in `docs/screenshots/build-0.6-*.png` show the loadout screen, mission, debriefs, and enforcement. Native and alien illustrations are prototype art; guard/enforcement visuals have placeholder elements described in OFFWORLD_TRIALS.md.
