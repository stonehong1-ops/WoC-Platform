import { 
  Globe, Map, ShoppingBag, MessageSquare, 
  Users, Library, FileText, MapPin, 
  Store, Tent, Calendar, Cpu, 
  Heart, Wallet, Settings, Image, Boxes
} from 'lucide-react';

export type NavGroup = 'Tango World' | 'Activity' | 'Space' | 'My Page';

export interface NavItem {
  id: string;
  label: string;
  group: NavGroup;
  icon: any;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  // Tango World
  { id: 'home', label: '홈', group: 'Tango World', icon: Map, href: '/home' },
  { id: 'plaza', label: '프라자', group: 'Tango World', icon: Library, href: '/plaza' },
  { id: 'venues', label: '장소(베뉴)', group: 'Tango World', icon: MapPin, href: '/venues' },
  { id: 'groups', label: '그룹', group: 'Tango World', icon: Users, href: '/groups' },

  // Activity
  { id: 'events', label: '이벤트', group: 'Activity', icon: Calendar, href: '/events' },
  { id: 'social', label: '소셜', group: 'Activity', icon: Heart, href: '/social' },
  { id: 'gallery', label: '갤러리', group: 'Activity', icon: Image, href: '/gallery' },
  { id: 'class', label: '클래스', group: 'Activity', icon: Library, href: '/class' },
  
  // Space
  { id: 'shop', label: '숍', group: 'Space', icon: ShoppingBag, href: '/shop' },
  { id: 'resale', label: '리세일', group: 'Space', icon: Store, href: '/resale' },
  { id: 'stay', label: '스테이', group: 'Space', icon: Tent, href: '/stay' },
  { id: 'lost', label: '분실물', group: 'Space', icon: MessageSquare, href: '/lost' },
  { id: 'arcade', label: '아케이드', group: 'Space', icon: Cpu, href: '/arcade' },
  
  // My Page
  { id: 'wallet', label: '지갑', group: 'My Page', icon: Wallet, href: '/wallet' },
  { id: 'history', label: '히스토리', group: 'My Page', icon: MessageSquare, href: '/history' },
  { id: 'my-info', label: '내 정보', group: 'My Page', icon: Settings, href: '/my-info' },
];
