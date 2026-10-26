# workingholidayage.com 로컬 개선본

작업일: 2026-10-26. 서비스 파일은 `workingholidayage/`에 있으며 원본은 `backups/workingholidayage/original-2026-10-26/`에 보존한다. 업로드·배포 결과는 아래 검증 기록에 갱신한다. 기존 `adsense-report.md`도 수정하지 않았다.

## 반영한 내용

- 기존 지도·계산기·연령 그룹·국가 소개·테마 구조 및 29개 연령 데이터 유지.
- 첫 화면에 대한민국 국적자 대상, 연령만 비교한다는 범위와 입력 정보 처리 설명.
- 결과에 계산 기준일, 공식 연령 안내표 링크, 확인일 표시.
- 일본 기본 만 25세 기준 유지. 만 26~30세 예외 가능성을 전체/개별 결과에서 별도로 안내하고, 자동 인정하지 않음.
- 계산 방법, 윤년·기기 시간대·D-day의 한계, FAQ, 공식 출처 안내.
- 불완전한 일본 사진 주석 문구 제거. 캐나다 소개의 변동성 높은 수치와 모집 인원 표현을 계산기 관련 설명으로 교체.
- 날짜 입력 오류를 입력창 근처에 표시하고 해당 입력으로 포커스 이동. form 제출 지원.
- 지도 비율과 클릭 영역을 보존하면서 선택 목록을 제공하고 스크롤바 복원.
- 결과 카드 내부 details/summary의 기본 클릭·키보드 동작을 부모 이벤트가 가로채지 않도록 수정.
- 키보드 바로가기, 포커스 표시, 움직임 감소 환경 지원, 잘못된 CSS 속성 3곳 수정.
- /about/, /privacy/, /contact/, 광고 없는 404.html, robots.txt 추가.
- 한국어 페이지만 sitemap에 포함. 운영자의 한국어 전용 운영 지시에 따라 /ja, /ja/ 및 하위 경로의 리다이렉트를 제거하고 실제 HTTP 404로 처리. 일본어 페이지·언어 전환·hreflang은 제공하지 않음. 한국어 계산기의 일본 국가 정보는 유지.
- 실제 광고 스크립트는 추가하지 않음. 기존 계정 확인 메타 태그와 ads.txt 유지.

## 운영 확인 및 남은 범위

1. 실제 문의 경로로 공개 저장소 `https://github.com/leega670-cmd/felix/issues`를 연결했다. 저장소가 공개이며 이슈 사용이 활성화된 것을 GitHub API로 확인했다. GitHub 로그인·공개 게시와 민감정보 금지를 안내한다. 사이트 소스 관리 계정은 실제 저장소 소유자인 leega670-cmd로 표시한다. 임의 이메일은 만들지 않았다.
2. 운영 응답과 GitHub Cloudflare Pages 검사 결과로 Cloudflare Pages 호스팅을 확인해 개인정보처리방침에 반영했다. GitHub 문의 정보의 처리 목적·공개·삭제와 GitHub/Cloudflare 정책 링크를 추가했다. 별도 비공개 문의 이메일, 호스팅 계정 내부의 로그 보관 설정과 광고 계정 설정은 아직 제공되지 않았다.
3. 실제 Chromium·WebKit 엔진을 설치해 Pixel 7/iPhone 13 모바일 조건과 화면 너비 320·375·390·412·768·1440px, 밝은/어두운 테마를 검증했다. 실물 휴대전화가 아닌 브라우저 에뮬레이션이며 화면낭독기 수동 실청 검사는 포함하지 않는다. 자동 WCAG A/AA 검사에서 발견한 대비·중첩 인터랙션·이름 불일치를 수정했다.
4. 배포 전 운영 사이트는 HTTP 200이며 원본 백업과 일치했다. Chromium/WebKit에서 계산과 지도 로딩, 런타임 오류 없음과 가로 넘침 없음을 확인했다. 없는 URL과 robots.txt에 홈페이지가 200으로 반환되는 문제를 재현했다. 배포 후 개선 여부는 별도 기록한다.
5. AdSense 정책센터 문제 URL과 자동 광고/호스팅 삽입 설정은 계정에서 확인해야 한다. 404·문의 완료·오류·미완성 화면에 광고를 삽입하지 않아야 한다. 광고 도입 시 개인정보처리방침을 실제 설정에 맞춰 갱신하고 해당 지역의 동의 관리 요건을 적용해야 한다.
6. 기존 지도·국가 소개·외부 블로그의 사용 권한과 세부 사실은 별도 원문/권리 확인이 필요하다. 이번 검증 범위는 연령표, 일본 예외와 명시된 추가 안내다. 전체 국가의 체류/재참여 조건을 모두 개별 이민국 자료로 검증했다고 표시하지 않았다.

## 검증

```sh
node tests/workingholidayage.test.mjs
TZ=America/New_York node tests/workingholidayage.test.mjs
python tests/check_workingholidayage.py
```

- 계산기 테스트 8개를 기본 UTC 환경과 America/New_York 환경에서 통과.
- 입력 누락·미래·없는 날짜, 18세/36세 생일 전후, D-0, 2월 29일, 일광절약시간 날짜 차이, 일본 예외, 0건 결과, 발효 예정, 일 선택 초기화, 펼치기 키보드 이벤트, 테마, 원본 연령 데이터 보존을 검사.
- 5개 HTML의 문법상 스크립트 실행 가능 여부, ID 중복, 내부 링크·앵커, 이미지 경로, sitemap XML, 오류 페이지 noindex, 광고 호출 코드 부재 검사 통과.
- CSS 파서를 사용한 별도 점검에서 선언 구문 오류 없음.

## 공식 참고 자료

- https://adsense-ko.googleblog.com/2012/04/blog-post_25.html
- https://adsense-ko.googleblog.com/2012/09/2.html
- https://support.google.com/publisherpolicies/answer/11112688?hl=ko
- https://support.google.com/adsense/answer/1348695?hl=ko
- https://whic.mofa.go.kr/whic/about/working.jsp (29개 등록 연령/예정 상태 대조, 2026-10-26)
- https://www.kr.emb-japan.go.jp/itpr_ko/visa_working.html (일본 기본/예외 연령 및 재참여 안내)
- https://www.immigration.govt.nz/visas/korea-working-holiday-visa/ (뉴질랜드 기본 체류와 조건부 연장 경로)

## 배포 방식

2026-10-26 사용자가 모바일·운영 검증 후 업로드와 배포를 승인했다. 기존 GitHub → Cloudflare Pages 연결과 빌드 경로를 유지한다. `node scripts/prepare-workingholidayage.mjs`로 개선본을 기존 빌드 대상 `backups/workingholidayage/2026-10-26/`에 동기화한다. 원본 5개 파일은 별도 `backups/workingholidayage/original-2026-10-26/`에 보존한다. 호스팅 설정을 추측해 변경하거나 새 호스팅으로 이전하지 않는다. `tests/`, `qa/`, 이 문서는 공개 디렉터리 밖에 둔다.

모바일 브라우저 검증은 `tests/workingholidayage.browser.mjs`를 사용한다. Playwright와 axe-core는 `/tmp/wha-browser-qa/node_modules`에 임시 설치했으며 브라우저 엔진은 `/tmp/wha-playwright-browsers`에 있다. `PLAYWRIGHT_BROWSERS_PATH` 환경 변수를 지정해 실행한다. `WHA_QA_URL`로 운영 URL을 지정할 수 있다. 로컬 검증 서버의 리다이렉트·404는 실제 Cloudflare 동작의 보증이 아니므로 배포 후 운영 도메인에서 다시 검사한다.

승인 여부는 Google 심사에 달려 있으며 이 개선본이 승인을 보장하지 않는다.

## 배포 직전 검증 기록

- 최종 개선본: Chromium/WebKit × 6개 너비 × 2개 테마 및 각 엔진의 문서·HTTP·키보드 검사, 총 26개 통과·실패 0개. 기록: `qa/workingholidayage-mobile.json`.
- 운영 사이트 배포 전: 두 모바일 엔진에서 HTTP 200, 계산과 지도 로딩 정상, 런타임 오류와 전체 가로 넘침 없음. 기록: `qa/workingholidayage-before.json`.
- 자동 접근성 검사의 WCAG A/AA 위반 항목 0개. 실물 휴대전화와 보조기기 수동 검증을 의미하지 않는다.
- 정적 5페이지의 내부 링크·앵커·스크립트·CSS·sitemap 검사 및 계산기 8개 테스트 통과.
- 기존 배포 폴더와 개선본의 모든 공개 파일이 바이트 단위로 일치함을 확인했다.

## 한국어 전용 운영과 Google Analytics

운영자의 요청으로 일본어 버전 경로의 홈페이지 리다이렉트를 제거했다. /ja, /ja/ 및 하위 경로는 실제 404로 처리하고 한국어 계산기 내 일본 국가 정보는 유지한다.

제공받은 Google 태그 G-8QRH9FPYYT를 홈페이지·소개·개인정보처리방침·문의 페이지의 head에 한 번씩 추가했다. 404와 보존한 원본에는 추가하지 않았다. 개인정보처리방침에 Google Analytics 사용 목적, 데이터 범주와 측정 관리 방법을 반영했다. 별도 생년월일 분석 이벤트는 추가하지 않았다.
