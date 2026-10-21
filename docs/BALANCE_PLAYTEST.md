# Mission balance playtest — build 0.3

## Goal and method

Target: a slight challenge, forgiving of mistakes, with a typical playthrough under 15 minutes. This is a simulation-assisted first tuning pass, not a timed human playtest or proof of a time limit.

Execute `node scripts/playtest.mjs 300`. The script runs 300 fixed random seeds per strategy per profile: **5,400 mission simulations**, six profiles and three strategies. Every run starts on the actual map, uses the public action rules, pays movement/action/ammunition costs, encounters the scheduled reinforcements, and attempts to rescue **all three casualties and withdraw all six soldiers**. Results are saved in `playtest-results.json`, including complete turn traces for seeds 1–3 per scenario and final states for every run. A 35-turn cutoff is a timeout, never a win. The script checks that the selected profile matches the shipped defaults.

### Written scenarios

1. **Cautious:** attack reachable enemies, approach enemies, defend when a threat is nearby; begin rescue after round 7 once enemies are cleared. Revive fallen allies, carry casualties home, then withdraw.
2. **Rescue-focused:** assign available soldiers to nearby unclaimed casualties immediately; attack when possible, defend carriers near enemies, revive fallen allies, and return spare soldiers to clear the route.
3. **Careless stress case:** use the rescue strategy but never Defend and skip attacks every third round. Still uses competent pathfinding and revival; this is not a model of every beginner mistake.

Initial dry runs exposed the test player's idle soldiers obstructing carriers. The driver was corrected to bring idle soldiers home. The table below uses only the corrected driver; no game movement rules were changed to help it.

## Comparison

Numbers below are mean rounds / mean incapacitations per run. Completion means all casualties rescued and the entire squad withdrawn, including recovered fallen soldiers.

| Profile | Enemy HP | Player HP: centurion / shield / sword / each support | Cautious | Rescue-focused | Careless | Completed / 900 |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline | 5 | 12 / 10 / 9 / 8 | 15.9 / 0.2 | 13.4 / 0.2 | 15.3 / 1.0 | 900 |
| HP 6, original defenses | 6 | 12 / 10 / 9 / 8 | 16.4 / 0.3 | 13.0 / 0.0 | 15.9 / 1.3 | 900 |
| HP 7, original defenses | 7 | 12 / 10 / 9 / 8 | 17.2 / 0.5 | 13.2 / 0.1 | 16.4 / 1.8 | 899 |
| **Steady — selected** | **7** | **12 / 11 / 10 / 9** | **16.4 / 0.2** | **13.0 / 0.0** | **15.8 / 0.9** | **900** |
| Lower defenses, original player HP | 7 | 12 / 10 / 9 / 8 | 16.6 / 0.3 | 13.0 / 0.1 | 16.1 / 1.6 | 899 |
| Pressure | 8 | 11 / 10 / 9 / 8 | 17.1 / 0.4 | 13.3 / 0.2 | 16.8 / 2.3 | 900 |

Original defenses are those from build 0.2. Exact alternative profiles are recorded in the script and results file. The incomplete runs were timeouts, not whole-squad defeats. Low rounded knockdown means (0.0) do not necessarily mean no knockdowns occurred.

## Applied tuning

| Combatant | HP | Dodge | Block, conditional on not dodging |
| --- | --- | --- | --- |
| Centurion | 12 | 10% | 20% |
| Shield brother | 11 | 5% | 30% |
| Sword brother | 10 | 15% | 10% |
| Each supporting soldier | 9 | 5% | 15% |
| Every enemy, including reinforcements | 7 | 5% | 10% |

Block still reduces damage by 2. Defend, damage ranges, ammunition, enemy count, terrain, and cardinal movement at cost 1 remain unchanged.

Rationale: 7 HP means even the strongest single attack cannot kill a fresh enemy. Reducing enemy dodge and block keeps the extra health from turning into repeated frustrating misses. Slightly higher player health and a strong shield-brother block give room to recover from bad rolls. The initial preference for original player HP was rejected after examining the slowest runs: its careless seed 79 repeatedly revived an exposed soldier and reached the cutoff. The selected profile completed all 900 runs; careless play still took about twice the damage of careful play (20.7 versus 10.2–10.4 total HP lost per mission).

## Duration evidence and limits

The selected profile averaged 69.5 / 85.2 / 80.3 successful player actions for cautious / rescue / careless play. For planning only, assume **90 seconds to orient + 6 seconds per action + 8 seconds per round**. This includes decision/click time as an assumption, not a measurement of human behavior.

| Strategy | Mean rounds | 90th-percentile rounds | 90th-percentile estimated minutes | Longest estimate |
| --- | --- | --- | --- | --- |
| Cautious | 16.4 | 19 | 12.3 | 14.2 |
| Rescue-focused | 13.0 | 15 | 12.5 | 14.2 |
| Careless | 15.8 | 18 | 12.7 | 15.3 |

899 of 900 selected-profile simulations fit the 15-minute estimate. **The strict 15-minute ceiling is not verified:** one estimate exceeds it, and a player taking 10 seconds per action could exceed it substantially. No timer or automatic mission ending was added. All strategies know the map and use automatic routing; success rates must not be presented as human success probabilities. Identical seed numbers provide reproducibility but different actions can consume different numbers of random draws.

Next human check: start a stopwatch on a fresh mission, attempt all three rescues without prior route planning, record finish time and confusion. Target 10–15 minutes, with an occasional revival and no forced restart. If duration exceeds 15 minutes, first inspect route congestion and UI decision time; further HP increases would likely make pacing worse. Enemy pressure remains mild under competent play, deliberately consistent with this opening-mission target.

## Verification

- `node scripts/playtest.mjs 300`: reproduced the final comparison and verified selected defaults.
- `node --test`: 19 rule tests pass, including dodge/block resolution, revival, action budgets, across-water throws, defeat, and reinforcement defense/HP configuration.
- Enemy health bars now divide by each enemy's maximum HP rather than a hard-coded 5.
