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
import { doc, getDoc, updateDoc, collection, getDocs, query } from 'firebase/firestore';
import MyGroupsTray from '@/components/groups/MyGroupsTray';
import { useLanguage } from '@/contexts/LanguageContext';

import { Suspense } from 'react';

function GroupsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, profile, setShowLogin } = useAuth();
  const { t } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // URL Params based state
  const selectedCategory = searchParams.get('category');

  // Navigation Handlers
  const openCategoryModal = (category: string) => {
    router.push(`${pathname}?category=${category}`, { scroll: false });
  };

  const openCreateModal = () => {
    setIsCreateOpen(true);
    // Push dummy state for back button handling
    window.history.pushState({ modal: 'create' }, '');
  };

  // My groups is now handled entirely by the MyGroupsTray component
  const openMyGroups = () => {
    // Left for potential external triggers, though tray handles its own state
  };

  const closeModals = () => {
    if (selectedCategory) {
      // If we are in a URL-based popup, we use router.back()
      // But if there's no history (direct entry), we replace to base path
      if (window.history.length <= 1) {
        router.replace(pathname);
      } else {
        router.back();
      }
    } else {
      // For state-based modals, we manually close and pop state if needed
      setIsCreateOpen(false);
      if (window.history.state?.modal) {
        window.history.back();
      }
    }
  };

  // Popstate listener for transient (state-based) modals
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // If the back button is pressed, close all state-based modals
      setIsCreateOpen(false);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 스크롤 먹통 방지
  useEffect(() => {
    if (isCreateOpen || selectedCategory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCreateOpen, selectedCategory]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupService.getGroups();
      setGroups(data);
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(err.message || t('groups.alert_create_failed')); // Using failed fallback for general error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  // Handle URL Search Params for specialized header triggers (Initial Load)
  useEffect(() => {
    const action = searchParams.get('action');
    const view = searchParams.get('view');

    if (action === 'create' && !isCreateOpen) {
      setIsCreateOpen(true);
      window.history.replaceState({ modal: 'create' }, '');
    }
  }, [searchParams, isCreateOpen]);

  // Listen to global compose event
  useEffect(() => {
    const handleComposeOpen = (e: CustomEvent) => {
      if (e.detail?.id === 'groups') {
        openCreateModal();
      }
    };
    window.addEventListener('woc:compose:open', handleComposeOpen as EventListener);
    return () => window.removeEventListener('woc:compose:open', handleComposeOpen as EventListener);
  }, []);


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
      alert(t('groups.alert_name_required'));
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
          name: profile?.nickname || user.displayName || t('groups.leader_fallback'),
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
        name: profile?.nickname || user.displayName || t('groups.leader_fallback'),
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
      alert(t('groups.alert_create_failed'));
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
              <p className="text-on-surface-variant text-sm font-medium">{t('groups.whats_new_desc')}</p>
            </div>
            <button
              onClick={() => { openCategoryModal('All'); }}
              className="text-primary font-bold text-sm flex items-center gap-1 group"
            >
              {t('groups.view_all')} <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
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
                      <span className="material-symbols-outlined text-[12px]">location_on</span> {group.address || t('groups.venue_fallback')}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-20 text-white">
                    <h3 className="text-lg font-bold font-headline mb-0.5 w-full truncate">
                      {group.name}
                      {group.nativeName && <span className="text-[0.8em] font-medium text-white/90 ml-1.5">{group.nativeName}</span>}
                    </h3>
                    <p className="text-white/80 text-xs line-clamp-1 mt-1">{group.memberCount} {t('groups.member_count_label')} • {group.tags?.[0] ? t(`groups.cat_${group.tags[0].toLowerCase()}`) : t('groups.community_fallback')}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="w-full text-center py-10 text-on-surface-variant/50 font-medium">{t('groups.no_whats_new')}</div>
            )}
          </div>
        </section>

        {/* Integrated Group Action */}
        <div className="px-6 py-2 flex items-center justify-between bg-white border-b border-slate-50">
          <p className="text-[12px] font-bold text-slate-400 uppercase tracking-tight">
            {t('groups.start_community_label')}
          </p>
          <button 
            onClick={openCreateModal}
            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 transition-colors py-2"
          >
            <span className="text-[13px] font-bold">{t('groups.create_button')}</span>
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
          </button>
        </div>

        {/* Category Best Section */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-extrabold font-headline tracking-tight text-on-background">Category Best</h2>
            <p className="text-on-surface-variant text-sm font-medium">{t('groups.category_best_desc')}</p>
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
                  <span className={`${cat.text} font-black font-headline text-lg uppercase italic`}>{t(`groups.cat_${cat.id.toLowerCase()}`)}</span>
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
        <div className="fixed inset-0 z-[110] bg-background overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 pt-16">
          <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-md z-[120] border-b border-slate-100">
            <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeModals}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-on-surface"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold font-headline text-on-surface">
                  {selectedCategory === 'All' ? t('groups.discover_all') : `${t('groups.category_title_prefix')}${t(`groups.cat_${selectedCategory.toLowerCase()}`)}`}
                </h1>
              </div>
            </div>
          </header>

          <main className="max-w-2xl mx-auto px-4 space-y-6 pb-20 pt-8">
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
                      {t('groups.featured_badge')}
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
                    <div className="min-w-0 flex-1 pr-4">
                      <h2 className="text-xl font-bold font-headline text-on-surface mb-1 w-full truncate">
                        {group.name}
                        {group.nativeName && <span className="text-[0.8em] font-medium text-on-surface-variant ml-1.5">{group.nativeName}</span>}
                      </h2>
                      <div className="flex items-center gap-2 text-on-surface-variant text-xs mt-1.5">
                        <span className="material-symbols-outlined text-[14px]">person</span>
                        <span>{t('groups.owned_by')}{group.representative?.name || t('groups.leader_fallback')}</span>
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
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">{t('groups.open_to_join')}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Join logic would go here
                      }}
                      className="bg-gradient-to-br from-primary to-[#4d8eff] text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-blue-100 active:scale-95 transition-all text-sm"
                    >
                      {t('groups.join_button')}
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
        <div className="fixed inset-0 z-[130] bg-surface overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300 pt-16">
          <header className="fixed top-0 left-0 right-0 z-[140] bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm flex justify-between items-center w-full px-6 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={closeModals}
                className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-200 transition-colors active:scale-95 duration-150 text-gray-500"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
              <h1 className="font-headline text-lg font-bold text-on-surface">{t('groups.create_modal_title')}</h1>
            </div>
            <button
              onClick={handleCreateSubmit}
              disabled={createLoading}
              className="bg-primary text-on-primary px-6 py-2 rounded-lg font-headline font-bold text-sm hover:brightness-110 active:scale-95 transition-all duration-150 shadow-md disabled:opacity-50"
            >
              {createLoading ? t('groups.save_button_loading') : t('groups.save_button')}
            </button>
          </header>

          <main className="pt-8 pb-20 px-6 max-w-[896px] mx-auto space-y-6">
            {/* Section: Basic Info */}
             <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">{t('groups.form_name_label')}</label>
                  <input
                    className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg p-3 text-on-surface font-medium transition-all"
                    placeholder={t('groups.form_name_placeholder')}
                    type="text"
                    value={createForm.name}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-outline">{t('groups.form_description_label')}</label>
                  <textarea
                    className="w-full bg-surface-container-low border-transparent focus:border-primary focus:ring-0 rounded-lg p-3 text-on-surface font-medium transition-all resize-none"
                    placeholder={t('groups.form_description_placeholder')}
                    rows={4}
                    value={createForm.description}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  ></textarea>
                </div>
              </div>
            </section>

            {/* Section: Category */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">{t('groups.form_category_label')}</label>
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
                    <span className={`text-[12px] font-semibold ${createForm.category === cat.id ? 'text-primary' : 'text-on-surface-variant'}`}>{t(`groups.cat_${cat.id.toLowerCase()}`)}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Section: Membership Strategy */}
            <section className="bg-white rounded-[12px] p-6 shadow-sm border border-outline-variant/30">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">{t('groups.form_policy_label')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'open', label: t('groups.policy_open_label'), icon: 'public', desc: t('groups.policy_open_desc') },
                  { id: 'approval', label: t('groups.policy_approval_label'), icon: 'verified_user', desc: t('groups.policy_approval_desc') },
                  { id: 'invite', label: t('groups.policy_invite_label'), icon: 'mail', desc: t('groups.policy_invite_desc') }
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-outline mb-4">{t('groups.form_cover_label')}</label>
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
                      <p className="font-bold text-sm">{t('groups.upload_instruction')}</p>
                      <p className="text-[12px] text-outline font-medium mt-1">{t('groups.upload_limits')}</p>
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
                    <p className="text-[10px] text-outline font-medium">{(createForm.coverImage?.size || 0 / 1024 / 1024).toFixed(1)} MB • {t('groups.upload_ready')}</p>
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
      {/* Floating Action Button (Tray) for My Groups */}
      {userJoinedGroups.length > 0 && (
        <MyGroupsTray groups={userJoinedGroups} />
      )}

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


