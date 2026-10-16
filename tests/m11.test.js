import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {ADVANCED_SHAPES,ADVANCED_TRAITS,ELITES} from '../advanced-defs.js';
import {advancedType,safePortalPair,phaseVulnerable,portalContact,polarTick} from '../advanced-shapes.js';
import {CODEX_IDS,codexStage,normalizeCodex,codexSnapshot,applyCodex,codexInsights} from '../codex.js';
import {eligibleElites,tryElite} from '../elites.js';
import {rollTrait} from '../ecology.js';
import {freshSave,loadSave,writeSave} from '../storage.js';
import {stageSettlement,completeSettlement,settle} from '../progression.js';
const advance=(g,t)=>{while(t>1e-9){const step=Math.min(t,C.step);g.update(step);t-=step;}};
function arena(extra={}){const g=new Game({advancedEnabled:true,ecologyEnabled:true,skillExpansionEnabled:true,discoveryRank:4,sandbox:true,options:{motionEnabled:false},...extra});g.shapes=[];g.shards=[];g.queue=[];g.spawnClock=-Infinity;return g;}
function add(g,type,x=450,y=270){const s=g.addShape(type,x,y,0,false,0);s.secondaryTrait=null;return s;}
function hit(g,s,n,source='direct',chain=g.newChain(),extra={}){g.enqueue(s,n,{source,chainId:chain,depth:0,...extra});g.flush();return chain;}
function main(g,x,y,angle=0,extra={}){const p=g.emitShard(x,y,angle,'triangle',g.newChain(),0);p.range=450;p.life=1;Object.assign(p,extra);return p;}
function wave(g,s,source='square',chain=g.newChain(),extra={}){return g.area({x:s.x-60,y:s.y,id:-1},150,1,{source,nativeWave:true,chainId:chain,depth:0,originShapeId:-1,...extra},'#fff');}
test('M11 exact19 shapes/8 secondary traits/schema8; all rank AND tier and alive caps',()=>{
 assert.equal(Object.keys(C.shapes).length,19);assert.equal(Object.keys(ADVANCED_SHAPES).length,6);assert.equal(Object.keys(ADVANCED_TRAITS).length,4);assert.equal(C.saveVersion,10);
 for(const[id,d]of Object.entries(ADVANCED_SHAPES)){const g=arena({discoveryRank:d.rank});g.advancedIntroFlags=Object.fromEntries(Object.keys(ADVANCED_SHAPES).filter(k=>k!==id).map(k=>[k,true]));g.highestTier=d.tier-1;assert.notEqual(advancedType(g),id);g.highestTier=d.tier;assert.equal(advancedType(g),id);for(let i=0;i<d.cap;i++)add(g,id,100+i*90,200);assert.notEqual(advancedType(g),id);g.discoveryRank=d.rank-1;g.shapes=[];assert.notEqual(advancedType(g),id);}
});
test('M11 Portal atomic pair, >=180 spacing, one rare lottery, actual trace keeps path/life and one passage',()=>{
 const g=arena(),pair=safePortalPair(g,[{x:250,y:270},{x:650,y:270}]);assert.equal(pair.length,2);assert.equal(pair[1].oreGrade,'common');assert.equal(pair[0].portalPartner,pair[1].id);assert.equal(safePortalPair(g),null);advance(g,.16);
 const target=add(g,'square',750,270),p=main(g,100,270);advance(g,.31);assert.ok(p.portalPassed);assert.equal(g.advancedCounts.portalPass,1);assert.equal(target.hp,1);assert.equal(pair[0].hp,6);assert.equal(pair[1].hp,6);assert.ok(p.distance<250&&p.age<.4);assert.equal(p.portalPairs.size,1);
 const before=g.alive.length;assert.equal(safePortalPair(g,[{x:200,y:270},{x:280,y:270}]),null);assert.equal(g.alive.length,before);
});
test('M11 Portal unsafe exit cancels, auxiliary excluded, death unlinks immediately',()=>{
 const g=arena(),pair=safePortalPair(g,[{x:250,y:270},{x:650,y:270}]);advance(g,.16);add(g,'square',678,270);const p=main(g,225,270);assert.equal(portalContact(g,p,pair[0],g.elapsed),false);p.small=true;assert.equal(portalContact(g,p,pair[0],g.elapsed),false);hit(g,pair[0],99);assert.equal(pair[1].portalPartner,undefined);assert.equal(pair[1].destroyed,false);
});
test('M11 Parasite copies <=1HP to two original living links after.04s and never recurses',()=>{
 const g=arena(),a=add(g,'square',390),b=add(g,'square',510),s=add(g,'parasiteLink');hit(g,s,3);assert.equal(a.hp,4);advance(g,.039);assert.equal(a.hp,4);advance(g,.002);assert.equal(a.hp,3);assert.equal(b.hp,3);assert.equal(g.codexDelta.parasiteLink.techniques,1);advance(g,.2);assert.equal(g.advancedCounts.parasiteDelivered,2);
 const h=arena(),t=add(h,'square',390),p=add(h,'parasiteLink');hit(h,p,3,'parasiteCopied');advance(h,.1);assert.equal(t.hp,4);assert.equal(h.codexDelta.parasiteLink.techniques,0);
});
test('M11 Phase actual game timestamp, guarded direct0/shard<=1, pause and Disruptor extension',()=>{
 const g=arena({levels:{phaseDisruptor:2}}),s=add(g,'phaseCrystal');s.phaseOffset=1.0;assert.equal(phaseVulnerable(g,s),false);hit(g,s,8);assert.equal(s.hp,9);hit(g,s,8,'triangle');assert.equal(s.hp,8);g.paused=true;advance(g,1);assert.equal(g.elapsed,0);g.paused=false;advance(g,.41);assert.equal(phaseVulnerable(g,s),true);hit(g,s,1);assert.equal(s.phaseExtension,.2);s.phaseOffset=.95;assert.equal(phaseVulnerable(g,s,s.spawnAt),true);
});
test('M11 Beacon own normal Chain10 threshold, once, foreign Chain/Echo/deadline do not qualify',()=>{
 for(const qualifying of [false,true]){const g=arena(),beacon=add(g,'chainBeacon'),chain=g.newChain();g.chains.get(chain).rewardedKills=qualifying?9:0;const other=g.newChain();g.chains.get(other).rewardedKills=20;hit(g,beacon,99,'triangle',chain);advance(g,.06);assert.equal(g.advancedCounts.beaconWave||0,qualifying?1:0);assert.equal(g.codexDelta.chainBeacon.techniques,qualifying?1:0);advance(g,.5);assert.equal(g.advancedCounts.beaconWave||0,qualifying?1:0);}
 const g=arena({duration:.04});hit(g,add(g,'chainBeacon'),99);advance(g,.1);assert.equal(g.advancedCounts.beaconWave||0,0);
});
test('M11 Shifter scheduled discontinuity25..35, real pointer uses new pose, no ghost old target',()=>{
 const g=arena(),s=add(g,'shifter'),old={x:s.x,y:s.y};advance(g,1.31);assert.equal(g.advancedCounts.shifterLeap,1);const distance=Math.hypot(s.x-old.x,s.y-old.y);assert.ok(distance>=25-1e-9&&distance<=35+1e-9);assert.deepEqual(g.positionAt(s,g.elapsed),{x:s.x,y:s.y,angle:s.angle});assert.equal(g.attack(old.x,old.y),false);assert.equal(g.attack(s.x,s.y),true);assert.equal(s.hp,4);hit(g,s,4);assert.equal(g.codexDelta.shifter.techniques,1);
 const h=arena(),t=add(h,'shifter');for(let i=0;i<32;i++){const a=i*Math.PI/16;add(h,'star',450+Math.cos(a)*40,270+Math.sin(a)*40);}advance(h,1.31);assert.equal(t.x,450);assert.equal(t.y,270);assert.equal(h.advancedCounts.shifterBlocked,1);
});
test('M11 Lens actual native contact makes2 sectors +/-35deg120px damage1, same wave once cap2',()=>{
 const g=arena(),lens=add(g,'prismLens');const w=wave(g,lens);advance(g,.1);const sectors=g.waves.filter(w=>w.sourceKind==='prismRefraction');assert.equal(sectors.length,2);assert.ok(sectors.every(w=>w.damage===1&&w.maxRadius===120&&!w.cause.nativeWave));assert.ok(Math.abs(sectors[0].sector.angle+35*Math.PI/180)<1e-9);assert.ok(Math.abs(sectors[1].sector.angle-35*Math.PI/180)<1e-9);advance(g,.2);assert.equal(g.advancedCounts.lensSector,2);wave(g,lens);advance(g,.1);wave(g,lens);advance(g,.1);assert.equal(lens.lensWaves.size,2);assert.equal(g.advancedCounts.lensSector,4);
});
test('M11 formal Lens main refraction alone enables Prismatic Cascade; sector alone cannot',()=>{
 const g=arena({levels:{prismaticCascade:1},signatureLoadout:['prismaticCascade']}),lens=add(g,'prismLens',350),target=add(g,'triangle',440);target.hp=1;const p=main(g,270,270);advance(g,.3);assert.equal(p.reflectionKind,'prism');assert.equal(target.destroyed,true);assert.ok(g.expansionExecuted.prismaticCascade>=1);
 const h=arena({levels:{prismaticCascade:1},signatureLoadout:['prismaticCascade']}),t=add(h,'triangle',450);t.hp=1;h.area({x:400,y:270},100,1,{source:'prismRefraction',originShapeId:1,chainId:h.newChain(),depth:0,sectorIndex:0},'#fff',null,{angle:0,halfAngle:.2});advance(h,.2);assert.equal(t.destroyed,true);assert.equal(h.expansionExecuted.prismaticCascade||0,0);
});
test('M11 polarized once per pair/main only, resonant sameChain distinct2waves, timeLocked guard once/cycle, fragmented budget',()=>{
 const g=arena(),a=add(g,'square',400),b=add(g,'square',490);a.secondaryTrait=b.secondaryTrait='polarized';const p=main(g,350,270);polarTick(g);const angle=p.angle;assert.ok(Math.abs(angle)>0);polarTick(g);assert.equal(p.angle,angle);p.small=true;polarTick(g);assert.equal(p.angle,angle);
 const h=arena(),s=add(h,'star');s.secondaryTrait='resonant';const chain=h.newChain();wave(h,s,'square',chain);advance(h,.1);wave(h,s,'square',h.newChain());advance(h,.1);assert.equal(h.advancedCounts.resonant||0,0);wave(h,s,'square',chain);advance(h,.12);assert.equal(h.advancedCounts.resonant,1);
 const t=arena(),r=add(t,'star');r.secondaryTrait='timeLocked';r.phaseOffset=1.1;hit(t,r,1);assert.equal(r.hp,9);hit(t,r,1);assert.equal(r.hp,8);
 const f=arena(),v=add(f,'square');v.secondaryTrait='fragmented';hit(f,v,99);advance(f,.04);assert.equal(f.advancedCounts.fragmented,2);assert.ok(f.shards.every(p=>p.small&&p.damage===1&&p.range===65));
});
test('M11 traits total14.5% independent lottery, incompatibility falls back none, next-spawn toggle only',()=>{
 const g=arena();g.initializing=false;
 for(const[id,d]of Object.entries(ADVANCED_TRAITS)){const eligible=add(g,'square');let seen=false;for(let i=0;i<10000;i++){eligible.secondaryTrait=rollTrait(g,eligible);seen||=eligible.secondaryTrait===id;}assert.ok(seen);for(const type of d.exclude){const s=add(g,type);for(let i=0;i<2000;i++)assert.notEqual(rollTrait(g,s),id);}}
 const s=add(g,'triangle');s.secondaryTrait='polarized';g.options.modifiers=false;assert.equal(rollTrait(g,s),null);assert.equal(s.secondaryTrait,'polarized');
});
for(const id of CODEX_IDS)test(`M11 Codex stages I..IV and early technique order: ${id}`,()=>{
 const s=freshSave(),delta=Object.fromEntries(CODEX_IDS.map(id=>[id,{kills:0,techniques:0}])),snapshot={version:8,runId:'isolated',delta,elite:{},intro:[]};delta[id]={kills:0,techniques:3};applyCodex(s,snapshot);assert.equal(s.shapeCodex[id].stage,0);assert.equal(s.insightUnlocked.length,0);delta[id]={kills:1,techniques:0};applyCodex(s,snapshot);assert.equal(s.shapeCodex[id].stage,1);delta[id]={kills:(id==='ancient'?5:30)-1,techniques:0};applyCodex(s,snapshot);assert.equal(s.shapeCodex[id].stage,3);assert.deepEqual(s.insightUnlocked,[id]);delta[id]={kills:(id==='ancient'?20:150)-(id==='ancient'?5:30),techniques:0};applyCodex(s,snapshot);assert.equal(s.shapeCodex[id].stage,4);assert.equal(s.bank,0);assert.equal(s.catalystBalance,0);
});
for(const[id,d]of Object.entries(ELITES))test(`M11 Elite ${id}: exact gate, atomic safety, one/Run, primary +50Raw/+3Cat once`,()=>{
 const g=arena({insightUnlocked:CODEX_IDS.slice(0,d.insight),discoveryRank:d.rank});assert.deepEqual(eligibleElites(g),[]);g.highestTier=4;assert.ok(eligibleElites(g).includes(id));g.advancedInsight=d.insight-1;assert.ok(!eligibleElites(g).includes(id));g.advancedInsight=d.insight;
 const rows=tryElite(g,id);assert.ok(rows&&rows.length===d.types.length);const p=rows[0];assert.equal(p.maxHP,Math.ceil(C.shapes[p.type].hp*1.5));assert.equal(p.bonus,C.shapes[p.type].bonus+50);assert.equal(tryElite(g,id),null);advance(g,.16);const before=g.pendingCatalyst;hit(g,p,999);assert.equal(g.pendingCatalyst,before+3+(p.type==='ancient'?2:0));assert.equal(g.codexDelta[p.type].kills,0);hit(g,p,999);assert.equal(g.eliteDelta[id].kills,1);
 const h=arena({insightUnlocked:CODEX_IDS,discoveryRank:4});h.highestTier=4;for(let y=110;y<500;y+=50)for(let x=70;x<900;x+=50)add(h,'star',x,y);const n=h.shapes.length;assert.equal(tryElite(h,id),null);assert.equal(h.shapes.length,n);
});
test('M11 schema1..7 preservation, schema8 normalization, old pending no retrocredit, new pending once/refresh',()=>{
 for(let version=1;version<=7;version++){const source=freshSave();source.saveVersion=version;source.bank=777;source.catalystBalance=21;source.levels.crushPower=2;source.levels.extraTime=3;source.levels.weakpointScanner=2;source.relicOwned=['ricochetCoil'];source.relicEquipped=['ricochetCoil'];source.shapeCodex.triangle={kills:999,techniques:9,stage:4};const loaded=loadSave({getItem:()=>JSON.stringify(source)});assert.equal(loaded.bank,777);assert.equal(loaded.levels.extraTime,3);assert.equal(loaded.levels.crushPower,2);assert.equal(loaded.levels.weakpointScanner,version<7?0:2);assert.equal(loaded.shapeCodex.triangle.kills,0);assert.equal(loaded.saveVersion,C.saveVersion);}
 const save=freshSave();save.sandbox=true;const g=arena({runId:'codex-once',duration:.2});hit(g,add(g,'triangle'),3);advance(g,.3);assert.equal(stageSettlement(save,g),true);const pending=structuredClone(save.pendingSettlement);assert.equal(save.shapeCodex.triangle.kills,0);assert.equal(completeSettlement(save),true);assert.equal(save.shapeCodex.triangle.kills,1);const bank=save.bank;save.pendingSettlement=pending;assert.equal(completeSettlement(save),false);assert.equal(save.bank,bank);assert.equal(save.shapeCodex.triangle.kills,1);assert.equal(settle(freshSave(),g),false);
 const invalid={...freshSave(),bank:888,shapeCodex:{triangle:{kills:-2,techniques:'bad'},constructor:{kills:999}},codexPinnedIds:['triangle','triangle','unknown','square','star'],insightUnlocked:CODEX_IDS};const normalized=loadSave({getItem:()=>JSON.stringify(invalid)});assert.equal(normalized.bank,888);assert.equal(normalized.shapeCodex.triangle.kills,0);assert.deepEqual(normalized.insightUnlocked,[]);assert.deepEqual(normalized.codexPinnedIds,['triangle','square']);
});

function technique(id,yes){
 const g=arena();
 if(id==='triangle'){
  // Native main rays plus one purchased piercing level, no auxiliary attribution.
  const h=arena({levels:{piercingShard:1},signatureLoadout:['piercingShard']}),root=add(h,'triangle');
  for(let i=0;i<(yes?6:3);i++){const ray=i%3,a=ray*Math.PI*2/3,r=i<3?60:120,t=add(h,'square',450+Math.cos(a)*r,270+Math.sin(a)*r);t.hp=1;}
  hit(h,root,3);advance(h,.7);return h;
 }
 if(id==='square'){const root=add(g,'square');for(let i=0;i<(yes?3:2);i++){const a=i*Math.PI*2/3,t=add(g,'repairNode',450+Math.cos(a)*70,270+Math.sin(a)*70);t.hp=1;}hit(g,root,4);advance(g,.3);}
 if(id==='pentagon'){const h=arena({levels:{shardBloom:2,piercingShard:1},signatureLoadout:['piercingShard']}),root=add(h,'pentagon');root.modifier='charged';const angles=[-Math.PI/4,-Math.PI/12,Math.PI/12,Math.PI/4,-Math.PI/6];for(const a of angles.slice(0,yes?5:4)){const t=add(h,'parasiteLink',450+Math.cos(a)*100,270+Math.sin(a)*100);t.hp=1;}hit(h,root,5);advance(h,.6);return h;}
 if(id==='star'){const root=add(g,'star');for(let i=0;i<(yes?6:5);i++){const a=i*Math.PI/3;add(g,'star',450+Math.cos(a)*100,270+Math.sin(a)*100);}hit(g,root,9);advance(g,.3);}
 if(id==='hex'){add(g,'square',380);if(yes)add(g,'square',520);const root=add(g,'hex');hit(g,root,8);advance(g,.3);}
 if(id==='reactor'){const root=add(g,'reactor');hit(g,root,yes?12:7);advance(g,.2);}
 if(id==='ancient'){const root=add(g,'ancient');hit(g,root,yes?30:23);advance(g,.2);}
 if(id==='splitter'){const root=add(g,'splitter'),chain=hit(g,root,5);advance(g,.23);const children=g.alive.filter(s=>s.echo);assert.equal(children.length,2);for(const child of children)hit(g,child,1,'triangle',yes?chain:g.newChain());}
 if(id==='fuseBomb'){const a=add(g,'fuseBomb',350),b=add(g,'fuseBomb',450),chain=hit(g,a,6);hit(g,b,6,'triangle',yes?chain:g.newChain());advance(g,.12);}
 if(id==='conductor'){add(g,'square',390);if(yes)add(g,'square',510);const c=add(g,'conductor');hit(g,c,6);advance(g,.05);}
 if(id==='mirror'){const m=add(g,'mirror',350,250),t=add(g,'square',420,310);t.hp=1;main(g,250,250,0,{small:!yes});advance(g,.4);}
 if(id==='gravityWell'){const well=add(g,'gravityWell',350,340),t=add(g,'square',430,327);t.hp=1;if(!yes)well.destroyed=true;main(g,240,250);advance(g,.5);}
 if(id==='repairNode'){const t=add(g,'star',510);t.hp=5;const n=add(g,'repairNode');advance(g,yes?1.8:.9);hit(g,n,9);advance(g,.1);}
 if(id==='portalGate'){const pair=safePortalPair(g,[{x:250,y:270},{x:650,y:270}]);advance(g,.16);const t=add(g,'square',750,270);t.hp=1;if(!yes){delete pair[0].portalPartner;delete pair[1].portalPartner;}main(g,100,270);advance(g,.5);}
 if(id==='parasiteLink'){add(g,'square',390);if(yes)add(g,'square',510);const p=add(g,'parasiteLink');hit(g,p,1);advance(g,.05);}
 if(id==='phaseCrystal'){const p=add(g,'phaseCrystal');p.phaseOffset=yes?0:1;hit(g,p,9);}
 if(id==='chainBeacon'){const b=add(g,'chainBeacon'),chain=g.newChain();for(let i=0;i<(yes?9:8);i++)hit(g,add(g,'repairNode',100+i*70,430),9,'triangle',chain);hit(g,b,10,'triangle',chain);advance(g,.06);}
 if(id==='shifter'){const s=add(g,'shifter');advance(g,yes?1.31:2.4);hit(g,s,7);}
 if(id==='prismLens'){const l=add(g,'prismLens');for(const a of (yes?[-35,35]:[-35]))add(g,'square',450+Math.cos(a*Math.PI/180)*80,270+Math.sin(a*Math.PI/180)*80);wave(g,l);advance(g,.3);}
 return g;
}
for(const id of CODEX_IDS)test(`M11 actual technique predicate true AND false: ${id}`,()=>{const yes=technique(id,true),no=technique(id,false);assert.ok(yes.codexDelta[id].techniques>=1,JSON.stringify({id,delta:yes.codexDelta[id],events:yes.advancedCounts,ecology:yes.ecologyCounts}));assert.equal(no.codexDelta[id].techniques,0);assert.ok(yes.codexEvents.filter(e=>e.id===id).every(e=>e.sourceId!==undefined&&e.at<yes.duration));});

test('M11 skipped Shifter keeps a future boundary and no retroactive leap, phase extension is current cycle only',()=>{
 const g=arena(),s=add(g,'shifter');g.skipAhead(1.5);assert.equal(g.advancedCounts.shifterLeap||0,0);assert.ok(s.nextLeapAt>g.elapsed);const p=main(g,350,270);advance(g,.15);assert.ok(s.hp<7);advance(g,1.0);assert.ok(g.advancedCounts.shifterLeap>=1);
 const h=arena({levels:{phaseDisruptor:2}}),crystal=add(h,'phaseCrystal');crystal.phaseOffset=.1;hit(h,crystal,1);assert.equal(phaseVulnerable(h,crystal,.9),true);assert.equal(phaseVulnerable(h,crystal,2.3),false);
});
test('M11 excluded fixture and Echo never grant normal Codex kills or live collection; old pending stays old',()=>{
 const g=arena({duration:.3}),s=g.addShape('reactor',400,270,0,false,0,'normal',{fixture:true});s.secondaryTrait=null;hit(g,s,12);advance(g,.2);assert.equal(g.codexDelta.reactor.kills,0);assert.equal(g.codexDelta.reactor.techniques,0);
 const echo=g.addShape('triangle',650,270,0,false,0,'normal',{echo:true});hit(g,echo,1);assert.equal(g.codexDelta.triangle.kills,0);advance(g,.2);const live=freshSave();assert.equal(stageSettlement(live,g),false);const mem={setItem(){throw Error('sandbox tried to write');}};assert.equal(writeSave(mem,{...freshSave(),sandbox:true}),false);
 const save=freshSave();save.sandbox=true;assert.equal(stageSettlement(save,g),true);delete save.pendingSettlement.codexSnapshot;assert.equal(completeSettlement(save),true);assert.equal(Object.values(save.shapeCodex).reduce((n,r)=>n+r.kills,0),0);
});

test('M11 portal Momentum+Calibration composes on actual passage once, pending schema8 survives reload once',()=>{
 const g=arena({levels:{portalMomentum:2,portalCalibration:1},signatureLoadout:['portalCalibration'],duration:1}),pair=safePortalPair(g,[{x:250,y:270},{x:650,y:270}]);advance(g,.16);const high=add(g,'star',780,320),low=add(g,'square',750,270),p=main(g,100,270);advance(g,.4);assert.equal(p.portalPassed,pair[0].id);assert.equal(p.range,500);assert.ok(p.angle>0);assert.ok(high.hp<9);assert.equal(low.hp,4);assert.equal(g.expansionExecuted.portalMomentum,1);assert.equal(g.expansionExecuted.portalCalibration,1);
 advance(g,1);const save=freshSave();save.sandbox=true;assert.equal(stageSettlement(save,g),true);save.sandbox=false;const raw=JSON.stringify(save),loaded=loadSave({getItem:()=>raw});assert.ok(loaded.pendingSettlement);assert.equal(completeSettlement(loaded),true);const bank=loaded.bank,codex=structuredClone(loaded.shapeCodex);assert.equal(completeSettlement(loaded),false);assert.equal(loaded.bank,bank);assert.deepEqual(loaded.shapeCodex,codex);
});
test('M11 all19 insights unique, no monetary Codex reward and malformed delta cannot corrupt bank',()=>{
 const save=freshSave(),delta=Object.fromEntries(CODEX_IDS.map(id=>[id,{kills:150,techniques:3}])),snapshot={version:8,runId:'all',delta,elite:{},intro:[]};applyCodex(save,snapshot);applyCodex(save,snapshot);assert.equal(new Set(save.insightUnlocked).size,19);assert.ok(Object.values(save.shapeCodex).every(r=>r.stage===4));assert.equal(save.bank,0);assert.equal(save.catalystBalance,0);const original=structuredClone(save.shapeCodex);snapshot.delta.triangle.kills=-1;applyCodex(save,snapshot);assert.deepEqual(save.shapeCodex,original);
});
test('M11 actual auxiliary recursion and scheduled/depth limits cannot manufacture feats or rewards',()=>{
 const g=arena(),s=add(g,'parasiteLink');add(g,'square',390);add(g,'square',510);const chain=g.newChain();g.chains.get(chain).events=C.caps.events;hit(g,s,1,'direct',chain);advance(g,.2);assert.equal(g.codexDelta.parasiteLink.techniques,0);assert.equal(g.advancedCounts.parasiteDelivered||0,0);
 const h=arena({duration:.02}),lens=add(h,'prismLens');wave(h,lens);advance(h,.1);assert.equal(h.advancedCounts.lensSector||0,0);assert.equal(h.state,'RESULT');assert.equal(h.codexDelta.prismLens.techniques,0);
});

test('M11 copied damage never inherits main-shard Hollow amplification; Resonant propagates within once/target budget',()=>{
 const g=arena(),a=add(g,'square',390),b=add(g,'square',510),s=add(g,'parasiteLink');a.secondaryTrait=b.secondaryTrait='hollow';hit(g,s,3,'triangle',g.newChain(),{small:false,id:123});advance(g,.05);assert.equal(a.hp,3);assert.equal(b.hp,3);assert.equal(g.advancedCounts.parasiteDelivered,2);
 const h=arena(),t=add(h,'star');t.secondaryTrait='resonant';const chain=h.newChain();wave(h,t,'square',chain);advance(h,.1);wave(h,t,'traitResonant',chain,{nativeWave:false});advance(h,.15);assert.equal(h.advancedCounts.resonant,1);advance(h,.2);assert.equal(h.advancedCounts.resonant,1);
});

test('M11 fully guarded Phase direct attack cannot consume Reinforced armor on zero damage',()=>{
 const g=arena(),s=add(g,'phaseCrystal');s.secondaryTrait='reinforced';s.phaseOffset=1;
 hit(g,s,9);assert.equal(s.hp,9);assert.equal(s.armorUsed,undefined);
 s.phaseOffset=0;hit(g,s,1);assert.equal(s.hp,9);assert.equal(s.armorUsed,true);
 hit(g,s,1);assert.equal(s.hp,8);
});
