"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, getDocs, doc, getDoc, setDoc, where, orderBy, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminBannersPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        if (bannerDoc.exists() && bannerDoc.data().heroEventId) {
          setSelectedEventId(bannerDoc.data().heroEventId);
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <main className="max-w-[896px] mx-auto px-6 pt-4 pb-24 space-y-6">
      <h1 className="text-2xl font-bold">Banners Management</h1>
      
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
    </main>
  );
}
