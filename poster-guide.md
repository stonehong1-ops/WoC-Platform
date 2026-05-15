# WoC Poster Style Development Guide

이 문서는 World of Community (WoC) 플랫폼의 소셜 포스터 레이아웃을 확장하고 유지보수하기 위한 표준 가이드라인입니다. 새로운 스타일을 추가할 때 이 규칙을 반드시 준수해야 디자인 편차를 줄이고 저장 기능을 완벽하게 보장할 수 있습니다.

---

## 1. 기본 원칙 (Core Principles)

1.  **Zero Design Deviation**: 원본 디자인의 의도를 100% 반영하며, 레이아웃 구조를 임의로 변경하지 않습니다.
2.  **Image Stability**: `html2canvas`를 통한 캡처 시 이미지가 누락되지 않도록 모든 `<img>` 태그에 필수 속성을 적용합니다.
3.  **Data Binding Only**: `PosterData` 인터페이스의 필드만을 사용하여 실시간 데이터를 바인딩합니다.

---

## 2. 필수 이미지 속성 (Mandatory Image Attributes)

포스터 저장 시 이미지가 깨지거나 스타일만 저장되는 문제를 방지하기 위해, **모든 이미지 요소**에는 반드시 다음 속성이 포함되어야 합니다.

```tsx
<img
  src={d.imageUrl}
  crossOrigin="anonymous" // CORS 정책 해결
  loading="eager"         // 즉시 로드 보장
  decoding="sync"        // 동기식 디코딩으로 캡처 시점 일치
  className="..."
  alt="..."
/>
```

---

## 3. 데이터 구조 (Data Mapping)

`PosterData` (`posterTypes.ts`) 인터페이스를 사용하여 컴포넌트에 데이터를 전달합니다.

| 필드명 | 설명 | 예시 |
| :--- | :--- | :--- |
| `title` | 이벤트 제목 | "Friday Night Milonga" |
| `dateStr` | 날짜 (월.일 형식) | "5.14" |
| `dayStr` | 요일 (영문 대문자) | "FRI" |
| `timeStr` | 시간 범위 | "PM 6-10" |
| `djName` | DJ 이름 | "DJ Stone" |
| `venueName` | 장소명 | "Tango Academy" |
| `venueLocation` | 지역/도시 | "Gangnam, Seoul" |
| `fee` | 참가비 (₩ 포함) | "₩15,000" |
| `orgName` | 주최자 명 | "WoC Community" |

---

## 4. Boilerplate (신규 레이아웃 템플릿)

`PosterLayouts.tsx`에 새로운 레이아웃을 추가할 때 아래 구조를 복사하여 사용하세요.

```tsx
/* --- T[번호]: [스타일 이름] --- */
const LayoutNewStyle = ({ d }: { d: PosterData }) => (
  <>
    {/* 1. 배경 오버레이 (텍스트 가독성 확보) */}
    <div className="absolute inset-0 bg-black/40" />
    
    {/* 2. 메인 콘텐츠 (제목, 날짜 등) */}
    <div className="absolute inset-0 flex flex-col p-8 text-white">
      <h1 className="text-[40px] font-black leading-tight drop-shadow-xl">
        {d.title}
      </h1>
      
      <div className="mt-auto">
        <p className="text-[18px] font-bold">{d.dateStr} {d.dayStr}</p>
        <p className="text-[14px] opacity-80">{d.timeStr}</p>
      </div>
    </div>

    {/* 3. 하단 정보 바 */}
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/10 backdrop-blur-md">
      <p className="text-[12px] font-medium">{d.venueName}</p>
    </div>
  </>
);
```

---

## 5. 등록 및 관리

레이아웃 구현 후, `PosterLayouts.tsx` 하단의 `POSTER_LAYOUTS` 레지스트리에 ID와 함께 등록해야 합니다.

```tsx
export const POSTER_LAYOUTS: Record<string, React.FC<{ d: PosterData }>> = {
  // ... 기존 레이아웃들
  "new-style-id": LayoutNewStyle,
};
```

---

## 6. 주의 사항 (Constraints)

*   **CSS Filter**: `blur`, `grayscale` 등 복잡한 CSS 필터는 `html2canvas`에서 렌더링 결과가 다를 수 있으므로 최소화합니다.
*   **External Fonts**: 구글 폰트 등 외부 폰트 사용 시 레이아웃 최상단에 `@import`가 포함되어 있는지 확인하십시오.
*   **Z-Index**: 배경 이미지가 콘텐츠를 가리지 않도록 적절한 `z-index` 또는 요소 순서를 유지하십시오.
