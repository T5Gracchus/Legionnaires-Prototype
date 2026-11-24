# Build 0.9 — ten-mission playtest

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

The playtest now contains **the existing Roman opening plus nine off-world missions**, including six new missions. All ten appear in the off-world chooser; the Roman card opens its original standalone game. Preparation portraits, equipment controls, cardinal movement costs, and the Roman tutorial's combat/casualty rules are preserved.

## Mission catalog

| # | Mission | Goal and layout |
| --- | --- | --- |
| 1 | The baggage rescue | Existing Roman opening: rescue casualties and withdraw. |
| 2 | Reedwater salvage | Recover two bundles on river terraces. Optional destructible barricade on the eastern bank. |
| 3 | Basalt relay | Disable two raised relays. A breakable barrier replaces a rubble obstruction. |
| 4 | The spore bazaar | Free two captives through a hostile support team. A breakable stockade opens another lane. |
| 5 | Crown of Ash | Activate the summit spire; hold its outlined radius for four uncontested enemy phases, then extract. Counterattacks in rounds 4 and 6. |
| 6 | The Last Ferry | Light a 22-HP beacon, defend for six phases, defeat all waves arriving in rounds 3, 5, and 6, then extract. Two breakable causeways connect the banks. |
| 7 | Glassfire Foundry | Destroy two 10-HP crystal engines. Breach barricades or take the longer approach through stepped foundry terrain. |
| 8 | The Lantern Caravan | Release an 18-HP cart and escort it through the pass to the eastern ferry; extract there. The cart advances two route squares after enemies act if a standing guide survives nearby after enemy actions. Occupied cells stop it. |
| 9 | Twin Sluices | Different standing recruits must hold both outlined controls during three shared uncontested phases. Split across channels and terraces, then return to extraction. |
| 10 | The Silent Archive | Steal the seal, silence the alarm, wait two enemy phases for the archive seal, then retrieve the tablets and extract. Stages cannot be skipped. |

Hold/charge progress pauses when a control is empty or contested. Eligible holders/contesters are within one cardinal ground square and no more than one height level away. The painted outline shows that radius. Interaction and weapon range continue to count X/Y/Z as before. Fallen recruits cannot hold or guide.

## Art and feedback

Eight new transparent props: control spire, ferry beacon, generator, escort cart, archive shrine, sluice mechanism, intact barricade, and broken barricade. Each new map has its own mission landmark and authored terrain layout. All nine off-world maps include destructibles. Original art, prompts, and packed assets are retained locally; `node scripts/pack-battle-assets.mjs` reproduces packing. See [asset contact sheet](../screenshots/build-0.9-props.png).

Barricades have 6 HP. Use an ordinary weapon/sidearm attack: it spends Act and ammunition as usual, rolls the weapon's damage, and cannot be dodged or blocked by terrain. Breaking a barricade opens movement and sight and removes its cover. Generators use the same attack interaction. Destroyed debris is low and walkable; terrain height does not change. Enemy combat/support behavior now also considers protected devices and carts. The HUD shows their HP; loss causes immediate mission failure.

A mission checklist displays ordered stages, hold/charge progress, escort progress, protected HP, and incoming reinforcement rounds/counts. Blocked arrivals wait until their entry cell clears, rather than silently disappearing. Structures have visible HP bars and descriptive inspection text. The results screen includes structure destruction, terrain damage, and protected-target damage.

## Validation

- 74 rules, save/API, art-preservation, and replay checks passed. Tests cover contest/empty/fallen holders, multi-entry and blocked waves, delayed archive stages, escort occupancy, protected failure, destructible movement/sight/cover, and full mission replays.
- A browser pass executed ten complete off-world runs: all nine maps plus a second rescue seed. All six new missions completed and extracted four recruits at seed 42. It checked 495 mouse selections and two keyboard selections, loaded every image, exercised save/download/failure handling and full replay, tested phone layout, and checked enforcement. No browser errors or failed assets. The Roman opening loaded with its 108 cells.
- Save/replay testing uses a temporary repository, not invented human playtest files. Existing human notes were preserved. The complete human build-0.7 record still reproduces every state and event exactly. Older 0.6 records remain summary-only.
- Final balance validation: **2,700 simulated missions**, seeds 2001–2100, nine maps × three equipment presets × 100 seeds. [Full report](../reports/simulations/offworld-v09-validation-2001.json). Seeds 1–30 and the earlier 1001 sample informed tuning; the 2001 sample was held out until the final rules/layouts were chosen.

### Six new maps, recommended One advanced weapon preset

| Mission | Success / 100 | All four extracted / 100 | Median estimated minutes | 90th percentile |
| --- | ---: | ---: | ---: | ---: |
| Crown | 100 | 97 | 8.4 | 9.3 |
| Ferry | 100 | 100 | 10.8 | 12.0 |
| Foundry | 100 | 100 | 8.4 | 9.9 |
| Caravan | 96 | 96 | 7.9 | 9.3 |
| Sluices | 98 | 98 | 9.1 | 10.6 |
| Archive | 100 | 98 | 9.5 | 11.3 |

These are objective-aware scripted players using revives, defenses, and legal actions, not human win rates. Their high completion rates support solvability; they do not prove medium human difficulty. Successful-run timing assumes 90 seconds orientation + 6 seconds/action + 8 seconds/round. Extra planning or rule learning can take longer. The 10-minute target remains provisional.

Native-only Ferry is a harder, longer experiment: 74/100 successes, estimated median 14.5 minutes. Its preparation message recommends One advanced weapon. Heavy gear is faster in some maps but a shortened signature deadline still causes losses, especially on the sluices. These deliberate loadout tradeoffs remain visible, not silently normalized by preset.

## Reproduce

`node --test`

`node scripts/playtest-missions.mjs 100 2001`

With Playwright available through `PLAYWRIGHT_MODULE`, run `node scripts/check-trials-browser.mjs` for full UI/save/replay checks and `node scripts/check-mission-presentation.mjs` for the final objective/art display. Both close their test servers. The final presentation report is [here](../reports/checks/offworld-v09-presentation.json).

Run manually with `node scripts/serve.mjs`, then open `http://127.0.0.1:5173/offworld.html`. Begin with One advanced weapon. The local app is left stopped after automated tests.

## Format and boundaries

New results identify both presentation and rules as `0.9.0`, retain save schema 2, and include mutable structure HP, goal state, protected targets, pending/spawned waves, terrain/goal events, and the complete replay. The save API still accepts historical records and validates bounded data and local origin. Paths remain server-chosen unique files.

No campaign progression, permanent death, new character-stat system, terrain collapse, diagonal movement, or movement-cost change was added. The six new missions and numerical values are reversible experiments. [Research and design rationale](MISSION_RESEARCH_0_9.md).
