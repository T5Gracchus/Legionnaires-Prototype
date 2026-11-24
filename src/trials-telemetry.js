export const BUILD = '0.9.0';
export const PRESENTATION_BUILD = '0.9.0';

export function snapshot(s) {
  const {telemetry,...state}=s;
  return structuredClone(state);
}

export function record(s,type,details={}) {
  if(!s.telemetry)return;
  const event={seq:s.telemetry.events.length,round:s.round,type,...structuredClone(details)};
  if(['action','enemy','phase','end'].includes(type))event.state=snapshot(s);
  s.telemetry.events.push(event);
}

// Foreground time without input for >60 seconds is estimated idle time. Pause/hidden
// time is recorded separately. No keyboard contents or personal data are collected.
export function createPlayClock(now=()=>performance.now()) {
  let last=now(),lastInput=last,activeMs=0,idleMs=0,pausedMs=0,manual=false,hidden=false,ended=false;
  const events=[];
  function tick(){const t=now(),delta=Math.max(0,t-last);if(!ended){
    if(manual||hidden)pausedMs+=delta;
    else{const active=Math.max(0,Math.min(t,lastInput+60000)-last);activeMs+=active;idleMs+=delta-active;}
  }last=t;}
  function change(type,value){tick();if(ended)return;if(type==='pause')manual=value;else hidden=value;lastInput=last;events.push({type,value,elapsedMs:Math.round(activeMs+idleMs+pausedMs)});}
  return {
    touch(){tick();if(!ended)lastInput=last;},
    pause(value){change('pause',value);},hidden(value){change('visibility',value);},
    stop(){tick();ended=true;},
    get paused(){return manual||hidden;},
    read(){tick();return {totalMs:Math.round(activeMs+idleMs+pausedMs),activeMs:Math.round(activeMs),idleMs:Math.round(idleMs),pausedMs:Math.round(pausedMs),idleThresholdMs:60000,events:structuredClone(events)};},
  };
}

export function trialResult(s,{rating='',notes='',timing,actionTimes=[]}={}) {
  return {
    version:PRESENTATION_BUILD,rulesVersion:BUILD,level:s.levelId,seed:s.initialSeed,loadout:s.loadout,status:s.status,
    rounds:s.round,elapsedMinutes:+((timing?.totalMs||0)/60000).toFixed(2),
    extracted:s.units.filter(u=>u.extracted).map(u=>u.id),objectives:s.objectives,
    metrics:s.metrics,budget:s.budget,rating,notes,log:s.log,
    timing,actionTimes,initialState:s.telemetry?.initialState,finalState:snapshot(s),
    events:s.telemetry?.events||[],
  };
}
