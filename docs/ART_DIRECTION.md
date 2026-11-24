# Art direction

Current reference, October 27, 2026. Covers the implemented battlefield work through build 0.9 and its camera update. [Mechanics](GAME_MECHANICS.md) defines what the visuals represent; [release notes](RELEASE_NOTES.md) records when it changed.

## The look we are building

Legionnaires uses readable, textured isometric battlefields with upright, expressive sprite characters. Terrain should feel solid and inhabited, but the player must recognize a unit, judge a height difference, and identify a legal action before noticing decorative detail. Roman equipment and handmade alien materials contrast with the immaculate geometry of enforcement technology.

The preparation screens deliberately retain the original illustrated portraits, sprites, layout, and art style. Compact battlefield sprites are a separate presentation of the same characters. New battlefield art must not overwrite or redirect the menu illustrations.

These are working prototype art choices, not a commitment to a production engine or a complete historical equipment specification. The [story/campaign reference](CAMPAIGN_DIRECTION.md) supplies the narrative boundaries.

## Reference games and what we took from them

| Reference | Direction for Legionnaires |
| --- | --- |
| **Final Fantasy Tactics** | Give ledges substantial exposed faces and readable walkable tops. Height must communicate through terrain volume, not only a Z label. |
| **Tactics Ogre** | Use consistent tile scale, restrained cliff bands, and surface-aligned tactical highlights. Test units behind terrain as carefully as units in the open. |
| **Triangle Strategy** | Build atmosphere through coherent materials, warm/cool palettes, contact shadows, and a tangible environment. Keep active play sharp; avoid blur or bloom that hides information. |
| **Shining Force** | Use simplified map silhouettes and more detailed character illustrations at different presentation scales. Large combat cutaways are not part of the current prototype. |
| **Shining Force II** | Make a varied party legible through proportions, posture, and broad color masses. Species and enemy roles should read before their labels. |

This was a screenshot study, not a claim of fresh playthroughs. Publisher imagery and explicitly identified fan captures remain documented in the [archived visual review](archive/ART_REFERENCE_REVIEW.md), with sources, edition caveats, and rights attribution. No reference-game artwork was copied into playable assets.

## Battlefield and terrain

The off-world scene projects a fixed X/Y grid into an isometric view and raises each surface by its Z height. Textured tops sit on shaded cliff faces; repeated height bands show scale. The current native scene uses 80 × 40 tile tops and 24 pixels per height level. Each cell has one ground surface: these visuals do not imply stacked floors or walkable spaces underneath ledges.

Trees, rubble, structures, props, and characters stand upright on the ground. Their depth order and visible cliff faces change with the camera. Hidden units receive readable overlays and selection handles. Clickable tile tops retain their original coordinates; a cliff face is not an alternate movement target.

| Material family | Treatment and current missions |
| --- | --- |
| Reedwater | Wet green/ochre earth, trees, river water, and banks. Salvage, Last Ferry, Twin Sluices. |
| Basalt | Slate stone, fractured rubble, amber highlights, and raised terraces. Relay, Crown of Ash, Glassfire Foundry. |
| Spore country | Muted plum/sand earth, organic craft materials, stockades, and native equipment. Spore Bazaar, Lantern Caravan, Silent Archive. |
| Roman opening | A flat tactical grid with matching grass/stream textures, trees, baggage wagons, casualty stretchers, and rally standards. Its map and rules remain distinct from the off-world experiments. |

Only engine-backed obstacles should look blocking. Texture variation must not suggest a movement penalty, cover bonus, or route that does not exist. Barricades show HP and become low, walkable debris when destroyed. Generators, ferry beacons, carts, controls, and archive props use distinct silhouettes; automatic checklist steps do not create duplicate physical objectives. Captured summit spires remain visible.

## Character identity

| Character or role | Readable identity |
| --- | --- |
| Centurion | Roman crest, cloak, upright command stance, and disciplined fighting silhouette. |
| Shield brother | Braced stance, forward shield, javelin bundle; the same Roman equipment family. |
| Sword brother | Forward sword gesture and lighter-footed stance; similar equipment quality. |
| Supporting legionnaire | Shared Roman template, simpler accents, and stable unit labels. |
| Seli, Aer glider | Slim birdlike body, broad wings, teal identity, native sling. |
| Tekk, Bound leaper | Springing legs, low athletic posture, orange identity, thorn spear. |
| Porr, Murr musk keeper | Rounded violet body, gourd/seed equipment, a recognizable cloud effect. |
| Oru, Krag stoneback | Broad plated shoulders, heavy stoneback silhouette, obsidian maul. |
| Thorn guard / Seed slinger / Shell warden | Lean spear profile / compact sling profile / broad shell armor and shield. |
| Reed mender / Spore binder / Shell caller | Medicine kit / fungal growths and pods / standard and drum-like command equipment. |

Four directional standing images and one fallen pose exist for all 14 battlefield archetypes. Camera rotation selects the corresponding character direction. Symbols, ground markers, labels, and health indicators reinforce identity; color is not the only cue. Native support abilities should look organic rather than like advanced lasers.

Sprites retain stylized native equipment. They do **not** yet swap every visible weapon and armor piece to match the loadout. The action and inspection panels remain authoritative about equipped gear. Names, detailed historical models, and permanent campaign identities should not be inferred from generated costume details.

## Enforcers

Enforcers look like an entirely different order of power: a dark core inside segmented white/porcelain-and-gold rings, impossible precision, no conventional gun or engine, and sharp white-gold light. Handmade native objects show wear; enforcement machinery is unnervingly immaculate.

Arrival uses a vertical seam of light. Hovering rings, a target halo, ground reticle, and a connection to the marked recruit communicate jurisdiction and danger. Execution uses a narrow beam and a disintegrating figure. The target name and two-turn countdown remain readable. Enforcers have no ordinary attack invitation or misleading HP bar.

“Confederation Adjudicators” was an art concept label, not an approved faction/name change. The story reference distinguishes established Confederation context from unresolved lore.

## Tactical information and camera

- Selected units, legal targets, paths, objective symbols, health, statuses, and keyboard focus sit above terrain detail.
- Protected-target HP stays visible above nearby scenery and is repeated in the mission checklist.
- Pan, zoom, Coordinates, isometric/tactical view, and four quarter-turn angles help reveal the battlefield. Rotate buttons or Q/E work while the map has focus; a compass and X/Y/Z cues follow the view.
- Reset restores the initial angle, pan, and zoom. Camera changes do not spend actions or alter the mission replay.
- Movement follows the resolved path, capped at 650 ms. Hit, healing, command, binding/musk, and enforcement effects reflect completed rule outcomes, without extra random rolls.
- Reduced-motion preference skips movement interpolation and continuous effects. Feedback should stay short enough for a roughly ten-minute mission.

## Assets, provenance, and production

| Location | Purpose |
| --- | --- |
| [Original illustrations](../assets/sprites/) | Preparation, roster, and inspection art; preserved separately from battle replacements. Exact prompts are retained alongside the assets. |
| [Battle manifest](../assets/battle/manifest.json) | Source crops, output frames, dimensions, anchors, props, and texture mappings. |
| [Battle sources](../assets/battle/sources/) | Original generated atlases/props and prompt records for heroes, aliens, enemies, objectives, Roman props, and the build-0.9 mission set. |
| [Packed units](../assets/battle/units/) | 70 frames: four standing directions plus one fallen image for each of 14 archetypes. 128 × 160 canvases, shared foot anchor. |
| [Packed props](../assets/battle/props/) | Trees, rubble, wagons, casualties, extraction, objectives, and eight new mission/destruction props. Standard 256 × 256 canvases; the enforcer uses its own taller canvas. |
| [Terrain](../assets/battle/terrain/) | Three biome ground swatches and water, at 256 × 256. |

New bitmap artwork was created with the built-in `image_gen.imagegen` tool, using original project illustrations as identity references where appropriate. Transparent backgrounds are retained. [Packing script](../scripts/pack-battle-assets.mjs) performs deterministic extraction, nearest-neighbor sizing, anchoring, and palette PNG compression; it does not draw or repaint art. The optional Sharp dependency is needed for packing, not for playing. Assets are local; play does not fetch art from outside hosts.

[New-prop contact sheet](screenshots/build-0.9-props.png) · [Four camera angles](screenshots/camera-four-angles.png) · [Mission-progress example](screenshots/build-0.9-crown-progress.png).

## What still needs art work

Custom multi-frame walks/attacks, complete equipment-specific visuals, additional biome materials, and production-ready historical validation are future work. Props remain upright sprite images, not fully modeled 3D objects. Four-angle rotation was implemented after the first fixed-camera overhaul; it is no longer a planned-only feature.

Before accepting an art change, check unit recognition at ordinary zoom, Z readability without labels, high/low neighboring terrain, hidden-unit selection, paths and effects at every camera angle, phone layout, reduced motion, and the unchanged menu illustrations. Automated checks support those goals; they do not replace human readability testing.
