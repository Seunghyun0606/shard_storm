// Explanations are derived exclusively from actual recorded source events.
// Absence of a contact is reported as absence, not guessed as a missed target.
export function initAttempts(g){g.codexAttempts={pentagon:new Map(),lens:new Map(),fuse:new Map()};}
export function attemptDeath(g,s,cause){
 if(!g.advancedEnabled||s.echo||s.fixture)return;
 if(cause.source==='pentagon'&&Number.isInteger(cause.originShapeId)){
  const key=cause.originShapeId,row=g.codexAttempts.pentagon.get(key)||{sourceId:key,chainId:cause.chainId,mainKills:new Set(),auxiliaryKills:new Set()};
  (cause.small===false?row.mainKills:row.auxiliaryKills).add(s.id);g.codexAttempts.pentagon.set(key,row);
 }
}
export function attemptEvent(g,kind,s,cause,extra){
 if(!g.advancedEnabled||s.fixture)return;
 if(kind==='fuseExploded'){
  const list=g.codexAttempts.fuse.get(cause.chainId)||[];list.push({id:s.id,at:g.simulationTime});g.codexAttempts.fuse.set(cause.chainId,list);
 }
}
export function attemptContact(g,s,cause,wave){
 if(!g.advancedEnabled||s.echo||s.fixture||s.elitePrimary||!wave||cause.source!=='prismRefraction')return;
 const row=g.codexAttempts.lens.get(cause.originShapeId)||{sourceId:cause.originShapeId,contacts:[],chainId:cause.chainId};
 row.contacts.push({sector:cause.sectorIndex,targetId:s.id,waveId:wave.id,at:g.simulationTime});g.codexAttempts.lens.set(cause.originShapeId,row);
}
export function attemptSummary(g){
 if(!g.advancedEnabled)return[];const result=[];
 for(const row of g.codexAttempts.pentagon.values())result.push({id:'pentagon',sourceId:row.sourceId,chainId:row.chainId,actual:row.mainKills.size,required:5,success:row.mainKills.size>=5,targetIds:[...row.mainKills],reason:`Main-shard kills ${row.mainKills.size}/5 from origin #${row.sourceId}. Auxiliary kills ${row.auxiliaryKills.size} do not count; only fatal main-shard events qualify.`});
 for(const row of g.codexAttempts.lens.values()){
  const sectors=new Set(row.contacts.map(e=>e.sector)),targets=new Set(row.contacts.map(e=>e.targetId)),actual=Math.min(sectors.size,targets.size),success=actual>=2;
  result.push({id:'prismLens',sourceId:row.sourceId,chainId:row.chainId,actual,required:2,success,contacts:row.contacts,reason:`Observed ${sectors.size} sectors / ${targets.size} distinct normal targets. ${success?'Two-target condition met.':sectors.size<2?'No recorded contact from the second sector.':'Both sectors contacted the same target; a second distinct target is required.'}`});
 }
 for(const[chainId,list]of g.codexAttempts.fuse){let actual=0;for(const e of list)actual=Math.max(actual,new Set(list.filter(x=>Math.abs(x.at-e.at)<=1+1e-9).map(x=>x.id)).size);
  result.push({id:'fuseBomb',chainId,actual,required:2,success:actual>=2,events:list,reason:`Chain #${chainId}: ${actual} actual distinct Fuse explosions within 1s. ${actual>=2?'Timing met.':list.length>1?'Other explosions were more than 1s apart.':'Only one explosion was recorded in this Chain.'}`});
 }
 return result.slice(-128);
}
