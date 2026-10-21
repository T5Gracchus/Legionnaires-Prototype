# Design synchronization — October 8, 2026

## Source verification

- Design remote: https://github.com/Leinad0033/legionaries-context.git.
- GitHub HEAD inspected: `87b3a365f9b6d6fd43442176a07f2c77aa0e7ca6` (merge of README improvements).
- Sibling checkout HEAD: `86f7f6a483e463661470f57db3e6f26faeacd3e2`.
- Both commits have the same tree: `36355dac6be0dbcd2b2ca7f76b2cdaf6e65e3eb6`. The published decision log is still dated September 23.
- The October 5–8 updates are in the sibling checkout's modified/untracked files. Those current working files were used for this sync, including one-pager v0.14, mission brief v0.4, D32–D38, meeting clarifications, gameplay proposals, and development notes. No design files were changed, committed, or pushed by this task.
- `design-source-manifest.json` records SHA-256 hashes of the local source files inspected, so their uncommitted state is identifiable independently of the base commit.

## Requirement mapping

| Source change | Prototype disposition |
| --- | --- |
| D37 preserves the trio, Rome origins, Roman opening, deployment range, and three action categories | Keep mission rules; expose the approved premise and relationships in a collapsible briefing and soldier descriptions. |
| D38 recognizes the existing tutorial without permanently adopting its numbers | Keep the tested build 0.3 combat configuration, and label build 0.4 as a narrative/interface sync. |
| D24 remains capture followed by sale to a disguised alien | Retain the ending; add a factual rescued/not-evacuated/standing-squad summary. Do not invent captor identity, location, or reveal staging. |
| D32/D36 define the bureaucracy/enforcer relationship and Confederation interpretation | Update local campaign reference; no new enforcement mechanic in the Roman mission. |
| D33/D35 reopen the three legal rules | Document them as unresolved. Do not imply advanced technology is automatically illegal everywhere. |
| D34 establishes an early alien veteran and teaching purpose | Record a later scenario boundary. Do not add him to the Roman detachment or script his death. |
| P10–P13 propose detection, ship, captors, and progression | Record next-experiment options and unresolved choices. Mission brief v0.4 explicitly excludes these from this mission's requirements. |
| Expanded historical/visual library | Link references for future terrain and asset work; current research maps are conceptual, not approved replacement layouts. |

## Local implementation scope

Build 0.4 adds optional mission/character context and a terminal rescue summary. The summary reads casualty states and squad health and does not mutate game state or create persistent campaign consequences. Casualties not evacuated are not declared dead. The collapse/expand UI avoids adding a mandatory step to each playthrough.

The mission rules in `src/mission.js` are unchanged by this sync. Cardinal movement still costs 1 and no diagonal movement was added. Existing health, dodge/block, ammunition, revival, carrying, enemy behavior, and capture conditions remain intact. Earlier local backlog items remain in PLAYTEST_NOTES.md.

The balance report is historical simulation evidence from build 0.3; this sync does not turn its estimates into a verified 15-minute human playtime claim.

## Verification performed

- `node --test`: 21 passing tests, including partial/full-rescue and defeat debriefs and non-mutation of mission state.
- JavaScript syntax checks passed for the changed modules.
- Browser checks: expanded briefing and character background, moved all six soldiers onto rally ground using ordinary controls, withdrew with zero rescues, confirmed the 0/3 evacuated and 6/6 standing summary, then restarted successfully. This was a targeted UI check, not another full rescue balance playtest.
- [Debrief screenshot](screenshots/build-0.4-debrief.png) records the checked ending state. A fresh mission was left ready afterward.
