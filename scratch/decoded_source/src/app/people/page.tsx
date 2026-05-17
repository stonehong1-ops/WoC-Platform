'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useNavigation } from '@/components/providers/NavigationProvider';
import { peopleService, SAMPLE_PEOPLE } from '@/lib/firebase/peopleService';
import { Person, PersonRole } from '@/types/people';

const FILTER_CHIPS: { label: string; role?: PersonRole }[] = [
  { label: 'All People' },
  { label: 'Couples', role: 'Couple' },
  { label: 'Instructor', role: 'Instructor' },
  { label: 'Organizer', role: 'Organizer' },
  { label: 'Touring', role: 'Touring' },
];

export default function PeoplePage() {
  const { setSubHeader } = useNavigation();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All People');
  const [people, setPeople] = useState<Person[]>([]);
  const [seeding, setSeeding] = useState(false);

  // Subscribe Firestore
  useEffect(() => {
    const unsub = peopleService.subscribe(setPeople);
    return () => unsub();
  }, []);

  // Teleport filter to header
  useEffect(() => {
    const filterBar = (
      <div className="relative w-full bg-white flex flex-col">
        <div className="w-full px-3 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => {
                setActiveFilter(chip.label);
                window.scrollTo({ top: 0, behavior: 'instant' });
              }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-xl text-[12px] font-bold tracking-tight transition-all whitespace-nowrap border ${
                activeFilter === chip.label
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm shadow-slate-200'
                  : 'bg-slate-50/50 text-slate-500 border-slate-100 hover:bg-slate-100/80'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>
    );
    setSubHeader(filterBar);
    return () => setSubHeader(null);
  }, [activeFilter, setSubHeader]);

  const filtered = people.filter(p => {
    const matchRole = activeFilter === 'All People' || p.roles.includes(activeFilter as PersonRole);
    return matchRole;
  });

  const handleSeed = async () => {
    setSeeding(true);
    try {
      for (const p of SAMPLE_PEOPLE) {
        await peopleService.add(p as Omit<Person, 'id' | 'createdAt' | 'updatedAt'>);
      }
      alert('Sample data added!');
    } catch (e) {
      console.error(e);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <main className="max-w-md mx-auto w-full relative min-h-screen bg-background">
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .activity-card-gradient {
          background: linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 45%, rgba(0,0,0,0) 100%);
        }
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}} />

      <div className="px-0 pt-0 pb-32 flex flex-col gap-6">

        {/* Integrated Registration Action */}
        <div className="mx-4 my-3 px-5 py-3 flex items-center justify-between bg-white rounded-xl border border-slate-100 shadow-sm">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
            Know a tango artist?
          </p>
          <button 
            onClick={() => router.push('/people/register')}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-2"
          >
            <span className="text-[13px] font-bold">Register Artist</span>
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
          </button>
        </div>

        {/* Cards Feed */}
        <div className="flex flex-col gap-6 px-4">
          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 gap-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px]">person_search</span>
              <p className="text-sm">No artists found.</p>
              <button onClick={handleSeed} disabled={seeding}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {seeding ? 'Adding...' : 'Add Sample Data'}
              </button>
            </div>
          )}

          {filtered.map(person => (
            <Link key={person.id} href={`/people/${person.id}`}>
              <div className="relative h-[560px] rounded-xl overflow-hidden border border-outline-variant/20 bg-surface shadow-sm cursor-pointer">
                {/* BG Image */}
                <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: `url('${person.heroImageUrl}')` }} />
                <div className="absolute inset-0 activity-card-gradient" />

                {/* Top-Left Badges */}
                <div className="absolute top-6 left-6 flex flex-col gap-1">
                  {person.roles.slice(0, 1).map(r => (
                    <span key={r} className={`backdrop-blur-md text-white px-3 py-1 rounded text-[11px] uppercase tracking-wider font-bold ${
                      r === 'Instructor' ? 'bg-primary/80' : r === 'Touring' ? 'bg-[rgba(64,71,88,0.8)]' : 'bg-primary/80'
                    }`}>{r}</span>
                  ))}
                  {person.roles.includes('Couple') && (
                    <span className="bg-white/20 backdrop-blur-sm text-white border border-white/30 px-2 py-1 rounded text-[10px] uppercase font-bold text-center">Couple</span>
                  )}
                </div>

                {/* Top-Right Live / Tour */}
                <div className="absolute top-6 right-6">
                  {person.isLiveNow && person.currentCity ? (
                    <span className="bg-white/95 text-primary px-3 py-1 rounded text-[12px] font-bold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {person.currentCity}
                    </span>
                  ) : person.tourStops[0] ? (
                    <span className="bg-white/95 text-on-surface px-3 py-1 rounded text-[12px] font-bold shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">flight</span>
                      {person.tourStops[0].city} • {person.tourStops[0].month}
                    </span>
                  ) : null}
                </div>

                {/* Bottom */}
                <div className="absolute bottom-0 left-0 p-6 w-full">
                  <h3 className="text-[24px] font-bold text-white mb-1 leading-tight">{person.name}</h3>
                  <div className="flex items-center gap-1 text-white/80 mb-3">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    <span className="text-[12px] font-medium">Based in {person.baseCity}, {person.baseCountry}</span>
                  </div>
                  {person.bio && (
                    <p className="text-white/70 text-[14px] mb-4 line-clamp-2">{person.bio}</p>
                  )}

                  {/* Stats */}
                  {(person.partnerSince || person.style) && (
                    <div className="flex gap-6 mb-4 py-2 border-y border-white/10">
                      {person.partnerSince && (
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-[12px]">Partnered</span>
                          <span className="text-white/60 text-[10px] uppercase tracking-tighter">Since {person.partnerSince}</span>
                        </div>
                      )}
                      {person.style && (
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-[12px]">Style</span>
                          <span className="text-white/60 text-[10px] uppercase tracking-tighter">{person.style}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tour Tags */}
                  {person.tourStops.length > 0 && (
                    <div className="flex gap-2 mb-4 overflow-x-auto hide-scrollbar">
                      {person.tourStops.slice(0, 3).map((stop, i) => (
                        <div key={i} className="bg-white/10 rounded px-2 py-1 flex items-center gap-1 whitespace-nowrap border border-white/20">
                          <span className="text-white/80 text-[10px] font-bold">{stop.city.toUpperCase()}</span>
                          <span className="text-white text-[10px]">{stop.month}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="w-full bg-white text-primary py-3 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
