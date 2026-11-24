# Proposed build 0.8 graphics overhaul

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

October 26, 2026. Prepared after the requested five-game image review, then authorized by the user. **Implemented in build 0.8:** see [delivery notes](BUILD_0_8.md) for final scope, asset provenance, verification, and limitations. The detailed proposal below records the approved direction; it does not imply every optional animation or equipment variant became part of this pass.

The [reference review](ART_REFERENCE_REVIEW.md) contains the images, provenance, visual observations, and proposed tests. This document proposes how to apply those lessons to Legionnaires. Art concepts and working names below are not new campaign canon.

## Direction

**Confirmed scope clarification:** keep the loadout and mission-preparation menus as they are, including their existing character illustrations, sprites, art style, layout, and controls. The new art direction applies to the battlefield. The illustrated preparation screens and compact battle sprites are intentionally separate presentations of the same characters.

Create an isometric diorama with crisp, compact character sprites, textured terrain tops, substantial cliff faces, directional light, and grounded shadows. The terrain volume takes cues from Final Fantasy Tactics and Tactics Ogre; the material atmosphere from Triangle Strategy; compact character identity from Shining Force I and II. Produce original assets rather than repurposing their characters, textures, UI, or sprites.

Use consistent pixel clusters and a restricted palette for map sprites. Retain existing detailed illustrations in the preparation menus. Do not mix smooth miniature paintings, flat icons, and pixel characters on the battlefield. Establish a single light direction, outline weight, camera angle, foot anchor, and scale before producing the full set. A large, broad alien may exceed a tile visually, but its base must clearly occupy one square.

Retain the Roman trio's similar equipment and existing relationships. Differentiate the brothers through stance, javelins, shield presentation, and small accents; do not turn their identities into unrelated fantasy armor classes. Alien native kit remains visibly made from organic, stone, shell, and worked natural materials. Future weapons should look like additions to these people, not erase their identities.

## 1. Prove the look with a small finished scene

Produce a coordinated style sheet and one original scene containing water, a bank, grass, basalt/soil faces, stairs or stepped ground, Z0–3, a two-level drop, a tree, a Roman, a support enemy, and an enforcer. Show desktop and phone-scale views, plus a version with labels hidden.

Starting art measurements to test: 64 × 32 pixel tile tops and approximately 20–24 pixels of visible height per Z level at native scene scale. Characters stand roughly 40–56 pixels high, with a common baseline; larger species may be taller/wider. These are proposed proportions, not permanent limits. Check the height step against actual viewing size before locking dimensions.

The acceptance question is simple: can the player identify which surface is higher, where the stepped route is, which edge is a dangerous drop, and where each unit stands without reading the height numbers? If not, revise this sample before multiplying the asset workload. This first scene is the useful review point for the requested overhaul.

## 2. Replace the board presentation with visible terrain volume

Implement an off-world scene renderer using native SVG geometry with raster textures and character sprites. Keep the engine, DOM command panels, data format, and local save API. A new game engine or framework is not required for this pass.

Project logical X/Y onto an isometric ground plane and move surfaces upward according to Z. An illustrative mapping is `screenX = (x − y) × halfTileWidth`, `screenY = (x + y) × halfTileHeight − z × levelHeight`. Draw top surfaces and the exposed side-face difference between adjacent columns; repeat rock/soil bands for each height level. This is a visual projection of the existing one-surface-per-cell maps, not stacked walkable floors.

Keep upright units, trees, and props separate from floor artwork. Depth-sort terrain, props, characters, and effects so something behind a ridge is actually behind it. Screen Y alone should not be assumed to solve all tall-sprite overlaps; explicitly test adjacent columns of different heights. Fade a blocking foreground prop or show a readable silhouette/outline when it hides a selectable unit. Make the selected tile's top perimeter and foot position visible.

Use surface-shaped hit regions tied to stable logical coordinates. Picking must select the visible top surface, not a cliff side or a unit in another cell. Preserve keyboard access and accessible names containing coordinates, unit, terrain, height, legal action, and fall preview. Adapt browser tests to stable coordinate selectors where needed. Movement/path previews must sit on the actual stepped surfaces and show ascent, descent, and landing.

Start with one fixed camera direction, pan/zoom, a reset control, and an optional tactical/top-down view. This controls sprite production and picking complexity. Four-way rotation can follow if occlusion tests demonstrate a need; it is not included in the initial art scope. Keep X/Y direction cues visible when the map is viewed diagonally.

## 3. Replace every terrain and objective asset

Build a reusable original tile/prop set rather than paint a single decorative map backdrop. Every visible blocker must agree with the existing collision and sight rules. A decorative stair marks a series of existing legal steps; it does not add a new path, reduce climb cost, or invent a bridge.

| Asset family | New treatment |
| --- | --- |
| Grass, dirt, paths, sand/mud | Restrained tile-top variants, shared seams and edges; detail below unit contrast |
| Soil and stone cliffs | Separate tops and exposed faces; consistent height bands, bevels, contact shadows, and corner joins |
| Basalt terraces and rubble | Readable fractured rock forms, distinguishable from walkable paving |
| Water, reeds, banks, crossings | Coherent water plane, shoreline transitions, depth cues, small looping ripples |
| Trees and vegetation | New sprites matched to the scene angle; sparse foreground silhouettes and occlusion handling |
| Spore-bazaar materials | Earth/shell surfaces, organic stockades, fungal props, warm native craft details |
| Relays, salvage, captive markers | Distinct physical props plus persistent tactical symbols; objectives must be readable among decoration |
| Extraction | Ground beacon/standard with a clear surface outline and interaction state |
| Roman opening props | Matching wagons, wounded-casualty/stretcher assets, rally standards, trees, and stream banks when shared art is rolled out |

Give Reedwater a wet green/ochre palette, Basalt a slate/amber palette, and the Bazaar muted plum/sand with restrained fungal color. Keep highlights and status shapes consistent across all three. Texture variety must not suggest extra movement costs or cover effects that the engine does not implement.

## 4. Redesign the entire cast as one roster

| Unit | Silhouette and identity proposal |
| --- | --- |
| Centurion | Upright command stance, readable crest/cloak, disciplined Roman kit |
| Shield brother | Braced defensive stance, visible javelin bundle and forward shield; same shared kit family |
| Sword brother | Forward, lighter-footed stance and clear sword gesture; similar equipment quality |
| Generic legionnaire | Matching Roman template with simpler identification accents |
| Seli | Broad folded wings, slim birdlike body and clear flying pose; sling/native craft retained |
| Tekk | Spring-loaded legs, low athletic posture, long thorn spear |
| Porr | Rounded body, gourd/seed equipment, distinctive musk effect originating from the unit |
| Oru | Heavy plated shoulders, broad stoneback silhouette, deliberate movement |
| Thorn guard | Tall spear profile, lean posture and natural-material gear |
| Seed slinger | Compact silhouette, visible sling and ammunition pouch |
| Shell warden | Broad shell shield/armor, unmistakably heavier than a slinger |
| Reed mender | Reed medicine satchel, reed staff or treatment kit; healing motes with an organic feel |
| Spore binder | Fungal hood/back growth and hanging spore pods; recognizable cloud/projectile effect |
| Shell caller | High standard and shell drum/horn; command rings visibly connect affected allies |

Roles, silhouettes, and state effects must work in grayscale as well as color. Ground markers and names remain secondary aids. Native support effects should not look like advanced laser equipment. The three support roles must no longer share one guard illustration.

Initial production scope: four directional standing views and one readable fallen pose for each of the 14 hero/support/enemy archetypes above. New menu portraits are not required; retain the existing illustrations. Use short interpolation, recoil, flashes of material light, and effect layers for action feedback in the first pass. Bespoke multi-frame walk and attack sheets can follow after the look works. Avoid blindly mirroring asymmetric Roman shields or weapon hands. Treat four-view consistency as an art QA task, not an assumption that generated sheets will align automatically.

Weapon mounting points/compact weapon variants should distinguish a sling, spear, rifle, carbine, arc projector, and lance at normal zoom. Keep the exact weapon and armor stats explicit in inspection. Preserve species and Roman identity when advanced gear is equipped. Do not imply a different equipped weapon through an unchanged native-weapon portrait without a clear label.

## 5. Make enforcement feel like a different order of power

Working visual concept: **Confederation Adjudicators**. This is a proposed presentation label for the existing enforcers, not a new faction or a settled lore decision.

A dark, lens-like core floats inside three broken porcelain-and-gold rings. The segments orbit with impossible precision. There is no face, rifle, leg assembly, or visible engine. Native units show weathering and handmade materials; the enforcer is immaculate, unnervingly regular, and lit by sharp white-gold lines.

Its arrival opens a thin vertical seam of light over the map. Ring segments assemble around the core, then a projected jurisdiction pattern briefly traces the battlefield. The existing marked recruit gets a descending halo and a persistent ground reticle connected to the enforcer. Execution is a narrow, exact beam: the figure breaks into geometric particles drawn upward, leaving an empty tile. The visual should feel like an administrative decision being applied, not an ordinary projectile that might miss.

Provide distinct arrival, hover, lock, execution, and departure states. The full arrival treatment should take roughly a second, not become a recurring cutscene. Keep the two-turn countdown and marked-target name readable throughout. Use a different symbol/shape from ordinary enemy targeting; no misleading HP bar or attack invitation. Reduced-motion mode uses a stable ring/reticle and a brief dissolve rather than flashes, camera movement, or distortion. Color effects must not obscure paths or terrain height.

The existing rules remain authoritative: two drones, the existing two-turn enforcement window, the current marked-target selection and extraction escape, and unavoidable vaporization if the target remains. Art adds no attack, damage radius, extra turn, or new opportunity to defeat them. Do not stage additional story deaths or settle the enforcers' legal powers through a cinematic.

## 6. Integrate, verify, then extend the shared art

Integrate one finished off-world map first, then apply the reusable set to all three. Update battlefield units, markers, and effects together. Preserve the loadout, mission-preparation cards, recruitment bench, and their existing artwork. Existing illustrated portraits can continue identifying characters in inspection panels and roster cards; names, colors, and species cues should connect those illustrations to the new battle sprites.

Store new battle art separately from the existing menu assets, with explicit battle-sprite and menu-portrait mappings. Do not overwrite the original PNGs or redirect the shared menu image helper to new battle art. Apply new character/terrain/prop assets to the Roman battlefield afterward while preserving its flat logical map and existing rules; it does not acquire off-world elevation or enforcement.

Keep action resolution deterministic. Animation follows the already-resolved event/path and must not create new random rolls, block a save indefinitely, or permit an extra action during interpolation. Add presentation-only feedback fields such as render version, view/zoom, coordinate-hover samples without personal data, and animation duration only if useful for diagnosing readability; keep them distinct from gameplay timing and state. Do not break or rewrite existing human records. Record new visuals as a new build while retaining replay/version distinctions.

Suggested normal-motion budgets: movement about 120–160 ms per tile with short capped sequences, attacks about 250–450 ms, support effects about 400 ms, and one brief enforcement arrival. Provide an instant/reduced-motion path. The ten-minute target should not be lost to repeated unskippable effects.

## Acceptance checks

- With Z labels temporarily hidden, a player can order Z0–3 surfaces, identify a dangerous ledge, and point to the safe stepped route. Numeric height inspection remains available in normal play.
- Without names, players distinguish all three Romans, four alien recruits, and the healer/binder/caller at normal desktop zoom and phone zoom. Test grayscale and reduced-size captures too.
- A unit behind a cliff, tree, or oversized ally stays discoverable, selectable, and identifiable as standing/fallen/extracted/marked.
- Surface picking matches logical X/Y/Z at every height, during pan/zoom, at screen edges, and in the optional tactical view. Keyboard/focus behavior remains usable.
- Show one Move, Flight, Leap, climb, damaging drop with confirmation, cross-height shot, cover reduction, objective interaction, revive, and extraction through ordinary controls.
- Verify arrival, target lock, first beam, and final enforcement lockdown without changing their turn timing. Test reduced motion and rapid repeated input.
- Replay saved seed/action sequences and compare gameplay state to the pre-art build using an explicit compatible-rules comparison. Any new rendering metadata must not masquerade as a balance change.
- Browser screenshots at desktop and phone sizes show no unreadable shrinking, clipped UI, mismatched sprite anchors, missing images, or external art requests from the game. The reference document may link external images; playable assets remain local.
- Compare loadout and mission-preparation screens before/after: layout, controls, original character artwork, recruitment bench, and gear information remain unchanged. New battle-sprite mappings must not replace menu images.
- Rerun the existing Node tests and complete browser save/replay checks after integration. Run new balance simulations only if rules, layout, or action timing behavior actually change; art alone does not justify retuning combat.

## Scope and risks

The biggest risks are sprite consistency across directions, hidden units behind raised terrain, wrong-cell clicks after projection, visible seams between terrain faces, and art production expanding into hundreds of animation frames. The sample scene and rendering proof address those before a full asset run.

The first implementation milestone should therefore be **one finished sample scene plus working selection/path previews on stepped terrain**. Then complete the reusable terrain set, full roster, and enforcer effects. Full 3D models, free camera rotation, new combat mechanics, campaign expansion, stacked bridges, and a framework migration are not part of this proposal.

Deliverables: approved-style sheet/sample scene; original local battle terrain/unit/effect assets with source prompts and a manifest; isometric renderer and accessible picking; battlefield overlays; four browser scenario captures including enforcement; and an art/readability test report confirming that preparation menus retain their original artwork and behavior. The existing build remains the fallback until the replacement meets the checks above.
