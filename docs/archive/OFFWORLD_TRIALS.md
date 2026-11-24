# Off-world trials — build 0.9

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

Updated October 26, 2026. See [build 0.7 rules, telemetry, and balance](BUILD_0_7.md) for elevation and support-enemy changes. Nine independent off-world missions plus a linked Roman tutorial, accessible from the Roman opening's **Off-world trials** link or at http://127.0.0.1:5173/offworld.html after starting `node scripts/serve.mjs`.

[Build 0.8](BUILD_0_8.md) adds the isometric scene, visible terrain faces, new battle sprites, and enforcement effects. Use pan/zoom/reset, Coordinates, and the tactical view to inspect the battlefield. The [October 27 camera update](CAMERA_CONTROLS.md) adds four viewing angles through Rotate buttons or Q/E while the battlefield has focus. The preparation menus retain their original artwork.

[Build 0.9 mission catalog and validation](BUILD_0_9.md) covers the six new maps, destructibles, automatic phase goals, protected targets, and replay format. The earlier combat/elevation sections below still apply.

## Start here

Choose **Reedwater salvage** and **One advanced weapon**, then Deploy. All nine maps use the same controls; the mission checklist explains each distinct goal. Choose a recruit, an order, and an outlined target. Each recruit gets Move, Act, and Item/Special once per round, in any order. Complete the mission checklist, return to an X tile (eastern ferry in Caravan), and use **Extract separately for each recruit**. Aim to bring all four home.

The suggested mixed team is the centurion, Seli, Tekk, and Porr, with a pulse carbine on the centurion and native gear on the aliens. It has **13 safe turns + 2 enforcement turns**. The scenario seed defaults to 42 for reproducible testing; change it to replay different combat rolls. The other presets are Native expedition, Heavy signature, Roman fireteam, and Filtered musk team. Recruitment is free in the bench; choose four different recruits from seven available characters. All recruits can equip all trial weapons and armor.

At the end, the results screen records real elapsed time, actions, rounds, knockdowns, extraction, and enforcement losses. Add a difficulty rating/notes and choose **Save to repo** to write a JSON snapshot into `docs/playtests/` through the local server. The confirmation shows the saved path. Each save creates a new file; edited notes can be saved again. **Download copy** provides a separate JSON download. These files stay in the local checkout until committed and pushed. See [saved-results guide](../../README.md#saving-playtest-results). Review map and View mission result let you revisit the outcome. Returning to loadout or retrying resets trial losses and unsaved notes; there is no permanent campaign progression.

## Requirements authorized in this task

| Local requirement | Implementation |
| --- | --- |
| T01: more advanced equipped gear means fewer turns; authorities arrive at zero and start vaporizing, leaving a couple of turns | A visible deployment budget counts equipped weapons and armor; it decrements once per completed player turn. At zero, enforcement arrives, marks a target, and gives two final player turns. |
| T02: recruit alien species with distinct abilities and creative native weapons; test cross-species equipment | Four alien recruits with Flight, Leap, Musk, and natural armor; the Roman trio is also available. Ten weapons, four armor sets, and five starting combinations. |
| T03: several levels, medium difficulty, about ten human minutes each | Nine encounters with distinct terrain/objectives, plus the Roman opening. The mixed team is the recommended starting point; current simulations, UI replays, and timing assumptions are recorded in BUILD_0_9.md (OFFWORLD_BALANCE.md is historical). Human duration remains to be validated. |

These user instructions authorize the off-world experiment previously proposed in the October 8 notes. Names, numerical balance, the signature formula, enforcement target selection, loss rules, and species details below are provisional test choices. They do not settle every campaign legal question or the alien veteran's story. The Roman mission retains its own combat and casualty rules; it has no detection timer.

## Original three encounters

| Encounter | Objectives | Tactical question |
| --- | --- | --- |
| Reedwater salvage | Recover two sealed bundles on opposite sides of a broken crossing | Does biological mobility justify keeping native weapons? Split objectives while protecting the return route. |
| Basalt relay | Disable two relays beyond rubble and sling guards | Does extra firepower compensate for a shorter deadline when terrain blocks shots? Flight and Leap offer alternate routes. |
| The spore bazaar | Free two captive locals from guarded stockades | Can musk and filtered armor control the guards without harming your own team? |

Each map is 12 × 8 with four starting recruits, two objectives, five native defenders (including a mender, binder, and caller), and one scheduled reinforcement. Locations and complete enemy statistics live in `src/trials-data.js`. Captives depart safely when freed; they are not the Roman tutorial's carry-only wounded casualties and do not join the current squad. Recruiting a bench character is separate from completing a captive objective.

## Species and abilities

| Recruit | Native identity | Ability and cost |
| --- | --- | --- |
| Seli — Aer glider | Feathered, teal birdlike scout; river-stone sling | Flight replaces ordinary Move: traverse water, rubble, and units, but land on empty ground. Move 5 in woven armor. It does not add signature. |
| Tekk — Bound leaper | Orange amphibian; thorn spear and bark shield | Item/Special: Leap to empty ground within 4 Manhattan tiles, bypassing transit obstacles. Move remains available. Cannot leap and secure an objective with the same Item/Special. |
| Porr — Murr musk keeper | Violet-furred gourd-and-seed craft tradition | Item/Special: radius-2 musk cloud through two enemy phases. Everyone affected loses 1 attack damage and 10 percentage points of dodge, including allies. Murr and filtered armor are immune. Clouds stay where released. |
| Oru — Krag stoneback | Natural slate plates; obsidian maul | Passive natural armor 1. Defend reduces another 3 damage. Lower movement (3 before armor penalties). |

The centurion has one 4-HP Rally for himself or an adjacent standing ally, and one full-health revive for an adjacent fallen ally; each consumes Item/Special. All recruits also have ordinary adjacent revival to 30% HP, with no actions granted until the next round. The shield brother retains stronger Defend, and the sword brother is faster with higher dodge. Native defenders include guards, slingers, wardens, Reed menders, Spore binders, and Shell callers. Each role now has distinct battle art, supported by role symbols and colors. Inspect a tile for its ability, uses, cooldown, and intention.

## Arsenal

Damage is a uniform integer roll within the displayed range, before dodge, block, armor, Defend, or musk. Ranges use ground-column + ground-row + height difference (|ΔX| + |ΔY| + |ΔZ|). Intervening terrain at or above the sight ray blocks shots; trees and rubble extend two levels above their tile. Water alone does not block shots. Adjacent cover reduces ranged damage by 1 unless the shooter is higher. Every recruit has an unlimited 2–3 damage, range-1 sidearm, allowing ammunition conservation. Changing loadout is available before deployment, not during a mission.

| Weapon | Damage | Range | Shots | Signature | Purpose |
| --- | --- | --- | --- | --- | --- |
| Gladius | 3–5 | 1 | Unlimited | 0 | Reliable melee. |
| Javelin bundle | 3–5 | 3 | 5 | 0 | Low-signature ranged option. |
| River-stone sling | 2–4 | 4 | Unlimited | 0 | Native ranged pressure. |
| Thorn spear | 3–5 | 2 | Unlimited | 0 | Native reach. |
| Seed bellows | 2–4 | 3 | Unlimited | 0 | Native gourd/reed weapon. |
| Obsidian maul | 4–6 | 1 | Unlimited | 0 | Native heavy melee; ignores 1 armor. |
| Captors' powder rifle | 4–6 | 5 | 5 | 1 | Early firearm. |
| Pulse carbine | 5–7 | 5 | 6 | 3 | Advanced general-purpose firepower. |
| Arc projector | 6–8 | 4 | 5 | 4 | Ignores 1 armor; deals 2 additional damage to one adjacent enemy, never an ally. |
| Singularity lance | 9–11 | 6 | 3 | 7 | Extreme power; ignores 2 armor and greatly shortens the deadline. |

The arc secondary hit is a flat 2 damage, with no separate dodge/armor roll; this is a deliberate simplification. Missed/dodged attacks still spend Act and ammunition. No separate random accuracy miss is added to dodge.

| Armor | HP bonus | Damage reduction | Move modifier | Signature | Other effect |
| --- | --- | --- | --- | --- | --- |
| Woven armor | 0 | 0 | 0 | 0 | +5 percentage points dodge. |
| Shell lamellar | 2 | 1 | −1 | 0 | Native shell/leather construction. |
| Filtered combat mesh | 1 | 1 | 0 | 1 | Musk immunity. |
| Aegis field harness | 3 | 2 | −1 | 2 | Musk immunity; advanced field signature. |

Off-world movement remains cardinal at 1 per tile. No diagonal/1.5 movement rule was introduced. Flight and Leap are explicit species abilities rather than a general change to ground movement. Ground units and fallen recruits block paths; extracted/vaporized units leave the map. Stepped terrain also checks each recruit’s climb limit and total Z travel per Move. Drops exceeding their safe-drop distance cause 3 HP per excess level. The UI previews paths and damage, requires confirmation for damaging drops, and excludes lethal routes. See the build 0.7 traversal table.

## Detection and enforcement

For each recruit, add weapon and armor signature. Let `peak` be the highest personal signature and `total` the squad sum:

`safe turns = max(5, 16 − peak − floor((total − peak) / 3))`

Native expedition gives 16 safe turns; the default pulse-carbine mix gives 13; Heavy signature gives 8. Equipping more advanced armor can reduce those values further. Equipped technology counts even if never fired; abilities, native weapons, and basic sidearms do not create additional signature. The budget is locked at deployment.

The countdown decreases after each enemy phase. At zero, two enforcement drones appear and vaporize a surviving guard if one remains. The furthest-east standing recruit is marked (lowest HP breaks a tie). A marked recruit can escape by extracting before ending that turn; merely moving closer does not remove the mark. At the end of each of the two final turns, a remaining marked recruit is vaporized. At final lockdown, everyone still present—including fallen recruits—is lost. Drone beams ignore HP, dodge, block, armor, and Defend. The drones cannot be attacked.

Mission success requires all mission goals and at least one extracted recruit; full extraction of four is reported separately. If all remaining recruits fall before anyone escapes, the mission fails. If everyone still active has extracted, the outcome is resolved; downed teammates left behind are counted as not extracted. Trial loss does not set permanent story or campaign death rules.

## Presentation and files

Original alien illustrations remain in `assets/sprites/`, with prompts in `assets/sprites/offworld-prompts.json`, for the unchanged preparation/inspection artwork. New directional battle sprites, terrain/props, and a segmented ring enforcer live separately in `assets/battle/`; the manifest and exact prompt records are linked in [build 0.8](BUILD_0_8.md). Equipment controls and stats remain authoritative; the generated figures retain stylized native equipment. All playable assets are local, with no added game dependency installation.

- `offworld.html`, `src/trials-app.js`, `src/trials.css`: setup, battlefield, inspection, results, pause controls, and complete playtest saving.
- `src/battle-scene.js`, `src/battle-scene.css`, `src/battle-assets.js`: isometric scene, selection, view controls, battle-only art mappings, and effects.
- `src/trials-data.js`: recruits, weapons, armor, presets, levels, and signature values.
- `src/trials-engine.js`: testable rules and deterministic random rolls.
- `test/trials.test.js`: rules coverage.
- `scripts/playtest-trials.mjs`: deterministic simulation driver; emits replayable successful-action transcripts for sample seeds.
- [Build 0.9 report](BUILD_0_9.md): current missions, 2,700 final validation runs, and new objective/terrain recording. Build 0.7 documents the original elevation and support experiments.
- [Build 0.6 balance report](OFFWORLD_BALANCE.md): historical results and human-time limitations.

## Next human playtest

Try the nine off-world missions with the default mixed team first. Inspect support roles and test a climb and safe descent; try prioritizing a healer or commander before clearing ordinary guards. Target about 10 minutes including planning. Save the result and note whether you understood the timer before deployment, used the alien ability, felt forced into one weapon, abandoned anyone, or found extraction tedious. Then change one recruit or one item at a time. Native and extreme technology presets intentionally span a wider difficulty range; not every possible custom build is balanced to medium.
