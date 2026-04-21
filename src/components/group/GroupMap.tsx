"use client";

import React, { useState, useEffect } from "react";
import { GoogleMap, useJsApiLoader, MarkerF } from "@react-google-maps/api";
import { motion } from "framer-motion";
import { Group } from "@/types/group";
import { db } from "@/lib/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";
import GroupFooter from "./GroupFooter";

const mapContainerStyle = {
  width: "100%",
  height: "450px",
  borderRadius: "24px",
};

interface Venue {
  id: string;
  name: string;
  nameKo?: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  imageUrl?: string;
  category?: string;
}

export default function GroupMap({ group }: { group: Group }) {
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ['places']
  });

  useEffect(() => {
    async function fetchVenue() {
      if (!group.venueId) {
        setLoading(false);
        return;
      }

      try {
        const venueDoc = await getDoc(doc(db, "venues", group.venueId));
        if (venueDoc.exists()) {
          setVenue({ id: venueDoc.id, ...venueDoc.data() } as Venue);
        }
      } catch (error) {
        console.error("Error fetching venue:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchVenue();
  }, [group.venueId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="pb-32 px-4 md:px-8 mt-24">
      <div className="max-w-5xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-headline font-black text-primary mb-2 uppercase tracking-tight">Location</h2>
          <p className="text-on-surface-variant/60 font-medium italic">Find us here and join the dance.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-surface-container-lowest rounded-[32px] p-4 shadow-2xl border border-white/40 overflow-hidden mb-10"
        >
          {isLoaded && venue ? (
            <div className="relative group">
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ 
                  lat: venue.coordinates.latitude, 
                  lng: venue.coordinates.longitude 
                }}
                zoom={16}
                options={{
                  disableDefaultUI: true,
                  styles: [
                    {
                      "featureType": "all",
                      "elementType": "geometry.fill",
                      "stylers": [{ "weight": "2.00" }]
                    },
                    {
                      "featureType": "all",
                      "elementType": "geometry.stroke",
                      "stylers": [{ "color": "#9c9c9c" }]
                    },
                    {
                      "featureType": "all",
                      "elementType": "labels.text",
                      "stylers": [{ "visibility": "on" }]
                    },
                    {
                      "featureType": "landscape",
                      "elementType": "all",
                      "stylers": [{ "color": "#f2f2f2" }]
                    },
                    {
                      "featureType": "poi",
                      "elementType": "all",
                      "stylers": [{ "visibility": "off" }]
                    },
                    {
                      "featureType": "road",
                      "elementType": "all",
                      "stylers": [{ "saturation": -100 }, { "lightness": 45 }]
                    },
                    {
                      "featureType": "road.highway",
                      "elementType": "all",
                      "stylers": [{ "visibility": "simplified" }]
                    },
                    {
                      "featureType": "road.arterial",
                      "elementType": "labels.icon",
                      "stylers": [{ "visibility": "off" }]
                    },
                    {
                      "featureType": "transit",
                      "elementType": "all",
                      "stylers": [{ "visibility": "off" }]
                    },
                    {
                      "featureType": "water",
                      "elementType": "all",
                      "stylers": [{ "color": "#46bcec" }, { "visibility": "on" }]
                    }
                  ]
                }}
              >
                <MarkerF 
                  position={{ 
                    lat: venue.coordinates.latitude, 
                    lng: venue.coordinates.longitude 
                  }} 
                  title={venue.nameKo || venue.name}
                />
              </GoogleMap>
              
              {/* Map Controls / Platform Links */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                  <a 
                    href={`https://map.kakao.com/link/to/${venue.nameKo || venue.name},${venue.coordinates.latitude},${venue.coordinates.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-4 bg-[#FEE500] text-black font-black text-xs rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    KAKAO MAP
                  </a>
                  <a 
                    href={`https://map.naver.com/v5/search/${venue.nameKo || venue.name}?c=${venue.coordinates.longitude},${venue.coordinates.latitude},15,0,0,0,dh`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-10 px-4 bg-[#03C75A] text-white font-black text-xs rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    NAVER MAP
                  </a>
                </div>
                <button 
                  onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${venue.coordinates.latitude},${venue.coordinates.longitude}`)}
                  className="pointer-events-auto h-12 w-12 bg-white rounded-full flex items-center justify-center text-primary shadow-xl hover:scale-110 active:scale-90 transition-transform"
                >
                  <span className="material-symbols-outlined">directions</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full h-[450px] bg-surface-container flex flex-col items-center justify-center rounded-[24px]">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant/20 mb-4 animate-pulse">map</span>
              <p className="text-on-surface-variant/60 font-bold uppercase tracking-widest text-xs">
                {venue ? "Loading Map Experience..." : "Location information not available."}
              </p>
            </div>
          )}
        </motion.div>

        {venue && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="md:col-span-2 group-y-6">
              <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/40 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary font-bold">location_on</span>
                  <h3 className="text-xl font-bold text-on-surface uppercase tracking-tight">Address</h3>
                </div>
                <p className="text-2xl font-black text-primary leading-tight mb-2">
                  {venue.nameKo || venue.name}
                </p>
                <p className="text-on-surface/70 font-medium text-lg leading-relaxed">
                  {venue.address}
                </p>
              </div>

              <div className="bg-surface-container-lowest/80 backdrop-blur-xl p-8 rounded-[32px] border border-white/40 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="material-symbols-outlined text-primary font-bold">info</span>
                  <h3 className="text-xl font-bold text-on-surface uppercase tracking-tight">How to visit</h3>
                </div>
                <p className="text-on-surface/70 font-medium leading-relaxed">
                  이 장소는 홍대입구역 1번 출구에서 도보 5분 거리에 위치해 있습니다. <br/>
                  입구에서 벨을 눌러주시면 직원이 안내해 드립니다.
                </p>
              </div>
            </div>

            <div className="group-y-6">
              <div className="aspect-square bg-slate-200 rounded-[32px] overflow-hidden shadow-xl border border-white/40 group relative">
                {venue.imageUrl ? (
                  <img src={venue.imageUrl} alt={venue.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-slate-400">image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                  <span className="text-white font-bold uppercase text-[10px] tracking-widest">Venue Preview</span>
                </div>
              </div>
              
              <div className="bg-primary p-8 rounded-[32px] shadow-2xl shadow-primary/20 text-white">
                <h4 className="font-headline font-black text-xl mb-2 uppercase tracking-tighter">Open Hours</h4>
                <div className="group-y-2 opacity-90 text-sm font-medium">
                  <div className="flex justify-between">
                    <span>Weekdays</span>
                    <span>14:00 - 22:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weekends</span>
                    <span>12:00 - 24:00</span>
                  </div>
                  <div className="pt-2 border-t border-white/20 mt-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                    * Milonga schedule may vary
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
        <GroupFooter communityName={group.name} />
      </div>
    </div>
  );
}
