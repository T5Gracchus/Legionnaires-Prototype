# Playtest notes

Historical feedback and implementation notes, preserved as recorded. See [current mechanics](../GAME_MECHANICS.md) and [release notes](../RELEASE_NOTES.md) for today’s behavior; older unchecked boxes are not a complete current backlog.

## Build 0.9 — mission expansion

- Added six off-world missions: take/hold, wave defense, demolition, escort, linked controls, and an ordered archive raid. Ten missions total including the Roman opening.
- Added destructible terrain, protected target HP, wave forecasts, objective progress, and new battlefield props. Preparation illustrations and all saved human notes remain intact.
- Automated validation and estimated pace are in [build 0.9](../archive/BUILD_0_9.md). Human checks: goal clarity, whether breached lanes matter, guiding/blocking the cart, contested-zone readability, and actual active minutes.

## Build 0.8 — visible elevation and new battle art

- Responds to the user's feedback that Z felt good but was hard to perceive. Added extruded isometric terrain, new battle sprites/props, pan/zoom/tactical view, and enforcer targeting/execution visuals.
- Preserved the preparation menus, original portraits, combat rules, and existing human records. New saves identify presentation build 0.8 and compatible rules 0.7.
- Next human check: read height without labels, select near cliffs/trees, and report confusing overlap, wrong-cell clicks, sprite identity, or overly slow effects. See [art delivery notes](../archive/BUILD_0_8.md).

## October 26 — build 0.7

- Responds to the two saved human tests: advanced weapons felt good; relay felt about right, bazaar too easy, and both requested better enemy intelligence. The original JSON records remain unchanged.
- Added tactical positioning and mender/binder/caller roles, limited support uses/cooldowns, stepped maps, per-recruit ground/Z/climb/drop traits, range/visibility/cover rules, and movement/fall previews. Bazaar reinforcement now enters in round 4.
- New saves contain starting/final states, snapshots, player paths, enemy decisions, rolls and damage reductions, HP/ammunition/statuses/countdown, and active/idle/paused timing. Old 0.6.1 results remain readable but cannot acquire missing history retroactively.
- See [build report](../archive/BUILD_0_7.md) for validation and known limitations. Next human check: is enemy support readable, do heights and drops make sense, and does the default team still feel moderate at roughly ten minutes?


## October 24 — saving human playtests, build 0.6.1

- Added **Save to repo** to off-world mission results. It saves the notes, difficulty rating, and mission context as a new JSON file in [playtests/](../../README.md#saving-playtest-results).
- The form confirms the actual saved path, preserves notes on failure, and allows revised snapshots after editing. **Download copy** remains available. Saving does not commit or push files.

## October 22 off-world trials — build 0.6

- Implemented the requested equipped-technology countdown and two-turn enforcement window, with marked vaporization and explicit extraction.
- Added Aer Flight, Bound Leap, Murr Musk (including friendly debuffs), and Krag natural armor, plus cross-species weapons/armor and free bench recruitment.
- Added three levels, five preset squads, and an actual elapsed-time/difficulty/notes export on the results screen.
- Default mixed-team target is forgiving medium and roughly ten minutes. See [rules](../archive/OFFWORLD_TRIALS.md) and [12,000-run tuning/validation report](../archive/OFFWORLD_BALANCE.md) for measured turn counts, estimated durations, and combinations that remain risky.
- Human check: play all three with One advanced weapon, save results, then change one recruit/item at a time. Check whether extreme firepower is too dominant on open maps, whether the river frustrates the slower musk team, and whether native-only bazaar revival becomes repetitive.
- Roman javelin melee support remains pending; no diagonal movement or 1.5-cost rule was introduced.

## October 8 design sync — build 0.4

- Updated local handoff and campaign context against the design repo's current working files; see [source and requirement mapping](../archive/DESIGN_SYNC_2026-10-08.md).
- Added a collapsible mission briefing, character backgrounds, and rescued/not-evacuated/standing-squad debrief.
- Combat tuning and cardinal movement are unchanged. Dual-use javelins and other unfinished feedback below remain pending.
- Next human check: can players explain the trio's relationship, distinguish casualty evacuation from revival, and understand their rescue outcome without a longer mandatory introduction?

## Initial feedback — September 21, 2026

User feedback on build 0.1. Saved for a later iteration; these changes have not been implemented.

- [ ] **Ranged weapons:** “We forgot to add in ranged weapons.” Revisit ranged-weapon support and how clearly it is presented.
- [ ] **Dual-use javelins:** Javelins should function as both melee and ranged weapons.
- [x] **Stronger enemies:** Build 0.3 increases enemy HP from 5 to 7, with lower dodge/block rates to limit missed-attack frustration. Further tuning follows human playtests.
- [x] **Visible weapon stats:** Build 0.2 shows damage ranges and attack ranges on buttons and in the selected-soldier panel.
- [x] **Explain Defend:** Build 0.2 shows reduction on the button and explains duration, cost, and stacking in its tooltip and game instructions.

Implementation context: build 0.1 already includes a ranged Javelin action, but no separate melee javelin attack. The ranged-weapons feedback should therefore also guide discoverability and clarity. No additional weapon types or numerical balance changes have been specified yet.

## Second playthrough feedback

- [ ] **Javelins across water:** Throwing a javelin at an enemy across water should be possible. Review why this was unavailable or unclear during play.
- [ ] **Broader character stats — discussion only:** Start thinking about a character-stat system. The later request below authorizes dodge and block now; broader stats and progression remain deferred.

Verification note: the current rules allow javelins across water when the enemy is within range (3 tiles normally, 4 for the shield brother), the shot is clear of trees and wagons, ammunition and Act remain available, and the soldier is not carrying a casualty. Range counts horizontal plus vertical tile distance, not the walking route. Regression tests cover throws in both directions across the stream. The specific failed throw from the playthrough has not been reproduced; retain this feedback for follow-up. No gameplay rules or character stats were changed.

## Combat update — build 0.2

The user noted they may have missed the javelin throw action and requested variable weapon damage, dodge and block chances for every character and enemy, and clearer javelin damage/range information.

- [x] Variable damage for sword, thrown javelin, and enemy attacks.
- [x] Dodge and block for the entire squad and all enemies, including reinforcements.
- [x] Visible damage ranges, attack ranges, defense chances, and combat reports explaining dodges, blocks, and damage reductions.

Exact numbers and block behavior are provisional implementation choices listed in PLAYTEST_RULES.md. Dual-use javelins remain pending. Enemy-strength tuning follows in build 0.3.

## Balance pass — build 0.3

Implemented the selected health and defense profile after 5,400 seeded simulations across six profiles and three play styles. See [full report](../archive/BALANCE_PLAYTEST.md). The 15-minute target is estimated, not human-timed or guaranteed. Cardinal movement remains at cost 1; no diagonal movement was added.
