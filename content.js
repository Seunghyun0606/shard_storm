import { CONFIG as C } from './config.js';
import { poseAt } from './motion.js';
const normal = s => !C.shapes[s.type].special;
export function specialType(game) {
  const tier=game.highestTier,roll=game.specialRng();let cursor=0;
  for(const [key,d] of Object.entries(C.shapes).filter(([,d])=>d.special)){
    if(game.discoveryRank<d.rank||tier<d.tier)continue;
    const eligible=game.alive.filter(s=>s.type===key).length<d.cap&&(game.specialSpawns[key]||0)<(d.runCap||Infinity);
    if(game.welcomeFlags[d.rank]&&eligible)return key;
    cursor+=d.chance;if(roll<cursor)return eligible?key:null;
  }
  return null;
}
export function linkWards(game) {
  const W=C.specialEffects.ward;
  for(const hex of game.alive.filter(s=>s.type==='hex')){
    const held=game.alive.filter(s=>s.wardSourceId===hex.id);
    const candidates=game.alive.filter(s=>normal(s)&&!s.wardSourceId&&Math.hypot(s.x-hex.x,s.y-hex.y)<=W.radius).sort((a,b)=>Math.hypot(a.x-hex.x,a.y-hex.y)-Math.hypot(b.x-hex.x,b.y-hex.y)||a.id-b.id);
    for(const s of candidates.slice(0,W.targets-held.length))s.wardSourceId=hex.id;
  }
}
export function shieldDamage(game,s,damage,cause) {
  if(s.wardSourceId)damage=Math.max(0,damage-C.specialEffects.ward.reduction);
  if(s.type==='hex'&&!s.shieldBroken){s.shieldBroken=true;if(cause.source!=='direct'||damage<4)damage=Math.min(1,damage);}
  return damage;
}
export function cleanupWards(game,all=false) {
  for(const s of game.shapes)if(all||s.destroyed||(s.wardExpiresAt!==undefined&&game.simulationTime>=s.wardExpiresAt-1e-9)){delete s.wardSourceId;delete s.wardExpiresAt;}
}
export function hexDeath(game,s,cause) {
  const W=C.specialEffects.ward,children=game.alive.filter(t=>t.wardSourceId===s.id);
  for(const t of children)t.wardExpiresAt=game.simulationTime+W.failsafe;
  const child={...cause,source:'ward-release',depth:cause.depth+1,wardRelease:s.id};
  game.scheduleEffect(()=>game.area(s,W.radius,0,child,C.shapes.hex.color),child,W.releaseDelay);
  game.scheduleEffect(()=>{for(const t of children)if(t.wardSourceId===s.id){delete t.wardSourceId;delete t.wardExpiresAt;}},child,W.failsafe);
}
export function specialPlan(game,forceCluster) {
  if(game.discoveryRank<2||game.contentMode!=='M5_M6_ON'||!forceCluster)return null;
  const hex=game.alive.find(s=>s.type==='hex'&&game.alive.filter(t=>t.wardSourceId===s.id).length<2);
  if(hex){const angle=game.patternRng()*Math.PI*2;return{kind:'shield_pocket',anchor:hex,index:0,points:[0,1].map(i=>({x:hex.anchorX+Math.cos(angle+i*Math.PI)*76,y:hex.anchorY+Math.sin(angle+i*Math.PI)*76}))};}
  game.tetherAttempts++;
  if(game.patternRng()>=C.specialEffects.tetherChance)return null;
  const a=game.alive.find(normal);if(!a)return null;
  const x=Math.min(C.arena.right-100,Math.max(C.arena.left+100,a.anchorX)),y=Math.min(C.arena.bottom-45,Math.max(C.arena.top+45,a.anchorY+90));
  return{kind:'tether_pair',index:0,anchor:a,points:[{x:x-42,y},{x:x+42,y}],pair:[]};
}
export function applyTether(game,plan,s,attempt) {
  if(plan?.kind!=='tether_pair'||attempt!==0||!normal(s))return;
  plan.pair.push(s);s.motion.profile='tether';s.motion.startAt=Infinity;
  if(plan.pair.length===2){const [a,b]=plan.pair;for(const [i,t]of [a,b].entries())Object.assign(t.motion,{startAt:game.elapsed,ampX:C.motion.maxDrift/2,ampY:0,phaseX:i*Math.PI,phaseY:0,speedX:Math.PI*2/4,speedY:0});game.tetherPairs++;}
}
