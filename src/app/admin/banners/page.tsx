"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, getDocs, doc, getDoc, setDoc, where, orderBy, Timestamp } from 'firebase/firestore';
import { plazaService, Post as PlazaPost } from '@/lib/firebase/plazaService';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const SOCIETIES = [
  { id: 'tango', label: 'Tango' },
  { id: 'yoga', label: 'Yoga' },
];

export default function AdminBannersPage() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [selectedSociety, setSelectedSociety] = useState('tango');
  const [heroEventIds, setHeroEventIds] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Featured Plaza Posts
  const [plazaPosts, setPlazaPosts] = useState<PlazaPost[]>([]);
  const [featuredSlot1, setFeaturedSlot1] = useState<string>('');
  const [featuredSlot2, setFeaturedSlot2] = useState<string>('');
  const [plazaLoading, setPlazaLoading] = useState(true);
  const [plazaSaving, setPlazaSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const now = Timestamp.now();
        // Fetch events from today onwards
        const q = query(
          collection(db, 'events'),
          where('startDate', '>=', now),
          orderBy('startDate', 'asc')
        );
        const snapshot = await getDocs(q);
        const eventList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setEvents(eventList);

        // Fetch current selection
        const bannerDoc = await getDoc(doc(db, 'settings', 'banners'));
        if (bannerDoc.exists()) {
          const data = bannerDoc.data();
          // Load society-specific heroEventIds
          const ids: Record<string, string> = data.heroEventIds || {};
          // Migrate legacy heroEventId to tango slot if needed
          if (data.heroEventId && !ids.tango) {
            ids.tango = data.heroEventId;
          }
          setHeroEventIds(ids);
          if (data.featuredPlazaPostIds) {
            setFeaturedSlot1(data.featuredPlazaPostIds[0] || '');
            setFeaturedSlot2(data.featuredPlazaPostIds[1] || '');
          }
        }
      } catch (e) {
        console.error(e);
        toast.error(t("admin.banners.load_events_fail"));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [t]);

  // Fetch recent 100 plaza posts for dropdown
  useEffect(() => {
    async function fetchPlazaPosts() {
      try {
        const posts = await plazaService.getRecentPosts(100);
        setPlazaPosts(posts);
      } catch (e) {
        console.error(e);
        toast.error(t("admin.banners.load_posts_fail"));
      } finally {
        setPlazaLoading(false);
      }
    }
    fetchPlazaPosts();
  }, [t]);

  // Filter events by selected society
  const filteredEvents = events.filter((ev: any) => {
    if (selectedSociety === 'tango') {
      return !ev.societyId || ev.societyId === 'tango';
    }
    return ev.societyId === selectedSociety;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'banners'), {
        heroEventId: heroEventIds.tango || '',  // legacy compatibility
        heroEventIds: heroEventIds,
      }, { merge: true });
      toast.success(selectedSociety === 'tango' ? 'Tango 대표 이벤트가 성공적으로 저장되었습니다!' : 'Yoga 대표 이벤트가 성공적으로 저장되었습니다!');
    } catch (e) {
      console.error(e);
      toast.error(t("admin.banners.update_hero_fail"));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlaza = async () => {
    setPlazaSaving(true);
    try {
      const ids = [featuredSlot1, featuredSlot2].filter(Boolean);
      await setDoc(doc(db, 'settings', 'banners'), {
        featuredPlazaPostIds: ids
      }, { merge: true });
      toast.success(t("admin.banners.update_posts_success"));
    } catch (e) {
      console.error(e);
      toast.error(t("admin.banners.update_posts_fail"));
    } finally {
      setPlazaSaving(false);
    }
  };

  // Helper: format dropdown label — "userName · first 20 chars of content"
  const formatPostLabel = (post: PlazaPost): string => {
    const name = post.userName || 'Unknown';
    const preview = (post.content || '').replace(/\n/g, ' ').substring(0, 20);
    return `${name} · ${preview}${(post.content || '').length > 20 ? '…' : ''}`;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <main className="max-w-[896px] mx-auto px-4 pt-4 pb-24 space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="text-2xl font-black text-on-surface tracking-tight">Banners Management</h1>
          <p className="text-xs text-outline mt-1">플랫폼 메인 화면 배너와 추천 포스트를 정밀 제어하는 핵심 도구입니다.</p>
        </div>
      </div>
      
      {/* Hero Event Section — Society-Aware */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 transition-all hover:shadow-md">
        <h2 className="text-base font-bold text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">stars</span>
          Society Top Hero Event
        </h2>
        
        {/* Society Selector */}
        <div className="flex gap-2 mb-6 bg-surface-container-low p-1.5 rounded-xl w-fit border border-outline-variant/20">
          {SOCIETIES.map(s => (
            <button
              key={s.id}
              onClick={() => setSelectedSociety(s.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedSociety === s.id
                  ? 'bg-primary text-on-primary shadow-md'
                  : 'text-outline hover:text-on-surface hover:bg-surface-container/50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2.5">
          <label className="text-xs text-outline font-bold uppercase tracking-wider">Select an upcoming event for {selectedSociety.toUpperCase()}</label>
          <div className="relative">
            <select 
              value={heroEventIds[selectedSociety] || ''} 
              onChange={(e) => setHeroEventIds(prev => ({ ...prev, [selectedSociety]: e.target.value }))}
              className="w-full border border-outline-variant/50 rounded-xl p-3 px-4 bg-surface-container-lowest text-sm font-bold text-on-surface appearance-none cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none hover:bg-surface-container-low/30 transition-colors"
            >
              <option value="">-- None (Auto select) --</option>
              {filteredEvents.map(ev => {
                const d = ev.startDate?.toDate ? ev.startDate.toDate() : new Date();
                return (
                  <option key={ev.id} value={ev.id}>
                    {format(d, 'yyyy-MM-dd')} | {ev.title}
                  </option>
                );
              })}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">unfold_more</span>
          </div>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="mt-6 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:brightness-105 active:scale-98 transition-all shadow-md w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save Selection'}
        </button>
      </div>

      {/* Featured Plaza Posts Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/30 transition-all hover:shadow-md">
        <h2 className="text-base font-bold text-on-surface mb-1 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary text-[20px]">wysiwyg</span>
          Featured Plaza Posts
        </h2>
        <p className="text-xs text-outline mb-6">Home 페이지 &quot;Stories from Seoul&quot; 섹션에 표시될 2개의 포스트를 선택하세요.</p>
        
        {plazaLoading ? (
          <div className="text-sm text-outline py-6 flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            Loading plaza posts...
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Slot 1 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-outline font-bold uppercase tracking-wider">Slot 1</label>
              <div className="relative">
                <select 
                  value={featuredSlot1} 
                  onChange={(e) => setFeaturedSlot1(e.target.value)}
                  className="w-full border border-outline-variant/50 rounded-xl p-3 px-4 bg-surface-container-lowest text-sm font-bold text-on-surface appearance-none cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none hover:bg-surface-container-low/30 transition-colors"
                >
                  <option value="">-- Select a post --</option>
                  {plazaPosts.map(post => (
                    <option key={post.id} value={post.id} disabled={post.id === featuredSlot2}>
                      {formatPostLabel(post)}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">unfold_more</span>
              </div>
              {featuredSlot1 && (() => {
                const p = plazaPosts.find(pp => pp.id === featuredSlot1);
                return p ? (
                  <div className="mt-2 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs">
                    <div className="font-bold text-on-surface">{p.userName}</div>
                    <div className="text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">{p.content}</div>
                    {p.images && p.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {p.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-black/5 shadow-sm" />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Slot 2 */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-outline font-bold uppercase tracking-wider">Slot 2</label>
              <div className="relative">
                <select 
                  value={featuredSlot2} 
                  onChange={(e) => setFeaturedSlot2(e.target.value)}
                  className="w-full border border-outline-variant/50 rounded-xl p-3 px-4 bg-surface-container-lowest text-sm font-bold text-on-surface appearance-none cursor-pointer focus:ring-2 focus:ring-primary focus:outline-none hover:bg-surface-container-low/30 transition-colors"
                >
                  <option value="">-- Select a post --</option>
                  {plazaPosts.map(post => (
                    <option key={post.id} value={post.id} disabled={post.id === featuredSlot1}>
                      {formatPostLabel(post)}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline text-[18px] pointer-events-none">unfold_more</span>
              </div>
              {featuredSlot2 && (() => {
                const p = plazaPosts.find(pp => pp.id === featuredSlot2);
                return p ? (
                  <div className="mt-2 p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs">
                    <div className="font-bold text-on-surface">{p.userName}</div>
                    <div className="text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">{p.content}</div>
                    {p.images && p.images.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {p.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" className="w-14 h-14 object-cover rounded-lg border border-black/5 shadow-sm" />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>

            <button 
              onClick={handleSavePlaza} 
              disabled={plazaSaving}
              className="mt-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:brightness-105 active:scale-98 transition-all shadow-md w-full sm:w-auto"
            >
              {plazaSaving ? 'Saving...' : 'Save Featured Posts'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
