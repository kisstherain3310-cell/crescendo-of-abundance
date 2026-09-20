# Crescendo of Abundance

KAMIS 농산물 도매가를 **풍요의 계절**로 읽은 인터랙티브 랜딩입니다. 서리가 낀 유리창을 닦으면 Matter.js로 구르는 방울토마토가 드러나고, 과일을 누르면 과잉 레시피가 열립니다.

> 오늘, 대지가 이성을 잃었습니다. 가장 완벽한 과잉을 소비할 시간.

## 데이터 정직성

| 구분 | 출처 |
| --- | --- |
| 도매가(원/kg) | KAMIS Open API `periodProductList` (품목코드 225 방울토마토, 도매) |
| 풍요 시각화(토마토 알 수·중력) | **가격 하락에서 파생** — 가격이 낮을수록 알 수가 늘고 중력이 커짐 |
| 데모 모드 | `data/mockKamis.json` (키 미설정·프록시 실패 시) |

KAMIS는 출하량(kg)을 이 API로 주지 않습니다. HUD의 「풍요지수」와 물리 바디 수는 시세 낙폭의 은유입니다.

## 실행

포트 **43173**에서 개발 서버가 뜹니다.

```bash
npm install
npm run dev
```

**공식 스모크 URL은 [http://localhost:43173](http://localhost:43173) 입니다.** QA는 이 주소로 통과를 판단하세요.

Netlify Function(KAMIS 프록시)까지 로컬에서 쓰려면:

```bash
npx netlify dev
```

프로덕션 빌드(깨끗한 `.next`로):

```bash
rm -rf .next
npm run build
npm start
```

## 환경 변수

`.env.example` 을 복사해 `.env.local` 또는 Netlify 대시보드에 설정합니다.

| 변수 | 공개 여부 | 설명 |
| --- | --- | --- |
| `KAMIS_CERT_KEY` | 서버 전용 | KAMIS Open API 인증키 |
| `KAMIS_CERT_ID` | 서버 전용 | KAMIS 요청자 ID(계정) |
| `KAMIS_PROXY_URL` | 서버 전용(선택) | 프록시 절대 URL. 미설정 시 Netlify `URL` 등으로 `/api/kamis/tomato` 추론 |

**절대 `NEXT_PUBLIC_` 로 두지 마세요.** 시크릿이 브라우저 번들로 노출됩니다.

### Netlify에 키 넣기

1. [Netlify](https://app.netlify.com) → 사이트 → **Site configuration** → **Environment variables**
2. `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` 추가 (Scopes: Builds + Functions, 모든 컨텍스트 또는 Production/Deploy Previews)
3. 재배포 후 HUD가 `공개시세`로 표시되면 라이브 연동 성공. 실패 시 자동으로 `데모 데이터`로 폴백합니다.

키 발급: [KAMIS Open-API 이용안내](https://www.kamis.or.kr/customer/reference/openapi_list.do)

## 데이터 → 물리

| 입력 | 물리량 | 동작 |
| --- | --- | --- |
| 가격(시리즈 min–max) | `priceToBodyCount` | **낮을수록** 18–110 알 |
| 가격 하락 | `priceDropToPhysics` | 기준가 대비 낙폭 ↑ → 중력 ↑, restitution ↓ |
| 전체 시리즈 | `mapSeriesToPhysics` | 마지막 날을 현재 장면으로 사용 |

가격이 무너질수록 토마토는 더 많이, 더 빠르게 떨어지고 덜 튕기며 바닥에 쌓입니다.

## 서리 UX

1. `public/tomato-boot.js` 와 `public/frost-boot.js` 가 React/`_next` 런타임보다 먼저 실행됩니다.
2. `FrostOverlay` 가 마우스·터치 와이프로 서리를 걷습니다.
3. 방울토마토를 탭하면 레시피 모달. 「과잉 레시피 보기」 CTA도 동일합니다.

## 아키텍처

```
app/page.tsx (SSR)
  → lib/kamis.ts fetchTomatoSeries()
      → GET /api/kamis/tomato   (netlify/functions/kamis-tomato.ts)
          → KAMIS periodProductList (Netlify.env.get CERT_*)
      → 실패 시 data/mockKamis.json
  → mapDataToPhysics → LandingClient
```

HUD: `source === "kamis"` → `공개시세`, 그 외 → `데모 데이터`.

## 스택

Next.js App Router, React, TypeScript, Tailwind CSS, Matter.js, Framer Motion, Netlify Functions, shadcn/ui.
