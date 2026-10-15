// M10 PRD values. Kept independent of CONFIG to avoid circular dependencies.
const rows = [
 ['weakpointScanner','Weakpoint Scanner','Direct','P',1,'crushPower',2,300,1,'HP≤50% 최초 직접 피해 +1/2 · 대상1회'],
 ['armorShatter','Armor Shatter','Direct','P',1,'crushPower',2,340,1,'최초 Reinforced/Hex 장갑 직접 관통 +1/2'],
 ['markedTarget','Marked Target','Direct','P',2,'precisionFracture',1,480,2,'직접 명중 표식1.5s · 다음 일반 파동 +1/2 · 소비1회'],
 ['chainStarter','Chain Starter','Direct','S',2,'impactPulse',1,900,6,'직접 최종타 보조1/피해1/65px · Chain3/Run12'],
 ['executionPulse','Execution Pulse','Direct','P',3,'crushPower',3,700,4,'특수 직접 최종타 .04s 파동60/75px·피해1·Run2/3'],
 ['piercingShard','Piercing Shard','Shard','S',2,'shardPower',3,950,6,'주 파편 추가1관통 · 사거리×.70 · 같은 대상 재적중 없음'],
 ['angularSplit','Angular Split','Shard','P',2,'shardBloom',1,450,3,'주 파편 최종타 보조1/2·피해1/60px · Chain3'],
 ['mirrorReturn','Mirror Return','Shard','P',2,'shardRange',2,520,3,'Mirror 반사 주 파편 최종타 파동45/60px·피해1·Run2/4'],
 ['ricochetBloom','Ricochet Bloom','Shard','S',3,'ricochetPlus',1,850,6,'첫 실제 벽 반사 보조2·피해1/80px · Chain2'],
 ['portalMomentum','Portal Momentum','Shard','P',3,'kineticReach',1,640,4,'Mirror/벽/Portal 주 파편 남은거리 +25/50px · 파편1회'],
 ['fuseAccelerator','Fuse Accelerator','Reaction','P',1,'chainAmplifier',1,380,2,'점화 -.10/.20s · 최소.30s'],
 ['conductiveSurge','Conductive Surge','Reaction','P',2,'echoCatalyst',1,520,4,'전도 피해+1 · Lv2 거리+15px · Chain4 유지'],
 ['delayedEcho','Delayed Echo','Reaction','S',3,'chainAmplifier',2,1050,8,'Square/Star 고유파동 .12s 뒤60px/피해1 · Run2'],
 ['resonanceBurst','Resonance Burst','Reaction','P',3,'resonanceLayer',1,760,5,'1초 내 다른 고유파동2회 →60/80px·피해1 · 대상1회/Run4'],
 ['chainOverdrive','Chain Overdrive','Reaction','S',4,'chainAmplifier',3,1450,12,'첫 정상 Chain15 →100px/피해2 지연파동 · Run1'],
 ['gravityBreak','Gravity Break','Control','P',2,'shardRange',2,500,3,'Gravity 사망 보조1/2·피해1/70px · Run4'],
 ['portalCalibration','Portal Calibration','Control','S',3,'mirrorReturn',1,950,7,'Mirror/Portal 방향 선택을 현재HP 최대 적격 대상으로'],
 ['phaseDisruptor','Phase Disruptor','Control','P',2,'crushSpeed',1,540,3,'움직이는 대상 최초 직접 hit: .8s 이동·회전 -20/35% · Phase 취약+.1/.2s'],
 ['magneticPolarity','Magnetic Polarity','Control','S',3,'gravityBreak',1,900,6,'Gravity 직접 최종타80px/피해1 · Run2 · Polar link 해제'],
 ['targetIntercept','Target Intercept','Control','P',2,'weakpointScanner',1,570,3,'움직이는 특수 최초 직접 hit +1/2 · 대상1회/Run5'],
 ['rareHarvest','Rare Harvest','Economy','P',2,'rareSeparator',1,490,3,'희귀 광석 완전 파괴 Raw+10/20 · Run400'],
 ['catalystExtraction','Catalyst Extraction','Economy','P',3,'salvageScanner',1,850,8,'직접 처치한 Hex/Reactor 기원 동일 Chain이 이후 일반10킬 달성: Catalyst+1 · Run1/2'],
 ['precisionSalvage','Precision Salvage','Economy','P',2,'precisionFracture',1,420,3,'특수 직접 최종타 Raw+15/30 · Run150'],
 ['contractScanner','Contract Scanner','Economy','S',2,'photonBoost',1,760,4,'첫3s 계약 적격 강조 · 계약별 첫 실제 조건 사망 Raw25 · Run75'],
 ['refineryCalibration','Refinery Calibration','Economy','P',3,'yieldStabilizer',1,920,5,'확정 Refinery Photon +floor(3/6%) · Run40 · 재추첨 없음'],
 ['splitterMastery','Splitter Mastery','Specialist','P',1,'shardBloom',1,480,4,'Echo 실제 사망 보조1·피해1/65px · Run2/4 · 자식 보상0'],
 ['fuseSymphony','Fuse Symphony','Specialist','S',2,'fuseAccelerator',1,820,7,'동일 Chain Fuse 실제폭발2회/1초 →90px/피해2 · Run1'],
 ['shieldInversion','Shield Inversion','Specialist','P',2,'impactPulse',1,570,4,'Hex 사망 Ward 해제60/70px/피해1 · Run1/2'],
 ['ancientBreaker','Ancient Breaker','Specialist','P',4,'crushPower',4,1300,9,'Ancient 체력 문턱 최초 직접 +1/2 · 단계당1회/도형3회'],
 ['prismaticCascade','Prismatic Cascade','Specialist','S',3,'mirrorReturn',1,1050,9,'Mirror/Lens 굴절 주 파편 첫 최종타 보조1·피해1/80px · Run2']
];
export const EXPANSION_SKILLS=Object.fromEntries(rows.map(([id,name,branch,type,rank,parent,minLevel,baseCost,c,subtitle],i)=>[id,{
 id,name,branch,type,rank,baseCost,catalyst:type==='S'?[c]:[c,2*c],max:type==='S'?1:2,subtitle,
 introduced:10,prerequisites:[{id:parent,minLevel}],position:{col:Math.floor(i/5),row:9+i%5},implemented:true
}]));
export const SIGNATURE_IDS=rows.filter(r=>r[3]==='S').map(r=>r[0]);
const levelValues={weakpointScanner:['피해+1','피해+2'],armorShatter:['관통+1','관통+2'],markedTarget:['다음 일반 파동+1','다음 일반 파동+2'],executionPulse:['60px·Run2','75px·Run3'],angularSplit:['보조1개','보조2개'],mirrorReturn:['45px·Run2','60px·Run4'],portalMomentum:['거리+25px','거리+50px'],fuseAccelerator:['점화-.10초','점화-.20초'],conductiveSurge:['전도 피해+1','전도 피해+1·거리+15px'],resonanceBurst:['반경60px','반경80px'],gravityBreak:['보조1개','보조2개'],phaseDisruptor:['.8초간20%감속·Phase+.1초','.8초간35%감속·Phase+.2초'],targetIntercept:['피해+1','피해+2'],rareHarvest:['희귀 Raw+10','희귀 Raw+20'],catalystExtraction:['Catalyst1·Run1','Catalyst1·Run2'],precisionSalvage:['Raw+15','Raw+30'],refineryCalibration:['Photon+3%','Photon+6%'],splitterMastery:['Run2','Run4'],shieldInversion:['60px·Run1','70px·Run2'],ancientBreaker:['문턱 피해+1','문턱 피해+2']};
export function expansionDescription(id,level) {
 const d=EXPANSION_SKILLS[id];if(!d)return '';
 if(!level)return `미보유 · ${d.subtitle}`;
 return `${levelValues[id]?.[level-1]||'Signature · 선택 시 발동'} · ${d.subtitle}`;
}
export const EVOLUTION_FAMILIES={
 direct:{name:'Direct',rank:2,prerequisite:{id:'crushPower',minLevel:5},forms:{armorBypass:'최초 장갑 직접 피해+2 · Run6',markDetonator:'표식 소비65px/피해1 · Run3',focusStrike:'직접 피해+2 · 공격 간격+.04s'}},
 shard:{name:'Shard',rank:2,prerequisite:{id:'shardPower',minLevel:5},forms:{piercing:'주 파편 추가1관통 · 거리-35px',ricochet:'첫 벽 반사 남은거리+50px · 파편1회',scatter:'첫 주 파편 최종타 보조2·피해1/65px · Chain2'}},
 shockwave:{name:'Shockwave',rank:3,prerequisite:{id:'chainAmplifier',minLevel:3},forms:{wide:'Square/Star 고유파동 반경+20/피해-1(최소1)',focused:'Square/Star 고유파동 반경-20/피해+1',echo:'고유파동 실제 최종타 .10s 뒤55px/피해1 · Run2'}},
 reactor:{name:'Reactor',rank:3,prerequisite:{id:'resonanceLayer',minLevel:2},forms:{quick:'단계 지연-.02s(최소.01)/피해-1(최소1)',delayed:'단계 지연+.12s/피해+2',charge:'동일 Chain 단계 실제발동2회 →75px/피해1 · Run1'}},
 gravity:{name:'Gravity',rank:3,prerequisite:{id:'gravityBreak',minLevel:2},forms:{pull:'굴절 누적cap+15° · 주 파편 거리-30px',push:'Gravity 사망70px/피해1 · Run2',orbit:'근방 .08s 추가 굴절 · 추가누적30°/파편1회'}}
};
export const EVOLUTION_COSTS=[{photon:1600,catalyst:20},{photon:2100,catalyst:30},{photon:2600,catalyst:40}];
export const BUILD_PRESETS={
 Crusher:{signatures:['chainStarter','contractScanner','magneticPolarity'],evolutions:[{family:'direct',form:'focusStrike'},{family:'shockwave',form:'focused'}]},
 Cascade:{signatures:['piercingShard','ricochetBloom','prismaticCascade'],evolutions:[{family:'shard',form:'ricochet'},{family:'gravity',form:'pull'}]},
 Reactor:{signatures:['delayedEcho','fuseSymphony','chainOverdrive'],evolutions:[{family:'reactor',form:'delayed'},{family:'shockwave',form:'echo'}]}
};
