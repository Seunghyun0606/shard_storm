import { execFileSync } from 'node:child_process';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import assert from 'node:assert/strict';
const dir=mkdtempSync(join(tmpdir(),'shard-m5-performance-'));
try{
 execFileSync('git',['archive','--format=zip',`--output=${join(dir,'source.zip')}`,'f90d7de','*.js','package.json']);
 execFileSync('python',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',join(dir,'source.zip'),dir]);
 const versions=[];for(const root of [dir,resolve('.')]){const {Game}=await import(pathToFileURL(join(root,'game.js'))),{CONFIG:C}=await import(pathToFileURL(join(root,'config.js'))),{chooseTarget}=await import(pathToFileURL(join(root,'tests/simulation.js')));versions.push({Game,C,chooseTarget});}
 const records=[];for(const seed of [31415,1,7,42,99])for(let repetition=0;repetition<3;repetition++)for(const [version,{Game,C,chooseTarget}]of versions.entries()){
  const g=new Game({seed,duration:20,sandbox:true}),times=[];let attackAt=.2;g.attack(480,335);
  while(g.state==='PLAYING'){if(g.elapsed>=attackAt-1e-9){const s=chooseTarget(g);if(s)g.attack(s.x,s.y);attackAt+=g.stats.attackInterval;}const t=performance.now();g.update(C.step);times.push(performance.now()-t);}
  times.sort((a,b)=>a-b);records.push({version:version?'M5_M6':'v09',seed,repetition,physicsTickP95:times[Math.floor(times.length*.95)],kills:g.totalDestroyed,raw:g.runEarned});
 }
 for(const seed of [31415,1,7,42,99]){const a=records.find(r=>r.seed===seed&&r.version==='v09'),b=records.find(r=>r.seed===seed&&r.version==='M5_M6');assert.equal(a.kills,b.kills);assert.equal(a.raw,b.raw);}
 writeFileSync('artifacts/m5-m6-performance.json',JSON.stringify({baseline:'f90d7de',workload:'rank0 / all levels0 / 20s / density-hp / same seeds / alternating3 repeats; g.update only, selection excluded',records},null,2));console.log('Same-workload performance and combat regression PASS');
}finally{assert.ok(dir.startsWith(join(tmpdir(),'shard-m5-performance-')));rmSync(dir,{recursive:true,force:true});}
