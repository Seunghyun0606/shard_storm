import {CONFIG as C} from './config.js';
import {seededRNG} from './entities.js';
import {destructionStage} from './destruction-stage.js';
import {responseLayout,RESPONSE_PATTERNS} from './response-patterns.js';
export function initDestruction(g,enabled){
 g.destructionEnabled=Boolean(enabled)&&g.ruleset!=='legacy_v08';g.destructionStage=destructionStage(g.levels);g.responseRng=seededRNG(g.seed^0x13abc47);
 g.response={queue:[],active:null,credits:0,triggers:0,tenTriggers:0,spawned:0,kills:0,sequence:0,expired:0,fallback:0,regularBudget:0,events:[],seen:new Set(),crown:false,chains:new Map(),patternSequence:0};
}
const log=(g,kind,extra={})=>{if(g.response.events.length<256)g.response.events.push({...extra,pattern:extra.kind,kind,at:g.simulationTime});};
export function stagePattern(g){
 if(!g.destructionEnabled||g.destructionStage.index<2||g.responseRng()>=.25)return null;
 const kind=['linkPocket','bridgeCorridor','stormCrown'][g.destructionStage.index-2],points=responseLayout(g,{kind});if(!points)return null;
 return {kind,points,index:0,clusterId:`stage-${++g.response.patternSequence}`};
}
function reserve(g,kind,chainId){const r=g.response,count=RESPONSE_PATTERNS[kind].count;
 if(kind==='linkPocket'&&r.tenTriggers>=(g.destructionStage.index===4?1:2)){log(g,'rejected',{reason:'reserved-for-chain20',kind,chainId});return;}
 if(r.triggers>=3||r.spawned+r.queue.reduce((n,q)=>n+q.count,0)+count>18){log(g,'rejected',{reason:'run-cap',kind,chainId});return;}
 if(g.remaining<.2*Math.ceil(count/3)+C.spawnGrace){log(g,'rejected',{reason:'deadline',kind,chainId});return;}
 r.triggers++;if(kind==='linkPocket')r.tenTriggers++;r.queue.push({id:`response-${++r.sequence}`,kind,count,chainId,origin:{...r.chains.get(chainId)?.last},attempts:0,at:g.simulationTime});log(g,'reserved',{kind,chainId,count});
}
export function responseDeath(g,s,cause){
 if(!g.destructionEnabled||s.echo||s.fixture)return;const r=g.response,id=cause.chainId,chain=g.chains.get(id);if(!chain)return;
 let row=r.chains.get(id);if(!row){row={chainId:id,origin:{x:s.x,y:s.y},last:{x:s.x,y:s.y},kills:0,distance:0,clusters:new Set(),sources:new Set()};r.chains.set(id,row);}
 row.kills++;row.last={x:s.x,y:s.y};row.distance=Math.max(row.distance,Math.hypot(s.x-row.origin.x,s.y-row.origin.y));if(s.clusterId)row.clusters.add(s.clusterId);row.sources.add(cause.source);if(s.responseFormation)r.kills++;
 for(const n of [5,10,20])if((chain.rewardedKills||0)>=n&&!r.seen.has(id+':'+n)){
  r.seen.add(id+':'+n);log(g,'chainMilestone',{chainId:id,threshold:n,x:s.x,y:s.y});
  if(n===10&&g.destructionStage.index>=2)reserve(g,'linkPocket',id);
  if(n===20&&g.destructionStage.index>=3){reserve(g,'bridgeCorridor',id);if(g.destructionStage.index===4&&!r.crown){r.crown=true;reserve(g,'stormCrown',id);}}
 }
}
export function responseSpawnSlot(g){
 if(!g.destructionEnabled)return false;const r=g.response;r.regularBudget++;
 if(r.active){if(g.alive.some(s=>r.active.ids.includes(s.id)))return false;log(g,'cleared',{id:r.active.id});r.active=null;}
 const q=r.queue[0];if(!q||g.pending.length)return false;r.credits++;
 if(r.credits<q.count)return true;
 const points=responseLayout(g,q);q.attempts++;
 if(points){
  const shapes=points.map(p=>g.addShape(p.type,p.x,p.y,0,false,C.spawnGrace,'normal'));
  if(shapes.some(s=>!s))throw Error('Atomic response placement precondition violated');
  shapes.forEach((s,i)=>{s.responseFormation=q.id;s.clusterId=q.id+':pocket'+points[i].cluster;s.spawnPattern=q.kind;});
  // Link targets are captured after every member exists, preserving native caps.
  for(const s of shapes.filter(s=>s.type==='conductor'))s.linkIds=shapes.filter(t=>t.id!==s.id&&Math.hypot(t.x-s.x,t.y-s.y)<=115).slice(0,2).map(t=>t.id);
  r.active={...q,ids:shapes.map(s=>s.id)};r.spawned+=shapes.length;r.credits-=q.count;r.queue.shift();g.spawnAttempts+=shapes.length;g.spawnSuccesses+=shapes.length;
  for(const bin of [g.binAt(),g.binAt5()]){bin.spawnAttempts+=shapes.length;bin.spawnSuccesses+=shapes.length;}
  g.patternCounts[q.kind]=(g.patternCounts[q.kind]||0)+shapes.length;log(g,'activated',{id:q.id,kind:q.kind,chainId:q.chainId,origin:q.origin,targetIds:shapes.map(s=>s.id),points:points.map(p=>({x:p.x,y:p.y,cluster:p.cluster}))});g.onEvent?.('stormResponse');return true;
 }
 // Failed geometry spends only the already reserved ordinary tokens. Normal
 // placement performs its own safety/trajectory checks; no hidden extra budget.
 r.queue.shift();r.fallback+=r.credits;const tokens=r.credits;r.credits=0;let successes=0;
 for(let i=0;i<tokens&&g.alive.length<g.target;i++)if(g.spawn())successes++;
 log(g,'fallback',{id:q.id,kind:q.kind,reason:'safe-layout-unavailable',tokens,successes});return true;
}
export function finishResponses(g){if(!g.destructionEnabled)return;const r=g.response;r.expired+=r.queue.reduce((n,q)=>n+q.count,0);if(r.queue.length)log(g,'expired',{count:r.expired,reservedTokens:r.credits});r.queue=[];r.credits=0;}
export function destructionRecord(g){const r=g.response;return {enabled:g.destructionEnabled,stage:{...g.destructionStage},triggers:r.triggers,spawned:r.spawned,kills:r.kills,expired:r.expired,fallback:r.fallback,regularBudget:r.regularBudget,events:structuredClone(r.events),chains:[...r.chains.values()].map(c=>({...c,clusters:[...c.clusters],sources:[...c.sources]})),maxDistance:Math.max(0,...[...r.chains.values()].map(c=>c.distance)),maxClusters:Math.max(0,...[...r.chains.values()].map(c=>c.clusters.size))};}
