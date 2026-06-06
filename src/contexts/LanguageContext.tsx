'use client';
// 다국어 상태 및 포맷팅 기능을 제공하는 컨텍스트 프로바이더.

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, ko } from 'date-fns/locale';
import { loadDictionary } from '../i18n';

type Language = 'EN' | 'KR';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: any) => string;
  formatDate: (date: any, formatStr?: string) => string;
  formatRelativeTime: (date: any) => string;
  dictionaryState: Record<string, string>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<Language>('KR');
  const [dictionaryState, setDictionaryState] = useState<Record<string, string>>({});
  const [isI18nLoading, setIsI18nLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
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

  useEffect(() => {
    let active = true;
    setIsI18nLoading(true);
    loadDictionary(language).then(dict => {
      if (active) {
        setDictionaryState(dict);
        setIsI18nLoading(false);
      }
    }).catch(err => {
      console.error('Failed to load dictionary:', err);
      setIsI18nLoading(false);
    });
    return () => { active = false; };
  }, [language]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isMounted) {
      document.documentElement.lang = language === 'KR' ? 'ko' : 'en';
    }
  }, [language, isMounted]);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    localStorage.setItem('woc_language', lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'EN' ? 'KR' : 'EN');
  }, [language, setLanguage]);

  const t = useCallback((key: string, params?: any): string => {
    const langKey = (language || 'KR').toUpperCase() as Language;
    let text = dictionaryState[key];
    const hasTranslation = text !== undefined;

    if (!hasTranslation) {
      if (isI18nLoading) {
        return '';
      }
      console.error(`🚨 [Missing Translation] Key "${key}" is missing in language "${langKey}"`);
      
      // 런타임 클라이언트 브라우저 환경에서 실시간 경고 토스트 송출
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => {
          const toastId = `missing-${key}-${langKey}`;
          toast.error(`Missing translation: ${key} (${langKey})`, {
            id: toastId,
            duration: 10000,
          });
        }).catch(() => {});
      }
      
      return `🚨 Missing Translation\n${key}`;
    }

    if (params && typeof params === 'object') {
      Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
      });
    }

    return text;
  }, [language, dictionaryState, isI18nLoading]);

  const formatDate = useCallback((date: any, formatStr: string = 'yyyy-MM-dd') => {
    if (!date) return '';
    const langKey = (language || 'KR').toUpperCase() as Language;
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
    const resolvedFormat = formatAliases[langKey]?.[formatStr] || formatStr;
    try {
      const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
      return format(d, resolvedFormat, { locale: langKey === 'KR' ? ko : enUS });
    } catch (e) {
      return '';
    }
  }, [language]);

  const formatRelativeTime = useCallback((date: any) => {
    if (!date) return '';
    try {
      const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
      return formatDistanceToNow(d, { addSuffix: true, locale: language === 'KR' ? ko : enUS });
    } catch (e) {
      return '';
    }
  }, [language]);

  const contextValue = useMemo(() => ({
    language, toggleLanguage, setLanguage, t, formatDate, formatRelativeTime, dictionaryState
  }), [language, toggleLanguage, setLanguage, t, formatDate, formatRelativeTime, dictionaryState]);

  if (!isMounted || (isI18nLoading && Object.keys(dictionaryState).length === 0)) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#fdf7ff] flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#004190]/10 border-t-[#004190] animate-spin" />
      </div>
    );
  }

  return (
    <LanguageContext.Provider value={contextValue}>
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
