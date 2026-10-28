# MonoGame assessment for Legionnaires

> Archived source material. For current information use [the documentation index](../../README.md#documentation). Historical values and proposals below describe their original build.

Research and repository inspection: October 27, 2026.

**Recommendation: MonoGame is a credible fit for the current game, subject to a short production-workflow trial.** I would support a C#-experienced lead choosing it for a desktop game retaining the current isometric, sprite-based presentation. For a small team, the deciding issue is how quickly the team can author, polish, and maintain missions and interfaces. Avoiding engine fees is a strong requirement, but it does not distinguish MonoGame from every alternative.

This is an assessment and a proposed evaluation, not an adopted engine decision. Final visual ambition, release platforms, budget, schedule, and the team's C# experience remain unknown.

**What MonoGame provides.** MonoGame is a C#/.NET game framework. It supplies graphics, input, sound, asset processing, and math APIs. Its graphics APIs support both 2D and 3D. The framework gives developers building blocks; a team assembles the game's higher-level systems and chooses its tools. See the official [MonoGame overview](https://docs.monogame.net/articles/tutorials/building_2d_games/01_what_is_monogame/).

It fits standard .NET development and version control, with no integrated scene-authoring workflow comparable to an editor-led engine. Asset-processing tools do exist; those serve a different purpose from a level or animation editor. See [the development-workflow introduction](https://docs.monogame.net/articles/tutorials/building_2d_games/02_getting_started/index.html).

**Fees and ownership.** The Foundation states that MonoGame has no subscription, royalty, licensing, or runtime fees. Its main license is the Microsoft Public License, with MIT-covered portions. See [the Foundation's fee statement](https://monogame.net/) and [the actual license](https://github.com/MonoGame/MonoGame/blob/develop/LICENSE.txt).

Commercial, closed-source distribution is compatible with this framework choice. Retain applicable copyright and license notices; redistributing framework source has its own license conditions. Dependencies and assets need their own license review. Free framework use does not eliminate store, hardware, porting, development-tool, or production expenses. These distinctions matter when comparing total project cost.

**What I examined in this project.** I inspected the current working files, including uncommitted build 0.9 work, rather than limiting the review to the last commit. I also read the sibling design repository's one-pager, mission brief, decision log, setting, development notes, and game comparisons. The design's tactical emphasis, Roman trio, deployment range, and lighter campaign layers informed the assessment; experiments remain separate from confirmed requirements.

| Evidence in the project | What it means for MonoGame |
| --- | --- |
| [Package configuration](../../package.json) and [README](../../README.md): native JavaScript modules, browser presentation, no external runtime packages | This would be a language and presentation port. There is no existing engine-specific scene investment to convert. |
| [Roman rules](../../src/mission.js) and [off-world rules](../../src/trials-engine.js): tactical state and legal actions are separate from DOM rendering | Preserve this separation in a C# rules library that can run without graphics. |
| [Mission data](../../src/trials-data.js), [additional missions](../../src/trials-missions.js), and [goal logic](../../src/trials-goals.js) | Mission concepts and values can carry forward through conversion. JavaScript object definitions are not an engine-neutral asset format yet. |
| [Battle renderer](../../src/battle-scene.js): SVG terrain, raster sprites, four quarter-turn views, picking, depth order, and occlusion handling | Projection and interaction behavior provide a specification. Rendering and browser animation calls need replacement. |
| [Asset helpers](../../src/battle-assets.js) and [manifest](../../assets/battle/manifest.json): PNG portraits, textures, props, directional and fallen unit images | Existing artwork can be imported, with attention to filtering, transparency, anchors, and texture packing. |
| [Telemetry](../../src/trials-telemetry.js), [replay verifier](../../scripts/replay-trial.mjs), and rules tests | Existing states and action sequences provide reference cases for validating a C# port. |
| [Build 0.9](BUILD_0_9.md): Roman tutorial plus nine off-world missions | The project already exercises several mission systems; evaluation should include these behaviors rather than a minimal movement demo. |

I ran `node --test`: **76 tests passed, zero failed**. The first restricted run passed 69 tests and encountered localhost `EACCES` errors in seven server tests. Repeating the suite with localhost access passed all 76. Coverage includes rules, goals, replay, asset preservation, projection, and the local save API.

I inspected an existing battlefield screenshot to verify the presentation described by the source. I did not perform a new human playtest, rerun the documented browser checks, build a MonoGame version, or measure comparative performance. The earlier simulation and browser reports remain historical evidence, with their stated limits.

**Why the game is a good technical match.** Turn-based grid combat, constrained movement, elevation-aware sight, action categories, and mission objectives suit an explicit simulation controlled by game code. The current diorama uses a height value for each map cell and upright artwork, rather than a general 3D world. MonoGame gives the team enough rendering control to reproduce that design. This is an architectural judgment based on the inspected implementation, not a benchmark result.

The desired deployment range of roughly 5 to 12–15 soldiers is also a reasonable direction to evaluate. However, the present off-world constructor explicitly requires four recruits, and current maps are 12 by 8 cells. Neither the existing tests nor this research validates production-scale turn pacing, larger-map pathfinding, UI density, or performance. Scaling requires game-system changes whichever technology is chosen.

The Roman-to-science-fiction transition changes content and mechanics, but creates no special engine requirement by itself. A light, menu-based ship interlude and roster system could fit the same application. A fully explorable ship or cinematic 3D presentation would materially change the tooling calculation; those are not established requirements in the inspected design.

**Where a small team would spend extra effort.** The main risk is the production framework around the tactics:

- **UI:** roster and equipment screens, tooltips, scrolling, controller focus, resolution scaling, text entry, and readable localization. HTML/CSS currently supplies substantial layout and interaction behavior. Browser accessibility features also need deliberate replacement or an alternative implementation.
- **Presentation:** animation sequencing, effects, audio cues, hit feedback, terrain picking, camera-relative directions, and hidden-unit selection. Preserving a screenshot is easier than preserving reliable interaction throughout a mission.
- **Mission authoring:** an accessible way to edit terrain, heights, starts, goals, waves, and protected objects, with validation and preview. Hardcoded source data is workable during experiments; campaign production needs a sustainable workflow.
- **Persistence and shipping:** in-mission and campaign saves, format versions, settings, recovery from interrupted writes, platform paths, packaging, and release automation. The present playtest JSON export is useful research infrastructure; it does not establish a complete player save system.

The team can adopt external tools and libraries rather than implementing each item. MonoGame's own tutorial integrates [Gum for UI](https://docs.monogame.net/articles/tutorials/building_2d_games/20_implementing_ui_with_gum/). Evaluate a candidate against the actual loadout screen and controller navigation before adopting it. Keep the dependency set small and assign ownership for updates and compatibility.

**How AI assistance changes the calculation.** My assessment is that MonoGame's explicit C# code, ordinary project files, and testable rules are well suited to AI assistance. Agents can help convert rules, build importers, generate validation, and maintain repeatable checks. Compilation and deterministic reference cases make errors easier to detect.

That advantage depends on human engineering ownership. AI-generated infrastructure still needs review, visual testing, profiling, and maintenance. Code volume is a poor measure of production progress. The useful measures are time to add a mission, time to fix presentation problems, regressions, and whether a second developer can understand the system. Designer and artist iteration speed matters alongside programmer productivity.

Preserve a rules-only library, explicit commands, and structured results. Rendering can animate the results without deciding tactical outcomes. Port a small set of complete reference missions before expanding abstractions. For replay equivalence, explicitly reproduce JavaScript's 32-bit random-number arithmetic, random-call order, tie-breaking, and rounding; simply selecting a C# seeded random generator will not reproduce existing combat. Existing tests also encode provisional choices, so preserve intentional behavior while keeping numerical assumptions editable.

**Current MonoGame status and platforms.** MonoGame announced 3.8.6 on October 26, 2026. The announcement recommends the newer code-based Content Builder; it also describes StorageContainer as preview functionality limited to native targets. Its next WebGL2 platform is still described as forthcoming. See the [3.8.6 announcement](https://monogame.net/blog/2026-10-26-3.8.6-release-2026/).

For a new trial, use the current [Content Builder guide](https://docs.monogame.net/articles/getting_started/content_pipeline/content_builder/index.html), pin package and tool versions, and verify the selected target. Older tutorials and newer native backends coexist. The framework's maturity and the readiness of a particular new subsystem are separate questions.

Desktop and mobile are supported. Console implementations require authorized developer access and restricted repositories; a supported platform still requires platform-specific work and testing. See [supported platforms](https://docs.monogame.net/articles/getting_started/platforms.html). If browser delivery becomes a final-release requirement, require an actual working export on intended browsers before selecting MonoGame on that basis. The existing browser prototype requirement does not automatically establish a browser requirement for the final game.

**The main alternative worth comparing is Godot.** Godot is also free for commercial use under MIT licensing, so fee avoidance alone does not settle the choice. See [Godot's license](https://godotengine.org/license/) and [introduction](https://docs.godotengine.org/en/stable/about/introduction.html). Its integrated scene, animation, and UI tools offer a different division of work between the engine and the team; see [its feature overview](https://godotengine.org/features/).

| Project situation | My preference |
| --- | --- |
| Desktop first, current sprite-based diorama, strong C# lead, small explicit tools plan | MonoGame is a strong candidate. |
| Mixed programming/design team needing frequent visual authoring and UI changes | Favor Godot unless the MonoGame trial demonstrates equally practical iteration. |
| Full 3D animation, cinematic cameras, substantial lighting and scene work | Favor evaluating Godot's existing tools before funding comparable custom infrastructure. |
| Browser release is essential | Validate the exact export path early in either candidate. Godot's stable documentation also identifies a C# web-export limitation. |
| Console release is important | Compare actual access, middleware, staffing, and support arrangements. Neither choice establishes a zero-cost console launch. |

Godot supports C# as well as GDScript, but its stable documentation currently excludes C# web export; see [the FAQ](https://docs.godotengine.org/en/stable/about/faq.html). Its console route uses approved developers and private tooling or third-party providers; see [console support](https://godotengine.org/consoles/). I have not implemented this game in Godot, so the preference above is a tooling assessment rather than a measured comparison.

**Proposed decision experiment.** Give the lead developer a fixed, short evaluation budget—approximately one to two developer-weeks as a planning suggestion, not a completion forecast. Rebuild one complete off-world mission with the existing artwork. Glassfire Foundry is a useful candidate because destruction changes traversal and sightlines; add targeted scenarios for revival, enforcement, and multi-phase objectives that it does not fully exercise.

Require the trial to demonstrate:

1. Matching reference outcomes for a fixed seed and action sequence, including movement, damage, goals, and extraction.
2. The real loadout interface and readable in-mission information, plus pan, zoom, four views, picking, path previews, and occlusion handling.
3. One representative movement and attack presentation with audio, and a save/reload that preserves the next tactical outcome.
4. A separate 12–15-soldier stress scenario at a proposed production map size, checking frame time, input responsiveness, and enemy-turn latency on an agreed baseline machine. Human turn length requires separate playtesting.
5. A packaged build that another teammate can run, plus a reproducible build from a fresh checkout. Add an early smoke test for any promised secondary platform.
6. A second teammate making a small map, equipment, or objective change through the proposed workflow. Record elapsed effort and assistance required.

Judge the trial on usability, repeatability, maintenance, and measured iteration effort. A basic rendered battlefield would leave the highest-cost questions unresolved. If mission creation or UI work stalls, compare the troublesome portion in Godot before enlarging the custom framework.

**Decision to take to the lead developer.** Support MonoGame if the team deliberately wants to own a compact C# game framework and the production trial shows that ownership is manageable. Preserve the browser prototype as a reference during evaluation, then choose one production implementation to maintain. For the present game, MonoGame is technically plausible and financially compatible with the licensing goal; production tooling and team experience determine whether it is the best choice.
