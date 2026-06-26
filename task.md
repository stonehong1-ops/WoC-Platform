# AI Partner Match Task List

- [x] 1. 프로필 화면 수정
  - [x] src/app/profile/page.tsx 수정 (파트너십 정보 렌더링 제거)
  - [x] src/components/profile/MyInfoBottomSheet.tsx 수정 (파트너 상태 설정 폼 제거)
- [x] 2. 다국어 사전 및 내비게이션 활성화
  - [x] src/i18n/kr.ts / en.ts 에 ai_partner.* 번역 키 추가
  - [x] src/components/layout/GlobalNavigation.tsx 에서 partner_match의 comingSoon: true 제거
- [x] 3. AI 파트너 매칭 페이지 및 컴포넌트 생성
  - [x] src/app/lab/match/page.tsx 신규 작성
  - [x] src/components/partner/AiPartnerMatch.tsx 신규 작성 (설정 입력 폼, 저장, 추천 목록 렌더링, 페이징, 1:1 채팅 연결 연동)
- [x] 4. 추천 API 구현
  - [x] src/app/api/ai-partner-match/recommend/route.ts 신규 작성 (후보 유저 필터링, 유사도 Scoring, 커서 기반 페이징)
- [x] 5. 무결성 검증 및 빌드
  - [x] node scripts/validate-i18n.mjs 실행
  - [x] npm run build 실행
- [x] 6. 프로덕션 배포
  - [x] Vercel 프로덕션 배포 실행 및 성공 확인
