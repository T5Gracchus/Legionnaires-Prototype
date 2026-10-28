// Optional browser check. Starts an ephemeral local server and leaves no human records.
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createPrototypeServer} from './server.mjs';
import {createTrial,act,endTurn} from '../src/trials-engine.js';
import {LEVELS,RECRUITS,WEAPONS,presetLoadout} from '../src/trials-data.js';
import {cameraFacing,cameraDirections,rotateBattlePoint,projectBattlePoint} from '../src/battle-scene.js';
import {simulateTrial} from './playtest-trials.mjs';
import {replayTrial} from './replay-trial.mjs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),server=createPrototypeServer({root});let browser;
try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1050},reducedMotion:'reduce'}),errors=[],badAssets=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)badAssets.push(r.url());});
  const url=`http://127.0.0.1:${server.address().port}/offworld.html`;
  const rotation=()=>page.locator('.battle-scene-svg').getAttribute('data-rotation');
  let mouse=0,keyboard=0;
  async function pick(x,y){
    const node=page.locator(`[data-position="${x},${y}"]`);
    const point=await node.evaluate((e,key)=>{const b=e.getBoundingClientRect();for(const fy of [.5,.3,.7,.15,.85])for(const fx of [.5,.3,.7]){const x=b.x+b.width*fx,y=b.y+b.height*fy;if(document.elementFromPoint(x,y)?.closest('[data-position]')?.dataset.position===key)return{x,y};}return null;},`${x},${y}`);
    if(point){await page.mouse.click(point.x,point.y);mouse++;}else{await node.focus();await page.keyboard.press('Enter');keyboard++;}
  }
  await page.goto(url);
  const fixture=createTrial('crown');
  await page.evaluate(async s=>{
    const {renderBattleScene,highlightScenePath}=await import('/src/battle-scene.js');
    const host=document.createElement('div');host.id='camera-fixture';host.style.width='1100px';document.body.replaceChildren(host);window.cameraTest={clicks:[],view:null};
    const tiles=s.map.flatMap((row,y)=>[...row].map((terrain,x)=>({x,y,z:Number(s.heights[y][x]),terrain,legal:true,description:`${x},${y}`,friend:s.units.find(u=>u.x===x&&u.y===y),enemy:s.enemies.find(e=>e.x===x&&e.y===y),structure:s.structures.find(t=>t.x===x&&t.y===y),objective:s.objectives.find(o=>o.x===x&&o.y===y&&o.mapMarker!==false),marked:s.units[0].x===x&&s.units[0].y===y,police:x===11&&y===0})));
    renderBattleScene(host,{map:s.map,heights:s.heights,tiles,theme:'basalt',missionKey:'fixture',onViewChange:v=>window.cameraTest.view=v,onSelect:t=>window.cameraTest.clicks.push([t.x,t.y]),onInspect:t=>highlightScenePath(host,[t])});
  },fixture);
  for(let turn=0;turn<4;turn++){
    assert.equal(await rotation(),String(turn));assert.equal(await page.locator('[data-position]').count(),96);
    assert.equal(await page.locator('.scene-unit[data-unit-id="centurion"]').getAttribute('href'),`/assets/battle/units/centurion-${cameraFacing('se',turn)}.png`);
    const order=await page.locator('.scene-world > g').evaluateAll(nodes=>nodes.map(n=>n.dataset.worldPosition));
    const expected=fixture.map.flatMap((r,y)=>[...r].map((_,x)=>({x,y}))).sort((a,b)=>{const p=rotateBattlePoint(a.x,a.y,turn),q=rotateBattlePoint(b.x,b.y,turn);return p.x+p.y-q.x-q.y||p.y-q.y;}).map(p=>`${p.x},${p.y}`);assert.deepEqual(order,expected);
    let faces=0;for(let y=0;y<8;y++)for(let x=0;x<12;x++)for(const [dx,dy] of cameraDirections(turn)){const h=fixture.heights[y+dy]?.[x+dx];if(Number(fixture.heights[y][x])>(h===undefined?-1:Number(h)))faces++;}
    assert.equal(await page.locator('.scene-cliff').count(),faces);
    const p=projectBattlePoint(fixture.units[0].x,fixture.units[0].y,fixture.units[0].z,true,turn);
    assert.equal(Number(await page.locator('.scene-unit[data-unit-id="centurion"]').getAttribute('x')),p.x-32);
    assert.equal(await page.locator('.scene-target-halo').getAttribute('cx'),String(p.x));
    for(let y=0;y<8;y++)for(let x=0;x<12;x++){await pick(x,y);assert.deepEqual(await page.evaluate(()=>window.cameraTest.clicks.at(-1)),[x,y]);}
    await page.locator('[data-position="5,3"]').focus();await page.keyboard.press('ArrowRight');const [dx,dy]=cameraDirections(turn)[0];assert.equal(await page.evaluate(()=>document.activeElement.dataset.position),`${5+dx},${3+dy}`);
    await page.locator('.scene-labels').click();await page.locator('[data-position="5,3"]').focus();await page.keyboard.press('e');assert.equal(await rotation(),String((turn+1)%4));assert.ok(await page.locator('[data-path-position="5,3"]:not([hidden])').count());await page.keyboard.press('q');
    await page.locator('.battle-scene-svg').screenshot({path:`${root}/docs/screenshots/camera-angle-${turn+1}.png`});await page.locator('.scene-rotate-right').click();
  }
  assert.equal(await rotation(),'0');await page.locator('.scene-zoom-in').click();await page.locator('.scene-pan-right').click();await page.locator('.scene-rotate-left').click();assert.equal(await rotation(),'3');assert.equal(await page.locator('.battle-scene-svg').getAttribute('data-zoom'),'1.20');
  await page.locator('.scene-reset').click();assert.equal(await rotation(),'0');assert.equal(await page.locator('.battle-scene-svg').getAttribute('data-zoom'),'1.00');assert.equal(await page.locator('.battle-scene-svg').getAttribute('data-pan-x'),'0');

  // Finish a real mission while rotating between every round, and verify its entire gameplay trace.
  await page.goto(url);await page.getByRole('button',{name:/Glassfire Foundry/}).click();await page.locator('#launch').click();
  const plan=simulateTrial('foundry','mixed',42),s=createTrial('foundry',presetLoadout(),42),keys={sidearm:'Basic sidearm',objective:'Secure / Free',revive:'Revive',leap:'Leap',musk:'Musk burst',rally:'Rally',defend:'Defend',extract:'Extract',fullRevive:'Full revive'};
  let turn=0;
  for(const a of plan.transcript){
    if(a.key==='endTurn'){await page.locator('.scene-rotate-right').click();turn=(turn+1)%4;await page.locator('#trial-end').click();endTurn(s);assert.equal(await rotation(),String(turn));continue;}
    await page.locator('#trial-roster button').filter({hasText:RECRUITS[a.actor].name}).click();assert.equal(await rotation(),String(turn));
    const label=a.key==='attack'?WEAPONS[s.units.find(u=>u.id===a.actor).weapon].name:a.key==='move'?(a.actor==='aer'?'Fly / Move':'Move'):keys[a.key];
    await page.locator('#trial-actions button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();
    if(!['defend','musk','extract'].includes(a.key))await pick(a.x,a.y);
    if(await page.locator('#move-confirmation').isVisible())await page.locator('#confirm-move').click();assert.ok(act(s,a.actor,a.key,a.x,a.y));
  }
  const downloadPromise=page.waitForEvent('download');await page.locator('#download-result').click();const download=await downloadPromise,saved=JSON.parse(await readFile(await download.path(),'utf8'));
  assert.equal(saved.status,'success');assert.deepEqual(saved.metrics,s.metrics);assert.deepEqual(replayTrial(saved).units,s.units);assert.ok(!saved.events.some(e=>e.action==='rotate'));
  await page.locator('#retry-trial').click();assert.equal(await rotation(),'0');
  await page.locator('.scene-rotate-right').click();await page.locator('#map-view').click();assert.equal(await rotation(),'1');assert.match(await page.locator('#camera-north').innerText(),/→/);
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('.scene-rotate-left').click();assert.equal(await rotation(),'0');
  await page.locator('#trial-board').screenshot({path:`${root}/docs/screenshots/camera-mobile.png`});
  // Normal-motion movement also uses the rotated start, path and directional sprite.
  await page.setViewportSize({width:1440,height:1050});await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#map-view').click();await page.locator('.scene-rotate-right').click();
  await page.locator('[data-position].legal').first().focus();await page.keyboard.press('Enter');assert.ok(await page.locator('.scene-moving-unit').count());await page.waitForFunction(()=>!document.getElementById('trial-board').inert);assert.equal(await rotation(),'1');
  assert.deepEqual(errors,[]);assert.deepEqual(badAssets,[]);
  const report={angles:4,fixtureTilesChecked:384,mousePicks:mouse,keyboardPicks:keyboard,mission:{level:'foundry',status:saved.status,rounds:saved.rounds,actions:saved.metrics.actions,replay:'exact'},checks:['cliff faces','depth order','sprite directions','enforcement targets','keyboard navigation','path persistence','pan/zoom/reset','view persistence across turns','retry reset','tactical view','phone layout','normal-motion movement'],errors,badAssets};
  await mkdir(`${root}/docs/reports/checks`,{recursive:true});await writeFile(`${root}/docs/reports/checks/camera-browser-check.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
