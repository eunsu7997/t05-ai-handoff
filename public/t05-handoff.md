# T05 한 페이지 인수인계 · AI A → Claude

**목표**: T04 정보판에 저장된 실제 기온 기록 CSV 다운로드 기능 하나를 완성한다. 원문 대화 없이 이 문서와 저장소만으로 이어 한다.

**현재 상태**: A가 CSV 변환 핵심을 만들고 계획대로 중단했다. 고정 검사 10개 중 **8개 PASS, F05·F07 FAIL**. 다운로드 UI는 아직 없다. 공개 사이트에는 A의 미완성 코드를 배포하지 않았다. 기존 회귀 검사는 통과했다.

**버전**: A 시작 `ca65a36325938224aa9d71fbbe53204fde70e8be`, A 종료/B 코드 시작 `60d9d5b5d9cc9944bf3195df8c3d8db6bedfaaf2`. `source/`는 종료 커밋의 파일, `repository.bundle`은 Git 이력이다. Git 재현: `git -c core.autocrlf=false clone repository.bundle resumed` → `git -C resumed switch codex/t05-ai-a`. B 시작 전에 `git rev-parse HEAD`로 위 종료 ID와 대조한다. 원본 사이트 소스 URL의 표시 ID는 별도이며 로컬 Git ID와 혼동하지 않는다.

**실행 명령**: Node 24 사용 권장(22.13+). 프로젝트 루트에서 `node tests/t05-fixed.test.mjs evidence/b-round-01.json`. 이 검사는 의존성 설치 없이 실행된다. 전체 앱은 `pnpm@11.25.0`으로 기존 잠금파일을 유지해 설치하고 `python scripts/source-snapshot.py` → `pnpm build`. 개발: `pnpm dev`. Python이 없으면 기존 snapshot 생성기를 실행할 수 있는 환경에서 진행한다. 로컬 D1 마이그레이션 적용은 `node node_modules/wrangler/bin/wrangler.js d1 migrations apply site-creator-d1 --local --config dist/server/wrangler.json --persist-to .wrangler/state`, 이어 `pnpm start`. 실제 데이터 API는 `lib/client-api.ts`에서 공개 사이트를 가리킨다. 로컬 조회도 실제 기록을 갱신할 수 있으므로 합성/고정 검사와 구분한다.

**통과 검사**: `tests/t05-fixed.test.mjs`의 SHA-256은 `c81933930ace81cca469130d037ea218dc1acce4c7d15628c5eb781cad0ea2ee`. F01 BOM·헤더, F02 값 보존, F03 정렬·불변, F04 CSV 인용, F06 null 시각, F08 필드 제한, F09 갱신 실패 뒤 내보내기, F10 기존 회귀 통과. A 결과는 저장소 `evidence/a-round-*.json`, 실제 시간·호출은 별도 `a-end.json`.

**남은 문제**: `lib/temperature-csv.ts`의 `cell`은 문자열 수식 시작 문자(선행 공백·탭·CR 포함)를 아직 중화하지 않는다(F05). `exportTemperatureCsv(readings, mode)`가 replay를 거부하지 않는다(F07). 숫자형 음수는 그대로 유지해야 한다. `app/page.tsx` 정보판 기록 영역에 다운로드 버튼을 연결해야 한다. live의 저장된 reading 배열만 전달하고, 빈 목록·replay·처리 중에는 비활성화한다. Blob·`.csv` 파일명·object URL 해제 및 다운로드 결과를 실제 브라우저에서 확인한다.

**다음 행동**: B의 정확한 모델과 실제 시작 시각을 먼저 기록한다 → 위 두 실패와 UI를 완성한다 → 같은 검사 10개와 브라우저 검증을 실행하고 종료 커밋·실제 시간·도구 호출 수·오류 회차 수를 남긴다. A와 같은 상한 **20분·도구 호출 60회**, 같은 초기 요청은 `T05-CONTRACT.md`에 있다. 상한 안에 못 끝나면 상태를 그대로 보고한다.

**건드리지 말 것**: 고정 검사·기대 결과, T04 fixture/계약, 기존 조회·저장·복구 로직, pnpm 잠금파일, 실측/합성 구분. 공개 데이터 외 정보나 비밀키를 넣지 않는다. A와 B는 순차 작업이므로 수치만으로 모델 우열을 결론 내리지 않는다. 재작업량은 제출 후 고정 시작·종료 소스에서 생성물/lockfile을 빼고 계산하므로 수기로 만들지 않는다.

Windows에서는 Git의 CRLF 자동 변환을 끄고 복제하세요. 이후 검사 해시를 대조하세요. 내용이 같은데 바이트 해시가 다르면 LF 줄바꿈으로 정규화한 SHA-256으로도 비교할 수 있습니다. 검사 내용은 바꾸지 않습니다.

---
## B 업데이트 (Claude, Sonnet 5.5)
**상태**: 고정 검사 10/10 PASS(SHA-256 동일). F05: 문자열이 `= + - @`(선행 공백 허용)·탭·CR로 시작하면 `'` 접두, 숫자 음수는 유지. F07: `mode!=='live'`이면 예외. 정보판 기록 영역에 `#csv-download` 버튼 연결(live 저장 reading만, 빈 목록·replay·busy면 비활성, Blob→object URL→revoke). 브라우저에서 BOM·588바이트·헤더+2행·무요청·revoke·replay 비활성 확인. 오류 회차 1(b-round-01, 편집 실수). 종료 커밋은 `out/b-end.json`. 미배포.
