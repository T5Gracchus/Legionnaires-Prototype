// Optional developer check: set PLAYWRIGHT_MODULE to an installed Playwright module.
import {mkdtemp,cp,readdir,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,basename} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createPrototypeServer} from './server.mjs';
import {simulateTrial} from './playtest-trials.mjs';
import {replayTrial} from './replay-trial.mjs';
import {RECRUITS,WEAPONS,LEVELS,presetLoadout} from '../src/trials-data.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const repo=fileURLToPath(new URL('..',import.meta.url));
const root=await mkdtemp(join(tmpdir(),'legionnaires-v09-browser-'));
let browser,server;
try{
  for(const name of ['offworld.html','index.html','src','assets'])await cp(join(repo,name),join(root,name),{recursive:true});
  server=createPrototypeServer({root});await new Promise(r=>server.listen(0,'127.0.0.1',r));
  browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],results=[];
  page.on('pageerror',e=>errors.push(e.message));
  const failedAssets=[];page.on('response',r=>{if(r.status()>=400&&/\/(src|assets)\//.test(r.url()))failedAssets.push(`${r.status()} ${r.url()}`);});
  const waitImages=()=>page.evaluate(async()=>{const sources=[...document.images].map(i=>i.src).concat([...document.querySelectorAll('svg image')].map(i=>i.href.baseVal));await Promise.all([...new Set(sources)].filter(Boolean).map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=()=>reject(Error('Image did not decode: '+src));i.src=src;})));});
  let mousePicks=0,keyboardPicks=0;
  async function pickTile(x,y){
    await page.waitForFunction(()=>!document.getElementById('trial-board').inert);
    const proxy=page.locator(`#trial-board [data-proxy-position="${x},${y}"]`),tile=page.locator(`#trial-board [data-position="${x},${y}"]`);
    if(await proxy.count()){await proxy.click();mousePicks++;return;}
    // Choose a genuinely exposed point of the polygon, avoiding its empty bounding-box corners.
    const point=await tile.evaluate((e,key)=>{const b=e.getBoundingClientRect();for(const fy of [.5,.3,.7,.15,.85])for(const fx of [.5,.3,.7]){const x=b.x+b.width*fx,y=b.y+b.height*fy;const hit=document.elementFromPoint(x,y);if(hit?.closest('[data-position]')?.dataset.position===key)return{x,y};}return null;},`${x},${y}`);
    if(point){await page.mouse.click(point.x,point.y);mousePicks++;}
    else{await tile.focus();await page.keyboard.press('Enter');keyboardPicks++;}
  }
  // Mission chooser expanded, while preparation artwork and equipment controls remain.
  await page.goto(`http://127.0.0.1:${server.address().port}/offworld.html`);await waitImages();
  assert.deepEqual(await page.locator('#setup img').evaluateAll(a=>a.map(i=>new URL(i.src).pathname)),['centurion','aer','bound','murr','centurion','shield','sword','aer','bound','murr','krag'].map(id=>`/assets/sprites/${id}.png`));
  await page.locator('#setup').screenshot({path:join(repo,'docs/screenshots/build-0.9-preparation.png')});
  assert.equal(await page.locator('#level-cards .level-card').count(),10);assert.equal(await page.locator('#level-cards a').getAttribute('href'),'/index.html');

  const keys={sidearm:'Basic sidearm',objective:'Secure / Free',revive:'Revive',leap:'Leap',musk:'Musk burst',rally:'Rally',defend:'Defend',extract:'Extract',fullRevive:'Full revive'};
  for(const [level,seed] of [['salvage',42],['relay',42],['rescue',42],['rescue',7],['crown',42],['ferry',42],['foundry',42],['caravan',42],['sluice',42],['archive',42]]){
    await page.emulateMedia({reducedMotion:level==='salvage'?'no-preference':'reduce'});
    const plan=simulateTrial(level,'mixed',seed),gear=presetLoadout('mixed');
    await page.goto(`http://127.0.0.1:${server.address().port}/offworld.html`);
    await page.getByRole('button',{name:new RegExp(LEVELS[level].name)}).click();await page.locator('#seed').fill(String(seed));
    await page.locator('#launch').click();await waitImages();await page.locator('.battlefield').screenshot({path:join(repo,`docs/screenshots/build-0.9-${level}-battlefield.png`)});assert.equal(await page.locator('#trial-board [data-position][role="button"]').count(),96);
    if(level==='salvage'){
      await page.locator('#pause-trial').click();assert.ok(await page.locator('#trial-end').isDisabled());assert.ok(await page.locator('#pause-panel').isVisible());
      await page.locator('#resume-trial').click();assert.ok(await page.locator('#trial-end').isEnabled());
      await page.locator('#trial-board [data-position].role-healer').focus();assert.match(await page.locator('#target-info').innerText(),/Mend/);
      await page.locator('#trial-board [data-position].legal').first().focus();assert.match(await page.locator('#target-info').innerText(),/ground steps.*Z travel.*fall damage/);
      const svg=page.locator('#trial-board .battle-scene-svg');
      assert.ok(await page.locator('#trial-board .scene-cliff').count()>0);
      assert.ok(await page.locator('#trial-board image').evaluateAll(a=>a.every(i=>i.href.baseVal.startsWith('/assets/battle/'))));
      await page.locator('#trial-board [data-position="0,0"]').focus();await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.activeElement.dataset.position),'1,0');
      await page.locator('#trial-board .scene-zoom-in').click();assert.ok(Number(await svg.getAttribute('data-zoom'))>1);await page.locator('#trial-board .scene-pan-right').click();assert.ok(Number(await svg.getAttribute('data-pan-x'))!==0);
      await page.locator('#trial-board .scene-reset').click();assert.equal(Number(await svg.getAttribute('data-zoom')),1);assert.equal(Number(await svg.getAttribute('data-pan-x')),0);
      await page.locator('#trial-board .scene-labels').click();assert.equal(await page.locator('#trial-board .scene-labels').getAttribute('aria-pressed'),'true');
      await page.locator('.battlefield').screenshot({path:join(repo,'docs/screenshots/build-0.9-elevation.png')});
      await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile overflow');
      await page.locator('#trial-board .scene-zoom-in').click();await page.locator('#trial-board .scene-pan-right').click();await page.locator('.battlefield').screenshot({path:join(repo,'docs/screenshots/build-0.9-mobile.png')});await page.locator('#trial-board .scene-reset').click();
      await page.locator('#map-view').click();assert.match(await page.locator('.battle-scene-svg').getAttribute('aria-label'),/Tactical battlefield/);await page.locator('#map-view').click();
      await page.setViewportSize({width:1440,height:1100});
    }
    for(const a of plan.transcript){
      if(a.key==='endTurn'){await page.locator('#trial-end').click();continue;}
      await page.locator('#trial-roster button').filter({hasText:RECRUITS[a.actor].name}).click();
      const label=a.key==='attack'?WEAPONS[gear.find(u=>u.id===a.actor).weapon].name:a.key==='move'?(a.actor==='aer'?'Fly / Move':'Move'):keys[a.key];
      const button=page.locator('#trial-actions button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))});
      await button.click();
      if(!['defend','musk','extract'].includes(a.key))await pickTile(a.x,a.y);
      if(await page.locator('#move-confirmation').isVisible())await page.locator('#confirm-move').click();
    }
    assert.ok(await page.locator('#trial-ending').isVisible());
    await page.locator('#rating').selectOption('About right');await page.locator('#feedback').fill('Automated build 0.9 browser verification in a temporary repository.');
    const saveResponse=page.waitForResponse(r=>r.url().endsWith('/api/playtests'));
    await page.locator('#save-repo').click();const response=await saveResponse;assert.equal(response.status(),201,await response.text());
    await page.waitForFunction(()=>document.querySelector('#save-status').textContent.startsWith('Saved to docs/playtests/'));
    const text=await page.locator('#save-status').innerText(),path=text.slice('Saved to '.length),saved=JSON.parse(await readFile(join(root,path),'utf8'));
    assert.equal(saved.version,'0.9.0');assert.equal(saved.rulesVersion,'0.9.0');assert.equal(saved.status,plan.status);assert.equal(saved.rounds,plan.rounds);assert.deepEqual(saved.metrics,plan.metrics);
    assert.equal(saved.extracted.length,plan.extracted);assert.ok(saved.actionTimes.length);assert.ok(saved.initialState&&saved.finalState&&saved.events.length);
    replayTrial(saved);assert.ok(await page.locator('#save-repo').isDisabled());
    if(level==='relay')await page.locator('#trial-ending').screenshot({path:join(repo,'docs/screenshots/build-0.9-result.png')});
    results.push({level,seed,status:saved.status,rounds:saved.rounds,actions:saved.metrics.actions,extracted:saved.extracted.length,events:saved.events.length,bytes:Buffer.byteLength(JSON.stringify(saved))});
  }
  // Preserve downloaded traces and notes when a subsequent write fails.
  await page.locator('#feedback').fill('Keep this revised note after a failed save.');
  await page.route('**/api/playtests',r=>r.fulfill({status:500,contentType:'application/json',body:JSON.stringify({error:'Test write failure; your notes are still here.'})}));
  await page.locator('#save-repo').click();await page.waitForFunction(()=>document.querySelector('#save-status').textContent.includes('Test write failure'));
  assert.equal(await page.locator('#feedback').inputValue(),'Keep this revised note after a failed save.');assert.ok(await page.locator('#save-repo').isEnabled());await page.unroute('**/api/playtests');
  const downloadEvent=page.waitForEvent('download');await page.locator('#download-result').click();const download=await downloadEvent;const downloaded=JSON.parse(await readFile(await download.path(),'utf8'));assert.equal(downloaded.notes,'Keep this revised note after a failed save.');replayTrial(downloaded);
  await page.emulateMedia({reducedMotion:'no-preference'});
  // An ordinary route to the starting lookout exercises a real damaging drop.
  await page.goto(`http://127.0.0.1:${server.address().port}/offworld.html`);await page.getByRole('button',{name:/Basalt relay/}).click();await page.locator('#launch').click();
  await page.locator('#trial-board [role="button"][data-position="0,0"]').focus();await page.keyboard.press('Enter');assert.match(await page.locator('#trial-selected').innerText(),/Z2/);
  await page.locator('#trial-end').click();await page.waitForFunction(()=>!document.getElementById('trial-board').inert);await page.locator('#trial-board [role="button"][data-position="0,3"]').focus();
  assert.match(await page.locator('#target-info').innerText(),/3 fall damage/);
  await pickTile(0,3);assert.ok(await page.locator('#move-confirmation').isVisible());
  await page.locator('#cancel-move').click();assert.match(await page.locator('#trial-selected').innerText(),/13\/13 HP/);
  await pickTile(0,3);await page.locator('#confirm-move').click();assert.match(await page.locator('#trial-selected').innerText(),/10\/13 HP/);
  // Defend in Aegis with a five-turn deadline to reach the actual enforcement window.
  await page.goto(`http://127.0.0.1:${server.address().port}/offworld.html`);await page.getByRole('button',{name:'Heavy signature',exact:true}).click();
  for(let slot=0;slot<4;slot++){await page.locator(`#slot-${slot}-weapon`).selectOption('singularity');await page.locator(`#slot-${slot}-armor`).selectOption('aegis');}
  assert.match(await page.locator('#forecast').innerText(),/5 safe turns/);await page.locator('#launch').click();
  for(let turn=0;turn<5;turn++){for(const id of ['centurion','aer','bound','krag']){await page.locator('#trial-roster button').filter({hasText:RECRUITS[id].name}).click();const defend=page.locator('#trial-actions button').filter({hasText:/^Defend/});if(await defend.isEnabled())await defend.click();}await page.locator('#trial-end').click();}
  assert.match(await page.locator('#clock').innerText(),/ENFORCEMENT ACTIVE/);assert.equal(await page.locator('.scene-enforcer').count(),2);assert.equal(await page.locator('.scene-target-halo').count(),1);await waitImages();
  await page.locator('.battlefield').screenshot({path:join(repo,'docs/screenshots/build-0.9-enforcement.png')});
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.scene-enforcer-body').first().evaluate(e=>getComputedStyle(e).animationName),'none');
  await page.locator('#trial-end').click();assert.match(await page.locator('#trial-log').innerText(),/vaporized/);await page.locator('#trial-end').click();assert.ok(await page.locator('#trial-ending').isVisible());
  // A same-map/same-seed retry must reset presentation history as well as game state.
  await page.locator('#retry-trial').click();assert.equal(await page.locator('.scene-enforcer').count(),0);
  for(let turn=0;turn<5;turn++){for(const id of ['centurion','aer','bound','krag']){await page.locator('#trial-roster button').filter({hasText:RECRUITS[id].name}).click();const defend=page.locator('#trial-actions button').filter({hasText:/^Defend/});if(await defend.isEnabled())await defend.click();}await page.locator('#trial-end').click();}
  assert.equal(await page.locator('.scene-enforcer.is-arriving').count(),2,'Retry must not suppress the enforcement arrival');
  await page.goto(`http://127.0.0.1:${server.address().port}/`);await waitImages();assert.equal(await page.locator('#board button').count(),108);await page.locator('#board').screenshot({path:join(repo,'docs/screenshots/build-0.9-roman.png')});
  assert.deepEqual(errors,[]);assert.deepEqual(failedAssets,[]);console.log(JSON.stringify({results,errors,failedAssets,mousePicks,keyboardPicks,menu:'Ten mission cards; original preparation illustrations preserved',enforcement:'Arrival, target lock, two-turn vaporization, reduced motion checked',testRecords:'Temporary copy only; no fabricated human records added.'},null,2));
}finally{
  await browser?.close();if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}
  assert.equal(dirname(root),resolve(tmpdir()));assert.ok(basename(root).startsWith('legionnaires-v09-browser-'));
  await rm(root,{recursive:true,force:true});
}
