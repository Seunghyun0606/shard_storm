# M16 Release QA

런타임 `5285fad`, schema11, 빌드 `6a4887cb09ad399665571fd9acd584a3853929b0042971d273c2f1e55186de4e`. 외부 배포는 수행하지 않았다.

| 확인 | 결과 / 근거 |
|---|---|
| 단위·통합 |377 PASS / FAIL0, `artifacts/m16-unit-final.txt`|
| M16 비교 |1350 actual Run PASS, `m16-benchmark-results.json`|
| 기존 명령 |benchmark / balance / M12 / M13 / M14 / M15 모두 PASS, `m16-regression-results.json`|
| Chrome 포인터 |실제20초14 Run PASS, `m16-browser-results.json`, `m16-optional-browser-results.json`|
| Extra Time·홀드·드래그 |실제32초1 Run, Signature3/Evolution2/Relic2 PASS, `m16-extra-browser-results.json`|
| 19종 윤곽선 |25/50/100% 실제 Canvas 렌더, 전투 기록 불변, `m16-reveal-results.json`|
| 전체20개 저장 |실제32초20 Run·무손실·reload2회 해시 일치, `m16-storage-current32-results.json`|
| 손상·용량·Export |손상 원본 export 일치, quota 실패 후 원본·잔고 유지, `m16-recovery-results.json`|
| 엔딩·접근성 |6초 공개·Skip·Escape·재생·포커스 순환·reload 무중복·설정 복원, `m16-ui-final-results.json`|
| 로컬 릴리스 |manifest·JS 구문·HTTP 모듈 경로 PASS, `m16-release-smoke-results.json`|

포인터 QA는620×800,1280×720,1920×1080, DPR1/2, Focus 및 Reduced Motion 조합을 포함한다. 실제 플레이15 Run에서 시간 스킵·미처리 물리 시간 폐기·늦은 파동 피해는 모두0이었다. Console/Page 오류0. 자동 입력과 렌더 fixture를 사람이 플레이한 결과로 분류하지 않는다.

핵심 화면:

- `artifacts/m16-world-boss-w5-playing.png`
- `artifacts/m16-ending-final-reveal.png`
- `artifacts/m16-reveal19-0.5.png`
- `artifacts/m16-optional-draft-complete.png`
- `artifacts/m16-extra32-result.png`
- `artifacts/m16-corrupt-recovery.png`

발견·수정: 종료 후 Chain 객체 정리로 Protocol 증거가 소실되던 문제(M15), 실험 모드 종료 시 오디오 옵션 표시·재생 상태가 실제 계정으로 복원되지 않던 문제(M16). QA 스크립트의 Node 전용 모듈 브라우저 import와 range 입력 방식은 실제 브라우저용 준비·키보드 입력으로 수정했다. 첫 성장 코호트의20초 고정은 자료에서 명시하고 별도 Extra Time 실험을 추가했다.

현재 새로 확인한 미수정 전투·정산 P0 오류는 없다. 사람의 재미·감각적 편안함, 실제 GPU 프로파일링과 acoustic latency, 모든 브라우저/저장 제한, 과거 M11 54000 Run 코호트의 전면 재실행은 이번 검증에 포함하지 않았다. 정상 표본 skip0은 기존 visible-stall 정책 제거를 뜻하지 않는다.
