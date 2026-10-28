# Build 0.8 — isometric battle art

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

October 26, 2026. Implements the approved [graphics overhaul](ART_OVERHAUL_PLAN.md) and [five-game reference direction](ART_REFERENCE_REVIEW.md). The loadout, recruitment, and mission-preparation screens retain their original illustrations, layout, and controls. Battle art is a separate local asset collection.

## Battlefield presentation

The off-world board now renders as an SVG isometric scene. Each tile has a textured top and exposed, shaded side faces with one 24-pixel band per Z level at native scene scale. Higher tiles physically rise above lower ones; the water surface and cliff edge no longer rely on tiny Z badges to describe the terrain. Coordinate/height labels can be toggled independently.

The scene provides pan, zoom, reset, logical-grid keyboard navigation, and a tactical overhead view. Clickable top surfaces remain tied to the engine's original X/Y coordinates. Cliff faces do not issue movement orders. Hidden units have a visible silhouette/selection handle; their inspection text still exposes the exact tile and state. On phones, the view can be panned and zoomed while the rest of the page stays within its viewport.

All three biomes use original new ground textures. New water, trees, rubble, salvage, relays, captive stockades, extraction standards, wagons, and wounded-casualty props replace the old battlefield symbols. Secured salvage and freed-captive props leave the scene, retaining a completion marker. Disabled relays remain visibly marked.

## Characters and enforcement

Four directional standing views and a fallen pose are available for 14 archetypes: the centurion, two brothers, supporting legionnaire, Seli, Tekk, Porr, Oru, and the six enemy roles. Enemies now have distinct bodies and equipment, including the reed medicine kit, fungal binder, and standard/drum caller. Existing menu portraits remain the visual identity reference; they were not overwritten or redirected to battle sprites.

The enforcer is an original dark core surrounded by segmented white-and-gold rings. Its arrival seam, hovering rings, target halo, visible connection, and precise execution beam distinguish it from ordinary enemies. The two-turn countdown and existing target-selection rules are unchanged. Hit, healing, command, musk/binding, movement, and vaporization effects are derived from resolved gameplay events; presentation does not introduce random rolls or change combat.

Movement animates through the recorded X/Y/Z path with a 650 ms cap. Orders and unit selection are briefly locked during movement to prevent the picture from lagging behind a new action. Reduced-motion preference skips movement interpolation and continuous effects. Presentation history resets on every deployment, including same-map/same-seed retries.

The Roman rescue keeps its original flat grid and rules, with new battlefield units, terrain textures, wagons, stretchers, and rally standards. Its briefing, roster, and inspection illustrations retain the old art treatment.

## Assets and provenance

All new bitmap art was produced with the **built-in image-generation tool**, using original project illustrations as identity references for heroes. The reference games informed composition/readability; their sprites and terrain were not imported into playable assets.

- [Battle asset manifest](../../assets/battle/manifest.json): source atlas crop rectangles, output frames, dimensions, anchors, props, and textures.
- [Roman hero prompts](../../assets/battle/sources/prompts-heroes.json) and [alien prompts](../../assets/battle/sources/prompts-aliens.json).
- [Enemy prompts](../../assets/battle/sources/prompts-enemies.json).
- [Enforcer and objective prompts](../../assets/battle/sources/prompts-objectives.json).
- [Roman prop prompts](../../assets/battle/sources/prompts-roman-props.json), [tree/rubble/water prompts](../../assets/battle/props/prompts.json), and [biome texture prompts](../../assets/battle/terrain/prompts.json).

Sources are retained under `assets/battle/sources/`. Production sprites are packed into 128 × 160 transparent canvases with a shared foot anchor, props into 256 × 256 canvases, and top textures into 256 × 256 swatches. Packing uses deterministic frame extraction, nearest-neighbor resizing, retained alpha, and palette PNG compression; it does not generate or repaint artwork. `scripts/pack-battle-assets.mjs` documents the optional Sharp dependency used for this developer step. Playing the game still requires no dependency installation.

The original `assets/sprites/` files remain byte-for-byte unchanged. The new `battle-assets.js` helpers deliberately cannot change the menu image helper. Generated poses retain stylized equipment; the exact currently equipped weapon/armor remains authoritative in the unchanged inspection and action controls. This is a sprite presentation pass, not a fully articulated equipment-model system.

## Saved results and rule compatibility

New exports identify `version: "0.8.0"` and `rulesVersion: "0.7.0"`. Engine snapshots and deterministic events retain the 0.7 rules identity. The local server accepts complete schema-2 results from either build, and `scripts/replay-trial.mjs` verifies compatible 0.8 results against the same rules. Historical records are preserved.

No map cells, heights, movement costs, hit points, support limits, deadlines, enemy AI, or objectives were changed for this art pass. The 0.7 difficulty data remains the relevant rules validation; no new balance claims are inferred from the new appearance.

## Verification

All **63 Node tests pass**, covering existing Roman/off-world rules and save/replay checks, plus original menu-image hashes, complete local battle asset coverage, and substantial height projection. The preparation-screen screenshot is byte-identical to the captured pre-overhaul build-0.7 baseline at the same viewport. Production battle PNGs and metadata total about 1.1 MB; retained full-resolution sources are separate from the files loaded by the game.

Browser checks use a temporary repository/server, not the human-results folder. They exercise surface/hidden-unit picking, keyboard input, view controls, normal/reduced motion, a confirmed/cancelled drop, enforcement arrival/lock/vaporization/lockdown, same-seed retry, retained notes on failed saves, downloading, and complete result/replay verification. Reference runs deliberately include both success and failure:

| Level / seed | Outcome | Recruits extracted | Rounds | Successful actions |
| --- | --- | ---: | ---: | ---: |
| Reedwater / 42 | Success | 4 | 8 | 50 |
| Basalt / 42 | Success | 4 | 8 | 52 |
| Bazaar / 42 | Defeat | 0 | 16 | 77 |
| Bazaar / 7 | Success | 4 | 11 | 73 |

All four browser results matched the unchanged rules driver, including the failed run, and their saved traces replayed exactly. The run used **194 ordinary mouse picks**, including visible handles for obscured units, with no keyboard fallback required for the mission transcripts. Keyboard navigation/activation was also checked separately. There were no page errors or failed asset responses. These are automated checks, not human difficulty ratings. Screenshots in `docs/screenshots/build-0.8-*.png` show the new battlefields, phone view, enforcement, Roman rescue, results, and preserved preparation screen.

## Next human check

Start with One advanced weapon. Try reading height with Coordinates off, then turn labels on to check your interpretation. Inspect and select units near trees and raised platforms. Try the lookout and a previewed drop, compare isometric/tactical views, and note whether the enforcer target and remaining turns stay clear. Save the result with any wrong-cell clicks, hidden units, difficult colors, or effects that felt too slow.
