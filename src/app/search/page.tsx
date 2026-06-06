"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { searchService, SearchResultItem } from "@/services/searchService";
import Link from "next/link";
import { formatInstructorNames } from "@/app/social/constants/seoulRegions";

const getDisplayTitleAndSubtitle = (item: SearchResultItem, language: string) => {
  let displayTitle = item.title;
  let displaySubtitle = item.subtitle || '';

  if (item.type === 'social') {
    displayTitle = language === 'KR' 
      ? (item.titleKo || item.title) 
      : (item.title || item.titleKo || 'Unknown');
      
    const venue = language === 'KR'
      ? (item.venueNameNative || item.venueName || '')
      : (item.venueName || item.venueNameNative || '');
    
    const dj = item.djName ? formatInstructorNames(item.djName, language) : '';
    const org = language === 'KR'
      ? (item.organizerNameNative || item.organizerName || '')
      : (item.organizerName || item.organizerNameNative || '');
      
    const djOrOrg = dj ? `DJ ${dj}` : (org ? (language === 'KR' ? `주최 ${org}` : `by ${org}`) : '');
    
    const parts = [venue, djOrOrg, item.startTime].filter(Boolean);
    displaySubtitle = parts.join(' · ');

  } else if (item.type === 'venue') {
    displayTitle = language === 'KR'
      ? (item.titleKo || item.title)
      : (item.title || item.titleKo || 'Unknown');
    displaySubtitle = item.subtitle || '';
    
  } else if (item.type === 'person') {
    displayTitle = language === 'KR'
      ? (item.titleKo || item.title)
      : (item.title || item.titleKo || 'Unknown');
    displaySubtitle = item.subtitle || '';
    
  } else if (item.type === 'group') {
    displayTitle = language === 'KR'
      ? (item.titleKo || item.title)
      : (item.title || item.titleKo || 'Unknown');
    displaySubtitle = language === 'KR'
      ? (item.subtitleKo || item.subtitle || '')
      : (item.subtitle || item.subtitleKo || '');
      
  } else if (item.type === 'event') {
    displayTitle = language === 'KR'
      ? (item.titleKo || item.title)
      : (item.title || item.titleKo || 'Unknown');
    displaySubtitle = item.subtitle || '';
  }

  return { title: displayTitle, subtitle: displaySubtitle };
};

// Placeholder data for design
const TRENDING_TAGS = ["#TangoShoes", "#Milonga", "#BeginnerClass", "#BuenosAires", "#Festival"];

export default function SearchPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  
  // Restore initial trending data from sessionStorage
  const [initialData, setInitialData] = useState<{shops: SearchResultItem[], socials: SearchResultItem[], events: SearchResultItem[], groups: SearchResultItem[], people: SearchResultItem[]}>(() => {
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('woc_search_initial');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached search initial data:', e);
        }
      }
    }
    return { shops: [], socials: [], events: [], groups: [], people: [] };
  });

  // Restore recent searches from localStorage
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('woc_recent_searches');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {
          console.error('Failed to parse cached recent searches:', e);
        }
      }
    }
    return [];
  });

  const addRecentSearch = (query: string) => {
    if (!query || !query.trim()) return;
    const cleanQuery = query.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(q => q !== cleanQuery);
      const next = [cleanQuery, ...filtered].slice(0, 5);
      if (typeof window !== 'undefined') {
        localStorage.setItem('woc_recent_searches', JSON.stringify(next));
      }
      return next;
    });
  };

  const removeRecentSearch = (query: string) => {
    setRecentSearches(prev => {
      const next = prev.filter(q => q !== query);
      if (typeof window !== 'undefined') {
        localStorage.setItem('woc_recent_searches', JSON.stringify(next));
      }
      return next;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('woc_recent_searches');
    }
  };

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const data = await searchService.getInitialData();
        setInitialData(data);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('woc_search_initial', JSON.stringify(data));
        }
      } catch (error) {
        console.error("Failed to fetch search initial data:", error);
      }
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
            className="flex-1 bg-transparent border-none outline-none text-[12px] text-on-surface placeholder:text-on-surface/30 font-bold"
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
            {/* Recent Searches Section */}
            {recentSearches.length > 0 && (
              <div className="px-4 mt-6 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[12px] font-black text-on-surface/40 uppercase tracking-widest">{t('search.recentSearches', 'Recent Searches')}</h2>
                  <button 
                    onClick={clearAllRecentSearches}
                    className="text-[11px] font-extrabold text-primary hover:underline active:scale-95 transition-transform"
                  >
                    {t('search.clearAll', 'Clear All')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((tag) => (
                    <div 
                      key={tag}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-on-surface/5 hover:bg-on-surface/10 rounded-full transition-all group"
                    >
                      <button 
                        onClick={() => {
                          setSearchQuery(tag);
                          addRecentSearch(tag);
                        }}
                        className="text-[13px] font-semibold text-on-surface hover:text-primary transition-colors"
                      >
                        {tag}
                      </button>
                      <button 
                        onClick={() => removeRecentSearch(tag)}
                        className="w-4 h-4 rounded-full bg-on-surface/10 flex items-center justify-center text-on-surface/60 hover:bg-on-surface/20 active:scale-90 transition-all"
                      >
                        <span className="material-symbols-outlined text-[10px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="px-4 mt-6 mb-8">
              <h2 className="text-[12px] font-black text-on-surface/40 mb-3 uppercase tracking-widest">{t('search.trendingNow')}</h2>
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {TRENDING_TAGS.map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      addRecentSearch(tag);
                    }}
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
                  <Link href="/shop" className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
                    {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
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

              {/* Section 2: Social (밀롱가·쁘락티카) */}
              <section>
                <div className="flex items-center justify-between px-4 mb-4">
                  <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">nightlife</span>
                    {t('search.hotSocials')}
                  </h2>
                  <Link href="/social" className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
                    {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-4">
                  {initialData.socials.map((item) => {
                    const { title, subtitle } = getDisplayTitleAndSubtitle(item, language);
                    return (
                      <Link href={item.url} key={item.id} className="min-w-[200px] flex flex-col gap-2 cursor-pointer active:scale-95 transition-transform group">
                        <div className="w-full aspect-video rounded-2xl overflow-hidden relative bg-on-surface/5 border border-on-surface/5 group-hover:shadow-md transition-shadow">
                          {item.image ? (
                            <Image src={item.image} alt={title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                              <span className="material-symbols-outlined text-[32px]">nightlife</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-[15px] font-bold text-on-surface line-clamp-1">{title}</h3>
                          {subtitle && <p className="text-[13px] font-medium text-on-surface/60">{subtitle}</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Section 3: Event & Social */}
              <section>
                <div className="flex items-center justify-between px-4 mb-4">
                  <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">calendar_today</span>
                    {t('search.eventsSocial')}
                  </h2>
                  <Link href="/events" className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
                    {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </div>
                <div className="flex flex-col gap-3 px-4">
                  {initialData.events.map((item) => {
                    const { title, subtitle } = getDisplayTitleAndSubtitle(item, language);
                    return (
                      <Link href={item.url} key={item.id} className="flex gap-4 items-center bg-surface p-3 rounded-2xl active:scale-[0.98] transition-all hover:shadow-md border border-on-surface/5">
                        <div className="w-[70px] h-[70px] rounded-xl overflow-hidden relative flex-shrink-0 bg-on-surface/5">
                          {item.image ? (
                            <Image src={item.image} alt={title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                              <span className="material-symbols-outlined text-[24px]">event</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col flex-1">
                          <h3 className="text-[15px] font-bold text-on-surface">{title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {subtitle && <span className="text-[12px] font-medium text-on-surface/60">{subtitle}</span>}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Section 4: Groups */}
              <section>
                <div className="flex items-center justify-between px-4 mb-4">
                  <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">groups</span>
                    {t('search.activeGroups')}
                  </h2>
                  <Link href="/groups" className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
                    {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-8">
                  {initialData.groups.map((item) => {
                    const { title, subtitle } = getDisplayTitleAndSubtitle(item, language);
                    return (
                      <Link href={item.url} key={item.id} className="min-w-[120px] flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform group">
                        <div className="w-[80px] h-[80px] rounded-full overflow-hidden relative bg-on-surface/5 ring-2 ring-transparent group-hover:ring-primary/20 transition-all shadow-sm">
                          {item.image ? (
                            <Image src={item.image} alt={title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                              <span className="material-symbols-outlined text-[32px]">groups</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="text-[14px] font-bold text-on-surface leading-tight mb-1">{title}</h3>
                          {subtitle && <p className="text-[12px] font-medium text-on-surface/50">{subtitle}</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>

              {/* Section 5: People */}
              <section>
                <div className="flex items-center justify-between px-4 mb-4">
                  <h2 className="text-[18px] font-black text-on-surface tracking-tight flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                    {t('search.activePeople')}
                  </h2>
                  <Link href="/people" className="text-[13px] font-bold text-on-surface/50 flex items-center hover:text-primary transition-colors">
                    {t('search.viewAll')} <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </div>
                <div className="flex gap-4 overflow-x-auto px-4 no-scrollbar pb-8">
                  {initialData.people && initialData.people.map((item) => {
                    const { title, subtitle } = getDisplayTitleAndSubtitle(item, language);
                    return (
                      <Link href={item.url} key={item.id} className="min-w-[120px] flex flex-col items-center gap-3 cursor-pointer active:scale-95 transition-transform group">
                        <div className="w-[80px] h-[80px] rounded-full overflow-hidden relative bg-on-surface/5 ring-2 ring-transparent group-hover:ring-primary/20 transition-all shadow-sm">
                          {item.image ? (
                            <Image src={item.image} alt={title} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                              <span className="material-symbols-outlined text-[32px]">person</span>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          <h3 className="text-[14px] font-bold text-on-surface leading-tight mb-1">{title}</h3>
                          {subtitle && <p className="text-[12px] font-medium text-on-surface/50 truncate max-w-[110px]">{subtitle}</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        ) : (
          <div className="px-4 mt-6">
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                <p className="text-on-surface/40 font-bold text-[13px] tracking-widest uppercase">{t('search.searching')}</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="material-symbols-outlined text-[64px] text-on-surface/10 mb-4">search_off</span>
                <p className="text-[16px] font-bold text-on-surface/60">{t('search.noResults')}</p>
                <p className="text-[13px] font-medium text-on-surface/40 mt-1">{t('search.tryDifferent')}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 pb-8">
                <h2 className="text-[14px] font-black text-on-surface/60 mb-2 tracking-tight">
                  {t('search.resultsFor', { query: debouncedQuery })}
                </h2>
                {searchResults.map((item) => {
                  const { title, subtitle } = getDisplayTitleAndSubtitle(item, language);
                  return (
                    <Link 
                      href={item.url} 
                      key={`${item.type}-${item.id}`} 
                      onClick={() => addRecentSearch(debouncedQuery)}
                      className="flex gap-4 items-center bg-surface p-3 rounded-2xl active:scale-[0.98] transition-all hover:shadow-md border border-on-surface/5"
                    >
                      <div className="w-[60px] h-[60px] rounded-xl overflow-hidden relative flex-shrink-0 bg-on-surface/5">
                        {item.image ? (
                          <Image src={item.image} alt={title} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-surface-variant text-on-surface-variant">
                            <span className="material-symbols-outlined text-[24px]">
                              {item.type === 'product' ? 'storefront' : item.type === 'social' ? 'nightlife' : item.type === 'event' ? 'event' : item.type === 'venue' ? 'location_on' : item.type === 'person' ? 'star' : 'group'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            item.type === 'product' ? 'bg-orange-100 text-orange-600' :
                            item.type === 'social' ? 'bg-pink-100 text-pink-600' :
                            item.type === 'event' ? 'bg-purple-100 text-purple-600' :
                            item.type === 'venue' ? 'bg-cyan-100 text-cyan-600' :
                            item.type === 'person' ? 'bg-amber-100 text-amber-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {item.type === 'person'
                              ? (language === 'KR'
                                  ? (item.roleLabelKo || item.roleLabel || t('search.type.person'))
                                  : (item.roleLabel || item.roleLabelKo || t('search.type.person')))
                              : t('search.type.' + item.type)
                            }
                          </span>
                        </div>
                        <h3 className="text-[15px] font-bold text-on-surface line-clamp-1">{title}</h3>
                        {subtitle && <p className="text-[12px] font-medium text-on-surface/60 mt-0.5">{subtitle}</p>}
                      </div>
                      <span className="material-symbols-outlined text-on-surface/20 text-[20px]">chevron_right</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
