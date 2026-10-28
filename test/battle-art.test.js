import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {battleSprite,terrainTexture,terrainProp,enforcerSprite} from '../src/battle-assets.js';
import {projectBattlePoint,rotateBattlePoint,cameraFacing,cameraDirections} from '../src/battle-scene.js';
const root=new URL('..',import.meta.url);
const menuHashes={
  'aer.png':'907d72d1bba1b1db5a1c69489725f7d476ca93bc667bb6b5ae0e265983fa79bf',
  'bound.png':'15cd3463bf45c392b45ed3bde9d9f900397add84a231794b1a64a3b4e204888b',
  'centurion.png':'7ef9c9d47359094f994838c286e9a3ce1e99b3e7057c8c50f25e658f308f02b7',
  'enemy.png':'95e3c4febc66cba9c9edefaf57c004156f9be2a3a6e273ffe19d7e1c243c4119',
  'krag.png':'7147dc1283ea80b4380b839ea2e3c4ad8626ca7929065619f616f7495504362c',
  'legionnaire.png':'de69e00bab1c178e86f634e8f5eb1bfeadd081f4fe5d883648cb90286d022f59',
  'murr.png':'6d90eab8c68cc6b167b0c7464764ac16510178876144a111852bd73df3a3b36b',
  'shield.png':'e3a443a5004a611aef23473e4d2352a0bb9c0b02434e34f5eb3199ab715477fa',
  'sword.png':'5df54e21cb0623b06d1ae1a65f166ec95239573798dcee0929b7d95c8a5c5695',
};
test('the graphics overhaul preserves every original menu illustration byte for byte',async()=>{
  for(const [name,hash] of Object.entries(menuHashes))assert.equal(createHash('sha256').update(await readFile(new URL(`assets/sprites/${name}`,root))).digest('hex'),hash,`${name} changed`);
});
test('battle art resolves locally with complete directional, terrain, prop and enforcement coverage',async()=>{
  const urls=new Set();
  for(const id of ['centurion','shield','sword','legionnaire','aer','bound','murr','krag','spear','sling','brute','healer','hexer','commander']){
    const directions=['se','sw','ne','nw'].map(d=>battleSprite(id,d));assert.equal(new Set(directions).size,4,`${id} needs separately addressable views`);
    directions.forEach(url=>urls.add(url));urls.add(battleSprite(id,'se',true));
  }
  for(const theme of ['reedwater','basalt','spores']){urls.add(terrainTexture(theme,'ground'));urls.add(terrainTexture(theme,'water'));for(const type of ['tree','rubble','wagon','casualty','extraction','relay','salvage','captive','control-spire','ferry-beacon','generator','escort-cart','archive','sluice','barricade','barricade-broken'])urls.add(terrainProp(theme,type));}
  urls.add(enforcerSprite());
  for(const url of urls){assert.match(url,/^\/assets\/battle\/[a-z0-9/_.-]+\.png$/);const bytes=await readFile(new URL(url.slice(1),root));assert.ok(bytes.length>100,`${url} is empty`);assert.equal(bytes.subarray(1,4).toString(),'PNG',`${url} is not a PNG`);assert.ok(bytes.readUInt32BE(16)>0&&bytes.readUInt32BE(20)>0);}
  assert.notEqual(battleSprite('healer'),battleSprite('hexer'));assert.notEqual(battleSprite('commander'),battleSprite('spear'));
});
test('height changes visible elevation without changing ground projection coordinates',()=>{
  const ground=projectBattlePoint(4,3,0),raised=projectBattlePoint(4,3,3);assert.equal(ground.x,raised.x);assert.ok(ground.y-raised.y>=60,'Three levels must have a substantial visible height difference');
  const xStep=projectBattlePoint(5,3,0),yStep=projectBattlePoint(4,4,0);assert.ok(xStep.x>ground.x&&yStep.x<ground.x);assert.ok(xStep.y>ground.y&&yStep.y>ground.y);
  assert.deepEqual(projectBattlePoint(4,3,0,false),projectBattlePoint(4,3,3,false),'Tactical view preserves the logical cell independent of height');
});
test('four camera angles preserve height, tile identity, and neighboring faces on rectangular maps',()=>{
  const seen=new Set();
  for(let turn=0;turn<4;turn++){
    const p=projectBattlePoint(7,2,0,true,turn),high=projectBattlePoint(7,2,3,true,turn);seen.add(`${p.x},${p.y}`);
    assert.equal(p.x,high.x);assert.equal(p.y-high.y,72);
    const [right,down]=cameraDirections(turn),r=rotateBattlePoint(...right,turn),d=rotateBattlePoint(...down,turn);
    assert.equal(r.x,1);assert.ok(r.y===0);assert.ok(d.x===0);assert.equal(d.y,1);
    const points=new Set();for(let y=0;y<8;y++)for(let x=0;x<12;x++){const v=projectBattlePoint(x,y,0,true,turn);points.add(`${v.x},${v.y}`);}assert.equal(points.size,96);
  }
  assert.equal(seen.size,4);assert.deepEqual(projectBattlePoint(7,2,1,true,4),projectBattlePoint(7,2,1));
  assert.deepEqual(projectBattlePoint(7,2,1,true,-1),projectBattlePoint(7,2,1,true,3));
});
test('sprite directions follow the rotated ground axes',()=>{
  assert.deepEqual([0,1,2,3].map(turn=>cameraFacing('se',turn)),['se','sw','nw','ne']);
  assert.equal(cameraFacing('sw',-1),'se');assert.equal(cameraFacing('ne',1),'se');
});
