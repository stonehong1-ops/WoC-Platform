export default function ChatLoading() {
  return (
    <div className="w-full flex flex-col items-center pt-16 pb-[60px]">
      <div className="w-full max-w-[896px] pt-4 pb-6 px-4 flex flex-col gap-4">
        {/* Tab skeleton */}
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-surface-container rounded-full animate-pulse" />
          <div className="h-9 w-24 bg-surface-container-low rounded-full animate-pulse" />
        </div>
        {/* Room list skeleton */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
            <div className="w-14 h-14 rounded-full bg-surface-container animate-pulse shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              <div className="h-4 bg-surface-container rounded animate-pulse w-1/2" />
              <div className="h-3 bg-surface-container-low rounded animate-pulse w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
