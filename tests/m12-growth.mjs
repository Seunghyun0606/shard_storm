import {advancedGrowth} from './m11-simulation.js';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,existsSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {fork} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const hash=createHash('sha256');for(const p of readdirSync('.').filter(p=>p.endsWith('.js')).concat(['tests/m11-simulation.js','tests/content-simulation.js','tests/m12-growth.mjs']).sort())hash.update(p+'\0'+readFileSync(p,'utf8').replaceAll('\r\n','\n')+'\0');const signature=hash.digest('hex');
if(process.argv[2]==='--worker'){
 const spec=JSON.parse(process.argv[3]);if(spec.signature!==signature)throw Error('Growth source changed');
 const old=existsSync(spec.file)?JSON.parse(gunzipSync(readFileSync(spec.file))):null;
 advancedGrowth(spec,old,data=>writeFileSync(spec.file,gzipSync(JSON.stringify(data))));process.exit(0);
}
mkdirSync('artifacts/m12-approved-growth',{recursive:true});const count=Number(process.env.M12_GROWTH_RUNS||300),specs=[];
for(const seed of [31415,1,7,42,99])for(const strategy of ['Crusher','Cascade','Reactor']){
 const key=`${signature.slice(0,12)}-${seed}-${strategy}-${count}`;specs.push({key,signature,seed,strategy,profile:'Fresh',time:'ExtraTime',mode:'Normal',feature:'M11',milestone12:true,count,file:`artifacts/m12-approved-growth/${key}.json.gz`});
}
let index=0;await Promise.all(Array.from({length:Math.min(6,specs.length)},async()=>{while(index<specs.length){const s=specs[index++];await new Promise((resolve,reject)=>{const child=fork(fileURLToPath(import.meta.url),['--worker',JSON.stringify(s)],{stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Growth worker '+code)));});console.log('M12 growth '+s.key);}}));
const paths=specs.map(s=>JSON.parse(gunzipSync(readFileSync(s.file)))),median=xs=>xs.sort((a,b)=>a-b)[Math.floor(xs.length/2)],summary=[];
for(const strategy of ['Crusher','Cascade','Reactor'])for(const run of [1,5,20,50,100,200,300].filter(n=>n<=count)){
 const rows=paths.filter(p=>p.spec.strategy===strategy).map(p=>p.rows[run-1]);summary.push({strategy,run,...Object.fromEntries(['levels','bank','catalyst','kills','chain','insight'].map(k=>[k,median(rows.map(r=>r[k]))]))});
}
const all=paths.flatMap(p=>p.rows),result={passed:true,signature,actualRuns:all.length,paths:specs.map(s=>s.file),summary,eligibleRuns:all.filter(r=>r.eliteEligible&&!r.eliteIntro).length,naturalEliteSpawns:all.filter(r=>r.eliteNatural).length,discardedPhysicalSeconds:all.reduce((n,r)=>n+r.physicsDebt.discardedPhysicalSeconds,0),method:'5seeds x3builds Fresh actual affordable purchases; Extra Time20..32s; approved A; isolated save; auto input is not human fun.'};
writeFileSync('artifacts/m12-approved-growth-results.json',JSON.stringify(result,null,2));console.log('M12 approved growth PASS '+result.actualRuns);
