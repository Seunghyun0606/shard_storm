export const DESTRUCTION_STAGES=Object.freeze([
 Object.freeze({id:'shatter',name:'Shatter',index:1,level:0,next:15}),
 Object.freeze({id:'cascade',name:'Cascade',index:2,level:15,next:40}),
 Object.freeze({id:'overload',name:'Overload',index:3,level:40,next:75}),
 Object.freeze({id:'storm',name:'Storm',index:4,level:75,next:null})
]);
export function destructionStage(levels){const total=Object.values(levels).reduce((a,n)=>a+(Number.isInteger(n)&&n>0?n:0),0);return Object.freeze({...DESTRUCTION_STAGES.findLast(d=>total>=d.level),purchasedLevels:total});}
export function stageText(levels){const d=destructionStage(levels);return `${d.name} · ${d.purchasedLevels}Lv${d.next?` / next ${d.next}Lv`: ' · final destruction stage'}`;}
