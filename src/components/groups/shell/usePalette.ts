// headerThemeColor 값을 CSS Custom Properties로 변환하는 팔레트 엔진 훅
'use client';

import { useMemo } from 'react';

/**
 * hex 컬러를 HSL로 변환
 */
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export interface PaletteVars {
  '--palette-main': string;
  '--palette-soft': string;
  '--palette-gradient': string;
}

/**
 * headerThemeColor(hex)를 받아 팔레트 CSS 변수 객체를 반환한다.
 * 반환값을 style 속성에 spread하면 하위 요소에서 var(--palette-*) 로 사용 가능.
 */
export function usePalette(themeColor: string | undefined): PaletteVars {
  const color = themeColor || '#1a1c23';

  return useMemo(() => {
    const { h, s } = hexToHSL(color);

    // --palette-main: 원본 색상 그대로
    const main = color;

    // --palette-soft: 매우 밝은 tint (배경용)
    const soft = `hsl(${h}, ${Math.min(s, 60)}%, 95%)`;

    // --palette-gradient: 어두운→원본→밝은 그래디언트
    const darkShade = `hsl(${h}, ${Math.min(s + 10, 100)}%, ${Math.max(20, 25)}%)`;
    const midShade = color;
    const lightShade = `hsl(${h}, ${Math.min(s, 70)}%, 55%)`;
    const gradient = `linear-gradient(135deg, ${darkShade} 0%, ${midShade} 45%, ${lightShade} 100%)`;

    return {
      '--palette-main': main,
      '--palette-soft': soft,
      '--palette-gradient': gradient,
    };
  }, [color]);
}
