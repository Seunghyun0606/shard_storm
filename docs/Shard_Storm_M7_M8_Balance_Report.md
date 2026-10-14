# Shard Storm M7 · M8 Balance Report

최종 실제 시뮬레이션 데이터: [balance JSON](../artifacts/m7-m8-balance.json), 경로별 압축 원본은 JSON의 sourceFiles에 있습니다. 자동 입력은 사람의 재미·성공률·조준 실력을 대표하지 않습니다.

## 방법

69,420 실제 전투 Run: 180 기본경로 ×300 =54,000 + 45 정책경로 ×300 =13,500 + 5 distinct-seed 경로 ×300 =1,500 + 420 단독/조합/Anomaly 비교. 시드31415/1/7/42/99, Crusher/Cascade/Reactor, Fresh/LegacyMax, OFF/M7/M7M8, 고정20초/실제ExtraTime를 분리했습니다. 모든 경로는 같은 density-hp-v1 입력과 파생 공격 간격으로 실제 움직이는 현재 중심을 공격합니다.

Fresh는 실제0재화/0레벨/Rank0/업적0에서 시작합니다. LegacyMax는 **fixture**: 기존M6의19스킬50Lv, Rank4/lifetime8000, Photon10000/Catalyst200, 신규업적·Relic·계약0입니다. 기존스킬11개만 MAX인 v0.9 프로필과 구분합니다. 메타 선택 정책은 전투 타깃 알고리즘을 바꾸지 않습니다. RiskSeeking은 제시 후보의 높은 보상률, ContractFocused는 활성 계약 관련 위험, Adaptive는 현재Rank에 맞춘 우선순위, NormalOnly는 정상Run입니다. 계약은 자동 재수락하며 자동 포기는0회입니다. 소유Relic이3개 이상이면50Run 후10Run 간격으로 순환 조합을 비교합니다.

RNG는 외형/물리/스폰/메타제안이 분리됩니다. repeated seed를 고정해 패턴 편향이 있으며, 추가5개Reactor 경로는 seed+Run×7919를 사용합니다. 각 경로의 모든300Run을 실행하고 checkpoint gzip에 기록하며 복제/외삽하지 않았습니다. 캐시는 게임규칙 소스 해시와 프로필·정책·횟수를 포함합니다.

## Fresh 고정20초 누적 성장

각값은5시드 중앙값이며 은행은 스킬/Relic 소비 후입니다. OFF는 신규메타기능을 사용하지 않는 M6 비교, M7은 Relic만, M7M8은 둘 다입니다.

| 빌드 | 모드 | Run | 스킬Lv | Relic보유 | 설계도 | 유급Contract단계 | Photon누적 | 은행 | Catalyst잔고 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Crusher | OFF | 5 | 4 | 0 | 0 | 0 | 917 | 196 | 0 |
| Crusher | OFF | 20 | 23 | 0 | 0 | 0 | 5738 | 191 | 54 |
| Crusher | OFF | 50 | 50 | 0 | 0 | 0 | 20914 | 1261 | 283 |
| Crusher | OFF | 100 | 50 | 0 | 0 | 0 | 51645 | 31992 | 1035 |
| Crusher | OFF | 200 | 50 | 0 | 0 | 0 | 113745 | 94092 | 2635 |
| Crusher | OFF | 300 | 50 | 0 | 0 | 0 | 175845 | 156192 | 4235 |
| Crusher | M7 | 5 | 4 | 0 | 3 | 0 | 917 | 196 | 0 |
| Crusher | M7 | 20 | 18 | 3 | 4 | 0 | 5545 | 299 | 30 |
| Crusher | M7 | 50 | 48 | 5 | 5 | 0 | 20012 | 438 | 235 |
| Crusher | M7 | 100 | 50 | 5 | 5 | 0 | 49726 | 27443 | 915 |
| Crusher | M7 | 200 | 50 | 5 | 5 | 0 | 109266 | 86983 | 2515 |
| Crusher | M7 | 300 | 50 | 5 | 5 | 0 | 168806 | 146523 | 4115 |
| Crusher | M7M8 | 5 | 7 | 0 | 3 | 3 | 1347 | 88 | 0 |
| Crusher | M7M8 | 20 | 30 | 3 | 5 | 13 | 8976 | 442 | 43 |
| Crusher | M7M8 | 50 | 50 | 6 | 6 | 26 | 30340 | 7445 | 321 |
| Crusher | M7M8 | 100 | 50 | 6 | 6 | 29 | 64177 | 41894 | 1131 |
| Crusher | M7M8 | 200 | 50 | 6 | 6 | 30 | 131667 | 109384 | 2731 |
| Crusher | M7M8 | 300 | 50 | 6 | 6 | 30 | 199119 | 176836 | 4331 |
| Cascade | OFF | 5 | 3 | 0 | 0 | 0 | 799 | 332 | 0 |
| Cascade | OFF | 20 | 14 | 0 | 0 | 0 | 4720 | 386 | 42 |
| Cascade | OFF | 50 | 49 | 0 | 0 | 0 | 18573 | 320 | 235 |
| Cascade | OFF | 100 | 50 | 0 | 0 | 0 | 48768 | 29115 | 984 |
| Cascade | OFF | 200 | 50 | 0 | 0 | 0 | 110868 | 91215 | 2584 |
| Cascade | OFF | 300 | 50 | 0 | 0 | 0 | 172968 | 153315 | 4184 |
| Cascade | M7 | 5 | 3 | 0 | 2 | 0 | 799 | 332 | 0 |
| Cascade | M7 | 20 | 13 | 2 | 4 | 0 | 4658 | 382 | 31 |
| Cascade | M7 | 50 | 43 | 5 | 5 | 0 | 16765 | 308 | 212 |
| Cascade | M7 | 100 | 50 | 5 | 5 | 0 | 46517 | 24234 | 856 |
| Cascade | M7 | 200 | 50 | 5 | 5 | 0 | 106997 | 84714 | 2456 |
| Cascade | M7 | 300 | 50 | 5 | 5 | 0 | 167477 | 145194 | 4056 |
| Cascade | M7M8 | 5 | 4 | 0 | 3 | 4 | 1321 | 441 | 0 |
| Cascade | M7M8 | 20 | 27 | 3 | 5 | 14 | 8468 | 159 | 33 |
| Cascade | M7M8 | 50 | 50 | 5 | 5 | 26 | 29241 | 6958 | 285 |
| Cascade | M7M8 | 100 | 50 | 6 | 6 | 29 | 63296 | 41013 | 1091 |
| Cascade | M7M8 | 200 | 50 | 6 | 6 | 30 | 130201 | 107918 | 2691 |
| Cascade | M7M8 | 300 | 50 | 6 | 6 | 30 | 197228 | 174945 | 4291 |
| Reactor | OFF | 5 | 4 | 0 | 0 | 0 | 1021 | 127 | 0 |
| Reactor | OFF | 20 | 20 | 0 | 0 | 0 | 6628 | 313 | 58 |
| Reactor | OFF | 50 | 50 | 0 | 0 | 0 | 21252 | 1599 | 319 |
| Reactor | OFF | 100 | 50 | 0 | 0 | 0 | 52302 | 32649 | 1098 |
| Reactor | OFF | 200 | 50 | 0 | 0 | 0 | 114402 | 94749 | 2698 |
| Reactor | OFF | 300 | 50 | 0 | 0 | 0 | 176502 | 156849 | 4298 |
| Reactor | M7 | 5 | 4 | 0 | 2 | 0 | 1021 | 127 | 0 |
| Reactor | M7 | 20 | 13 | 3 | 4 | 0 | 5721 | 620 | 26 |
| Reactor | M7 | 50 | 43 | 5 | 5 | 0 | 19311 | 193 | 224 |
| Reactor | M7 | 100 | 50 | 5 | 5 | 0 | 48402 | 25683 | 913 |
| Reactor | M7 | 200 | 50 | 5 | 5 | 0 | 106953 | 84444 | 2513 |
| Reactor | M7 | 300 | 50 | 5 | 5 | 0 | 167027 | 144744 | 4113 |
| Reactor | M7M8 | 5 | 6 | 0 | 3 | 5 | 1839 | 270 | 0 |
| Reactor | M7M8 | 20 | 28 | 4 | 5 | 17 | 10580 | 476 | 32 |
| Reactor | M7M8 | 50 | 50 | 6 | 6 | 26 | 31573 | 7870 | 378 |
| Reactor | M7M8 | 100 | 50 | 6 | 6 | 30 | 65389 | 43106 | 1201 |
| Reactor | M7M8 | 200 | 50 | 6 | 6 | 30 | 132479 | 110196 | 2801 |
| Reactor | M7M8 | 300 | 50 | 6 | 6 | 30 | 199458 | 177175 | 4401 |

## 목표 소진 및 실제 Extra Time

| 프로필 | 빌드 | 시간 | 19스킬MAX 중앙값 | 첫Relic 중앙값 | 6Relic완성 중앙값 | Contract전완성 중앙값 | 300Run 전투분 중앙값 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Fresh | Crusher | Fixed20 | 39 | 11 | 미완료 포함 (53/—/41/44/42) | 미완료 포함 (139/—/70/83/120) | 100 |
| Fresh | Crusher | ExtraTime | 32 | 11 | 34 | 56 | 156.07 |
| Fresh | Cascade | Fixed20 | 41 | 12 | 미완료 포함 (57/—/43/46/68) | 미완료 포함 (136/—/58/76/115) | 100 |
| Fresh | Cascade | ExtraTime | 34 | 12 | 37 | 57 | 155.7 |
| Fresh | Reactor | Fixed20 | 37 | 11 | 미완료 포함 (40/—/38/41/53) | 미완료 포함 (133/—/56/69/91) | 100 |
| Fresh | Reactor | ExtraTime | 30 | 11 | 33 | 54 | 156.57 |
| LegacyMax | Crusher | Fixed20 | 0 | 2 | 미완료 포함 (11/—/4/15/12) | 미완료 포함 (133/—/62/79/128) | 100 |
| LegacyMax | Crusher | ExtraTime | 0 | 2 | 4 | 51 | 160 |
| LegacyMax | Cascade | Fixed20 | 0 | 2 | 미완료 포함 (13/—/4/7/70) | 미완료 포함 (139/—/69/79/114) | 100 |
| LegacyMax | Cascade | ExtraTime | 0 | 2 | 4 | 54 | 160 |
| LegacyMax | Reactor | Fixed20 | 0 | 2 | 미완료 포함 (11/—/4/9/8) | 미완료 포함 (136/—/62/113/89) | 100 |
| LegacyMax | Reactor | ExtraTime | 0 | 2 | 4 | 51 | 160 |

300×20초=100분 전투, 정산 연출만 전부 시청하면 추가6분입니다. ExtraTime의 실제 누적 전투분은 위표에 별도 측정했습니다. 사람의 결과화면/구매/재시작 체류 시간은 측정하지 않았습니다. 이를3~4시간 재미 달성으로 보고하지 않습니다. 전체 스킬·Relic·계약이 소진된 경로는 JSON의 completion에서 정확히 확인할 수 있습니다. 남은 Anomaly 선택과 무보상 반복이 장기 목표를 대체한다고 주장하지 않습니다.

## Relic 손익: Rank4/19스킬MAX/고정20초/Normal

| 장착 | 파괴평균 | Raw평균 | Refinery평균 | 실제Relic발동(5seed 합계) |
| --- | --- | --- | --- | --- |
| OFF | 305.2 | 8875.6 | 633.4 | {} |
| ricochetCoil | 304.4 | 8922.6 | 615.8 | {"ricochetCoil":3759} |
| waveCondenser | 303 | 8962.6 | 609.2 | {"waveCondenser":581} |
| cracklingEdge | 305.4 | 8981 | 619 | {"cracklingEdge":57} |
| hexSiphon | 305.2 | 8875.6 | 633.4 | {"hexSiphon":20} |
| reactorGovernor | 302.6 | 8803.6 | 587 | {"reactorGovernor":74} |
| ancientResonator | 305.2 | 8875.6 | 633.4 | {"ancientResonator":6} |
| ricochetCoil + waveCondenser | 304.4 | 8691.8 | 595.2 | {"ricochetCoil":3993,"waveCondenser":570} |
| cracklingEdge + hexSiphon | 305.6 | 9006.6 | 624.8 | {"cracklingEdge":57,"hexSiphon":21} |
| reactorGovernor + ancientResonator | 302.6 | 8803.6 | 587 | {"reactorGovernor":74,"ancientResonator":6} |
| waveCondenser + reactorGovernor | 303.4 | 8763.8 | 587.6 | {"waveCondenser":561,"reactorGovernor":75} |
| hexSiphon + ancientResonator | 305.2 | 8875.6 | 633.4 | {"hexSiphon":20,"ancientResonator":6} |

발동은 실제 성공한 효과 생성/충전 소비 횟수입니다. Coil은 추가로 강화된 주 파편 생성 횟수를 표시하며 벽 반사 자체는 별도 counter입니다. Condenser는 고유 파동, Governor는 실제 단계 파동, Siphon은 소비, Ancient는 실제 보조 파편이 기준입니다. Catalyst/Raw는 직접 강제 지급하지 않습니다. 무장OFF보다 낮은 파괴 수는 기회비용/패널티의 결과이며 감추지 않습니다.

## Anomaly와 선택 정책

각 Anomaly는5seed×12로드아웃=60 실제20초 비교입니다.

| Anomaly | 표본 | 성공 | 실제추가Photon합 | 파괴평균 |
| --- | --- | --- | --- | --- |
| fastOrbit | 60 | 60 | 3522 | 304.08 |
| denseField | 60 | 0 | 0 | 304.35 |
| fragileMatter | 60 | 60 | 3543 | 304.22 |
| overcharge | 60 | 60 | 3600 | 303.95 |
| fortified | 60 | 60 | 3600 | 302.97 |
| unstableCore | 60 | 60 | 3600 | 303.75 |

| 정책 | 경로 | Run | Normal | 선택 | 성공 | AnomalyPhoton | 최종배지 중앙값 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| NormalOnly | 15 | 4500 | 4500 | 0 | 0 | 0 | 8 |
| RiskSeeking | 15 | 4500 | 0 | 4500 | 4500 | 261046 | 10 |
| ContractFocused | 15 | 4500 | 1820 | 2680 | 1575 | 87889 | 10 |
| Adaptive | 15 | 4500 | 0 | 4500 | 4494 | 259532 | 10 |

실패Run은 기존 Refinery 지급, 성공만 floor(basePhoton×rate) 추가, 최대60입니다. Contract는 Refinery에 곱하지 않습니다. 총30단계 전체 한 번 지급 상한은 **Photon 6816/Catalyst 90**입니다. Relic6개 총제작비4230/86. 기존 변환율.06, 슬롯15/35/30/15/5 및 배율.8/1/1.1/1.3/1.6, 19스킬 가격과×1.6 성장, Rank300/1200/3500/8000을 변경하지 않았습니다. 신규 비용/보상은 PRD 그대로입니다. DenseField의 정수 도형 target은 ceil(기본×1.2), 최대32입니다.

## 가장 큰 문제와 다음 실험

기존50Lv 소진과 후기 Photon/Catalyst 잉여는 여전히 존재합니다. Relic 제작은 유한4230/86 소비이고 Contract 보상도 유한하므로300Run 장기 동기 해결을 보장할 수 없습니다. 이를 가격 인상·재화 초기화로 감추지 않았습니다. 자동 정책이 높은 보상률 Anomaly를 반복 선택하는 현상은 실제 선택성이 낮다는 가설이며, 사람에게 Normal 선택 이유·위험 이해·특수 도형 우선순위·10판 후 재도전 의향을 질문해야 합니다.

M9 후보: 재화 초기화 없이 다른 표적 목표가 생기는 변형 Contract, 서로 다른 위험의 Anomaly 성공 조건, 제한2슬롯의 읽기 쉬운 효과/패널티 미리보기, 실플레이 기반 후기 Catalyst 소비처. Prestige/Relic 외 Artifact·새 게임엔진·Sector 화면을 이번 범위에 추가하지 않았습니다.

## 수치에서 확인한 병목

| 빌드 | 모드 | 시간 | 50Lv MAX Run 중앙값 |
| --- | --- | --- | --- |
| Crusher | OFF | Fixed20 | 48 |
| Crusher | OFF | ExtraTime | 40 |
| Crusher | M7 | Fixed20 | 54 |
| Crusher | M7 | ExtraTime | 44 |
| Crusher | M7M8 | Fixed20 | 39 |
| Crusher | M7M8 | ExtraTime | 32 |
| Cascade | OFF | Fixed20 | 52 |
| Cascade | OFF | ExtraTime | 44 |
| Cascade | M7 | Fixed20 | 61 |
| Cascade | M7 | ExtraTime | 49 |
| Cascade | M7M8 | Fixed20 | 41 |
| Cascade | M7M8 | ExtraTime | 34 |
| Reactor | OFF | Fixed20 | 48 |
| Reactor | OFF | ExtraTime | 39 |
| Reactor | M7 | Fixed20 | 56 |
| Reactor | M7 | ExtraTime | 46 |
| Reactor | M7M8 | Fixed20 | 37 |
| Reactor | M7M8 | ExtraTime | 30 |

같은 기간을 비교하면 M7 제작 소비는 MAX 시점을 늦추고 M8 추가 수익은 이를 앞당깁니다. 기존 스킬 가격이나 변환율을 바꾸지 않고 얻은 결과입니다.

| 장착 | 직접 평균 | 연쇄 평균 | 최고Chain 평균 |
| --- | --- | --- | --- |
| OFF | 132.8 | 172.4 | 10.2 |
| ricochetCoil | 133.4 | 171 | 10.6 |
| waveCondenser | 131.4 | 171.6 | 10 |
| cracklingEdge | 126.4 | 179 | 10 |
| hexSiphon | 132.8 | 172.4 | 10.2 |
| reactorGovernor | 134 | 168.6 | 10.4 |
| ancientResonator | 132.8 | 172.4 | 10.2 |
| ricochetCoil + waveCondenser | 132.8 | 171.6 | 9.6 |
| cracklingEdge + hexSiphon | 127.2 | 178.4 | 10.6 |
| reactorGovernor + ancientResonator | 134 | 168.6 | 10.4 |
| waveCondenser + reactorGovernor | 133.6 | 169.8 | 8.8 |
| hexSiphon + ancientResonator | 132.8 | 172.4 | 10.2 |

MAX 고정20초 Normal의 파괴 수는 로드아웃을 바꿔도 약300개에 모입니다. 기본 보충 예산이0.20초당3개(초당 최대15개)이므로, 이 구간은 공격력보다 생성 예산의 제한에 가까워집니다. 이를 Relic이 쓸모없다는 사람 평가로 일반화하지 않았습니다. 실제 직접/연쇄 분포와 파동·파편 발동 빈도를 함께 확인해야 합니다.

RiskSeeking은 4,500회 선택 중4,500회 성공, Adaptive는4,500회 중4,494회 성공했습니다. 완벽한 자동 조준에서 추가 보상이 거의 무료에 가까운 진단 결과입니다. 실제 사람이 동일한 성공률을 낸다는 뜻은 아닙니다. 사람이 느끼는 위험과 Normal 선택의 이유를 먼저 검증해야 하며, 이번에는 PRD의 목표·보상 수치를 임의로 변경하지 않았습니다.

| Run seed 정책 | 300Run 경로 | Ancient 파괴 합계 | Ancient III 완료 경로 | 6Relic 보유 경로 |
| --- | --- | --- | --- | --- |
| 반복 고정 | 5 | 607 | 4 | 4 |
| Run별 distinct | 5 | 1082 | 5 | 5 |

기본 Ancient 등장률0.006, Rank4 AND 해당Run200킬 조건과 반복 seed가 노출에 영향을 줍니다. 일부 seed의 남은 목표는 장기 동기가 아니라 보이지 않는 콘텐츠의 진척 정체일 수 있습니다. distinct 비교도 같은 전투 엔진으로 실제1,500회를 실행했습니다.

Relic 제작/장착은 각 Run 시작 직전의 RESULT 정책으로 처리하고, 스킬은 해당 Run 정산 후 구매합니다. 따라서 원본의 relicOwned/equipped는 해당 Run의 시작 시점 소유 상태이며 새 설계도는 정산 직후 상태입니다. 첫 제작은 직전 Run의 결과 화면에서 일어납니다. 이 시점 차이를 자연 플레이의 해금 시점과 혼동하지 않습니다.

Dense Field는 MAX 단독/조합 자동 비교60회에서0회 성공했습니다. 성공 조건 연결은 카운터 주입 없이 Star+14Triangle 강제 fixture에서 실제 Chain15를 만들어 검증했고, 보너스0에서도 Anomaly Pilot은 정확히1회 진행합니다. 자연 자동 결과와 제어 fixture를 구분합니다. 목표15와 생성·전파의 관계는 실제 사람의 목표 선택으로 추가 확인해야 합니다.
