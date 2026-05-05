'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

interface NavigationContextType {
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  isNotiTrayOpen: boolean;
  openNotiTray: () => void;
  closeNotiTray: () => void;
  isHeaderShrink: boolean;
  setHeaderShrink: (shrink: boolean) => void;
  subHeader: React.ReactNode | null;
  setSubHeader: (content: React.ReactNode | null, height?: number) => void;
  subHeaderHeight: number;
  isHeaderVisible: boolean;
  setIsHeaderVisible: (visible: boolean) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotiTrayOpen, setIsNotiTrayOpen] = useState(false);
  const [isHeaderShrink, setIsHeaderShrink] = useState(false);
  const [subHeader, setSubHeaderState] = useState<React.ReactNode | null>(null);
  const [subHeaderHeight, setSubHeaderHeight] = useState<number>(0);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);
  
  const openNotiTray = useCallback(() => setIsNotiTrayOpen(true), []);
  const closeNotiTray = useCallback(() => setIsNotiTrayOpen(false), []);
  
  const setHeaderShrink = useCallback((shrink: boolean) => setIsHeaderShrink(shrink), []);

  const setSubHeader = useCallback((content: React.ReactNode | null, height?: number) => {
    setSubHeaderState(content);
    if (height !== undefined) {
      setSubHeaderHeight(height);
    } else if (content) {
      setSubHeaderHeight(84); // Default estimated height
    } else {
      setSubHeaderHeight(0);
    }
  }, []);

  const value = useMemo(() => ({
    isDrawerOpen, 
    openDrawer, 
    closeDrawer, 
    toggleDrawer,
    isNotiTrayOpen,
    openNotiTray,
    closeNotiTray,
    isHeaderShrink,
    setHeaderShrink,
    subHeader,
    setSubHeader,
    subHeaderHeight,
    isHeaderVisible,
    setIsHeaderVisible
  }), [
    isDrawerOpen, openDrawer, closeDrawer, toggleDrawer,
    isNotiTrayOpen, openNotiTray, closeNotiTray,
    isHeaderShrink, setHeaderShrink,
    subHeader, setSubHeader, subHeaderHeight,
    isHeaderVisible, setIsHeaderVisible
  ]);

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
