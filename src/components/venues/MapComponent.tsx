"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, Marker, Autocomplete } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from '@/components/providers/LocationProvider';
import { db } from '@/lib/firebase/clientApp';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { CITY_COORDINATES, DEFAULT_COORDINATES } from '@/lib/constants/locations';
import { useRouter } from 'next/navigation';
import { OverlayView } from '@react-google-maps/api';
import useSupercluster from 'use-supercluster';

interface Venue {
  id: string;
  name: string;
  nameKo?: string;
  category: string;
  coordinates: { latitude: number; longitude: number; };
  address: string;
  city: string;
  status: string;
  imageUrl?: string;
  brand?: string;
}

const mapContainerStyle = { width: '100%', height: '100dvh' };
const CIRCLE_PATH = 0;

const getKakaoMapUrl = (v: Venue) => `https://map.kakao.com/link/map/${v.nameKo || v.name},${v.coordinates.latitude},${v.coordinates.longitude}`;
const getNaverMapUrl = (v: Venue) => `https://map.naver.com/v5/search/${v.nameKo || v.name}?c=${v.coordinates.longitude},${v.coordinates.latitude},15,0,0,0,dh`;
const getGoogleMapUrl = (v: Venue) => `https://www.google.com/maps/search/?api=1&query=${v.coordinates.latitude},${v.coordinates.longitude}`;

export default function MapComponent({ 
  onRegisterOpen, 
  onEdit, 
  onDelete, 
  isLoaded 
}: { 
  onRegisterOpen: () => void; 
  onEdit: (venue: Venue, mode?: 'edit' | 'geo') => void;
  onDelete: (id: string) => void;
  isLoaded: boolean; 
}) {
  const { location } = useLocation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [mapBounds, setMapBounds] = useState<[number, number, number, number] | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(14);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [showBrandFilter, setShowBrandFilter] = useState(false);
  const router = useRouter();

  const categories = ['All', 'Studio', 'Shop', 'Stay', 'Beauty', 'Club', 'Academy', 'Cafe', 'Eats', 'Other'];

  useEffect(() => {
    if (!map) return;
    // Sync map center/zoom when location from context changes via map instance
    const coords = (location?.city && location.city !== 'ALL' && CITY_COORDINATES[location.city.toUpperCase()])
      ? CITY_COORDINATES[location.city.toUpperCase()]
      : (CITY_COORDINATES[location.country.toUpperCase()] || DEFAULT_COORDINATES);
    
    map.panTo({ lat: coords.lat, lng: coords.lng });
    map.setZoom(coords.zoom);
    
    // Also update state for filtering
    setCenter({ lat: coords.lat, lng: coords.lng });
    setZoom(coords.zoom);
  }, [location, map]);

  useEffect(() => {
    // Fetch all active venues globally to allow seamless discovery across bounds
    const q = query(collection(db, "venues"), where("status", "==", "active"));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));
      setVenues(docs.filter(v => v.coordinates?.latitude && v.coordinates?.longitude));
    });
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) return 999999;
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const dist = R * c;
    return isNaN(dist) ? 999999 : dist;
  };

  const isWithinBounds = (lat: number, lng: number) => {
    if (!map) return true;
    const currentBounds = map.getBounds();
    if (!currentBounds) return true;
    return currentBounds.contains({ lat, lng });
  };

  const brands = useMemo(() => {
    const bs = Array.from(new Set(venues.map(v => (v as any).brand).filter(Boolean)));
    return ['All', ...bs.sort()];
  }, [venues]);

  const filteredVenues = useMemo(() => {
    let result = venues;

    // 1. Filter by categories
    if (!selectedCategories.includes('All')) {
      result = result.filter(v => selectedCategories.includes(v.category));
    }

    // 2. Filter by brand
    if (selectedBrand !== 'All') {
      result = result.filter(v => (v as any).brand === selectedBrand);
    }

    // 3. Conditional filter: Bounds (only when NO search term)
    if (!searchTerm && map) {
      result = result.filter(v => isWithinBounds(v.coordinates.latitude, v.coordinates.longitude));
    }

    // 3. Filter by search term (Global)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(lowerSearch) || 
        (v.nameKo && v.nameKo.toLowerCase().includes(lowerSearch)) ||
        v.address.toLowerCase().includes(lowerSearch)
      );
    }

    // 4. Sort by distance from current center state
    if (center) {
      result = [...result].sort((a, b) => {
        const distA = calculateDistance(center.lat, center.lng, a.coordinates.latitude, a.coordinates.longitude);
        const distB = calculateDistance(center.lat, center.lng, b.coordinates.latitude, b.coordinates.longitude);
        return distA - distB;
      });
    }

    return result;
  }, [venues, selectedCategories, searchTerm, center, bounds]); // bounds dependency for re-filtering on move

  const points = useMemo(() => {
    return filteredVenues.map(venue => ({
      type: "Feature" as const,
      properties: { cluster: false, venueId: venue.id, venue },
      geometry: {
        type: "Point" as const,
        coordinates: [
          venue.coordinates.longitude,
          venue.coordinates.latitude
        ]
      }
    }));
  }, [filteredVenues]);

  const { clusters, supercluster } = useSupercluster({
    points,
    bounds: mapBounds ? mapBounds : undefined,
    zoom,
    options: { radius: 60, maxZoom: 15 }
  });

  useEffect(() => {
    if (!isExpanded) {
      setSearchTerm('');
    }
  }, [isExpanded]);

  const toggleCategory = (cat: string) => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
    } else {
      // ?⑥씪 ?좏깮: ?대? ?좏깮??移댄뀒怨좊━ ?대┃ ??All濡?蹂듦?
      setSelectedCategories(prev =>
        prev.length === 1 && prev[0] === cat ? ['All'] : [cat]
      );
    }
  };

  const sortedFilteredVenues = useMemo(() => {
    if (!selectedVenueId) return filteredVenues;
    const selectedIdx = filteredVenues.findIndex(v => v.id === selectedVenueId);
    if (selectedIdx === -1) return filteredVenues;
    
    const result = [...filteredVenues];
    const [selected] = result.splice(selectedIdx, 1);
    return [selected, ...result];
  }, [filteredVenues, selectedVenueId]);

  const labelScale = useMemo(() => {
    if (zoom <= 14) return 1;
    return 1 + (zoom - 14) * 0.15;
  }, [zoom]);

  const handleEnterKey = () => {
    if (!searchTerm) return;
    const service = new google.maps.places.AutocompleteService();
    service.getPlacePredictions({ input: searchTerm }, (predictions) => {
      if (predictions && predictions.length > 0) {
        const ds = new google.maps.places.PlacesService(document.createElement('div'));
        ds.getDetails({ placeId: predictions[0].place_id }, (place) => {
          if (place?.geometry?.location) {
            map?.panTo(place.geometry.location);
            map?.setZoom(16);
            setSearchTerm(place.formatted_address || place.name || '');
          }
        });
      }
    });
  };

  const handleMarkerClick = (v: Venue) => {
    router.push(`/venues/${v.id}`);
  };

  const handleListItemClick = (v: Venue) => {
    router.push(`/venues/${v.id}`);
  };

  const findMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(pos);
          map?.panTo(pos);
          map?.setZoom(15);
        },
        () => {
          alert("Could not find your location.");
        }
      );
    }
  };

  const initialMapConfig = useMemo(() => {
    const coords = (location?.city && location.city !== 'ALL' && CITY_COORDINATES[location.city.toUpperCase()])
      ? CITY_COORDINATES[location.city.toUpperCase()]
      : (CITY_COORDINATES[location.country.toUpperCase()] || DEFAULT_COORDINATES);
    return { lat: coords.lat, lng: coords.lng, zoom: coords.zoom };
  }, []); // Only once at mount

  const categoryIcons: Record<string, string> = {
    'All': '',
    'Club': 'local_bar',
    'Stay': 'bed',
    'Shop': 'shopping_bag',
    'Studio': 'theater_comedy',
    'Academy': 'school',
    'Beauty': 'face_5',
    'Cafe': 'coffee',
    'Eats': 'restaurant',
    'Other': 'more_horiz'
  };

  // 而ㅽ뀒怨좊━蹂????留덉빱 (null?대㈃ 湲곕낯 ?먰삎)
  const getCategoryMarker = (category: string): { icon: string; bg: string; color: string } | null => {
    switch (category) {
      case 'Shop':  return { icon: 'shopping_bag', bg: '#FF8C42', color: '#fff' };
      case 'Stay':  return { icon: 'bed',          bg: '#4ECDC4', color: '#fff' };
      default:      return null;
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-surface-container select-none font-body">
      {/* Layer 0: Map */}
      <div className="absolute inset-0 z-0">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={initialMapConfig}
            zoom={initialMapConfig.zoom}
            onLoad={(m) => {
              setMap(m);
              const c = m.getCenter();
              if (c) setCenter({ lat: c.lat(), lng: c.lng() });
              setZoom(m.getZoom() || 14);
              const b = m.getBounds();
              setBounds(b || null);
              if (b) {
                setMapBounds([
                  b.getSouthWest().lng(),
                  b.getSouthWest().lat(),
                  b.getNorthEast().lng(),
                  b.getNorthEast().lat()
                ]);
              }
            }}
            onBoundsChanged={() => {
              if (map) {
                const c = map.getCenter();
                const z = map.getZoom();
                if (c && (c.lat() !== center?.lat || c.lng() !== center?.lng)) {
                  setCenter({ lat: c.lat(), lng: c.lng() });
                }
                if (z !== undefined && z !== zoom) {
                  setZoom(z);
                }
                const b = map.getBounds();
                setBounds(b || null);
                if (b) {
                  setMapBounds([
                    b.getSouthWest().lng(),
                    b.getSouthWest().lat(),
                    b.getNorthEast().lng(),
                    b.getNorthEast().lat()
                  ]);
                }
              }
            }}
            onClick={() => {
              setSelectedVenueId(null);
              setIsExpanded(false);
            }}
            options={{ 
              disableDefaultUI: true, 
              mapId: "425069951fef97d91810ab94", 
              gestureHandling: 'greedy',
              styles: [
                {
                  featureType: "all",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                }
              ]
            }}
          >
            {clusters.map((cluster) => {
              const [longitude, latitude] = cluster.geometry.coordinates;
              const { cluster: isCluster, point_count: pointCount, venue } = cluster.properties as any;

              if (isCluster) {
                const size = Math.max(36, 24 + (pointCount / points.length) * 40);
                return (
                  <OverlayView
                    key={`cluster-${cluster.id}`}
                    position={{ lat: latitude, lng: longitude }}
                    mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  >
                    <div
                      className="flex items-center justify-center bg-slate-800 text-white font-bold rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.3)] cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                      style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: `${Math.max(12, 10 + (pointCount / points.length) * 10)}px`
                      }}
                      onClick={(e) => {
                         e.stopPropagation();
                         const expansionZoom = Math.min(
                            supercluster?.getClusterExpansionZoom(cluster.id) || 16, 
                            20
                         );
                         map?.panTo({ lat: latitude, lng: longitude });
                         map?.setZoom(expansionZoom);
                      }}
                    >
                      {pointCount}
                    </div>
                  </OverlayView>
                );
              }

              const v = venue as Venue;
              return (
                <OverlayView
                  key={v.id}
                  position={{ lat: v.coordinates.latitude, lng: v.coordinates.longitude }}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div 
                    className="flex flex-col items-center cursor-pointer pointer-events-auto group"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkerClick(v);
                      setIsExpanded(true);
                    }}
                    style={{ 
                      transform: `translate(-50%, -50%) scale(${labelScale})`,
                      transition: 'transform 0.1s ease-out'
                    }}
                  >
                    {selectedVenueId === v.id ? (
                      <div className="flex flex-col items-center">
                        <div className="relative flex items-center justify-center mb-1">
                          <div className="absolute w-4 h-4 bg-primary/30 rounded-full animate-halo-pulse"></div>
                          <div className="w-5 h-5 bg-primary flex items-center justify-center rounded-full border-2 border-white shadow-xl">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <span className="text-[11px] font-black uppercase tracking-tight map-label text-primary bg-white/40 px-2 py-0.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                          {v.nameKo || v.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {(() => {
                          const cm = getCategoryMarker(v.category);
                          return cm ? (
                            <div
                              className="w-5 h-5 rounded-md flex items-center justify-center shadow-md mb-1 group-hover:scale-125 transition-transform border border-white/80"
                              style={{ backgroundColor: cm.bg }}
                            >
                                <span
                                  className="material-symbols-rounded !text-[11px] leading-none"
                                  style={{ color: cm.color, fontVariationSettings: "'FILL' 1" }}
                                >
                                  {cm.icon}
                                </span>
                            </div>
                          ) : (
                            <div className="w-3 h-3 bg-white border-[3px] border-primary rounded-full shadow-sm mb-1 group-hover:scale-125 transition-transform" />
                          );
                        })()}
                        {zoom >= 13 && (
                          <span className="text-[10px] font-extrabold uppercase tracking-tight map-label text-slate-800 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                            {v.nameKo || v.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </OverlayView>
              );
            })}

            {userLocation && (
              <OverlayView
                position={userLocation}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div className="user-pos-marker" style={{ transform: 'translate(-50%, -50%)' }} />
              </OverlayView>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-container">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Layer 1: Floating Filter Icons (Top) */}
      <div className="absolute top-36 left-0 right-0 z-20 flex gap-2.5 overflow-x-auto px-6 no-scrollbar pointer-events-auto py-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 backdrop-blur-md rounded-full text-[11px] font-black uppercase tracking-tight shadow-[0_4px_12px_rgba(0,0,0,0.12)] border-0 transition-all whitespace-nowrap active:scale-95 ${
              selectedCategories.includes(cat)
              ? 'bg-primary text-white shadow-primary/20 scale-105'
              : 'bg-white/90 text-on-surface hover:bg-white'
            }`}
          >
            {categoryIcons[cat] && (
              <span className="material-symbols-rounded !text-[18px] leading-none" style={{ fontVariationSettings: "'FILL' 1" }}>
                {categoryIcons[cat]}
              </span>
            )}
            <span className="mt-[1px]">{cat}</span>
          </button>
        ))}
      </div>

      {/* Layer 3: Search & Venue Area (Kinetic Expansion) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-sm z-30 pointer-events-auto">
        
        {/* Floatable Buttons (Hide when expanded) */}
        <AnimatePresence>
          {!isExpanded && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-16 left-0 right-0 flex justify-between pointer-events-none"
            >
              {/* Find Me (Left) */}
              <button 
                onClick={(e) => { e.stopPropagation(); findMyLocation(); }}
                className="pointer-events-auto w-12 h-12 bg-white shadow-2xl rounded-xl flex items-center justify-center text-primary hover:bg-slate-50 active:scale-95 transition-all border border-white/40"
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[8px] font-bold uppercase">Find</span>
                  <span className="text-[12px] font-black uppercase">ME</span>
                </div>
              </button>

              {/* Venue ADD (Right) */}
              <button 
                onClick={(e) => { e.stopPropagation(); onRegisterOpen(); }}
                className="pointer-events-auto w-12 h-12 bg-white backdrop-blur-md rounded-xl shadow-xl flex items-center justify-center text-primary hover:bg-slate-50 active:scale-95 transition-all border border-white/50"
              >
                <div className="flex flex-col items-center leading-none">
                  <span className="text-[8px] font-bold uppercase">venue</span>
                  <span className="text-[12px] font-black uppercase">ADD</span>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          animate={{ height: isExpanded ? 'auto' : '56px' }}
          className="bg-white/95 backdrop-blur-3xl rounded-xl shadow-[0_24px_48px_rgba(0,0,0,0.12)] flex flex-col border border-white/60 overflow-hidden transition-all duration-300"
          onClick={() => !isExpanded && setIsExpanded(true)}
        >
          {/* Top Row / Summary Bar */}
          <div className={`px-4 flex items-center justify-between min-h-[52px] cursor-pointer ${isExpanded ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center flex-1 overflow-hidden">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center transition-colors hover:bg-slate-100 shrink-0"
              >
                <span className="material-symbols-rounded text-primary text-xl">
                  {isExpanded ? 'expand_more' : 'expand_less'}
                </span>
              </div>
              
              {isExpanded ? (
                <div className="flex items-center ml-2 flex-1 overflow-hidden">
                  {selectedBrand !== 'All' && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBrand('All');
                      }}
                      className="flex items-center bg-primary/10 text-primary px-2 py-1 rounded-lg mr-2 whitespace-nowrap cursor-pointer hover:bg-primary/20 transition-colors group shrink-0"
                    >
                      <span className="text-[11px] font-bold">Brand: {selectedBrand}</span>
                      <span className="material-symbols-rounded text-sm ml-1 opacity-60 group-hover:opacity-100">close</span>
                    </div>
                  )}
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnterKey()}
                    placeholder={selectedBrand === 'All' ? "Search venue.." : ""}
                    className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 w-full outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide truncate">
                  {selectedBrand !== 'All' ? `${selectedBrand} : ` : ''}{filteredVenues.length} IN VIEW
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <div className="h-5 w-[1px] bg-slate-200 mx-1"></div>
              
              {/* Brand Filter Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowBrandFilter(!showBrandFilter);
                }}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  selectedBrand !== 'All' ? 'bg-primary/10 text-primary' : 'text-[#596061] hover:bg-slate-100'
                }`}
              >
                <span className="material-symbols-rounded text-[22px]">filter_center_focus</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (isExpanded && searchTerm) {
                    handleEnterKey();
                  } else {
                    setIsExpanded(!isExpanded);
                  }
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-primary active:scale-90 transition-transform"
              >
                <span className="material-symbols-rounded text-[24px]">search</span>
              </button>
            </div>
          </div>

          {/* Brand Filter Panel */}
          <AnimatePresence>
            {showBrandFilter && brands.length > 1 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white border-t border-slate-50 p-4"
              >
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Filter by Brand</p>
                <div className="flex flex-wrap gap-2">
                  {brands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => { 
                        setSelectedBrand(brand); 
                        setShowBrandFilter(false); 
                        if (!isExpanded) setIsExpanded(true);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                        selectedBrand === brand
                          ? 'text-primary bg-primary/10'
                          : 'text-[#596061] bg-slate-100 border border-transparent hover:bg-slate-200'
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Expanded List area */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center overflow-x-auto px-6 gap-4 no-scrollbar snap-x snap-mandatory py-4 h-[130px]"
              >
                {sortedFilteredVenues.length > 0 ? (
                  sortedFilteredVenues.map((v) => (
                    <div 
                      key={v.id}
                      onClick={() => handleListItemClick(v)}
                      className={`flex-none w-[calc(100%-24px)] bg-white rounded-lg p-2 shadow-sm border flex gap-3 relative snap-center transition-all ${
                        selectedVenueId === v.id ? 'border-primary ring-1 ring-primary' : 'border-slate-50'
                      }`}
                    >
                      <div className="w-16 h-16 rounded bg-slate-100 flex-none overflow-hidden">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} className="w-full h-full object-cover" alt={v.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <span className="material-symbols-rounded text-xl">image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0 pr-8 justify-center">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 w-fit px-1.5 py-0.5 rounded mb-1 uppercase">
                          {v.category}
                        </span>
                        <h3 className="text-[17px] font-bold text-on-background truncate leading-tight">
                          {v.nameKo || v.name}
                        </h3>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">
                          no social today
                        </p>
                      </div>
                      
                      {/* More Vert Menu */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === v.id ? null : v.id);
                        }}
                        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
                      >
                        <span className="material-symbols-rounded text-[18px]">more_vert</span>
                      </button>

                      <AnimatePresence>
                        {activeMenuId === v.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-2 bottom-full mb-2 bg-white rounded-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] border border-slate-100 min-w-[140px] z-50 overflow-hidden origin-bottom-right"
                          >
                            <div className="flex items-center justify-between px-2 py-2 border-b border-slate-50 gap-1 bg-slate-50/50">
                              <a href={getKakaoMapUrl(v)} target="_blank" rel="noreferrer" className="flex-1 text-center bg-[#FEE500] text-black text-[9px] font-black py-1.5 rounded shadow-sm hover:brightness-95 transition-all" onClick={e => e.stopPropagation()}>
                                K
                              </a>
                              <a href={getNaverMapUrl(v)} target="_blank" rel="noreferrer" className="flex-1 text-center bg-[#03C75A] text-white text-[9px] font-black py-1.5 rounded shadow-sm hover:brightness-95 transition-all" onClick={e => e.stopPropagation()}>
                                N
                              </a>
                              <a href={getGoogleMapUrl(v)} target="_blank" rel="noreferrer" className="flex-1 text-center bg-white border border-slate-200 text-[#4285F4] text-[9px] font-black py-1.5 rounded shadow-sm hover:bg-slate-50 transition-all" onClick={e => e.stopPropagation()}>
                                G
                              </a>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(v, 'geo');
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2.5 text-left text-xs font-bold text-primary hover:bg-primary/5 border-b border-slate-50 flex items-center justify-between transition-colors"
                            >
                              <span>Geo tuning</span>
                            <span className="material-symbols-rounded text-[14px]">my_location</span>
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(v);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-50 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(v.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-error hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-400 text-xs font-medium">
                    No venues in this area
                  </div>
                )}
                {/* Visual nudge for next card */}
                <div className="flex-none w-10 h-1" /> 
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
