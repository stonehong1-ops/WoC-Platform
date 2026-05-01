"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { storageService } from '@/lib/firebase/storageService';
import { useAuth } from '@/components/providers/AuthProvider';
import { Group, Member } from '@/types/group';
import Link from 'next/link';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { db } from '@/lib/firebase/clientApp';
import { updateDoc, doc, collection, getDocs, query } from 'firebase/firestore';

import { Suspense } from 'react';

function GroupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, profile, setShowLogin } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const userJoinedGroups = user ? groups.filter(g => {
    // 1. Check user profile's joinedGroups
    const inJoinedGroups = profile?.joinedGroups && profile.joinedGroups.includes(g.id);
    
    // 2. Check group metadata's memberIds array
    const inMemberIds = (g as any).memberIds && Array.isArray((g as any).memberIds) && (g as any).memberIds.includes(user.uid);
    
    // 3. Check if owner
    const isOwner = g.ownerId === user.uid;
    
    // 4. Fallback: if it's the freestyle tango group and we want to ensure visibility for debugging
    // (Optional, but helps during transitions)
    const isFreestyle = g.name?.toLowerCase().includes('freestyle');
    
    const matches = inJoinedGroups || inMemberIds || isOwner;
    
    if (isFreestyle) {
      console.log('Freestyle Group Membership Check:', { 
        id: g.id, 
        inJoinedGroups, 
        inMemberIds, 
        isOwner,
        profileJoined: profile?.joinedGroups
      });
    }
    
    return matches;
  }) : [];
  
  useEffect(() => {
    if (user) {
      console.log('Total Joined Groups Found:', userJoinedGroups.length);
    }
  }, [user, profile?.joinedGroups, groups.length, userJoinedGroups.length]);

  // Create Group State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: 'Studio',
    joinPolicy: 'open',
    coverImage: null as File | null,
    previewUrl: null as string | null
  });

  // My Groups Bottom Sheet State
  const [sheetState, setSheetState] = useState<'minimized' | 'half'>('minimized');

  // 스크롤 먹통 방지: 모달/팝업 상태에 따른 body overflow 제어 및 언마운트 시 초기화
  useEffect(() => {
    if (isCreateOpen || selectedCategory || sheetState === 'half') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCreateOpen, selectedCategory, sheetState]);

  const openCategoryModal = (category: string) => {
    setSelectedCategory(category);
  };

  const openCreateModal = () => {
    setIsCreateOpen(true);
  };

  const closeModals = () => {
    setIsCreateOpen(false);
    setSelectedCategory(null);
    setSheetState('minimized');
    // Clear URL params when closing
    if (searchParams.get('action') || searchParams.get('view')) {
      router.replace(pathname);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(err.message || 'Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle URL Search Params for specialized header triggers
  useEffect(() => {
    const action = searchParams.get('action');
    const view = searchParams.get('view');

    if (action === 'create') {
      setIsCreateOpen(true);
    } else {
      setIsCreateOpen(false);
    }
    
    if (view === 'my') {
      setSheetState('half');
    } else {
      setSheetState('minimized');
    }
  }, [searchParams]);

  // Function to close modals and clear params
  const closeModalsWithParams = () => {
    setIsCreateOpen(false);
    setSelectedCategory(null);
    setSheetState('minimized');
    // Clear the search params by navigating to the current path
    if (searchParams.get('action') || searchParams.get('view')) {
      router.replace(pathname);
    }
  };

  // Admin Auto-Migration Script
  useEffect(() => {
    const runMigration = async () => {
      // stonehong1@gmail.com 관리자 계정일 때만 한 번 자동 실행
      if (user?.email === 'stonehong1@gmail.com' && typeof window !== 'undefined' && !localStorage.getItem('category_migrated_v3')) {
        try {
          console.log('Starting category migration...');
          const venuesSnap = await getDocs(query(collection(db, 'venues')));
          const venuesMap = new Map();
          venuesSnap.docs.forEach(d => venuesMap.set(d.id, d.data()));

          const groupsSnap = await getDocs(query(collection(db, 'groups')));

          let count = 0;
          for (const gDoc of groupsSnap.docs) {
            const groupData = gDoc.data();
            if (groupData.venueId && venuesMap.has(groupData.venueId)) {
              const venue = venuesMap.get(groupData.venueId);
              // 태그가 없거나 기본 Studio인 경우 업데이트 진행
              if (venue.category && (!groupData.tags || groupData.tags.length === 0 || groupData.tags.includes('Studio'))) {
                const catMap = ['Studio', 'Shop', 'Stay', 'Rental', 'Beauty', 'Wellness', 'Restaurant', 'Cafe', 'Office', 'Online'];
                const targetCat = catMap.find(c => venue.category.toLowerCase().includes(c.toLowerCase())) || 'Studio'; // fallback to Studio if no match

                // 해당 카테고리가 Studio가 아닐 경우에만 업데이트
                if (targetCat !== 'Studio' || venue.category.includes('Studio')) {
                  const activeServices: any = groupData.activeServices || {};
                  const tc = targetCat.toLowerCase();
                  if (tc === 'shop') activeServices.shop = true;
                  if (tc === 'stay') activeServices.stay = true;
                  if (tc === 'rental') activeServices.rental = true;
                  if (tc === 'beauty') activeServices.beauty = true;
                  if (tc === 'wellness') activeServices.wellness = true;
                  if (tc === 'restaurant') activeServices.restaurant = true;
                  if (tc === 'cafe') activeServices.cafe = true;
                  if (tc === 'office') activeServices.office = true;
                  if (tc === 'online') activeServices.online = true;

                  await updateDoc(doc(db, 'groups', gDoc.id), {
                    tags: [targetCat],
                    activeServices: activeServices
                  });
                  count++;
                  console.log(`Migrated Group ${groupData.name} to ${targetCat}`);
                }
              }
            }
          }
          console.log(`Migrated ${count} groups!`);
          localStorage.setItem('category_migrated_v3', 'true');
          fetchGroups(); // refresh the list
        } catch (e) {
          console.error('Migration error:', e);
        }
      }
    };
    if (user && groups.length > 0) {
      runMigration();
    }
  }, [user, groups.length]);

  // Filter removed: all groups including unpublished ones should appear in the directory
  const publishedGroups = groups;

  // What's New: Latest 10
  const whatsNewGroups = [...publishedGroups]
    .sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'object' && val.toMillis) return val.toMillis();
        if (typeof val === 'number') return val;
        return 0;
      };
      return getTime(b.updatedAt) - getTime(a.updatedAt);
    })
    .slice(0, 10);

  // Category counts mapping
  const categoryCounts = {
    Studio: publishedGroups.filter(g => g.activeServices?.class || g.tags?.includes('Studio') || (!g.tags || g.tags.length === 0)).length,
    Shop: publishedGroups.filter(g => g.activeServices?.shop || g.tags?.includes('Shop')).length,
    Stay: publishedGroups.filter(g => g.activeServices?.stay || g.tags?.includes('Stay')).length,
    Rental: publishedGroups.filter(g => g.activeServices?.rental || g.tags?.includes('Rental')).length,
    Beauty: publishedGroups.filter(g => g.activeServices?.beauty || g.tags?.includes('Beauty')).length,
    Wellness: publishedGroups.filter(g => g.activeServices?.wellness || g.tags?.includes('Wellness')).length,
    Restaurant: publishedGroups.filter(g => g.activeServices?.restaurant || g.tags?.includes('Restaurant')).length,
    Cafe: publishedGroups.filter(g => g.activeServices?.cafe || g.tags?.includes('Cafe')).length,
    Office: publishedGroups.filter(g => g.activeServices?.office || g.tags?.includes('Office')).length,
    Online: publishedGroups.filter(g => g.activeServices?.online || g.tags?.includes('Online')).length,
  };

  const discoveryCategories = [
    { id: 'Studio', icon: 'palette', color: 'bg-primary-container', text: 'text-on-primary-container' },
    { id: 'Shop', icon: 'shopping_bag', color: 'bg-secondary-container', text: 'text-on-secondary-container' },
    { id: 'Stay', icon: 'bed', color: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
    { id: 'Rental', icon: 'car_rental', color: 'bg-surface-container-highest', text: 'text-on-surface-variant' },
    { id: 'Beauty', icon: 'face_retouching_natural', color: 'bg-pink-100', text: 'text-pink-900' },
    { id: 'Wellness', icon: 'self_care', color: 'bg-rose-100', text: 'text-rose-900' },
    { id: 'Restaurant', icon: 'restaurant', color: 'bg-orange-100', text: 'text-orange-900' },
    { id: 'Cafe', icon: 'local_cafe', color: 'bg-amber-100', text: 'text-amber-900' },
    { id: 'Office', icon: 'work', color: 'bg-slate-100', text: 'text-slate-900' },
    { id: 'Online', icon: 'computer', color: 'bg-blue-100', text: 'text-blue-900' }
  ];

  const getFilteredGroups = () => {
    if (!selectedCategory) return [];
    if (selectedCategory === 'All') return publishedGroups;
    return publishedGroups.filter(g => {
      const groupTags = g.tags && g.tags.length > 0 ? g.tags : ['Studio'];
      return groupTags.includes(selectedCategory) ||
        (selectedCategory === 'Studio' && g.activeServices?.class) ||
        (selectedCategory === 'Shop' && g.activeServices?.shop) ||
        (selectedCategory === 'Stay' && g.activeServices?.stay) ||
        (selectedCategory === 'Rental' && g.activeServices?.rental) ||
        (selectedCategory === 'Beauty' && g.activeServices?.beauty) ||
        (selectedCategory === 'Wellness' && g.activeServices?.wellness) ||
        (selectedCategory === 'Restaurant' && g.activeServices?.restaurant) ||
        (selectedCategory === 'Cafe' && g.activeServices?.cafe) ||
        (selectedCategory === 'Office' && g.activeServices?.office) ||
        (selectedCategory === 'Online' && g.activeServices?.online);
    });
  };

  const GroupCoverImage = ({ group, className = "" }: { group: Group, className?: string }) => {
    return (
      <ImageWithFallback
        alt={group.name}
        className={`w-full h-full object-cover transition-transform duration-500 ${className}`}
        src={group.coverImage || ""}
        fallbackType="cover"
        category={group.tags?.[0] || ''}
      />
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCreateForm(prev => ({
        ...prev,
        coverImage: file,
        previewUrl: URL.createObjectURL(file)
      }));
    }
  };

  const handleCreateSubmit = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    if (!createForm.name.trim()) {
      alert('Please enter a group name.');
      return;
    }

    setCreateLoading(true);
    try {
      let imageUrl = '';
      if (createForm.coverImage) {
        const path = `groups/${Date.now()}_${createForm.coverImage.name}`;
        imageUrl = await storageService.uploadFile(createForm.coverImage, path);
      }

      // Map categories to services or tags
      const activeServices = {
        class: createForm.category === 'Studio',
        shop: createForm.category === 'Shop',
        stay: createForm.category === 'Stay',
        rental: createForm.category === 'Rental',
        beauty: createForm.category === 'Beauty',
        wellness: createForm.category === 'Wellness',
        restaurant: createForm.category === 'Restaurant',
        cafe: createForm.category === 'Cafe',
        office: createForm.category === 'Office',
        online: createForm.category === 'Online'
      };

      const newGroupData: Partial<Group> = {
        name: createForm.name,
        description: createForm.description,
        coverImage: imageUrl,
        tags: [createForm.category],
        ownerId: user.uid,
        representative: {
          name: profile?.nickname || user.displayName || 'Community Leader',
          avatar: profile?.photoURL || user.photoURL || ''
        },
        activeServices,
        memberCount: 1,
        membershipPolicy: {
          joinStrategy: createForm.joinPolicy as any
        },
        updatedAt: new Date()
      };

      const memberData: Omit<Member, 'id'> = {
        name: profile?.nickname || user.displayName || 'Community Leader',
        avatar: profile?.photoURL || user.photoURL || '',
      };

      await groupService.createGroup(newGroupData, user.uid, memberData);

      // Reset and close
      setCreateForm({
        name: '',
        description: '',
        category: 'Studio',
        joinPolicy: 'open',
        coverImage: null,
        previewUrl: null
      });
      setIsCreateOpen(false);
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen pb-24 relative font-body">
      <main className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        {/* What's New Carousel */}
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-background">What's New</h2>
              <p className="text-on-surface-variant text-sm font-medium">Discover the latest communities</p>
            </div>
            <button
              onClick={() => { openCategoryModal('All'); }}
              className="text-primary font-bold text-sm flex items-center gap-1 group"
            >
              View all <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </button>
          </div>
          <div className="flex overflow-x-auto gap-4 no-scrollbar pb-4 -mx-6 px-6">
            {whatsNewGroups.length > 0 ? whatsNewGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => { router.push(`/group/${group.id}`); }}
                className="flex-shrink-0 w-[320px] group cursor-pointer active:scale-95 transition-transform"
              >
                <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-4 shadow-md group-hover:shadow-xl transition-all duration-300">
                  <GroupCoverImage group={group} className="group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/10 z-10"></div>
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/90 backdrop-blur px-2.5 py-0.5 rounded-full text-[10px] font-bold text-primary flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">location_on</span> {group.address || 'Venue'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 text-white">
                    <h3 className="text-lg font-bold font-headline mb-0.5">{group.name}</h3>
                    <p className="text-white/80 text-xs line-clamp-1">{group.memberCount} members • {group.tags?.[0] || 'Community'}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="w-full text-center py-10 text-on-surface-variant/50 font-medium">No groups discovered yet.</div>
            )}
          </div>
        </section>

        {/* New Group Action Button */}
        <section>
          <button
            onClick={openCreateModal}
            className="w-full bg-primary text-on-primary flex items-center justify-between px-6 py-5 rounded-3xl shadow-lg hover:bg-primary-dim transition-all active:scale-[0.98] group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl">add</span>
              </div>
              <div className="text-left">
                <h3 className="font-bold font-headline text-lg">Create a New Group</h3>
                <p className="text-on-primary/70 text-sm">Start your own community today</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-on-primary/50 group-hover:text-on-primary transition-colors">chevron_right</span>
          </button>
        </section>

        {/* Category Best Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-background">Category Best</h2>
            <p className="text-on-surface-variant text-sm font-medium">Explore by activity type</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {discoveryCategories.map((cat) => (
              <div
                key={cat.id}
                onClick={() => { openCategoryModal(cat.id); }}
                className={`group relative aspect-[4/3] rounded-3xl overflow-hidden ${cat.color} cursor-pointer transition-all hover:scale-[0.98] shadow-sm hover:shadow-md`}
              >
                <div className="absolute inset-0 bg-black/5 z-0"></div>
                <div className="absolute inset-0 p-5 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-start">
                    <span className={`material-symbols-outlined ${cat.text} text-3xl`}>{cat.icon}</span>
                    <span className={`bg-white/40 backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold ${cat.text}`}>
                      {categoryCounts[cat.id as keyof typeof categoryCounts] || 0}
                    </span>
                  </div>
                  <span className={`${cat.text} font-black font-headline text-lg uppercase italic`}>{cat.id}</span>
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className={`material-symbols-outlined text-8xl ${cat.text}`}>{cat.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Category Detail Overlay */}
      {selectedCategory && (
        <div className="fixed inset-0 z-[100] bg-background overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
          <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeModals}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-on-surface"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold font-headline text-on-surface">
                  {selectedCategory === 'All' ? 'Discover All' : `Category: ${selectedCategory}`}
                </h1>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 space-y-6 pb-8">
            {getFilteredGroups().length > 0 ? getFilteredGroups().map((group, index) => (
              <article
                key={group.id}
                onClick={() => {
                  closeModals();
                  router.push(`/group/${group.id}`);
                }}
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-md hover:shadow-xl transition-shadow group cursor-pointer active:scale-[0.99] transition-all"
              >
                <div className="relative h-48 overflow-hidden">
                  <GroupCoverImage group={group} className="group-hover:scale-105" />
                  {index === 0 && (
                    <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-[10px] font-bold shadow-lg tracking-wider">
                      FEATURED
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(group.name)}&background=random`} alt="User" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300 flex items-center justify-center overflow-hidden">
                      <img className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=User&background=random`} alt="User" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">+{group.memberCount > 2 ? group.memberCount - 2 : 0}</div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold font-headline text-on-surface mb-1">{group.name}</h2>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        <span>Owned by {group.representative?.name || 'Community Leader'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-primary font-bold text-xs bg-primary-container/20 px-2.5 py-1 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">groups</span>
                        {group.memberCount}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">Open to Join</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Join logic would go here
                      }}
                      className="bg-gradient-to-br from-primary to-[#4d8eff] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm"
                    >
                      Join Group
                    </button>
                  </div>
                </div>
              </article>
            )) : (
              <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/50">
                <span className="material-symbols-outlined text-6xl mb-4 opacity-20">search_off</span>
                <p className="font-medium">No communities found in this category.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* Create New Group Overlay */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[110] bg-surface overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
          <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm flex justify-between items-center w-full px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={closeModals}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 transition-colors active:scale-95 duration-150 text-gray-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <h1 className="font-headline text-lg font-bold text-on-surface">Create New Group</h1>
            </div>
            <button
              onClick={handleCreateSubmit}
              disabled={createLoading}
              className="bg-primary text-on-primary px-6 py-2 rounded-lg font-headline font-bold text-sm hover:brightness-110 active:scale-95 transition-all duration-150 shadow-md disabled:opacity-50"
            >
              {createLoading ? 'Saving...' : 'Save'}
            </button>
          </header>

          <main className="mt-20 pb-12 px-6 max-w-[896px] mx-auto space-y-6">
            {/* Section: Basic Info */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">GROUP NAME</label>
                  <input
                    className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg p-3 text-on-surface font-medium transition-all"
                    placeholder="Enter group name..."
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">DESCRIPTION</label>
                  <textarea
                    className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg p-3 text-on-surface font-medium transition-all resize-none"
                    placeholder="Describe the purpose of this group..."
                    rows={4}
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Section: Category */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">CATEGORY</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {[
                  { id: 'Studio', icon: 'palette' },
                  { id: 'Shop', icon: 'shopping_bag' },
                  { id: 'Stay', icon: 'bed' },
                  { id: 'Rental', icon: 'car_rental' },
                  { id: 'Beauty', icon: 'face_retouching_natural' },
                  { id: 'Wellness', icon: 'self_care' },
                  { id: 'Restaurant', icon: 'restaurant' },
                  { id: 'Cafe', icon: 'local_cafe' },
                  { id: 'Office', icon: 'work' },
                  { id: 'Online', icon: 'computer' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCreateForm(prev => ({ ...prev, category: cat.id }))}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all group active:scale-95 ${createForm.category === cat.id
                      ? 'border-primary bg-primary-container/10'
                      : 'border-transparent bg-surface-container-low hover:bg-surface-container-high'
                      }`}
                  >
                    <span className={`material-symbols-outlined mb-2 ${createForm.category === cat.id ? 'text-primary' : 'text-outline'}`}>{cat.icon}</span>
                    <span className={`text-[12px] font-semibold ${createForm.category === cat.id ? 'text-primary' : 'text-on-surface-variant'}`}>{cat.id}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Section: Membership Strategy */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">JOINING POLICY</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'open', label: 'Open', icon: 'public', desc: 'Anyone can join the group instantly.' },
                  { id: 'approval', label: 'Approval', icon: 'verified_user', desc: 'Admin must approve each request.' },
                  { id: 'invite', label: 'Invitation', icon: 'mail', desc: 'Private selected members only.' }
                ].map((policy) => (
                  <div
                    key={policy.id}
                    onClick={() => setCreateForm(prev => ({ ...prev, joinPolicy: policy.id }))}
                    className={`relative p-4 rounded-xl border-2 cursor-pointer group hover:shadow-md transition-all ${createForm.joinPolicy === policy.id
                      ? 'border-primary bg-primary-container/5'
                      : 'border-outline-variant/30 bg-white hover:border-outline'
                      }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`material-symbols-outlined ${createForm.joinPolicy === policy.id ? 'text-primary' : 'text-outline'}`}>{policy.icon}</span>
                      <div className={`w-5 h-5 rounded-full border-4 bg-white ${createForm.joinPolicy === policy.id ? 'border-primary' : 'border-outline-variant'}`}></div>
                    </div>
                    <p className="font-bold text-sm mb-1">{policy.label}</p>
                    <p className="text-[12px] text-on-surface-variant font-medium">{policy.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Section: Media */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">COVER PHOTO</label>
              <div className="relative group">
                <div className={`w-full aspect-[21/9] rounded-xl overflow-hidden border-2 border-dashed flex flex-col items-center justify-center transition-all cursor-pointer ${createForm.previewUrl ? 'border-primary' : 'border-outline-variant bg-surface-container-low hover:bg-surface-container hover:border-primary'
                  }`}>
                  {createForm.previewUrl ? (
                    <img src={createForm.previewUrl} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <>
                      <div className="p-4 rounded-full bg-white shadow-sm mb-3">
                        <span className="material-symbols-outlined text-primary text-3xl">upload_file</span>
                      </div>
                      <p className="font-bold text-sm">Click to upload or drag and drop</p>
                      <p className="text-[12px] text-outline font-medium mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                    </>
                  )}
                </div>
                <input
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>

              {createForm.previewUrl && (
                <div className="mt-4 flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">
                  <div className="w-12 h-12 rounded bg-outline-variant/20 flex items-center justify-center overflow-hidden">
                    <img src={createForm.previewUrl} className="w-full h-full object-cover" alt="Small Preview" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-on-surface">{createForm.coverImage?.name}</p>
                    <p className="text-[10px] text-outline font-medium">{(createForm.coverImage?.size || 0 / 1024 / 1024).toFixed(1)} MB • Ready to upload</p>
                  </div>
                  <button
                    onClick={() => setCreateForm(prev => ({ ...prev, coverImage: null, previewUrl: null }))}
                    className="ml-auto text-error hover:bg-error-container/20 p-2 rounded-full transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              )}
            </section>

            <div className="h-8"></div>
          </main>
        </div>
      )}
      {/* Persistent Bottom Sheet */}
      {sheetState === 'half' && (
        <div
          onClick={() => {
            setSheetState('minimized');
            if (searchParams.get('view')) router.replace(pathname);
          }}
          className="fixed inset-0 bg-black/40 z-40 pointer-events-auto animate-in fade-in duration-200"
        />
      )}

      <div
        className="fixed inset-x-0 bottom-0 z-50 bg-white shadow-[0_-8px_30px_rgb(0,0,0,0.08)] rounded-t-[32px] border-t border-slate-50 flex flex-col transition-transform duration-300 ease-out h-full"
        style={{ transform: `translateY(${sheetState === 'minimized' ? 'calc(100% - 100px)' : '50%'})` }}
      >
        {/* Handle & Header Section */}
        <div
          className="pt-3 px-6 cursor-pointer pb-1 touch-none"
          onClick={() => {
            const nextState = sheetState === 'minimized' ? 'half' : 'minimized';
            setSheetState(nextState);
            if (nextState === 'minimized' && searchParams.get('view')) {
              router.replace(pathname);
            }
          }}
        >
          {/* Handle Bar Container */}
          <div className="relative flex items-center justify-center mb-6">
            {/* Handle Bar */}
            <div className="w-10 h-1.5 bg-slate-200 rounded-full"></div>
            {/* My Groups Label */}
            <span className="absolute right-0 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              My Groups ({userJoinedGroups.length})
            </span>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto px-6 pb-20 custom-scrollbar touch-pan-y ${sheetState === 'minimized' ? 'overflow-hidden' : ''}`}>
          <div className="space-y-3">
            {userJoinedGroups.length > 0 ? userJoinedGroups.map((group) => (
              <div
                key={group.id}
                onClick={() => { router.push(`/group/${group.id}`); }}
                className="flex items-center p-3 -mx-3 rounded-2xl hover:bg-slate-50 transition-colors group cursor-pointer active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center overflow-hidden mr-4 shadow-sm">
                  {group.coverImage ? (
                    <img src={group.coverImage} className="w-full h-full object-cover" alt={group.name} />
                  ) : (
                    <span className="material-symbols-outlined text-slate-400">groups</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{group.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      <span>{group.memberCount || 0}</span>
                    </div>
                    <span>•</span>
                    <span>{group.tags?.[0] || 'Member'}</span>
                  </div>
                </div>
                <div className="text-slate-400 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </div>
            )) : (
              <div className="py-10 text-center space-y-4">
                <p className="text-slate-400 text-sm font-medium">You haven't joined any groups yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}

export default function GroupsDiscoveryPage() {
  return (
    <Suspense fallback={
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <GroupsContent />
    </Suspense>
  );
}


