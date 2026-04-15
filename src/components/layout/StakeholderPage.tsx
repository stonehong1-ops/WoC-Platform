import React from 'react';

interface StakeholderPageProps {
  title: string;
}

export default function StakeholderPage({ title }: StakeholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-outline-variant text-3xl">account_balance</span>
      </div>
      <h1 className="text-2xl font-bold text-primary mb-2 uppercase tracking-tight">{title}</h1>
      <p className="text-sm text-tertiary max-w-xs font-medium leading-relaxed">
        Stakeholder Content Area. This page is currently being prepared for platform stakeholders.
      </p>
      
      {/* Decorative decorative elements for "Premium" feel */}
      <div className="mt-12 flex gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-surface-container"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-surface-container"></div>
        <div className="w-1.5 h-1.5 rounded-full bg-surface-container"></div>
      </div>
    </div>
  );
}
