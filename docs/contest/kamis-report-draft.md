---
cursor:
  subagentId: "bc-cce9f048-978f-5f6e-8d52-a186d1b4c94c"
---

# KAMIS 공공데이터 활용 공모 — 출품 보고서 초안

**작품명:** Crescendo of Abundance — 방울토마토 시세로 읽는 풍요의 물리 시각화  
**출품 형태:** 웹 인터랙티브 랜딩 (Next.js + Netlify Functions + Matter.js)  
**데이터:** KAMIS Open API `periodProductList` (품목코드 225 방울토마토, 도매)

---

## 요약 (3줄)

1. KAMIS 일별 도매가를 서버 프록시로 안전하게 가져와, 가격이 내려갈수록 토마토가 더 많이·더 빠르게 쏟아지는 **풍요(과잉) 은유**로 시각화한다.  
2. 서리 와이프 → 물리 엔진 토마토 → 과잉 레시피 모달로, 시세 수치를 감각적 경험으로 전환한다.  
3. 인증키 미설정·API 실패 시 데모 데이터로 폴백하며, HUD에 `공개시세` / `데모 데이터`를 구분해 출처를 정직하게 표기한다.

---

## 1. 동기

농산물 가격 정보는 표와 차트로만 소비되기 쉽다. 방울토마토처럼 단기간 출하가 몰리면 도매가가 급락하고, 생산자·유통·소비자 모두 ‘숫자’로만 소식을 접한다.  
본 작품은 그 낙폭을 **대지가 이성을 잃은 풍요**로 읽어, 공공 시세가 ‘소비하고 싶은 이야기’가 되게 한다.  
서리 낀 창을 손으로 닦아내는 행위는 ‘시장을 비로소 마주보는’ 은유이기도 하다.

## 2. 목표

| 목표 | 구현 |
| --- | --- |
| 공공 API 실사용 | Netlify Function이 KAMIS `periodProductList`를 프록시 (인증키 서버 전용) |
| 정직한 매핑 | 가격 = KAMIS / 풍요 시각화 = 가격 하락에서 파생 (출하량 API가 아님을 README·HUD에 명시) |
| 감각적 UX | 서리 와이프 → Matter.js 낙하 → 레시피 모달 |
| 운영 안정성 | 키 없음·업스트림 실패 시 mock 폴백, HUD 라벨 자동 전환 |

## 3. 활용 방식

### 3.1 데이터 파이프라인

```
브라우저 SSR (app/page.tsx)
  → fetchTomatoSeries()
      → GET /api/kamis/tomato  (netlify/functions/kamis-tomato.ts)
          → KAMIS periodProductList
             p_itemcode=225, p_productclscode=02, 최근 ~30일, JSON
      → 실패 시 data/mockKamis.json
  → mapDataToPhysics() → 랜딩
```

- 환경변수: `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` (Netlify Environment Variables, `NEXT_PUBLIC_` 금지)
- 함수 내부: `Netlify.env.get(...)` 로만 자격증명 조회

### 3.2 가격 → 물리 매핑

| 입력 | 출력 | 규칙 |
| --- | --- | --- |
| 시리즈 내 상대 가격 | `bodyCount` (18–110알) | **가격↓ → 알 수↑** (`priceToBodyCount`) |
| 기준가(중앙값) 대비 낙폭 | gravity↑ / restitution↓ | 폭락할수록 무겁고 덜 튕김 |
| 데이터 출처 | HUD 라벨 | `kamis` → 공개시세 / 그 외 → 데모 데이터 |

KAMIS 해당 API는 일자별 **가격**을 제공한다. 출하량(kg)은 포함되지 않으므로, HUD의 「풍요지수」와 토마토 알 수는 시세 낙폭의 해석적 시각화이다.

### 3.3 사용자 여정

1. 서리가 낀 전면 오버레이  
2. 마우스/터치로 닦으면 방울토마토 물리 장면 노출  
3. 과실 탭 또는 CTA → 과잉 소비 레시피 모달  
4. 우측(모바일 하단) HUD에서 도매가·풍요지수·갱신 시각 확인

## 4. 성과·변화

- **공공데이터 접근성:** 인증키를 브라우저에 노출하지 않는 프록시로 시세를 랜딩에 연결.
- **해석의 전환:** ‘가격 폭락’을 부정적 차트에서 **풍요의 물리 연출**로 재프레이밍.
- **확산 가능성:** 품목코드만 바꾸면 다른 채소·과일 시즌 캠페인으로 재사용 가능; 레시피·서리 UX는 콘텐츠 레이어로 분리됨.
- **교육·홍보:** 지자체·도매시장·급식 캠페인 랜딩으로 이식 가능한 프로토타입.

## 5. 평가 축 자체진단

### 적합성
KAMIS 일별 품목 도매가 API를 직접 호출하고, 방울토마토(225)라는 구체 품목에 맞춰 시각화했다. 공공 시세와 UI가 1:1로 연결된다.

### 충실성
프록시·정규화·폴백·출처 라벨·물리 매핑·README 정직성 고지를 한 세트로 구현했다. 키 없이도 데모로 전체 여정이 재현된다.

### 확산가능성
품목·기간·레시피만 교체하면 시즌 캠페인으로 확장 가능하며, Netlify 배포·환경변수 문서화로 운영 이전이 쉽다.

## 6. 첨부 (매핑 표)

| 구분 | 값 |
| --- | --- |
| API | `action=periodProductList` |
| 품목 | 225 방울토마토 / 부류 200 채소 |
| 구분 | 02 도매 |
| 기간 | 최근 약 30일 |
| 가격 단위 | 원/kg (`p_convert_kg_yn=Y`) |
| 시각화 | `priceToBodyCount` + `priceDropToPhysics` |

스크린샷·스모크 영상은 `docs/contest/attachments/` 및 배포 스모크 결과에 추가한다.

## 7. 필요 환경변수 (출품자 설정)

| 변수 | 설명 |
| --- | --- |
| `KAMIS_CERT_KEY` | KAMIS Open API 인증키 |
| `KAMIS_CERT_ID` | KAMIS 요청자 ID |

Netlify: Site configuration → Environment variables → 위 두 키 추가 후 재배포.

---

*본 문서는 출품용 초안이며, 설문의 개인정보·서약 항목은 출품자가 https://seolmoon.com/Join/index.html 에서 직접 작성한다.*
