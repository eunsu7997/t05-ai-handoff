# AI B 결과: 정보 카드 출처·원문·시각 표시 검증

대상: `t05/publish`. 근거: `AI-A-CARD-HANDOFF.md`, `T05-CONTRACT.md`, `tests/t05-fixed.test.mjs`, 실제 코드.
AI B 모델: Claude Opus 5.5 (`claude-opus-5-5`), Claude Code.
요청에 적힌 `../../tests/t05-fixed.test.mjs` 경로는 존재하지 않습니다. 계약서의 실행 방법에 따라 프로젝트 안의 `tests/t05-fixed.test.mjs`를 사용했습니다.

## 1. 총 작업 시간
- 시작: 2026-10-02T02:59:18Z (KST 11:59:18). 기록 파일: `evidence/ai-b-card-start.json`
- 구현·검증 종료: 2026-10-02T03:05:36Z (KST 12:05:36), **약 6분 18초**. 기록 파일: `evidence/ai-b-card-verification.json`
- 이 결과 문서 작성 직전: 2026-10-02T03:08:29Z, 정리 작업까지 포함하면 **약 9분 11초**
- 상한 20분(1,200초) 이내입니다.

## 2. 요청과 도구 호출 횟수
- 사용자 요청: 2회 (작업 요청 1회, 결과 정리 요청 1회)
- 도구 호출: 작업 단계 34회 + 정리 단계 2회(Git 확인 1회, 이 문서 저장 1회) = **총 36회**. 상한 60회 이내입니다.
  - 작업 단계 34회 내역: Bash 30회, 브라우저 검증 스크립트 작성(Write) 1회, 스크린샷 확인(Read) 3회
- 고정 검사 실행: 2회 (수정 전 1회, 수정 후 1회)
- Headless Chrome 검증 실행: 6회 (첫 회는 Chrome 기동 지연으로 실패, 나머지 5회 성공)
- 네트워크 요청:
  - Open-Meteo 공개 API를 브라우저 검증 중 여러 번 조회했습니다.
  - 배포 사이트 API에는 GET 2회와 POST 2회가 갔습니다(11번 1항 참고).

## 3. 고정 검사 최종 PASS 수
**10/10 PASS** (F01~F10). 기록 파일: `evidence/ai-b-card-after.json`. 수정 전에도 10/10 PASS였습니다(`evidence/ai-b-card-before.json`).
작업 전후 SHA-256이 같으므로 두 공식 파일은 변경되지 않았습니다.
- `tests/t05-fixed.test.mjs`: `c81933930ace81cca469130d037ea218dc1acce4c7d15628c5eb781cad0ea2ee`
- `T05-CONTRACT.md`: `d3e1b7609594ea0ab635a8eb5ba84f278a8764fa52298f844ae79fb82cc0e69a`

## 4. 실패한 검사 회차 수
**0회** (2회 실행, 모두 10/10 PASS)

## 5. TypeScript 검사
`node node_modules/typescript/bin/tsc --noEmit --incremental false`: 수정 전후 모두 **종료 코드 0, 진단 없음**

## 6. 프로덕션 빌드
`node scripts/run-framework.mjs build`: 수정 전후 모두 **성공 (종료 코드 0, "Build complete")**
- pnpm이 전역 설치되어 있지 않아, `pnpm build`가 실행하는 스크립트를 직접 실행했습니다. 전역 설치와 잠금파일 변경은 하지 않았습니다.
- `python scripts/source-snapshot.py` 단계는 실행하지 않았습니다(11번 3항 참고).

## 7. 데스크톱 브라우저 검증 (1280×900)
검증 환경:
- Headless Chrome 154를 CDP로 조작했습니다.
- 로컬 vinext 개발 서버와 로컬 D1을 사용했습니다. D1에는 `wrangler d1 execute --local`로 마이그레이션을 적용했습니다.
- 두 번째 실행부터는 배포 API 요청을 Fetch 가로채기로 로컬 서버에 연결했습니다.

결과는 모두 통과입니다.

| 상태 | 확인 결과 |
|---|---|
| 조회 전 | 상태 표시 "조회 전". 원문 칸은 "조회 후 확인할 수 있습니다", 시각은 "—". 미조회 안내 표시. CSV 버튼 비활성화 |
| 실제 조회 | 출처명이 "Open-Meteo · 수치예보 모델 기반 현재 기온"으로 표시됨. "원문 데이터 보기" 링크는 새 탭으로 열리고 `noopener noreferrer` 적용. 출처 시각과 저장 시각은 KST로 표시되고 `time` 요소에 dateTime 값이 있음. CSV 버튼 활성화 |
| 출처 시각 없음 (T04-NORMAL-D1-B) | "출처가 시각을 제공하지 않음" 표시 |
| stale (T04-TIMEOUT) | 상태 표시 "오래된 값". 마지막 정상 기록의 값과 시각이라는 안내 표시. 오류 카드에 "stale / timeout"과 다시 시도 버튼 표시. CSV 버튼 비활성화 |
| 합성 replay | "합성 시험 데이터 · 실제 기록 아님" 표시. 원문 칸은 수정 후 "합성 fixture · 열 수 있는 원문 없음" |
| 키보드 | Tab 5회로 원문 링크에 도달. 3px 파란색(#163eec) 포커스 테두리 표시 |
| CSV | 파일명 `daily-temperature-records.csv`, 형식 `text/csv;charset=utf-8`, UTF-8 BOM 있음. 8열 헤더와 실제 기록 1행 확인. object URL 해제 확인 |
| 기타 | 가로 넘침 없음, 콘솔 오류 0건 |

## 8. 모바일 375px 검증 (375×812, mobile emulation)
- 카드 메타정보가 세로로 배치되고(480px 이하 규칙), 긴 출처명도 줄바꿈되어 읽을 수 있습니다.
- 조회 전, 실제 조회, 출처 시각 없음, stale, 합성 상태의 레이블이 데스크톱과 같습니다.
- 페이지 가로 스크롤이 없습니다(scrollWidth 375 = clientWidth 375).
- 키보드 Tab으로 원문 링크에 도달하고 포커스 테두리가 보입니다.
- 콘솔 오류 0건입니다.
- 스크린샷: `evidence/ai-b-card-screens/mobile-*.png`

## 9. 실제 수정한 파일
- `app/page.tsx` 1줄
  - 문제: 합성(replay) 상태에서 "원문 데이터 보기"가 열리지 않는 `https://fixtures.aleph.invalid/t04/demo-index`로 연결되었습니다.
  - 수정: replay 모드일 때만 링크 대신 `합성 fixture · 열 수 있는 원문 없음`이라는 글자로 표시합니다.
  - fixture 데이터, 조회·저장·복구·CSV 함수는 변경하지 않았습니다.
  - 현재 SHA-256: `1f6b8e480eaa620321a9e42e7044141a30125514c11281f5cd116961c07a7441`

## 10. 생성한 증거 파일
- `evidence/ai-b-card-start.json`: 시작 시각, 모델, 시작 커밋
- `evidence/ai-b-card-before.json`: 수정 전 고정 검사 결과
- `evidence/ai-b-card-after.json`: 수정 후 고정 검사 결과
- `evidence/ai-b-card-verification.json`: 종료 시각, TypeScript·빌드 결과, 브라우저 상태별 측정값, CSV 내용, 외부 영향 기록
- `evidence/ai-b-card-screens/` (10장)
  - desktop: `desktop-1-pre`, `desktop-2-live`, `desktop-3-focus`, `desktop-4-replay-stale`, `desktop-5-replay-no-source-time`
  - mobile: `mobile-1-pre`, `mobile-2-live`, `mobile-3-focus`, `mobile-4-replay-stale`, `mobile-5-replay-no-source-time`
- `AI-B-CARD-RESULT.md`: 이 문서

## 11. 남은 문제
1. **로컬 화면이 배포 서버를 사용함**
   - `lib/client-api.ts`의 `BOARD_URL`이 배포 사이트 주소로 고정되어 있어, 로컬 개발 화면도 배포 DB를 읽고 씁니다.
   - 이 때문에 B의 첫 브라우저 검증에서 "실제 기온 조회" 2회(03:01:46Z, 03:01:52Z)가 배포 DB에 저장되었습니다. 배포 사이트의 2026-10-02 KST live 기록이 실제 Open-Meteo 값으로 같은 날짜 UPSERT되었습니다. 합성 데이터는 배포 DB에 넣지 않았습니다.
   - 코드는 수정하지 않았습니다.
2. **모바일 기록 표:** 375px에서 "하루 한 줄의 기록" 표의 오른쪽 열을 보려면 표 안에서 가로로 밀어야 합니다. 이번 작업 전부터 있던 레이아웃이며, 페이지 전체 가로 스크롤은 없습니다.
3. **공개 소스 미갱신:** `data/source-snapshot.json`과 `public/source.zip`을 다시 만들지 않아, 공개 소스 다운로드에는 이번 카드 변경이 들어 있지 않습니다.
4. **원문 링크의 한계:** 원문 링크는 현재 Open-Meteo를 다시 조회하는 주소이고, 저장 당시 응답을 그대로 보관한 것이 아닙니다(A 인계 문서에 이미 적힌 한계).
5. **검증 범위의 한계:** 이번 브라우저 검증은 로컬 D1 기준입니다. 실제 Cloudflare D1 배포 검증과 실제 브라우저의 파일 저장 대화상자 확인은 하지 않았습니다(CSV는 Blob 내용으로 확인).
6. **하지 않은 작업:** 커밋, 패키징, 배포, `final` 등 다른 사본 동기화.

## 12. Git
- AI B 시작 시점 커밋: `5f0afcbdc1a7d12f33ad617ef604be252b7f2166` ("T05: save AI A handoff state"). 시작 시 작업 트리는 깨끗했습니다.
- 현재 HEAD: 위와 같습니다(새 커밋 없음).
- 현재 `git status --short` (이 문서 저장 전 기준; 저장 후에는 `?? AI-B-CARD-RESULT.md`가 추가됨):
  ```
   M app/page.tsx
  ?? evidence/ai-b-card-after.json
  ?? evidence/ai-b-card-before.json
  ?? evidence/ai-b-card-screens/
  ?? evidence/ai-b-card-start.json
  ?? evidence/ai-b-card-verification.json
  ```
- 폴더 소유자가 달라 Git 명령은 `git -c safe.directory=*`로 실행했습니다. 전역 Git 설정은 바꾸지 않았습니다.
