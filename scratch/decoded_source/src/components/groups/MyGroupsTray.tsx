'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Group } from '@/types/group';
import { useNavigation } from '@/components/providers/NavigationProvider';
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface MyGroupsTrayProps {
  groups: Group[];
  onGroupSelect?: (group: Group) => void;
}

type TrayState = 'COLLAPSED' | 'EXPANDED';

export default function MyGroupsTray({ groups, onGroupSelect }: MyGroupsTrayProps) {
  const router = useRouter();
  const [trayState, setTrayState] = useState<TrayState>('COLLAPSED');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isHeaderVisible } = useNavigation();

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTrayState(prev => prev === 'EXPANDED' ? 'COLLAPSED' : 'EXPANDED');
  };

  const handleGroupClick = (group: Group) => {
    if (onGroupSelect) {
      onGroupSelect(group);
    } else {
      router.push(`/groups/${group.id}`);
    }
  };

  const isExpanded = trayState === 'EXPANDED';

  // Hide tray when no groups
  if (groups.length === 0) return null;

  return (
    <>
      <div 
        className="fixed inset-x-0 z-[60] px-6 w-full max-w-sm mx-auto pointer-events-none flex justify-center"
        style={{ 
          bottom: 'calc(64px + max(env(safe-area-inset-bottom), 12px) + 3mm)',
          transform: 'translateY(var(--woc-bottom-nav-y, 0px))',
          transition: 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
      >
        <motion.div 
          animate={{ 
            height: isExpanded ? 'auto' : '64px', 
            y: isHeaderVisible ? 0 : 120, 
            opacity: isHeaderVisible ? 1 : 0 
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          initial={false}
          className="w-full max-w-sm bg-white/95 backdrop-blur-3xl rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] flex flex-col border border-white/60 overflow-hidden pointer-events-auto"
          onClick={() => !isExpanded && setTrayState('EXPANDED')}
        >
          {/* Top Row / Summary Bar */}
          <div className={`px-4 flex items-center justify-between min-h-[60px] cursor-pointer ${isExpanded ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center">
              <div 
                onClick={handleToggleExpand}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors hover:bg-slate-200"
              >
                <span className="material-symbols-rounded text-primary text-xl">
                  {isExpanded ? 'expand_more' : 'expand_less'}
                </span>
              </div>

              <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide">
                My Groups ({groups.length})
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isExpanded && (
                <div className="flex -space-x-2">
                  {groups.slice(0, 3).map((g, i) => (
                    <div 
                      key={g.id} 
                      className={`w-8 h-8 rounded-full border-2 border-white bg-slate-100 overflow-hidden relative ring-1 ring-slate-200/50`}
                      style={{ zIndex: 3 - i }}
                    >
                      {g.coverImage ? (
                        <ImageWithFallback src={g.coverImage} fallbackType="cover" category={g.tags?.[0] || ''} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-200">
                          <span className="material-symbols-rounded text-[14px] text-slate-400">groups</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {groups.length > 3 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold z-0">
                      +{groups.length - 3}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Expanded Card Scroll Area (Horizontal — Map FAB Style) */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center overflow-x-auto px-4 gap-3 no-scrollbar snap-x snap-mandatory py-3 h-[130px]"
                ref={scrollRef}
              >
                {groups.map(group => (
                  <div 
                    key={group.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroupClick(group);
                    }}
                    className={`flex-none w-[calc(100%-24px)] bg-white rounded-lg p-2 shadow-sm border flex gap-3 relative snap-center transition-all cursor-pointer border-slate-50`}
                  >
                    <div className="w-16 h-16 rounded-lg bg-slate-100 flex-none overflow-hidden">
                      {group.coverImage ? (
                        <ImageWithFallback src={group.coverImage} fallbackType="cover" category={group.tags?.[0] || ''} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <span className="material-symbols-rounded text-2xl">image</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 py-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[13px] font-bold text-slate-800 truncate pr-2 w-[180px] leading-tight">
                          {group.name}
                        </h3>
                        {group.nativeName && (
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{group.nativeName}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[11px] font-bold text-primary flex items-center gap-0.5">
                          <span className="material-symbols-rounded text-[12px]">groups</span>
                          {group.memberCount || 0}
                        </span>
                        
                        <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                          <span className="material-symbols-rounded text-[14px] text-slate-400">chevron_right</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      
      {/* Backdrop for Expanded State */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 z-[50] pointer-events-auto backdrop-blur-[1px]"
            onClick={(e) => {
              e.stopPropagation();
              setTrayState('COLLAPSED');
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}
