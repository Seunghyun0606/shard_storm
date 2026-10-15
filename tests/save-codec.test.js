import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compressBlock,decompressBlock,encodeSave,decodeSave,crc32,SAVE_ENCODING,MAX_SAVE_BYTES} from '../save-codec.js';
import {freshSave,loadSave,writeSave} from '../storage.js';
import {CONFIG as C} from '../config.js';
import {stageSettlement,completeSettlement} from '../progression.js';
import {Game} from '../game.js';
import {memoryStorage} from './helpers.js';
test('lossless block codec random/repeated/UTF-8 data, overlap, extended lengths and64K dictionary boundary',()=>{
 let seed=31415;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>24;};
 for(const n of [0,1,4,11,12,15,255,65535,70000,200000])for(const kind of ['random','repeat','mixed']){const bytes=Uint8Array.from({length:n},(_,i)=>kind==='repeat'?65:kind==='mixed'&&i%100<85?i%17:random());assert.deepEqual(decompressBlock(compressBlock(bytes),n),bytes);}
 const value={saveVersion:8,text:'\uc800\uc7a5 \ud55c\uae00 \ud83d\udcab \u0000',numbers:[0,1,-1,1.234,Number.MAX_SAFE_INTEGER],records:Array(100).fill({a:'repeat',b:[1,2,3]})};assert.deepEqual(decodeSave(encodeSave(value)),value);assert.equal(crc32(new TextEncoder().encode('123456789')),'cbf43926');
});
test('packed save corruption, truncated offsets, invalid UTF-8/header and decompression limits are rejected',()=>{
 const packed=JSON.parse(encodeSave({saveVersion:8,text:'repeated'.repeat(100)}));
 for(const change of [{crc32:'00000000'},{byteLength:MAX_SAVE_BYTES+1},{byteLength:-1},{payload:'@@@='},{payload:packed.payload.slice(4)},{storageEncoding:'unknown'},{saveVersion:7}])assert.throws(()=>decodeSave(JSON.stringify({...packed,...change})),e=>e.packedSave===true);
 for(const [bytes,n]of [[[],1],[[0,0],0],[[0,0,0],4],[[0x10,65,0,0],5],[[0xf0],20]])assert.throws(()=>decompressBlock(Uint8Array.from(bytes),n));assert.throws(()=>decompressBlock(Uint8Array.from([0]),MAX_SAVE_BYTES+1));
 const invalidUtf8=Uint8Array.from([255]);assert.throws(()=>decodeSave(JSON.stringify({saveVersion:8,storageEncoding:SAVE_ENCODING,byteLength:1,crc32:crc32(invalidUtf8),payload:btoa(String.fromCharCode(...compressBlock(invalidUtf8)))})));
});
test('all20 complete real battle records round-trip within Chrome5MiB without deleting one event',()=>{
 const original=JSON.parse(gunzipSync(readFileSync('artifacts/storage-capacity-fixture.json.gz')).toString('utf8'));delete original.sandbox;const packed=encodeSave(original);
 assert.ok(JSON.stringify(original).length>5*1024*1024);assert.ok(packed.length<5*1024*1024-10000);assert.equal(JSON.parse(packed).storageEncoding,SAVE_ENCODING);assert.deepEqual(decodeSave(packed),original);
 const mem=memoryStorage();assert.equal(writeSave(mem,original),true);const loaded=loadSave(mem);assert.equal(loaded.lastRuns.length,20);assert.deepEqual(loaded.lastRuns,original.lastRuns);assert.deepEqual(loaded.levels,original.levels);assert.equal(loaded.bank,original.bank);assert.equal(loaded.catalystBalance,original.catalystBalance);assert.deepEqual(loaded.signatureLoadout,original.signatureLoadout);assert.deepEqual(loaded.evolutionOwned,original.evolutionOwned);assert.deepEqual(loaded.evolutionActive,original.evolutionActive);
});
test('schema1..8 plain JSON remain readable and migrate to same-key packed writes',()=>{
 for(let v=1;v<=8;v++){const source={...freshSave(),saveVersion:v,bank:123456,levels:{...freshSave().levels,extraTime:3,crushPower:2}};const mem=memoryStorage();mem.setItem(C.storageKey,JSON.stringify(source));const migrated=loadSave(mem);assert.equal(migrated.bank,123456);assert.equal(migrated.levels.extraTime,3);assert.equal(writeSave(mem,migrated),true);assert.equal(JSON.parse(mem.getItem(C.storageKey)).storageEncoding,SAVE_ENCODING);assert.equal(loadSave(mem).bank,123456);}
});
test('pending settlement survives packed refresh/Skip/Replay exactly once with full Codex delta',()=>{
 const save=freshSave(),g=new Game({runId:'packed-once',ecologyEnabled:true,advancedEnabled:true});g.attack(480,335);while(g.state==='PLAYING')g.update(C.step);assert.equal(stageSettlement(save,g),true);const pending=JSON.parse(JSON.stringify(save.pendingSettlement)),mem=memoryStorage();assert.equal(writeSave(mem,save),true);const restored=loadSave(mem);assert.deepEqual(restored.pendingSettlement,pending);assert.equal(completeSettlement(restored),true);const bank=restored.bank,codex=structuredClone(restored.shapeCodex);writeSave(mem,restored);const again=loadSave(mem);again.pendingSettlement=pending;assert.equal(completeSettlement(again),false);assert.equal(again.bank,bank);assert.deepEqual(again.shapeCodex,codex);
});
test('failed encoding/quota and corrupt packed load never overwrite last valid/original storage',()=>{
 const mem=memoryStorage(),save=freshSave();save.bank=999;writeSave(mem,save);const before=mem.getItem(C.storageKey),quota={getItem:mem.getItem,setItem(){throw Error('quota');}};save.bank++;assert.equal(writeSave(quota,save),false);assert.equal(mem.getItem(C.storageKey),before);
 const corrupt=JSON.stringify({...JSON.parse(before),crc32:'00000000'});mem.setItem(C.storageKey,corrupt);const recovery=loadSave(mem);assert.equal(recovery.storageRecovery.raw,corrupt);assert.equal(writeSave(mem,recovery),false);assert.equal(mem.getItem(C.storageKey),corrupt);assert.equal(writeSave(mem,{...save,sandbox:true}),false);
});

test('base64 fallback produces the exact same packed bytes as native base64',()=>{
 const value={saveVersion:8,text:'\ud55c\uae00'.repeat(500),records:Array(100).fill({x:1,y:2})},native=encodeSave(value),a=Object.getOwnPropertyDescriptor(Uint8Array.prototype,'toBase64'),b=Object.getOwnPropertyDescriptor(Uint8Array,'fromBase64');
 try{Object.defineProperty(Uint8Array.prototype,'toBase64',{value:undefined,configurable:true});Object.defineProperty(Uint8Array,'fromBase64',{value:undefined,configurable:true});assert.equal(encodeSave(value),native);assert.deepEqual(decodeSave(native),value);}finally{if(a)Object.defineProperty(Uint8Array.prototype,'toBase64',a);else delete Uint8Array.prototype.toBase64;if(b)Object.defineProperty(Uint8Array,'fromBase64',b);else delete Uint8Array.fromBase64;}
});
test('truncated JSON and unknown future schemas preserve original bytes for recovery',()=>{
 for(const raw of [encodeSave({...freshSave(),bank:1234}).slice(0,-8),JSON.stringify({...freshSave(),saveVersion:99,bank:777})]){const mem=memoryStorage();mem.setItem(C.storageKey,raw);const save=loadSave(mem);assert.equal(save.storageRecovery.raw,raw);assert.equal(writeSave(mem,save),false);assert.equal(mem.getItem(C.storageKey),raw);}
});
