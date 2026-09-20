---
cursor:
  subagentId: "bc-cce9f048-978f-5f6e-8d52-a186d1b4c94c"
---

# KAMIS 공모 제출 체크리스트 (출품자용)

에이전트는 설문 개인정보를 대신 입력할 수 없습니다. 아래만 직접 완료하세요.

## 1. 제출 페이지

- 메인: https://seolmoon.com/Join/index.html  
- 또는: https://seolmoon.com/?6005  

## 2. 업로드할 파일

| 파일 | 경로 / 내용 |
| --- | --- |
| 보고서 (필수) | `docs/contest/kamis-report-draft.md` 내용을 A4 1–3페이지 분량으로 편집·PDF/HWP 변환 후 업로드 |
| 첨부 | `docs/contest/attachments/` 스크린샷, 가격→물리 매핑 표 |
| 데모 URL | Netlify 공개 URL (배포 후 기입) |

## 3. 설문에서 직접 채울 항목 (예시)

- 성명 / 연락처 / 이메일 / 소속  
- 작품명: **Crescendo of Abundance**  
- 활용 데이터: KAMIS Open API 일별 품목별 도·소매가격 (`periodProductList`, 방울토마토 225)  
- 작품 URL: (배포 URL)  
- 개인정보·저작권·서약 동의  

## 4. 제출 전 기술 확인

- [ ] Netlify에 `KAMIS_CERT_KEY`, `KAMIS_CERT_ID` 설정  
- [ ] 재배포 후 HUD가 **공개시세**인지 확인 (미설정이면 데모 데이터로도 제출 가능하나, 실연동 권장)  
- [ ] 서리 닦기 → 토마토 → 레시피 모달 스모크  
- [ ] GitHub PR 머지 여부 확인  

## 5. 저장소

https://github.com/kisstherain3310-cell/crescendo-of-abundance  
