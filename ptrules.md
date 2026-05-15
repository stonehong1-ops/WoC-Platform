# PT 작업 규칙 (Presentation Rules)

이 문서는 `woc.today/pt` (프레젠테이션 모듈)의 디자인 및 코드를 수정할 때 **반드시 지켜야 하는 절대 원칙**을 정의합니다. AI(Antigravity)는 PT 관련 작업을 수행할 때마다 이 규칙을 숙지하고 복창해야 합니다.

## ⛔ 핵심 원칙 (Core Rules)

1. **지정된 슬라이드 외 절대 수정 금지 (Strict Scope Restriction)**
   - 사용자가 명시적으로 지정한 **해당 번호의 슬라이드 한 장**만 수정합니다.
   - 메인 사이트(`woc.today`의 다른 라우트)나 지시받지 않은 다른 슬라이드는 **어떠한 이유로도 절대 손대지 않습니다**.

2. **디자인 편차 0% 유지 (Zero Design Deviation)**
   - 사용자가 GPT 등과 작업하여 전달한 이미지/디자인이 있을 경우, **컨텐츠 부분(slide contents area only)**의 디자인을 **100% 동일하게 반영**해야 합니다.
   - 1픽셀의 오차나 임의의 디자인 변경도 허용되지 않습니다.

3. **HTML 그대로 배포 및 JSX 최소 변환 (Verbatim HTML to JSX)**
   - 전달받은 HTML을 해당 슬라이드 컴포넌트의 반환값(return value)인 컨텐츠 영역 전체로 **그대로 복사하여 1:1 교체**합니다.
   - 단, Next.js(React) 환경에 맞추기 위해 **`class` 속성을 `className`으로 변환하는 것만 허용**됩니다. (그 외 태그 구조, 인라인 스타일, CSS 속성 등은 단 하나도 수정하지 않습니다.)
   - 만약 HTML에 에러나 추가적인 구조 작업(수정)이 필요하다면 **절대 임의로 코딩하여 수정하지 않습니다**. 사용자가 바로 적용할 수 있도록 **GPT에게 요청할 프롬프트나 가이드 방향만 제시**해야 합니다.

4. **헤더/푸터 및 사이드 앱 영역 절대 수정 금지 (No Header/Footer/SideApp Modifications)**
   - 앞으로 PT 페이지 작업 시 **슬라이드 컨텐츠 영역(contents area)**에만 HTML을 반영합니다.
   - 프레젠테이션의 **헤더(Header), 푸터(Footer), 사이드 앱인앱(App-in-app) 영역**에는 어떠한 수정도 절대 하지 않습니다.
대기합니다.

6. **방향성 및 톤앤매너 유지 (Directional Layout & Tone)**
   - 기존에 확립된 PT의 디자인 철학을 훼손하지 않습니다.
   - **유지 필수 요소**:
     * Cinematic whitespace (여백의 미)
     * Typography scale & hierarchy (서체 크기 및 위계)
     * Density & negative space (밀도 및 여백)
     * Responsive ratio (반응형 비율 유지)
     * Minimal, quiet, philosophical, premium 톤 (카테고리/기능 나열 느낌 지양, 인간 활동 아키타입 느낌 강화)

7. **롤백(Rollback) 대비**
   - 치명적인 구조 변경이나 불안정한 수정으로 기존 작업물이 훼손될 것에 대비하여, 기존에 구축한 `src/app/pt1/` (안전한 백업본)의 존재와 필요성을 항상 염두에 둡니다.

## 📝 작업 플로우 (Workflow)

1. **User Request**: 사용자가 슬라이드 번호 지정 및 수정할 이미지/가이드 제공
2. **AI Acknowledge**: PT Rules 복창 및 작업 계획 제시
3. **User Approval**: "고" (승인)
4. **AI Implementation**: 지정된 슬라이드 컴포넌트(예: `slides-s1.tsx`의 특정 부분)만 코드 수정
5. **AI Deployment**: 프로덕션 배포 후 Deployment ID 및 Live URL 보고
