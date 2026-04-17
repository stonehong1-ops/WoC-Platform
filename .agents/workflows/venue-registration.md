---
description: 가이드에 따라 새로운 탱고 베뉴(장소)를 시스템에 안전하고 정확하게 등록합니다.
---

# 🏟️ 베뉴 마스터 등록 워크플로우 (Venue Registration)

이 워크플로우는 전국의 탱고 성지들을 WoC 플랫폼에 등록할 때 데이터 무결성을 유지하고 UI/UX를 최상으로 유지하기 위한 표준 절차입니다.

## 1. 데이터 표준 (Data Standards)

새로운 장소를 등록할 때는 반드시 다음의 필드 형식을 준수해야 합니다.

| 필드명 | 설명 | 예시 |
| :--- | :--- | :--- |
| `name` | 공식 영문 명칭 | `Tango Life` |
| `nameKo` | 공식 한글 명칭 | `탱고라이프` |
| `category` | 핵심 분류 (Studio, Club, Cafe 등) | `Studio` |
| `types` | 확장 분류 (배열 형태) | `["Studio", "Club"]` |
| `city` | 도시 (SEOUL, BUSAN, DAEJEON) | `SEOUL` |
| `address` | 상세 주소 (한글 권장) | `서울 마포구 와우산로...` |
| `coordinates` | GPS 좌표 (`latitude`, `longitude`) | `{ latitude: 37.5575, longitude: 126.9244 }` |

## 2. 등록 방법 (Registration Methods)

### A. 소량 등록 (1~2곳)
플랫폼 내의 **'Manage Entry'** UI를 사용합니다.
1. `/venues` 페이지로 이동합니다.
2. 하단 시트의 `Register` 버튼을 클릭합니다.
3. 양식에 맞게 내용을 입력하고 `SAVE`를 누릅니다.
   - **주의**: 영문명 옆에 반드시 한글명을 병기하여 글로벌/로컬 대응이 되도록 합니다.

### B. 대량/일괄 등록 (Batch Seeding)
많은 장소를 한 번에 등록할 때는 `venueService.batchAddVenues`를 사용합니다.

1. 등록할 데이터들을 아래 **JSON 템플릿** 형식으로 준비합니다.
2. 임시 관리용 페이지(예: `/temp-setup`)를 생성하거나 관리자 콘솔에서 실행합니다.

#### 📋 Seeding JSON Template
```json
[
  {
    "name": "New Tango Spot",
    "nameKo": "새로운 탱고 플레이스",
    "category": "Studio",
    "types": ["Studio", "Club"],
    "city": "SEOUL",
    "region": "Seoul",
    "district": "Mapo-gu",
    "address": "서울 마포구 어딘가 123",
    "coordinates": { "latitude": 37.5501, "longitude": 126.9201 },
    "status": "active"
  }
]
```

## 3. UI/UX 정합성 체크리스트

- [ ] **Dual Language**: 영문명(name)과 한글명(nameKo)이 모두 입력되었는가?
- [ ] **Correct Category**: 지도 필터링을 위해 `category`가 정확히 설정되었는가?
- [ ] **GPS Precision**: 구글 지도 핀 위치가 실제 장소와 일치하는가?
- [ ] **Active Status**: `status`가 `"active"`로 설정되어 지도에 즉시 노출되는가?

## 4. 유지보수 및 배포

데이터 등록 후에는 반드시 다음 명령어로 실서버에 동기화합니다.
```powershell
# 빌드 및 Vercel 배포
npm run build; npx -y vercel --prod --yes
```

---
> **Tip**: 좌표가 불확실할 경우 구글 지도에서 장소를 우클릭하여 '이곳의 좌표'를 복사해 사용하세요.
