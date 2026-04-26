import { Timestamp } from 'firebase/firestore';

export type VenueType = 'Studio' | 'Club' | 'Academy' | 'Shop' | 'Cafe' | 'Eats' | 'Beauty' | 'Stay' | 'Other';

export interface Venue {
  id: string;
  name: string;
  nameKo?: string; // Korean name (e.g. 탱고라이프)
  types: VenueType[];
  category: VenueType; // Primary category for map filtering
  address: string;
  region: string; 
  country?: string; // e.g. 'KOREA', 'JAPAN'
  city: string; // Compatible with legacy map scripts
  district: string;
  status: 'active' | 'inactive';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  createdAt: Timestamp;
  // Optional UI Fields
  imageUrl?: string;
  rating?: number;
  price?: string;
  owner?: string;
  contact?: string;
  isRepresentative?: boolean;
}
