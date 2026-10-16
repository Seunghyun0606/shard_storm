import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {chooseTarget} from './simulation.js';
import {traceShard} from '../effects.js';
const levels=Object.fromEntries(Object.entries(C.upgrades).map(([k,u])=>[k,u.max]));
let found=0;
for(let seed=1;seed<=150&&!found;seed++){
 const g=new Game({seed,levels,discoveryRank:4,duration:20,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,sandbox:true});
 const cap=g.cap.bind(g);g.cap=(kind,...args)=>{if(kind==='tickIterations'&&!found){found++;console.log(JSON.stringify({seed,at:g.elapsed,shards:g.shards.filter(s=>!s.dead).map(s=>{const path=traceShard(g,s,C.shard.speed/120);return{id:s.id,type:s.source,age:s.age,life:s.life,distance:s.distance,range:s.range,hit:path.hit?.id,pathDistance:path.distance,wall:path.wallDead};}),queue:g.queue.slice(0,3).map(e=>({at:e.scheduledTime,kind:e.kind})),waves:g.waves.map(w=>({id:w.id,bornAt:w.bornAt,r:w.radius,max:w.maxRadius}))}));}cap(kind,...args);};
 let next=.2;g.attack(480,335);
 while(g.state==='PLAYING'&&!found){if(g.elapsed>=next){const s=chooseTarget(g);if(s)g.attack(s.x,s.y);next+=g.stats.attackInterval;}g.update(C.step);}
}
if(!found)console.log('No capped path in this sample');
