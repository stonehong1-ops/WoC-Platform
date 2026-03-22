'use client';

import React from 'react';

interface TodoPageProps {
  title: string;
}

export default function TodoPage({ title }: TodoPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in">
      <div className="relative mb-8 group">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full transition-all group-hover:bg-primary/30" />
        <div className="relative w-20 h-20 bg-glass backdrop-blur-md border border-glass-border rounded-3xl flex items-center justify-center shadow-2xl">
          <span className="text-3xl animate-bounce">🏗️</span>
        </div>
      </div>
      <h2 className="text-3xl font-black mb-3 tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-sm text-sm font-medium leading-relaxed">
        죄송합니다. 현재 **{title}** 서비스는 핵심 기능을 설계 중입니다.<br/> 곧 완성도 높은 모습으로 찾아뵙겠습니다!
      </p>
      <div className="mt-10 flex flex-col items-center gap-3">
        <div className="px-5 py-2 bg-primary/10 border border-primary/20 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
          Status: Architecture Defined
        </div>
        <div className="text-[10px] text-muted-foreground/50 font-mono">
          Ref: WoC_Core_Module_{title.toUpperCase()}
        </div>
      </div>
    </div>
  );
}
