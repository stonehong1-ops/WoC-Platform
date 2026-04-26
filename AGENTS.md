# Project Development Rules

## Design Principles
1. **Zero Design Deviation**: YOU MUST MAINTAIN 0% DESIGN DEVIATION. NEVER alter the original HTML/CSS provided by the user. Ensure 0-pixel accuracy in all design implementations. 절대 디자인은 손대지 않고 0픽셀 적용을 원칙으로 한다.

## ⛔ Anti-Developer-Inertia Rules (개발자 관성 봉쇄 규칙)

1. **No Refactoring**: 디자인 복구 시 코드가 아무리 길고 복잡해도 절대 컴포넌트로 분리하거나 구조를 변경하지 마라. 제공된 HTML의 계층 구조를 1:1로 유지하라.
2. **No CSS Optimization**: 중복된 Tailwind 클래스나 비효율적인 인라인 스타일이 있더라도 '최적화'하지 마라. 디자이너가 작성한 그대로를 유지하는 것이 0순위다.
3. **No Logic-First Thinking**: TypeScript 오류나 데이터 바인딩 로직이 레이아웃 구조와 충돌할 경우, 레이아웃을 지키기 위해 로직을 우회하라. 레이아웃을 변경하는 방식의 코드 수정은 '실패'로 간주한다.
4. **Verbatim Asset Policy**: HTML에 포함된 `<head>` 내의 모든 CDN 링크, 폰트 설정, 전역 스타일(`style` 태그)을 누락 없이 `layout.tsx` 또는 해당 페이지 최상단에 즉시 이식하라.
5. **Pre-Flight Comparison**: 코드를 실행하기 전, 변환된 JSX와 원본 HTML을 대조하여 클래스명 하나라도 빠졌는지 스스로 검증하고 그 결과를 보고하라.

## Process & Communication Rules
1. **Plan Approval**: Before starting any task, you MUST summarize your understanding of the request and proposed implementation plan, and wait for USER approval before proceeding with any code modifications.
   - Every development plan MUST explicitly include the following 3 principles:
     1. **Zero Design Deviation**: Maintain 100% design fidelity (0-pixel deviation).
     2. **Data Binding Only**: Connect real-time data without altering the layout.
     3. **Functional Integrity**: Ensure all interactive elements (toggles, buttons) are fully functional.
2. **Deployment Reporting**: After every deployment, you MUST confirm the deployment status and explicitly provide the Deployment ID and the live URL link to the USER.

## Deployment Rules
1. **Mandatory Production Deployment**: Whenever any code modification is completed, you MUST automatically build and deploy the project to the production environment (`npx -y vercel --prod --yes`).

## Error Handling & Debugging Rules
1. **Firebase Permission Check First**: 에러 발생 시(특히 데이터베이스 저장/수정 관련), 코드를 복잡하게 수정하거나 구조를 뜯어고치기 전에 **반드시 Firebase Firestore Security Rules (권한 설정) 누락 문제인지 가장 먼저 의심하고 확인**하라. (ex: `permission-denied` 에러).
