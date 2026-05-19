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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="more-dropdown-wrapper"
          className="absolute right-0 top-full"
          style={{ zIndex: 100 }}
        >
          <div
            className="fixed inset-0 z-[4]"
            onClick={onClose}
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
                <div className="menu-title">Menu</div>
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

            {/* 관리자 메뉴 */}
            {isAdmin && adminItems.length > 0 && (
              <>
                <div className="divider" />
                <div className="menu-title">Admin</div>
                {adminItems.map(item => (
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
                <div className="menu-title">Theme Palette</div>
                <div className="palette-row">
                  {paletteColors.map(color => (
                    <button
                      key={color}
                      className={`palette-color ${currentColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color } as any}
                      onClick={() => onColorChange(color)}
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
