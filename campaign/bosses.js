import {CONFIG as C} from '../config.js';
import {seededRNG} from '../entities.js';
import {safePoint,near} from '../ecology.js';
import {WORLDS,canWorld,canBoss} from './worlds.js';
const part=(type,x,y,role,cluster=0)=>({type,x,y,role,cluster});
export const BOSS_LAYOUTS={
 fractureWarden:[part('star',600,270,'core'),part('square',450,210,'shield'),part('square',450,330,'shield')],
 relayCitadel:[part('hex',330,270,'shield'),part('conductor',405,270,'relay'),part('square',330,345,'anchor'),part('square',445,350,'anchor'),part('star',600,270,'core')],
 riftEngine:[part('triangle',180,270,'anchor'),part('mirror',280,270,'relay'),part('portalGate',380,270,'portal'),part('portalGate',680,270,'portal',1),part('star',780,270,'core',1),part('gravityWell',470,400,'anchor')],
 singularityCore:[part('reactor',350,270,'relay'),part('phaseCrystal',500,270,'shield'),part('star',660,270,'core')],
 stormHeart:Array.from({length:16},(_,i)=>{const row=Math.floor(i/4),col=i%4;return part(i===6?'star':[0,3,14].includes(i)?'star':'square',320+col*88,140+row*88,i===6?'core':[0,3,14].includes(i)?'anchor':'relay',row>=2?2:col<2?0:1);})
};
const hints={fractureWarden:'Break both shield nodes, then the Star core',relayCitadel:'Break Hex wards, then trigger Conductor transmission',riftEngine:'Click the left Triangle: main shard through Mirror / Portal route',singularityCore:'Trigger Reactor stage wave, then hit Phase while vulnerable',stormHeart:'Break3 anchors and carry one Chain15 through2 pockets'};
const bossLayout=(id,depth)=>[...BOSS_LAYOUTS[id],...(depth===3?[{...part('triangle',760,420,'anchor',3),depthAnchor:true}]:[])];
export function initWorld(g,save,worldId,bossRequested,depth=1){
 const enabled=Boolean(save);if(!enabled){g.world=null;return;}
 if(!canWorld(save,worldId)||g.discoveryRank<WORLDS[worldId].rank||bossRequested&&(!canBoss(save,worldId)||g.discoveryRank<WORLDS[worldId].bossRank))throw Error('World/Boss entry requirements not met');
 if(![1,2,3].includes(depth)||depth>1&&!save.worldBossHistory.w4.clears&&!save.worldBossHistory.w5.clears)throw Error('Storm Depth is locked');
 const id=WORLDS[worldId].boss,layout=bossLayout(id,depth),minX=Math.min(...layout.map(p=>p.x)),maxX=Math.max(...layout.map(p=>p.x)),minY=Math.min(...layout.map(p=>p.y)),maxY=Math.max(...layout.map(p=>p.y));
 g.world={enabled:true,depth,id:worldId,bossRequested:Boolean(bossRequested),survey:structuredClone(save.worldSurveyProgress[worldId]),phaseOffered:false,boss:bossRequested?{id,structureId:g.runId+':'+id,parts:[],open:false,cleared:false,clearAt:null,phase:0,hint:hints[id],failure:null,placed:false,latches:{ward:false,transmit:false,route:false,reactor:false,phase:false,linked:false,depthAnchor:false,depthBridge:false},dead:new Set(),blocked:0,events:[],reserved:{left:minX-55,right:maxX+55,top:minY-55,bottom:maxY+55},plannedCount:layout.length}:null};
 g.worldRng=seededRNG(g.seed^0x14aabb);
 g.spawnPointAllowed=(x,y,r)=>{const b=g.world.boss,z=b?.reserved;return !z||b.cleared||x+r<z.left||x-r>z.right||y+r<z.top||y-r>z.bottom;};
 g.combatObserver=(kind,event)=>bossMetric(g,kind,event);
 if(bossRequested)g.scheduleEvent({kind:'effect',sourceKind:'boss-placement',scheduledTime:.5,priority:-1,action:()=>placeBoss(g)});
}
export function placeBoss(g){const b=g.world?.boss;if(!b||b.placed||b.failure)return false;const layout=bossLayout(b.id,g.world.depth);
 if(g.alive.length+layout.length>32||g.alive.filter(s=>C.shapes[s.type].ecology).length+layout.filter(p=>C.shapes[p.type].ecology).length>7){b.failure='Encounter alive safety cap';return false;}
 if(layout.some(p=>{const d=C.shapes[p.type],count=layout.filter(q=>q.type===p.type).length;return d.special&&(g.discoveryRank<d.rank||g.alive.filter(s=>s.type===p.type).length+count>d.cap||(g.specialSpawns[p.type]||0)+count>(d.runCap||Infinity));})){b.failure='Account Rank or native part cap';return false;}
 // Whole-structure preflight, before any ID/RNG/ore/intro state is changed.
 let positions=null;for(const[dx,dy]of [[0,0],[-12,0],[12,0],[0,-12],[0,12]]){
  const points=layout.map(p=>({...p,x:p.x+dx,y:p.y+dy,radius:C.shapes[p.type].radius}));
  if(points.every((p,i)=>safePoint(g,p.x,p.y,p.radius)&&points.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>=p.radius+q.radius+C.spawnGap+2*C.motion.maxDrift))){positions=points;break;}
 }
 if(!positions){b.failure='No safe whole-structure placement';return false;}
 const made=positions.map(p=>g.addShape(p.type,p.x,p.y,0,false,C.spawnGrace,'normal',{bossPart:{structureId:b.structureId,phaseId:0,role:p.role,depthAnchor:Boolean(p.depthAnchor)}}));
 if(made.some(s=>!s))throw Error('Boss atomic commit violated');
 b.parts=made.map((shape,i)=>{shape.clusterId=`${b.structureId}:pocket${positions[i].cluster}`;shape.motion.ampX=shape.motion.ampY=0;shape.anchorX=shape.x;shape.anchorY=shape.y;shape.bossCore=positions[i].role==='core';return {shape,role:positions[i].role};});
 const portals=made.filter(s=>s.type==='portalGate');if(portals.length===2){const pairId=g.portalSequence++;for(let i=0;i<2;i++){portals[i].portalPartner=portals[1-i].id;portals[i].portalPairId=pairId;}g.oreSpawnCounts[portals[1].oreGrade]--;portals[1].oreGrade='common';g.oreSpawnCounts.common++;}
 for(const s of made.filter(s=>s.type==='conductor'))s.linkIds=near(g,s,115).slice(0,2).map(t=>t.id);
 b.placed=true;b.events.push({kind:'placed',at:g.simulationTime,ordinaryTier:g.highestTier,ids:made.map(s=>s.id)});return true;
}
function openBoss(g){const b=g.world?.boss;if(!b||b.open||!b.placed)return;const allRoles=role=>b.parts.filter(p=>p.role===role).every(p=>b.dead.has(p.shape.id)),v=b.latches;
 let open=false;switch(b.id){case'fractureWarden':open=allRoles('shield');break;case'relayCitadel':open=v.ward&&v.transmit;break;case'riftEngine':open=v.route;break;case'singularityCore':open=v.reactor&&v.phase;break;case'stormHeart':open=allRoles('anchor')&&v.linked;break;}
 if(g.world.depth===3&&open){b.nativeReady=true;open=v.depthAnchor&&v.depthBridge;if(!open)b.hint='DEPTH3: hit the outer Anchor and carry Chain5 across2 pockets';}
 b.phase=b.id==='stormHeart'?(allRoles('anchor')?1:0)+(open?1:0):open?1:0;
 if(open){for(const p of b.parts)p.shape.bossPart.phaseId=1;b.open=true;b.hint='Core OPEN · destroy the Star core';b.events.push({kind:'coreOpened',at:g.simulationTime});const core=b.parts.find(p=>p.role==='core').shape;g.presentation.emit({kind:'bossPhase',at:g.simulationTime,x:core.x,y:core.y,color:'#78e7c9'},g.options);g.onEvent?.('bossPhase');}
}
export function bossMetric(g,kind,event={}){const b=g.world?.boss;if(!b?.placed||b.cleared)return;const source=b.parts.find(p=>p.shape.id===(event.sourceShapeId??event.sourceId));if(!source)return;const v=b.latches;
 if(kind==='wardReleasesFromHexDeath'&&source.shape.type==='hex')v.ward=true;
 if(kind==='conductorDelivered'&&source.shape.type==='conductor'&&v.ward)v.transmit=true;
 if((kind==='reflection'&&source.shape.type==='mirror'||kind==='gravityBend'&&source.shape.type==='gravityWell'||kind==='portalPass'&&source.shape.type==='portalGate')&&event.small!==true)v.route=true;
 if(kind==='reactorStageWaveExecuted'&&source.shape.type==='reactor')v.reactor=true;
 openBoss(g);
}
export function bossDamageBlocked(g,s){const b=g.world?.boss;if(!b)return false;openBoss(g);const relayGuard=b.id==='relayCitadel'&&s.bossPart?.structureId===b.structureId&&s.type==='conductor'&&!b.latches.ward;if(relayGuard||s.bossCore&&!b.open){b.blocked++;g.onEvent?.('guard');g.presentation.emit({kind:'guard',at:g.simulationTime,x:s.x,y:s.y,color:'#bac9b3'},g.options);return true;}return false;}
export function bossDamaged(g,s,actual,cause){const b=g.world?.boss;if(!b?.placed||actual<=0)return;if(s.bossPart?.depthAnchor){b.latches.depthAnchor=true;openBoss(g);}
 if(b.id==='singularityCore'&&s.type==='phaseCrystal'&&s.bossPart?.structureId===b.structureId&&s.phaseWasVulnerable&&b.latches.reactor){b.latches.phase=true;b.events.push({kind:'phaseWindowHit',at:g.simulationTime,source:cause.source});openBoss(g);}
}
export function bossDeath(g,s,cause){const b=g.world?.boss;if(!b?.placed||b.cleared)return;
 if(s.bossPart?.structureId===b.structureId){b.dead.add(s.id);b.events.push({kind:'partDeath',id:s.id,role:s.bossPart.role,at:g.simulationTime,source:cause.source});}
 if(g.world.depth===3&&[...g.response.chains.values()].some(c=>c.kills>=5&&c.clusters.size>=2))b.latches.depthBridge=true;
 if(b.id==='stormHeart'&&[...g.response.chains.values()].some(c=>c.kills>=15&&c.clusters.size>=2))b.latches.linked=true;
 openBoss(g);if(s.bossCore&&s.bossPart?.structureId===b.structureId&&b.open){for(const p of b.parts)p.shape.bossPart.phaseId=3;b.cleared=true;b.clearAt=g.simulationTime;b.phase=3;b.hint='Structure destroyed · settle this Run to clear the World';b.events.push({kind:'coreDeath',at:g.simulationTime,source:cause.source});g.presentation.emit({kind:'bossClear',at:g.simulationTime,x:s.x,y:s.y,color:'#ffd884'},g.options);g.onEvent?.('bossClear');}
}
export function bossRecord(g){const b=g.world?.boss;return g.world?{worldId:g.world.id,depth:g.world.depth,bossRequested:g.world.bossRequested,boss:b?{id:b.id,phase:b.phase,open:b.open,placed:b.placed,cleared:b.cleared,clearAt:b.clearAt,failure:b.failure,hint:b.hint,blocked:b.blocked,latches:{...b.latches},parts:b.parts.map(p=>({id:p.shape.id,type:p.shape.type,role:p.role,x:p.shape.x,y:p.shape.y,hp:p.shape.hp,dead:p.shape.destroyed})),events:structuredClone(b.events)}:null}:null;}
