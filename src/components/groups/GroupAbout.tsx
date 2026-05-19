"use client";

import React, { useState, useEffect } from 'react';
import { Group } from '@/types/group';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase/clientApp';
import { doc, getDoc } from 'firebase/firestore';


interface GroupAboutProps {
  group: Group;
  members?: any[];
}

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

const GroupAbout: React.FC<GroupAboutProps> = ({ group, members }) => {
  const { t } = useLanguage();
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  
  // Venue address fetched from venue document (not stored in group)
  const [venueAddress, setVenueAddress] = useState<string>('');

  // Fetch address from venue document (single source of truth)
  useEffect(() => {
    const fetchVenueAddress = async () => {
      if (group.venueId) {
        try {
          const vSnap = await getDoc(doc(db, 'venues', group.venueId));
          if (vSnap.exists()) {
            const vData = vSnap.data();
            setVenueAddress(vData.address || vData.city || '');
          }
        } catch (e) {
          console.error('Failed to fetch venue address:', e);
        }
      }
    };
    fetchVenueAddress();
  }, [group.venueId]);
  
  // Photo Viewer State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Extract gallery images
  const getGalleryImages = () => {
    if (group.aboutPhotos && group.aboutPhotos.length > 0) {
      return group.aboutPhotos;
    }
    let images: string[] = [];
    if (group.gallery) {
      group.gallery.forEach(sec => {
        if (sec.type === 'photos' && sec.media) {
          images = [...images, ...sec.media];
        }
      });
    }
    return images;
  };
  const galleryImages = getGalleryImages();
  // Ensure we always have at least fallback images if empty
  const defaultFallback = "https://lh3.googleusercontent.com/aida/ADBb0ug-hPMVqq1Aj_dtT00E_6_II27LkLFavGyeJrot7giurbGLzEOWSPxMI9vbLcyL8z8WmaGTEVuwrH0tN2f-uDoxeG9_03SOAlsOK3JwaeB-ksfuSK5bYve8iAHv-du8nUXre_b7CdETBnRFLl347MwmNoaYtOewRCgeYEJyG4OLbEO7o4mof2PJJK680fdDXv8LNFANn3OcIBQkQ-WbJiYdGnot5Ko7F5B2YA6JMrRhjbjjunBmTlfszzJwMWlp9OhF4zuyz0Eq";
  const displayImages = galleryImages.length > 0 ? galleryImages : [group.coverImage || defaultFallback];

  const img1 = displayImages[0] || displayImages[0];
  const img2 = displayImages[1] || displayImages[0];
  const img3 = displayImages[2] || displayImages[0];
  const img4 = displayImages[3] || displayImages[0];
  const moreCount = displayImages.length > 4 ? displayImages.length - 4 : 0;

  const closeViewer = () => setIsViewerOpen(false); // Replaced useHistoryBack

  const openViewer = (index: number) => {
    if (displayImages.length === 0) return;
    setViewerIndex(Math.min(index, displayImages.length - 1));
    setIsViewerOpen(true);
  };

  const paginate = (newDirection: number) => {
    const newIndex = viewerIndex + newDirection;
    if (newIndex >= 0 && newIndex < displayImages.length) {
      setViewerIndex(newIndex);
    }
  };

  // Extract team members (Owner and Staff)
  const combinedTeam: any[] = [];
  
  // Use dynamically fetched members. Do not fallback to group.members to avoid mock data.
  const actualMembers = members || [];
  
  // 1. Add owner if exists
  const hasOwnerInMembers = actualMembers.find(m => m.role === 'owner' || m.id === group.ownerId);
  if (hasOwnerInMembers) {
    combinedTeam.push({
      id: hasOwnerInMembers.id,
      name: hasOwnerInMembers.name,
      role: t("group.about.role.representative", "대표"),
      avatar: hasOwnerInMembers.avatar || hasOwnerInMembers.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + hasOwnerInMembers.name,
      phone: hasOwnerInMembers.phone || null
    });
  }

  // 2. Add staff and instructor members
  const ownerId = hasOwnerInMembers ? hasOwnerInMembers.id : group.ownerId;
  const staffMembers = actualMembers.filter(m => (m.role === 'staff' || m.role === 'instructor') && m.id !== ownerId);
  
  staffMembers.forEach(m => {
    combinedTeam.push({
      id: m.id,
      name: m.name,
      role: t(`group.about.role.${m.role}`, m.role === 'instructor' ? '강사' : '스탭'),
      avatar: m.avatar || m.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + m.name,
      phone: m.phone || null
    });
  });

  return (
    <div className="space-y-8">
      {/* Fullscreen Photo Viewer */}
      <AnimatePresence>
        {isViewerOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md">
            <button 
              onClick={closeViewer}
              className="absolute top-6 right-6 text-white/70 hover:text-white z-50 p-2 bg-black/20 rounded-full backdrop-blur-sm transition-colors"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
            
            <div className="absolute top-6 left-6 text-white/70 font-label-md bg-black/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {viewerIndex + 1} / {displayImages.length}
            </div>

            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <AnimatePresence initial={false} custom={viewerIndex}>
                <motion.img
                  key={viewerIndex}
                  src={displayImages[viewerIndex]}
                  custom={viewerIndex}
                  initial={{ opacity: 0, x: 300, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -300, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}
                  onDragEnd={(e, { offset, velocity }) => {
                    const swipe = swipePower(offset.x, velocity.x);
                    if (swipe < -swipeConfidenceThreshold) {
                      paginate(1);
                    } else if (swipe > swipeConfidenceThreshold) {
                      paginate(-1);
                    }
                  }}
                  className="absolute max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
                  draggable={false}
                />
              </AnimatePresence>
            </div>

            {/* Navigation Arrows */}
            {viewerIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-md transition-all z-50"
                onClick={(e) => { e.stopPropagation(); paginate(-1); }}
              >
                <span className="material-symbols-outlined text-3xl">chevron_left</span>
              </button>
            )}
            {viewerIndex < displayImages.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50 hover:text-white backdrop-blur-md transition-all z-50"
                onClick={(e) => { e.stopPropagation(); paginate(1); }}
              >
                <span className="material-symbols-outlined text-3xl">chevron_right</span>
              </button>
            )}
          </div>
        )}
      </AnimatePresence>

      {/* Section 1: Atmosphere */}
      <section>
        <h3 className="font-title-lg text-title-lg text-on-surface mb-4 tracking-tight">{t("group.about.atmosphere")}</h3>
        <div className="grid grid-cols-6 grid-rows-2 gap-2 h-[260px]">
          {/* Emotional Moment 1: Large Landscape */}
          <div 
            className="col-span-4 row-span-1 rounded-xl overflow-hidden shadow-sm cursor-pointer relative group"
            onClick={() => openViewer(0)}
          >
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 1" src={img1} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {/* Emotional Moment 2: Portrait */}
          <div 
            className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-sm cursor-pointer relative group"
            onClick={() => openViewer(1)}
          >
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 2" src={img2} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {/* Emotional Moment 3: Detail */}
          <div 
            className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm cursor-pointer relative group"
            onClick={() => openViewer(2)}
          >
            <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 3" src={img3} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
          {/* More Card: Dark blur overlay */}
          <div 
            className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm relative cursor-pointer group"
            onClick={() => openViewer(3)}
          >
            <img className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Atmosphere 4" src={img4} />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
            {moreCount > 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="font-label-md text-white text-lg">{t("group.about.more", { count: moreCount })}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section 2: Evocative CTA & About */}
      <section className="space-y-6">
        {(group.story || group.description) && (
          <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/30">
            <div className="relative">
              <p className={`font-body-md text-body-md text-on-surface-variant ${!isAboutExpanded ? 'line-clamp-3' : ''}`}>
                {group.story || group.description}
              </p>
              {!isAboutExpanded && (
                <button className="mt-2 text-primary font-label-md text-label-md" onClick={() => setIsAboutExpanded(true)}>{t("group.about.read_more")}</button>
              )}
            </div>
          </div>
        )}

        {/* Core Services */}
        {group.services && group.services.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-title-lg text-title-lg text-on-surface">{t("group.about.services", "Core Services")}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.services.map((service, index) => (
                <div key={index} className="bg-surface p-4 rounded-2xl border border-outline-variant/30 flex items-start gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${service.color}15`, color: service.color }}>
                    <span className="material-symbols-outlined text-[20px]">{service.icon || 'bolt'}</span>
                  </div>
                  <div>
                    <h4 className="font-label-lg text-label-lg text-on-surface">{service.title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-primary p-5 rounded-2xl shadow-lg shadow-primary/20">
          <p className="font-title-lg text-title-lg text-on-primary mb-3">{t("group.about.become_member")}</p>
          <p className="font-body-md text-on-primary/80 mb-4 text-sm">{t("group.about.join_desc", { name: group.name || 'our vibrant community' })}</p>
          <button 
            className="w-full py-3 bg-on-primary text-primary font-label-md text-label-md rounded-xl active:scale-[0.98] transition-transform shadow-sm"
            onClick={() => toast.success(t("group.about.join_requested") || "Join request sent!")}
          >
            {t("group.about.join_button")}
          </button>
        </div>
      </section>

      {/* Section 3: Scannable Info (Location) - from venue */}
      {venueAddress && (
        <section>
          <h3 className="font-title-lg text-title-lg text-on-surface mb-2">{t("group.about.location")}</h3>
          {group.publicTransport && (
            <p className="font-label-sm text-label-sm text-primary mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">info</span>
              {group.publicTransport}
            </p>
          )}
          
          {(() => {
            const addressParts = venueAddress.split(',');
            const mainAddress = addressParts[0].trim();
            const detailAddress = addressParts.slice(1).join(',').trim();
            
            return (
              <div className="flex items-center justify-between mb-3 p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl">
                <div>
                  <p className="font-body-md text-body-md text-on-surface">{mainAddress}</p>
                  {detailAddress && (
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{detailAddress}</p>
                  )}
                </div>
                <button
                  className="px-4 py-2 bg-primary/10 text-primary font-label-sm text-label-sm rounded-lg active:bg-primary/20 shrink-0 ml-3"
                  onClick={() => {
                    navigator.clipboard.writeText(mainAddress);
                    toast.success(t("group.about.copied") || "Copied to clipboard!");
                  }}
                >
                  {t("group.about.copy")}
                </button>
              </div>
            );
          })()}

          {/* Actual Google Maps iframe Preview */}
          <div 
            className="rounded-2xl overflow-hidden border border-outline-variant/30 mb-3 h-48 relative shadow-sm group"
          >
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${encodeURIComponent(venueAddress.split(',')[0].trim())}&output=embed`}
            ></iframe>
            
            {/* Clickable Overlay to open map */}
            <div 
              className="absolute inset-0 bg-transparent cursor-pointer z-10"
              onClick={() => {
                const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
              }}
            ></div>

            <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-label-md text-on-surface-variant border border-outline-variant/20 z-20 pointer-events-none">
              {t("group.about.tap_expand")}
            </div>
          </div>
          
          {/* Map buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button 
              className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
              onClick={() => {
                const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
              }}
            >
              <span className="material-symbols-outlined text-on-surface mb-1">map</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.naver")}</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
              onClick={() => {
                const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
              }}
            >
              <span className="material-symbols-outlined text-on-surface mb-1">explore</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.kakao")}</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
              onClick={() => {
                const query = encodeURIComponent(venueAddress.split(',')[0].trim() || "");
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
              }}
            >
              <span className="material-symbols-outlined text-on-surface mb-1">location_on</span>
              <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.google")}</span>
            </button>
          </div>
        </section>
      )}

      {/* Section 4: Hours & Rules (Minimalist Cards) */}
      <div className="grid grid-cols-1 gap-4">
        <section className="space-y-3">
          <h3 className="font-title-lg text-title-lg text-on-surface">{t("group.about.hours")}</h3>
          <div className="bg-surface border border-outline-variant/20 rounded-2xl divide-y divide-outline-variant/10 shadow-sm">
            {group.operatingHours && group.operatingHours.length > 0 ? (
              group.operatingHours.map((hours, idx) => (
                <div key={idx} className="px-5 py-4 flex justify-between font-body-md text-body-md">
                  <span className="text-on-surface-variant">{hours.label}</span>
                  <span className="text-on-surface font-semibold">{hours.time}</span>
                </div>
              ))
            ) : (
              <>
                <div className="px-5 py-4 flex justify-between font-body-md text-body-md">
                  <span className="text-on-surface-variant">{t("group.about.hours.mon_fri")}</span>
                  <span className="text-on-surface font-semibold">14:00 - 22:00</span>
                </div>
                <div className="px-5 py-4 flex justify-between font-body-md text-body-md">
                  <span className="text-on-surface-variant">{t("group.about.hours.sat_sun")}</span>
                  <span className="text-on-surface font-semibold">12:00 - 23:00</span>
                </div>
              </>
            )}
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="font-title-lg text-title-lg text-on-surface">{t("group.about.rules")}</h3>
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/20">
            <ul className="space-y-3">
              {group.houseRules && group.houseRules.length > 0 ? (
                group.houseRules.map((rule, idx) => (
                  <li key={idx} className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    <span>{rule}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">stars</span>
                    <span>{t("group.about.rules.rule1")}</span>
                  </li>
                  <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    <span>{t("group.about.rules.rule2")}</span>
                  </li>
                  <li className="flex gap-4 font-body-md text-body-md text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[20px]">block</span>
                    <span>{t("group.about.rules.rule3")}</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Section 5: Team */}
      <section>
        <h3 className="font-title-lg text-title-lg text-on-surface mb-3">{t("group.about.team")}</h3>
        <div className="space-y-2">
          {combinedTeam.length > 0 ? (
            combinedTeam.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3.5 bg-surface border border-outline-variant/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary/5">
                    <img alt={member.name} src={member.avatar} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{member.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant capitalize">{member.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    className="p-2 text-primary hover:bg-primary-container rounded-full"
                    onClick={() => toast.info(t('common.coming_soon') || 'Chat feature coming soon!')}
                  >
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                  {member.phone && (
                    <button 
                      className="p-2 text-primary hover:bg-primary-container rounded-full"
                      onClick={() => {
                        window.location.href = `tel:${member.phone}`;
                      }}
                    >
                      <span className="material-symbols-outlined">call</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-6 flex flex-col items-center justify-center bg-surface-container-low border border-outline-variant/30 rounded-2xl">
              <span className="material-symbols-outlined text-outline mb-2 text-3xl">group_off</span>
              <p className="font-body-md text-on-surface-variant">{t("group.about.no_team", "대표자나 스탭 정보가 없습니다.")}</p>
            </div>
          )}
        </div>
      </section>

      {/* Section 6: Payment Info */}
      {group.bankDetails && group.bankDetails.accountNumber && (
        <section className="bg-secondary-container/30 p-5 rounded-2xl border border-secondary-fixed-dim/20">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-primary filled">account_balance</span>
            <h3 className="font-label-md text-label-md text-on-surface">{t("group.about.payment")}</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-label-sm text-on-surface-variant mb-1">{group.bankDetails.bankName} {group.bankDetails.accountHolder && `(${group.bankDetails.accountHolder})`}</p>
              <p className="font-title-lg text-title-lg text-primary tracking-wider">{group.bankDetails.accountNumber}</p>
            </div>
            <button
              className="px-5 py-2.5 bg-primary text-on-primary font-label-sm text-label-sm rounded-xl active:scale-95 transition-transform"
              onClick={() => {
                navigator.clipboard.writeText(group.bankDetails?.accountNumber || "");
                toast.success(t("group.about.copied") || "Copied to clipboard!");
              }}
            >
              {t("group.about.copy")}
            </button>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="pt-10 pb-6 border-t border-outline-variant/20">
        <div className="space-y-3 text-on-surface-variant/60 font-label-sm text-label-sm leading-relaxed">
          <p className="font-semibold text-on-surface-variant/80">{group.name || 'Community Studio'}</p>
          <div className="grid grid-cols-1 gap-1">
            <p>{t("group.about.representative")} {hasOwnerInMembers?.name || '-'}</p>
            {group.businessRegistrationNumber && <p>{t("group.about.registration_no", "Registration No.")} {group.businessRegistrationNumber}</p>}
            <p>{t("group.about.address")} {venueAddress || '-'}</p>
          </div>
          <p className="pt-6 uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant/40">© {new Date().getFullYear()} {(group.name || 'COMMUNITY').toUpperCase()}</p>
        </div>
      </footer>
    </div>
  );
};

export default GroupAbout;
