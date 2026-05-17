# 📑 World of Community (WoC) - Claude Handoff & Incident Report

> 본 문서는 Git 롤백 이후 발생한 데이터베이스 구조, 다국어 번역 키, UI 디자인 템플릿 간의 정합성 불일치 문제를 분석하고, 이를 **디자인 편차 0%** 및 **실시간 데이터 바인딩** 원칙 하에 완벽 복구하기 위해 다음 에이전트(Claude)에게 전달하는 **최종 기술 인수인계서**입니다.

---

## 1. 사건 개요 (Incident Overview)

### 🚨 발단 및 문제 정의
1. **Git 롤백 실행**: 이전 작업 중 예기치 못한 레이아웃 뒤틀림 혹은 로직 엉킴 현상으로 인해 이전 안전한 시점으로 **Git 롤백**이 단행되었습니다.
2. **데이터 및 빌드 불일치 발생**: 
   - 롤백 이후, 운영 데이터베이스(Firestore)의 최신 구조와 롤백된 로컬 코드 베이스 간의 불일치가 발생하였습니다.
   - 다국어 번역 키 파일(`LanguageContext.tsx`)에서 `groups.cat_academy` (Academy / 아카데미) 키가 유실되어 화면이 하얗게 깨지거나 빌드 에러가 발생하는 장애가 발생했습니다.
   - 클래스 관리 에디터(`GroupClassEditor.tsx`)의 디자인이 롤백되어 프리미엄 템플릿 대신 기존의 단순 탭 디자인으로 렌더링되고 있었습니다.

### 🛠️ 긴급 복구 조치 완료 (Step 1 & Step 2)
- **[완료] Step 1: CSS 및 디자인 테마 복구 (Style Fix)**
  - Stitch 디자인 시스템의 성역(Sacred File)인 `tailwind.config.ts`와 백업 파일 `tailwind.config.bak.ts`가 100% 일치하며 디자인 토큰 및 팔레트가 완벽하게 무결함을 검증 완료했습니다.
- **[완료] Step 2: 다국어(번역 키) 동기화 (LanguageContext Fix)**
  - 빌드 장애의 원인이었던 `groups.cat_academy` 번역 데이터를 `src/contexts/LanguageContext.tsx` 파일에 성공적으로 주입 및 동기화하여 빌드 에러를 완벽히 해결했습니다.

---

## 2. 핵심 아키텍처 분석 및 불일치 진단 (가장 중요)

클래스 관리 에디터의 완벽 복구를 위해서는 **구형 방식(백업 코드)**과 **신형 방식(현재 운영 코드)** 간의 심각한 데이터 흐름 불일치를 반드시 이해해야 합니다.

### 🔄 1) 데이터 아키텍처 불일치 분석

```mermaid
graph TD
    subgraph 구형 방식 (백업 코드: Embedded Array)
        A[Group 문서] -->|단일 필드에 배열 저장| B[group.classes]
        A -->|단일 필드에 배열 저장| C[group.discounts]
        A -->|단일 필드에 배열 저장| D[group.monthlyPasses]
        E[GroupClassEditor] -->|updateGroupMetadata API| A
    end

    subgraph 신형 방식 (운영 코드: Firestore Subcollection)
        F[Group 문서] -->|독립 서브콜렉션 생성| G[groups/{id}/classes]
        F -->|독립 서브콜렉션 생성| H[groups/{id}/discounts]
        F -->|독립 서브콜렉션 생성| I[groups/{id}/monthlyPasses]
        J[GroupClassEditor] -->|Real-time Listener 구독| G
        J -->|Real-time Listener 구독| H
        J -->|Real-time Listener 구독| I
    end
```

*   **백업 코드 (`current_state_utf8.txt`)**:
    - `group.classes`, `group.discounts`, `group.monthlyPasses`와 같은 단일 문서 내 embedded array(구형 방식)를 직접 `groupService.updateGroupMetadata`로 갱신하고 연동합니다.
*   **현재 운영 코드 (`GroupClassEditor.tsx`)**:
    - Firestore의 독립 서브콜렉션(`groups/{groupId}/classes`, `discounts`, `monthlyPasses`)을 `subscribeClasses` 등의 실시간 리스너로 구독하여 `subClasses`, `subPasses`, `subDiscounts` 상태로 실시간 바인딩하고 있습니다.
*   **하위 에디터 3종의 현재 상태**:
    - `GroupClassAddEditor.tsx`, `GroupClassDiscountEditor.tsx`, `GroupClassMonthlyPassEditor.tsx`는 **이미 최신 Subcollection API**(`groupService.addClass`, `addDiscount` 등)를 호출하여 완벽하게 개별 서브콜렉션에 데이터를 쓰고 있습니다.

> [!CAUTION]
> **절대 금지 사항**:
> 만약 백업 코드(`current_state_utf8.txt`)의 구형 embedded array 업데이트 로직(`updateGroupMetadata`)으로 `GroupClassEditor.tsx`를 완전히 원복해 버린다면, 현재 정상 작동 중인 하위 에디터들의 Subcollection 저장 데이터가 메인 화면에 반영되지 않거나 최악의 경우 데이터 유실/충돌이 발생하게 됩니다.
>
> **올바른 솔루션**:
> **디자인은 백업본(`current_state_utf8.txt`)의 프리미엄 UI를 100% 0-pixel 정확도로 이식**하되, **데이터 연동은 운영 코드(`GroupClassEditor.tsx`)의 실시간 Subcollection 구독(`filteredClasses` 등)을 그대로 주입**하는 병합 작업을 수행해야 합니다.

---

## 3. 잔여 작업 및 단계별 복구 계획 (Action Plan for Claude)

다음 에이전트(Claude)는 **Step 3: 클래스 데이터 렌더링 복구 (Data Binding Fix)** 작업을 즉시 수행해야 합니다.

### 🛠️ Step 3: 클래스 데이터 렌더링 복구 가이드

#### 1) State 및 실시간 구독 로직 유지
- [GroupClassEditor.tsx](file:///C:/Users/stone/WoC/src/components/groups/GroupClassEditor.tsx)의 최상단 State 정의, 실시간 데이터 구독(Line 32-126) 및 legacy 데이터 마이그레이션 로직은 절대로 건드리지 않고 **완벽히 보존**합니다.
- Month Navigation 필터링 로직(`filteredClasses`, `filteredDiscounts`, `filteredPasses`)도 그대로 활용합니다.

#### 2) 프리미엄 UI 디자인 이식 (0-Pixel Deviation)
- 전체 컨테이너에 백업본의 프리미엄 테마 배경색 `bg-[#f8faff]`를 적용합니다.
- **헤더 영역**:
  - 백업본(`current_state_utf8.txt`)의 헤더 레이아웃(Line 137-158)을 적용합니다. 
  - 좌측 상단에는 기존 운영 코드의 뒤로가기 버튼(`onClick={onClose}`)을 디자인을 훼손하지 않게 통합합니다.
- **탭 네비게이션**:
  - 기존 운영 코드의 탭 메뉴('register' | 'application' | 'stats') 구조는 기능적으로 유지하되, 백업본의 럭셔리한 톤앤매너에 어울리도록 세련되게 스타일링을 개선합니다.
- **퀵 액션 카드**:
  - 'register' 탭일 때 백업본의 3대 카드형 버튼(수업 추가, 할인 패키지 추가, 정기권 추가)을 이식합니다. UI 텍스트는 글로벌 영어 규정에 맞춰 영문화합니다.
    - *New Class* / *Add Bundle* / *Add Pass*
- **리스트 섹션 (코스 / 할인 / 정기권)**:
  - 백업본의 미려하고 풍성한 카드 레이아웃(Line 228-312, 340-380, 410-460)을 100% 정확도로 이식합니다.
  - 리스트를 돌릴 때 기존의 `classes` 변수 대신 실시간 반응형 데이터인 **`filteredClasses`, `filteredDiscounts`, `filteredPasses`**를 매핑합니다.
  - 카드를 클릭했을 때 해당 아이템 수정을 위해 하위 에디터 모달(`setEditingState({ type: 'add-class' / 'discount' / 'monthly-pass', data: item })`)이 정상 동작하도록 바인딩합니다.

#### 3) 삭제 확인 모달 및 영문화 적용
- 백업본에 포함된 한글 깨짐 코드를 해결함과 동시에, 글로벌 영어 규칙(`ALL UI text, labels, and system messages MUST be in English`)을 완벽 준수하기 위해 **모든 UI 문구를 자연스러운 영문으로 변경**합니다.
- 백업본의 미려한 `toast.custom` 삭제 확인 모달(Line 42-74)을 완벽히 이식하며, 아래와 같이 영문화합니다:
  - Title: `Delete Confirmation`
  - Body Message: `Are you sure you want to delete this item? This action cannot be undone.`
  - Cancel Button: `Cancel`
  - Delete Button: `Delete`
- 삭제 처리는 최신 Subcollection API를 정상적으로 호출하는 기존 `executeDelete` (Line 135-166) 함수를 그대로 바인딩합니다.

---

## 4. 작동 원칙 및 규정 (Prohibitions & Standards)

Claude는 아래의 **플랫폼 절대 규칙**을 단 한 치의 오차도 없이 준수해야 합니다.

1. **`tailwind.config.ts` 절대 수정 금지**: 어떠한 최적화나 동기화 작업 시에도 이 파일은 절대 건드리지 마십시오.
2. **디자인 우선 원칙 (No Refactoring/No CSS Optimization)**: 코드가 복잡해 보여도 컴포넌트 계층 구조를 1:1로 복구하고 디자이너가 작성한 Tailwind 클래스를 임의로 최적화하지 마십시오.
3. **글로벌 영문화 원칙**: 모든 UI 텍스트와 토스트 메시지는 영어(English Only)로 노출되어야 합니다.
4. **빌드 및 배포 보고 규칙**:
   - 코드 수정 완료 후, 로컬에서 Next.js 프로덕션 빌드를 수행하여 무결성을 검증하십시오.
   - 검증 후 반드시 Vercel 프로덕션 배포(`npx -y vercel --prod --yes`)를 수행하고, 배포가 완료되면 스토니(USER)에게 **Exit Code, Deployment ID, live URL 링크**를 명시적으로 제공해야 합니다.

---

## 5. 핵심 파일 참조 경로

*   **현재 운영 코드 (수정 대상)**: [`src/components/groups/GroupClassEditor.tsx`](file:///C:/Users/stone/WoC/src/components/groups/GroupClassEditor.tsx)
*   **복구용 백업 디자인 소스**: [`current_state_utf8.txt`](file:///C:/Users/stone/WoC/current_state_utf8.txt)
*   **다국어 파일**: [`src/contexts/LanguageContext.tsx`](file:///C:/Users/stone/WoC/src/contexts/LanguageContext.tsx)
*   **하위 에디터 레퍼런스**:
    - [`GroupClassAddEditor.tsx`](file:///C:/Users/stone/WoC/src/components/groups/GroupClassAddEditor.tsx)
    - [`GroupClassDiscountEditor.tsx`](file:///C:/Users/stone/WoC/src/components/groups/GroupClassDiscountEditor.tsx)
    - [`GroupClassMonthlyPassEditor.tsx`](file:///C:/Users/stone/WoC/src/components/groups/GroupClassMonthlyPassEditor.tsx)
