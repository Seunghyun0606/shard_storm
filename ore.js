import { CONFIG as C } from './config.js';
export function oreChances(rank, scanner = 0) {
  return Object.fromEntries(Object.entries(C.ore).filter(([k])=>k!=='common').map(([k,v])=>[k,rank>=v.rank?v.chance+(k==='core'?.005*scanner:k==='void'?.001*scanner:0):0]));
}
export function rollOre(roll, rank, scanner=0) {
  const chances=oreChances(rank,scanner);
  for(const grade of ['void','core','prism']) { if(roll<chances[grade])return grade;roll-=chances[grade]; }
  return 'common';
}
export function dropOre(game, shape, cause) {
  if(shape.oreDropped)return;shape.oreDropped=true;
  const grade=shape.oreGrade||'common',ore=C.ore[grade];game.oreKills[grade]++;
  game.rewardExtra(ore.raw,'ore',shape,cause);game.pendingCatalyst+=ore.catalyst;
  if(grade==='core'&&game.levels.rareSeparator){game.rewardExtra(40*game.levels.rareSeparator,'skill',shape,{...cause,triggeredBySkill:'rareSeparator'});game.skillActivations.rareSeparator=(game.skillActivations.rareSeparator||0)+1;
    if(game.levels.rareSeparator>=2&&!game.firstCoreBonus){game.firstCoreBonus=true;game.pendingCatalyst++;game.rewardLog.push({at:game.simulationTime,shapeId:shape.id,chainId:cause.chainId,damageSource:cause.source,kind:'catalyst:rareSeparator',amount:1});}}
  if(ore.catalyst)game.rewardLog.push({at:game.simulationTime,shapeId:shape.id,chainId:cause.chainId,damageSource:cause.source,oreGrade:grade,kind:'catalyst:ore',amount:ore.catalyst});
}
