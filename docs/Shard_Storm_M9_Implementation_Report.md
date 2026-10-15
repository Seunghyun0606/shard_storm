# M9 Shape Ecology 구현·검증 기록

현재 단계는 **최종 성장 검증 진행 중**입니다. M9.0은 `ab47fbc`, M9 핵심 기능은 `ce050d9`로 원격 `feat/m9-m11-content-expansion`에 보존되어 있습니다. M10·M11은 이후 단계이며 이 문서에서 완료로 계산하지 않습니다.

## 실제 구현

기존 7종에 Splitter/Fuse Bomb/Conductor/Mirror/Gravity Well/Repair Node를 추가했습니다. HP·BonusRaw·반경·Rank/Tier·확률·종별 cap은 PRD를 따릅니다. 기존 M6 특수 추첨을 보존하며 독립 ecology RNG, trait RNG, formation RNG를 사용합니다. 신규 특수 alive 상한은 7입니다.

- Splitter는 .06초 후 안전 좌표에 Echo 2개를 시도합니다. Run20/live6/전체 밀도 상한을 지키며 실패 시 겹쳐 생성하지 않습니다. Echo는 HP1·반경16, Raw0 정책입니다. 화면 콤보에는 기여하지만 일반 파괴·Run Tier·영구 파괴·광석·Catalyst·계약/Anomaly 조건에는 기여하지 않습니다. 자식이 살아 있는 동안 부모 Chain을 유지합니다.
- Fuse는 첫 양수 실제 피해에서 .70초 점화, 사망 시 .08초 조기 폭발을 예약합니다. 버전으로 오래된 타이머를 무효화하며 100px/피해2 파동은 도형당 1회입니다.
- Conductor는 생성 시 가장 가까운 일반 대상 2개를 고정합니다. 사망 .04초 뒤 현재 생존·115px 범위 내 대상에 피해2, Chain당 node 4개입니다. 사라진 대상을 새로 선택하지 않습니다.
- Mirror는 실제 main shard 접촉에서 일반 피해 후 같은 projectile을 최대70도로 전환합니다. 도형당2회, projectile-target 중복 적중을 막습니다. Gravity는 가장 가까운 생존 well 하나로 틱6도·파편 누적30도 제한을 적용하고 실제 짧은 swept segment로 충돌을 계산합니다. auxiliary는 제외합니다.
- Repair는 .85초마다 105px 내 손상 비율이 큰 일반 대상2개를 HP1씩 복구합니다. 대상당 Run2HP, maxHP를 지키고 게임 시간·일시정지를 따릅니다.

Reinforced/Volatile/Reflective/Hollow는 독립 secondary 슬롯 하나를 사용합니다. 기존 primary의 RNG·배타 규칙을 유지하고 금지 조합은 재추첨하지 않습니다. 외곽 아이콘·연결선·핵·Fuse 경고를 Canvas로 표시합니다. 생성 중 grace와 fade를 공유합니다.

Ring/Chain Corridor/Shield Fortress/Bomb Garden은 기존 배치와 공존합니다. 일반 적격 추첨은 기존80/신규20이며, 첫 소개는 기작에 맞는 배치를 우선합니다. 이상 좌표가 실패한 경우 실제 배치를 scattered로 기록합니다. 배치 예약도 기존 batch3와 안전 간격을 지킵니다.

소개 상태는 실제 안전 등장 후 정산에서만 확정합니다. 저장 키를 유지하며 schema1..5를 schema6으로 읽고 기존 재화·19개 스킬·Relic·Contract·Anomaly·미완료 정산을 보존합니다. 실험은 메모리 sandbox입니다. Adaptive .18/.16은 개발 실험에만 있으며 실제 기본 .20×3, 가격과 Refinery .06은 유지했습니다.

## 검증과 수정

- 재시작 후 `npm test`: **179 PASS / 0 FAIL**, 기존153개 유지. 로그: `artifacts/m9-unit-final.txt`. Mirror+Ricochet Coil의 같은 projectile 반사·벽 bounce 보존 및 auxiliary→Echo의 보상/재분열 차단을 추가 검증했습니다.
- Chrome155.0.8059.79 실제20초 포인터5Run, 콘솔/page 오류0. Rank0 자연 프로필과 Rank1..3/복합 기작 fixture를 구분합니다. `artifacts/m9-browser-results.json`, `artifacts/m9-fixture-six-shapes.png`. 성장 worker와 동시 실행한 결과이므로 최종 격리 성능 근거로 사용하지 않습니다.
- 핵심 회귀 benchmark의 60초/20초 골든은 변경하지 않았습니다. 최종 실행 결과와 성장 수치는 최종 밸런스 보고서에 기록합니다.
- 신규 단위 검사는 각 기작의 양성·음성 조건, 타이머/사망/종료·상한, trait 호환, 안전 배치·fallback, 소개 정산1회, schema 보존, OFF 골든, cosmetic parity 및 도형 조합을 검증합니다.
- 발견해 수정한 오류: 생존 Echo의 Chain이 조기 제거됨, Echo 뒤 일반 사망에서 Chain 계약 조건이 잘못 충족될 수 있음, 마지막 Echo 사망의 FieldClear 누락, Shape/Projectile 숫자 ID가 같을 때 Gravity 후보 제외, 첫 소개 배치가 일반 확률 추첨에 가려짐, radial 장식의 HUD 침범. 각각 코드와 회귀 검사를 추가했습니다.
- 이전 소스로 실행한 중단 실험은 `artifacts/m9-pre-fix-checkpoints.zip`에 원본과 SHA manifest를 보존했습니다. 완료 근거에 합산하지 않습니다. 현재 성장 실험은 의존 파일 해시와 경로별 저장 상태를 확인하여 이어 실행합니다.

## 사람 검증과 후속 범위

자동 조준과 Chrome 포인터 자동화는 사람의 재미 검증이 아닙니다. 사람 플레이에서는 Fuse/Conductor를 먼저 노리는 선택이 읽히는지, Mirror·Gravity의 파편 경로를 이해하는지, Repair 우선 처치가 유효한지, Echo와 실제 보상을 혼동하는지, 20초 안에 처음 본 기작을 파악하는지 확인해야 합니다.

정교한 재질·전용 사운드·도형별 복합 생성 애니메이션·실제 물리 slow motion·Shader는 [Deferred VFX](Shard_Storm_Deferred_VFX_TODO.md)에 남깁니다. M10의30개 스킬/Signature/Evolution과 M11의6개 도형/Codex/Elite는 별도 다음 단계로 계속 구현합니다.
