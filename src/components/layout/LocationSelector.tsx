'use client';

import React, { useState } from 'react';
import { useLocation } from '@/components/providers/LocationProvider';
import { useLanguage } from '@/contexts/LanguageContext';


export const REGIONS = [
  {
    continent: 'ASIA & OCEANIA',
    countries: [
      {
        name: 'KOREA',
        flag: '🇰🇷',
        cities: ['SEOUL', 'INCHEON', 'BUSAN', 'JEJU', 'DAEGU', 'DAEJEON', 'GWANGJU'].map(n => ({ name: n }))
      },
      {
        name: 'CHINA',
        flag: '🇨🇳',
        cities: ['BEIJING', 'SHANGHAI', 'SHENZHEN', 'GUANGZHOU', 'CHENGDU', 'HANGZHOU', 'HONG KONG', 'MACAU'].map(n => ({ name: n }))
      },
      {
        name: 'JAPAN',
        flag: '🇯🇵',
        cities: ['TOKYO', 'OSAKA', 'KYOTO', 'FUKUOKA', 'SAPPORO', 'NAGOYA', 'YOKOHAMA'].map(n => ({ name: n }))
      },
      {
        name: 'TAIWAN',
        flag: '🇹🇼',
        cities: ['TAIPEI', 'KAOHSIUNG', 'TAICHUNG', 'TAINAN', 'HSINCHU'].map(n => ({ name: n }))
      },
      {
        name: 'SINGAPORE',
        flag: '🇸🇬',
        cities: ['CENTRAL AREA', 'NORTH', 'NORTH-EAST', 'EAST', 'WEST'].map(n => ({ name: n }))
      },
      {
        name: 'VIETNAM',
        flag: '🇻🇳',
        cities: ['HO CHI MINH', 'HANOI', 'DA NANG', 'HAI PHONG', 'NHA TRANG'].map(n => ({ name: n }))
      },
      {
        name: 'INDIA',
        flag: '🇮🇳',
        cities: ['DELHI', 'MUMBAI', 'BANGALORE', 'RISHIKESH', 'CHENNAI', 'HYDERABAD'].map(n => ({ name: n }))
      },
      {
        name: 'THAILAND',
        flag: '🇹🇭',
        cities: ['BANGKOK', 'CHIANG MAI', 'PHUKET', 'PATTAYA', 'KOH SAMUI'].map(n => ({ name: n }))
      },
      {
        name: 'INDONESIA',
        flag: '🇮🇩',
        cities: ['JAKARTA', 'BALI', 'SURABAYA', 'BANDUNG', 'MEDAN'].map(n => ({ name: n }))
      },
      {
        name: 'PHILIPPINES',
        flag: '🇵🇭',
        cities: ['MANILA', 'CEBU', 'DAVAO', 'ANGELES'].map(n => ({ name: n }))
      },
      {
        name: 'MALAYSIA',
        flag: '🇲🇾',
        cities: ['KUALA LUMPUR', 'PENANG', 'JOHOR BAHRU', 'KOTA KINABALU'].map(n => ({ name: n }))
      },
      {
        name: 'AUSTRALIA',
        flag: '🇦🇺',
        cities: ['SYDNEY', 'MELBOURNE', 'BRISBANE', 'PERTH', 'ADELAIDE'].map(n => ({ name: n }))
      },
      {
        name: 'NEW ZEALAND',
        flag: '🇳🇿',
        cities: ['AUCKLAND', 'WELLINGTON', 'CHRISTCHURCH'].map(n => ({ name: n }))
      },
      {
        name: 'PAKISTAN',
        flag: '🇵🇰',
        cities: ['KARACHI', 'LAHORE', 'ISLAMABAD'].map(n => ({ name: n }))
      },
      {
        name: 'BANGLADESH',
        flag: '🇧🇩',
        cities: ['DHAKA', 'CHITTAGONG'].map(n => ({ name: n }))
      }
    ]
  },
  {
    continent: 'EUROPE',
    countries: [
      {
        name: 'UNITED KINGDOM',
        flag: '🇬🇧',
        cities: ['LONDON', 'MANCHESTER', 'EDINBURGH', 'BIRMINGHAM', 'LIVERPOOL'].map(n => ({ name: n }))
      },
      {
        name: 'FRANCE',
        flag: '🇫🇷',
        cities: ['PARIS', 'LYON', 'MARSEILLE', 'NICE', 'BORDEAUX', 'TOULOUSE'].map(n => ({ name: n }))
      },
      {
        name: 'GERMANY',
        flag: '🇩🇪',
        cities: ['BERLIN', 'MUNICH', 'FRANKFURT', 'HAMBURG', 'COLOGNE', 'STUTTGART'].map(n => ({ name: n }))
      },
      {
        name: 'ITALY',
        flag: '🇮🇹',
        cities: ['ROME', 'MILAN', 'FLORENCE', 'VENICE', 'NAPLES', 'TURIN'].map(n => ({ name: n }))
      },
      {
        name: 'SPAIN',
        flag: '🇪🇸',
        cities: ['MADRID', 'BARCELONA', 'VALENCIA', 'SEVILLE', 'IBIZA', 'MALAGA'].map(n => ({ name: n }))
      },
      {
        name: 'NETHERLANDS',
        flag: '🇳🇱',
        cities: ['AMSTERDAM', 'ROTTERDAM', 'THE HAGUE', 'UTRECHT'].map(n => ({ name: n }))
      },
      {
        name: 'SWITZERLAND',
        flag: '🇨🇭',
        cities: ['ZURICH', 'GENEVA', 'BASEL', 'LAUSANNE'].map(n => ({ name: n }))
      },
      {
        name: 'POLAND',
        flag: '🇵🇱',
        cities: ['WARSAW', 'KRAKOW', 'WROCLAW', 'GDANSK'].map(n => ({ name: n }))
      },
      {
        name: 'SWEDEN',
        flag: '🇸🇪',
        cities: ['STOCKHOLM', 'GOTHENBURG', 'MALMÖ'].map(n => ({ name: n }))
      },
      {
        name: 'BELGIUM',
        flag: '🇧🇪',
        cities: ['BRUSSELS', 'ANTWERP', 'GHENT'].map(n => ({ name: n }))
      },
      {
        name: 'AUSTRIA',
        flag: '🇦🇹',
        cities: ['VIENNA', 'SALZBURG', 'INNSBRUCK'].map(n => ({ name: n }))
      },
      {
        name: 'NORWAY',
        flag: '🇳🇴',
        cities: ['OSLO', 'BERGEN', 'STAVANGER'].map(n => ({ name: n }))
      },
      {
        name: 'DENMARK',
        flag: '🇩🇰',
        cities: ['COPENHAGEN', 'AARHUS', 'ODENSE'].map(n => ({ name: n }))
      },
      {
        name: 'FINLAND',
        flag: '🇫🇮',
        cities: ['HELSINKI', 'TAMPERE', 'TURKU'].map(n => ({ name: n }))
      },
      {
        name: 'GREECE',
        flag: '🇬🇷',
        cities: ['ATHENS', 'THESSALONIKI', 'PATRAS'].map(n => ({ name: n }))
      },
      {
        name: 'PORTUGAL',
        flag: '🇵🇹',
        cities: ['LISBON', 'PORTO', 'FARO'].map(n => ({ name: n }))
      },
      {
        name: 'CZECH REPUBLIC',
        flag: '🇨🇿',
        cities: ['PRAGUE', 'BRNO', 'OSTRAVA'].map(n => ({ name: n }))
      },
      {
        name: 'HUNGARY',
        flag: '🇭🇺',
        cities: ['BUDAPEST', 'DEBRECEN', 'SZEGED'].map(n => ({ name: n }))
      },
      {
        name: 'IRELAND',
        flag: '🇮🇪',
        cities: ['DUBLIN', 'CORK', 'LIMERICK'].map(n => ({ name: n }))
      },
      {
        name: 'ROMANIA',
        flag: '🇷🇴',
        cities: ['BUCHAREST', 'CLUJ-NAPOCA', 'TIMISOARA'].map(n => ({ name: n }))
      }
    ]
  },
  {
    continent: 'MIDDLE EAST & EURASIA',
    countries: [
      {
        name: 'TÜRKİYE',
        flag: '🇹🇷',
        cities: ['ISTANBUL', 'ANKARA', 'ANTALYA', 'IZMIR', 'BURSA'].map(n => ({ name: n }))
      },
      {
        name: 'SAUDI ARABIA',
        flag: '🇸🇦',
        cities: ['RIYADH', 'JEDDAH', 'DAMMAM', 'MECCA', 'MEDINA'].map(n => ({ name: n }))
      },
      {
        name: 'UAE',
        flag: '🇦🇪',
        cities: ['DUBAI', 'ABU DHABI', 'SHARJAH'].map(n => ({ name: n }))
      },
      {
        name: 'ISRAEL',
        flag: '🇮🇱',
        cities: ['TEL AVIV', 'JERUSALEM', 'HAIFA'].map(n => ({ name: n }))
      },
      {
        name: 'IRAN',
        flag: '🇮🇷',
        cities: ['TEHRAN', 'ISFAHAN', 'SHIRAZ'].map(n => ({ name: n }))
      }
    ]
  },
  {
    continent: 'AMERICAS',
    countries: [
      {
        name: 'USA',
        flag: '🇺🇸',
        cities: ['NEW YORK', 'LOS ANGELES', 'SAN FRANCISCO', 'CHICAGO', 'MIAMI', 'HOUSTON', 'SEATTLE', 'WASHINGTON'].map(n => ({ name: n }))
      },
      {
        name: 'CANADA',
        flag: '🇨🇦',
        cities: ['TORONTO', 'VANCOUVER', 'MONTREAL', 'CALGARY', 'OTTAWA'].map(n => ({ name: n }))
      },
      {
        name: 'BRAZIL',
        flag: '🇧🇷',
        cities: ['SAO PAULO', 'RIO DE JANEIRO', 'BRASILIA', 'CURITIBA', 'BELO HORIZONTE'].map(n => ({ name: n }))
      },
      {
        name: 'MEXICO',
        flag: '🇲🇽',
        cities: ['MEXICO', 'CANCUN', 'GUADALAJARA', 'MONTERREY', 'TIJUANA'].map(n => ({ name: n }))
      },
      {
        name: 'ARGENTINA',
        flag: '🇦🇷',
        cities: ['BUENOS AIRES', 'CORDOBA', 'ROSARIO', 'MENDOZA'].map(n => ({ name: n }))
      },
      {
        name: 'COLOMBIA',
        flag: '🇨🇴',
        cities: ['BOGOTA', 'MEDELLIN', 'CALI'].map(n => ({ name: n }))
      },
      {
        name: 'CHILE',
        flag: '🇨🇱',
        cities: ['SANTIAGO', 'VALPARAISO', 'CONCEPCION'].map(n => ({ name: n }))
      },
      {
        name: 'PERU',
        flag: '🇵🇪',
        cities: ['LIMA', 'CUSCO', 'AREQUIPA'].map(n => ({ name: n }))
      }
    ]
  },
  {
    continent: 'AFRICA',
    countries: [
      {
        name: 'NIGERIA',
        flag: '🇳🇬',
        cities: ['LAGOS', 'ABUJA', 'KANO'].map(n => ({ name: n }))
      },
      {
        name: 'SOUTH AFRICA',
        flag: '🇿🇦',
        cities: ['CAPE TOWN', 'JOHANNESBURG', 'DURBAN', 'PRETORIA'].map(n => ({ name: n }))
      },
      {
        name: 'EGYPT',
        flag: '🇪🇬',
        cities: ['CAIRO', 'ALEXANDRIA', 'GIZA'].map(n => ({ name: n }))
      }
    ]
  }
];

export default function LocationSelector() {
  const { location, setLocation, isSelectorOpen, setIsSelectorOpen, selectorCallback, clearSelectorCallback } = useLocation();
  const { t, language, dictionaryState } = useLanguage();
  const [expandedCountry, setExpandedCountry] = useState<string | null>(location.country);

  const handleClose = () => setIsSelectorOpen(false); // Replaced useHistoryBack

  if (!isSelectorOpen) return null;

  const handleSelect = (country: string, city: string) => {
    if (selectorCallback) {
      // 콜백 모드: 전역 location 변경 없이 콜백만 호출
      selectorCallback(country, city);
      clearSelectorCallback();
    } else {
      // 기본 모드: 전역 location 변경
      setLocation({ country, city, zone: undefined });
    }
    handleClose();
  };

  const filteredRegions = REGIONS;

  const getLocalizedText = (key: string, defaultValue: string) => {
    const hasKey = dictionaryState?.[key] !== undefined;
    if (hasKey) {
      return t(key);
    }
    return defaultValue;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
      <div 
        className="absolute inset-0 bg-transparent transition-opacity duration-300 pointer-events-auto"
        onClick={handleClose}
      ></div>

      <div className="relative w-full max-w-lg bg-surface rounded-t-3xl shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-300 ease-out flex flex-col h-[70vh] pointer-events-auto border-t border-outline-variant/20">
        
        {/* Bottom Sheet Handle */}
        <div className="w-full pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1.5 bg-on-surface/20 rounded-full"></div>
        </div>

        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[14px] font-black tracking-[0.1em] text-on-surface uppercase mb-1">{t('location-selector.title')}</h2>
            <p className="text-[10px] font-bold text-on-surface/40 leading-tight whitespace-pre-line">
              {t('location-selector.desc')}
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-on-surface/[0.04] hover:bg-on-surface/[0.08] transition-all"
          >
            <span className="material-symbols-outlined text-[20px] text-on-surface/50">close</span>
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden border-t border-outline-variant/5">
          {/* Left Pane: Countries */}
          <div className="w-[140px] border-r border-outline-variant/10 overflow-y-auto no-scrollbar bg-[#F8F9FA]">
            {/* GLOBAL Selection */}
            <div className="py-2 border-b border-outline-variant/5">
              <button 
                onClick={() => handleSelect('GLOBAL', 'ALL')}
                className={`w-full flex flex-col items-start gap-1 px-4 py-4 transition-all relative ${
                  location.country === 'GLOBAL'
                    ? 'bg-surface text-primary' 
                    : 'text-on-surface/60 hover:bg-on-surface/[0.02]'
                }`}
              >
                <span className="material-symbols-rounded text-[20px]">public</span>
                <span className="font-headline font-black text-[10px] tracking-tighter uppercase text-left leading-none whitespace-pre-line">
                  {t('location-selector.all_tango')}
                </span>
                {location.country === 'GLOBAL' && (
                  <div className="absolute right-0 top-2 bottom-2 w-1 bg-primary rounded-l-full"></div>
                )}
              </button>
            </div>

            {filteredRegions.map((region) => (
              <div key={region.continent} className="py-2">
                <h3 className="px-4 py-2 text-[9px] font-black tracking-[0.1em] text-on-surface/30 uppercase border-b border-outline-variant/5 mb-1">{getLocalizedText('region.continent.' + region.continent, region.continent)}</h3>
                {region.countries.map((country) => (
                  <button 
                    key={country.name}
                    onClick={() => setExpandedCountry(country.name)}
                    className={`w-full flex items-center gap-3 px-4 py-4 transition-all relative ${
                      expandedCountry === country.name 
                        ? 'bg-surface text-primary' 
                        : 'text-on-surface/60 hover:bg-on-surface/[0.02]'
                    }`}
                  >
                    <span className={`text-lg transition-all ${expandedCountry === country.name ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                      {country.flag}
                    </span>
                    <span className="font-headline font-bold text-[11px] tracking-tight uppercase text-left break-words">
                      {getLocalizedText('region.country.' + country.name, country.name)}
                    </span>
                    {expandedCountry === country.name && (
                      <div className="absolute right-0 top-2 bottom-2 w-1 bg-primary rounded-l-full"></div>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Right Pane: Cities */}
          <div className="flex-1 overflow-y-auto p-2 no-scrollbar bg-white">
            {expandedCountry ? (
              <div className="space-y-1">
                {/* Master (ALL) Selection */}
                <button 
                  onClick={() => handleSelect(expandedCountry, 'ALL')}
                  className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black tracking-[0.2em] uppercase transition-all ${
                    location.city === 'ALL' && location.country === expandedCountry
                      ? 'text-primary bg-primary/10' 
                      : 'text-primary hover:bg-primary/5'
                  }`}
                >
                  ({t('location-selector.all')}) {getLocalizedText('region.country.' + expandedCountry, expandedCountry)}
                </button>

                {REGIONS.flatMap(r => r.countries)
                  .find(c => c.name === expandedCountry)
                  ?.cities.map((city) => (
                    <button 
                      key={city.name}
                      onClick={() => handleSelect(expandedCountry, city.name)}
                      className={`w-full text-left px-5 py-4 rounded-2xl text-[13px] font-bold tracking-tight uppercase transition-all ${
                        location.city === city.name && location.country === expandedCountry
                          ? 'text-primary bg-primary/5' 
                          : 'text-on-surface/70 hover:text-on-surface hover:bg-on-surface/[0.03]'
                      }`}
                    >
                      {getLocalizedText('region.city.' + city.name, city.name)}
                    </button>
                  ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-20 px-8 text-center">
                <span className="material-symbols-outlined text-[48px] mb-4">location_on</span>
                <p className="text-[12px] font-bold tracking-widest uppercase whitespace-pre-line">{t('location-selector.select_country')}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
