'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type SelectedLocation = {
  country: string;
  city: string;
  zone?: string;
};

interface LocationContextType {
  location: SelectedLocation;
  setLocation: (location: SelectedLocation) => void;
  isSelectorOpen: boolean;
  setIsSelectorOpen: (open: boolean) => void;
  toggleSelector: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocationState] = useState<SelectedLocation>({
    country: 'KOREA',
    city: 'SEOUL',
    zone: 'CENTRAL',
  });
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

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

  return (
    <LocationContext.Provider 
      value={{ 
        location, 
        setLocation, 
        isSelectorOpen, 
        setIsSelectorOpen, 
        toggleSelector 
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
