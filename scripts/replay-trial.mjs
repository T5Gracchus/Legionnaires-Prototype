import {readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {act,endTurn} from '../src/trials-engine.js';
import {BUILD,PRESENTATION_BUILD,snapshot} from '../src/trials-telemetry.js';
export function replayTrial(result){
  const compatible=result.version===PRESENTATION_BUILD&&result.rulesVersion===BUILD&&result.initialState?.build===BUILD||
    result.version==='0.7.0'&&result.initialState?.build==='0.7.0'||result.version==='0.8.0'&&result.rulesVersion==='0.7.0'&&result.initialState?.build==='0.7.0';
  if(!compatible||!result.initialState||!result.finalState)throw new Error(`Replay requires a complete result and matching ${BUILD} rules.`);
  const state=structuredClone(result.initialState);
  state.telemetry={initialState:snapshot(state),events:[]};
  for(const event of result.events){
    if(event.type==='action')assert.ok(act(state,event.actor,event.action,event.target?.x,event.target?.y),`Illegal recorded action ${event.seq}`);
    if(event.type==='phase'&&event.phase==='enemy-start')assert.ok(endTurn(state));
  }
  assert.deepEqual(snapshot(state),result.finalState,'Final state differs');
  assert.deepEqual(state.telemetry.events,result.events,'Recorded intermediate states or events differ');return state;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  const result=JSON.parse(await readFile(process.argv[2],'utf8'));
  const state=replayTrial(result);console.log(`Replay verified: ${state.levelId}, ${state.status}, round ${state.round}, ${result.events.length} events.`);
}
