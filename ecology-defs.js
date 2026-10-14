export const ECOLOGY_SHAPES = {
  splitter:{name:'Splitter',hp:5,bonus:13,radius:23,color:'#91ded7',hue:170,sides:6,rank:0,tier:1,chance:.04,cap:3,symbol:'⋈'},
  fuseBomb:{name:'Fuse Bomb',hp:6,bonus:15,radius:24,color:'#ff886c',hue:14,sides:12,rank:0,tier:1,chance:.03,cap:3,symbol:'✹'},
  conductor:{name:'Conductor',hp:6,bonus:18,radius:25,color:'#ede085',hue:52,sides:6,rank:1,tier:2,chance:.025,cap:3,symbol:'ϟ'},
  mirror:{name:'Mirror',hp:8,bonus:26,radius:25,color:'#bdd2ff',hue:218,sides:4,rank:2,tier:2,chance:.02,cap:2,symbol:'◇'},
  gravityWell:{name:'Gravity Well',hp:10,bonus:32,radius:29,color:'#b392ea',hue:266,sides:24,rank:2,tier:3,chance:.018,cap:2,symbol:'⊙'},
  repairNode:{name:'Repair Node',hp:9,bonus:30,radius:26,color:'#98e8ae',hue:139,sides:8,rank:3,tier:3,chance:.015,cap:2,symbol:'+'}
};
export const TRAITS = {
  reinforced:{rank:1,chance:.025,symbol:'▣',exclude:['hex'],excludeEnhanced:true},
  volatile:{rank:1,chance:.025,symbol:'✴',exclude:['fuseBomb']},
  reflective:{rank:2,chance:.015,symbol:'↪',exclude:['mirror'],excludeCharged:true},
  hollow:{rank:2,chance:.015,symbol:'◌',exclude:['hex'],excludeEnhanced:true}
};
export const FORMATIONS = ['ringFormation','chainCorridor','shieldFortress','bombGarden'];
