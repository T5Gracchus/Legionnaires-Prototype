// Focused final UI/art check; no playtest records are written.
import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {createPrototypeServer} from './server.mjs';
import {simulateTrial} from './playtest-trials.mjs';
import {LEVELS,RECRUITS,WEAPONS,presetLoadout} from '../src/trials-data.js';
import {createTrial,act,endTurn} from '../src/trials-engine.js';
import {goalLines} from '../src/trials-goals.js';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=fileURLToPath(new URL('..',import.meta.url)),server=createPrototypeServer({root});let browser;
try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch({channel:'msedge',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'}),errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
  const ready=s=>s.levelId==='crown'?s.mission.progress>=2:s.levelId==='ferry'?s.mission.progress>=3:s.levelId==='foundry'?s.metrics.structuresDestroyed>=1:s.levelId==='caravan'?s.mission.routeIndex>=2:s.levelId==='sluice'?s.mission.progress>=2:s.objectives[1].done;
  const keys={sidearm:'Basic sidearm',objective:'Secure / Free',revive:'Revive',leap:'Leap',musk:'Musk burst',rally:'Rally',defend:'Defend',extract:'Extract',fullRevive:'Full revive'};
  for(const id of ['crown','ferry','foundry','caravan','sluice','archive']){
    const s=createTrial(id,presetLoadout(),42),plan=simulateTrial(id,'mixed',42);await page.goto(`http://127.0.0.1:${server.address().port}/offworld.html`);
    await page.getByRole('button',{name:new RegExp(LEVELS[id].name)}).click();await page.locator('#launch').click();
    for(const a of plan.transcript){
      if(a.key==='endTurn'){await page.locator('#trial-end').click();endTurn(s);}else{
        await page.locator('#trial-roster button').filter({hasText:RECRUITS[a.actor].name}).click();
        const label=a.key==='attack'?WEAPONS[s.units.find(u=>u.id===a.actor).weapon].name:a.key==='move'?(a.actor==='aer'?'Fly / Move':'Move'):keys[a.key];
        await page.locator('#trial-actions button').filter({hasText:new RegExp('^'+label.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))}).click();
        if(!['defend','musk','extract'].includes(a.key)){await page.locator(`#trial-board [data-position="${a.x},${a.y}"]`).focus();await page.keyboard.press('Enter');}
        if(await page.locator('#move-confirmation').isVisible())await page.locator('#confirm-move').click();assert.ok(act(s,a.actor,a.key,a.x,a.y));
      }
      if(ready(s))break;
    }
    assert.deepEqual(await page.locator('#mission-goals p').allTextContents(),goalLines(s));
    if(s.mission.protected)assert.equal(await page.locator('.scene-structure-labels .scene-structure-label').filter({hasText:'PROTECT'}).count(),1);
    if(id==='foundry')assert.ok(await page.locator('.scene-mission-prop.is-destroyed').count()>0);
    const srcs=await page.locator('#trial-board svg image').evaluateAll(a=>a.map(i=>i.href.baseVal));
    await page.evaluate(async sources=>{await Promise.all([...new Set(sources)].map(src=>new Promise((resolve,reject)=>{const i=new Image();i.onload=resolve;i.onerror=()=>reject(Error(src));i.src=src;})));},srcs);
    await page.locator('#mission').screenshot({path:`${root}/docs/screenshots/build-0.9-${id}-progress.png`});
    checks.push({level:id,round:s.round,goals:goalLines(s),images:srcs.length});
  }
  await page.setViewportSize({width:390,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.locator('#mission-goals').screenshot({path:`${root}/docs/screenshots/build-0.9-mobile-goals.png`});assert.deepEqual(errors,[]);
  const report={build:'0.9.0',checks,errors,save:'No records written; complete save/replay flows covered by check-trials-browser.mjs'};await mkdir(`${root}/docs/reports/checks`,{recursive:true});await writeFile(`${root}/docs/reports/checks/offworld-v09-presentation.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();server.closeAllConnections();await new Promise(r=>server.close(r));}
