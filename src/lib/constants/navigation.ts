import { 
  Globe, Map, ShoppingBag, MessageSquare, 
  Users, Library, FileText, MapPin, 
  Store, Tent, Calendar, Cpu, 
  Heart, Wallet, Settings 
} from 'lucide-react';

export type NavGroup = 'World' | 'Tango Korea' | 'Town' | 'My Page';

export interface NavItem {
  id: string;
  label: string;
  group: NavGroup;
  icon: any;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  // Tango Korea
  { id: 'social', label: '소셜', group: 'Tango Korea', icon: Map, href: '/social' },
  { id: 'class', label: '클래스', group: 'Tango Korea', icon: Library, href: '/class' },
  { id: 'feed', label: '피드', group: 'Tango Korea', icon: MessageSquare, href: '/feed' },
  { id: 'community', label: '커뮤니티', group: 'Tango Korea', icon: Users, href: '/community' },
  { id: 'place', label: '장소', group: 'Tango Korea', icon: MapPin, href: '/place' },

  // World
  { id: 'market', label: '마켓', group: 'World', icon: ShoppingBag, href: '/market' },
  { id: 'worldmap', label: '월드맵', group: 'World', icon: Globe, href: '/worldmap' },
  
  // Town
  { id: 'flea', label: '플리마켓', group: 'Town', icon: Store, href: '/flea' },
  { id: 'couch', label: '카우치', group: 'Town', icon: Tent, href: '/couch' },
  { id: 'reserv', label: '예약', group: 'Town', icon: Calendar, href: '/reserv' },
  { id: 'ailab', label: 'AI Lab', group: 'Town', icon: Cpu, href: '/ailab' },
  
  // My Page
  { id: 'life', label: '탱고라이프', group: 'My Page', icon: Heart, href: '/life' },
  { id: 'wallet', label: '지갑', group: 'My Page', icon: Wallet, href: '/wallet' },
  { id: 'settings', label: '설정', group: 'My Page', icon: Settings, href: '/settings' },
];
