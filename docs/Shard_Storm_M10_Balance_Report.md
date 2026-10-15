# M10 Skill Expansion — Balance Report

## 방법과 증거

총 **72,000 실제 전투·정산 Run / 240경로**. 5시드×3빌드×Fresh/LegacyMax×기본20초/Extra Time×M9/PermOnly/Signature3/Evolution2. 코드 서명 `9bf0f4189a6e49af3b9f63eb568b730edae7e9ea354f3707269f098ab90ab334`. 각 경로300회, 동일 Run번호는 동일 seed+Run×7919와 같은 자동 조준 정책을 사용했습니다. Fresh는 지급 없이 구매 가능 시에만 성장합니다. LegacyMax는 기존19스킬 MAX와 초기10000 Photon/200 Catalyst를 주입한 비교 계정입니다. 실제 사용자 저장은 사용하지 않았습니다.

Fixed20은 Extra Time 구매와 별개로 전투를20초에 고정합니다. ExtraTime 경로는 구매 레벨에 따라20~32초입니다. 결과는 시드5개 중앙값이며 자동 입력의 성능이지 사람의 재미가 아닙니다. 원본: [집계](../artifacts/m10-balance-results.json), sourceFiles의 gzip 체크포인트.

## Fresh / 20초 고정 성장

|빌드|기능|Run|구매 레벨|남은 노드|Photon 잔고|Catalyst 잔고|그 Run 파괴|그 Run Photon|최고 Chain|빈 화면(s)|
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
|Crusher|M9|5|8|19|58|0|226|361|13|0.00|
|Crusher|M9|20|35|9|110|83|304|433|11|0.00|
|Crusher|M9|50|50|0|5326|318|302|609|12|0.00|
|Crusher|M9|100|50|0|37638|1108|304|638|12|0.00|
|Crusher|M9|200|50|0|100191|2642|304|665|13|0.00|
|Crusher|M9|300|50|0|162527|4146|302|618|10|0.00|
|Crusher|PermOnly|5|8|49|58|0|226|361|13|0.00|
|Crusher|PermOnly|20|31|41|70|66|304|403|13|0.00|
|Crusher|PermOnly|50|66|25|128|295|303|596|13|0.00|
|Crusher|PermOnly|100|99|1|1087|746|302|728|10|0.00|
|Crusher|PermOnly|200|100|0|67762|2248|302|730|13|0.00|
|Crusher|PermOnly|300|100|0|137739|3778|305|710|10|0.00|
|Crusher|Signature3|5|8|49|58|0|226|361|13|0.00|
|Crusher|Signature3|20|31|41|70|66|304|403|13|0.00|
|Crusher|Signature3|50|66|24|54|296|303|595|13|0.00|
|Crusher|Signature3|100|99|1|1087|737|304|698|10|0.00|
|Crusher|Signature3|200|100|0|67736|2243|303|738|12|0.00|
|Crusher|Signature3|300|100|0|137849|3768|305|716|10|0.00|
|Crusher|Evolution2|5|8|49|58|0|226|361|13|0.00|
|Crusher|Evolution2|20|31|41|70|66|304|403|13|0.00|
|Crusher|Evolution2|50|66|24|54|296|303|595|13|0.00|
|Crusher|Evolution2|100|99|1|1087|737|304|698|10|0.00|
|Crusher|Evolution2|200|100|0|35300|1787|300|701|15|0.00|
|Crusher|Evolution2|300|100|0|104710|3276|301|718|12|0.00|
|Cascade|M9|5|8|18|58|0|246|530|14|0.00|
|Cascade|M9|20|34|10|79|84|302|696|13|0.00|
|Cascade|M9|50|50|0|5373|327|302|617|12|0.00|
|Cascade|M9|100|50|0|37402|1105|304|638|12|0.00|
|Cascade|M9|200|50|0|99862|2641|304|665|13|0.00|
|Cascade|M9|300|50|0|162217|4140|302|618|10|0.00|
|Cascade|PermOnly|5|8|48|58|0|246|530|14|0.00|
|Cascade|PermOnly|20|30|41|15|74|304|583|14|0.00|
|Cascade|PermOnly|50|67|24|138|318|304|572|13|0.02|
|Cascade|PermOnly|100|99|1|921|755|302|728|10|0.00|
|Cascade|PermOnly|200|100|0|67855|2272|302|730|13|0.00|
|Cascade|PermOnly|300|100|0|138256|3780|305|710|10|0.00|
|Cascade|Signature3|5|8|48|58|0|246|530|14|0.00|
|Cascade|Signature3|20|30|41|15|74|304|583|14|0.00|
|Cascade|Signature3|50|67|24|67|312|301|615|12|0.00|
|Cascade|Signature3|100|99|1|1304|755|302|689|12|0.00|
|Cascade|Signature3|200|100|0|67594|2258|304|724|11|0.00|
|Cascade|Signature3|300|100|0|137823|3746|303|704|11|0.00|
|Cascade|Evolution2|5|8|48|58|0|246|530|14|0.00|
|Cascade|Evolution2|20|30|41|15|74|304|583|14|0.00|
|Cascade|Evolution2|50|67|24|67|312|301|615|12|0.00|
|Cascade|Evolution2|100|99|1|1304|755|302|689|12|0.00|
|Cascade|Evolution2|200|100|0|36130|1812|303|708|11|0.00|
|Cascade|Evolution2|300|100|0|106310|3303|303|711|13|0.00|
|Reactor|M9|5|8|18|66|0|287|474|17|0.00|
|Reactor|M9|20|36|9|107|89|304|659|12|0.00|
|Reactor|M9|50|50|0|6476|342|303|627|13|0.00|
|Reactor|M9|100|50|0|38210|1114|302|600|12|0.00|
|Reactor|M9|200|50|0|100639|2650|306|708|11|0.00|
|Reactor|M9|300|50|0|163652|4178|301|626|13|0.00|
|Reactor|PermOnly|5|8|48|66|0|287|474|17|0.00|
|Reactor|PermOnly|20|33|40|39|79|301|607|18|0.00|
|Reactor|PermOnly|50|68|24|220|315|303|591|13|0.00|
|Reactor|PermOnly|100|100|0|1016|770|304|700|11|0.00|
|Reactor|PermOnly|200|100|0|69266|2282|305|724|11|0.00|
|Reactor|PermOnly|300|100|0|140039|3821|304|726|10|0.00|
|Reactor|Signature3|5|8|48|66|0|287|474|17|0.00|
|Reactor|Signature3|20|33|40|39|79|301|607|18|0.00|
|Reactor|Signature3|50|68|24|220|315|303|591|13|0.00|
|Reactor|Signature3|100|100|0|915|769|304|700|11|0.00|
|Reactor|Signature3|200|100|0|69084|2281|305|724|11|0.00|
|Reactor|Signature3|300|100|0|139984|3821|304|726|10|0.00|
|Reactor|Evolution2|5|8|48|66|0|287|474|17|0.00|
|Reactor|Evolution2|20|33|40|39|79|301|607|18|0.00|
|Reactor|Evolution2|50|68|24|220|315|303|591|13|0.00|
|Reactor|Evolution2|100|99|1|1001|769|304|700|11|0.00|
|Reactor|Evolution2|200|100|0|38400|1830|304|751|11|0.00|
|Reactor|Evolution2|300|100|0|108644|3366|304|725|10|0.00|

## 후반 경제와 Form 소유

|계정|시간|빌드|기능|300 Run 잔고|Catalyst|소유 Evolution 수|
|---|---|---|---|---:|---:|---:|
|Fresh|Fixed20|Crusher|Evolution2|104710|3276|15|
|Fresh|Fixed20|Cascade|Evolution2|106310|3303|15|
|Fresh|Fixed20|Reactor|Evolution2|108644|3366|15|
|Fresh|ExtraTime|Crusher|Evolution2|221680|5916|15|
|Fresh|ExtraTime|Cascade|Evolution2|224803|5990|15|
|Fresh|ExtraTime|Reactor|Evolution2|227134|6056|15|
|LegacyMax|Fixed20|Crusher|Evolution2|145126|3998|15|
|LegacyMax|Fixed20|Cascade|Evolution2|147132|3993|15|
|LegacyMax|Fixed20|Reactor|Evolution2|148235|4053|15|
|LegacyMax|ExtraTime|Crusher|Evolution2|273690|6833|15|
|LegacyMax|ExtraTime|Cascade|Evolution2|275293|6890|15|
|LegacyMax|ExtraTime|Reactor|Evolution2|275825|6892|15|

Evolution 전15형태의 합계 비용은31500 Photon/450 Catalyst이며 각 형태를 소유해도 동시에2계열만 활성화합니다. 전15형태를 실제 구매한 경로는 60/60, 최초 구매 완료 Run 중앙값: 99 (완료 경로만의 통계, Fresh/LegacyMax 및20/ExtraTime을 포함). 기본 스킬 가격·기존 재화·Refinery 변환율은 일괄 변경하지 않았습니다. 자동 조준의 효율로 생긴 후반 잉여를 사람에게 동일하게 적용하지 않습니다.

## A/B/C Form 통제 비교

별도200Run: 5시드×20/32초×5계열×NONE/A/B/C. 같은 계열 내 동일3 Signature·Coil/Governor·49스킬 MAX fixture. 구매 비용이나 자연 성장 속도는 이 비교에서 추정하지 않습니다.

|계열|형태|20초 파괴 중앙값|32초 파괴 중앙값|20초 Photon|32초 Photon|해당 Form 발동 합계|
|---|---|---:|---:|---:|---:|---:|
|direct|NONE|304|484|719|1139|-|
|direct|armorBypass|304|484|719|1139|60|
|direct|markDetonator|304|484|719|1139|17|
|direct|focusStrike|304|482|734|1151|1396|
|shard|NONE|305|484|716|1117|-|
|shard|piercing|301|486|732|1148|1017|
|shard|ricochet|304|481|725|1102|3627|
|shard|scatter|301|485|741|1117|810|
|shockwave|NONE|306|484|711|1139|-|
|shockwave|wide|303|483|738|1110|1309|
|shockwave|focused|303|481|737|1108|1312|
|shockwave|echo|306|484|711|1139|20|
|reactor|NONE|306|485|711|1121|-|
|reactor|quick|303|483|719|1124|194|
|reactor|delayed|303|484|728|1109|187|
|reactor|charge|306|485|711|1121|10|
|gravity|NONE|304|482|716|1136|-|
|gravity|pull|303|482|744|1126|1443|
|gravity|push|304|482|716|1136|20|
|gravity|orbit|304|482|737|1136|1233|

공칭 기본 생성은.20초×3개(초당15개)입니다. 강화 fixture가 화면을 빠르게 비우면 파괴 수는20초 약300/32초 약480 부근의 생성 공급에 제한될 수 있습니다. 같은 파괴 수가 나온 Form도 실제 발동·대상 선택·실수 허용도는 다르므로, 이 비교만으로 효과 없음이나 동일한 재미를 결론 내리지 않습니다. 발동 합계0인 자연 조합도0으로 표시하고, 그 Form의 실제 동작은 별도 통제 단위 테스트에서 검증합니다.

## 신규30노드 실제 발동 빈도

|신규 노드|종류|72,000 성장 Run 발동|200 Form fixture 발동|
|---|---|---:|---:|
|Weakpoint Scanner|P|1443377|6589|
|Armor Shatter|P|590055|2212|
|Marked Target|P|9023557|36067|
|Chain Starter|S|136344|480|
|Execution Pulse|P|149342|600|
|Piercing Shard|S|1328306|4379|
|Angular Split|P|5455088|21106|
|Mirror Return|P|108598|541|
|Ricochet Bloom|S|1951284|6966|
|Portal Momentum|P|22758792|91548|
|Fuse Accelerator|P|500861|2132|
|Conductive Surge|P|69374|357|
|Delayed Echo|S|22498|160|
|Resonance Burst|P|190235|784|
|Chain Overdrive|S|1287|13|
|Gravity Break|P|150955|740|
|Portal Calibration|S|0|110|
|Phase Disruptor|P|7306646|30788|
|Magnetic Polarity|S|9771|108|
|Target Intercept|P|246040|1000|
|Rare Harvest|P|976180|4000|
|Catalyst Extraction|P|1488|5|
|Precision Salvage|P|254780|1000|
|Contract Scanner|S|525|0|
|Refinery Calibration|P|44871|200|
|Splitter Mastery|P|184518|800|
|Fuse Symphony|S|2014|7|
|Shield Inversion|P|90264|399|
|Ancient Breaker|P|11893|27|
|Prismatic Cascade|S|15016|118|

성장 실험은3개 샘플 빌드에서 실제 소유·활성·조건을 만족한 발동만 집계합니다.200 Form 비교는 MAX fixture이며10개 Signature를 여러 조합에 분산합니다.0은 이 정책에서 사용/발동하지 못했다는 뜻입니다. 모든30노드의 실제 효과·비활성0·실패 조건은 별도 Game 단위 테스트에서 확인했습니다. Contract Scanner처럼 계약 진행 조건에 묶인 능력은 기존 계약 소진 후의 활용 한계를 따로 관찰해야 하며, 기존 완료 기록을 초기화하지 않습니다.

## 정확성·성능 한계

late contact 0, 최대 projectile contact error 9.999999974752427e-7px, wave 9.999983916486599e-7px. 안전 상한을 실제로 만난 Run 6021/72000; 종류별 합계 `{"depth":2653,"tickIterations":304356}`. 기존150shards/10depth/400chainEvents/64waves/1024scheduled/512tickIterations는 유지했습니다. 병렬 성장 worker의 CPU 수치를 브라우저 FPS나 격리 성능으로 해석하지 않습니다. 기존512 iteration cap에 도달하면 남은 tick 구간이 생략되는 제한은 그대로 기록합니다.

전체 성장 worker 종료 후 단독90Run으로 M9 커밋17dcc954와 동결된 M10 소스를 비교했습니다. OFF의 파괴/Raw/Photon은 정확히 일치합니다. Rank0은0레벨, Rank4 기준선/OFF는19 MAX, ON은49 MAX입니다. Signature/Evolution/Relic/Contract는 비활성이고, 활성 빌드 조합과 Form의 결과는 앞의 별도 실험에서 비교했습니다. update CPU만 측정하므로 Chrome FPS를 뜻하지 않습니다.

|모드|Rank|Run당 update p95 중앙값(ms)|파괴 중앙값|
|---|---:|---:|---:|
|M9|0|0.077|130|
|M9|4|0.165|305|
|M10_OFF|0|0.075|130|
|M10_OFF|4|0.169|305|
|M10_ON|0|0.076|130|
|M10_ON|4|0.234|303|

## 조정 판단과 사람 검증

가격·변환율 일괄 인상이나 기존 자산 초기화는 하지 않았습니다. Catalyst Extraction만 사용자 승인 A안(직접 Hex/Reactor 처치로 시작한 동일 Chain의 이후 정상10킬)으로 확정했습니다. 가격850 Photon/8 Catalyst, Run 지급 상한1/2는 명세대로 유지합니다. 다른 Chain과 Echo는 포함하지 않습니다.

이 M10 장기 결과의 서명은 schema7/커밋2f75e4f의 동결 소스입니다. 이후 M11에서 발견한 실제 Chrome 저장 용량 문제는 사용자 승인에 따라 schema8 동일 키의 무손실 압축으로 해결했습니다. M10의 전체 기록도 보존하며, [저장 결정과 검증](Shard_Storm_Save_Capacity_Decision.md)을 참조하세요.

사람은 Signature3·Evolution2의 기회비용이 읽히는지, Focus Strike의 공격 간격 손해·Pull의 거리 손해·Quick의 피해 손해가 실제 선택을 만드는지, Form 미구매 상태가 성장을 부당하게 막는지, 후반 잉여가 생겨도 다른 빌드를 시험할 이유가 있는지 확인해야 합니다. M11의 행동 수집·Elite는 별도 검증하며 사람의 재미를 자동 입력으로 확정하지 않습니다.
