import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fork} from 'node:child_process';
import {availableParallelism} from 'node:os';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,relative} from 'node:path';
import {advancedGrowth} from './m11-simulation.js';

const sources=new Set();
function collect(file) {
 file=relative('.',resolve(file)).replaceAll('\\','/');if(sources.has(file))return;
 sources.add(file);const text=readFileSync(file,'utf8');
 for(const match of text.matchAll(/from\s*['"]([^'"]+)['"]/g))if(match[1].startsWith('.'))collect(resolve(dirname(file),match[1]));
}
collect('tests/m11-benchmark.js');
function signature(){const hash=createHash('sha256');for(const file of [...sources].sort())hash.update(file+'\0'+readFileSync(file,'utf8').replaceAll('\r\n','\n')+'\0');return hash.digest('hex');}
const atomic=(path,data)=>{const temp=`${path}.tmp-${process.pid}`;writeFileSync(temp,gzipSync(JSON.stringify(data),{level:1}));renameSync(temp,path);};
if(process.argv[2]==='--worker') {
 const spec=JSON.parse(process.argv[3]);if(signature()!==spec.signature)throw Error('M11 source changed during benchmark');
 const old=existsSync(spec.file)?JSON.parse(gunzipSync(readFileSync(spec.file))):null;
 if(old&&(old.spec.signature!==spec.signature||old.rows.length>spec.count))throw Error('Invalid M11 checkpoint');
 advancedGrowth(spec,old,data=>atomic(spec.file,data));process.exit(0);
}
const hash=signature(),directory='artifacts/m11-growth',count=Number(process.env.M11_RUNS||300);mkdirSync(directory,{recursive:true});
if(!Number.isInteger(count)||count<1)throw Error('M11_RUNS must be a positive integer');
const specs=[];
for(const seed of [31415,1,7,42,99])for(const strategy of ['Crusher','Cascade','Reactor'])for(const profile of ['Fresh'])for(const time of ['ExtraTime'])for(const mode of ['Normal','Adaptive','Anomaly'])for(const feature of ['M8','M9','M10','M11']) {
 const key=[hash.slice(0,12),seed,strategy,profile,time,mode,feature,count].join('-');specs.push({signature:hash,key,file:`${directory}/${key}.json.gz`,seed,strategy,profile,time,mode,feature,count});
}
const pending=specs.filter(s=>!existsSync(s.file)||JSON.parse(gunzipSync(readFileSync(s.file))).rows.length<s.count);
let cursor=0,done=0;
const workers=Math.max(1,Math.min(Number(process.env.CONTENT_WORKERS||6),availableParallelism()));
await Promise.all(Array.from({length:workers},async()=>{
 while(cursor<pending.length){const spec=pending[cursor++];await new Promise((resolve,reject)=>{const child=fork(fileURLToPath(import.meta.url),['--worker',JSON.stringify(spec)],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`${spec.key}: exit${code}`)));});console.log(`M11 paths ${++done}/${pending.length}: ${spec.key}`);}
}));
const paths=specs.map(s=>JSON.parse(gunzipSync(readFileSync(s.file)))),checkpoints=[1,5,10,20,30,50,100,200,300],median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)],summary=[];
for(const strategy of ['Crusher','Cascade','Reactor'])for(const profile of ['Fresh'])for(const time of ['ExtraTime'])for(const mode of ['Normal','Adaptive','Anomaly'])for(const feature of ['M8','M9','M10','M11']) {
 const set=paths.filter(p=>p.spec.strategy===strategy&&p.spec.profile===profile&&p.spec.time===time&&p.spec.mode===mode&&p.spec.feature===feature);
 summary.push({strategy,profile,time,mode,feature,checkpoints:checkpoints.filter(n=>n<=count).map(run=>({run,uniqueEncounters:median(set.map(p=>new Set(p.rows.slice(0,run).flatMap(r=>r.encounters)).size)),codexStages:[1,2,3,4].map(stage=>median(set.map(p=>Object.values(p.rows[run-1].codex).filter(r=>r.stage>=stage).length))),eliteSpawns:median(set.map(p=>p.rows.slice(0,run).reduce((n,r)=>n+Object.values(r.elite).reduce((n,e)=>n+e.spawned,0),0))),...Object.fromEntries(['levels','remainingNodes','rank','bank','catalyst','kills','photon','chain','blank','calibrationPhoton','insight'].map(key=>[key,median(set.map(p=>p.rows[run-1][key]))]))}))});
}
const activations={},caps={},advancedActivations={},eliteTotals={};let lateContacts=0,maxProjectileError=0,maxWaveError=0;
for(const path of paths)for(const row of path.rows) {
 for(const[id,n]of Object.entries(row.advancedCounts))advancedActivations[id]=(advancedActivations[id]||0)+n;
 for(const[id,entry]of Object.entries(row.elite)){const total=eliteTotals[id]||={attempts:0,spawned:0,kills:0};for(const k of ['attempts','spawned','kills'])total[k]+=entry[k];}
 for(const[id,n]of Object.entries(row.expansionExecuted))activations[id]=(activations[id]||0)+n;
 for(const[id,n]of Object.entries(row.caps))caps[id]=(caps[id]||0)+n;
 lateContacts+=row.physics.lateWaveContacts;maxProjectileError=Math.max(maxProjectileError,row.physics.maxProjectileContactError);maxWaveError=Math.max(maxWaveError,row.physics.maxWaveContactError);
}
const result={passed:true,signature:hash,sources:[...sources].sort(),actualRuns:paths.reduce((n,p)=>n+p.rows.length,0),sourceFiles:specs.map(s=>s.file),summary,activations,advancedActivations,eliteTotals,caps,lateContacts,maxProjectileError,maxWaveError,node:process.version,workers,
 method:'5seeds x3builds xNormal/Adaptive/Anomaly xM8/M9/M10/M11;300 actual Runs per path, same seeds+input and real affordable growth. Fresh profiles, 20-32s based on purchased Extra Time. M10/11 activate up to3 owned Signatures+2 owned Evolutions. Codex/Elite credited only to isolated sandbox save. No user storage. Auto-input is not human enjoyment.'};
writeFileSync('artifacts/m11-balance-results.json',JSON.stringify(result,null,2));console.log(`M11 benchmark PASS: ${result.actualRuns} actual Runs/${specs.length} paths`);
