'use client';

import React, { useState } from 'react';
import { useLocation } from '@/components/providers/LocationProvider';

const CONTINENTS = ['GLOBAL', 'ASIA', 'EUROPE', 'AMERICAS', 'AFRICA', 'OCEANIA'];

const REGIONS = [
  {
    continent: 'ASIA',
    countries: [
      {
        name: 'KOREA',
        flag: '🇰🇷',
        cities: [
          { name: 'SEOUL', zones: ['CENTRAL', 'EAST', 'WEST', 'SOUTH', 'NORTH'] },
          { name: 'BUSAN' },
          { name: 'JEJU' },
        ]
      },
      { name: 'JAPAN', flag: '🇯🇵', cities: [{ name: 'TOKYO' }, { name: 'OSAKA' }] },
    ]
  },
  {
    continent: 'EUROPE',
    countries: [
      { name: 'HUNGARY', flag: '🇭🇺', cities: [{ name: 'BUDAPEST' }] },
      { name: 'UK', flag: '🇬🇧', cities: [{ name: 'LONDON' }] },
      { name: 'FRANCE', flag: '🇫🇷', cities: [{ name: 'PARIS' }] },
    ]
  }
];

export default function LocationSelector() {
  const { location, setLocation, isSelectorOpen, setIsSelectorOpen } = useLocation();
  const [activeTab, setActiveTab] = useState('GLOBAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(location.country);

  if (!isSelectorOpen) return null;

  const handleSelect = (country: string, city: string, zone?: string) => {
    setLocation({ country, city, zone });
    setIsSelectorOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsSelectorOpen(false)}
      ></div>

      {/* Selector Body */}
      <div className="relative w-full max-w-lg bg-surface sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out flex flex-col max-h-[90vh]">
        
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-headline text-2xl font-bold tracking-tight text-on-surface">SELECT LOCATION</h2>
            <button 
              onClick={() => setIsSelectorOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-on-surface/5 transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Search Bar - No Line Design */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-on-surface/40">search</span>
            </div>
            <input 
              type="text"
              placeholder="Search city or country"
              className="w-full h-12 pl-12 pr-4 bg-on-surface/[0.03] rounded-2xl border-none focus:ring-2 focus:ring-primary/20 focus:bg-on-surface/[0.05] transition-all font-body text-base outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Recent/Favorite Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['SEOUL', 'BUDAPEST', 'LONDON'].map((city) => (
              <button 
                key={city}
                onClick={() => handleSelect(city === 'SEOUL' ? 'KOREA' : (city === 'BUDAPEST' ? 'HUNGARY' : 'UK'), city)}
                className="px-4 py-2 bg-on-surface/[0.03] hover:bg-on-surface/[0.08] active:bg-primary/10 rounded-full text-xs font-bold tracking-wider text-on-surface/80 whitespace-nowrap transition-colors uppercase"
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation - No Line (Tonal Layering) */}
        <div className="px-6 flex gap-6 overflow-x-auto scrollbar-none bg-on-surface/[0.02]">
          {CONTINENTS.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pt-4 pb-3 text-[10px] font-bold tracking-[0.2em] transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-on-surface/40 hover:text-on-surface/60'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in duration-300"></div>
              )}
            </button>
          ))}
        </div>

        {/* Location List */}
        <div className="flex-1 overflow-y-auto p-4 no-scrollbar">
          {REGIONS.filter(r => activeTab === 'GLOBAL' || r.continent === activeTab).map((region) => (
            <div key={region.continent} className="mb-6 last:mb-0">
              {activeTab === 'GLOBAL' && (
                <h3 className="px-4 mb-2 text-[10px] font-bold tracking-[0.2em] text-on-surface/30 uppercase">{region.continent}</h3>
              )}
              <div className="space-y-1">
                {region.countries.map((country) => (
                  <div key={country.name} className="overflow-hidden rounded-2xl transition-all duration-300">
                    <button 
                      onClick={() => setExpandedCountry(expandedCountry === country.name ? null : country.name)}
                      className={`w-full flex items-center justify-between p-4 transition-colors ${
                        expandedCountry === country.name ? 'bg-on-surface/[0.03]' : 'hover:bg-on-surface/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{country.flag}</span>
                        <span className={`font-headline font-bold text-base tracking-tight ${
                          location.country === country.name ? 'text-primary' : 'text-on-surface'
                        }`}>
                          {country.name}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined transition-transform duration-300 ${
                        expandedCountry === country.name ? 'rotate-180 text-primary' : 'text-on-surface/40'
                      }`}>
                        expand_more
                      </span>
                    </button>
                    
                    {/* Cities Accordion */}
                    <div className={`transition-all duration-300 ease-in-out ${
                      expandedCountry === country.name ? 'max-h-[500px] opacity-100 py-3 bg-on-surface/[0.015]' : 'max-h-0 opacity-0 px-4'
                    }`}>
                      {country.cities.map((city) => (
                        <div key={city.name}>
                          <button 
                            onClick={() => !city.zones && handleSelect(country.name, city.name)}
                            className={`w-full text-left px-11 py-3 text-sm font-bold tracking-tight transition-colors ${
                              location.city === city.name && !city.zones 
                                ? 'text-primary' 
                                : 'text-on-surface/60 hover:text-on-surface'
                            }`}
                          >
                            {city.name}
                          </button>
                          
                          {/* Zones Section (if any, like Seoul) */}
                          {city.zones && (
                            <div className="grid grid-cols-2 gap-2 px-11 py-2">
                              {city.zones.map((zone) => (
                                <button 
                                  key={zone}
                                  onClick={() => handleSelect(country.name, city.name, zone)}
                                  className={`px-3 py-3 rounded-xl text-[10px] font-bold tracking-widest transition-all ${
                                    location.city === city.name && location.zone === zone
                                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                                      : 'bg-on-surface/[0.04] text-on-surface/40 hover:bg-on-surface/[0.08] hover:text-on-surface/60'
                                  }`}
                                >
                                  {zone}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-on-surface/[0.02] sm:rounded-b-3xl">
          <p className="text-[10px] text-center text-on-surface/40 font-medium tracking-widest uppercase">
            World of Community · Global Network
          </p>
        </div>
      </div>
    </div>
  );
}
