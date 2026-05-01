'use client';

import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Navigation, 
  Star, 
  Clock, 
  ExternalLink,
  ChevronDown,
  Search,
  CheckCircle2
} from 'lucide-react';

const REGIONS = ['All', 'Seoul', 'Gyeonggi/Incheon', 'Busan/Gyeongnam', 'Daegu/Gyeongbuk', 'Gwangju/Jeonla', 'Daejeon/Chungcheong', 'Gangwon', 'Jeju'];
const CATEGORIES = ['All', 'Studio', 'Milonga Venue', 'Other'];

const MOCK_PLACES = [
  {
    id: '1',
    name: 'Hapjeong Turn',
    category: 'Milonga Venue',
    address: 'Hapjeong-dong 123-4, Mapo-gu, Seoul',
    region: 'Seoul',
    rating: 4.8,
    reviews: 124,
    image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=600&auto=format&fit=crop',
    tags: ['Great Floor', 'Best Sound', 'Near Station']
  },
  {
    id: '2',
    name: 'Gangnam Ocho',
    category: 'Studio',
    address: 'Yeoksam-dong 567-8, Gangnam-gu, Seoul',
    region: 'Seoul',
    rating: 4.9,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=600&auto=format&fit=crop',
    tags: ['Practice Room', 'Large Mirror', 'Parking']
  },
  {
    id: '3',
    name: 'Busan Tango Azit',
    category: 'Milonga Venue',
    address: 'Udong 99-1, Haeundae-gu, Busan',
    region: 'Busan/Gyeongnam',
    rating: 4.7,
    reviews: 56,
    image: 'https://images.unsplash.com/photo-1516939884489-79bb5580ffef?q=80&w=600&auto=format&fit=crop',
    tags: ['Ocean View', 'Great Atmosphere']
  }
];

export default function PlacePageClient() {
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  useEffect(() => {
    const savedRegion = localStorage.getItem('woc_selected_region');
    if (savedRegion && REGIONS.includes(savedRegion)) {
      setSelectedRegion(savedRegion);
    }
  }, []);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    localStorage.setItem('woc_selected_region', region);
    setIsRegionOpen(false);
  };

  const filteredPlaces = MOCK_PLACES.filter(place => {
    const regionMatch = selectedRegion === 'All' || place.region === selectedRegion;
    const categoryMatch = selectedCategory === 'All' || place.category === selectedCategory;
    return regionMatch && categoryMatch;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Search & Filter Header */}
      <div className="sticky top-14 bg-background/80 backdrop-blur-xl border-b border-glass-border z-20 px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search by name or address"
              className="w-full bg-black/5 border-none rounded-2xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setIsRegionOpen(!isRegionOpen)}
              className="h-full flex items-center gap-1.5 px-4 bg-black/5 rounded-2xl text-sm font-bold hover:bg-black/10 transition-colors"
            >
              {selectedRegion} <ChevronDown size={14} className={isRegionOpen ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            
            {isRegionOpen && (
              <div className="absolute top-full right-0 mt-2 w-40 bg-background border border-glass-border rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95">
                {REGIONS.map(region => (
                  <button
                    key={region}
                    onClick={() => handleRegionChange(region)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-black/5 transition-colors ${selectedRegion === region ? 'text-primary font-bold' : ''}`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                : 'bg-black/5 text-muted-foreground hover:bg-black/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Place Grid */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredPlaces.map(place => (
          <div key={place.id} className="group bg-glass border border-glass-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src={place.image} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt={place.name}
              />
              <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[10px] font-bold text-primary shadow-sm uppercase tracking-wider">
                {place.category}
              </div>
              <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-muted-foreground hover:text-red-500 transition-colors shadow-sm">
                <Star size={16} />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{place.name}</h3>
                <div className="flex items-center gap-1 text-sm font-bold">
                  <Star size={14} className="fill-yellow-400 text-yellow-400" />
                  {place.rating}
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
                <MapPin size={12} /> {place.address}
              </div>

              <div className="flex gap-1.5 flex-wrap pt-1">
                {place.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-black/5 rounded-md text-[10px] text-muted-foreground font-medium">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="pt-2 flex gap-2">
                <button className="flex-1 bg-primary/5 text-primary text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 hover:bg-primary/10 transition-colors">
                  <Navigation size={14} /> Directions
                </button>
                <button className="px-3 bg-black/5 text-muted-foreground rounded-xl hover:bg-black/10 transition-colors">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPlaces.length === 0 && (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
            <MapPin size={32} />
          </div>
          <div className="text-muted-foreground text-sm font-medium">No results found.</div>
        </div>
      )}

      {/* Floating Action Button (Optional for adding new place) */}
      <button className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30">
        <CheckCircle2 size={24} />
      </button>
    </div>
  );
}
