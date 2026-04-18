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
}

const mapContainerStyle = { width: '100%', height: '100dvh' };
const CIRCLE_PATH = 0;

export default function MapComponent({ 
  onRegisterOpen, 
  onEdit, 
  onDelete, 
  isLoaded 
}: { 
  onRegisterOpen: () => void; 
  onEdit: (venue: Venue) => void;
  onDelete: (id: string) => void;
  isLoaded: boolean; 
}) {
  const { location } = useLocation();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(14);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const router = useRouter();

  const categories = ['All', 'Club', 'Stay', 'Shop', 'Studio', 'Academy', 'Beauty', 'Cafe', 'Eats', 'Other'];

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

  const filteredVenues = useMemo(() => {
    let result = venues;

    // 1. Filter by categories
    if (!selectedCategories.includes('All')) {
      result = result.filter(v => selectedCategories.includes(v.category));
    }

    // 2. Conditional filter: Bounds (only when NO search term)
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

  useEffect(() => {
    if (!isExpanded) {
      setSearchTerm('');
    }
  }, [isExpanded]);

  const toggleCategory = (cat: string) => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
    } else {
      setSelectedCategories(prev => {
        const withoutAll = prev.filter(c => c !== 'All');
        if (withoutAll.includes(cat)) {
          const updated = withoutAll.filter(c => c !== cat);
          return updated.length === 0 ? ['All'] : updated;
        } else {
          return [...withoutAll, cat];
        }
      });
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
    if (selectedVenueId === v.id) {
      // Second click: Navigate to details
      router.push(`/venues/${v.id}`);
    } else {
      // First click: Highlight and show preview card
      setSelectedVenueId(v.id);
      map?.panTo({ lat: v.coordinates.latitude, lng: v.coordinates.longitude });
      map?.setZoom(17);
      
      // We don't necessarily need to expand the full list anymore, 
      // as the preview card will provide basic info.
      
      // Scroll list item into view if expanded
      if (isExpanded) {
        setTimeout(() => {
          const element = document.getElementById(`venue-item-${v.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      }
    }
  };

  const handleListItemClick = (v: Venue) => {
    if (selectedVenueId === v.id) {
      // Second click: Navigate to details
      router.push(`/venues/${v.id}`);
    } else {
      setSelectedVenueId(v.id);
      map?.panTo({ lat: v.coordinates.latitude, lng: v.coordinates.longitude });
      map?.setZoom(17);
    }
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
    'All': 'apps',
    'Club': 'nightlife',
    'Stay': 'bed',
    'Shop': 'shopping_bag',
    'Studio': 'theater_comedy',
    'Academy': 'school',
    'Beauty': 'face_5',
    'Cafe': 'coffee',
    'Eats': 'restaurant',
    'Other': 'more_horiz'
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
                setBounds(map.getBounds() || null);
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
            {filteredVenues.map((v) => (
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
                      <div className="w-3 h-3 bg-white border-[3px] border-primary rounded-full shadow-sm mb-1 group-hover:scale-125 transition-transform"></div>
                      {zoom >= 13 && (
                        <span className="text-[10px] font-extrabold uppercase tracking-tight map-label text-slate-800 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                          {v.nameKo || v.name}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </OverlayView>
            ))}

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

      {/* Layer 1: Floating Filter Icons (Top Left) */}
      <div className="absolute top-20 left-0 right-0 z-20 flex gap-2 overflow-x-auto px-6 no-scrollbar pointer-events-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => toggleCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider shadow-[0_4px_12px_rgba(0,0,0,0.08)] border transition-all whitespace-nowrap ${
              selectedCategories.includes(cat)
              ? 'bg-primary text-white border-primary/20'
              : 'bg-white/80 text-on-surface border-white/60 hover:bg-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {categoryIcons[cat]}
            </span>
            {cat}
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
          <div className={`px-6 flex items-center justify-between py-3 cursor-pointer ${isExpanded ? 'border-b border-slate-100' : ''}`}>
            <div className="flex items-center">
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(!isExpanded);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors hover:bg-slate-200"
              >
                <span className="material-symbols-outlined text-primary text-xl">
                  {isExpanded ? 'expand_more' : 'expand_less'}
                </span>
              </div>
              
              {isExpanded ? (
                <div className="flex items-center ml-3 flex-grow">
                  <input 
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search venue.."
                    className="bg-transparent border-none p-0 focus:ring-0 text-sm font-medium text-slate-800 placeholder:text-slate-400 w-full outline-none"
                  />
                </div>
              ) : (
                <span className="text-sm text-slate-800 font-bold ml-3 tracking-wide">
                  {filteredVenues.length} IN VIEW
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="h-5 w-[1px] bg-slate-200"></div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(true);
                }}
                className="flex items-center justify-center text-primary active:scale-90 transition-transform"
              >
                <span className="material-symbols-outlined text-[24px]">search</span>
              </button>
            </div>
          </div>

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
                            <span className="material-symbols-outlined text-xl">image</span>
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
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>

                      <AnimatePresence>
                        {activeMenuId === v.id && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-2 top-10 bg-white rounded-xl shadow-2xl border border-slate-100 py-1 min-w-[100px] z-50"
                          >
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(v);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-50"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(v.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-xs font-bold text-error hover:bg-red-50"
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
