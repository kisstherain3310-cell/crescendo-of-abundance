# Crescendo of Abundance

KAMIS 스타일의 모의 농산물 과잉 출하를 **풍요의 계절**로 읽은 인터랙티브 랜딩 프로토타입입니다. 서리가 낀 유리창을 닦으면 Matter.js로 구르는 방울토마토가 드러나고, 과일을 누르면 과잉 레시피가 열립니다.

> 오늘, 대지가 이성을 잃었습니다. 가장 완벽한 과잉을 소비할 시간.

## 실행

포트 **43173**에서 개발 서버가 뜹니다.

```bash
npm install
npm run dev
```

**공식 스모크 URL은 [http://localhost:43173](http://localhost:43173) 입니다.** QA는 이 주소로 통과를 판단하세요. `next.config.ts`의 `allowedDevOrigins`가 `127.0.0.1`도 허용하지만, 리뷰 기준 호스트는 localhost입니다.

프로덕션 빌드(깨끗한 `.next`로):

```bash
rm -rf .next
npm run build
npm start
```

이전 산출물을 재사용하지 마세요. 캐시된 `.next`는 HUD만 있고 캔버스/모달이 비는 것처럼 보일 수 있습니다.

## 데이터 → 물리

`data/mockKamis.json` 은 일자별 **출하량(kg)** 과 **도매가(원/kg)** 시계열입니다. 마지막 날 `2026-09-11` 은 출하량 최대 · 가격 폭락입니다.

매핑은 `lib/mapDataToPhysics.ts` 가 담당합니다.

| 입력 | 물리량 | 동작 |
| --- | --- | --- |
| 출하량 volume | `volumeToBodyCount` | 시리즈 min–max 를 **18–110** 알로 클램프 |
| 가격 하락 | `priceDropToPhysics` | 기준가 대비 낙폭이 클수록 **중력 ↑, restitution ↓** |
| 전체 시리즈 | `mapSeriesToPhysics` | 마지막 날을 현재 장면으로 사용 |

가격이 무너질수록 토마토는 더 빠르게 떨어지고 덜 튕기며 바닥에 쌓입니다.

## 서리 UX

1. `public/frost-boot.js` 가 React 하이드레이션 전에 전체 화면 서리 캔버스를 그립니다. 토마토가 검게 깜빡이지 않습니다.
2. `FrostOverlay` 가 같은 캔버스를 이어받아 마우스·터치 와이프로 `destination-out` 브러시를 칠합니다.
3. 서리를 걷으면 아래에 있는 **채색된 방울토마토**(검정 구멍이 아님)가 보입니다.
4. 짧게 탭하면 과일 히트 테스트 → 파티클 팝 + 레시피 모달.
5. 「과잉 레시피 보기」 버튼으로도 같은 모달을 열 수 있습니다.

## KAMIS 교체

기본값은 모의 JSON입니다. 실제 KAMIS(또는 프록시)로 바꾸려면:

1. `.env.example` 을 복사해 `.env.local` 을 만듭니다.
2. `NEXT_PUBLIC_KAMIS_API_URL` 에 JSON 엔드포인트를 넣습니다.
3. `lib/kamis.ts` 의 `normalizeKamis()` 가 `date/volume/price` 또는 `일자/물량/가격` 필드를 정규화합니다.
4. 네트워크 실패·빈 응답이면 자동으로 `mockKamis.json` 으로 되돌아갑니다.

Axios 호출은 서버 컴포넌트 `app/page.tsx` → `fetchTomatoSeries()` 경로입니다. 응답 스키마만 맞으면 물리 매핑은 그대로 재사용됩니다.

## 스택

Next.js App Router, React, TypeScript, Tailwind CSS, Matter.js, Framer Motion, shadcn/ui (`button`, `dialog`).
