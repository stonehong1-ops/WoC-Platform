import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function getContrastColor(hexColor: string): 'white' | 'black' {
  if (!hexColor) return 'white';
  
  // Remove hash if present
  const color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  
  // Handle 3-digit hex
  const fullColor = color.length === 3 
    ? color.split('').map(c => c + c).join('') 
    : color;

  // Convert to RGB
  const r = parseInt(fullColor.substring(0, 2), 16);
  const g = parseInt(fullColor.substring(2, 4), 16);
  const b = parseInt(fullColor.substring(4, 6), 16);
  
  // Calculate relative luminance
  // Using the formula for relative luminance: 0.299R + 0.587G + 0.114B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? 'black' : 'white';
}
