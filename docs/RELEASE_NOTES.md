# Release notes

Consolidated prototype history through October 27, 2026. Newest first. This records what changed; [game mechanics](GAME_MECHANICS.md) describes the complete current behavior, [art direction](ART_DIRECTION.md) the visual approach, and [campaign direction](CAMPAIGN_DIRECTION.md) the story/design boundaries.

Version numbers below are prototype labels, not adoption of permanent campaign rules. Exact dates are given where recorded; early build dates were not consistently recorded. Historical source reports remain in [archive](archive/), machine results in [reports](reports/), and original human results in [playtests](../README.md#saving-playtest-results).

## Current documentation consolidation — October 27

- Replaced overlapping top-level guides with one art reference, one mechanics reference, this release history, and the retained/revised campaign/story reference.
- Archived the original art plans/reviews, rule guides, build reports, design sync, engine assessment, and handoff. Kept historical feedback and every human playtest result.
- Consolidated setup, navigation, playtest-saving instructions, report indexes, and archive guidance into the single repository README; removed the four secondary READMEs.
- Moved large automated results into reports; updated report-writing paths so future runs do not refill the documentation root. Screenshots remain separately organized.
- Reconciled current rules against source, including different Roman/off-world revival fractions, mission-specific detection allowances, queued arrivals, automatic objective progress, and camera controls. This is a documentation/organization change, not a gameplay release or engine migration.

## 0.9 — ten-mission playtest, current rules

The playtest expanded from the Roman opening plus three off-world maps to **the Roman opening plus nine off-world maps: ten total**.

### Camera follow-up — October 27

- Added four quarter-turn views to all nine off-world maps, in both isometric and tactical mode. Rotate buttons and Q/E work while the battlefield has focus.
- Compass, X/Y/Z direction cues, visible cliff faces, depth order, hidden-unit proxies, character-facing frames, movement/effect paths, and enforcer targeting follow the camera.
- Pan/zoom and the angle persist through turns and selections; Reset restores the initial view. Retry/new deployment resets orientation. Arrow-key navigation follows displayed ground axes while actions retain original coordinates.
- Camera changes spend no actions and do not enter the gameplay replay. Presentation/rules identifiers remain `0.9.0`; no new numbered release was assigned to this follow-up.
- Validation reached **76 tests**. Browser checks selected 384 fixture squares over four angles and completed an eight-round / 54-action Foundry run with an exact replay. [Camera report](reports/checks/camera-browser-check.json) · [preview](screenshots/camera-four-angles.png).

### Mission, terrain, art, and recording changes

- **Crown of Ash:** activate a spire and hold its radius for four uncontested phases; counterattacks in rounds 4 and 6.
- **The Last Ferry:** defend a 22-HP beacon through six phases and three finite waves before extraction. Arrivals in rounds 3, 5, and 6.
- **Glassfire Foundry:** breach defenses and destroy two 10-HP engines.
- **The Lantern Caravan:** release and guide an 18-HP cart along a seven-square route to eastern extraction; occupied cells block it.
- **Twin Sluices:** split the squad to hold two controls during three shared uncontested phases.
- **The Silent Archive:** steal a seal, disable an alarm, wait two phases, then recover tablets and extract.
- Added breakable 6-HP barricades across all nine off-world maps. Weapon attacks spend the normal Act/ammo budget; broken structures open movement/sight and stop providing cover without changing height.
- Added protected-device/cart enemy targeting, immediate failure on protected-target loss, multiple arrivals per round, and queued arrivals when entry cells are blocked.
- Added mission checklists, phase/charge/cart progress, protected HP, incoming-round/count forecasts, and structure HP inspection. Removed misleading duplicate objective props; captured spires remain visible and protected HP stays above scenery.
- Authored six new terraced maps using the three existing biomes. Base detection allowances are now mission-specific: 16 on the original three, 19 on Crown/Foundry/Sluices, 21 on Ferry/Caravan/Archive. Moved a salvage barricade off the main return lane after testing.
- Added eight original transparent props: spire, beacon, generator, cart, archive shrine, sluice machinery, intact barricade, broken barricade. Preserved preparation art and the Roman rules.
- Extended recordings with structure HP/destruction, mission state, protected targets, spawned/pending arrivals, terrain/goal events, terrain-damage/destruction metrics, and protected-target damage. Presentation and rules now both identify as `0.9.0`; schema remains 2. Historical 0.7/0.8 replay is preserved.
- Updated scripted players to honor mission-specific goals and pay for breaching, holding, escorting, and demolition through ordinary actions.

Final mission validation used **2,700 runs** across nine maps, three presets, and seeds 2001–2100. Default new-map estimated medians were 7.9–10.8 minutes; native-only Ferry was harder/longer at about 14.5 minutes among successful runs. These are scripted-policy estimates, not human completion rates or stopwatch measurements. The full browser pass completed all six new maps, tested every off-world map, preserved save/download/error behavior, and replayed results. [Full validation](reports/simulations/offworld-v09-validation-2001.json) · [presentation checks](reports/checks/offworld-v09-presentation.json) · [original build report](archive/BUILD_0_9.md) · [objective research](archive/MISSION_RESEARCH_0_9.md).

## 0.8 — battlefield graphics overhaul — October 26

- Replaced the off-world relief effect with a textured isometric SVG scene: solid tile tops, exposed shaded cliff faces, height bands, depth ordering, and readable water/terrain volume.
- Added pan/zoom/reset, optional coordinates, overhead tactical view, accessible top-surface picking, and hidden-unit selection handles. The first implementation used one fixed camera angle; rotation followed under 0.9.
- Added four standing directions and a fallen pose for 14 archetypes; enemies/support roles gained distinct bodies/equipment. Added biome textures, water, vegetation, rubble, objectives, extraction, wagons, and casualties.
- Introduced the segmented ring enforcer, arrival seam, mark/lock connection, and execution beam/dissolve. Added movement, hit, healing, command, and binding/musk feedback with reduced-motion support.
- Applied matching battle art to the Roman opening's existing flat grid. Kept original loadout, recruitment, roster/inspection illustrations, and preparation controls separate and unchanged.
- Retained source atlases/prompts, shared anchors, a manifest, and deterministic PNG packing. No reference-game artwork became playable assets.
- No combat, height, layout, deadline, or AI retuning. Exports used presentation `0.8.0` with rules `0.7.0`, schema 2; compatible replay supported both.
- Historical verification: 63 tests and full browser/save/replay checks, including enforcement and phone layout. [Build report](archive/BUILD_0_8.md) · [approved plan](archive/ART_OVERHAUL_PLAN.md) · [five-game visual study](archive/ART_REFERENCE_REVIEW.md).

## 0.7 — elevation, enemy support, and complete playtest recording — October 26

- Added stepped Z0–3 terrain, per-recruit ground/Z/climb/safe-drop traits, height-aware range/sight/cover, and falling damage of 3 HP per excess drop level.
- Added path/cost/fall previews, damaging-drop confirmation, safe-route preference, and rejection of lethal routes. Flight and Leap received explicit height/landing rules. No diagonal or 1.5-cost movement.
- Added tactical enemy positioning and limited healing, binding, and command abilities. Lower support attack damage kept their abilities central; ranged guards sought useful firing lanes and avoided damaging falls.
- Reterraced the original three maps, placed elevated objectives/lookouts, and moved Bazaar reinforcement to round 4. Basic guard weapon strength/HP were retained.
- Added full initial/final states, ordered events/intermediate snapshots, RNG and damage reductions, movement paths, enemy decisions, statuses, support limits, and action timing. Save schema became 2, with a 16-MiB validated local payload limit.
- Added active/idle/paused/hidden timing, explicit Pause play, and deterministic replay. Existing 0.6.1 summaries were preserved without inventing missing history.
- Validated **3,600 runs** separating control, terrain, enemy, and combined modes. [Report](archive/BUILD_0_7.md) · [raw validation](reports/simulations/offworld-v07-validation-1001.json).

## 0.6.1 — save human notes directly to the repo — October 24

- Added Save to repo on off-world results: notes, difficulty rating, mission/loadout/seed/outcome/metrics, and recent log written to a uniquely named local JSON.
- Confirmed the actual saved path only after success; retained feedback on errors and allowed revised snapshots. Download copy remained available.
- Bounded/validated same-origin loopback requests; server chose paths, never a client-supplied filename. No automatic commit/push or public notes endpoint.
- These historical files are summary records, not full action replays. [Preserved human records and guide](../README.md#saving-playtest-results).

## 0.6 — off-world laboratory — October 22

- Added equipped weapon/armor signature, a deployment countdown, two enforcement turns, marked vaporization, and per-recruit extraction.
- Added four alien recruits: Seli's Flight, Tekk's Leap, Porr's friendly-and-hostile Musk, and Oru's natural armor. Preserved the centurion's Rally/full revive and Roman identities.
- Added seven selectable recruits, four-person squads, free recruitment bench, ten cross-species weapons, four armor choices, and five presets.
- Added Reedwater salvage, Basalt relay, and Spore Bazaar with separate native defenders/objectives. Added variable combat, loadout forecasts, a ten-minute medium target, and elapsed-time/rating/notes export/download.
- Used a fixed base allowance of 16 on those three maps; later releases add height/support and new mission-specific allowances. The Roman opening retained its own rules.
- Recorded **12,000** comparison/validation runs across loadouts, policies, and numeric profiles. Human time remained unverified. [Historical report](archive/OFFWORLD_BALANCE.md) · [saved simulation batches](reports/simulations/).

## 0.5 — first readability art pass — October 22

- Replaced ambiguous Roman tokens with distinct centurion, shield-brother, sword-brother, supporting-soldier, and enemy images, plus matching portrait/selected-unit treatment and stable labels.
- Added grass/mud textures, streams, trees, baggage wagons, rally flags, and casualty stretchers using original sprites and SVG/CSS terrain.
- Added local PNG serving and retained exact generation prompts/transparency. Map cells, rules, AI, balance, and objectives were unchanged.
- Historical verification: 21 tests and desktop/phone image decoding, selection/movement/Defend checks, and no phone overflow. [Art-pass record](archive/ART_NOTES.md).

## 0.4 — story/context and design synchronization — October 8

- Added optional Roman mission briefing and character backgrounds identifying the centurion, brothers, father relationship, and capture/sale premise.
- Added terminal debrief based on actual casualty/squad state; did not invent deaths or permanent consequences for casualties left behind.
- Updated local campaign/handoff context from the design workspace's October 5–8 working files and recorded source hashes/requirement mapping. Combat kept 0.3 tuning; off-world systems and the alien veteran remained future work at that point.
- [Design sync](archive/DESIGN_SYNC_2026-10-08.md) · [source manifest](archive/design-source-manifest.json).

## 0.3 — Roman health/defense balance pass

- Compared six health/defense profiles and three play styles across **5,400 seeded runs**; selected the steady profile.
- Increased enemy HP from 5 to 7, with 5% dodge / 10% block. Player HP became centurion 12, shield brother 11, sword brother 10, supporting soldiers 9.
- Retained player defense chances, weapon ranges/damage, ammunition, cardinal movement, and action categories. Enemy health bars used actual maximum HP.
- Selected-profile simulations supported a modest challenge, but one estimate exceeded 15 minutes; no hard timer or verified human ceiling was added. [Balance record](archive/BALANCE_PLAYTEST.md) · [results](reports/simulations/playtest-results.json).

## 0.2 — variable damage and clear combat information

- Added variable sword, thrown-javelin, and enemy damage; dodge/block for all soldiers, enemies, and reinforcements.
- Defined dodge-first resolution, block's 2-point reduction, stacking with Defend, and zero-floor damage.
- Displayed weapon damage/range, defense chances, and Defend cost/duration/reduction. Combat reports explained rolls, dodges, blocks, and reductions.
- Clarified that water does not block a valid in-range javelin throw; tested throws both ways. A separate melee-javelin action remained unimplemented.

## 0.1 — first Roman baggage-rescue prototype

Initial feedback was recorded September 21, 2026.

- Established the browser-based, native-JavaScript experiment: six controllable soldiers, three carry-only wounded casualties, 12 × 9 board, terrain blockers, a crossing, and rally ground.
- Implemented separate Move/Act/Item-Special, sword/javelin attacks, Defend, ordinary and centurion full revival, carrying/put-down/evacuation, enemy turns/reinforcements, withdrawal/capture, defeat, and restart.
- First feedback identified weak enemies, unclear weapon/Defend information, character-stat discussion, and javelin discoverability/dual-use questions. Later versions resolved parts of that feedback; dual-use javelins and wider progression remain pending.

Original conversational feedback is retained in [playtest notes](playtests/NOTES.md). Do not read its older unchecked boxes or an archived plan as a description of the complete current build.

## Updating this history

Add substantive changes to the relevant release; record unnumbered follow-ups explicitly rather than inventing a version. Keep historical numbers under their original version, and update current mechanics/art/story documents separately. Keep human results immutable, label automated reports as simulations, and distinguish estimated pace from measured human playtime.
