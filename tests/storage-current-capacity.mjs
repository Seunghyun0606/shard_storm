import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {CONFIG as C} from '../config.js';
import {freshSave} from '../storage.js';
import {settle} from '../progression.js';
import {encodeSave,decodeSave} from '../save-codec.js';
import {EVOLUTION_FAMILIES,BUILD_PRESETS} from '../expansion-defs.js';
import {CODEX_IDS} from '../codex.js';
import {contentBattle} from './content-simulation.js';

// Full current-M11 records, not the compacted growth checkpoint summaries.
const save=freshSave();save.sandbox=true;save.bank=10000;save.catalystBalance=200;save.lifetimeDestroyed=8000;save.discoveryRank=4;
save.levels=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max]));
save.relicOwned=Object.keys(C.relics);for(const d of Object.values(C.relics))save.relicAchievements[d.counter]=d.target;
save.evolutionOwned=Object.fromEntries(Object.entries(EVOLUTION_FAMILIES).map(([id,d])=>[id,Object.keys(d.forms)]));
for(const id of CODEX_IDS)save.shapeCodex[id]={kills:150,techniques:3,stage:4,discovered:true};save.insightUnlocked=[...CODEX_IDS];
for(let i=0;i<20;i++){
 const strategy=['Crusher','Cascade','Reactor'][i%3],preset=BUILD_PRESETS[strategy];save.signatureLoadout=[...preset.signatures];save.evolutionActive=structuredClone(preset.evolutions);save.relicEquipped=strategy==='Reactor'?['reactorGovernor','ancientResonator']:['ricochetCoil','waveCondenser'];
 const g=contentBattle({seed:31415+i*7919,runId:`current32-${i}`,levels:save.levels,discoveryRank:4,duration:32,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,
  shapeCodex:save.shapeCodex,insightUnlocked:save.insightUnlocked,eliteHistory:save.eliteHistory,advancedIntroFlags:save.advancedIntroFlags,introSeen:save.shapeIntroSeen,welcomeFlags:save.milestoneWelcomeFlags,
  signatureLoadout:save.signatureLoadout,evolutionOwned:save.evolutionOwned,evolutionActive:save.evolutionActive,relicLoadout:save.relicEquipped});
 assert.equal(settle(save,g),true);assert.equal(settle(save,g),false);console.log(`Current M11 full32s record ${i+1}/20: ${strategy}`);
}
delete save.sandbox;const raw=JSON.stringify(save),packed=encodeSave(save);assert.equal(JSON.stringify(decodeSave(packed)),raw);assert.equal(save.lastRuns.length,20);
writeFileSync('artifacts/storage-current32-fixture.json.gz',gzipSync(raw));
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright'),browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[];
try{
 const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(process.env.QA_BASE_URL||'http://127.0.0.1:4174');
 const stored=await page.evaluate(async({packed,raw})=>{const{loadSave}=await import('./storage.js'),{CONFIG:C}=await import('./config.js'),{decodeSave}=await import('./save-codec.js');
  try{localStorage.setItem(C.storageKey,packed);}catch(e){return {passed:false,error:e.name,rawCharacters:raw.length,packedCharacters:packed.length};}
  const exact=JSON.stringify(decodeSave(localStorage.getItem(C.storageKey)))===raw,s=loadSave(localStorage);return {passed:exact,exact,records:s.lastRuns.length,bank:s.bank,catalyst:s.catalystBalance,levels:s.levels};
 },{packed,raw});
 const result={...stored,browser:await browser.version(),rawCharacters:raw.length,packedCharacters:packed.length,fullCurrentM11Runs:20,duration:32,errors,method:'20 distinct seeded actual MAX49/Signature3/Evolution2/Relic2 current-M11 Runs; rotating3 builds, all insight fixture. Complete events retained; private Chrome origin context only. No production user profile.'};
 writeFileSync('artifacts/storage-current32-results.json',JSON.stringify(result,null,2));assert.equal(stored.passed,true);assert.equal(stored.records,20);assert.equal(stored.bank,save.bank);assert.equal(stored.catalyst,save.catalystBalance);assert.deepEqual(stored.levels,save.levels);
 const expectedHistory=createHash('sha256').update(JSON.stringify(save.lastRuns)).digest('hex');
 for(let i=0;i<2;i++){
  await page.reload();const live=await page.evaluate(()=>window.shardStorm.snapshot());assert.equal(live.bank,save.bank);assert.equal(live.catalystBalance,save.catalystBalance);assert.deepEqual(live.levels,save.levels);
  const history=await page.evaluate(async()=>{const{decodeSave}=await import('./save-codec.js'),s=decodeSave(localStorage.getItem('shard-storm-v1')),bytes=new TextEncoder().encode(JSON.stringify(s.lastRuns)),digest=await crypto.subtle.digest('SHA-256',bytes);return {records:s.lastRuns.length,sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')};});assert.equal(history.records,20);assert.equal(history.sha256,expectedHistory);
 }
 assert.deepEqual(errors,[]);result.reloads=2;result.reloadBankExact=true;result.reloadRecordsExact=true;result.historySha256=expectedHistory;writeFileSync('artifacts/storage-current32-results.json',JSON.stringify(result,null,2));console.log(`Current M11 full32s20-record Chrome storage PASS: ${raw.length}->${packed.length} chars`);
}finally{await browser.close();}
