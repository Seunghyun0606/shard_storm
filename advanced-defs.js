export const ADVANCED_SHAPES={
 portalGate:{name:'Portal Pair',hp:6,bonus:16,radius:22,color:'#72cfff',hue:202,sides:12,rank:2,tier:2,chance:.012,cap:2,symbol:'◎'},
 parasiteLink:{name:'Parasite Link',hp:8,bonus:22,radius:25,color:'#b4e87b',hue:91,sides:7,rank:2,tier:3,chance:.020,cap:2,symbol:'⌁'},
 phaseCrystal:{name:'Phase Crystal',hp:9,bonus:30,radius:26,color:'#c4b2ff',hue:258,sides:6,rank:3,tier:3,chance:.015,cap:2,symbol:'◈'},
 chainBeacon:{name:'Chain Beacon',hp:10,bonus:32,radius:28,color:'#ffd380',hue:39,sides:8,rank:3,tier:3,chance:.012,cap:2,symbol:'⚑'},
 shifter:{name:'Shifter',hp:7,bonus:24,radius:24,color:'#ffb9dc',hue:327,sides:5,rank:3,tier:4,chance:.017,cap:2,symbol:'⇥',drift:0},
 prismLens:{name:'Prism Lens',hp:9,bonus:40,radius:28,color:'#a8f1ef',hue:178,sides:10,rank:4,tier:4,chance:.009,cap:1,symbol:'⌘'}
};
export const ADVANCED_TRAITS={
 polarized:{rank:2,chance:.015,symbol:'±',exclude:['gravityWell','portalGate']},
 resonant:{rank:3,chance:.020,symbol:'≋',exclude:['reactor','ancient','prismLens']},
 timeLocked:{rank:3,chance:.015,symbol:'◷',exclude:['phaseCrystal']},
 fragmented:{rank:2,chance:.015,symbol:'⋰',exclude:['splitter','fuseBomb']}
};
export const ELITES={
 bombReactor:{name:'Bomb Reactor',rank:3,insight:2,types:['reactor','fuseBomb','triangle']},
 mirrorGravity:{name:'Mirror Gravity',rank:3,insight:4,types:['mirror','gravityWell']},
 shieldConductor:{name:'Shield Conductor',rank:3,insight:6,types:['hex','conductor','square']},
 phaseRepair:{name:'Phase Repair',rank:3,insight:8,types:['phaseCrystal','repairNode']},
 portalBeacon:{name:'Portal Beacon',rank:4,insight:10,types:['portalGate','portalGate','chainBeacon']},
 ancientPrism:{name:'Ancient Prism',rank:4,insight:12,types:['ancient','prismLens','square']}
};
export const TECHNIQUES={triangle:'Main-shard Chain: 5 normal deaths',square:'One native wave: 3 kills',pentagon:'One origin: 5 main-shard kills',star:'One native wave: 6 unique contacts',hex:'Release 2 wards from one Hex',reactor:'Both native stages execute',ancient:'All 3 stages execute and core dies',splitter:'Both Echo die in the same Chain',fuseBomb:'Two Fuse explosions in one Chain within 1s',conductor:'Deliver damage to 2 linked targets',mirror:'Reflected main shard kills',gravityWell:'Bent main shard kills',repairNode:'Heal 2 HP then destroy',portalGate:'Teleported main shard kills',parasiteLink:'Copied damage reaches 2 targets',phaseCrystal:'Direct final blow while vulnerable',chainBeacon:'Chain10 death wave executes',shifter:'Direct kill within 1s of a successful leap',prismLens:'Two sectors reach different normal targets'};
