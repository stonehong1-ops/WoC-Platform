"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { searchService, SearchResultItem } from "@/services/searchService";
import Link from "next/link";

// Placeholder data for design
const TRENDING_TAGS = ["#TangoShoes", "#Milonga", "#BeginnerClass", "#BuenosAires", "#Festival"];

const MOCK_SHOP_ITEMS = [
  { id: "1", title: "Premium Tango Shoes", price: "₩ 150,000", image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=300&h=300&fit=crop" },
  { id: "2", title: "Milonga Dress Black", price: "₩ 89,000", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=300&h=300&fit=crop" },
  { id: "3", title: "Men's Practice Pants", price: "₩ 65,000", image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?q=80&w=300&h=300&fit=crop" },
];

const MOCK_CLASS_ITEMS = [
  { id: "1", title: "Tango Beginner 101", instructor: "Maestro Juan", date: "Every Tue, Thu", image: "https://images.unsplash.com/photo-1504609774528-694738500222?q=80&w=300&h=300&fit=crop" },
  { id: "2", title: "Advanced Musicality", instructor: "Maria & Jose", date: "Saturday Afternoons", image: "https://images.unsplash.com/photo-1533147670608-2a2f9775d3a4?q=80&w=300&h=300&fit=crop" },
];

const MOCK_EVENT_ITEMS = [
  { id: "1", title: "Seoul Tango Festival 2026", location: "Gangnam, Seoul", date: "Oct 15 - 18", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=300&h=300&fit=crop" },
  { id: "2", title: "Friday Grand Milonga", location: "Hongdae Club", date: "Next Friday", image: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&h=300&fit=crop" },
];

const MOCK_GROUP_ITEMS = [
  { id: "1", title: "Seoul 2030 Tango", members: 124, image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=300&h=300&fit=crop" },
  { id: "2", title: "Busan Milongueros", members: 89, image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=300&h=300&fit=crop" },
];

export default function SearchPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [initialData, setInitialData] = useState<{shops: SearchResultItem[], classes: SearchResultItem[], events: SearchResultItem[], groups: SearchResultItem[]}>({
    shops: [], classes: [], events: [], groups: []
  });

  useEffect(() => {
    const fetchInitial = async () => {
      const data = await searchService.getInitialData();
      setInitialData(data);
    };
    fetchInitial();
  }, []);

  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const results = await searchService.globalSearch(debouncedQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  return (
    <div className="max-w-md mx-auto w-full h-[calc(100vh-124px)] flex flex-col overflow-hidden bg-surface font-manrope">
      {/* Search Input Area */}
      <div className="px-4 pt-4 pb-4 bg-surface z-40 border-b border-on-surface/5 shrink-0">
        <div className={`flex items-center bg-surface rounded-2xl px-4 py-3 transition-all duration-300 ${isFocused ? 'ring-2 ring-primary shadow-lg shadow-primary/10' : 'border border-on-surface/10'}`}>
          <span className="material-symbols-outlined text-on-surface/40 mr-2 text-[22px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('search.placeholder')}
            className="flex-1 bg-transparent border-none outline-none text-[15px] text-on-surface placeholder:text-on-surface/30 font-bold"
            autoFocus
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="ml-2 w-6 h-6 rounded-full bg-on-surface/10 flex items-center justify-center hover:bg-on-surface/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px] text-on-surface/60">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {!debouncedQuery ? (
          <>
            <div className="px-4 mt-6 mb-8">
        <h2 className="text-[12px] font-black text-on-surface/40 mb-3 uppercase tracking-widest">{t('search.trendingNow')}</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {TRENDING_TAGS.map((tag) => (
            <button 
              key={tag}
              onClick={() => setSearchQuery(tag)}
              className="px-4 py-2 bg-primary/5 text-primary hover:bg-primary/10 font-bold text-[13px] rounded-full whitespace-nowrap active:scale-95 transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {/* Section 1: Shop */}
        <section>
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">storefront</span>
              {t('search.hotInShop')}
            </h2>
            <button className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
              {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-4">
            {initialData.shops.map((item) => (
              <Link href={item.url} key={item.id} className="min-w-[140px] flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform group">
                <div className="w-full aspect-square rounded-2xl overflow-hidden relative bg-on-surface/5 border border-on-surface/5 group-hover:shadow-md transition-shadow">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                      <span className="material-symbols-outlined text-[24px]">storefront</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-[14px] font-bold text-on-surface line-clamp-1">{item.title}</h3>
                  {item.subtitle && <p className="text-[13px] font-black text-primary mt-0.5">{item.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 2: Class */}
        <section>
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">school</span>
              {t('search.upcomingClasses')}
            </h2>
            <button className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
              {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-4">
            {initialData.classes.map((item) => (
              <Link href={item.url} key={item.id} className="min-w-[200px] flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform group">
                <div className="w-full aspect-video rounded-2xl overflow-hidden relative bg-on-surface/5 border border-on-surface/5 group-hover:shadow-md transition-shadow">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                      <span className="material-symbols-outlined text-[32px]">school</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-[15px] font-bold text-on-surface line-clamp-1">{item.title}</h3>
                  {item.subtitle && <p className="text-[13px] font-medium text-on-surface/60">{item.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 3: Event & Social */}
        <section>
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
              {t('search.eventsSocial')}
            </h2>
            <button className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
              {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="flex flex-col gap-3 px-4">
            {initialData.events.map((item) => (
              <Link href={item.url} key={item.id} className="flex gap-4 items-center bg-surface p-3 rounded-2xl active:scale-[0.98] transition-all hover:shadow-md border border-on-surface/5">
                <div className="w-[70px] h-[70px] rounded-xl overflow-hidden relative flex-shrink-0 bg-on-surface/5">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                      <span className="material-symbols-outlined text-[24px]">event</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col flex-1">
                  <h3 className="text-[15px] font-bold text-on-surface">{item.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {item.subtitle && <span className="text-[12px] font-medium text-on-surface/60">{item.subtitle}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section 4: Groups */}
        <section>
          <div className="flex items-center justify-between px-4 mb-4">
            <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
              <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
              {t('search.activeGroups')}
            </h2>
            <button className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
              {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-8">
            {initialData.groups.map((item) => (
              <Link href={item.url} key={item.id} className="min-w-[120px] flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform group">
                <div className="w-[80px] h-[80px] rounded-full overflow-hidden relative bg-on-surface/5 ring-2 ring-transparent group-hover:ring-primary/20 transition-all shadow-sm">
                  {item.image ? (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                      <span className="material-symbols-outlined text-[32px]">groups</span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-[14px] font-bold text-on-surface leading-tight mb-1">{item.title}</h3>
                  {item.subtitle && <p className="text-[12px] font-medium text-on-surface/50">{item.subtitle}</p>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
      </>
        ) : (
          <div className="px-4 mt-6">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-on-surface/40 font-bold text-[13px] tracking-widest uppercase">{t('search.searching') || 'Searching...'}</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-[64px] text-on-surface/10 mb-4">search_off</span>
                <p className="text-[16px] font-bold text-on-surface/60">{t('search.noResults') || 'No results found'}</p>
                <p className="text-[13px] font-medium text-on-surface/40 mt-1">Try different keywords</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-8">
                <h2 className="text-[14px] font-black text-on-surface/60 mb-2 tracking-tight">
                  Search Results for "{debouncedQuery}"
                </h2>
                {searchResults.map((item) => (
                  <Link href={item.url} key={`${item.type}-${item.id}`} className="flex gap-4 items-center bg-surface p-3 rounded-2xl active:scale-[0.98] transition-all hover:shadow-md border border-on-surface/5">
                    <div className="w-[60px] h-[60px] rounded-xl overflow-hidden relative flex-shrink-0 bg-on-surface/5">
                      {item.image ? (
                        <Image src={item.image} alt={item.title} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                          <span className="material-symbols-outlined text-[24px]">
                            {item.type === 'shop' ? 'storefront' : item.type === 'class' ? 'school' : item.type === 'event' ? 'event' : 'group'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          item.type === 'shop' ? 'bg-orange-100 text-orange-600' :
                          item.type === 'class' ? 'bg-blue-100 text-blue-600' :
                          item.type === 'event' ? 'bg-purple-100 text-purple-600' :
                          'bg-green-100 text-green-600'
                        }`}>
                          {item.type}
                        </span>
                      </div>
                      <h3 className="text-[15px] font-bold text-on-surface line-clamp-1">{item.title}</h3>
                      {item.subtitle && <p className="text-[12px] font-medium text-on-surface/60 mt-0.5">{item.subtitle}</p>}
                    </div>
                    <span className="material-symbols-outlined text-on-surface/20 text-[20px]">chevron_right</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
