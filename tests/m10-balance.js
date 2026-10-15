import {readFileSync,writeFileSync,renameSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fork} from 'node:child_process';
import {availableParallelism} from 'node:os';
import {fileURLToPath} from 'node:url';
import {resolve,dirname,relative} from 'node:path';
import {expandedGrowth} from './m10-simulation.js';

const sources=new Set();
function collect(file) {
 file=relative('.',resolve(file)).replaceAll('\\','/');if(sources.has(file))return;
 sources.add(file);const text=readFileSync(file,'utf8');
 for(const match of text.matchAll(/from\s*['"]([^'"]+)['"]/g))if(match[1].startsWith('.'))collect(resolve(dirname(file),match[1]));
}
collect('tests/m10-balance.js');
function signature(){const hash=createHash('sha256');for(const file of [...sources].sort())hash.update(file+'\0'+readFileSync(file,'utf8').replaceAll('\r\n','\n')+'\0');return hash.digest('hex');}
const atomic=(path,data)=>{const temp=`${path}.tmp-${process.pid}`;writeFileSync(temp,gzipSync(JSON.stringify(data),{level:1}));renameSync(temp,path);};
if(process.argv[2]==='--worker') {
 const spec=JSON.parse(process.argv[3]);if(signature()!==spec.signature)throw Error('M10 source changed during benchmark');
 const old=existsSync(spec.file)?JSON.parse(gunzipSync(readFileSync(spec.file))):null;
 if(old&&(old.spec.signature!==spec.signature||old.rows.length>spec.count))throw Error('Invalid M10 checkpoint');
 expandedGrowth(spec,old,data=>atomic(spec.file,data));process.exit(0);
}
const hash=signature(),directory='artifacts/m10-growth',count=Number(process.env.M10_RUNS||300);mkdirSync(directory,{recursive:true});
if(!Number.isInteger(count)||count<1)throw Error('M10_RUNS must be a positive integer');
const specs=[];
for(const seed of [31415,1,7,42,99])for(const strategy of ['Crusher','Cascade','Reactor'])for(const profile of ['Fresh','LegacyMax'])for(const time of ['Fixed20','ExtraTime'])for(const feature of ['M9','PermOnly','Signature3','Evolution2']) {
 const key=[hash.slice(0,12),seed,strategy,profile,time,feature,count].join('-');specs.push({signature:hash,key,file:`${directory}/${key}.json.gz`,seed,strategy,profile,time,feature,count});
}
const pending=specs.filter(s=>!existsSync(s.file)||JSON.parse(gunzipSync(readFileSync(s.file))).rows.length<s.count);
let cursor=0,done=0;
const workers=Math.max(1,Math.min(Number(process.env.CONTENT_WORKERS||6),availableParallelism()));
await Promise.all(Array.from({length:workers},async()=>{
 while(cursor<pending.length){const spec=pending[cursor++];await new Promise((resolve,reject)=>{const child=fork(fileURLToPath(import.meta.url),['--worker',JSON.stringify(spec)],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`${spec.key}: exit${code}`)));});console.log(`M10 paths ${++done}/${pending.length}: ${spec.key}`);}
}));
const paths=specs.map(s=>JSON.parse(gunzipSync(readFileSync(s.file)))),checkpoints=[1,5,10,20,30,50,100,200,300],median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)],summary=[];
for(const strategy of ['Crusher','Cascade','Reactor'])for(const profile of ['Fresh','LegacyMax'])for(const time of ['Fixed20','ExtraTime'])for(const feature of ['M9','PermOnly','Signature3','Evolution2']) {
 const set=paths.filter(p=>p.spec.strategy===strategy&&p.spec.profile===profile&&p.spec.time===time&&p.spec.feature===feature);
 summary.push({strategy,profile,time,feature,checkpoints:checkpoints.filter(n=>n<=count).map(run=>({run,...Object.fromEntries(['levels','remainingNodes','rank','bank','catalyst','kills','photon','chain','blank','calibrationPhoton'].map(key=>[key,median(set.map(p=>p.rows[run-1][key]))]))}))});
}
const activations={},caps={};let lateContacts=0,maxProjectileError=0,maxWaveError=0;
for(const path of paths)for(const row of path.rows) {
 for(const[id,n]of Object.entries(row.expansionExecuted))activations[id]=(activations[id]||0)+n;
 for(const[id,n]of Object.entries(row.caps))caps[id]=(caps[id]||0)+n;
 lateContacts+=row.physics.lateWaveContacts;maxProjectileError=Math.max(maxProjectileError,row.physics.maxProjectileContactError);maxWaveError=Math.max(maxWaveError,row.physics.maxWaveContactError);
}
const result={passed:true,signature:hash,sources:[...sources].sort(),actualRuns:paths.reduce((n,p)=>n+p.rows.length,0),sourceFiles:specs.map(s=>s.file),summary,activations,caps,lateContacts,maxProjectileError,maxWaveError,node:process.version,workers,
 method:'5seeds×3builds×Fresh/Legacy(old19MAX)×20/ExtraTime×M9/PermOnly/Signature3/Evolution2. Actual battle+settlement+affordable purchase; distinct seed+Run×7919. Signatures limited3, Evolution2 with Signature3. All49 owned is not injected into Fresh. Experiment history compacts per-event arrays only after counters recorded. No real storage. Auto-aim is not human enjoyment.'};
writeFileSync('artifacts/m10-balance-results.json',JSON.stringify(result,null,2));console.log(`M10 benchmark PASS: ${result.actualRuns} actual Runs/${specs.length} paths`);
