# M13 — Destruction Evolution

기준은 승인된 M12 `1d75822`이며 같은 개발 브랜치에서 확장했습니다. Shatter/Cascade/Overload/Storm은 구매 레벨0/15/40/75에서 계산해 Run 시작에 동결합니다. 기존 Rank/Run Tier와 별개이며19도형/49스킬/100레벨과 장착 슬롯을 유지합니다. 새 화폐/영구 스킬/도형은 추가하지 않았습니다.

## 실제 전투

`destruction-stage.js`, `response-director.js`, `response-patterns.js`를 Game의 실제 정상 처치/정규 생성 슬롯에 연결했습니다. 정상 Chain10은 StageII 이상 linkPocket4, Chain20은 StageIII 이상 bridgeCorridor6, StageIV 첫20은 stormCrown8을 예약합니다. Echo/debug/fixture 처치는 반응과 공간 진척에서 제외합니다. 같은 Chain 임계점은1회, 총3반응/18생성, 동시 활성 군집1을 지킵니다. StageIV는10반응을1회로 제한해20의 bridge/crown 두 슬롯을 남기고, StageII/III는10반응 최대2회입니다.

예약은 이후 정규 spawn 슬롯을 한 개씩 모아4/6/8개가 확보되면 안전 배치 전체를 원자적으로 commit합니다. 무료 추가 생성/즉시 Raw 지급은 없습니다. 먼저 배치된 군집이 제거될 때까지 다음 예약을 대기시키며, 실패하면 이미 모은 정상 토큰만 일반 safe spawn으로 되돌립니다. 종료 후 생성하지 않고 남은 예약은 expired로 기록합니다. Rank/Tier/특수 동시 수/Run cap/실제 원형 간격과 arena bounds를 유지합니다. Hex/Conductor/Fuse/Mirror/Gravity의 native 효과를 활용하고, Crown에는 Star처럼 생존 방식이 다른 타깃을 포함합니다.

기존 M9 패턴과 별도로 성장 단계별 정상 생성 계획에도3종의 기하 배치를 섞습니다. StageIV는 M12 A/B에서 검증한 elastic24 프로파일을 사용합니다. 초기3초/무입력/낮은 실제 처리량은15/s이며 Rank0을 강제로 가속하지 않습니다. StageI~III와 기능OFF는 M12의 fixed15 기본을 유지합니다. 이 차이는 PRD의 Storm 환경에 한정한 공급 채택이며 가격/HP/보상 배율 인상이 아닙니다.

실제 chainId의 첫 정상 사망→가장 먼 정상 사망 거리, 마지막 사망 위치, 실제 배치 clusterId, 발동 source, 예약/활성/실패/만료/생성/처치 수를 기록합니다. 반응 cue는 실제 예약 원점과 실제 생성 좌표를 잇는 짧은 점선이며 FX OFF에서 제거해도 전투는 같습니다. 결과에는 단계·거리·군집·반응 수가 표시됩니다. 시작 화면 단계 안내의 최종 UI 검증은 뒤의 UI 커밋과 최신 Chrome 로그를 기준으로 확인합니다.

## 검증

- 단위332 PASS: 기존324+신규8. 단계 경계, 실제 순차 파동20처치, 독립 Chain, Echo/fixture 제외,3개 안전 원자적 배치, 예산/정산 전 보상0,1활성 제한, Rank/Tier/종료를 확인했습니다.
- benchmark:m13:5seed×3build×4성장단계×20/32초=120조건에서 M12 원본/OFF/ON/FXoff 총480실제 Run. OFF의 파괴/Raw/Photon/Catalyst/도형/기술/인과 target 열은 M12와 동일, ON/FXoff 전투·반응 기록도 동일했습니다.
- Control 조합 별도20실제 Run: Signature3/Evolution2를 지키며 Portal/Magnetic/Prismatic 및 Gravity orbit/Shard piercing을 비교했습니다.
- 승인 후 성장:5seed×3build×200=3,000 실제 Run/15경로, 실제 구매와 정산1회를 유지했습니다. 현재 source prefix `32e1b474e6f9`가 최종이며 `f594012013a2`는 로그 수정 전 중간 자료입니다.
- 실제 Chrome155 pointer20초6Run(Fresh2+성장fixture4),620/1280/1920·DPR1/2·Focus/Reduced Motion·클릭/홀드/드래그,console/page 오류0.4개 성장fixture 모두 실제 linkPocket 생성4개를 확인했습니다. Browser에서 Bridge/Crown을 자연 발동했다고 주장하지 않습니다. 이들은 위 Node 실전에서 실제 발동했습니다.
- 현재 M13 MAX32초20개 전체 기록은12,787,513→3,559,092문자로 압축되어 같은 키의 private Chrome 저장/reload2/전체 SHA-256/은행/레벨 보존 PASS입니다. 기록을 자르지 않았습니다.

증거: `artifacts/m13-unit.txt`, `m13-benchmark-results.json`, `m13-control-results.json`, `m13-approved-growth-results.json`, `m13-browser-results.json`, `m13-storage-current32-results.json`. 모든 샤드/파동/예약 상한과 물리 폐기0을 검증했습니다. 자동 조준은 사람의 재미 검증이 아닙니다.

## 발견한 오류 / 한계

배치 이름이 log.kind를 덮어쓰던 오류를 pattern 필드와 event kind로 분리했습니다. Chain10이3슬롯을 먼저 소비하던 문제는20 우선 슬롯으로 수정했습니다. 실제 새 반응으로 추가 군집까지 같은 파동이 전파되는 시험에서는 원래2군집 외 진짜 새 군집도 집계되므로 테스트를 원래A/B 두 군집의 실제 포함 검사로 바로잡았습니다.

초반과 후반의 자동 전파 차이는 측정됐지만 타깃 선택/체감 규모/재도전 의욕은 사람 검증 전입니다. StageIII의30개 조건에서는 Chain20이 없었으며 모든 단계에서 Crown을 쉽게 볼 수 있다고 보고하지 않습니다. 별도 World/보스/엔딩은 M14, 선택형 모드는 M15, 추가 음향은 M16입니다.
