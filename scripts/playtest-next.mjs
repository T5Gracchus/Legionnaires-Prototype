import {mkdir,writeFile} from 'node:fs/promises';
import {simulateTrial,summarize} from './playtest-trials.mjs';
import {BUILD} from '../src/trials-telemetry.js';
const count=Number(process.argv[2]||100),startSeed=Number(process.argv[3]||1001);
if(!Number.isInteger(count)||count<1||count>1000||!Number.isInteger(startSeed)||startSeed<1)throw new Error('Use count 1–1000 and a positive starting seed');
const modes={control:{elevation:false,support:false,enemyAI:'legacy'},terrain:{elevation:true,support:false,enemyAI:'legacy'},enemies:{elevation:false,support:true,enemyAI:'tactical'},combined:{elevation:true,support:true,enemyAI:'tactical'}};
const report={build:BUILD,date:'2026-10-26',count,startSeed,timingAssumption:'90 seconds orientation + 6 seconds/action + 8 seconds/round; estimated, not measured human time',controlNote:'Same new maps and five guard positions; replaces support with combat guards. Not a replay of build 0.6.',results:[]};
for(const [mode,options] of Object.entries(modes))for(const level of ['salvage','relay','rescue'])for(const preset of ['mixed','heavy','native']){
  const runs=Array.from({length:count},(_,i)=>simulateTrial(level,preset,startSeed+i,'balanced',{options}));
  const mean=key=>+(runs.reduce((n,r)=>n+(r.metrics[key]||0),0)/runs.length).toFixed(2);
  const summary={mode,level,preset,...summarize(runs),enemyAttacks:mean('enemyAttacks'),enemyHeals:mean('enemyHeals'),enemyDebuffs:mean('enemyDebuffs'),enemyCommands:mean('enemyCommands')};
  console.log(JSON.stringify(summary));
  report.results.push({summary,runs:runs.map((r,i)=>i<2?r:(({trace,transcript,...rest})=>rest)(r))});
}
await mkdir(new URL('../docs/reports/simulations/',import.meta.url),{recursive:true});
await writeFile(new URL(`../docs/reports/simulations/offworld-v07-validation-${startSeed}.json`,import.meta.url),JSON.stringify(report));
