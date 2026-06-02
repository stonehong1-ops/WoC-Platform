import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { doc, getDoc, updateDoc, collection, getDocs, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { groupService } from '@/lib/firebase/groupService';
import { Group, Member } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';

export function useGroupsData() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { user, profile, setShowLogin } = useAuth();
  const { t, language } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Create Group State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [venueType, setVenueType] = useState<'online' | 'venue' | ''>('');
  const [venueSearch, setVenueSearch] = useState('');
  const [venueResults, setVenueResults] = useState<any[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<any>(null);
  const [venueSearchLoading, setVenueSearchLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    category: 'Studio',
    joinPolicy: 'open',
  });

  const lastBackPressTime = useRef<number>(0);

  // URL Params based state
  const selectedCategory = searchParams.get('category');

  const userJoinedGroups = useMemo(() => {
    if (!user) return [];
    return groups.filter(g => {
      const inJoinedGroups = profile?.joinedGroups && profile.joinedGroups.includes(g.id);
      const inMemberIds = (g as any).memberIds && Array.isArray((g as any).memberIds) && (g as any).memberIds.includes(user.uid);
      const isOwner = g.ownerId === user.uid;
      return inJoinedGroups || inMemberIds || isOwner;
    });
  }, [user, profile?.joinedGroups, groups]);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await groupService.getGroups();

      const needsVenue = data.filter((g: any) => g.venueId && !g.address);
      if (needsVenue.length > 0) {
        const venueIds = Array.from(new Set(needsVenue.map((g: any) => g.venueId)));
        const venueMap = new Map<string, string>();
        
        await Promise.all(venueIds.map(async (vid) => {
          try {
            const vSnap = await getDoc(doc(db, 'venues', vid as string));
            if (vSnap.exists()) {
              const vData = vSnap.data();
              venueMap.set(vid as string, vData.address || vData.city || '');
            }
          } catch (_) { /* skip */ }
        }));

        data.forEach((g: any) => {
          if (g.venueId && !g.address && venueMap.has(g.venueId)) {
            g.address = venueMap.get(g.venueId);
          }
        });
      }

      setGroups(data);
    } catch (err: any) {
      console.error('Error fetching groups:', err);
      setError(err.message || t('groups.alert_create_failed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Scroll block and global navigation visibility control
  useEffect(() => {
    const isModalActive = !!(isCreateOpen || selectedCategory || selectedGroup);
    if (isModalActive) {
      document.body.style.overflow = 'hidden';
      setGlobalNavHidden(true);
    } else {
      document.body.style.overflow = '';
      setGlobalNavHidden(false);
    }
    return () => {
      document.body.style.overflow = '';
      setGlobalNavHidden(false);
    };
  }, [isCreateOpen, selectedCategory, selectedGroup, setGlobalNavHidden]);

  // Watch URL params for specialized header triggers
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create' && !isCreateOpen) {
      setIsCreateOpen(true);
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
      if (user?.email === 'stonehong1@gmail.com' && typeof window !== 'undefined' && !localStorage.getItem('category_migrated_v3')) {
        try {
          const venuesSnap = await getDocs(query(collection(db, 'venues')));
          const venuesMap = new Map();
          venuesSnap.docs.forEach(d => venuesMap.set(d.id, d.data()));

          const groupsSnap = await getDocs(query(collection(db, 'groups')));

          let count = 0;
          for (const gDoc of groupsSnap.docs) {
            const groupData = gDoc.data();
            if (groupData.venueId && venuesMap.has(groupData.venueId)) {
              const venue = venuesMap.get(groupData.venueId);
              if (venue.category && (!groupData.tags || groupData.tags.length === 0 || groupData.tags.includes('Studio'))) {
                const catMap = ['Studio', 'Shop', 'Academy', 'Stay', 'Rental', 'Beauty', 'Wellness', 'Restaurant', 'Cafe', 'Office'];
                const targetCat = catMap.find(c => venue.category.toLowerCase().includes(c.toLowerCase())) || 'Studio';

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
                }
              }
            }
          }

          localStorage.setItem('category_migrated_v3', 'true');
          fetchGroups();
        } catch (e) {
          console.error('Migration error:', e);
        }
      }
    };
    if (user && groups.length > 0) {
      runMigration();
    }
  }, [user, groups.length, fetchGroups]);

  const handleCreateClose = () => setIsCreateOpen(false);

  const handleGroupBeforeClose = useCallback(() => {
    const now = Date.now();
    if (now - lastBackPressTime.current < 2000) {
      lastBackPressTime.current = 0;
      return true;
    } else {
      lastBackPressTime.current = now;
      import('sonner').then(({ toast }) => toast('한 번 더 누르시면 이 방에서 나가게 됩니다.', {
        position: 'bottom-center',
        duration: 2000,
        style: { marginBottom: '100px' }
      }));
      return false;
    }
  }, []);

  const handleGroupClose = () => setSelectedGroup(null);

  const openCategoryModal = (category: string) => {
    router.push(`${pathname}?category=${category}`, { scroll: false });
  };

  const openCreateModal = () => {
    setIsCreateOpen(true);
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
  };

  const closeModals = () => {
    if (selectedGroup) {
      handleGroupClose();
    } else if (selectedCategory) {
      if (window.history.length <= 1) {
        router.replace(pathname);
      } else {
        router.back();
      }
    } else if (isCreateOpen) {
      handleCreateClose();
    }
  };

  const publishedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const getTime = (val: any) => {
        if (!val) return 0;
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'object' && val.toMillis) return val.toMillis();
        if (typeof val === 'number') return val;
        return 0;
      };
      return getTime(b.updatedAt) - getTime(a.updatedAt);
    });
  }, [groups]);

  const whatsNewGroups = useMemo(() => {
    return publishedGroups.slice(0, 10);
  }, [publishedGroups]);

  const categoryCounts = useMemo(() => {
    return {
      Studio: publishedGroups.filter(g => g.activeServices?.class || g.tags?.includes('Studio') || (!g.tags || g.tags.length === 0)).length,
      Shop: publishedGroups.filter(g => g.activeServices?.shop || g.tags?.includes('Shop')).length,
      Academy: publishedGroups.filter(g => g.tags?.includes('Academy')).length,
      Stay: publishedGroups.filter(g => g.activeServices?.stay || g.tags?.includes('Stay')).length,
      Rental: publishedGroups.filter(g => g.activeServices?.rental || g.tags?.includes('Rental')).length,
      Beauty: publishedGroups.filter(g => g.activeServices?.beauty || g.tags?.includes('Beauty')).length,
      Wellness: publishedGroups.filter(g => g.activeServices?.wellness || g.tags?.includes('Wellness')).length,
      Restaurant: publishedGroups.filter(g => g.activeServices?.restaurant || g.tags?.includes('Restaurant')).length,
      Cafe: publishedGroups.filter(g => g.activeServices?.cafe || g.tags?.includes('Cafe')).length,
      Office: publishedGroups.filter(g => g.activeServices?.office || g.tags?.includes('Office')).length,
    };
  }, [publishedGroups]);

  const getFilteredGroups = useCallback(() => {
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
        (selectedCategory === 'Academy' && g.tags?.includes('Academy'));
    });
  }, [selectedCategory, publishedGroups]);

  const handleVenueSearch = async (searchTerm: string) => {
    setVenueSearch(searchTerm);
    if (searchTerm.length < 2) {
      setVenueResults([]);
      return;
    }
    setVenueSearchLoading(true);
    try {
      const venuesSnap = await getDocs(query(collection(db, 'venues')));
      const results = venuesSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter((v: any) => v.name?.toLowerCase().includes(searchTerm.toLowerCase()));
      setVenueResults(results);
    } catch (e) {
      console.error('Venue search error:', e);
    } finally {
      setVenueSearchLoading(false);
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
      const activeServices = {
        class: createForm.category === 'Studio',
        shop: createForm.category === 'Shop',
        stay: createForm.category === 'Stay',
        rental: createForm.category === 'Rental',
        beauty: createForm.category === 'Beauty',
        wellness: createForm.category === 'Wellness',
        restaurant: createForm.category === 'Restaurant',
        cafe: createForm.category === 'Cafe',
        office: createForm.category === 'Office'
      };

      const newGroupData: Partial<Group> = {
        name: createForm.name,
        description: createForm.description,
        coverImage: '',
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

      if (venueType === 'venue' && selectedVenue) {
        newGroupData.venueId = selectedVenue.id;
      }

      const memberData: Omit<Member, 'id'> = {
        name: profile?.nickname || user.displayName || t('groups.leader_fallback'),
        avatar: profile?.photoURL || user.photoURL || '',
      };

      await groupService.createGroup(newGroupData, user.uid, memberData);

      setCreateForm({
        name: '',
        description: '',
        category: 'Studio',
        joinPolicy: 'open',
      });
      setVenueType('');
      setSelectedVenue(null);
      setVenueSearch('');
      setVenueResults([]);
      handleCreateClose();
      fetchGroups();
    } catch (error) {
      console.error('Error creating group:', error);
      alert(t('groups.alert_create_failed'));
    } finally {
      setCreateLoading(false);
    }
  };

  return {
    router,
    searchParams,
    pathname,
    user,
    profile,
    setShowLogin,
    t,
    language,
    groups,
    loading,
    error,
    selectedGroup,
    setSelectedGroup,
    isCreateOpen,
    setIsCreateOpen,
    createLoading,
    venueType,
    setVenueType,
    venueSearch,
    setVenueSearch,
    venueResults,
    setVenueResults,
    selectedVenue,
    setSelectedVenue,
    venueSearchLoading,
    createForm,
    setCreateForm,
    selectedCategory,
    userJoinedGroups,
    whatsNewGroups,
    categoryCounts,
    publishedGroups,
    handleCreateClose,
    handleGroupBeforeClose,
    handleGroupClose,
    openCategoryModal,
    openCreateModal,
    handleGroupSelect,
    closeModals,
    getFilteredGroups,
    handleVenueSearch,
    handleCreateSubmit,
    fetchGroups
  };
}
