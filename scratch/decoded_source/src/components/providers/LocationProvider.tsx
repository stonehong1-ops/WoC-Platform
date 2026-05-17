'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type SelectedLocation = {
  country: string;
  city: string;
  zone?: string;
};

type LocationCallback = ((country: string, city: string) => void) | null;

interface LocationContextType {
  location: SelectedLocation;
  setLocation: (location: SelectedLocation) => void;
  isSelectorOpen: boolean;
  setIsSelectorOpen: (open: boolean) => void;
  toggleSelector: () => void;
  // 콜백 모드: 등록폼 등에서 사용. 전역 location 변경 없이 콜백만 호출
  openSelectorWithCallback: (cb: (country: string, city: string) => void) => void;
  selectorCallback: LocationCallback;
  clearSelectorCallback: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<SelectedLocation>({
    country: 'KOREA',
    city: 'SEOUL',
    zone: 'CENTRAL',
  });
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [selectorCallback, setSelectorCallback] = useState<LocationCallback>(null);

  // Load from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('woc_selected_location');
    if (saved) {
      try {
        setLocationState(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved location', e);
      }
    }
  }, []);

  const setLocation = (newLocation: SelectedLocation) => {
    setLocationState(newLocation);
    localStorage.setItem('woc_selected_location', JSON.stringify(newLocation));
  };

  const toggleSelector = () => setIsSelectorOpen(!isSelectorOpen);

  // 콜백 모드로 selector 열기 (전역 location 변경 없음)
  const openSelectorWithCallback = useCallback((cb: (country: string, city: string) => void) => {
    setSelectorCallback(() => cb);
    setIsSelectorOpen(true);
  }, []);

  const clearSelectorCallback = useCallback(() => {
    setSelectorCallback(null);
  }, []);

  return (
    <LocationContext.Provider 
      value={{ 
        location, 
        setLocation, 
        isSelectorOpen, 
        setIsSelectorOpen, 
        toggleSelector,
        openSelectorWithCallback,
        selectorCallback,
        clearSelectorCallback,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
