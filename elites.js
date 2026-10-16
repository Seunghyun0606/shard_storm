import {CONFIG as C} from './config.js';
import {ELITES} from './advanced-defs.js';
import {safePoint,near} from './ecology.js';
import {advancedLog,safePortalPair} from './advanced-shapes.js';
import {eliteChoice} from './spawn-director.js';
export function eligibleElites(g){return Object.entries(ELITES).filter(([,d])=>g.discoveryRank>=d.rank&&g.advancedInsight>=d.insight&&g.highestTier>=4).map(([id])=>id);}
export function tryElite(g,forced=null){
 if(!g.advancedEnabled||g.eliteSpawned||g.state!=='PLAYING'||g.remaining<=0)return null;
 const eligible=eligibleElites(g);if(!eligible.length||forced&&!eligible.includes(forced))return null;
 const introduction=eligible.find(id=>!(g.eliteHistory[id]?.spawned>0)&&!g.eliteAttempted.has(id));
 const id=eliteChoice(g,eligible,introduction,forced);if(!id)return null;
 const decision=g.director.elite,isNatural=!forced&&!introduction;
 if(isNatural)decision.attempts++;
 const failed=reason=>{if(isNatural&&g.director.policy!=='M11_attempt'){decision.placementFailures++;decision.failureReasons||={};decision.failureReasons[reason]=(decision.failureReasons[reason]||0)+1;advancedLog(g,'elitePlacementFailed',{id:0},{},{eliteId:id,reason});}return null;};
 const d=ELITES[id];g.eliteAttempted.add(id);const delta=g.eliteDelta[id]||={attempts:0,spawned:0,kills:0};delta.attempts++;
 if(g.alive.length+d.types.length>g.target)return failed('target-budget');
 if(d.types.some(type=>C.shapes[type].special&&g.alive.filter(s=>s.type===type).length+d.types.filter(t=>t===type).length>C.shapes[type].cap||(g.specialSpawns[type]||0)+d.types.filter(t=>t===type).length>(C.shapes[type].runCap||Infinity)))return failed('special-cap');
 if(g.alive.filter(s=>C.shapes[s.type].ecology&&!C.shapes[s.type].advanced).length+d.types.filter(type=>C.shapes[type].ecology&&!C.shapes[type].advanced).length>7)return failed('ecology-cap');
 let points=null;
 for(let attempt=0;attempt<96;attempt++){
  const A=C.arena,x=A.left+100+g.advancedRng()*(A.right-A.left-200),y=A.top+100+g.advancedRng()*(A.bottom-A.top-200);
  const offsets=id==='portalBeacon'?[[0,0],[210,0],[0,85]]:id==='ancientPrism'?[[0,0],[100,0],[135,70]]:id==='mirrorGravity'?[[0,0],[100,0]]:id==='shieldConductor'?[[0,0],[80,40],[0,76]]:[[0,0],[80,0],[0,90]];
  const candidate=d.types.map((type,i)=>({x:x+offsets[i][0],y:y+offsets[i][1],radius:C.shapes[type].radius,type}));
  if(candidate.every((p,i)=>safePoint(g,p.x,p.y,p.radius)&&candidate.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>=p.radius+q.radius+C.spawnGap+(C.shapes[p.type].drift??C.motion.maxDrift)+(C.shapes[q.type].drift??C.motion.maxDrift)))){points=candidate;break;}
 }
 if(!points){if(g.director.policy==='M11_attempt')advancedLog(g,'elitePlacementFailed',{id:0},{},{eliteId:id});return failed('geometry');}
 const shapes=[];if(id==='portalBeacon'){const pair=safePortalPair(g,points.slice(0,2));if(!pair)return null;shapes.push(...pair);}
 for(let i=shapes.length;i<points.length;i++){const p=points[i];shapes.push(g.addShape(p.type,p.x,p.y,0,false,C.spawnGrace,'normal'));}
 if(shapes.some(s=>!s))throw Error('Atomic Elite commit precondition violated');
 const primary=shapes[0];primary.hp=primary.maxHP=Math.ceil(C.shapes[primary.type].hp*1.5);primary.bonus=C.shapes[primary.type].bonus+50;primary.elitePrimary=true;primary.eliteId=id;for(const s of shapes)s.eliteEncounter=id;
 for(const s of shapes.filter(s=>s.type==='conductor'))s.linkIds=near(g,s,115+(g.expansionLevels.conductiveSurge>=2?15:0)).slice(0,2).map(t=>t.id);
 if(id==='bombReactor')shapes[2].secondaryTrait='volatile';
 g.eliteSpawned=true;if(isNatural)decision.naturalSpawned=true;delta.spawned++;advancedLog(g,'eliteSpawned',primary,{}, {eliteId:id,targetIds:shapes.map(s=>s.id),origin:forced?'forced':introduction?'introduction':'natural'});return shapes;
}
