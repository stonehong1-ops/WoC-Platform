'use client';

import React from 'react';
import Link from 'next/link';

export type CategoryGridItem = {
  id: string;
  label: string;
  count?: number | string;
  icon?: string | React.ReactNode;
  bg?: string; // e.g. 'bg-blue-50 text-blue-600'
  href?: string;
  onClick?: () => void;
};

export type CategoryGridProps = {
  items: CategoryGridItem[];
  columns?: number;
};

export default function CategoryGrid({
  items,
  columns = 4
}: CategoryGridProps) {
  const gridColsClass = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5'
  }[columns] || 'grid-cols-4';

  const renderItem = (item: CategoryGridItem) => {
    const defaultBg = 'bg-slate-50 text-slate-650';
    const activeBg = item.bg || defaultBg;

    const content = (
      <div className="bg-white border border-slate-100 rounded-3xl p-3 flex flex-col items-center justify-center cursor-pointer hover:shadow-sm active:scale-[0.97] transition-all min-h-[105px] w-full text-center">
        <div className={`w-10 h-10 rounded-full ${activeBg.split(' ')[0]} flex items-center justify-center mb-2`}>
          {typeof item.icon === 'string' ? (
            <span className={`material-symbols-outlined ${activeBg.split(' ')[1]} text-xl`}>
              {item.icon}
            </span>
          ) : (
            item.icon
          )}
        </div>
        <span className="text-[11px] font-black text-slate-800 leading-tight truncate w-full px-0.5">
          {item.label}
        </span>
        {item.count !== undefined && (
          <span className="text-[10.5px] font-black text-slate-450 mt-1">
            {item.count}
          </span>
        )}
      </div>
    );

    if (item.href) {
      return (
        <Link key={item.id} href={item.href} className="w-full">
          {content}
        </Link>
      );
    }

    return (
      <button 
        key={item.id} 
        onClick={item.onClick} 
        className="w-full focus:outline-none"
      >
        {content}
      </button>
    );
  };

  return (
    <div className={`grid ${gridColsClass} gap-3 w-full`}>
      {items.map(renderItem)}
    </div>
  );
}
