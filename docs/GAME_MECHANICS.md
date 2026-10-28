# Current game mechanics

Current reference, October 27, 2026. Describes the implemented build-0.9 prototype and camera update, checked against the rules/data files. Numerical values are reversible playtest choices, not permanent campaign decisions. [Story/campaign](CAMPAIGN_DIRECTION.md), [art](ART_DIRECTION.md), and [release notes](RELEASE_NOTES.md) are separate references.

## Two playable rule sets

| | Roman opening | Off-world laboratory |
| --- | --- | --- |
| Playable missions | One baggage rescue | Nine independent trials; ten total including the opening |
| Squad / board | Six soldiers; 12 × 9 flat grid | Four different recruits; 12 × 8 grid, heights Z0–3 |
| Main loop | Recover carry-only casualties, gather the whole squad, withdraw into capture | Choose gear, complete mission goals, extract recruits before detection/enforcement |
| Clock | No detection timer | Equipped gear sets a turn deadline; two enforcement turns follow |
| Persistence | Restartable experiment | Fresh squad/gear each deployment; results can be saved, but there is no resumable campaign |

## Shared turn and combat principles

Each standing character receives **one Move, one Act, and one Item/Special** per player round. They can be used in any order and are not interchangeable action points. A Move is one uninterrupted action, not movement that can be split around an attack. End turn activates enemies, advances the round, expires Defend, and refreshes actions for standing recruits.

Ground movement is cardinal: up/down/left/right at **1 per tile**. There is no diagonal movement and no 1.5 movement cost. Occupied cells, including fallen soldiers, block ordinary movement. Water, trees, and solid obstacles block ground routes. Species movement exceptions are listed below.

Weapon damage is a uniform integer roll between the displayed endpoints. Dodge is checked first and avoids the entire hit. On a non-dodged hit, a separate block check can reduce damage by 2. Applicable defenses stack; final damage is never negative. An attack consumes Act, and a throw/shot consumes ammunition even if dodged. There is no additional random accuracy-miss roll.

At 0 HP a soldier falls, cannot act, and loses unused actions. Ordinary enemies ignore fallen recruits. Revival uses Item/Special, requires a cardinally adjacent fallen ally, and grants no actions until the next player round. A recruit vaporized by enforcement cannot be revived.

## Roman opening

### Soldiers and equipment

| Soldier | HP | Ground Move | Sword damage / range | Javelin damage / range / shots | Dodge | Block |
| --- | ---: | ---: | --- | --- | ---: | ---: |
| Centurion | 12 | 4 | 3–5 / 1 | 2–4 / 3 / 2 | 10% | 20% |
| Shield brother | 11 | 4 | 2–4 / 1 | 3–5 / 4 / 3 | 5% | 30% |
| Sword brother | 10 | 5 | 3–5 / 1 | 2–4 / 3 / 2 | 15% | 10% |
| Each of three supporting legionnaires | 9 | 4 | 2–4 / 1 | 2–4 / 3 / 2 | 5% | 15% |

Sword/Javelin/Defend consume Act. Range is horizontal plus vertical **grid-row/column** distance on this flat map, not terrain height. Javelins can cross water if range and sight permit; trees and wagons block the shot. There is no separate melee-javelin mode.

Defend reduces every incoming hit by 2, or 3 for the shield brother, through the next enemy phase. It protects the defending soldier, not adjacent allies. Ordinary revival restores 25% maximum HP rounded up. The centurion has one full-health revive per mission. Supporting soldiers can also be revived in this experiment.

### Wounded casualties and withdrawal

Three wounded mission casualties are separate from playable fallen soldiers. Pick up a casualty on the same or an adjacent square with Item/Special; each carrier can hold one. Carrying reduces Move to 2 and prevents attacks and revival, but permits Defend.

Put down consumes Item/Special. On rally ground it evacuates the casualty; elsewhere it returns them to the ground. A fallen carrier drops the casualty on their own square. Neither revival action evacuates a mission casualty.

Withdraw becomes available only when **all six soldiers are standing on rally ground and nobody is carrying**. Fewer than three rescued casualties is allowed, but squad members cannot be abandoned through this withdrawal action. Withdrawal ends in capture. The debrief reports evacuated/not-evacuated casualties and standing soldiers; it does not declare unrescued casualties dead. All six soldiers falling causes defeat.

### Enemies

Three enemies start on the map. Each has 7 HP, Move 2, attack 1–3 / range 1, dodge 5%, and block 10%. They follow a shortest open route toward a standing Roman, then attack an adjacent target, preferring lower HP. One reinforcement is attempted when rounds 3, 5, and 7 begin; if both entry cells are occupied that arrival is skipped. This historical Roman behavior differs from queued off-world arrivals.

The opening has no armor inventory, alien powers, Z traversal, destructible terrain, detection, or full off-world replay export. Restarting resets it. Its source is [mission.js](../src/mission.js); narrative/debrief behavior is in [story.js](../src/story.js).

## Off-world preparation

Choose four different recruits from seven; bench recruitment is free. Every recruit can equip any of the ten weapons and four armor sets. Gear changes happen before deployment, not during a mission. Each recruit also carries an unlimited basic sidearm: **2–3 damage, range 1**.

| Preset | Squad and distinguishing equipment |
| --- | --- |
| Native expedition | Centurion, Seli, Tekk, Porr; native gear. |
| One advanced weapon — recommended | Same squad; centurion swaps to pulse carbine and woven armor. |
| Heavy signature | Centurion, Seli, Tekk, Oru; centurion has singularity lance/woven, Oru arc projector/woven. |
| Roman fireteam | Centurion, shield brother, sword brother, Seli; shield brother uses powder rifle/woven. |
| Filtered musk team | Centurion, Seli, Porr, Oru; everyone except immune Porr uses filtered mesh. |

### Recruits

Stats below are **before armor**. Armor adds HP/damage reduction/dodge and modifies ground Move. Equipped ground Move has a minimum of 2; binding then reduces the available ground allowance by 1, minimum 1.

| Recruit | HP | Ground | Dodge | Block | Z travel / Move | Max climb per step | Safe drop | Default weapon / armor |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Centurion | 13 | 4 | 10% | 20% | 2 | 1 | 1 | Gladius / shell lamellar |
| Shield brother | 11 | 4 | 5% | 30% | 1 | 1 | 1 | Javelins / shell lamellar |
| Sword brother | 11 | 5 | 15% | 10% | 3 | 1 | 1 | Gladius / woven |
| Seli, Aer | 10 | 5 | 15% | 5% | 5 | Flight | Flight | Sling / woven |
| Tekk, Bound | 12 | 4 | 10% | 10% | 4 | 2 | 2 | Thorn spear / woven |
| Porr, Murr | 13 | 4 | 5% | 15% | 2 | 1 | 1 | Seed bellows / woven |
| Oru, Krag | 15 | 3 | 2% | 20% | 2 | 1 | 2 | Obsidian maul / woven |

| Ability | Implemented effect and cost |
| --- | --- |
| Centurion — Rally | Item/Special; self or standing ally within range 1 regains up to 4 HP, once per mission. Separate from his one full-health adjacent revive. |
| Shield brother — Shield wall | Passive: Defend reduces incoming damage by 3 instead of 2. No adjacent shield aura. |
| Sword brother — Quick step | Passive: higher base Move and dodge; no additional active action. |
| Seli — Flight | Uses Move; passes over obstacles, water, and units, ignoring fall damage. Lands only on empty ground within 5 height levels of the origin. No separately simulated airborne altitude. |
| Tekk — Leap | Item/Special; bypasses transit obstacles, up to 4 ground squares. Landing must be empty ground, at most 2 levels above the origin and at most 4 levels different in height. Fall damage applies beyond safe drop 2. Move remains available. |
| Porr — Musk burst | Item/Special; stationary radius-2 cloud through two enemy phases. Affected enemies **and allies** lose 1 attack damage and 10 percentage points dodge. Murr and filtered armor are immune. A new burst replaces Porr's previous cloud. |
| Oru — Stone shell | Passive natural armor reduces damage by 1. Defend reduces incoming damage by 3. |

All recruits have ordinary revival to **30% maximum HP rounded up**. This differs from the Roman opening's 25%. Full-health revival is centurion-only and once per mission. Both require adjacency and Item/Special. Rally cannot revive a fallen recruit.

### Weapons

| Weapon | Damage | Range | Shots | Signature | Additional rule |
| --- | --- | ---: | --- | ---: | --- |
| Gladius | 3–5 | 1 | Unlimited | 0 | Melee. |
| Javelin bundle | 3–5 | 3 | 5 | 0 | Can throw across water. |
| River-stone sling | 2–4 | 4 | Unlimited | 0 | Native ranged. |
| Thorn spear | 3–5 | 2 | Unlimited | 0 | Native reach. |
| Seed bellows | 2–4 | 3 | Unlimited | 0 | Native ranged. |
| Obsidian maul | 4–6 | 1 | Unlimited | 0 | Ignores 1 armor. |
| Captors' powder rifle | 4–6 | 5 | 5 | 1 | Early firearm. |
| Pulse carbine | 5–7 | 5 | 6 | 3 | Advanced ranged. |
| Arc projector | 6–8 | 4 | 5 | 4 | Ignores 1 armor; flat 2-damage chain to one adjacent enemy. |
| Singularity lance | 9–11 | 6 | 3 | 7 | Ignores 2 armor. |

The arc's secondary hit has no separate dodge/armor roll and never selects an ally. Chains require a neighboring living enemy within spatial distance 1 of the primary enemy; terrain attacks do not chain. Basic sidearms have no extra signature. There is no reload or ammunition resupply action in the current trial.

### Armor and hit resolution

| Armor | HP bonus | Reduction | Ground Move | Dodge bonus | Signature | Filter |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Woven | 0 | 0 | 0 | +5 percentage points | 0 | No |
| Shell lamellar | +2 | 1 | −1 | 0 | 0 | No |
| Filtered combat mesh | +1 | 1 | 0 | 0 | 1 | Musk immunity |
| Aegis field harness | +3 | 2 | −1 | 0 | 2 | Musk immunity |

After dodge, roll damage and independently test block. Apply command bonus (+1), then block (−2), armor plus natural armor after weapon piercing, Defend (−2 or −3 for shield/Oru), applicable ranged cover (−1), and attacker musk (−1). Clamp to zero. Defender musk and binding each subtract 10 percentage points of dodge, clamped at zero; different effects can combine. Defend lasts through the next enemy phase and stacks with block/armor.

### Movement, height, range, and sight

X/Y are ground coordinates; Z is the one surface height per cell. JSON X/Y are zero-based. UI columns A–L correspond to X1–12, rows to Y1–8; Z0–3 remains zero-based. There are no stacked bridges, underground cells, or free airborne positions.

Each cardinal ground step costs 1. Ascending/descending also spends the absolute height change from the separate Z travel allowance. Upward steps must fit the recruit's climb limit. Ordinary movement cannot pass through units, trees, rubble, live structures, protected devices, or water. Extracted/vaporized recruits leave the map.

Drops beyond safe drop cause **3 HP per excess level**, ignoring dodge, block, armor, and Defend. The route planner favors a safe route when one fits; damaging moves show fall damage/remaining HP and require confirmation. Routes whose accumulated fall damage would incapacitate the recruit are unavailable. Flight and Leap use their specific landing rules above.

Attacks, interactions, healing, and musk use **|ΔX| + |ΔY| + |ΔZ|**. Height adds no direct damage bonus. Intervening terrain at or above the line between the attackers' and targets' head heights blocks a shot. Trees, rubble, and live structures extend two levels above their surface. Water alone does not block shots. A cardinally adjacent tree, rubble pile, or live structure gives 1 ranged damage reduction unless the shooter is higher.

### Enemies

| Type | HP | Move | Damage / range | Dodge | Block | Armor |
| --- | ---: | ---: | --- | ---: | ---: | ---: |
| Thorn guard | 9 | 3 | 2–4 / 1 | 5% | 10% | 0 |
| Seed slinger | 8 | 2 | 2–4 / 4 | 8% | 5% | 0 |
| Shell warden | 12 | 2 | 3–5 / 1 | 2% | 15% | 1 |
| Reed mender | 8 | 3 | 1–2 / 3 | 8% | 5% | 0 |
| Spore binder | 8 | 3 | 1–2 / 3 | 8% | 5% | 0 |
| Shell caller | 10 | 3 | 2–3 / 2 | 5% | 15% | 0 |

Enemies have Z travel 3, climb 1, safe drop 1, and avoid routes that deal falling damage. They evaluate firing opportunities, distance, cover, elevation, objective proximity, exposure, and movement cost. Ranged units penalize adjacency. Targeting favors low-HP recruits over Defending ones and also considers protected carts/beacons. Intentions are conditional, not promised future actions.

| Support action | Effect | Limits |
| --- | --- | --- |
| Mend | Another living ally within range 3 and clear sight heals up to 4 HP | 2 uses; two-round cooldown; no revive |
| Binding spores | Recruit within range 3 and clear sight loses 1 ground Move and 10 percentage points dodge through the next player turn and enemy phase | 3 uses; two-round cooldown; no stacking of binding |
| War chant | Other living allies within range 3 gain +1 attack damage this enemy phase | 2 uses; three-round cooldown; no extra attacks |

Support replaces the enemy's attack. Support can happen before movement, or after repositioning. Callers activate first. Removing a caster prevents future casts; an existing bind expires normally. Exact positions, authored waves, and heights are in [base data](../src/trials-data.js) and [additional missions](../src/trials-missions.js).

### Destructible terrain

All nine off-world maps have breakable structures. Barricades have **6 HP**; Foundry engines have **10 HP**. Use an ordinary weapon/sidearm attack, spending Act and ammunition and rolling the weapon's damage. Terrain has no dodge or block. Destroyed barricades become walkable debris, stop blocking sight, and stop providing cover. Height does not change; there is no floor collapse, chain explosion, or physics simulation. Enemy AI attacks recruits/protected targets, not a general terrain-demolition order.

The ferry beacon and escort cart are friendly protected targets, not attackable player terrain. They occupy their cells and can be damaged by enemies. Their destruction immediately fails the mission, even if recruits remain alive or other goals were completed.

## Mission catalog and objectives

Ordinary Secure/Free uses Item/Special on this or a spatially adjacent unlocked objective. Captives leave safely when freed; they are not carry-only casualties and do not join the active squad. Every off-world mission requires its complete checklist **and then individual extraction on an X tile**. Four-person extraction is the preferred outcome, not the minimum victory condition.

| # | Mission | Current goals | Base safe-turn allowance / scheduled arrivals |
| --- | --- | --- | --- |
| 1 | Roman baggage rescue | Evacuate casualties and withdraw all six standing soldiers into capture | No detection; one attempted arrival in rounds 3, 5, 7 |
| 2 | Reedwater salvage | Recover two bundles; extract west | 16 / round 5 |
| 3 | Basalt relay | Disable two relays; extract west | 16 / round 5 |
| 4 | The spore bazaar | Free two captives; extract west | 16 / round 4 |
| 5 | Crown of Ash | Activate summit spire; hold its radius for **4 uncontested enemy phases**; extract | 19 / rounds 4, 6 |
| 6 | The Last Ferry | Light **22-HP** beacon; survive **6 enemy phases**, clear all initial enemies and **3 waves**; extract | 21 / rounds 3 (2 enemies), 5 (1), 6 (2) |
| 7 | Glassfire Foundry | Destroy both **10-HP** engines; extract | 19 / round 6 |
| 8 | The Lantern Caravan | Release **18-HP** cart, guide it across its **7-square route**, then extract at the eastern ferry | 21 / round 5 |
| 9 | Twin Sluices | Different standing recruits hold both controls for **3 shared uncontested enemy phases**; extract | 19 / round 5 |
| 10 | The Silent Archive | Steal seal → disable alarm → wait **2 enemy phases** for seal opening → recover tablets → extract | 21 / round 5 |

Hold/linked progress advances after enemies act. Eligible holders and contesters are within one cardinal ground square and at most one height level of the control, as shown by the gold outline. Fallen recruits cannot hold. Empty/contested controls pause progress without erasing accumulated charge; the sluices need different recruits at both controls in each contributing phase.

After enemies act, a released cart with a surviving nearby standing guide advances up to **two route squares**. Occupied or blocked cells stop it; it never teleports past them. The guide uses the same one-ground-square/one-height-level proximity rule. The cart must reach the last route square before extraction unlocks.

Off-world arrivals enter after an enemy phase, giving the player a turn before they act. Multiple arrivals in a round are supported; occupied/blocked entry cells queue their arrival until clear instead of deleting it. Ferry completion requires every scheduled arrival to have actually entered and all enemies to have been defeated; camping an entry cannot bypass a wave.

### Detection, enforcement, extraction, and defeat

For each recruit, add equipped weapon + armor signature. Let `total` be the squad sum and `peak` the largest individual signature:

`penalty = peak + floor((total − peak) / 3)`

`safe turns = max(5, mission base allowance − penalty)`

The base allowance varies by mission; it is **not always 16**. On the original three maps, Native expedition has 16 safe turns, One advanced weapon 13, and Heavy signature 8. The same presets respectively have 19/16/11 on Crown/Foundry/Sluices and 21/18/13 on Ferry/Caravan/Archive. The deployment forecast is authoritative for customized gear.

Equipped technology counts even if never fired. Native gear, abilities, and sidearms add no extra active-use signature. The budget is locked at deployment and decreases after each enemy phase.

At zero, enforcement arrives, vaporizes a surviving enemy if available, and marks the furthest-east standing recruit; lower HP breaks ties. The player gets **two final player turns**. Extract a marked recruit before ending that turn to escape their beam. Moving alone does not clear the mark. A remaining marked recruit is vaporized at each enforcement turn's end. Final lockdown loses everyone still present, including fallen recruits. Beams ignore HP and all defenses; drones cannot be attacked.

Extract consumes Item/Special and requires an X tile plus all completed goals. Mission success requires all goals and at least one safe extraction when no active recruits remain, or at final lockdown. Falling recruits are not active; if all standing recruits fall before anyone escapes, the mission fails. Protected-target destruction is always defeat. Survivors extracted, fallen recruits left behind, and vaporized recruits are reported separately. These trial outcomes do not define permanent campaign death/recovery rules.

## Controls, results, and records

Choose a recruit, an order, then an outlined square. Hover/focus to inspect coordinates, HP, weapon stats, enemy intention/support limits, terrain HP, and movement/fall previews. Pan by dragging; zoom with +/−; Rotate buttons or Q/E while the map has focus select four views. Reset restores the initial camera. Coordinate labels and tactical view can be toggled. Arrow navigation follows the displayed ground axes; all actual actions retain world coordinates. Retry/new deployment resets camera and mission state.

Pause play disables play and records the break separately. Hidden-page time is also paused. Timing separates total, estimated active, idle after 60 seconds without foreground input, and paused/hidden time. Reading/planning may count as idle; this is not attention tracking. Timing stops at mission end, before feedback writing.

On a completed off-world mission, rate difficulty and add notes, then **Save to repo**. Each save creates a uniquely named JSON in [playtests](../README.md#saving-playtest-results); revised notes create another file. There is no automatic save, commit, or push. Failed saves retain the form; Download copy is a backup. Restarting/changing loadout discards unsaved trial feedback.

Current exports identify presentation/rules `0.9.0`, save schema 2. They contain seed/loadout/outcome, notes/rating, objectives, metrics, timing/action times, full initial/final state, RNG rolls, successful actions/paths, enemy decisions, combat reductions, support/status events, terrain destruction, goal progression, protected targets, and pending/spawned waves. Metrics include actions, attacks, damage, knockdowns, kills, abilities, revives, enemy attacks/support, falling, enforcement losses, terrain damage/destruction, and protected-target damage. Camera changes are not gameplay actions.

The local save endpoint accepts same-origin loopback JSON, bounds payloads to 16 MiB, validates nested data, and chooses the filename. It does not expose notes through static serving or send external analytics. Full 0.7 and compatible 0.8/0.9 records can be replay-verified; 0.6.1 summary records cannot acquire missing history retroactively. See [record guide](../README.md#saving-playtest-results).

## Balance target and remaining limits

Start with One advanced weapon. The final 2,700-run validation sample estimates median times of roughly 8–11 minutes for its six new missions; these are scripted players and planning-speed estimates, not measured human duration or human win rates. Native-only Ferry is deliberately harder/longer; extreme signature can make extraction hazardous. The Roman opening targets a modest challenge within about 15 minutes, also not a verified human ceiling. [Release notes](RELEASE_NOTES.md) links the evidence and version-specific limits.

There is no campaign progression, permanent stat growth, ship hub, augmentation/recovery system, undo, mid-mission save/load, ammunition resupply, full equipment-specific sprite system, stacked terrain, or diagonal movement. Dual-use javelins and broader character stats remain pending discussion/work. Do not treat these absent systems as approved implementation requirements.

## Maintaining this reference

Update this document whenever rules, values, mission goals, controls, or recording change. Put changes in [release notes](RELEASE_NOTES.md), design/lore decisions in [campaign direction](CAMPAIGN_DIRECTION.md), and appearance in [art direction](ART_DIRECTION.md). Main rule sources: [Roman rules](../src/mission.js), [off-world data](../src/trials-data.js), [off-world engine](../src/trials-engine.js), [missions](../src/trials-missions.js), [goals](../src/trials-goals.js), and [recording](../src/trials-telemetry.js).
