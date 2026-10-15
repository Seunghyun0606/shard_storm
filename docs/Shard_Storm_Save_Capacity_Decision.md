# 저장 용량 — 보존 방식 확인

상태: **사용자가 A안(같은 키에 전체 기록 무손실 압축)을 승인했습니다.** 실제 사용자 프로필은 조작하지 않았으며, 아래 구현과 검증은 격리된 테스트 저장소에서 수행했습니다.

## 승인 후 구현 및 검증

`save-codec.js`에 동기식 UTF-8/LZ4 block/base64와 원문 길이·CRC32 검증을 구현했습니다. 저장 키는 `shard-storm-v1` 그대로이고 `loadSave/writeSave` API와 단일 원자적 `setItem`을 유지합니다. 외부 라이브러리·서버·별도 저장 키·로그 삭제는 도입하지 않았습니다. 기존 일반 JSON/schema1~8도 읽습니다. gzip은 아래 용량 검토용 시제품이며 실제 인코딩은 `ss-lz4-base64-v1`입니다.

동일한20개 전체 전투 기록은 약1.92MB로 압축됐습니다. 상세 이벤트를 하나도 생략하지 않은 원문 동일성, Chrome의 실제 저장·새로고침 복원, 은행·49레벨·Signature/Evolution, pending 정산/Codex의1회 처리, 손상된 원본 덮어쓰기 방지와 원본 내보내기를 검증했습니다. [Chrome 결과](../artifacts/storage-codec-browser-results.json), [전체307개 테스트](../artifacts/m11-unit-final-current.txt).

손상·잘린 JSON 또는 알 수 없는 미래 스키마는 원본을 보존하고 자동 쓰기를 차단합니다. 사용자에게 복구 안내와 원본 내보내기를 제공합니다. 유효한 세이브의 재화나 기록은 초기화하지 않습니다. 압축 후에도 브라우저가 저장을 차단하거나 origin 할당량이 부족하면 기존 값을 보존하며 실패를 알립니다.

현재 M11의 더 큰 기록도 별도로 검증했습니다. MAX49/Signature3/Evolution2/Relic2와 insight19를 주입한 격리 프로필에서3빌드를 번갈아 서로 다른 seed의32초 전투20회를 실제 시뮬레이션했습니다. 상세 이벤트를 생략하지 않은 전체 기록은10,303,343문자→2,658,428문자로 압축됐고, Chrome155의 같은 저장 키에 저장한 뒤 새로고침2회에도 은행·Catalyst·49스킬·20기록을 보존했습니다. [결과](../artifacts/storage-current32-results.json), [로그](../artifacts/storage-current32-test.txt), `npm run qa:storage:current`. 전투는 Node 자동 입력, 저장/복원은 실제 private Chrome context이며 사람 플레이나 무제한 저장 가능성을 뜻하지 않습니다.

## 결정 전 재현 및 검토 기록

M10/M11 구현 QA 중 실제 Chrome 저장 한도에 도달하는 문제를 재현했습니다. 이는 기능의 단위 테스트 실패가 아니라, 전투 진단을 포함한 최근20개 Run 전체 JSON 크기의 문제입니다. 기존 `writeSave`는 예외를 잡고 저장 불가 안내를 하지만, 이후 세션 진행이 새로고침까지 보존된다고 보장할 수 없습니다.

## 재현

`tests/storage-capacity-repro.mjs`는 별도 Chrome context에서 Rank4/MAX49·Signature3·Evolution2·Relic2 fixture로 서로 다른 시드의 실제20회 전투·정산을 실행합니다. 사용자 프로필이나 실제 저장 키에는 쓰지 않습니다. 예산을 줄인 가짜 로그가 아닌 완전한20개 record를 보존합니다.

[측정 결과](../artifacts/storage-capacity-repro.json): 총7,826,742문자/UTF-8 byte. Chrome155에서 테스트 전용 키로 저장할 때 `QuotaExceededError`. 14번째 기록부터 JSON이5,441,009문자로 늘어납니다. 실제 한도 도달 시점은 브라우저·계정·빌드·다른 origin 데이터에 따라 달라집니다.

진단용 gzip 무손실 round-trip은793,093byte, base64 1,057,460문자로 원문 동일성을 확인했습니다. 이 수치는 저장 형식 채택이 아닌 **검토용 압축 가능성 증거**입니다. 전체 fixture는 `artifacts/storage-capacity-fixture.json.gz`이며 이 재현 당시 생산 `loadSave/writeSave`는 변경하지 않았습니다. 승인 후 실제 구현은 위의 LZ4 인코딩을 사용합니다.

## 선택지

**A · 권장: 전체 내용을 무손실 압축해 같은 저장 키에 보관.** 재화·스킬·정산·최근20회 상세 기록을 모두 보존합니다. 기존 일반 JSON도 계속 읽고 새 인코딩 식별·오류 검증·원자적 쓰기/복구를 추가해야 합니다. 적합한 codec과 동기/비동기 I/O의 구체적 구현은 검증 후 보고합니다. 포맷 및 저장 경로의 변경이므로 사용자 지정 Human Gate의 저장 구조 변경에 해당합니다.

**B: 저장할 상세 전투 진단 로그를 제한.** 재화·구매·정산·Run 요약·Codex/Elite의 실제 카운터는 유지하되 상세 source 이벤트·샘플 진단의 일부를 저장에서 생략합니다. 기존 기록의 상세 로그 보존 정책도 명확히 정해야 합니다. 무엇을 덜 보존할지 사용자 결정이 필요하며, 승인 없이 기존 기록을 잘라내지 않습니다.

두 안 모두 신규 경제 수치를 조정하거나 기존 재화를 초기화하지 않습니다. 선택 전 M10/M11 전체 완료를 주장하지 않습니다. 장기 성장 시뮬레이터가 실험 체크포인트의 큰 진단 배열을 줄여 저장하는 것은 기존에 명시된 실험 전용 동작이며, 실제 플레이 저장 용량 문제가 해결됐다는 근거로 사용하지 않습니다.


Compressed prototype storage was also verified in a separate Chrome test key:1,057,532 characters including wrapper, read-back equality PASS. This is a reversible capacity experiment, not a production encoding change.
