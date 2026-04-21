'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { communityService } from '@/lib/firebase/communityService';
import { Community } from '@/types/community';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['400', '500', '600', '700', '800']
});

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600', '700']
});

export default function GroupsDiscoveryPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const data = await communityService.getCommunities();
        setCommunities(data);
      } catch (error) {
        console.error('Failed to fetch communities:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCommunities();
  }, []);

  // Filter 10 most recent for "What's New"
  const whatsNew = [...communities]
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
    .slice(0, 10);

  // Filter top 3 by memberCount for "Trending Now"
  const trendingNow = [...communities]
    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
    .slice(0, 3);

  // Group by category (simulated or using tags)
  const categories = [
    { name: 'Studio', icon: 'palette', color: 'primary', label: 'CREATIVE' },
    { name: 'Shop', icon: 'shopping_bag', color: 'tertiary', label: 'COMMERCE' },
    { name: 'Tech', icon: 'terminal', color: 'on-secondary-fixed-variant', label: 'TECH' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`${plusJakartaSans.variable} ${inter.variable} font-body bg-surface text-on-surface pb-32 selection:bg-primary-container selection:text-on-primary-container min-h-screen pt-20`}>
      {/* Ambient Background Textures */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-3xl mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-tertiary/5 blur-3xl mix-blend-multiply"></div>
      </div>

      <main className="px-6 py-8 space-y-12 max-w-7xl mx-auto">
        {/* 1. Create Group Button */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/groups/create" className="w-full">
            <button className="w-full bg-primary text-white font-headline font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 active:scale-95">
              <span className="material-symbols-outlined fill-1">add_circle</span>
              Make new group
            </button>
          </Link>
          <p className="text-[11px] font-body text-on-surface-variant/70 font-medium tracking-tight">
            Anyone can create as many groups as they want.
          </p>
        </div>

        {/* 2. What's New Section (Horizontal Scroll) */}
        <section>
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-headline font-extrabold text-2xl tracking-tighter text-on-surface">What's New</h2>
              <p className="font-body text-on-surface-variant text-xs mt-1">Explore the freshest communities just joining our network.</p>
            </div>
            <Link href="/groups/new" className="text-primary text-xs font-bold hover:underline">View All</Link>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar snap-x pb-4 -mx-6 px-6">
            {whatsNew.map((community, i) => (
              <Link key={community.id} href={`/space/${community.id}`} className="snap-start min-w-[280px]">
                <div className="bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/10 shadow-sm hover:shadow-md transition-all h-full">
                  <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-surface-container">
                    <img 
                      alt={community.name} 
                      className="w-full h-full object-cover" 
                      src={community.coverImage || community.logo || 'https://images.unsplash.com/photo-1545670723-196ed09c3944?auto=format&fit=crop&q=80&w=400'}
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=800';
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 block">
                    {i === 0 ? 'New Arrival' : i < 3 ? 'Trending Up' : 'Just Joined'}
                  </span>
                  <h4 className="font-headline font-bold text-lg text-on-surface truncate">{community.name}</h4>
                  <p className="text-xs text-on-surface-variant line-clamp-1 mb-3">{community.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-surface-container overflow-hidden">
                      <img 
                        alt="avatar" 
                        className="w-full h-full object-cover" 
                        src={community.members?.[0]?.avatar || community.logo || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'}
                        onError={(e) => {
                          e.currentTarget.src = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-medium">{community.memberCount || 0} members</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Trending Now Grid */}
        {trendingNow.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-headline font-extrabold text-3xl tracking-tighter text-on-surface">Trending Now</h2>
                <p className="font-body text-on-surface-variant text-sm mt-1">The most talked-about communities this week.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Large Feature Card */}
              <Link href={`/space/${trendingNow[0].id}`} className="md:col-span-8 group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[0.99] bg-surface-container-lowest">
                <div className="aspect-[16/9] md:aspect-[4/3] w-full bg-surface-container relative">
                  <img 
                    className="w-full h-full object-cover" 
                    alt={trendingNow[0].name}
                    src={trendingNow[0].coverImage || 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800'}
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary/80 backdrop-blur-md text-white font-label font-bold text-[10px] uppercase px-3 py-1 rounded-full tracking-wide">🔥 Hot</span>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 w-full p-6 text-white">
                  <h3 className="font-headline font-extrabold text-2xl mb-2">{trendingNow[0].name}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-body font-medium text-white/90">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">person</span> 
                      {trendingNow[0].members?.[0]?.name || 'Admin'}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">group</span> 
                      {trendingNow[0].memberCount} Members
                    </span>
                    <span className="flex items-center gap-1 text-primary-container">
                      <span className="material-symbols-outlined text-[16px]">lock_open</span> 
                      Open
                    </span>
                  </div>
                </div>
              </Link>
              
              {/* Two Smaller Cards */}
              <div className="md:col-span-4 flex flex-col gap-6">
                {trendingNow.slice(1, 3).map((item) => (
                  <Link key={item.id} href={`/space/${item.id}`} className="group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[0.99] bg-surface-container-lowest flex-1">
                    <div className="h-32 w-full bg-surface-container relative">
                      <img 
                        className="w-full h-full object-cover" 
                        alt={item.name}
                        src={item.coverImage || 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=400'}
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?auto=format&fit=crop&q=80&w=400';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-headline font-bold text-lg text-on-surface mb-2 truncate">{item.name}</h3>
                      <div className="flex flex-col gap-1 text-xs font-body text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">group</span> 
                          {item.memberCount} Members
                        </span>
                        <span className="flex items-center gap-1 text-primary">
                          <span className="material-symbols-outlined text-[14px]">lock_open</span> 
                          Open
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. Category Best Section */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-headline font-extrabold text-3xl tracking-tighter text-on-surface">Category Best</h2>
              <p className="font-body text-on-surface-variant text-sm mt-1">Top-rated communities curated by category.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {categories.map((cat) => {
              // Pick a random community for demo if actual filtered data is empty
              const topInCat = communities.find(c => c.tags?.includes(cat.name)) || communities[Math.floor(Math.random() * communities.length)];
              if (!topInCat) return null;

              return (
                <Link key={cat.name} href={`/space/${topInCat.id}`}>
                  <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/10 hover:border-primary/30 transition-colors">
                    <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-3xl">{cat.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-headline font-bold text-on-surface">{topInCat.name}</h4>
                        <span className="text-[10px] font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded">{cat.label}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">{topInCat.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] text-on-surface-variant/80">
                        <span className="flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-[12px] fill-1 text-amber-500">star</span> 
                          4.9
                        </span>
                        <span>{topInCat.memberCount} active members</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant">chevron_right</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
