'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

type Language = 'KO' | 'CN';

const krDictionary: Record<string, string> = {
  'syncfit.title': 'SyncFit 실시간 협업 시스템',
  'syncfit.menu.dashboard': '대시보드',
  'syncfit.menu.techpack': '작업지시서 관리',
  'syncfit.menu.colorbook': '디지털 컬러북',
  'syncfit.menu.showroom': '디지털 쇼룸',
  'syncfit.menu.scm': '원가 SCM',
  'syncfit.menu.settings': '시스템 설정',
  'syncfit.filter.all': '전체 스타일',
  'syncfit.filter.status': '상태 필터',
  'syncfit.filter.vendor': '거래처 지정',
  'syncfit.filter.factory': '공장 매칭',
  'syncfit.status.design': '디자인',
  'syncfit.status.factory_review': '공장검토',
  'syncfit.status.sample_prod': '샘플제작',
  'syncfit.status.sample_review': '샘플리뷰',
  'syncfit.status.prod_confirm': '생산확정',
  'syncfit.status.prod_active': '생산중',
  'syncfit.status.dist_vendor': '업체배포',
  'syncfit.status.completed': '완료',
  'syncfit.feed.title': '실시간 협업 타임라인 피드',
  'syncfit.feed.placeholder': '메시지를 입력하세요 (한국어/중국어 자동 번역 지원)...',
  'syncfit.feed.send': '전송',
  'syncfit.feed.original': '원문 보기',
  'syncfit.feed.translated': '자동 번역됨',
  'syncfit.feed.status_change': '상태 변경',
  'syncfit.right.techpack': '작업지시서 (Tech Pack)',
  'syncfit.right.design': '디자인 시안',
  'syncfit.right.sample': '샘플 사진',
  'syncfit.right.video': '착장 영상',
  'syncfit.right.colorbook': '컬러북 및 스와치',
  'syncfit.right.scm': '원가 정보 SCM',
  'syncfit.right.qr': 'QR 샘플 위치 로그',
  'syncfit.scm.calc': '원가 계산기 시뮬레이션',
  'syncfit.scm.factoryCost': '공장 원가',
  'syncfit.scm.exchangeRate': '환율',
  'syncfit.scm.duty': '관세',
  'syncfit.scm.shipping': '물류비',
  'syncfit.scm.margin': '목표 마진',
  'syncfit.scm.supplyPrice': '동대문 공급 가격',
  'syncfit.showroom.title': '가상 품평 스테이지',
  'syncfit.showroom.color': '컬러 비교',
  'syncfit.showroom.fabric': '원단 A/B 비교',
  'syncfit.showroom.version': '버전 비교',
  'syncfit.qr.stage': '현재 단계',
  'syncfit.qr.location': '위치',
  'syncfit.settings.lang': '인터페이스 마스터 언어',
  'syncfit.settings.role': '사용자 권한 스위칭',
  'syncfit.role.admin': '최고관리자 (사장님)',
  'syncfit.role.designer': '담당 디자이너',
  'syncfit.role.factory_staff': '중국 현지 담당자',
  'syncfit.role.vendor_staff': '지정 거래처',
  'syncfit.common.upload': '작업지시서 드래그 앤 드롭 업로드',
  'syncfit.common.add_file': '파일 첨부',
  'syncfit.common.confirm': '생산 최종 승인',
};

const cnDictionary: Record<string, string> = {
  'syncfit.title': 'SyncFit 实时协作系统',
  'syncfit.menu.dashboard': '仪表板',
  'syncfit.menu.techpack': '作业指示书管理',
  'syncfit.menu.colorbook': '数字色卡',
  'syncfit.menu.showroom': '数字展厅',
  'syncfit.menu.scm': '成本供应链(SCM)',
  'syncfit.menu.settings': '系统设置',
  'syncfit.filter.all': '全部款式',
  'syncfit.filter.status': '状态筛选',
  'syncfit.filter.vendor': '指定档口(客户)',
  'syncfit.filter.factory': '匹配工厂',
  'syncfit.status.design': '企划设计',
  'syncfit.status.factory_review': '工厂评估',
  'syncfit.status.sample_prod': '样衣制作',
  'syncfit.status.sample_review': '样衣评审',
  'syncfit.status.prod_confirm': '生产确认',
  'syncfit.status.prod_active': '正在大货生产',
  'syncfit.status.dist_vendor': '档口配发',
  'syncfit.status.completed': '已完成',
  'syncfit.feed.title': '实时协作时间线动态',
  'syncfit.feed.placeholder': '输入消息 (支持韩语/汉语自动翻译)...',
  'syncfit.feed.send': '发送',
  'syncfit.feed.original': '查看原文',
  'syncfit.feed.translated': '自动翻译',
  'syncfit.feed.status_change': '变更状态',
  'syncfit.right.techpack': '工艺单/作业指示书',
  'syncfit.right.design': '设计图/企划案',
  'syncfit.right.sample': '样衣照片',
  'syncfit.right.video': '上身试穿视频',
  'syncfit.right.colorbook': '数字色卡与面料',
  'syncfit.right.scm': '出厂成本估算 SCM',
  'syncfit.right.qr': '样衣 QR 追踪日志',
  'syncfit.scm.calc': '出厂单价与供应链模拟',
  'syncfit.scm.factoryCost': '工厂出厂价',
  'syncfit.scm.exchangeRate': '汇率',
  'syncfit.scm.duty': '关税',
  'syncfit.scm.shipping': '物流运费',
  'syncfit.scm.margin': '公司目标毛利',
  'syncfit.scm.supplyPrice': '东大门批发供应价',
  'syncfit.showroom.title': '虚拟评审舞台',
  'syncfit.showroom.color': '颜色对比',
  'syncfit.showroom.fabric': '面料 A/B 对比',
  'syncfit.showroom.version': '版本样衣对比',
  'syncfit.qr.stage': '当前节点',
  'syncfit.qr.location': '当前位置',
  'syncfit.settings.lang': '系统主界面语言',
  'syncfit.settings.role': '系统权限切换测试',
  'syncfit.role.admin': '总经理 (老板)',
  'syncfit.role.designer': '负责设计师',
  'syncfit.role.factory_staff': '中国现场中介/工厂负责人',
  'syncfit.role.vendor_staff': '指定东大门档口',
  'syncfit.common.upload': '拖拽或上传作业指示书/工艺包',
  'syncfit.common.add_file': '添加附件',
  'syncfit.common.confirm': '大货生产最终确认',
};

interface SyncFitLanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  tx: (key: string) => string;
}

const SyncFitLanguageContext = createContext<SyncFitLanguageContextType | undefined>(undefined);

export function SyncFitLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('KO');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('syncfit_language') as Language;
    if (saved && (saved === 'KO' || saved === 'CN')) {
      setLangState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    localStorage.setItem('syncfit_language', lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'KO' ? 'CN' : 'KO');
  }, [language, setLanguage]);

  const tx = useCallback((key: string): string => {
    const dict = language === 'KO' ? krDictionary : cnDictionary;
    return dict[key] || key;
  }, [language]);

  const contextValue = useMemo(() => ({
    language, toggleLanguage, setLanguage, tx
  }), [language, toggleLanguage, setLanguage, tx]);

  if (!isMounted) {
    return null;
  }

  return (
    <SyncFitLanguageContext.Provider value={contextValue}>
      {children}
    </SyncFitLanguageContext.Provider>
  );
}

export function useSyncFitLanguage() {
  const context = useContext(SyncFitLanguageContext);
  if (context === undefined) {
    throw new Error('useSyncFitLanguage must be used within a SyncFitLanguageProvider');
  }
  return context;
}
