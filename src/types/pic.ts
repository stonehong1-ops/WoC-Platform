export interface Pic {
  id: string;
  title: string;
  slug: string;

  imageUrl: string;
  thumbnailUrl?: string;

  mood: string;
  activity: string;
  season: string;
  timeOfDay?: string;

  tags: string[];

  orientation: 'portrait' | 'square' | 'landscape';

  brightness: number; // 0 (dark) to 100 (light)
  contrastSafe: boolean;

  typographySafeZone: {
    top: number; // percentage (0-100)
    left: number; // percentage (0-100)
    width: number; // percentage (0-100)
    height: number; // percentage (0-100)
  };

  featured: boolean;
  premium: boolean;

  sortOrder: number;

  createdAt: number; // Timestamp ms
  updatedAt: number; // Timestamp ms
}
