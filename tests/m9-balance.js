import{readFileSync,writeFileSync,existsSync,mkdirSync}from'node:fs';import{createHash}from'node:crypto';
import{gzipSync,gunzipSync}from'node:zlib';import{fork}from'node:child_process';import{availableParallelism}from'node:os';import{fileURLToPath}from'node:url';
import{contentGrowth}from'./content-simulation.js';
const sources=['game.js','config.js','content.js','ecology.js','ecology-defs.js','presentation.js','storage.js','progression.js','effects.js','entities.js','motion.js','skill-tree.js','refinery.js','ore.js','discovery.js','relics.js','contracts.js','anomalies.js','run-metrics.js','settlement-validation.js','combo.js','visuals.js','experiments.js','economy.js','tests/simulation.js','tests/m7-m8-simulation.js','tests/content-simulation.js','tests/m9-balance.js'];
const signature=()=>{const h=createHash('sha256');for(const f of sources)h.update(f+'\0'+readFileSync(f,'utf8').replaceAll('\r\n','\n')+'\0');return h.digest('hex');};
if(process.argv[2]==='--worker'){
 const spec=JSON.parse(process.argv[3]);if(signature()!==spec.signature)throw Error('Source changed during benchmark');
 const path=spec.file,old=existsSync(path)?JSON.parse(gunzipSync(readFileSync(path))):null;
 contentGrowth(spec,old,d=>writeFileSync(path,gzipSync(JSON.stringify(d))));process.exit(0);
}
const hash=signature(),directory='artifacts/m9-growth';mkdirSync(directory,{recursive:true});const specs=[],count=Number(process.env.CONTENT_RUNS||300);
for(const seed of [31415,1,7,42,99])for(const strategy of ['Crusher','Cascade','Reactor'])for(const profile of ['Fresh','LegacyMax'])for(const time of ['Fixed20','ExtraTime'])for(const feature of ['M8','M9'])specs.push({seed,strategy,profile,time,feature,mode:'Normal',count});
for(const seed of [31415,1,7,42,99])for(const strategy of ['Crusher','Cascade','Reactor'])for(const mode of ['Adaptive','Anomaly'])specs.push({seed,strategy,profile:'LegacyMax',time:'Fixed20',feature:'M9',mode,count:Math.min(count,50)});
for(const seed of [31415,1,7,42,99])for(const strategy of ['Crusher','Cascade','Reactor'])specs.push({seed,strategy,profile:'LegacyMax',time:'ExtraTime',feature:'M9',mode:'Adaptive',count:Math.min(count,50)});
for(const s of specs){s.signature=hash;s.key=[hash.slice(0,12),s.seed,s.strategy,s.profile,s.time,s.feature,s.mode,s.count].join('-');s.file=`${directory}/${s.key}.json.gz`;}
const pending=specs.filter(s=>!existsSync(s.file)||JSON.parse(gunzipSync(readFileSync(s.file))).rows.length<s.count);let cursor=0,done=0;
await Promise.all(Array.from({length:Math.min(Number(process.env.CONTENT_WORKERS||6),availableParallelism())},async()=>{while(cursor<pending.length){const spec=pending[cursor++];await new Promise((resolve,reject)=>{const p=fork(fileURLToPath(import.meta.url),['--worker',JSON.stringify(spec)],{stdio:'inherit'});p.on('exit',code=>code===0?resolve():reject(Error(`${spec.key} exit${code}`)));});console.log(`M9 paths ${++done}/${pending.length}: ${spec.key}`);}}));
const paths=specs.map(s=>JSON.parse(gunzipSync(readFileSync(s.file)))),checkpoints=[1,3,5,10,20,30,50,100,200,300],median=xs=>[...xs].sort((a,b)=>a-b)[Math.floor(xs.length/2)],summary=[];
for(const strategy of ['Crusher','Cascade','Reactor'])for(const profile of ['Fresh','LegacyMax'])for(const time of ['Fixed20','ExtraTime'])for(const feature of ['M8','M9']){
 const set=paths.filter(p=>p.spec.strategy===strategy&&p.spec.profile===profile&&p.spec.time===time&&p.spec.feature===feature&&p.spec.mode==='Normal');
 summary.push({strategy,profile,time,feature,checkpoints:checkpoints.filter(n=>n<=count).map(run=>({run,...Object.fromEntries(['rank','levels','bank','catalyst','kills','raw','photon','chain','blank','spawnFailures'].map(k=>[k,median(set.map(p=>p.rows[run-1][k]))])),introduced:median(set.map(p=>p.rows[run-1].introduced.length))}))});
}
const events={},encounters={},patterns={};for(const p of paths)for(const r of p.rows){for(const[k,n]of Object.entries(r.ecologyCounts))events[k]=(events[k]||0)+n;for(const[k,v]of Object.entries(r.shapeStats))encounters[k]=(encounters[k]||0)+v.spawnCount;for(const[k,n]of Object.entries(r.patterns))patterns[k]=(patterns[k]||0)+n;}
const result={passed:true,signature:hash,sources,actualRuns:paths.reduce((a,p)=>a+p.rows.length,0),paths:specs.length,cachedPaths:specs.length-pending.length,sourceFiles:specs.map(s=>s.file),summary,events,encounters,patterns,environment:{node:process.version,workers:Number(process.env.CONTENT_WORKERS||6)},humanFun:'not measured; exact automated density/HP aiming, zero UI dwell; distinct run seed shared across comparisons'};
writeFileSync('artifacts/m9-balance-results.json',JSON.stringify(result,null,2));console.log(`M9 benchmark PASS: ${result.actualRuns} actual Runs, ${specs.length} paths`);
