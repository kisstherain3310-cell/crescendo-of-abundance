# 가격 → 물리 매핑 표

| 입력 | 함수 | 출력 | 규칙 |
| --- | --- | --- | --- |
| 시리즈 최저·최고가 대비 당일 가격 | `priceToBodyCount` | bodyCount 18–110 | 가격↓ → 알 수↑ |
| 기준가(이전일 중앙값) 대비 낙폭 | `priceDropToPhysics` | gravity, restitution, dropRatio | 낙폭↑ → 중력↑ · 탄성↓ |
| KAMIS `source` | HUD | 공개시세 / 데모 데이터 | 실연동 vs mock |

출처: 가격은 KAMIS Open API. 풍요(알 수)는 가격 하락에서 파생된 시각화.
