// 그룹 App-in-App Shell의 More 드롭다운 (일반 메뉴 / 관리자 메뉴 / 팔레트)
'use client';

import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

type TabType = string;

interface MoreMenuItem {
  id: TabType;
  key: string;
  icon: string;
}

interface GroupShellMoreProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MoreMenuItem[];
  adminItems: MoreMenuItem[];
  isAdmin: boolean;
  activeTab: TabType;
  onMenuClick: (tab: TabType) => void;
  // 팔레트
  paletteColors: string[];
  currentColor: string;
  onColorChange: (color: string) => void;
}

export default function GroupShellMore({
  isOpen,
  onClose,
  menuItems,
  adminItems,
  isAdmin,
  activeTab,
  onMenuClick,
  paletteColors,
  currentColor,
  onColorChange,
}: GroupShellMoreProps) {
  const { t } = useLanguage();

  const handleItemClick = (e: React.MouseEvent, tabId: TabType) => {
    e.stopPropagation();
    onMenuClick(tabId);
    onClose();
  };

  // 서비스 관리 탭 식별자 목록
  const serviceTabIds = React.useMemo(() => new Set([
    'class-setting',
    'shop-setting',
    'stay-setting',
    'rental-setting',
    'class-admin',
    'shop-admin',
    'stay-admin',
    'rental-admin'
  ]), []);

  // 서비스 설정 탭과 순수 어드민 탭 분리
  const { serviceItems, pureAdminItems } = React.useMemo(() => {
    const service = adminItems.filter(item => serviceTabIds.has(item.id));
    const pureAdmin = adminItems.filter(item => !serviceTabIds.has(item.id));
    return { serviceItems: service, pureAdminItems: pureAdmin };
  }, [adminItems, serviceTabIds]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="more-dropdown-wrapper"
          className="absolute right-0 top-full"
          style={{ zIndex: 100 }}
        >
          {/* 백드롭 레이어: 외부 클릭 감지 및 차단을 위해 최상위 바로 아래인 z-[99]로 조정 */}
          <div
            className="fixed inset-0 z-[99]"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="more-dropdown"
            style={{ position: 'relative', top: 0, zIndex: 100 }}
          >
            {/* 일반 메뉴 */}
            {menuItems.length > 0 && (
              <>
                <div className="menu-title">{t('group.more.menu')}</div>
                {menuItems.map(item => (
                  <div
                    key={item.id}
                    className={`menu-item ${activeTab === item.id ? 'menu-item-active' : ''}`}
                    onClick={(e) => handleItemClick(e, item.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                    <span>{t(item.key) || (item.key.includes('.') ? item.key.split('.').pop() : item.key)}</span>
                  </div>
                ))}
              </>
            )}

            {/* 서비스 설정 메뉴 */}
            {isAdmin && serviceItems.length > 0 && (
              <>
                {(menuItems.length > 0) && <div className="divider" />}
                <div className="menu-title">{t('group.more.service')}</div>
                {serviceItems.map(item => (
                  <div
                    key={item.id}
                    className={`menu-item ${activeTab === item.id ? 'menu-item-active' : ''}`}
                    onClick={(e) => handleItemClick(e, item.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                    <span>{t(item.key) || (item.key.includes('.') ? item.key.split('.').pop() : item.key)}</span>
                  </div>
                ))}
              </>
            )}

            {/* 관리자 메뉴 */}
            {isAdmin && pureAdminItems.length > 0 && (
              <>
                {(menuItems.length > 0 || serviceItems.length > 0) && <div className="divider" />}
                <div className="menu-title">{t('group.more.admin')}</div>
                {pureAdminItems.map(item => (
                  <div
                    key={item.id}
                    className={`menu-item ${activeTab === item.id ? 'menu-item-active' : ''}`}
                    onClick={(e) => handleItemClick(e, item.id)}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{item.icon}</span>
                    <span>{t(item.key) || (item.key.includes('.') ? item.key.split('.').pop() : item.key)}</span>
                  </div>
                ))}
              </>
            )}

            {/* 팔레트 (관리자만) */}
            {isAdmin && (
              <>
                <div className="divider" />
                <div className="menu-title">{t('group.more.theme')}</div>
                <div className="palette-row">
                  {paletteColors.map(color => (
                    <button
                      key={color}
                      className={`palette-color ${currentColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color } as any}
                      onClick={() => {
                        onColorChange(color);
                        onClose(); // 컬러 선택 시 드롭다운 자동으로 닫히도록 바인딩
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
