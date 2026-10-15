# 저장 용량 — 보존 방식 확인

상태: **사람 결정 대기. 실제 저장 형식과 사용자 데이터는 변경하지 않았습니다.**

M10/M11 구현 QA 중 실제 Chrome 저장 한도에 도달하는 문제를 재현했습니다. 이는 기능의 단위 테스트 실패가 아니라, 전투 진단을 포함한 최근20개 Run 전체 JSON 크기의 문제입니다. 기존 `writeSave`는 예외를 잡고 저장 불가 안내를 하지만, 이후 세션 진행이 새로고침까지 보존된다고 보장할 수 없습니다.

## 재현

`tests/storage-capacity-repro.mjs`는 별도 Chrome context에서 Rank4/MAX49·Signature3·Evolution2·Relic2 fixture로 서로 다른 시드의 실제20회 전투·정산을 실행합니다. 사용자 프로필이나 실제 저장 키에는 쓰지 않습니다. 예산을 줄인 가짜 로그가 아닌 완전한20개 record를 보존합니다.

[측정 결과](../artifacts/storage-capacity-repro.json): 총7,826,742문자/UTF-8 byte. Chrome155에서 테스트 전용 키로 저장할 때 `QuotaExceededError`. 14번째 기록부터 JSON이5,441,009문자로 늘어납니다. 실제 한도 도달 시점은 브라우저·계정·빌드·다른 origin 데이터에 따라 달라집니다.

진단용 gzip 무손실 round-trip은793,093byte, base64 1,057,460문자로 원문 동일성을 확인했습니다. 이 수치는 저장 형식 채택이 아닌 **검토용 압축 가능성 증거**입니다. 전체 fixture는 `artifacts/storage-capacity-fixture.json.gz`이며 생산 `loadSave/writeSave`는 그대로입니다.

## 선택지

**A · 권장: 전체 내용을 무손실 압축해 같은 저장 키에 보관.** 재화·스킬·정산·최근20회 상세 기록을 모두 보존합니다. 기존 일반 JSON도 계속 읽고 새 인코딩 식별·오류 검증·원자적 쓰기/복구를 추가해야 합니다. 적합한 codec과 동기/비동기 I/O의 구체적 구현은 검증 후 보고합니다. 포맷 및 저장 경로의 변경이므로 사용자 지정 Human Gate의 저장 구조 변경에 해당합니다.

**B: 저장할 상세 전투 진단 로그를 제한.** 재화·구매·정산·Run 요약·Codex/Elite의 실제 카운터는 유지하되 상세 source 이벤트·샘플 진단의 일부를 저장에서 생략합니다. 기존 기록의 상세 로그 보존 정책도 명확히 정해야 합니다. 무엇을 덜 보존할지 사용자 결정이 필요하며, 승인 없이 기존 기록을 잘라내지 않습니다.

두 안 모두 신규 경제 수치를 조정하거나 기존 재화를 초기화하지 않습니다. 선택 전 M10/M11 전체 완료를 주장하지 않습니다. 장기 성장 시뮬레이터가 실험 체크포인트의 큰 진단 배열을 줄여 저장하는 것은 기존에 명시된 실험 전용 동작이며, 실제 플레이 저장 용량 문제가 해결됐다는 근거로 사용하지 않습니다.


Compressed prototype storage was also verified in a separate Chrome test key:1,057,532 characters including wrapper, read-back equality PASS. This is a reversible capacity experiment, not a production encoding change.
