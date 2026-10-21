# Playtest notes

## October 8 design sync — build 0.4

- Updated local handoff and campaign context against the design repo's current working files; see [source and requirement mapping](DESIGN_SYNC_2026-10-08.md).
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

Implemented the selected health and defense profile after 5,400 seeded simulations across six profiles and three play styles. See [full report](BALANCE_PLAYTEST.md). The 15-minute target is estimated, not human-timed or guaranteed. Cardinal movement remains at cost 1; no diagonal movement was added.
