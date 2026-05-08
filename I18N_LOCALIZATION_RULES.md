# I18N Localization Strict Rules (Defensive Wall)

**⛔ DO NOT CHANGE THESE CORE LOCALIZATION TERMS ⛔**

This document serves as the absolute source of truth for specific UI text mappings within the WoC platform. These mappings have been explicitly requested and approved by the platform owner (스토니). Under NO circumstances should these be altered, "optimized", or reverted to their previous states.

## 1. Core Vocabulary Mapping (Korean)

Any new features, components, or modules MUST adhere to these exact translations:

*   **공간 (Space)** -> **장소(맵)**
*   **둘러보기 (Explore)** -> **취미탐색**
*   **분실물 (Lost Property)** -> **분실·습득**
*   **정기 모임 (Regular Meetup)** -> **레귤러밀롱가**
*   **팝업 (Pop-up)** -> **팝업밀롱가**
*   **즐겨찾기 (Favorites)** -> **♡ 찜** *(Applies globally to all menus/filters)*
*   **이력 (History)** -> **히스토리**

## 2. Default UI States

*   **World Event Toggle**: The "World Event" filter checkbox (used in the Event and Social modules) MUST be **checked (enabled) by default** (`useState(true)`).

## 3. Enforcement

*   A warning block has been injected directly into `src/contexts/LanguageContext.tsx` to prevent accidental overwrites.
*   When adding new keys to the `LanguageContext` dictionary, AI agents must cross-reference this document to ensure compliance with the established vocabulary.
