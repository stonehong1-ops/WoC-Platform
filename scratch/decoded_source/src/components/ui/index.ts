/**
 * WoC 공통 UI 컴포넌트
 * 
 * ProductDetail에서 검증된 디자인 패턴을 재사용 가능한 컴포넌트로 추출.
 * Stitch 디자인 시스템의 primary 컬러 토큰은 유지하되,
 * 세부 그레이스케일/레이아웃은 직접 관리.
 * 
 * 사용법:
 * import { SectionCard, InfoRow, ChipSelector } from '@/components/ui';
 */

export { default as SectionCard } from './SectionCard';
export { default as InfoRow } from './InfoRow';
export { default as RadioSelector } from './RadioSelector';
export { default as ChipSelector } from './ChipSelector';
export { default as FullScreenModal } from './FullScreenModal';
export { default as CollapseSection } from './CollapseSection';
