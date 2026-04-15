'use client';

import React, { useState } from 'react';
import { useLocation } from '@/components/providers/LocationProvider';

const CONTINENTS = ['GLOBAL', 'ASIA & OCEANIA', 'EUROPE', 'MIDDLE EAST & EURASIA', 'AMERICAS', 'AFRICA'];

const REGIONS = [
  {
    continent: 'ASIA & OCEANIA',
    countries: [
      {
        name: 'SOUTH KOREA',
        flag: '🇰🇷',
        cities: ['SEOUL', 'INCHEON', 'BUSAN', 'JEJU', 'DAEGU', 'DAEJEON', 'GWANGJU'].map(n => ({ name: n }))
      },
      {
        name: 'JAPAN',
        flag: '🇯🇵',
        cities: ['TOKYO', 'OSAKA', 'KYOTO', 'FUKUOKA', 'SAPPORO', 'NAGOYA', 'YOKOHAMA'].map(n => ({ name: n }))
      },
      {
        name: 'CHINA',
        flag: '🇨🇳',
        cities: ['BEIJING', 'SHANGHAI', 'SHENZHEN', 'GUANGZHOU', 'CHENGDU', 'HANGZHOU', 'HONG KONG', 'MACAU'].map(n => ({ name: n }))
      },
      {
        name: 'INDIA',
        flag: '🇮🇳',
        cities: ['DELHI', 'MUMBAI', 'BANGALORE', 'RISHIKESH', 'CHENNAI', 'HYDERABAD'].map(n => ({ name: n }))
      },
      {
        name: 'VIETNAM',
        flag: '🇻🇳',
        cities: ['HO CHI MINH', 'HANOI', 'DA NANG', 'HAI PHONG', 'NHA TRANG'].map(n => ({ name: n }))
      },
      {
        name: 'THAILAND',
        flag: '🇹🇭',
        cities: ['BANGKOK', 'CHIANG MAI', 'PHUKET', 'PATTAYA', 'KOH SAMUI'].map(n => ({ name: n }))
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
  const { location, setLocation, isSelectorOpen, setIsSelectorOpen } = useLocation();
  const [activeTab, setActiveTab] = useState('GLOBAL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCountry, setExpandedCountry] = useState<string | null>(location.country);

  if (!isSelectorOpen) return null;

  const handleSelect = (country: string, city: string) => {
    setLocation({ country, city, zone: undefined });
    setIsSelectorOpen(false);
  };

  const filteredRegions = REGIONS.filter(r => 
    activeTab === 'GLOBAL' || r.continent === activeTab
  ).map(region => ({
    ...region,
    countries: region.countries.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cities.some(city => city.name.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(r => r.countries.length > 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={() => setIsSelectorOpen(false)}
      ></div>

      <div className="relative w-full max-w-lg bg-surface sm:rounded-3xl shadow-2xl animate-in slide-in-from-bottom-full duration-500 ease-out flex flex-col max-h-[90vh]">
        
        <div className="px-6 pt-8 pb-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <span className="font-label text-[9px] font-black text-on-surface/30 tracking-[0.25em] uppercase mb-1">Network</span>
              <h2 className="font-display text-[22px] font-black tracking-tight text-on-surface uppercase">Select Location</h2>
            </div>
            <button 
              onClick={() => setIsSelectorOpen(false)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-on-surface/[0.03] hover:bg-on-surface/[0.08] transition-all"
            >
              <span className="material-symbols-outlined text-[20px] text-on-surface/40">close</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-[20px] text-primary">search</span>
            </div>
            <input 
              type="text"
              placeholder="Search city or country..."
              className="w-full h-[56px] pl-14 pr-6 bg-on-surface/[0.03] rounded-3xl border-none focus:ring-1 focus:ring-primary/20 focus:bg-on-surface/[0.06] transition-all font-manrope text-[15px] font-medium text-on-surface placeholder:text-on-surface/30 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="px-6 flex gap-6 overflow-x-auto no-scrollbar bg-on-surface/[0.01] border-b border-outline-variant/10">
          {CONTINENTS.map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 pt-5 pb-4 text-[9px] font-black tracking-[0.2em] transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-on-surface/30 hover:text-on-surface/50'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {filteredRegions.map((region) => (
            <div key={region.continent}>
              <h3 className="px-4 mb-2 text-[10px] font-bold tracking-[0.2em] text-on-surface/30 uppercase">{region.continent}</h3>
              <div className="space-y-1">
                {region.countries.map((country) => (
                  <div key={country.name} className="overflow-hidden rounded-2xl group">
                    <button 
                      onClick={() => setExpandedCountry(expandedCountry === country.name ? null : country.name)}
                      className={`w-full flex items-center justify-between p-4 transition-all ${
                        expandedCountry === country.name ? 'bg-primary/5 text-primary' : 'hover:bg-on-surface/[0.02]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl grayscale group-hover:grayscale-0 transition-all">{country.flag}</span>
                        <span className="font-headline font-bold text-base tracking-tight uppercase text-left">
                          {country.name}
                        </span>
                      </div>
                      <span className={`material-symbols-outlined transition-transform duration-300 ${
                        expandedCountry === country.name ? 'rotate-180' : 'text-on-surface/40'
                      }`}>
                        expand_more
                      </span>
                    </button>
                    
                    <div className={`grid grid-cols-1 overflow-hidden transition-all duration-300 ${
                      expandedCountry === country.name ? 'max-h-[1000px] py-1 bg-on-surface/[0.015]' : 'max-h-0'
                    }`}>
                      {/* Master (ALL) Selection */}
                      <button 
                        onClick={() => handleSelect(country.name, 'ALL')}
                        className={`w-full text-left px-13 py-3.5 text-[10px] font-black tracking-[0.2em] uppercase transition-all ${
                          location.city === 'ALL' && location.country === country.name
                            ? 'text-primary bg-primary/10' 
                            : 'text-primary/70 hover:text-primary hover:bg-primary/5'
                        }`}
                      >
                        (ALL)
                      </button>

                      {country.cities.map((city) => (
                        <button 
                          key={city.name}
                          onClick={() => handleSelect(country.name, city.name)}
                          className={`w-full text-left px-13 py-3.5 text-[11px] font-bold tracking-widest uppercase transition-all ${
                            location.city === city.name && location.country === country.name
                              ? 'text-primary bg-primary/5' 
                              : 'text-on-surface/40 hover:text-on-surface hover:bg-on-surface/[0.02]'
                          }`}
                        >
                          {city.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-on-surface/[0.02] border-t border-outline-variant/10">
          <p className="text-[10px] text-center text-on-surface/40 font-medium tracking-widest uppercase">
            World of Community · Global Network
          </p>
        </div>
      </div>
    </div>
  );
}
