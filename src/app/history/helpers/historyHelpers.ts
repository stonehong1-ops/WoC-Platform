import { ClassRegistration } from '@/types/group';
import { BaseBooking } from '@/types/booking';
import { StayBooking } from '@/types/stay';

export const TABS = ['All', 'Class', 'Social', 'Shop', 'Stay'];

export type StatusKey = 'SUBMITTED' | 'BANK_TRANSFERRED' | 'SELLER_CONFIRMED' | 'SELLER_REJECTED' | 'REFUNDED' | 'DELIVERED' | string;

export const getTimestamp = (val: any) => {
  if (!val) return 0;
  if (typeof val.toMillis === 'function') return val.toMillis();
  if (val.seconds) return val.seconds * 1000;
  return new Date(val).getTime();
};

export function getStatusLabel(status: StatusKey, t: any): string {
  switch (status) {
    case 'SUBMITTED':
    case 'PENDING':
    case 'PAYMENT_PENDING':
      return t('history.status_submitted') || 'Submitted';
    case 'BANK_TRANSFERRED':
    case 'WAITING_CONFIRMATION':
    case 'PAYMENT_REPORTED':
      return t('history.status_bank_transferred') || 'Bank Transferred';
    case 'SELLER_CONFIRMED':
    case 'CONFIRMED':
    case 'PAYMENT_COMPLETED':
      return t('history.status_seller_confirmed') || 'Seller Confirmed';
    case 'SELLER_REJECTED':
    case 'REJECTED':
      return t('history.status_seller_rejected') || 'Seller Rejected';
    case 'REFUNDED':
      return t('history.status_refunded') || 'Refunded';
    case 'DELIVERED':
      return t('history.status_delivered') || 'Delivered';
    case 'CANCELLED':
    case 'CANCELED':
      return t('history.status_cancelled') || 'Cancelled';
    default: return status.replace(/_/g, ' ').toUpperCase();
  }
}

export function getStatusBadgeClass(status: StatusKey): string {
  switch (status) {
    case 'SUBMITTED':
    case 'PENDING':
    case 'PAYMENT_PENDING':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'BANK_TRANSFERRED':
    case 'WAITING_CONFIRMATION':
    case 'PAYMENT_REPORTED':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'SELLER_CONFIRMED':
    case 'CONFIRMED':
    case 'PAYMENT_COMPLETED':
    case 'DELIVERED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case 'SELLER_REJECTED':
    case 'REJECTED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'REFUNDED':
    case 'CANCELLED':
    case 'CANCELED':
      return 'bg-slate-100 text-slate-500 border-slate-200';
    default:
      return 'bg-surface-container text-on-surface-variant border-outline-variant';
  }
}

export function formatDate(reg: ClassRegistration | any, t: any, language: string): string {
  const appliedAt = reg.appliedAt || reg.createdAt;
  if (!appliedAt) return t('history.date_recently') || 'Recently';
  const d = appliedAt.toDate ? appliedAt.toDate() : new Date(appliedAt as any);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' });
}

export function formatFullDate(date: any, language: string): string {
  if (!date) return '';
  const d = date.toDate ? date.toDate() : new Date(date);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' }) + ' • ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function formatNotiDate(date: any, t: any, language: string): string {
  if (!date) return t('history.date_recently');
  const d = date.toDate ? date.toDate() : new Date(date);
  const locale = language === 'KR' ? 'ko-KR' : 'en-US';
  return d.toLocaleDateString(locale, { month: 'short', day: '2-digit', year: 'numeric' });
}

export function formatOrderId(domain: string, id: string, rawOrderNumber?: string): string {
  if (rawOrderNumber) return `#${rawOrderNumber}`;
  const prefixMap: Record<string, string> = {
    'class': 'CLS',
    'class_legacy': 'CLS',
    'class_daily': 'CLS',
    'class_4w': 'CLS',
    'shop': 'SHP',
    'stay': 'STY',
    'rental': 'RNT'
  };
  const prefix = prefixMap[domain?.toLowerCase()] || 'ORD';
  const year = new Date().getFullYear();
  const shortId = id.slice(-6).toUpperCase();
  return `#${prefix}-${year}-${shortId}`;
}
