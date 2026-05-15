# WoC Poster Style Reference (Base: Clean)

이 문서는 WoC 포스터 스타일의 기본이 되는 'Clean' 시리즈의 핵심 구조와 신규 스타일 확장을 위한 가이드라인을 제공합니다.

---

## 1. 기본 원칙 (Core Rules)

1. **Zero Design Deviation**: 100% 디자인 충실도를 유지하며, 픽셀 단위의 정확도를 지향합니다.
2. **Image Stability (CRITICAL)**: `html2canvas` 캡처 시 이미지가 누락되지 않도록 모든 `<img>` 태그에 아래 속성을 **반드시** 포함해야 합니다.
   ```tsx
   <img 
     src={d.imageUrl} 
     crossOrigin="anonymous" 
     loading="eager" 
     decoding="sync" 
     ... 
   />
   ```
3. **Prefix Naming**: 'Clean' 시리즈 확장은 `LayoutClean[번호]` 형태의 컴포넌트명과 `clean-[번호]` 형태의 ID를 사용합니다.

---

## 2. 기본 스타일 예시 (Base Style: Clean-10)

가장 완성도 높은 `Clean-10 (Magazine)` 스타일의 구조입니다. 이를 기반으로 새로운 레이아웃을 확장합니다.

```tsx
/* --- C10: Clean Classic (Magazine) --- */
const LayoutClean10 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-white p-6 font-serif">
    <div className="w-full h-full border border-black p-10 flex flex-col relative">
      <div className="text-center mb-8">
        <div className="flex justify-center gap-10 text-[10px] font-sans font-black tracking-[0.3em] uppercase opacity-30 mb-6">
          <span>{d.venueLocation || "CITY GUIDE"}</span>
          <span>•</span>
          <span>{d.dateStr} EDITION</span>
          <span>•</span>
          <span>VOL. 01</span>
        </div>
        <h1 className="text-[64px] font-bold text-black leading-none tracking-tight">
          {d.title}
        </h1>
      </div>

      <div className="flex-1 bg-zinc-100 overflow-hidden shadow-inner">
        {d.imageUrl && (
          <img 
            src={d.imageUrl} 
            className="w-full h-full object-cover" 
            alt="" 
            crossOrigin="anonymous" 
            loading="eager" 
            decoding="sync" 
          />
        )}
      </div>

      <div className="mt-8 flex justify-between items-center font-sans">
        <div>
          <p className="text-[20px] font-black leading-tight uppercase">{d.venueName}</p>
          <p className="text-[12px] font-bold opacity-40">{d.timeStr}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black italic uppercase tracking-tighter">Guest List Only</p>
          <p className="text-[10px] font-bold opacity-40">{d.fee || "MEMBERS ONLY"}</p>
        </div>
      </div>

      <div className="absolute top-1/2 -right-4 -translate-y-1/2 rotate-90">
        <p className="text-[10px] font-sans font-black tracking-widest text-black/10 uppercase whitespace-nowrap">
          WORLD OF COMMUNITY MAGAZINE 2026
        </p>
      </div>
    </div>
  </div>
);
```

---

## 3. 확장 스타일 추가 가이드

1. **디자인 테마 설정**: 'Clean' 프리픽스에 걸맞은 미니멀, 모던, 에디토리얼 테마를 선정합니다.
2. **레이아웃 구현**: `PosterLayouts.tsx` 파일에 컴포넌트를 추가합니다.
3. **레지스트리 등록**: 파일 하단의 `POSTER_LAYOUTS` 배열에 `{ id: "clean-N", name: "Clean Name", Component: LayoutCleanN }` 형식으로 추가합니다.
4. **검증**: 저장 시 이미지가 정상적으로 포함되는지, 텍스트가 잘리지 않는지 확인합니다.
