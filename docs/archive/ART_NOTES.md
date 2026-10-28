# Readability art pass — build 0.5

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

Build 0.8 implementation: the approved isometric battle overhaul is now implemented. See [current art/provenance/verification notes](BUILD_0_8.md). Original menu images and preparation-screen layout are preserved; new battle assets live separately in `assets/battle/`. The earlier planning and build-0.5 provenance below remain historical.

October 26 research: the user liked elevation but found it hard to perceive. The requested five-game [visual reference review](ART_REFERENCE_REVIEW.md) and [overhaul plan](ART_OVERHAUL_PLAN.md) informed build 0.8. The build 0.5 notes below describe the original art's provenance.

Confirmed clarification: preserve the loadout and mission-preparation menus, including their original sprites/illustrations and art style. New battle art will use separate assets and mappings so it cannot replace menu artwork inadvertently. See the updated overhaul plan.

October 22, 2026. Presentation update: distinct unit sprites, matching roster/selected-soldier portraits, and tile artwork on the existing battlefield.

## Identity cues

- Centurion: red transverse crest, cloak, and red shield; `C` label.
- Shield brother: blue shield and upright javelins; `B1` label.
- Sword brother: ochre shield and forward sword; `B2` label.
- Supporting legionnaires: shared red-shield sprite with `L1`, `L2`, and `L3` labels.
- Enemy warriors: green/brown clothing, round wooden shields, spears, and square orange ground markers; stable `E1`, `E2`, … labels.

These are provisional visual identifiers, not new equipment bonuses, armor rules, character names, or approved historical asset specifications. Similar Roman kit and the existing roles are retained. Sprites are stylized rather than archaeological reconstructions.

## Battlefield

The exact map cells retain their previous terrain and collision. Grass/mud textures, stream banks and ripples, conifers, wooden baggage wagons, rally flags, and casualty stretchers replace flat colors and text glyphs. Tile coordinates are visible at larger sizes. Selected tiles, valid targets, health bars, carrying markers, fallen indicators, and keyboard focus stay above the artwork.

No combat values, movement costs, action budgets, enemy behavior, mission layout, or objectives change in this art pass. `src/mission.js` remains unchanged.

## Asset provenance

Character artwork was created with the built-in image-generation tool in transparent-background mode. The five optimized project assets live in `assets/sprites/`; original full-resolution generations remain in the tool's default generated-images directory. `assets/sprites/prompts.json` preserves the exact prompts. Images are resized to 256 pixels for this interface, preserving alpha.

Terrain artwork is original inline SVG in `src/art.js`, with CSS ground textures in `src/battlefield.css`. It follows the collision grid rather than adding decorative obstacles that could be mistaken for playable terrain. No remote images, fonts, libraries, or network requests are introduced by the artwork.

The local development server now serves PNG files with the appropriate image content type.

## Verification

- All 21 existing game/story tests pass; mission-rule source has no changes.
- Headless Edge at 1440 × 1150 and 390 × 844: every image decoded, 108 map buttons and nine starting unit sprites present, no horizontal phone overflow, and no page errors or failed HTTP responses.
- Selected the shield brother, moved to D2, used Defend, and advanced through the enemy turn. The correct portrait, unit label, guard marker, and next-round state appeared.
- Inspected [desktop battlefield](../screenshots/build-0.5-battlefield.png) and [phone battlefield](../screenshots/build-0.5-mobile.png) screenshots.
- Sprite corner alpha is zero for every optimized PNG; the art retains transparent backgrounds.

## Build 0.9 mission props

Eight original transparent props were created with the built-in `image_gen.imagegen` tool. Full sources and exact prompts are in `assets/battle/sources/mission-prompts.json`; packed 256-pixel PNGs are in `assets/battle/props/`. See [contact sheet](../screenshots/build-0.9-props.png). These supplement the existing unit/terrain collection without replacing preparation portraits. `scripts/pack-battle-assets.mjs` handles deterministic bounds extraction, nearest-neighbor sizing, anchoring, and PNG packing; it does not draw artwork.
