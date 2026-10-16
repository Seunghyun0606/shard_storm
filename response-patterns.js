import {CONFIG as C} from './config.js';
import {safePoint} from './ecology.js';
export const RESPONSE_PATTERNS=Object.freeze({
 linkPocket:{count:4,offsets:[[0,0,0],[85,0,0],[-42.5,74,0],[-42.5,-74,0]]},
 bridgeCorridor:{count:6,offsets:[[-100,-50,0],[-100,50,0],[0,0,1],[100,-50,2],[100,50,2],[0,100,1]]},
 stormCrown:{count:8,offsets:[[-155,-60,0],[-70,-60,0],[-155,30,0],[25,0,1],[110,0,1],[25,90,1],[180,90,2],[180,-90,2]]}
});
function eligible(g,type,counts){const d=C.shapes[type];return !d.special||(g.contentMode==='M5_M6_ON'&&(!d.ecology||g.ecologyEnabled)&&(!d.advanced||g.advancedEnabled)&&g.discoveryRank>=d.rank&&g.highestTier>=d.tier&&g.alive.filter(s=>s.type===type).length+(counts[type]||0)<d.cap&&(g.specialSpawns[type]||0)+(counts[type]||0)<(d.runCap||Infinity)&&(!d.ecology||d.advanced||g.alive.filter(s=>C.shapes[s.type].ecology&&!C.shapes[s.type].advanced).length+Object.entries(counts).reduce((n,[id,k])=>n+(C.shapes[id].ecology&&!C.shapes[id].advanced?k:0),0)<7));}
export function responseLayout(g,request){
 const pattern=RESPONSE_PATTERNS[request.kind],counts={},types=[];
 const anchors=request.kind==='linkPocket'?['conductor','fuseBomb','hex']:['mirror','gravityWell','conductor','fuseBomb'];
 for(let i=0;i<pattern.count;i++){
  let type=i===0?anchors.find(t=>eligible(g,t,counts)):i%3===1?'square':'triangle';
  if(!type)type='square';if(request.kind==='stormCrown'&&i===6&&g.highestTier>=2)type='star';
  types.push(type);counts[type]=(counts[type]||0)+1;
 }
 if(g.alive.length+types.length>g.target)return null;
 for(let attempt=0;attempt<80;attempt++){
  const angle=attempt<8?attempt*Math.PI/4:g.responseRng()*Math.PI*2;
  const anchor=g.alive.filter(s=>['mirror','gravityWell','conductor'].includes(s.type))[0];
  const center=attempt===0&&anchor?{x:anchor.x+110,y:anchor.y}:{x:200+g.responseRng()*560,y:190+g.responseRng()*200};
  const points=pattern.offsets.map(([dx,dy,cluster],i)=>({x:center.x+dx*Math.cos(angle)-dy*Math.sin(angle),y:center.y+dx*Math.sin(angle)+dy*Math.cos(angle),cluster,type:types[i],radius:C.shapes[types[i]].radius}));
  if(points.every((p,i)=>safePoint(g,p.x,p.y,p.radius)&&(!g.spawnPointAllowed||g.spawnPointAllowed(p.x,p.y,p.radius))&&points.every((q,j)=>i===j||Math.hypot(p.x-q.x,p.y-q.y)>=p.radius+q.radius+C.spawnGap+2*C.motion.maxDrift)))return points;
 }
 return null;
}
