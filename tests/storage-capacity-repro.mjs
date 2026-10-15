// Read-only stress fixture. Never connects to a user's browser profile or save.
import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {CONFIG as C} from '../config.js';
import {freshSave} from '../storage.js';
import {settle} from '../progression.js';
import {contentBattle} from './content-simulation.js';
import {EVOLUTION_FAMILIES as F} from '../expansion-defs.js';
const save=freshSave();save.sandbox=true;save.discoveryRank=4;save.lifetimeDestroyed=8000;
save.levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max]));save.levels.extraTime=0;
save.signatureLoadout=['piercingShard','ricochetBloom','delayedEcho'];save.evolutionOwned=Object.fromEntries(Object.entries(F).map(([id,d])=>[id,Object.keys(d.forms)]));save.evolutionActive=[{family:'direct',form:'focusStrike'},{family:'shard',form:'piercing'}];
const measurements=[];
for(let run=1;run<=20;run++){
 const g=contentBattle({seed:31415+run*7919,duration:20,runId:`capacity-only-${run}`,levels:save.levels,discoveryRank:4,ecologyEnabled:true,skillExpansionEnabled:true,signatureLoadout:save.signatureLoadout,evolutionOwned:save.evolutionOwned,evolutionActive:save.evolutionActive,relicLoadout:['ricochetCoil','reactorGovernor']});
 assert.equal(settle(save,g),true);measurements.push({run,characters:JSON.stringify(save).length,records:save.lastRuns.length,kills:g.totalDestroyed});
}
const raw=JSON.stringify(save),compressed=gzipSync(Buffer.from(raw,'utf8'));
writeFileSync('artifacts/storage-capacity-fixture.json.gz',compressed);
assert.equal(gunzipSync(compressed).toString('utf8'),raw);
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
 const context=await browser.newContext(),page=await context.newPage();await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:4174');
 const result=await page.evaluate(raw=>{try{localStorage.setItem('shard-storm-qa-capacity-only',raw);return {stored:true};}catch(e){return {stored:false,name:e.name,message:e.message};}},raw);
 const compressedWrite=await page.evaluate(payload=>{try{const value=JSON.stringify({saveVersion:8,storageEncoding:'gzip-base64-prototype',payload});localStorage.setItem('shard-storm-qa-compressed-only',value);return {stored:localStorage.getItem('shard-storm-qa-compressed-only')===value,characters:value.length};}catch(e){return {stored:false,name:e.name};}},compressed.toString('base64'));
 const report={actualRuns:20,fixture:'Rank4/MAX49 + Signature3 + Evolution2 + Relic2, isolated synthetic profile,20 actual distinct seeded battles; complete unmodified last20 records. No real user storage.',schema:C.saveVersion,measurements,finalCharacters:raw.length,utf8Bytes:Buffer.byteLength(raw),gzipBytes:compressed.length,gzipBase64Characters:compressed.toString('base64').length,losslessRoundTrip:true,sha256:createHash('sha256').update(raw).digest('hex'),browser:await browser.version(),browserWrite:result,compressedPrototypeWrite:compressedWrite,productionStorageChanged:false};
 writeFileSync('artifacts/storage-capacity-repro.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
