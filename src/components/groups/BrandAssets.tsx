import React from 'react';

export default function BrandAssets() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-16 h-16 bg-surface-variant rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-3xl text-on-surface-variant">palette</span>
      </div>
      <h2 className="text-xl font-bold text-on-surface mb-2">Brand Assets (Mockup)</h2>
      <p className="text-on-surface-variant mb-6 max-w-sm">
        Logo Library, Typography Guide, Color Palette, Download Assets, Version History, Usage Guidelines
      </p>
    </div>
  );
}
