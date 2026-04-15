'use client';

import React from 'react';

export default function ServicePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-primary text-4xl">medical_services</span>
      </div>
      <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface mb-4">SERVICE</h1>
      <p className="text-on-surface/60 max-w-sm font-body">
        Premium professional services for our community members are coming soon.
      </p>
    </div>
  );
}
