# Prototype handoff

Synced October 8, 2026 against the sibling design workspace's current working files, including its October 5–8 updates. That workspace remains authoritative. See [sync record](DESIGN_SYNC_2026-10-08.md) for revision verification and requirement mapping.

Build 0.4 adds a mission briefing, character context, and a factual rescue debrief to the existing Roman experiment. Combat retains build 0.3 tuning. See [PLAYTEST_RULES.md](PLAYTEST_RULES.md) for its provisional choices and run instructions. The design repo's mission brief v0.4 explicitly changes no confirmed combat rules or numerical proposals.

## Confirmed direction

- Browser-based tactical prototype in a separate Git repository.
- Larger game: light story/strategy layers, a wider roster, and approximately 5 to 12-15 soldiers deployed per mission.
- Three leads from Rome: a veteran centurion and two talented but relatively untested brothers. The centurion is a childhood friend of their craftsman father and watches over them.
- Similar equipment; one brother favors javelins and defense, the other speed and sword offense. The centurion combines command abilities with formidable fighting skill.
- Baggage rescue during Varus's disaster in 9 CE. The Romans are captured at the end of mission one, and the heroes are subsequently sold to an alien in disguise. Detailed staging is deferred.
- D37 reaffirms the Roman trio, Rome origins, rescue opening, deployment range, and three action categories. D38 recognizes this implementation without adopting its numerical assumptions as permanent design.

Approved opening premise:

> During the destruction of Varus’s army, a Roman century is cut off while recovering the wounded. Its centurion brings the survivors through the ambush, only to discover that their apparent deliverance has placed them in the hands of captors from beyond their world.

## Confirmed combat requirements

- Each character has one Move action, one attack/ability action, and one Item/Special action for items and map or character interactions.
- Include Defend; effect, duration, and cost remain open.
- Revive fallen heroes at a small portion of health. The centurion's special revive restores full health.
- Wounded mission casualties must be carried to safety. Neither revival action replaces their evacuation.

## Current implementation and session constraints

The source design keeps numerical details provisional. The current prototype and user instructions in this task establish:

- Native JavaScript modules and a DOM grid; no permanent engine selection. TypeScript/Phaser was an earlier recommendation, not a migration requirement.
- Six playable soldiers, three carry-only wounded objectives, wagons, a crossing, and a rally point. This test size does not replace the wider 5 to 12–15 deployment range.
- Variable weapon damage and per-combatant dodge/block, explicit damage/range controls, Defend, revival, carrying, enemies, and capture. Balance numbers are documented in the playtest rules.
- Cardinal movement costs 1 per tile. The user explicitly declined diagonal movement and a 1.5 movement cost; preserve this behavior.
- A slight challenge with a target duration of no more than 15 minutes. The balance report contains simulation-based estimates; a strict human completion-time ceiling is unverified.
- Keep numerical tuning editable and label experimental assumptions. Separate mission rules, narrative presentation, and interface.

## October 5–8 campaign context

- **D32/D36:** the bureaucracy and godlike enforcers are the same society; the Confederation elaborates it into an institution of Tier One powers. Exact governance, powers, and numerical civilization scales remain open.
- **D33/D35:** abduction being illegal, species-dependent permission for slavery, and a proxy-war loophole are reopened possibilities, not binding laws. The contact restriction and capture/sale sequence remain established. Do not conflate initial captors, disguised buyer, employer, and ship command.
- **D34:** an alien veteran joins the Romans early to teach advanced-technology consequences. He is separate from the centurion and the Roman tutorial. Mission placement, species, identity, and fate are unresolved; do not implement a scripted death as a requirement.
- **P10–P13:** technology signature/detection/response, ambitious Tier Two captors, ship interludes, and augmentation versus biological recovery are working proposals. They add no mechanic to this Roman mission. See [campaign direction](CAMPAIGN_DIRECTION.md).

## Still open

Permanent adoption of the tested engine, turn structure, movement allowances, action mappings/order, attack and Defend values, revival rules and supporting-soldier eligibility, carrying restrictions, AI, and completion/failure rules. The current build provides experiments for these questions rather than leaving them unimplemented. Distinctive brother abilities and broader character progression remain open; dual-use melee/ranged javelins remain a local backlog item.

Do not interpret a playable experiment as approval of its provisional balance rules. Record accepted design changes in the design decision log. Names, exact ages, father's craft, and detailed capture/sale staging can wait.
