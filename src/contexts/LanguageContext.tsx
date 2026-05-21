'use client';
// 다국어 상태 및 포맷팅 기능을 제공하는 컨텍스트 프로바이더.

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { dictionary } from '../i18n';

type Language = 'EN' | 'KR';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: any) => string;
  formatDate: (date: any, formatStr?: string) => string;
  formatRelativeTime: (date: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<Language>('KR');

  useEffect(() => {
    const saved = localStorage.getItem('woc_language') as Language;
    if (saved && (saved === 'EN' || saved === 'KR')) {
      setLangState(saved);
    } else {
      // First visit: detect browser language → Korean browser = KR, else EN
      const browserLang = navigator.language || '';
      const detected: Language = browserLang.startsWith('ko') ? 'KR' : 'EN';
      setLangState(detected);
      localStorage.setItem('woc_language', detected);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    localStorage.setItem('woc_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'EN' ? 'KR' : 'EN');
  };

  const t = (key: string, params?: any): string => {
    let text = dictionary[language]?.[key] || key;

    if (params && typeof params === 'object') {
      Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
      });
    }

    return text;
  };

  const formatDate = (date: any, formatStr: string = 'yyyy-MM-dd') => {
    if (!date) return '';
    // Map custom alias strings to date-fns format tokens based on active language
    const formatAliases: Record<Language, Record<string, string>> = {
      KR: {
        'iso': 'yyyy-MM-dd',
        'dayOnly': 'd일',
        'calendarDay': 'd',
        'monthYear': 'yyyy년 M월',
        'shortMonthDay': 'M월 d일',
        'shortMonth': 'M월',
        'shortWeekday': 'EEE',
        'weekday': 'EEEE',
        'timeOnly': 'HH:mm',
        'dateOnly': 'yyyy.MM.dd',
        'dateTime': 'yyyy.MM.dd HH:mm',
      },
      EN: {
        'iso': 'yyyy-MM-dd',
        'dayOnly': 'd',
        'calendarDay': 'd',
        'monthYear': 'MMMM yyyy',
        'shortMonthDay': 'MMM d',
        'shortMonth': 'MMM',
        'shortWeekday': 'EEE',
        'weekday': 'EEEE',
        'timeOnly': 'HH:mm',
        'dateOnly': 'yyyy.MM.dd',
        'dateTime': 'yyyy.MM.dd HH:mm',
      }
    };
    const resolvedFormat = formatAliases[language][formatStr] || formatStr;
    try {
      const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
      return format(d, resolvedFormat, { locale: language === 'KR' ? ko : enUS });
    } catch (e) {
      return '';
    }
  };

  const formatRelativeTime = (date: any) => {
    if (!date) return '';
    try {
      const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
      return formatDistanceToNow(d, { addSuffix: true, locale: language === 'KR' ? ko : enUS });
    } catch (e) {
      return '';
    }
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, formatDate, formatRelativeTime }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
