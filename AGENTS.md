# 🌟 MAIN PRINCIPLE
Upon receiving instructions, you MUST read this MD file, explicitly confirm that you have read it in your response, and spend 1 minute thinking before writing any code.
**가장 핵심 원칙 — 방금전에 지시한 것만 수행한다.**
**Single Task Rule**: The user will never request multiple tasks at once. Therefore, you MUST ONLY perform the very last requested task.

# Project Development Rules

## Design Principles
1. **Zero Design Deviation**: YOU MUST MAINTAIN 0% DESIGN DEVIATION. NEVER alter the original HTML/CSS provided by the user. Ensure 0-pixel accuracy in all design implementations. 절대 디자인은 손대지 않고 0픽셀 적용을 원칙으로 한다.

## ⛔ 절대 금지 규칙 (ABSOLUTE PROHIBITIONS)

1. **tailwind.config.ts 절대 수정 금지**: `tailwind.config.ts`는 Stitch 디자인 시스템의 핵심 원본 팔레트가 정의된 **성역(SACRED FILE)**이다. 어떠한 이유로도, 어떠한 방식으로도 이 파일을 수정하거나 덮어쓰거나 재생성하는 것은 **절대 금지(STRICTLY PROHIBITED)**다. 위반 시 플랫폼 전체의 디자인이 깨진다. 백업 파일(`tailwind.config.bak.ts`)이 존재하며 원본으로 간주된다. 개선, 최적화, 동기화 등 어떤 명목으로도 이 파일에 손대지 마라.

## ⛔ Anti-Developer-Inertia Rules (개발자 관성 봉쇄 규칙)

1. **No Refactoring**: 디자인 복구 시 코드가 아무리 길고 복잡해도 절대 컴포넌트로 분리하거나 구조를 변경하지 마라. 제공된 HTML의 계층 구조를 1:1로 유지하라.
2. **No CSS Optimization**: 중복된 Tailwind 클래스나 비효율적인 인라인 스타일이 있더라도 '최적화'하지 마라. 디자이너가 작성한 그대로를 유지하는 것이 0순위다.
3. **No Logic-First Thinking**: TypeScript 오류나 데이터 바인딩 로직이 레이아웃 구조와 충돌할 경우, 레이아웃을 지키기 위해 로직을 우회하라. 레이아웃을 변경하는 방식의 코드 수정은 '실패'로 간주한다.
4. **Verbatim Asset Policy**: HTML에 포함된 `<head>` 내의 모든 CDN 링크, 폰트 설정, 전역 스타일(`style` 태그)을 누락 없이 `layout.tsx` 또는 해당 페이지 최상단에 즉시 이식하라.
5. **Pre-Flight Comparison**: 코드를 실행하기 전, 변환된 JSX와 원본 HTML을 대조하여 클래스명 하나라도 빠졌는지 스스로 검증하고 그 결과를 보고하라.

## Process & Communication Rules
0. **Design Stability Guard**: Before modifying any UI/UX or layout, YOU MUST read `STABILITY_GUARD.md` in the root directory. NEVER deviate from the "LOCKED" states defined in that document without explicit, written approval from the USER.
1. **Honesty and Accuracy**: 절대 거짓말하거나 과장하지 마라 (Never lie or exaggerate). 이전 작업 내용이나 결과를 부풀리지 말고 있는 사실만을 정확하게 보고하라.
2. **Truncation Check**: 제공받은 HTML 코드나 디자인 에셋이 채팅창 글자 수 제한 등으로 인해 잘려 있는지(truncated) 반드시 가장 먼저 확인하라. 잘려있다면 **절대 임의로 작업을 시작하지 말고**, 사용자에게 전체 파일을 첨부해달라고 즉시 보고하라.
3. **Plan Approval**: Before starting any task, you MUST summarize your understanding of the request and proposed implementation plan, and wait for USER approval before proceeding with any code modifications.
   - Every development plan MUST explicitly include the following 3 principles:
     1. **Zero Design Deviation**: Maintain 100% design fidelity (0-pixel deviation).
     2. **Data Binding Only**: Connect real-time data without altering the layout.
     3. **Functional Integrity**: Ensure all interactive elements (toggles, buttons) are fully functional.
4. **Deployment Reporting**: After every deployment, you MUST confirm the deployment status and explicitly provide the Deployment ID and the live URL link to the USER.
28. **IA Mapping Reference**: Before performing any development task, YOU MUST reference `ia.md` in the root directory to ensure correct file locations and architectural context. This is a mandatory reference point for understanding the system map.
29. **Question Mark Handling**: 사용자의 요청이 물음표(?)로 끝날 경우, 절대 코딩(코드 수정)을 진행하지 말고, 현재 조사/진행 중인 상태와 원인 파악 내용에 대해서만 답변하라.
30. **Strict Scope Adherence**: 사용자가 명시적으로 요청한 작업 이외에는 어떤 작업도 추가로 포함하거나 수행하지 않는다. (Do not include or perform any additional work beyond what the user has explicitly requested.)
31. **No Repetitive Reporting**: 앞서서 작업했던 내용은 절대 다시 꺼내지 않는다. (Never reference or repeat details of previously completed work.)
32. **Provide Self-Verification Test List**: 작업 완료 시 사용자가 라이브 환경에서 직접 수행할 수 있는 구체적인 자가 검증 테스트 리스트(Verification Checklist)를 항상 제공한다. (Always provide a concrete self-verification test list for the user upon completing a task.)

## 🌐 Language & Localization Rules
1. **English & Korean Co-development (영한 로케일 병행 개발 필수)**: This platform supports both English and Korean. Whenever a new UI feature or text is added, you MUST define and apply proper multi-language translations (i.e., `kr.ts` and `en.ts`) simultaneously. (새로운 UI 문구나 텍스트를 추가할 때는 반드시 한글 로케일과 영문 로케일 번역을 누락 없이 함께 정의하고 반영해야 한다. 로컬라이제이션 제외 규칙은 폐지한다.)
2. **Localization Integration**: DO NOT leave raw English or Korean text directly in the TSX layout. Always wrap them in the `t()` translation function with matching keys defined in both `kr.ts` and `en.ts`. (TSX 레이아웃에 번역되지 않은 날것의 영어나 한글 텍스트를 방치해서는 안 되며, 항상 `t()` 함수로 감싸고 다국어 사전에 등록하여 완벽하게 통합해야 한다.)

## Deployment Rules
1. **Mandatory Production Deployment**: Whenever any code modification is completed, you MUST automatically build and deploy the project to the production environment (e.g., `npx -y vercel --prod --yes`) to ensure the live site reflects the latest changes immediately.
2. **Deployment Reporting**: After every deployment, you MUST confirm the deployment status (READY/ERROR) and explicitly provide the **Deployment ID, Exit Code, and the live URL link** to the USER. NEVER report success before the deployment process is fully 'DONE' and verified.

## Error Handling & Debugging Rules
1. **Firebase Permission Check First**: 에러 발생 시(특히 데이터베이스 저장/수정 관련), 코드를 복잡하게 수정하거나 구조를 뜯어고치기 전에 **반드시 Firebase Firestore Security Rules (권한 설정) 누락 문제인지 가장 먼저 의심하고 확인**하라. (ex: `permission-denied` 에러).

## 📚 Domain-Specific Rules (Class / Setting)
1. **Class Setting은 Admin 전용**: Class Setting 모듈(`class-setting`)은 관리자 전용 기능이므로 일반 사용자가 메뉴를 선택하는 '설정 2단계'(`GroupFunctionBuilder.tsx` 등)에는 노출되지 않아야 한다. `functionBuilderData.ts`의 ADMIN 섹션은 설정 2단계 화면에서 노출되지 않거나 제거되어야 한다.
2. **Class 추가 페이지 명확화**: 관리자용 Class Setting 화면은 예전 페이지(`GroupClassSetting.tsx`)를 사용하지 말고, 버튼이 3개(Class, Bundle discount, Monthly Pass) 있는 `GroupClassEditor.tsx`를 적용해야 한다.
3. **Class 메뉴는 사용자용**: `class` 메뉴는 실제 사용자가 보는 페이지이다. 설정 단계에서 `class-setting` 관련 기능을 활성화했다면, 사용자는 `class` 메뉴를 볼 수 있어야 하며, 설정 3단계(위치 변경)에서도 `CLASS` 탭의 위치를 조정할 수 있어야 한다. 만약 사용자용 화면이 아직 완성되지 않았다면 메뉴만 생성하고 "공사중(Under Construction)"으로 표시한다.

# Behavioral Guidelines

1. **Think Before Coding**
Don't assume. Don't hide confusion. Surface tradeoffs.
Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

2. **Simplicity First**
Minimum code that solves the problem. Nothing speculative.
- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

3. **Surgical Changes**
Touch only what you must. Clean up only your own mess.
When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

4. **Goal-Driven Execution**
Define success criteria. Loop until verified.
Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

5. **No Closing Colons (Korean Output)**
End Korean sentences with a period, not a colon.
When the user writes in Korean, your output is also Korean:
- Don't end sentences with : even if the next line is a list or example.
- LLMs trained on English docs leak the colon habit into Korean. Catch it.
- The test: every Korean sentence terminator should be ., ?, or ! — not :.
- Colons are fine inside code, key-value pairs, or labels. Not as sentence enders.

6. **File Header Comments in Korean**
First line of every new source file: a one-line Korean comment stating its role.
When creating a new file:
- TypeScript/JavaScript: // 사용자 인증 상태를 관리하는 Context Provider
- Python: # KIS API 호출을 비동기로 래핑하는 클라이언트
- SQL: -- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰
Place it directly under required directives ('use client', 'use server', shebang).
Skip config files (*.config.ts, package.json, etc.).
Why: agents read files selectively, not whole codebases. A one-line Korean header gives instant context so the next session (human or agent) can navigate without re-reading the entire file.

7. **Plan + Checklist + Context Notes**
Before any non-trivial task, produce three artifacts. Don't start coding without them.
- Plan — what we're building and why.
- Checklist (checklist.md) — concrete tasks as checkboxes. Tick as you go.
- Context Notes (context-notes.md) — decisions made during the work and the reasoning behind them. Append continuously.
If the user gives only a plan and asks you to start coding, stop and ask: "Should I create the checklist and context notes first?" The next session — yours or someone else's — needs the notes to pick up where you left off without re-deriving every decision.

8. **Run Tests Before Marking Complete**
If you touched code, run the tests before saying "done".
- npm test, pytest, cargo test, whatever the project uses — run it.
- If tests pass, report results. If they fail, fix and re-run.
- No test setup? At minimum, verify the project builds/compiles.
- Run tests proactively, before the user signals "끝", "완료", "다 됐어" — not after.
This is the step LLMs skip most often. Treat it as non-negotiable.

9. **Semantic Commits**
Commit when one logical change is complete. Don't wait for the user to ask.
- The test: "Can I describe this commit in one sentence?" If yes, commit. If no, the changes are still mixed — split them.
- Good: "auth 미들웨어 추가". Bad: "auth 추가하고 UI도 고치고 버그도 수정" (split into 3).
- Don't accumulate 20 unrelated edits and lose the ability to roll back individually.
- Don't commit just to commit — meaningful units only.
Note: For solo prototypes or throwaway scripts, group commits loosely if it slows you down. The point is reversibility, not ceremony.

10. **Read Errors, Don't Guess**
Read the actual error/log line. Don't pattern-match from memory.
When something fails:
- Read the full error message and stack trace.
- Check the actual log output, not what you assume it should say.
- Don't apply a "common fix" before confirming the cause.
- If unclear, add a print/log to verify state — then fix.
This is the step LLMs skip most often after "run tests". They guess from error keywords and apply the most-recent-pattern fix. That's how a one-line bug becomes a three-file refactor.

# Everything Claude Code (ECC) - Core Principles & Hybrid Routing

- **Hybrid Model Routing (모델 사용 원칙)** — 일상적인 코딩, 리팩토링, 파일 탐색은 무조건 Gemini (Pro/Flash)를 사용하라. Claude는 '설계 아키텍처 결함 해결' 또는 '다중 파일이 얽힌 치명적 Race Condition 해결' 등 제한된 상황에서만 명시적으로 호출하라.
- **Security-First (보안 최우선)** — API Key, Token 등 시크릿 값은 절대 하드코딩하지 않는다. 반드시 환경 변수(env)를 사용하며, 노출 발견 시 즉각 로테이션 및 수정한다.
- **Immutability (불변성 유지 - CRITICAL)** — 기존 객체나 상태를 직접 수정(mutate)하지 마라. 항상 변경사항이 적용된 새로운 복사본을 생성하여 반환한다.
- **File Organization (파일 모듈화)** — 거대한 단일 파일(Mega-file)을 절대 만들지 마라. 파일은 기능/도메인 단위로 200~400줄을 유지하며, 최대 800줄을 넘기지 않도록 분리(Decoupling)한다.
- **Error Handling & Validation** — 모든 에러는 조용히 넘기지(swallow) 말고 명시적으로 처리한다. 외부에서 들어오는 데이터(사용자 입력 등)는 시스템 경계에서 반드시 검증(Validate)한다.
- **Context Management** — 컨텍스트 윈도우 한계를 인지하라. 대규모 리팩토링 시 한 번에 너무 많은 파일을 로드하지 말고, 작업이 끝난 도메인은 메모리에서 내린 후 다음 작업을 진행한다.
