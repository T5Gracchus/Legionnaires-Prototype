# Legionnaires browser prototype

A separate code repository for testing Legionnaires' tactical baggage rescue mission.

Status: build 0.4, synchronized with the October 8 design updates. The Roman rescue now includes a mission briefing, the trio's character context, and an outcome summary. Combat retains the tested build 0.3 rules, which remain provisional pending playtesting.

## Run locally

With Node.js 22 or newer, run `node scripts/serve.mjs`, then open http://127.0.0.1:5173.

Run the rules tests with `node --test`. No dependency installation or build step is required. If npm is available, `npm start` and `npm test` are equivalent.

Select a soldier, choose an action, and click an outlined target. Carry wounded casualties back to the green rally ground and put them down to evacuate them. Return all six soldiers to rally ground to enable withdrawal. In-game instructions explain the current experiment.

See [playtest rules](docs/PLAYTEST_RULES.md) for implementation assumptions, controls, and known limits.

See [playtest notes](docs/PLAYTEST_NOTES.md) for saved feedback and pending improvements.

See [balance playtest report](docs/BALANCE_PLAYTEST.md) for build 0.3 tuning, repeatable simulation scenarios, results, and the limits of the 15-minute estimate. Reproduce with `node scripts/playtest.mjs 300`.

## Design source of truth

The narrative, historical research, one-pager, and decision log live in the [Legionnaires design repository](https://github.com/Leinad0033/legionaries-context). The local sibling checkout is `../Legionaires/`.

- [Decision log](https://github.com/Leinad0033/legionaries-context/blob/main/DECISION_LOG.md)
- [Prototype mission brief](https://github.com/Leinad0033/legionaries-context/blob/main/PROTOTYPE_MISSION_BRIEF.md)
- [One-pager](https://github.com/Leinad0033/legionaries-context/blob/main/LEGIONNAIRES_ONE_PAGER.md)
- [October 8 sync and source revisions](docs/DESIGN_SYNC_2026-10-08.md)
- [Local campaign direction and future-system boundaries](docs/CAMPAIGN_DIRECTION.md)

The design-sync documents also reference newer local working files that were not published in the inspected design-repo revision. Their sibling links require the local checkout layout; see the sync report for source revisions.

Keep implementation, tests, assets, and technical notes here. Keep authoritative design decisions in the design workspace. Do not copy the entire research collection into this repository.

See [the prototype handoff](docs/PROTOTYPE_HANDOFF.md) for confirmed requirements and open choices.

## Technical direction

Browser-based prototype is confirmed. The first experiment uses native JavaScript modules and a DOM grid with no external dependencies. Game rules and mission data are separate from presentation. TypeScript with Phaser remains an option for a later iteration; no engine decision is implied by this experiment.

## Current playable experiment

One replayable baggage rescue mission: grid movement, combat, defense, revival, carrying wounded mission casualties, enemy turns, and a capture ending. Simple tokens and terrain support evaluating the tactics. Six controllable soldiers and three casualties are implemented as provisional test scope, not approved design limits.
