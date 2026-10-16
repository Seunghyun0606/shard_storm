import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,readdirSync} from 'node:fs';
import {execFileSync,fork} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {freshSave} from '../storage.js';
import {buyUpgrade} from '../progression.js';
import {skillState} from '../skill-tree.js';
import {BUILD_PRESETS,EVOLUTION_FAMILIES} from '../expansion-defs.js';
import {CODEX_IDS} from '../codex.js';
import {chooseTarget} from './simulation.js';
const h=createHash('sha256');for(const p of readdirSync('.').filter(p=>p.endsWith('.js')).concat(['tests/m13-benchmark.mjs']).sort())h.update(p+'\0'+readFileSync(p,'utf8').replaceAll('\r\n','\n')+'\0');const signature=h.digest('hex');
function fixture(build,total){const s=freshSave();s.bank=1e9;s.catalystBalance=1e9;s.discoveryRank=4;
 const priority={Crusher:['crushPower','crushSpeed','impactPulse','precisionFracture'],Cascade:['shardPower','shardRange','shardBloom','ricochetPlus','fragmentRelay'],Reactor:['chainAmplifier','echoCatalyst','yieldStabilizer','resonanceLayer']}[build];
 for(let i=0;i<total;i++){const id=[...priority,...Object.keys(C.upgrades)].find(id=>skillState(id,s.levels,s.bank,s).canBuy);assert.ok(id);assert.equal(buyUpgrade(s,id,'RESULT'),true);}return s.levels;
}
function play(Type,args){const g=new Type({...args,sandbox:true});let next=.2;const paths=new Map(),original=g.trackCombo.bind(g);g.trackCombo=(id,pos)=>{if(!pos.echo&&!pos.fixture){let r=paths.get(id);if(!r){r={x:pos.x,y:pos.y,distance:0};paths.set(id,r);}r.distance=Math.max(r.distance,Math.hypot(pos.x-r.x,pos.y-r.y));}original(id,pos);};g.attack(480,335);while(g.state==='PLAYING'){if(g.elapsed>=next-1e-9){const s=chooseTarget(g);if(s)g.attack(s.x,s.y);next+=g.stats.attackInterval;}g.update(C.step);}const r=g.record();r.measuredDistance=Math.max(0,...[...paths.values()].map(r=>r.distance));assert.equal(r.physicsDebt.discardedPhysicalSeconds,0);assert.equal(r.physicsChecks.lateWaveContacts,0);assert.ok(r.physicsChecks.maxProjectileContactError<.002&&r.physicsChecks.maxWaveContactError<.002);assert.ok(r.peakShards<=150&&r.peakWaves<=64&&r.peakScheduled<=1024);return r;}
const fp=r=>({kills:r.totalDestroyed,raw:r.rawEarned,photon:r.processedPhoton,catalyst:r.pendingCatalyst,stats:r.typeStats,codex:r.codexDelta,elite:r.eliteDelta,meta:r.metaCounters,causal:r.causalLog.map(e=>[e.eventType,e.sourceShapeId,e.targetShapeId,e.chainId])});
if(process.argv[2]==='--worker'){
 const seed=Number(process.argv[3]),directory=process.argv[4],{Game:OldGame}=await import(pathToFileURL(join(directory,'game.js'))),rows=[];
 for(const build of ['Crusher','Cascade','Reactor'])for(const total of [0,15,40,100])for(const duration of [20,32]){
  const levels=fixture(build,total),rank=total===0?0:total===15?1:total===40?2:4,preset=BUILD_PRESETS[build],owned=Object.fromEntries(Object.entries(EVOLUTION_FAMILIES).map(([id,d])=>[id,Object.keys(d.forms)]));
  const args={seed,levels,discoveryRank:rank,duration,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,elitePolicy:'M12_run20_pity6',signatureLoadout:preset.signatures,evolutionOwned:total===100?owned:{},evolutionActive:total===100?preset.evolutions:[],insightUnlocked:total===100?CODEX_IDS:[]};
  const old=play(OldGame,args),off=play(Game,{...args,destructionEnabled:false}),on=play(Game,{...args,destructionEnabled:true}),fxOff=play(Game,{...args,destructionEnabled:true,options:{combatFXEnabled:false,damageVFX:false,comboFeedback:false,reducedMotionEnabled:true}});
  assert.deepEqual(fp(off),fp(old),'M12 shipped OFF parity');assert.deepEqual(fp(on),fp(fxOff),'M13 FX neutrality');assert.deepEqual(on.destruction,fxOff.destruction);assert.ok(on.destruction.triggers<=3&&on.destruction.spawned<=18);
  rows.push({seed,build,total,rank,duration,old:{kills:old.totalDestroyed,raw:old.rawEarned,chain:old.bestChain,distance:old.measuredDistance},on:{kills:on.totalDestroyed,raw:on.rawEarned,photon:on.processedPhoton,chain:on.bestChain,distance:on.destruction.maxDistance,clusters:on.destruction.maxClusters,triggers:on.destruction.triggers,spawned:on.destruction.spawned,responseKills:on.destruction.kills,events:on.destruction.events,physicsDebt:on.physicsDebt,caps:on.capCounts,mechanics:{...on.ecologyCounts,...on.advancedCounts}},offParity:true,fxParity:true});
 }
 writeFileSync(`artifacts/m13-benchmark/${signature.slice(0,12)}-${seed}.json`,JSON.stringify({signature,rows},null,2));process.exit(0);
}
const dir=mkdtempSync(join(tmpdir(),'shard-m13-m12-control-')),zip=join(dir,'source.zip');execFileSync('git',['archive','--format=zip','--output='+zip,'1d75822','*.js','package.json']);execFileSync('python',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,dir]);mkdirSync('artifacts/m13-benchmark',{recursive:true});
const seeds=[31415,1,7,42,99];await Promise.all(seeds.map(seed=>new Promise((resolve,reject)=>{const child=fork(fileURLToPath(import.meta.url),['--worker',String(seed),dir],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`Seed${seed} exit${code}`)));})));
const rows=seeds.flatMap(seed=>JSON.parse(readFileSync(`artifacts/m13-benchmark/${signature.slice(0,12)}-${seed}.json`,'utf8')).rows);writeFileSync('artifacts/m13-benchmark-results.json',JSON.stringify({passed:true,signature,baseline:'1d75822',actualCombatRuns:rows.length*4,conditions:rows.length,rows,method:'5seed x3build x0/15/40/100 real-prerequisite fixture levels x20/32; M12 source/OFF/ON/FXoff; no human enjoyment inference'},null,2));console.log('M13 benchmark PASS '+rows.length*4+' actual Runs');
