# M12 — Core Loop & Power Curve (policy review checkpoint)

M12~M16 전체 완료 보고서가 아닙니다. M12의 물리 정확성 수정과 격리 정책 비교를 구현했습니다. **Elite 운영 정책은 결정 전이며 M13~M16은 아직 구현하지 않았습니다.**

개발 브랜치: `feat/m12-m16-destruction-evolution`. 시작점은 기획 브랜치 `56a75c5b00a6e4cf6245e0a90736146d45fb5f3c`이며 M11 최종 `633f8a4efab15b324f40c3284a79509c561c7222`를 포함합니다. 사용자 미커밋 변경이 없는 것을 확인한 뒤 분기했습니다. main 병합/PR/배포는 수행하지 않았습니다.

## 물리 정확성

정적 도형 표면의 극소 거리에서 충돌 예측 후 잘린 선분을 재계산하면 접촉을 소모하지 못하는 실제 seed2를 재현했습니다. M11에서는 같은 경로가512회 제한에 반복 도달한 뒤 남은 시간을 버렸습니다. `game.js`는 기존512개 micro-batch 예산을 유지하며, 소진 시 남은 end/queue/target 상태를 보존한 채 다음 micro-batch를 같은 update에서 처리합니다. 복구 배치에서는 최초 swept 예측의 정확한 접촉을 사용해 극소 거리 반복을 끝냅니다. 렌더/입력/정산 전 catch-up합니다. 기존 정상 경로의 부동소수 계산을 바꾸지 않기 위해 정상 배치는 기존 계산을 그대로 사용합니다.

shards150/waves64/scheduled1024/chainEvents400/depth10 상한은 그대로입니다. duration과 이벤트 정렬, endpoint 이전 사건만 처리하는 정책을 보존합니다. `physicsDebt`는 budgetYields/maxDebtSeconds/discardedPhysicalSeconds/maxIterations/catchUpMs를 기록합니다. 의도적인 기존 visible-stall `skipAhead`는 별도 `skippedSeconds` 정책이며 scheduler debt와 혼동하지 않습니다.

1,000개 통제 fixture에서 각600개의 서로 다른 시간 사건을 실제 예약·처리하고 이동 파편의 전체0.7px 전진, 사건 순서/중복0/물리 누락0/보상0을 확인했습니다. seed2 실제 전투 및 deadline/FX 동등성도 검증했습니다. M11 정상120조건은 exact parity, 별도 cap 재현 경로의 결과 변화는 Balance Report에 공개했습니다.

## 공급·Elite 실험

`spawn-director.js`의15/18/21/24/30개/초 후보는 batch3을 고정하고 interval만 바꿉니다. 최근4초 실제 파괴율, 최근 양수 피해, alive/target, special 비중, 배치 실패, 첫3초 보호,2초 진입 지속/3초 cooldown으로 반응합니다. Echo는 공급 파괴율에서 제외합니다. 무입력/Rank0/실패 누적은 기본 cadence로 돌아갑니다. 도형 자격/안전 배치/상한/기본 보상은 바꾸지 않았습니다. overlap은1초마다 관측한 visual heuristic이며 전체 연속 시간의 비중첩 증명은 아닙니다.

Elite는 Run당 한 번 추첨하는3/15/20/25% 및20%+pity6 후보를 제공합니다. 소개/강제 생성은 별도이며 동일 Run100회 호출해도 재추첨하지 않습니다. 후보의 pity는 적격 자연 미등장 Run에서 최대6까지 증가하고, 다음 적격 Run의 생성 시도를 보장하며 실제 자연 생성에만0으로 돌아갑니다. 소개 Run은 pity를 소비/증가시키지 않습니다. 확률 성공 뒤 최대8회 시도하고 안전 배치 실패는 생성으로 계산하지 않습니다. 이 checkpoint에서는 pity를 실험 인자로 전달하고 다음 값을 기록할 뿐 라이브 계정에 영구 저장하지 않습니다.

**운영 기본값은 아직 M11 fixed15/s 및 attempt3%입니다.** 후보 설정은 `sandbox:true`에서만 허용하고 라이브 Game 생성에서 거절합니다. 개발자 패널에서 다음 실험 Run의 공급/Elite 정책을 선택할 수 있습니다. MAX 실험 프리셋은 모든 선행조건을 만족하며 기본20초로 고정 비교하고,32초는 명시적으로 설정할 수 있습니다. 기존 가격/Refinery/사용자 자산은 변경하지 않았습니다.

## Codex 피드백

Pentagon의 실제 동일 origin main 최종타와 auxiliary 최종타를 분리합니다. Prism Lens의 실제 sector/서로 다른 target 접촉, Fuse의 동일 Chain 실제 폭발 시각을 보관해 RESULT Codex 카드에 최근2개 시도의 성공/실패 이유를 표시합니다. 별도 게임 이벤트를 발명하거나 목표량을 낮추지 않습니다. Echo/debug/fixture 최종타는 해당 시도에서 제외합니다. 상세 시도는 최대128개 요약이며 원래 causal 기록을 삭제하지 않습니다. main 최종타/sector 접촉 자체가0인 origin은 현재 시도 카드에 나타나지 않는 한계가 있어, 전체0회 시도 안내는 후속 보완 대상입니다.

## 저장과 검증

schema8/`shard-storm-v1`/LZ4/CRC32/전체20전투 기록을 유지합니다. 아직 신규 영속 필드는 없으므로 migration을 추가하지 않았습니다. 운영 pity를 채택할 경우 PRD대로 schema9의 atomic settlement 필드가 필요하며 정책 결정 후 구현합니다. 기존 schema1~8/미완료 정산은 단위 테스트와 실제 Chrome codec QA로 회귀했습니다.

현재 전체 단위 **320 PASS/0 FAIL/0 skip**: 기존307개+신규13개. 기존 테스트 삭제/기대 완화는 없습니다. MAX 프리셋의 Extra Time 선행조건 오류를 기존 테스트가 발견했고 프리셋을 수정했습니다.

- 기준: `artifacts/m12-baseline-unit.txt`307PASS, M11 benchmark1Run smoke180전투, `qa:m11`7실제20초 pointer Run, `qa:storage`20전체기록/손상 원본/정산1회 PASS. 과거 M11의54,000Run과 구분합니다.
- 변경 후: `npm test`, `npm run benchmark`, `npm run benchmark:balance`, `benchmark:m12`650실제전투와 별도50,000 eligibility lottery trials. 소스/시드/개별 결과는 `artifacts/m12-benchmark-results.json`.
- 최종 Chrome155 실제20초 포인터6Run(자연Fresh2 + 명시된Rank4/MAX 비교fixture4),620/1280/1920px·DPR1/2·Focus·Reduced Motion·click/hold/drag·sandbox 은행/레벨 보존·새로고침 정산1회·Codex 실제 시도 표시 PASS, console/page error0입니다. `artifacts/m12-browser-results.json`의 소스 서명은 시작/종료가 동일합니다. 현재 코드 M11 smoke도 별도로 재실행했습니다. 중간 실행 `m12-intermediate-*`는 최종 근거와 구분합니다.
- 현재32초 MAX49/Signature3/Evolution2/Relic2 전투20개 전체 기록은10,645,531→2,748,248문자로 압축되어 실제 private Chrome 같은 키 저장/reload2회/전체 SHA-256 일치 PASS입니다. 실제 사용자 프로필을 열거나 수정하지 않았습니다.

Chrome update P95는Fresh 약.3ms, MAX 비교.9~1ms였습니다. 화면에 기록된 averageFPS는 기존 RAF 기반 추정치이며 실제 GPU/전 프레임 지연 보장은 아닙니다. QA 자동 조준/입력 루프 지연도 별도로 보관했습니다. [1920px 실험 전투](../artifacts/m12-pointer-1920-2-4.png), [620px Focus의 실제 Codex 시도](../artifacts/m12-codex-attempts-620-2.png). 실험 패널의 NEXT RUN 스킬 시간 표시는 기본 스킬의32초를 표시할 수 있으나 명시된 실험 시간20초와 실제 종료는20초로 검증했습니다. 이 표시 구분은 후속 정리 대상입니다.

## 남은 작업 / 결정

M12 PRD §5는 운영 Elite 빈도를 확정하지 않았으며 사람의 희귀도 판단 후 채택하도록 명시합니다. Run20%+pity6(권장)과 Run3%/pity없음 등의 실제 비교는 Balance Report에 있습니다. 사용자의 Remote Control Human Gate 규칙에 따라 운영 확률/지급 기회를 바꾸기 전에 정책을 확정해야 합니다. 실험은 안전하게 끝낸 상태이며 운영 전환/영속 pity migration은 아직 적용하지 않았습니다.

공급은 비교 결과를 보존하고 fixed15를 우선 유지합니다.24/s는 후속 사람 A/B 후보이며 자동 파괴량 상승만으로 더 재미있다고 선언하지 않습니다. 정책 결정 후 M12 최종 회귀/문서를 확정하고 M13→M14→M15→M16을 이어서 구현해야 합니다. 실제 사람 재미/3~4시간 캠페인/후속 보스는 미검증·미구현입니다.
