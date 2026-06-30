# App Shell 메뉴 개편 기획안 메모

스톤님이 전달해주신 신규 메뉴 그룹핑 및 헤더/푸터 App Shell 개편 방향성 메모입니다. 실제 상세 디자인 컨셉이 전달되면 이를 바탕으로 구현을 개시합니다.

## 1. 푸터 내비게이션 메뉴 재구성 (좌우 스크롤 탭)

### ① Today
- **Now (포털, 시작화면)**
- **Social**
- **Live**
- **Plaza**

### ② Activity
- **Class**
- **Event**
- **Group**
- **Map**

### ③ Market
- **Shop**
- **Flea (기존 Resale)**
- **Rental**
- **Stay**

### ④ Lounge (Rounge)
- **People**
- **Pics**
- **Lost**
- **Jump (기존 Explore)**

### ⑤ My
- **Acts**
- **Wallet**
- **Live**
- **AI Lab**
- **Profile**

---

## 2. 헤더 역할 및 구조 개편
- 기존 헤더에 직접 노출되어 있던 개별 메뉴 항목들을 완전히 제거합니다.
- 헤더는 위치 정보(Location) 및 챗, 알림, 검색, 등록(Compose) 기능 그룹들을 하나로 그룹핑하여 표시하는 기본 라인 뼈대 역할만 수행하도록 단순화합니다.
- App Shell(헤더 및 푸터) 전체는 스크롤 방향에 반응하여 동적으로 화면에서 숨겨지거나 노출되는 인터랙션을 적용합니다.
