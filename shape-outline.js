import {CONFIG as C} from './config.js';
const localCache=new WeakMap();
export function outlinePoints(s,variety=true){const cfg=C.shapes[s.type],stage=s.hp===s.maxHP?0:Math.min(3,Math.ceil((1-s.hp/s.maxHP)*3));let cached=localCache.get(s);
 if(!cached||cached.appearance!==s.appearance||cached.stage!==stage||cached.variety!==variety){const vertices=variety&&s.appearance?s.appearance.localVertices:Array.from({length:cfg.sides},(_,i)=>{const a=i*Math.PI*2/cfg.sides,r=(s.appearance?.baseRadius||s.radius)*(s.type==='star'&&i%2?cfg.innerRatio:1);return{x:Math.cos(a)*r,y:Math.sin(a)*r};}),points=[];for(let i=0;i<vertices.length;i++){const v=vertices[i];if(stage&&(s.appearance?.clippedCorners.slice(0,stage)||[0,1,2].slice(0,stage)).includes(i)){for(const n of [vertices[(i-1+vertices.length)%vertices.length],vertices[(i+1)%vertices.length]])points.push({x:v.x*.84+n.x*.16,y:v.y*.84+n.y*.16});}else points.push(v);}cached={appearance:s.appearance,stage,variety,points};localCache.set(s,cached);}
 const cos=Math.cos(s.angle),sin=Math.sin(s.angle);return cached.points.map(v=>({x:v.x*cos-v.y*sin,y:v.x*sin+v.y*cos}));
}
export function revealPath(points,progress){const p=Math.max(0,Math.min(1,progress));if(!points.length||p<=0)return[];const lengths=points.map((v,i)=>Math.hypot(v.x-points[(i+1)%points.length].x,v.y-points[(i+1)%points.length].y)),total=lengths.reduce((n,l)=>n+l,0),out=[{...points[0]}];let budget=total*p;
 for(let i=0;i<points.length&&budget>1e-9;i++){const from=points[i],to=points[(i+1)%points.length],length=lengths[i],fraction=Math.min(1,budget/length);out.push({x:from.x+(to.x-from.x)*fraction,y:from.y+(to.y-from.y)*fraction});budget-=length;}
 return out;
}
export function drawReveal(ctx,s,progress,scale=1,variety=true){const points=revealPath(outlinePoints(s,variety),progress);ctx.beginPath();points.forEach((v,i)=>(i===0?ctx.moveTo.bind(ctx):ctx.lineTo.bind(ctx))(v.x*scale,v.y*scale));ctx.stroke();}
