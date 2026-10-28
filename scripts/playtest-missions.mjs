import {mkdir,writeFile} from 'node:fs/promises';
import {LEVELS} from '../src/trials-data.js';
import {simulateTrial,summarize} from './playtest-trials.mjs';
const count=Number(process.argv[2]||100),startSeed=Number(process.argv[3]||1001);
if(!Number.isInteger(count)||count<1||count>1000||!Number.isInteger(startSeed)||startSeed<1)throw new Error('Supply count 1–1000 and a positive starting seed.');
const report={build:'0.9.0',count,startSeed,scope:'Nine offworld missions; Roman tutorial retains its existing tests.',timingAssumption:'90 sec orientation + 6 sec/action + 8 sec/round. Planning-speed estimate, not measured human playtime.',results:[]};
for(const level of Object.keys(LEVELS))for(const preset of ['mixed','native','heavy']){
  const runs=Array.from({length:count},(_,i)=>simulateTrial(level,preset,startSeed+i));
  const summary={level,preset,...summarize(runs)};console.log(JSON.stringify(summary));
  report.results.push({summary,runs:runs.map(({transcript,trace,...r},i)=>i<2?{...r,transcript,trace}:r)});
}
await mkdir(new URL('../docs/reports/simulations/',import.meta.url),{recursive:true});
await writeFile(new URL(`../docs/reports/simulations/offworld-v09-validation-${startSeed}.json`,import.meta.url),JSON.stringify(report,null,2)+'\n');
