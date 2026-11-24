# Visual references for the proposed graphics overhaul

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

Reviewed October 26, 2026. Requested references: Final Fantasy Tactics, Tactics Ogre, Triangle Strategy, Shining Force, and Shining Force II. This is a screenshot study, not hands-on testing. The recommendations below are our interpretation. No game art has been imported as a playable asset.

References use publisher images where available, with two explicitly identified fan-gallery map captures. Images remain linked to their source hosts and require a connection. Copyright remains with the respective owners. Each full-size image is linked alongside its source; these are references for creating original art, not sprite sheets to extract.

## Final Fantasy Tactics — terrain that has volume

[Square Enix gallery: The Ivalice Chronicles](https://www.jp.square-enix.com/pcgamehub/title/FFT_TIC/) · [larger screenshot SS01](https://www.jp.square-enix.com/pcgamehub/title/assets_c/2025/06/FFT_TIC_SS01-thumb-1024xauto-12163.jpg). © Square Enix. The reviewed enhanced edition differs from the 1997 original; this is not an observation of the original version.

![Final Fantasy Tactics enhanced-edition battle: a courtyard below stepped earth ledges, ruined walls, upright sprites, and contact shadows.](https://www.jp.square-enix.com/pcgamehub/title/assets_c/2025/06/FFT_TIC_SS01-thumb-1024xauto-12163.jpg)

Observed: the right-hand ledges have large vertical faces below their walkable tops. Ruins establish scale and occlude parts of the map. Upright characters and their shadows sit on the surfaces; the HUD does not carry the entire burden of explaining height. The screenshot's encounter name and difficulty were not established.

Lesson for Legionnaires: render solid terrain columns and the exposed difference between neighboring heights. Test whether players can distinguish a one-level step from a two-level drop with Z labels hidden. Cost: projection, depth ordering, occlusion, and picking need a proper rendering pass; painting new tile tops alone will not achieve this.

## Tactics Ogre: Reborn — consistent tiles and tactical information

[Square Enix battle-design page](https://www.jp.square-enix.com/tor/battledesign/) · [larger snowfield image](https://www.jp.square-enix.com/tor/assets/img/battledesign/battle_image01.jpg) · [larger trajectory image](https://www.jp.square-enix.com/tor/assets/img/battledesign/battle_image04.jpg). © Square Enix. Reborn edition; screenshot encounters/difficulty not established. A static trajectory overlay was reviewed, not its animation.

![Tactics Ogre Reborn snowfield: repeated cliff segments create readable ledges, while small upright units remain distinguishable from the icy terrain.](https://www.jp.square-enix.com/tor/assets/img/battledesign/battle_image01.jpg)

Observed: repeated cliff-edge bands distinguish surface heights. Compact units share a coherent scale and outline treatment. In the linked town screenshot, yellow target surfaces and a blue trajectory line remain readable over detailed roofs and streets.

Lesson: use a restrained tile vocabulary, coherent unit silhouettes, and surface-aligned highlights/path lines. Provide temporary outlines or faded foreground props when something is hidden. Test a unit behind the tallest cliff and tree, not just an empty, attractive map. Cost: a clear overlay layer and an occlusion rule, not a new initiative or class system.

## Triangle Strategy — materials, atmosphere, and restraint

[Square Enix product gallery](https://www.square-enix-games.com/en_US/games/triangle-strategy) · [larger rooftop scene](https://gh.cdn.sewest.net/assets/ident//games/1017757d/Screenshot06-3ilcny0cn.jpg?quality=65) · [larger waterfront scene](https://gh.cdn.sewest.net/assets/ident//games/1017757d/Screenshot05-yds3sjfcx.jpg?quality=65). © Square Enix. Official promotional screenshots; exact platform, mission, and difficulty are not established from these captures.

![Triangle Strategy rooftop action scene: pixel characters among textured roofs, a raised street, warm light, and blue-white action effects.](https://gh.cdn.sewest.net/assets/ident//games/1017757d/Screenshot06-3ilcny0cn.jpg?quality=65)

Observed: roof forms, street surfaces, props, shadows, and warm/cool lighting create a tangible place around compact sprites. The waterfront screenshot also shows how a bright effect and blur can dominate surrounding detail.

Lesson: give each mission a material and lighting identity, while keeping the active battlefield sharp. Use its atmosphere as inspiration; do not make bloom, depth-of-field blur, or expensive lighting prerequisites. Test height and unit recognition during an effect, not only at rest. Cost: a controlled palette, coherent assets, and restrained effects; a full HD-2D engine is outside this proposal.

## Shining Force — compact map sprites and expressive combat identity

[SEGA's Steam listing and gallery](https://store.steampowered.com/app/71120/Shining_Force/) · [larger official combat image](https://cdn.cloudflare.steamstatic.com/steam/apps/71120/ss_cf1a98690c1ea1264e919139aac4efe533f2c283.1920x1080.jpg?t=1549028518). © SEGA. Original Genesis/Mega Drive game, viewed through its PC gallery. [Supplemental map gallery](https://fantasyanime.com/shiningforce/sfshots.htm) · [larger map capture](https://fantasyanime.com/shiningforce/screenshots/large/sf1shot06.png), fan-hosted, not a publisher capture. Encounter/difficulty not verified.

![Original Shining Force map: a selected goblin and Ken's party on strongly contrasting ground surfaces, with compact units and simple status windows.](https://fantasyanime.com/shiningforce/screenshots/large/sf1shot06.png)

![Shining Force combat close-up: Max and a goblin have larger, expressive silhouettes against a stone courtyard background.](https://cdn.cloudflare.steamstatic.com/steam/apps/71120/ss_cf1a98690c1ea1264e919139aac4efe533f2c283.1920x1080.jpg?t=1549028518)

Observed: the map and combat close-up use different presentation scales. Small map units communicate broad identity; the close-up gives weapon, pose, and expression much more space. The map is an overhead reference, not evidence of a three-axis elevation system.

Lesson: simplify the battle sprites rather than shrinking detailed illustrations. Put fine detail in matching portraits and inspection panels. Test recognition at normal map zoom with names hidden. Cost: separate sprite and portrait treatments; full combat cutaway scenes would slow the ten-minute mission and are not planned.

## Shining Force II — varied bodies that remain readable together

[SEGA's Steam listing and gallery](https://store.steampowered.com/app/71160/Shining_Force_II/) · [SEGA-hosted English manual](https://www.sega.jp/genesismini2/assets/manual/pdf/US_Shining-Force-II.pdf). Supplemental image from the [fan-hosted map gallery](https://fantasyanime.com/shiningforce/sf2shots2.htm) · [larger map capture](https://fantasyanime.com/shiningforce/screenshots/large/sf2shot34.png). © SEGA. Original Genesis/Mega Drive title; the fan capture's exact encounter/difficulty is unverified. Only screenshots were studied.

![Shining Force II map: differently shaped humanoid, birdlike, and large-bodied units stand out against grass and sand.](https://fantasyanime.com/shiningforce/screenshots/large/sf2shot34.png)

Observed: body proportions, equipment, posture, and broad color masses distinguish a mixed party. Grass, sand, forests, and rock have strong material boundaries. This is another overhead-map reference, not the model for our Z renderer.

Lesson: Seli's wings, Tekk's springing legs, Porr's rounded pack, and Oru's plated bulk should read before their labels do. Enemies need actual role silhouettes, not one guard with different symbols. Test the cast in grayscale and at reduced size. Cost: a designed roster sheet with consistent scale, rather than independent illustrations that happen to share a palette.

## What this means for the current prototype

The [build 0.7 capture](../screenshots/build-0.7-elevation.png) still shows a largely continuous flat board. Source inspection confirms that height currently lifts each tile by only three pixels per level, adds a narrow border, and tilts the board as a whole. That explains why labels are doing much of the work. Hero cutouts, oversized terrain symbols, and the repeated guard image also follow different visual conventions.

The proposed synthesis is **a clearly extruded, isometric terrain scene; crisp and expressive map sprites; rich but subordinate materials; and unmistakably alien enforcement machinery**. The first proof should be a small scene containing Z0–3, a stair-step route, a dangerous drop, a tree, water, two characters, and an enforcer. See [implementation plan](ART_OVERHAUL_PLAN.md).
