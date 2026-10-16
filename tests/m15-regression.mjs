import assert from 'node:assert/strict';
import {writeFileSync,mkdtempSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';import {join} from 'node:path';import {pathToFileURL} from 'node:url';
import {Game} from '../game.js';import {contentBattle} from './content-simulation.js';import {readyWorld,playWorld,maximum} from './m14-helpers.js';import {chooseTarget} from './simulation.js';import {CONFIG as C} from '../config.js';
const dir=mkdtempSync(join(tmpdir(),'shard-m15-control-')),zip=join(dir,'src.zip');execFileSync('git',['archive','--format=zip','--output='+zip,'5b37a3d','*.js','package.json']);execFileSync('python',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,dir]);const {Game:Old}=await import(pathToFileURL(join(dir,'game.js')));
const fp=r=>({kills:r.totalDestroyed,raw:r.rawEarned,photon:r.processedPhoton,cat:r.pendingCatalyst,codex:r.codexDelta,stats:r.typeStats,causal:r.causalLog,destruction:r.destruction});
function play(Type,args){const g=new Type(args);let next=.2;g.attack(480,335);while(g.state==='PLAYING'){if(g.elapsed>=next-1e-9){const s=chooseTarget(g);if(s)g.attack(s.x,s.y);next+=g.stats.attackInterval;}g.update(C.step);}return g.record();}
let runs=0;for(const seed of [31415,1,7,42,99])for(const duration of [20,32]){const args={seed,duration,levels:maximum,discoveryRank:4,destructionEnabled:true,advancedEnabled:true,ecologyEnabled:true,skillExpansionEnabled:true,elitePolicy:'M12_run20_pity6',runId:'same'};assert.deepEqual(fp(play(Game,args)),fp(play(Old,args)));runs+=2;}
for(const id of ['w1','w2','w3','w4','w5']){const a=playWorld(readyWorld(id),id),b=playWorld(readyWorld(id),id,{options:{combatFXEnabled:false,damageVFX:false,comboFeedback:false,reducedMotionEnabled:true}});assert.deepEqual(fp(a.record()),fp(b.record()));assert.deepEqual(a.record().worldRun,b.record().worldRun);runs+=2;}
writeFileSync('artifacts/m15-regression-results.json',JSON.stringify({passed:true,actualRuns:runs,baseline:'5b37a3d',offParity:true,worldBossFXNeutral:true},null,2));console.log('M15 regression PASS '+runs+' actual Runs');
