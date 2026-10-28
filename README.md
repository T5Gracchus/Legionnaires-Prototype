# Legionnaires prototype

A browser tactics prototype with **ten missions**: the Roman baggage-rescue opening and nine off-world trials. Current build 0.9 includes elevation, enemy support, varied mission goals, destructible terrain, new battle art, and four-angle camera rotation. Preparation illustrations retain their original style. Numerical rules and mission details remain playtest experiments.

This is the repository’s **single README**: setup, documentation navigation, playtest saving, automated reports, and archived material are all indexed here.

## Run locally

With Node.js 22 or newer, run:

```text
node scripts/serve.mjs
```

Open [the Roman opening](http://127.0.0.1:5173/) or [the mission chooser](http://127.0.0.1:5173/offworld.html). Start off-world testing with **One advanced weapon**. Complete the checklist, then extract each recruit. The Roman opening instead requires casualty evacuation and whole-squad withdrawal.

Drag to pan; +/− zoom; Rotate buttons or Q/E while the map has focus select four angles. Reset restores the starting view. Coordinates reveals labels; tactical view shows the map overhead. Pause play during breaks. Stop the local server with Ctrl+C in its terminal.

No dependency installation or build step is needed to play. Where npm is available, `npm start`, `npm test`, and `npm run test:trials` are equivalent shortcuts.

## Documentation

Maintain these four references in place rather than adding competing current guides:

| Reference | Contents |
| --- | --- |
| [Art direction](docs/ART_DIRECTION.md) | Visual goals, reference games, character/terrain/enforcer treatment, existing assets, and production workflow. |
| [Game mechanics](docs/GAME_MECHANICS.md) | All current Roman/off-world rules, values, abilities, equipment, ten missions, controls, and recording. |
| [Release notes](docs/RELEASE_NOTES.md) | Changes from 0.1 through 0.9, camera follow-up, and documentation consolidation. |
| [Story and campaign direction](docs/CAMPAIGN_DIRECTION.md) | Roman trio, capture premise, Confederation context, proposed systems, and open decisions. |

| Supporting folder | Contents |
| --- | --- |
| [Human playtests](docs/playtests/) | Original JSON results and [historical feedback notes](docs/playtests/NOTES.md). See the saving guide below. |
| [Automated reports](docs/reports/) | Simulation and browser-check evidence, separate from human sessions. |
| [Screenshots](docs/screenshots/) | Art comparisons, missions, camera views, and phone checks. |
| [Archive](docs/archive/) | Preserved original guides, plans, build reports, design sync, handoff, and engine research. |

## Saving playtest results

On a completed off-world mission, enter a difficulty rating and notes, then click **Save to repo**. The local server creates a unique timestamped JSON file in `docs/playtests/` and confirms its actual path after writing. Existing records are not overwritten. Edit notes and save again to keep a revised snapshot; Download copy provides a backup.

There is **no automatic save, commit, or push**. Notes can be lost on retry, refresh, or changing the loadout before saving. If a save fails, the form retains the notes and allows retry/download. Files remain in this local Git checkout until committed and pushed.

Current schema-2 exports identify presentation/rules `0.9.0`. They retain notes/rating, seed/loadout/outcome, objectives, metrics, timing, complete initial/final state, ordered events/snapshots, movement paths, enemy decisions, random rolls/reductions, statuses, structures, protected targets, and pending/spawned arrivals. The [mechanics reference](docs/GAME_MECHANICS.md#controls-results-and-records) describes the full current recording behavior.

Timing distinguishes total, estimated active, idle after 60 seconds without foreground input, and paused/hidden time. Thinking or reading can be classified as idle; this is not attention tracking. Timing freezes at mission end, excluding feedback writing. Pause explicitly during breaks.

The local endpoint accepts bounded, validated same-origin loopback JSON and chooses the filename; clients cannot choose an arbitrary output path. Notes are not exposed by static serving, and there is no external analytics service. Tested full traces are typically around 0.7–1.3 MB; the server limit is 16 MiB. A rejected large result can still be downloaded.

To verify a complete recorded run:

```text
node scripts/replay-trial.mjs docs/playtests/YOUR-FILE.json
```

Complete 0.7 traces, 0.8 exports with compatible 0.7 rules, and current 0.9 traces can be replay-verified against every generated event/intermediate snapshot and the final state. Older 0.6.1/schema-1 summaries remain readable, but lack the history needed for replay. Historical human files are preserved; automated saves use temporary test folders.

JSON X/Y coordinates are zero-based. The UI uses columns A–L (X1–12), rows Y1–8, and heights Z0–3.

## Reports and verification

Run the rules, art, local-save/API, and replay checks:

```text
node --test
```

Repeat the current mission simulations:

```text
node scripts/playtest-missions.mjs 100 2001
```

New simulation outputs go to `docs/reports/simulations/`. Optional browser checks use Playwright through `PLAYWRIGHT_MODULE` and save reports in `docs/reports/checks/`. The camera and mission-presentation scripts close their own test servers. Human results stay separate.

| Evidence | Location |
| --- | --- |
| Roman build-0.3 comparison | [Results](docs/reports/simulations/playtest-results.json) |
| Off-world build-0.6 tuning | [Live](docs/reports/simulations/offworld-playtests-live-1.json), [gentle](docs/reports/simulations/offworld-playtests-gentle-1.json), [pressure](docs/reports/simulations/offworld-playtests-pressure-1.json), [held-out live](docs/reports/simulations/offworld-playtests-live-1001.json) |
| Build-0.7 validation | [Four modes / three maps / three presets](docs/reports/simulations/offworld-v07-validation-1001.json) |
| Build-0.9 mission validation | [Exploratory sample](docs/reports/simulations/offworld-v09-validation-1001.json), [final held-out sample](docs/reports/simulations/offworld-v09-validation-2001.json)—2,700 runs each |
| Browser checks | [Mission art/progress](docs/reports/checks/offworld-v09-presentation.json), [camera and complete-mission replay](docs/reports/checks/camera-browser-check.json) |

These are scripted-policy simulations and browser automation, not human success probabilities. Estimated duration is not a stopwatch measurement or completion-time guarantee. Re-running a script replaces its matching automated report and uses today’s imported engine—it does not recreate a historical build merely because a driver has an old filename. Preserve reports when comparing versions, and identify fresh runs by build, seed, and settings.

## Archived material

Historical documents are retained for provenance, not as competing current instructions. Relative links were repaired when they moved. Their original values, qualifications, proposed features, and status statements describe their original context; use the four references above for current information.

| Material | Original sources |
| --- | --- |
| Art research and planning | [Initial art pass](docs/archive/ART_NOTES.md), [five-game review](docs/archive/ART_REFERENCE_REVIEW.md), [approved overhaul plan](docs/archive/ART_OVERHAUL_PLAN.md), [camera notes](docs/archive/CAMERA_CONTROLS.md) |
| Build reports | [0.7](docs/archive/BUILD_0_7.md), [0.8](docs/archive/BUILD_0_8.md), [0.9](docs/archive/BUILD_0_9.md) |
| Historical rules and balance | [Roman rules](docs/archive/PLAYTEST_RULES.md), [Roman balance](docs/archive/BALANCE_PLAYTEST.md), [off-world guide](docs/archive/OFFWORLD_TRIALS.md), [off-world balance](docs/archive/OFFWORLD_BALANCE.md), [mission research](docs/archive/MISSION_RESEARCH_0_9.md) |
| Design context | [Design sync](docs/archive/DESIGN_SYNC_2026-10-08.md), [source manifest](docs/archive/design-source-manifest.json), [handoff](docs/archive/PROTOTYPE_HANDOFF.md), [campaign reference before consolidation](docs/archive/CAMPAIGN_DIRECTION_2026-10-27.md) |
| Engine research | [MonoGame assessment](docs/archive/MONOGAME_ASSESSMENT.md)—an evaluation, not an adopted migration |

## Implementation and design sources

Rules/data are separate from browser presentation. The off-world renderer combines SVG terrain with local raster assets. Original illustrations live in `assets/sprites/`; battle artwork, prompts, and packing metadata live in `assets/battle/`. Playing requires no added runtime packages; optional art/browser developer workflows have their own dependencies.

The separate [Legionnaires design repository](https://github.com/Leinad0033/legionaries-context) and local sibling checkout `../Legionaires/` remain authoritative for accepted story/design decisions. [Campaign direction](docs/CAMPAIGN_DIRECTION.md) records the source trail and separates accepted direction, proposals, and playable experiments. Sibling links require that checkout layout; no production engine choice or migration is implied by the prototype.
