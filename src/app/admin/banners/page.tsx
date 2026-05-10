"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, getDocs, doc, getDoc, setDoc, where, orderBy, Timestamp } from 'firebase/firestore';
import { plazaService, Post as PlazaPost } from '@/lib/firebase/plazaService';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminBannersPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
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
          if (data.heroEventId) {
            setSelectedEventId(data.heroEventId);
          }
          if (data.featuredPlazaPostIds) {
            setFeaturedSlot1(data.featuredPlazaPostIds[0] || '');
            setFeaturedSlot2(data.featuredPlazaPostIds[1] || '');
          }
        }
      } catch (e) {
        console.error(e);
        toast.error("Failed to load events");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Fetch recent 100 plaza posts for dropdown
  useEffect(() => {
    async function fetchPlazaPosts() {
      try {
        const posts = await plazaService.getRecentPosts(100);
        setPlazaPosts(posts);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load plaza posts");
      } finally {
        setPlazaLoading(false);
      }
    }
    fetchPlazaPosts();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'banners'), {
        heroEventId: selectedEventId
      }, { merge: true });
      toast.success("Hero event updated successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update hero event.");
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
      toast.success("Featured plaza posts updated successfully.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update featured posts.");
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
    <main className="max-w-[896px] mx-auto px-6 pt-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">Banners Management</h1>
      
      {/* Hero Event Section (기존) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <h2 className="text-lg font-bold mb-4">Society Top Hero Event</h2>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-outline font-semibold">Select an upcoming event</label>
          <select 
            value={selectedEventId} 
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="border border-outline-variant rounded-lg p-3 bg-surface-container-lowest text-body-md"
          >
            <option value="">-- None (Auto select) --</option>
            {events.map(ev => {
              const d = ev.startDate?.toDate ? ev.startDate.toDate() : new Date();
              return (
                <option key={ev.id} value={ev.id}>
                  {format(d, 'yyyy-MM-dd')} | {ev.title}
                </option>
              );
            })}
          </select>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="mt-6 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors"
        >
          {saving ? 'Saving...' : 'Save Selection'}
        </button>
      </div>

      {/* Featured Plaza Posts Section (신규) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-outline-variant/30">
        <h2 className="text-lg font-bold mb-1">Featured Plaza Posts</h2>
        <p className="text-sm text-outline mb-4">Home 페이지 &quot;Stories from Seoul&quot; 섹션에 표시될 2개의 포스트를 선택하세요.</p>
        
        {plazaLoading ? (
          <div className="text-sm text-outline">Loading plaza posts...</div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* Slot 1 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-outline font-semibold">Slot 1</label>
              <select 
                value={featuredSlot1} 
                onChange={(e) => setFeaturedSlot1(e.target.value)}
                className="border border-outline-variant rounded-lg p-3 bg-surface-container-lowest text-body-md"
              >
                <option value="">-- Select a post --</option>
                {plazaPosts.map(post => (
                  <option key={post.id} value={post.id} disabled={post.id === featuredSlot2}>
                    {formatPostLabel(post)}
                  </option>
                ))}
              </select>
              {featuredSlot1 && (() => {
                const p = plazaPosts.find(pp => pp.id === featuredSlot1);
                return p ? (
                  <div className="mt-1 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20 text-sm">
                    <div className="font-semibold text-on-surface">{p.userName}</div>
                    <div className="text-on-surface-variant mt-1 line-clamp-2">{p.content}</div>
                    {p.images && p.images.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {p.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                ) : null;
              })()}
            </div>

            {/* Slot 2 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-outline font-semibold">Slot 2</label>
              <select 
                value={featuredSlot2} 
                onChange={(e) => setFeaturedSlot2(e.target.value)}
                className="border border-outline-variant rounded-lg p-3 bg-surface-container-lowest text-body-md"
              >
                <option value="">-- Select a post --</option>
                {plazaPosts.map(post => (
                  <option key={post.id} value={post.id} disabled={post.id === featuredSlot1}>
                    {formatPostLabel(post)}
                  </option>
                ))}
              </select>
              {featuredSlot2 && (() => {
                const p = plazaPosts.find(pp => pp.id === featuredSlot2);
                return p ? (
                  <div className="mt-1 p-3 bg-surface-container-low rounded-lg border border-outline-variant/20 text-sm">
                    <div className="font-semibold text-on-surface">{p.userName}</div>
                    <div className="text-on-surface-variant mt-1 line-clamp-2">{p.content}</div>
                    {p.images && p.images.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {p.images.slice(0, 3).map((img, i) => (
                          <img key={i} src={img} alt="" className="w-12 h-12 object-cover rounded" />
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
              className="mt-2 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors w-fit"
            >
              {plazaSaving ? 'Saving...' : 'Save Featured Posts'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
