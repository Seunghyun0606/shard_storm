import {Game} from '../game.js';
import {CONFIG as C} from '../config.js';
import {freshSave} from '../storage.js';
import {normalizeCampaign,WORLDS} from '../campaign/worlds.js';
import {chooseTarget} from './simulation.js';
import {phaseVulnerable} from '../advanced-shapes.js';
export const maximum=Object.fromEntries(Object.entries(C.upgrades).map(([id,u])=>[id,u.max]));
export function readyWorld(id,rank=4,levels=maximum){const s=freshSave();s.sandbox=true;s.bank=1000;s.catalystBalance=100;s.discoveryRank=rank;s.lifetimeDestroyed=[0,300,1200,3500,8000][rank];s.levels={...levels};
 for(const key of Object.keys(WORLDS)){if(key<id)s.worldBossHistory[key].clears=1;Object.assign(s.worldSurveyProgress[key],{runs:2,normalKills:20,chain5:1,circuitKills:4,circuitRuns:2,routeKills:1,reactorWaves:2,phaseKills:1,linkedChain15:1});}
 Object.assign(s,normalizeCampaign(s));s.worldSelected=id;return s;
}
export function worldGame(save,id,{seed=31415,duration=20,bossChallenge=true,...rest}={}){return new Game({seed,runId:`world-${id}-${seed}-${bossChallenge}-${duration}`,levels:save.levels,discoveryRank:save.discoveryRank,duration,sandbox:true,worldSave:save,worldId:id,bossChallenge,destructionEnabled:true,ecologyEnabled:true,advancedEnabled:true,skillExpansionEnabled:true,elitePolicy:'M12_run20_pity6',elitePity:save.elitePity,...rest});}
export function bossTarget(g){const b=g.world?.boss;if(!b)return chooseTarget(g);if(!b.placed||b.failure)return null;if(b.cleared)return chooseTarget(g);const live=role=>b.parts.filter(p=>p.role===role&&!p.shape.destroyed&&p.shape.grace<=0).map(p=>p.shape),type=t=>b.parts.find(p=>p.shape.type===t&&!p.shape.destroyed&&p.shape.grace<=0)?.shape;
 if(b.open)return live('core')[0];
 if(g.world.depth===3){const anchor=b.parts.find(p=>p.shape.bossPart.depthAnchor&&!p.shape.destroyed&&p.shape.grace<=0)?.shape;if(anchor&&!b.latches.depthAnchor)return anchor;if(b.nativeReady)return g.alive.filter(s=>!s.bossCore&&s.grace<=0).sort((a,b)=>a.hp-b.hp||a.id-b.id)[0];}
 switch(b.id){case'fractureWarden':return live('shield')[0];case'relayCitadel':return !b.latches.ward?type('hex'):type('conductor');case'riftEngine':{const root=type('triangle');if(root)return root;const death=b.events.find(e=>e.kind==='partDeath'&&e.id===b.parts.find(p=>p.shape.type==='triangle')?.shape.id);if(death&&g.elapsed-death.at<1)return null;return type('mirror')||chooseTarget(g);}case'singularityCore':{if(!b.latches.reactor)return type('reactor');const p=type('phaseCrystal');return p&&phaseVulnerable(g,p)?p:type('reactor');}case'stormHeart':{const first=b.events.find(e=>e.kind==='partDeath'&&e.role==='anchor');if(first&&g.elapsed-first.at<1.5)return null;return live('anchor')[0]||live('relay')[0];}default:return null;}}
export function playWorld(save,id,options={}){const g=worldGame(save,id,options);let next=.2;
 while(g.state==='PLAYING'){if(g.elapsed>=next-1e-9){const s=bossTarget(g);if(s)g.attack(s.x,s.y);next+=g.stats.attackInterval;}g.update(C.step);}
 return g;
}
