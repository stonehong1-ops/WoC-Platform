# Checklist - 그룹 푸터(Presence Bar) 리팩토링

- [x] online -> members로 텍스트 변경
  - [x] `{members.length} online`을 `{members.length} members`로 교체
- [x] 가장 최근 방문자 3명 사진 노출 구현
  - [x] `joinedAt` 필드를 기준으로 멤버 리스트 정렬
  - [x] 아바타 사진이 있는 멤버들로 우선 정렬 및 안전한 3명 필터링
- [x] +60 배지 아바타 스타일 구현 및 겹침 처리
  - [x] `remainingCount`를 `.mini-avatar`와 같은 둥근 칩으로 구성
  - [x] `margin-left: -8px`를 이용해 세 번째 아바타 사진 옆에 자연스럽게 겹치며 밀착되도록 배치
- [x] 0 live 라이브 세션 영역 마크업 삭제
  - [x] `liveSessionCount`를 나타내는 `presence-group` 엘리먼트 제거
- [x] 0 new -> update 3hrs ago 고정 텍스트 대체
  - [x] 새 글 개수 정보 대신 `update 3hrs ago` 상시 영문 텍스트 노출
- [x] 로컬 컴파일 자체 검증 및 Vercel 실시간 프로덕션 배포 완료
