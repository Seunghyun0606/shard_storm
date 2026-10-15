import {TECHNIQUES,ELITES,ADVANCED_SHAPES} from './advanced-defs.js';
export const CODEX_IDS=Object.keys(TECHNIQUES);
const integer=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1e9):0;
export function codexStage(id,kills,techniques){return kills<1?0:kills<(id==='ancient'?5:30)?1:techniques<1?2:kills<(id==='ancient'?20:150)||techniques<3?3:4;}
export function normalizeCodex(value={}){return Object.fromEntries(CODEX_IDS.map(id=>{const kills=integer(value?.[id]?.kills),techniques=integer(value?.[id]?.techniques),stage=codexStage(id,kills,techniques);return[id,{kills,techniques,stage,discovered:stage>0}];}));}
export function codexInsights(codex){return CODEX_IDS.filter(id=>codex?.[id]?.stage>=3);}
export function initCodex(g,enabled){g.advancedEnabled=enabled;g.codexDelta=Object.fromEntries(CODEX_IDS.map(id=>[id,{kills:0,techniques:0}]));g.codexKeys=new Set();g.codexSets=new Map();g.codexEvents=[];g.codexSequence=0;}
function set(g,key,item){const values=g.codexSets.get(key)||new Set();values.add(item);g.codexSets.set(key,values);return values;}
export function codexFeat(g,id,key,cause={},extra={}){
 if(!g.advancedEnabled||g.shapes.some(s=>s.id===extra.sourceId&&s.fixture)||!g.codexDelta[id]||g.codexKeys.has(id+':'+key)||g.state!=='PLAYING'||g.remaining<=0)return false;
 g.codexKeys.add(id+':'+key);g.codexDelta[id].techniques++;
 if(g.codexEvents.length<2048)g.codexEvents.push({id,sourceId:extra.sourceId,chainId:cause.chainId,at:g.simulationTime,targetId:extra.targetId,eventId:++g.codexSequence,...extra});return true;
}
export function codexEvent(g,kind,s,cause={},extra={}){
 if(!g.advancedEnabled||s.fixture)return;
 const origin=extra.sourceId??s.id,key=kind+':'+origin;
 if(kind==='stage'){const stages=set(g,key,extra.stageIndex);s.codexStages=stages;if(s.type==='reactor'&&stages.size>=2)codexFeat(g,'reactor',key,cause,{sourceId:origin});if(s.type==='ancient'&&stages.size>=3&&s.destroyed)codexFeat(g,'ancient',key,cause,{sourceId:origin});}
 if(kind==='ward'&&set(g,key,extra.targetId).size>=2)codexFeat(g,'hex',key,cause,{sourceId:origin,targetId:extra.targetId});
 if(kind==='conductorDelivered'&&set(g,key,extra.targetId).size>=2)codexFeat(g,'conductor',key,cause,{sourceId:origin,targetId:extra.targetId});
 if(kind==='parasiteCopied'&&set(g,key,extra.targetId).size>=2)codexFeat(g,'parasiteLink',key,cause,{sourceId:origin,targetId:extra.targetId});
 if(kind==='fuseExploded'){const key='fuse:'+cause.chainId,list=g.codexSets.get(key)||[];list.push({id:s.id,at:g.simulationTime});g.codexSets.set(key,list);if(list.some(e=>e.id!==s.id&&g.simulationTime-e.at<=1+1e-9))codexFeat(g,'fuseBomb',key+':'+s.id,cause,{sourceId:s.id});}
}
export function codexContact(g,s,cause,wave){
 if(!g.advancedEnabled||s.echo||s.fixture)return;
 if(wave&&cause.nativeWave&&cause.source==='star'&&set(g,'starwave:'+wave.id,s.id).size>=6)codexFeat(g,'star','wave:'+wave.id,cause,{sourceId:cause.originShapeId,targetId:s.id,waveId:wave.id});
 if(wave?.cause.source==='prismRefraction'&&!s.elitePrimary){const key='lens:'+cause.originShapeId;const hits=g.codexSets.get(key)||new Map();hits.set(cause.sectorIndex,s.id);g.codexSets.set(key,hits);if(hits.size>=2&&new Set(hits.values()).size>=2)codexFeat(g,'prismLens',key,cause,{sourceId:cause.originShapeId,targetId:s.id,waveId:wave.id});}
}
export function codexDeath(g,s,cause,wave){
 if(!g.advancedEnabled||s.fixture)return;
 if(s.echo){if(s.parentChain===cause.chainId&&set(g,'echo:'+s.parentSplitter+':'+cause.chainId,s.id).size>=2)codexFeat(g,'splitter','parent:'+s.parentSplitter,cause,{sourceId:s.parentSplitter,targetId:s.id});return;}
 if(!s.elitePrimary&&g.codexDelta[s.type])g.codexDelta[s.type].kills++;
 const chain=g.chains.get(cause.chainId);if(chain){chain.codexDead||=new Set();chain.codexDead.add(s.id);if(cause.small===false&&cause.source==='triangle'){chain.codexTriangleOrigins||=new Set();chain.codexTriangleOrigins.add(cause.originShapeId);}if(chain.codexDead.size>=5)for(const id of chain.codexTriangleOrigins||[])codexFeat(g,'triangle','chain:'+cause.chainId+':'+id,cause,{sourceId:id,targetId:s.id});}
 if(cause.small===false&&cause.source==='pentagon'&&set(g,'pentagon:'+cause.originShapeId,s.id).size>=5)codexFeat(g,'pentagon','origin:'+cause.originShapeId,cause,{sourceId:cause.originShapeId,targetId:s.id});
 if(wave&&cause.nativeWave&&cause.source==='square'&&set(g,'squarewave:'+wave.id,s.id).size>=3)codexFeat(g,'square','wave:'+wave.id,cause,{sourceId:cause.originShapeId,targetId:s.id,waveId:wave.id});
 if(cause.small===false){if(cause.reflectionKind==='mirror')codexFeat(g,'mirror','shard:'+cause.id,cause,{sourceId:cause.reflectionSource,targetId:s.id,shardId:cause.id});if(cause.gravitySource)codexFeat(g,'gravityWell','shard:'+cause.id,cause,{sourceId:cause.gravitySource,targetId:s.id,shardId:cause.id});if(cause.portalPassed)codexFeat(g,'portalGate','shard:'+cause.id,cause,{sourceId:cause.portalPassed,targetId:s.id,shardId:cause.id});}
 if(s.type==='ancient'&&s.codexStages?.size>=3)codexFeat(g,'ancient','stage:'+s.id,cause,{sourceId:s.id});
 if(s.type==='repairNode'&&s.healedHP>=2)codexFeat(g,'repairNode','heal:'+s.id,cause,{sourceId:s.id});
 if(s.type==='phaseCrystal'&&cause.source==='direct'&&s.phaseWasVulnerable)codexFeat(g,'phaseCrystal','death:'+s.id,cause,{sourceId:s.id});
 if(s.type==='shifter'&&cause.source==='direct'&&g.simulationTime-(s.lastLeapAt??-Infinity)<=1+1e-9)codexFeat(g,'shifter','death:'+s.id,cause,{sourceId:s.id});
}
export function codexSnapshot(g){return g.advancedEnabled?{version:8,runId:g.runId,delta:structuredClone(g.codexDelta),elite:structuredClone(g.eliteDelta||{}),intro:[...(g.advancedIntroConsumed||[])]}:null;}
export function validCodexSnapshot(value,runId){return value?.version===8&&value.runId===runId&&value.delta&&CODEX_IDS.every(id=>['kills','techniques'].every(k=>Number.isSafeInteger(value.delta[id]?.[k])&&value.delta[id][k]>=0&&value.delta[id][k]<=100000))&&Object.keys(value.delta).every(id=>CODEX_IDS.includes(id))&&Array.isArray(value.intro)&&value.intro.every(id=>Object.hasOwn(ADVANCED_SHAPES,id))&&value.elite&&Object.entries(value.elite).every(([id,row])=>Object.hasOwn(ELITES,id)&&['attempts','spawned','kills'].every(k=>Number.isSafeInteger(row[k])&&row[k]>=0&&row[k]<=(k==='attempts'?100000:1)));}
export function applyCodex(save,snapshot){if(!validCodexSnapshot(snapshot,snapshot?.runId))return;save.advancedIntroFlags||={};save.eliteHistory||={};save.shapeCodex=normalizeCodex(save.shapeCodex);for(const id of CODEX_IDS){const row=save.shapeCodex[id],delta=snapshot.delta[id];row.kills+=delta.kills;row.techniques+=delta.techniques;row.stage=codexStage(id,row.kills,row.techniques);row.discovered=row.stage>0;}save.insightUnlocked=codexInsights(save.shapeCodex);for(const id of snapshot.intro||[])if(CODEX_IDS.includes(id))save.advancedIntroFlags[id]=true;for(const[id,row]of Object.entries(snapshot.elite||{})){save.eliteHistory[id]||={attempts:0,spawned:0,kills:0};for(const k of ['attempts','spawned','kills'])save.eliteHistory[id][k]+=integer(row[k]);}}
