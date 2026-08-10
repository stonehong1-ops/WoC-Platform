'use client';

export type TodayViewMode = 'list' | 'timeline' | 'calendar';

const ICONS: Record<TodayViewMode, string> = {
  list: 'grid_view',
  timeline: 'format_list_bulleted',
  calendar: 'calendar_view_week',
};

const NEXT: Record<TodayViewMode, TodayViewMode> = {
  list: 'timeline',
  timeline: 'calendar',
  calendar: 'list',
};

interface ViewCycleButtonProps {
  mode: TodayViewMode;
  onChange: (next: TodayViewMode) => void;
  /** 그룹/DJ 필터가 활성화되어 'list'(카드) 상태를 건너뛰어야 할 때 true */
  skipCard?: boolean;
}

export default function ViewCycleButton({ mode, onChange, skipCard }: ViewCycleButtonProps) {
  const handleClick = () => {
    let next = NEXT[mode];
    if (skipCard && next === 'list') next = NEXT[next];
    onChange(next);
  };

  return (
    <button
      onClick={handleClick}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 border border-slate-200/50 text-slate-600 active:scale-90 transition-all cursor-pointer"
    >
      <span className="material-symbols-outlined !text-[18px]">{ICONS[mode]}</span>
    </button>
  );
}
