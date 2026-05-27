# 5대 도메인 피플 표준 배지(UserBadge) 전격 확대 체크리스트

이 체크리스트는 숙소, 분실물, 중고장터, 그룹소개, 피드상세 등 5대 도메인 전역의 인적 데이터 노출 영역을 피플 표준 배지(`UserBadge`)로 전격 표준화 및 디버깅하기 위한 실무 액션 체크리스트입니다.

---

- [ ] **1단계: 숙소 상세 모달 (`StayDetail.tsx`) 호스트 배지 이식**
  - [ ] `StayDetail.tsx` 의 호스트 소개 렌더링 구절을 탐색합니다.
  - [ ] `UserBadge` 임포트 코드를 추가하고 기존 하드코딩 구문을 뱃지로 1:1 대체합니다.

- [ ] **2단계: 분실물 상세 모달 (`LostFoundDetail.tsx`) 등록자 배지 이식**
  - [ ] `LostFoundDetail.tsx` 하단 바 등록자 아바타/닉네임 렌더링 구절을 식별합니다.
  - [ ] `UserBadge` 임포트를 마크업하고, w-6 규격의 아바타에 맞춰 표준 뱃지를 이식합니다.

- [ ] **3단계: 중고장터 상세 모달 (`ResaleItemDetail.tsx`) 판매자 배지 이식**
  - [ ] `ResaleItemDetail.tsx` 의 판매자 프로필 카드 렌더링 구절을 식별합니다.
  - [ ] `person` 아이콘과 수동 닉네임 노출부 전체를 w-10 규격의 표준 `UserBadge`로 변환합니다.

- [ ] **4단계: 그룹 소개 탭 (`GroupAbout.tsx`) 스탭/운영진 배지 이식**
  - [ ] `GroupAbout.tsx` 의 `renderTeamMemberCard` 내부 마크업을 확인합니다.
  - [ ] 기존 `UserAvatar` 와 일반 텍스트 라인을 w-12 규격의 표준 `UserBadge`로 스왑 및 연계합니다.

- [ ] **5단계: 포스트 상세 모달 (`PostDetailModal.tsx`) 본문/댓글 작성자 배지 이식**
  - [ ] `PostDetailModal.tsx` 내의 게시글 작성자 영역 및 댓글 리스트 렌더링 루프를 추적합니다.
  - [ ] `UserBadge` 임포트 추가 후 본문(w-12) 및 각 댓글(w-10) 작성자 노출 구절을 뱃지 형태로 전면 교체합니다.

- [ ] **6단계: 정적/동적 검증 및 실서버 배포**
  - [ ] `npx tsc --noEmit` 정적 타입 컴파일을 완벽 성공시킵니다.
  - [ ] `npm run build` Next.js 빌드가 오류 없이 통과하는 것을 검증합니다.
