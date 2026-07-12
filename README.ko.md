# AI News Curator (AI 뉴스 큐레이터)

[English README](README.md)

최근 24시간 동안의 **경제 뉴스**를 여러 언론사에서 모아 한 화면에 보여주는
뉴스 큐레이터입니다. 정치·스포츠 기사는 자동으로 걸러냅니다. 웹 앱과 데스크톱
앱(Electron) 두 가지 형태로 실행할 수 있으며, API 키나 서버 없이 무료로 동작합니다.

## 주요 기능

### 1. 뉴스 수집 (경제 섹션 RSS, API 키 불필요)
- 각 언론사의 **경제/비즈니스 섹션** 공개 RSS만 가져오므로 기본 피드가 경제 뉴스로
  한정됩니다. 브라우저는 CORS 제한 때문에 대부분의 RSS를 직접 읽을 수 없어서,
  [rss2json](https://rss2json.com)(RSS→JSON 변환)을 1차로 쓰고, 실패하면 allorigins
  CORS 프록시 → 직접 요청 순으로 폴백합니다.
- **영어 소스**: BBC Business, The Guardian Business, CNBC Business
- **한국 소스**(국문): 연합뉴스 경제, 한국경제, 매일경제
- 모든 소스를 병렬로 가져온 뒤 URL 기준으로 중복을 제거하고, 최신순으로 정렬해
  최대 50개까지 표시합니다.
- 전부 실패하면 실패 원인을 설명하는 안내용 기사 1건을 표시합니다.

### 2. 24시간 필터
- `publishedAt` 기준으로 **최근 24시간 이내** 기사만 통과시킵니다
  (`src/services/newsService.js`의 `isWithin24Hours`).

### 3. 정치·스포츠 뉴스 제외
- 한/영 정치 키워드(선거, 대통령, election, congress 등)와 스포츠 키워드(축구, 야구,
  올림픽, world cup, NBA 등)가 제목·요약·본문에 포함되면 해당 기사를 걸러냅니다.
- 영문 키워드는 단어 경계 기준으로 매칭합니다 — "bill"이 "billion"에, "house"가
  "household"에 잘못 걸리지 않도록 하기 위해서입니다(경제 기사에 흔한 단어들).
- 키워드 목록은 `newsService.js`의 `POLITICAL_KEYWORDS` / `SPORTS_KEYWORDS`에서
  수정할 수 있습니다.

### 4. 뉴스에 질문하기 — Ask the News (온디바이스 RAG)
이 프로젝트의 핵심 AI 기능입니다. **전부 브라우저 안에서** 동작합니다.

- 각 기사(제목 + 요약)와 사용자의 질문을 `Xenova/multilingual-e5-small` 임베딩 모델로
  벡터화합니다. 모델은 [Transformers.js](https://huggingface.co/docs/transformers.js)
  (ONNX/WASM)로 CDN에서 로드되며, 최초 1회 약 112 MB를 다운로드한 뒤 브라우저에
  캐시됩니다.
- 질문과 기사 벡터 간 **코사인 유사도**로 상위 5개 기사를 찾아, 각 항목이 원문 링크와
  유사도 점수를 포함한 "근거 기반 다이제스트"를 보여줍니다.
- 다국어 모델이라 **한국어로 질문해도** 영어 기사를 잘 찾아냅니다.
- API 키·서버 불필요. 웹/Electron 어디서든 동일하게 동작합니다.
- 관련 코드: `src/services/embeddingService.js`(임베딩), `src/services/ragService.js`(인덱스·검색),
  `src/components/AskNews.js`(UI).

### 5. AI 요약 (현재는 시뮬레이션)
- 화면 상단의 "AI News Summary"는 상위 5개 기사의 제목과 요약 앞부분을 잘라 보여주는
  **모의 요약**입니다. 실제 LLM 호출은 아직 없습니다.
- 자연스러운 다음 단계: RAG로 찾은 기사들을 Claude/OpenAI API에 넘겨 출처가 표시된
  생성형 요약을 만드는 것 (사용자 API 키 입력 방식).

### 6. UI / 편의 기능
- **언어 전환**: 헤더의 드롭다운으로 English / 한국어 선택 → 소스와 UI 문구가 함께 바뀌고,
  선택은 `localStorage`에 저장됩니다.
- **다크 모드**: 달/해 아이콘으로 전환, 역시 저장됩니다.
- **새로고침 버튼** + 마지막 업데이트 시각 표시.
- **뉴스 카드**: 이미지, 출처 배지, 상대 시간("3 hours ago"), "더 보기" 버튼(원문 새 탭).
- 반응형 그리드(모바일 1열 → 데스크톱 3열), Tailwind CSS 기반.
- **캐시**: 소스별 30분 인메모리 캐시로 반복 요청을 줄입니다(새로고침하면 사라짐).

## 실행 방법

```bash
npm install
npm start          # 웹 앱: http://localhost:3000
```

### 데스크톱 앱 (Electron)
```bash
npm run electron-dev    # 개발 모드 (웹 서버 + Electron 동시 실행)
npm run build && npm run electron-pack   # 배포용 빌드 (dist/ 폴더)
```

### Docker
```bash
npm run docker:build && npm run docker:run   # http://localhost:3000
```
자세한 배포 방법은 [DEPLOYMENT.md](DEPLOYMENT.md) 참고.

## 프로젝트 구조

```
src/
├── App.js                        # 메인 앱: 상태 관리, 헤더, 레이아웃
├── components/
│   ├── AskNews.js                # 시맨틱 검색(RAG) 패널
│   ├── NewsCard.js               # 개별 뉴스 카드
│   ├── NewsSummary.js            # 상단 요약 박스
│   └── LoadingSpinner.js         # 로딩 표시
└── services/
    ├── newsService.js            # RSS 수집, 24시간/정치 필터, 캐시
    ├── embeddingService.js       # Transformers.js 임베딩 (온디바이스)
    └── ragService.js             # 벡터 인덱스 + 코사인 유사도 검색
electron.js                       # Electron 메인 프로세스
```

## 커스터마이징

- **뉴스 소스 추가/변경**: `src/services/newsService.js`의 `NEWS_SOURCES` 맵에 RSS 주소를 추가
- **필터 키워드 수정**: 같은 파일의 `POLITICAL_KEYWORDS` 배열
- **캐시 시간**: `cacheTimeout` (기본 30분)
- **UI**: `src/components/` 아래 컴포넌트 수정

## 알려진 한계

- **무료 공개 서비스 의존**: rss2json·allorigins 같은 무료 서비스가 느리거나 다운되면
  뉴스 수집이 실패할 수 있습니다. 실서비스라면 자체 프록시나 서버사이드 수집을 권장합니다.
- **RSS 파서가 정규식 기반**: rss2json 폴백 경로에서 CDATA나 특이한 피드 형식은
  누락될 수 있습니다.
- **정치/스포츠 필터가 단순 키워드 매칭**: "policy", "government", "정부", "정책" 같은
  넓은 단어가 포함되면 통화정책·재정 등 경제 기사도 함께 걸러질 수 있습니다.
- **AI 요약은 아직 시뮬레이션**: 진짜 생성형 요약은 미구현 (RAG 검색은 실제 동작).
- **임베딩 모델 최초 로드가 느림**: 첫 질문 시 ~112 MB 다운로드가 필요합니다(이후 캐시).

## 라이선스

MIT
