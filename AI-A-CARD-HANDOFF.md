# AI A 인계: 정보 카드 출처·원문·시각 표시

대상: `t05/publish`. AI A 단계는 이 문서 저장 후 중단한다.
공식 검사: `T05-CONTRACT.md`, `tests/t05-fixed.test.mjs`의 고정 10개. 두 파일과 기대 결과는 수정하지 않았다. `T05_CHECKLIST.md`는 만들지 않았다.

## 버전과 제한
현재 루트 Git 저장소에 커밋이 없어 HEAD ID가 없다. `git rev-parse HEAD`는 unknown revision 오류, `git status --short`는 `?? t05/`를 반환했다. 새 커밋은 생성하지 않았다. 파일 기준 해시는 evidence/ai-a-card-source-hashes-before.json에 기록했다.
작업 상한: 20분, 요청/도구 호출 5회. 실제 호출: functions.exec 4회 및 그 안의 exec_command 4회(동일 실행을 감싸는 도구). 검사 실행 2회. 최종 실제 시각과 경과 시간은 evidence/ai-a-card-end.json 참조.

## 명령과 결과
1. 루트에서 `git rev-parse HEAD`, `git status --short`, `Get-Command node`, `Get-FileHash t05/publish/tests/t05-fixed.test.mjs,t05/publish/T05-CONTRACT.md` 실행. Git 결과는 위와 같고 Node 경로는 C:\Program Files\nodejs\node.exe.
   `t05/publish`에서 `node tests/t05-fixed.test.mjs evidence/ai-a-card-before.json`: 10/10 PASS, 종료 코드 0.
2. `Get-FileHash`로 표시 파일 2개 변경 전 해시 저장. PowerShell `ReadAllText` → 기존 메타정보 블록 정확히 `Replace` → `WriteAllText`로 app/page.tsx 수정. `AppendAllText`로 app/globals.css에 메타정보 전용 스타일 추가. 실행 성공. 자세한 기록은 evidence/ai-a-card-edit-log.txt.
3. `t05/publish`에서 `node tests/t05-fixed.test.mjs evidence/ai-a-card-after.json`: 10/10 PASS, 종료 코드 0.
   `Get-FileHash tests/t05-fixed.test.mjs,T05-CONTRACT.md` 후 변경 전 해시와 비교: 두 공식 파일 모두 동일.
   `node node_modules/typescript/bin/tsc --noEmit --incremental false`: 종료 코드 0, 진단 없음.
4. PowerShell `Set-Content`로 이 인계 문서와 종료 기록 저장, `Get-FileHash`로 표시 파일 최종 해시 기록. 저장 후 작업 중단.

## 변경 내용
- app/page.tsx: 출처명을 별도 행으로 표시하고 저장된 source_url의 “원문 데이터 보기” 링크를 분리했다. 새 탭 안내 및 noopener noreferrer 적용.
- source_time은 “출처 데이터 기준 시각 · KST”, fetched_at은 “마지막 성공 조회·저장 시각 · KST”로 표시. time/dateTime 요소 사용. 한국 시간(KST, UTC+9) 안내 추가.
- 조회 전에는 미조회 상태를 표시하고 출처 시각이 없을 때는 기존 누락 안내를 유지한다. stale 상태에서는 마지막 정상 기록의 값과 시각임을 명시한다.
- app/globals.css: 카드 메타정보 대비·간격·링크 밑줄·긴 텍스트 줄바꿈 개선. 480px 이하에서는 세로 배치.
- 조회·저장·복구·CSV 함수와 데이터 계약은 변경하지 않았다.

## 검사 결과
F01~F10: 작업 전 전부 PASS, 작업 후 전부 PASS. 실패 검사 회차 0회.
공식 계약 및 검사 파일 변경 없음(전후 SHA-256 비교).
TypeScript 검사 PASS.

## 남은 문제와 다음 AI 작업
구현과 위 검사는 완료했다. 브라우저 시각 검증과 프로덕션 빌드는 실행하지 않았다. 다음 AI는 정상/조회 전/출처 시각 없음/stale/합성 상태에서 레이블과 링크를 확인하고, 모바일에서 줄바꿈·가독성 및 키보드 접근성을 확인한다. 원문 URL은 기존 공개 API URL이며 저장 당시 응답의 고정 스냅샷이 아니다. 저장 원자료는 기존 원자료 대조 영역에서 확인할 수 있다.
`final` 등 다른 소스 사본 동기화, 패키징, 배포는 수행하지 않았다. 변경 대상은 승인된 publish뿐이다.
