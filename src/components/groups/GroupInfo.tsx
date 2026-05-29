"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Group, Member } from '@/types/group';
import { GoogleMap, Marker } from '@react-google-maps/api';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { toast } from 'sonner';

interface GroupInfoProps {
  group: Group;
  isLoaded: boolean;
  members?: Member[];
  isFullMember?: boolean;
  onJoinClick?: () => void;
}

const mapContainerStyle = { width: "100%", height: "100%" };
const mapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  gestureHandling: 'none' as const,
  zoomControl: false,
  mapId: "425069951fef97d91810ab94",
};

const GroupInfo = ({ group, isLoaded, members = [], isFullMember = false, onJoinClick }: GroupInfoProps) => {
  const { t } = useLanguage();
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  // Flatten gallery media
  const allMedia = useMemo(() => {
    if (!group.gallery) return [];
    return group.gallery.flatMap(section => section.media);
  }, [group.gallery]);

  // Map coordinates
  const defaultCoords = { lat: 37.5665, lng: 126.9780 };
  const center = group.coordinates
    ? { lat: group.coordinates.latitude, lng: group.coordinates.longitude }
    : defaultCoords;

  const googleMapsUrl = group.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.address)}`
    : `https://www.google.com/maps/@${center.lat},${center.lng},16z`;

  const naverMapUrl = group.address
    ? `https://map.naver.com/v5/search/${encodeURIComponent(group.address)}`
    : '#';

  const kakaoMapUrl = group.address
    ? `https://map.kakao.com/?q=${encodeURIComponent(group.address)}`
    : '#';

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  // Team: representative + staff/admin members
  const teamMembers = useMemo(() => {
    return members.filter(m => m.role === 'admin' || m.role === 'staff' || m.id === group.ownerId);
  }, [members, group.ownerId]);

  const onMapLoad = useCallback(() => {}, []);

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md">
      {/* Stitch font tokens not in tailwind.config.ts */}
      <style jsx>{`
        .font-title-lg { font-family: 'Plus Jakarta Sans', sans-serif; }
        .text-title-lg { font-size: 20px; line-height: 1.4; font-weight: 700; }
        .font-label-md { font-family: 'Inter', sans-serif; }
        .text-label-md { font-size: 14px; line-height: 1.2; font-weight: 600; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .material-symbols-outlined.filled {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative h-[45vh] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${group.coverImage || ''}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      </section>

      <div className="p-4 space-y-[40px]">

        {/* Section 1: The Atmosphere (Gallery) */}
        {allMedia.length > 0 && (
          <section>
            <h3 className="font-title-lg text-title-lg text-on-surface mb-6 tracking-tight">The Atmosphere</h3>
            <div className="grid grid-cols-6 grid-rows-2 gap-3 h-[320px]">
              {/* Large Landscape */}
              <div className="col-span-4 row-span-1 rounded-xl overflow-hidden shadow-sm">
                <ImageWithFallback
                  src={allMedia[0]}
                  alt="Atmosphere 1"
                  fallbackType="gallery"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              {/* Tall Portrait */}
              <div className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-sm">
                <ImageWithFallback
                  src={allMedia[1] || allMedia[0]}
                  alt="Atmosphere 2"
                  fallbackType="gallery"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              {/* Small Square */}
              <div className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm">
                <ImageWithFallback
                  src={allMedia[2] || allMedia[0]}
                  alt="Atmosphere 3"
                  fallbackType="gallery"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* More Card */}
              <div className="col-span-2 row-span-1 rounded-xl overflow-hidden relative shadow-sm">
                <ImageWithFallback
                  src={allMedia[3] || allMedia[0]}
                  alt="More"
                  fallbackType="gallery"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="font-label-md text-white text-lg">+{Math.max(allMedia.length - 3, 0)} More</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Section 2: About + Join CTA */}
        <section className="space-y-6">
          <div className="bg-surface-container p-6 rounded-2xl border border-outline-variant/30">
            <div className="relative">
              <p className={`font-body-md text-body-md text-on-surface-variant ${!isDescExpanded ? 'line-clamp-3' : ''}`}>
                {group.description || group.story || 'Welcome to our community. Join us and be part of something special.'}
              </p>
              {!isDescExpanded && (group.description || group.story || '').length > 150 && (
                <button
                  className="mt-2 text-primary font-label-md text-label-md"
                  onClick={() => setIsDescExpanded(true)}
                >
                  Read More
                </button>
              )}
            </div>
          </div>

          {!isFullMember && (
            <div className="bg-primary p-6 rounded-2xl shadow-lg shadow-primary/20">
              <p className="font-title-lg text-title-lg text-on-primary mb-4">Become a Member</p>
              <p className="font-body-md text-on-primary/80 mb-6 text-sm">Join our vibrant community and get exclusive access to milonga feeds, board updates, and special moments.</p>
              <button
                onClick={onJoinClick}
                className="w-full py-3.5 bg-on-primary text-primary font-label-md text-label-md rounded-xl active:scale-[0.98] transition-transform"
              >
                Join the Community
              </button>
            </div>
          )}
        </section>

        {/* Section 3: Location */}
        <section>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-2">Location</h3>
          {group.publicTransport && (
            <p className="font-label-sm text-label-sm text-primary mb-4 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {group.publicTransport}
            </p>
          )}
          <div className="flex items-center justify-between mb-4 p-4 bg-surface-container-low border border-outline-variant/30 rounded-xl">
            <p className="font-body-md text-body-md text-on-surface">{group.address || 'Address not specified'}</p>
            {group.address && (
              <button
                onClick={() => handleCopy(group.address!, 'Address')}
                className="px-4 py-2 bg-primary/10 text-primary font-label-sm text-label-sm rounded-lg active:bg-primary/20 shrink-0 ml-3"
              >
                Copy
              </button>
            )}
          </div>

          {/* Map Preview */}
          <div
            className="rounded-2xl overflow-hidden border border-outline-variant/30 mb-4 h-56 relative group cursor-pointer shadow-sm"
            onClick={() => window.open(googleMapsUrl, '_blank')}
          >
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={16}
                onLoad={onMapLoad}
                options={mapOptions}
              >
                {group.coordinates && <Marker position={center} />}
              </GoogleMap>
            ) : (
              <div className="w-full h-full bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 animate-pulse">map</span>
              </div>
            )}
            <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full" />
                <span className="material-symbols-outlined text-primary text-5xl filled relative z-10">location_on</span>
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-label-md text-on-surface-variant border border-outline-variant/20 pointer-events-none">
              TAP TO EXPAND
            </div>
          </div>

          {/* Map Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => window.open(naverMapUrl, '_blank')}
              className="flex flex-col items-center justify-center py-3.5 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface mb-1">map</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">Naver Map</span>
            </button>
            <button
              onClick={() => window.open(kakaoMapUrl, '_blank')}
              className="flex flex-col items-center justify-center py-3.5 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface mb-1">explore</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">Kakao Map</span>
            </button>
            <button
              onClick={() => window.open(googleMapsUrl, '_blank')}
              className="flex flex-col items-center justify-center py-3.5 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface mb-1">location_on</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">Google Maps</span>
            </button>
          </div>
        </section>

        {/* Section 4: Hours & House Rules */}
        <div className="grid grid-cols-1 gap-6">
          <section className="space-y-4">
            <h3 className="font-title-lg text-title-lg text-on-surface">Hours</h3>
            <div className="bg-surface border border-outline-variant/20 rounded-2xl divide-y divide-outline-variant/10 shadow-sm">
              <div className="px-5 py-4 flex justify-between font-body-md text-body-md">
                <span className="text-on-surface-variant">Mon - Fri</span>
                <span className="text-on-surface font-semibold">14:00 - 22:00</span>
              </div>
              <div className="px-5 py-4 flex justify-between font-body-md text-body-md">
                <span className="text-on-surface-variant">Sat - Sun</span>
                <span className="text-on-surface font-semibold">12:00 - 23:00</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-title-lg text-title-lg text-on-surface">House Rules</h3>
            <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/20">
              <ul className="space-y-4">
                <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[20px]">stars</span>
                  <span>Respect all dance partners and maintain social etiquette.</span>
                </li>
                <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                  <span>Indoor-only dance shoes are required on hardwood floors.</span>
                </li>
                <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                  <span className="material-symbols-outlined text-primary text-[20px]">block</span>
                  <span>No outside food or sticky beverages inside the studio.</span>
                </li>
              </ul>
            </div>
          </section>
        </div>

        {/* Section 5: Team */}
        <section>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-4">Team</h3>
          <div className="space-y-3">
            {/* Representative */}
            {group.representative && (
              <div className="flex items-center justify-between p-3.5 bg-surface border border-outline-variant/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary/5">
                    <ImageWithFallback
                      src={group.representative.avatar}
                      alt={group.representative.name}
                      fallbackType="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{group.representative.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">Representative</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toast.info('Chat feature coming soon.')}
                    className="p-2 text-primary hover:bg-primary-container rounded-full"
                  >
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                  {group.representative.phone && (
                    <a
                      href={`tel:${group.representative.phone}`}
                      className="p-2 text-primary hover:bg-primary-container rounded-full"
                    >
                      <span className="material-symbols-outlined">call</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Staff/Admin Members */}
            {teamMembers.filter(m => m.id !== group.ownerId || !group.representative).map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3.5 bg-surface border border-outline-variant/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary/5">
                    <ImageWithFallback
                      src={member.avatar || member.photoURL}
                      alt={member.name}
                      fallbackType="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{member.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant capitalize">{member.role === 'admin' ? 'Manager' : member.role || 'Staff'}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toast.info(t('toast.group.chat_coming_soon'))}
                    className="p-2 text-primary hover:bg-primary-container rounded-full"
                  >
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Payment Info */}
        {group.bankDetails?.accountNumber && (
          <section className="bg-secondary-container/30 p-6 rounded-2xl border border-secondary-fixed-dim/20">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary filled">account_balance</span>
              <h3 className="font-label-md text-label-md text-on-surface">Payment Info</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-label-sm text-on-surface-variant mb-1">{group.bankDetails.bankName || 'Bank'}</p>
                <p className="font-title-lg text-title-lg text-primary tracking-wider">{group.bankDetails.accountNumber}</p>
              </div>
              <button
                onClick={() => handleCopy(group.bankDetails!.accountNumber, 'Account number')}
                className="px-5 py-2.5 bg-primary text-on-primary font-label-sm text-label-sm rounded-xl active:scale-95 transition-transform"
              >
                Copy
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="pt-10 pb-6 border-t border-outline-variant/20">
          <div className="space-y-3 text-on-surface-variant/60 font-label-sm text-label-sm leading-relaxed">
            <p className="font-semibold text-on-surface-variant/80">{group.name}</p>
            <div className="grid grid-cols-1 gap-1">
              {group.representative && <p>Representative: {group.representative.name}</p>}
              {group.address && <p>Address: {group.address}</p>}
            </div>
            <p className="pt-6 uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant/40">© 2026 {group.name?.toUpperCase()}</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GroupInfo;
