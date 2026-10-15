# M9 Shape Ecology balance

38250 actual Runs / 165 paths. Source signature f335fad554c688407f4c8d811c18748d457b17863c5778c1c01b4ecdafd11c4c. Seeds31415/1/7/42/99,3builds,Fresh/LegacyMax,20/ExtraTime,M8OFF/M9ON.120paths×300 +45Adaptive/Anomaly paths×50. Every comparison uses density-hp-v1 and seed+Run×7919; no record replication/extrapolation. Photon/Catalyst purchases and settlement run in isolated memory saves. LegacyMax is an injected old19/50Lv/Rank4 profile.

| Build | Feature | Run | Levels | Rank | Photon bank | Catalyst | Kills | Introduced |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Crusher | M8 | 5 | 7 | 1 | 23 | 0 | 240 | 0 |
| Crusher | M8 | 20 | 35 | 3 | 158 | 87 | 304 | 0 |
| Crusher | M8 | 50 | 50 | 4 | 4655 | 319 | 303 | 0 |
| Crusher | M8 | 100 | 50 | 4 | 35838 | 1086 | 306 | 0 |
| Crusher | M8 | 200 | 50 | 4 | 96276 | 2657 | 305 | 0 |
| Crusher | M8 | 300 | 50 | 4 | 157412 | 4175 | 304 | 0 |
| Crusher | M9 | 5 | 8 | 1 | 58 | 0 | 226 | 3 |
| Crusher | M9 | 20 | 35 | 3 | 110 | 83 | 304 | 6 |
| Crusher | M9 | 50 | 50 | 4 | 5326 | 318 | 302 | 6 |
| Crusher | M9 | 100 | 50 | 4 | 37638 | 1108 | 304 | 6 |
| Crusher | M9 | 200 | 50 | 4 | 100191 | 2642 | 304 | 6 |
| Crusher | M9 | 300 | 50 | 4 | 162527 | 4146 | 302 | 6 |
| Cascade | M8 | 5 | 9 | 1 | 42 | 0 | 265 | 0 |
| Cascade | M8 | 20 | 35 | 3 | 158 | 91 | 304 | 0 |
| Cascade | M8 | 50 | 50 | 4 | 5023 | 334 | 303 | 0 |
| Cascade | M8 | 100 | 50 | 4 | 36136 | 1087 | 306 | 0 |
| Cascade | M8 | 200 | 50 | 4 | 96334 | 2669 | 305 | 0 |
| Cascade | M8 | 300 | 50 | 4 | 157470 | 4174 | 304 | 0 |
| Cascade | M9 | 5 | 8 | 1 | 58 | 0 | 246 | 3 |
| Cascade | M9 | 20 | 34 | 3 | 79 | 84 | 302 | 6 |
| Cascade | M9 | 50 | 50 | 4 | 5373 | 327 | 302 | 6 |
| Cascade | M9 | 100 | 50 | 4 | 37402 | 1105 | 304 | 6 |
| Cascade | M9 | 200 | 50 | 4 | 99862 | 2641 | 304 | 6 |
| Cascade | M9 | 300 | 50 | 4 | 162217 | 4140 | 302 | 6 |
| Reactor | M8 | 5 | 9 | 1 | 57 | 0 | 300 | 0 |
| Reactor | M8 | 20 | 36 | 3 | 91 | 94 | 306 | 0 |
| Reactor | M8 | 50 | 50 | 4 | 5706 | 353 | 304 | 0 |
| Reactor | M8 | 100 | 50 | 4 | 36697 | 1118 | 304 | 0 |
| Reactor | M8 | 200 | 50 | 4 | 97062 | 2697 | 304 | 0 |
| Reactor | M8 | 300 | 50 | 4 | 157868 | 4191 | 304 | 0 |
| Reactor | M9 | 5 | 8 | 1 | 66 | 0 | 287 | 3 |
| Reactor | M9 | 20 | 36 | 3 | 107 | 89 | 304 | 6 |
| Reactor | M9 | 50 | 50 | 4 | 6476 | 342 | 303 | 6 |
| Reactor | M9 | 100 | 50 | 4 | 38210 | 1114 | 302 | 6 |
| Reactor | M9 | 200 | 50 | 4 | 100639 | 2650 | 306 | 6 |
| Reactor | M9 | 300 | 50 | 4 | 163652 | 4178 | 301 | 6 |

| Mode | Runs | Median kills | Median Photon | Median tick P95 ms |
|---|---:|---:|---:|---:|
| Normal/Fixed20 | 750 | 303 | 670 | 0.438 |
| Adaptive/Fixed20 | 750 | 325 | 714 | 0.503 |
| Normal/ExtraTime | 750 | 483 | 1109 | 0.421 |
| Adaptive/ExtraTime | 750 | 539 | 1236 | 0.525 |
| Anomaly/Fixed20 | 750 | 303 | 752 | 0.442 |

Adaptive is an experiment only (.18 at Rank2/Tier3,.16 at Rank4/Tier5). Production remains.20×3. Prices,ore probabilities,Refinery.06/slots/rank thresholds unchanged. Echo Raw0 and no permanentKills/ore/Catalyst/contract progress. Introduction commits only after settlement.

Actual aggregate events:

```json
{
  "introduction": 630,
  "fuseArmed": 197599,
  "fuseExploded": 196451,
  "echoSpawn": 378217,
  "echoDeath": 375465,
  "conductorDelivered": 21845,
  "reinforced": 164544,
  "reflection": 75737,
  "gravityBend": 2219819,
  "repair": 1432
}
```

Actual formation counts (fallback is recorded as scattered):

```json
{
  "scattered": 7560916,
  "bridge": 1457206,
  "burst_cluster": 2205275,
  "arc": 1880569,
  "tether_pair": 211745,
  "shield_pocket": 1221223,
  "ringFormation": 44475,
  "bombGarden": 9524,
  "chainCorridor": 37751,
  "shieldFortress": 21059
}
```

[Raw summary](../artifacts/m9-balance-results.json) includes all165 sourceFiles and the exact dependency manifest. CPU P95 is measured during parallel runs and is environment-dependent; isolated Chrome QA and prior M8 performance have a different workload. Auto-aim does not measure human target identification,fun,difficulty or replay intent. Prices are not inflated to hide the old50Lv exhaustion or late currency surplus.

## 동일 정책 전투·성능 비교

| Profile/time | M8 kills | M9 kills | M8 Photon | M9 Photon | M9 cascade ratio | M9 blank seconds |
|---|---:|---:|---:|---:|---:|---:|
| Fresh/Fixed20 | 304 | 303 | 600 | 621 | 0.578 | 0.000 |
| Fresh/ExtraTime | 484 | 483 | 1003 | 1039 | 0.575 | 0.000 |
| LegacyMax/Fixed20 | 304 | 303 | 607 | 627 | 0.578 | 0.000 |
| LegacyMax/ExtraTime | 484 | 483 | 1013 | 1049 | 0.574 | 0.000 |

아래 CPU 비교는 성장 worker 종료 후 따로 실행한90개 실제20초 Run이며, M8과 현재 ecology OFF의 kills/Raw/Photon을 정확히 대조합니다. 선택·기록·렌더 시간은 측정 밖이며 Chrome FPS로 해석하지 않습니다.

| Mode | Rank | Median tick P95 ms |
|---|---:|---:|
| M8 | 0 | 0.062 |
| M8 | 4 | 0.151 |
| M9_OFF | 0 | 0.067 |
| M9_OFF | 4 | 0.147 |
| M9_ON | 0 | 0.065 |
| M9_ON | 4 | 0.158 |

안전 계측 합계:

```json
{
  "maxProjectileError": 9.999943024752156e-7,
  "maxWaveError": 9.999965300266922e-7,
  "lateContacts": 0,
  "caps": {
    "tickIterations": 158877,
    "depth": 939
  },
  "spawnFailures": 7585
}
```

각 Fresh 경로의 기존50Lv 소진 시점(신규30스킬을 포함하지 않는 M9 기준):

```json
[
  {
    "seed": 31415,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 42
  },
  {
    "seed": 31415,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 41
  },
  {
    "seed": 31415,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 29
  },
  {
    "seed": 31415,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 30
  },
  {
    "seed": 31415,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 41
  },
  {
    "seed": 31415,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 40
  },
  {
    "seed": 31415,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 29
  },
  {
    "seed": 31415,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 29
  },
  {
    "seed": 31415,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 40
  },
  {
    "seed": 31415,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 37
  },
  {
    "seed": 31415,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 28
  },
  {
    "seed": 31415,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 28
  },
  {
    "seed": 1,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 41
  },
  {
    "seed": 1,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 41
  },
  {
    "seed": 1,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 31
  },
  {
    "seed": 1,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 31
  },
  {
    "seed": 1,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 41
  },
  {
    "seed": 1,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 40
  },
  {
    "seed": 1,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 29
  },
  {
    "seed": 1,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 29
  },
  {
    "seed": 1,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 39
  },
  {
    "seed": 1,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 38
  },
  {
    "seed": 1,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 29
  },
  {
    "seed": 1,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 28
  },
  {
    "seed": 7,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 40
  },
  {
    "seed": 7,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 39
  },
  {
    "seed": 7,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 29
  },
  {
    "seed": 7,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 30
  },
  {
    "seed": 7,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 40
  },
  {
    "seed": 7,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 42
  },
  {
    "seed": 7,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 30
  },
  {
    "seed": 7,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 31
  },
  {
    "seed": 7,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 37
  },
  {
    "seed": 7,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 39
  },
  {
    "seed": 7,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 30
  },
  {
    "seed": 7,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 28
  },
  {
    "seed": 42,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 42
  },
  {
    "seed": 42,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 39
  },
  {
    "seed": 42,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 30
  },
  {
    "seed": 42,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 28
  },
  {
    "seed": 42,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 40
  },
  {
    "seed": 42,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 41
  },
  {
    "seed": 42,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 31
  },
  {
    "seed": 42,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 31
  },
  {
    "seed": 42,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 40
  },
  {
    "seed": 42,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 39
  },
  {
    "seed": 42,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 28
  },
  {
    "seed": 42,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 28
  },
  {
    "seed": 99,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 40
  },
  {
    "seed": 99,
    "strategy": "Crusher",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 39
  },
  {
    "seed": 99,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 30
  },
  {
    "seed": 99,
    "strategy": "Crusher",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 30
  },
  {
    "seed": 99,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 41
  },
  {
    "seed": 99,
    "strategy": "Cascade",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 40
  },
  {
    "seed": 99,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 30
  },
  {
    "seed": 99,
    "strategy": "Cascade",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 31
  },
  {
    "seed": 99,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M8",
    "first50Levels": 38
  },
  {
    "seed": 99,
    "strategy": "Reactor",
    "time": "Fixed20",
    "feature": "M9",
    "first50Levels": 39
  },
  {
    "seed": 99,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M8",
    "first50Levels": 28
  },
  {
    "seed": 99,
    "strategy": "Reactor",
    "time": "ExtraTime",
    "feature": "M9",
    "first50Levels": 29
  }
]
```

## 채택·보류와 사람 검증

기본 생성.20×3 및 기존 경제를 유지합니다. Adaptive는 격리 실험 후보로 보류합니다. 자동 완전조준의 처리량 증가만으로 사람의 난도·발견 가독성이 좋아졌다고 판단하지 않습니다.50Lv 소진과 후기 재화 잉여는 여전히 문제이며 M10의 선택형 구성과 M11의 행동 수집 목표에서 별도로 검증합니다. 기존 가격 일괄 인상이나 재화 초기화는 하지 않았습니다.

Chrome 155.0.8059.79 포인터5회는 임시 프로필이며 Rank/조합 강제 fixture를 자연 성장과 구분합니다. 인간 테스트에서는 점화/전도 우선 타깃, 휜 파편 경로의 예측, Repair 우선 처리, Echo 보상0 안내, 첫 소개 이해도와 다음 Run 의향을 확인해야 합니다.

## 비교 범위와 남은 상한 제한

Normal/Adaptive/Anomaly 표는 각 경로의 실제 첫50Run만 사용해 동일 base seed와 Run index를 맞췄습니다. Normal300Run을 Adaptive50Run과 다른 입력 시드 집합으로 비교하지 않습니다. 전체38,250회는 성장·안전 집계에 그대로 포함합니다.

기존512 iteration/tick 상한이 일부 Run에서 작동합니다. 상한은 잔여 slice의 물리를 생략할 수 있어 아래 빈도를 기술적 제한으로 공개합니다. 기준 M8도 같은 현상이 있으며, 단순히 cap을 늘려 숨기지 않았습니다. 모든 파편·파동 접촉 오차는.002px 이내, late contact0입니다.

```json
{
  "M8/Normal": {
    "runs": 18000,
    "affected": 1222,
    "total": 72915,
    "maximum": 273
  },
  "M9/Normal": {
    "runs": 18000,
    "affected": 1224,
    "total": 73176,
    "maximum": 255
  },
  "M9/Adaptive": {
    "runs": 1500,
    "affected": 126,
    "total": 8640,
    "maximum": 163
  },
  "M9/Anomaly": {
    "runs": 750,
    "affected": 57,
    "total": 4146,
    "maximum": 163
  }
}
```
