import {EXTRA_LEVELS} from './trials-missions.js';
// Off-world laboratory. Names, values, and missions are reversible playtest choices.
export const WEAPONS = {
  gladius: { name:'Gladius', damage:[3,5], range:1, signature:0, ammo:null, note:'Reliable Roman melee weapon.' },
  pila: { name:'Javelin bundle', damage:[3,5], range:3, signature:0, ammo:5, note:'Thrown across water; five shots, then use sidearm.' },
  sling: { name:'River-stone sling', damage:[2,4], range:4, signature:0, ammo:null, note:'Aer native weapon. Unlimited stones; positioning matters.' },
  thorn: { name:'Thorn spear', damage:[3,5], range:2, signature:0, ammo:null, note:'Bound native weapon. Reach across a narrow gap.' },
  gourd: { name:'Seed bellows', damage:[2,4], range:3, signature:0, ammo:null, note:'Murr native weapon. Works with musk; does not generate signature.' },
  maul: { name:'Obsidian maul', damage:[4,6], range:1, signature:0, ammo:null, pierce:1, note:'Krag native weapon. Ignores one armor.' },
  musket: { name:'Captors’ powder rifle', damage:[4,6], range:5, signature:1, ammo:5, note:'Early firearm. Five shots; audible, detectable.' },
  carbine: { name:'Pulse carbine', damage:[5,7], range:5, signature:3, ammo:6, note:'Advanced energy weapon. Strong, with a shorter operating window.' },
  arc: { name:'Arc projector', damage:[6,8], range:4, signature:4, ammo:5, pierce:1, chain:2, note:'Hits a second adjacent enemy for 2 damage; never chains to allies.' },
  singularity: { name:'Singularity lance', damage:[9,11], range:6, signature:7, ammo:3, pierce:2, note:'Extreme technology. Three devastating shots, very short deadline.' },
};
export const ARMORS = {
  woven:{name:'Woven armor',hp:0,armor:0,move:0,dodge:.05,signature:0,note:'Native fibers: light and low signature.'},
  scale:{name:'Shell lamellar',hp:2,armor:1,move:-1,dodge:0,signature:0,note:'Native shell and leather; slower but protective.'},
  mesh:{name:'Filtered combat mesh',hp:1,armor:1,move:0,dodge:0,signature:1,filter:true,note:'Protects against musk, including friendly clouds.'},
  aegis:{name:'Aegis field harness',hp:3,armor:2,move:-1,dodge:0,signature:2,filter:true,note:'Advanced protection. Its field also shortens your deadline.'},
};
export const RECRUITS = {
  centurion:{name:'Centurion',species:'Roman',token:'C',sprite:'centurion',hp:13,move:4,dodge:.1,block:.2,weapon:'gladius',armor:'scale',ability:'Rally',description:'Item/Special: self or adjacent ally regains 4 HP, once per mission. Also has one full-health revive for an adjacent fallen ally.'},
  shield:{name:'Shield brother',species:'Roman',token:'B1',sprite:'shield',hp:11,move:4,dodge:.05,block:.3,weapon:'pila',armor:'scale',ability:'Shield wall',description:'Act: Defend reduces incoming damage by 3 instead of 2.'},
  sword:{name:'Sword brother',species:'Roman',token:'B2',sprite:'sword',hp:11,move:5,dodge:.15,block:.1,weapon:'gladius',armor:'woven',ability:'Quick step',description:'Passive: 5 base movement and higher dodge. Gear can be exchanged freely before deployment.'},
  aer:{name:'Seli',species:'Aer glider',token:'SE',sprite:'aer',hp:10,move:5,dodge:.15,block:.05,weapon:'sling',armor:'woven',ability:'Flight',description:'Move over water, rubble, and units. Must land on an empty ground tile. Cannot land on walls or water.'},
  bound:{name:'Tekk',species:'Bound leaper',token:'TE',sprite:'bound',hp:12,move:4,dodge:.1,block:.1,weapon:'thorn',armor:'woven',ability:'Leap',description:'Item/Special: leap up to 4 tiles over obstacles to empty ground. Your Move remains available.'},
  murr:{name:'Porr',species:'Murr musk keeper',token:'PO',sprite:'murr',hp:13,move:4,dodge:.05,block:.15,weapon:'gourd',armor:'woven',ability:'Musk burst',description:'Item/Special: radius-2 cloud lasts through two enemy phases. Affected enemies AND allies lose 1 damage and 10 percentage points of dodge. Murr and filtered armor are immune.'},
  krag:{name:'Oru',species:'Krag stoneback',token:'OR',sprite:'krag',hp:15,move:3,dodge:.02,block:.2,innateArmor:1,weapon:'maul',armor:'woven',ability:'Stone shell',description:'Passive: natural armor reduces each hit by 1. Defend reduces damage by 3. Slow but durable.'},
};
export const PRESETS = {
  native:{name:'Native expedition',note:'Long operating window. Use movement abilities and native tools.',ids:['centurion','aer','bound','murr'],gear:{}},
  mixed:{name:'One advanced weapon',note:'A pulse carbine clears guards, while the aliens handle traversal.',ids:['centurion','aer','bound','murr'],gear:{centurion:{weapon:'carbine',armor:'woven'}}},
  heavy:{name:'Heavy signature',note:'Extreme firepower, light armor. Plan a fast exit before deployment.',ids:['centurion','aer','bound','krag'],gear:{centurion:{weapon:'singularity',armor:'woven'},krag:{weapon:'arc',armor:'woven'}}},
  roman:{name:'Roman fireteam',note:'The trio supported by a glider. Preserve Roman cooperation with a ranged rifle.',ids:['centurion','shield','sword','aer'],gear:{shield:{weapon:'musket',armor:'woven'}}},
  musk:{name:'Filtered musk team',note:'Porr can weaken guards without affecting allies in filtered armor.',ids:['centurion','aer','murr','krag'],gear:{centurion:{armor:'mesh'},aer:{armor:'mesh'},krag:{armor:'mesh'}}},
};
export const LEVELS = {
  salvage:{name:'Reedwater salvage',subtitle:'Terraced banks and a contested crossing',baseTurns:16,theme:'reedwater',
    brief:'Recover two bundles on raised river terraces. A mender and caller support the defenders; the binder guards the southern approach. Flight and Leap can open a faster route.',
    heights:['210001111111','000001122221','000001122221','000000000000','000001111111','000001122221','000001123321','000001122221'],
    map:['............','XX..T...T...','XX..T.......','~~~~~..~~~~~','.......T....','...T........','......T.....','............'],
    starts:[[1,1],[1,2],[2,1],[2,2]],objectives:[{x:9,y:1,name:'North salvage',kind:'salvage'},{x:9,y:6,name:'South salvage',kind:'salvage'}],
    enemies:[['spear',7,2],['healer',10,1],['commander',8,5],['sling',10,6],['hexer',9,7]],reinforcements:[{round:5,x:11,y:7,type:'spear'}]},
  relay:{name:'Basalt relay',subtitle:'Climb the relay terraces under coordinated fire',baseTurns:16,theme:'basalt',
    brief:'Disable two relays on stepped basalt terraces. Rubble and ridges break firing lanes; a caller, mender, and binder support the guards. Plan the climb and a safe descent.',
    heights:['210011122221','000011123321','000011122221','000011111111','000011122221','000011123321','000011122221','000011111111'],
    map:['............','XX..W...W...','XX..W.......','....W.W.....','......W.....','..W...W.W...','..W.........','............'],
    starts:[[1,1],[1,2],[2,1],[2,2]],objectives:[{x:9,y:1,name:'North relay',kind:'relay'},{x:9,y:6,name:'South relay',kind:'relay'}],
    enemies:[['sling',8,2],['spear',6,2],['commander',9,4],['healer',10,6],['hexer',5,5]],reinforcements:[{round:5,x:11,y:3,type:'sling'}]},
  rescue:{name:'The spore bazaar',subtitle:'Break a support team guarding the raised stockades',baseTurns:16,theme:'spores',
    brief:'Free two captives from raised stockades guarded by wardens and a support team. Reinforcements enter in round 4. Captives leave safely when freed; they do not need carrying.',
    heights:['210001111111','000001122221','000001122221','000001111111','000001122221','000001122221','000001123321','000001122221'],
    map:['............','XX.....T....','XX..T.......','..T....W....','.....W......','...T........','.......T....','............'],
    starts:[[1,1],[1,2],[2,1],[2,2]],objectives:[{x:8,y:2,name:'Captive scout',kind:'captive'},{x:9,y:6,name:'Captive artisan',kind:'captive'}],
    enemies:[['brute',7,2],['healer',10,2],['commander',8,5],['brute',10,6],['hexer',5,6]],reinforcements:[{round:4,x:11,y:7,type:'spear'}]},
};
Object.assign(LEVELS,EXTRA_LEVELS);
export const ENEMIES = {
  spear:{name:'Thorn guard',hp:9,move:3,damage:[2,4],range:1,dodge:.05,block:.1,sprite:'enemy'},
  sling:{name:'Seed slinger',hp:8,move:2,damage:[2,4],range:4,dodge:.08,block:.05,sprite:'enemy'},
  brute:{name:'Shell warden',hp:12,move:2,damage:[3,5],range:1,dodge:.02,block:.15,armorValue:1,sprite:'enemy'},
  healer:{name:'Reed mender',hp:8,move:3,damage:[1,2],range:3,dodge:.08,block:.05,sprite:'enemy',role:'healer',charges:2,supportRange:3,symbol:'✚',description:'Mend: heals a living ally for 4 HP within range 3. Two uses; two-round cooldown. Cannot revive.'},
  hexer:{name:'Spore binder',hp:8,move:3,damage:[1,2],range:3,dodge:.08,block:.05,sprite:'enemy',role:'hexer',charges:3,supportRange:3,symbol:'✺',description:'Binding spores: −1 ground movement and −10 percentage points dodge through your next turn and enemy phase. Three uses; two-round cooldown. Does not stack.'},
  commander:{name:'Shell caller',hp:10,move:3,damage:[2,3],range:2,dodge:.05,block:.15,sprite:'enemy',role:'commander',charges:2,supportRange:3,symbol:'⚑',description:'War chant: nearby allies gain +1 attack damage for this enemy phase. Two uses; three-round cooldown. Grants no additional attacks.'},
};
// X/Y ground steps, Z traversal per Move, maximum single upward step, and safe drop.
export const TRAVERSAL = {
  centurion:{vertical:2,climb:1,safeDrop:1},shield:{vertical:1,climb:1,safeDrop:1},
  sword:{vertical:3,climb:1,safeDrop:1},aer:{vertical:5,climb:3,safeDrop:3},
  bound:{vertical:4,climb:2,safeDrop:2},murr:{vertical:2,climb:1,safeDrop:1},
  krag:{vertical:2,climb:1,safeDrop:2},
};
for(const [id,traits] of Object.entries(TRAVERSAL))Object.assign(RECRUITS[id],traits);
export function presetLoadout(key='mixed') {
  const preset=PRESETS[key];
  return preset.ids.map(id=>({id,weapon:RECRUITS[id].weapon,armor:RECRUITS[id].armor,...preset.gear[id]}));
}
export function detectionBudget(levelId,loadout) {
  const signatures=loadout.map(u=>WEAPONS[u.weapon].signature+ARMORS[u.armor].signature);
  const total=signatures.reduce((a,b)=>a+b,0), peak=Math.max(0,...signatures);
  const penalty=peak+Math.floor((total-peak)/3);
  return {total,peak,penalty,turns:Math.max(5,LEVELS[levelId].baseTurns-penalty),grace:2};
}
