"use client";

import React, { useState } from 'react';
import { Group } from '@/types/group';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

interface GroupAboutProps {
  group: Group;
}

const GroupAbout: React.FC<GroupAboutProps> = ({ group }) => {
  const { t } = useLanguage();
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);

  // Extract gallery images
  const getGalleryImages = () => {
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
  const img1 = galleryImages[0] || group.coverImage || "https://lh3.googleusercontent.com/aida/ADBb0ug-hPMVqq1Aj_dtT00E_6_II27LkLFavGyeJrot7giurbGLzEOWSPxMI9vbLcyL8z8WmaGTEVuwrH0tN2f-uDoxeG9_03SOAlsOK3JwaeB-ksfuSK5bYve8iAHv-du8nUXre_b7CdETBnRFLl347MwmNoaYtOewRCgeYEJyG4OLbEO7o4mof2PJJK680fdDXv8LNFANn3OcIBQkQ-WbJiYdGnot5Ko7F5B2YA6JMrRhjbjjunBmTlfszzJwMWlp9OhF4zuyz0Eq";
  const img2 = galleryImages[1] || group.coverImage || "https://lh3.googleusercontent.com/aida/ADBb0uhebk8TNUk87nv3RMI32BSMkoPh-XSZkk6fxAeajyIlbkBr41vc6mVLYU6dVqHGZCfD3uEghyno-V-H9LP7MhQIDV2GeTvQ0etaXpLi5RDPknMzVwJN_m9qdqsHLSgzqUq8bTFZ-Rjm1RWPoM9khF2IxxIfaKw5_D2TVllN_6RyMQI7tMWJ3bBQwnTU45oBQMot4m2nWI0uKWcYkPJcVJX95riy-PmOBJSz3q_5wNwxrBGeXBR6CRsxaQ";
  const img3 = galleryImages[2] || group.coverImage || "https://lh3.googleusercontent.com/aida/ADBb0uhebk8TNUk87nv3RMI32BSMkoPh-XSZkk6fxAeajyIlbkBr41vc6mVLYU6dVqHGZCfD3uEghyno-V-H9LP7MhQIDV2GeTvQ0etaXpLi5RDPknMzVwJN_m9qdqsHLSgzqUq8bTFZ-Rjm1RWPoM9khF2IxxIfaKw5_D2TVllN_6RyMQI7tMWJ3bBQwnTU45oBQMot4m2nWI0uKWcYkPJcVJX95riy-PmOBJSz3q_5wNwxrBGeXBR6CRsxaQ";
  const img4 = galleryImages[3] || group.coverImage || "https://lh3.googleusercontent.com/aida/ADBb0ug-hPMVqq1Aj_dtT00E_6_II27LkLFavGyeJrot7giurbGLzEOWSPxMI9vbLcyL8z8WmaGTEVuwrH0tN2f-uDoxeG9_03SOAlsOK3JwaeB-ksfuSK5bYve8iAHv-du8nUXre_b7CdETBnRFLl347MwmNoaYtOewRCgeYEJyG4OLbEO7o4mof2PJJK680fdDXv8LNFANn3OcIBQkQ-WbJiYdGnot5Ko7F5B2YA6JMrRhjbjjunBmTlfszzJwMWlp9OhF4zuyz0Eq";
  const moreCount = galleryImages.length > 4 ? galleryImages.length - 4 : 12;

  // Extract team members
  const teamMembers = group.members?.filter(m => m.role === 'admin' || m.role === 'manager' || m.role === 'owner') || [];

  return (
    <div className="p-4 space-y-8">
      {/* Section 1: Atmosphere */}
      <section>
        <h3 className="font-title-lg text-title-lg text-on-surface mb-4 tracking-tight">{t("group.about.atmosphere")}</h3>
        <div className="grid grid-cols-6 grid-rows-2 gap-2 h-[260px]">
          {/* Emotional Moment 1: Large Landscape */}
          <div className="col-span-4 row-span-1 rounded-xl overflow-hidden shadow-sm">
            <img className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" alt="Dance moment" src={img1} />
          </div>
          {/* Emotional Moment 2: Portrait */}
          <div className="col-span-2 row-span-2 rounded-xl overflow-hidden shadow-sm">
            <img className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" alt="Detail shot" src={img2} />
          </div>
          {/* Emotional Moment 3: Detail */}
          <div className="col-span-2 row-span-1 rounded-xl overflow-hidden shadow-sm">
            <img className="w-full h-full object-cover" alt="Atmosphere detail" src={img3} />
          </div>
          {/* More Card: Dark blur overlay */}
          <div className="col-span-2 row-span-1 rounded-xl overflow-hidden relative shadow-sm">
            <img className="absolute inset-0 w-full h-full object-cover" alt="More photos" src={img4} />
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="font-label-md text-white text-lg">{t("group.about.more", { count: moreCount })}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Evocative CTA & About */}
      <section className="space-y-4">
        <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/30">
          <div className="relative">
            <p className={`font-body-md text-body-md text-on-surface-variant ${!isAboutExpanded ? 'line-clamp-3' : ''}`}>
              {group.description || "Welcome to our community. We bridge the gap between traditional social dance and contemporary creative movement. Our community is built on the principles of inclusivity, artistic expression, and professional instruction. Whether you are a seasoned dancer or a curious beginner, you'll find a home on our floor."}
            </p>
            {!isAboutExpanded && (
              <button className="mt-2 text-primary font-label-md text-label-md" onClick={() => setIsAboutExpanded(true)}>{t("group.about.read_more")}</button>
            )}
          </div>
        </div>
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

      {/* Section 3: Scannable Info (Location) */}
      <section>
        <h3 className="font-title-lg text-title-lg text-on-surface mb-2">{t("group.about.location")}</h3>
        <p className="font-label-sm text-label-sm text-primary mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px]">info</span>
          {group.publicTransport || '합정역 8번 출구에서 10분 (10 mins from Hapjeong St. Exit 8)'}
        </p>
        <div className="flex items-center justify-between mb-3 p-3.5 bg-surface-container-low border border-outline-variant/30 rounded-xl">
          <p className="font-body-md text-body-md text-on-surface">{group.address || '3F, 42-1, Gangnam-daero, Seoul'}</p>
          <button
            className="px-4 py-2 bg-primary/10 text-primary font-label-sm text-label-sm rounded-lg active:bg-primary/20"
            onClick={() => {
              navigator.clipboard.writeText(group.address || '3F, 42-1, Gangnam-daero, Seoul');
              toast.success(t("group.about.copied") || "Copied to clipboard!");
            }}
          >
            {t("group.about.copy")}
          </button>
        </div>
        {/* Stylized Static Map Preview */}
        <div 
          className="rounded-2xl overflow-hidden border border-outline-variant/30 mb-3 h-48 relative group cursor-pointer shadow-sm"
          onClick={() => {
            const query = encodeURIComponent(group.address || '강남구 42-1');
            window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
          }}
        >
          <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Map preview" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB3RLqTb_phwlCCEHWGNJ2AMEZ2UR8J9u9Xs1AEaP2F4xVpYR9xvFn4bQa-zbnHGh0vN5DWQrjcHqMKTHeeWn88LuuYQphJw8iFQZ_-iXEPT5q2Frb52W7E51_ValbdBJ3RG1pO3gDrv9PTEnRFjmWZXU_QAbOo8irmkkA_PYc3x2GN7tYv3bZBHbMJhWa2elY3Cvc6pprMEEOzY0kcM4MgQZ-vMQi2wD1dNH9cVPHpN3ydBxDW6RYcNc85W1yIs95Ez2stBBaeJxc" />
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 animate-ping rounded-full"></div>
              <span className="material-symbols-outlined text-primary text-5xl filled relative z-10">location_on</span>
            </div>
          </div>
          <div className="absolute bottom-3 right-3 bg-surface/90 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-label-md text-on-surface-variant border border-outline-variant/20">
            {t("group.about.tap_expand")}
          </div>
        </div>
        {/* Map buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button 
            className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
            onClick={() => {
              const query = encodeURIComponent(group.address || '강남구 42-1');
              window.open(`https://map.naver.com/v5/search/${query}`, '_blank');
            }}
          >
            <span className="material-symbols-outlined text-on-surface mb-1">map</span>
            <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.naver")}</span>
          </button>
          <button 
            className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
            onClick={() => {
              const query = encodeURIComponent(group.address || '강남구 42-1');
              window.open(`https://map.kakao.com/link/search/${query}`, '_blank');
            }}
          >
            <span className="material-symbols-outlined text-on-surface mb-1">explore</span>
            <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.kakao")}</span>
          </button>
          <button 
            className="flex flex-col items-center justify-center py-3 bg-surface border border-outline-variant/40 rounded-xl active:bg-surface-container transition-colors shadow-sm"
            onClick={() => {
              const query = encodeURIComponent(group.address || '강남구 42-1');
              window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
            }}
          >
            <span className="material-symbols-outlined text-on-surface mb-1">location_on</span>
            <span className="text-[10px] font-label-sm text-on-surface-variant">{t("group.about.map.google")}</span>
          </button>
        </div>
      </section>

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
          {teamMembers.length > 0 ? (
            teamMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3.5 bg-surface border border-outline-variant/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary/5">
                    <img alt={member.name} src={member.avatar || member.photoURL || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + member.name} />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{member.name}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant capitalize">{t(`group.about.role.${member.role}`) || member.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    className="p-2 text-primary hover:bg-primary-container rounded-full"
                    onClick={() => toast.info(t('common.coming_soon') || 'Chat feature coming soon!')}
                  >
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Fallback Team Members */}
              <div className="flex items-center justify-between p-3.5 bg-surface border border-outline-variant/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary/5">
                    <img alt="John Doe" src={group.representative?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuDkMuKILImx0yr6P2dNWhndA1F81sLD9o_iEE86b6n0N5mG5Xkj7ZYsxp4PQdXTY_Po0kDf_pnYxtSuCP4234WgCJ9VSKsS0hI8wsinQCdtXtidp1tQpNZLNdp_d3o-5x-gvP1GqRecRcT_sXgcJZJUDQa3Jm3VRiKehwCuzAd3tVRMo_aqVJvTZ4o88m1UN7xKq72cynK0THTFnz0Lk2zlPuQw9-i9btOuKKQ03CAvnpQyzmNOPXBTBUOVtI_CCkDWWOM9iZSttHU"} />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">{group.representative?.name || 'John Doe'}</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{t("group.about.role.representative")}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    className="p-2 text-primary hover:bg-primary-container rounded-full"
                    onClick={() => toast.info(t('common.coming_soon') || 'Chat feature coming soon!')}
                  >
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                  <button 
                    className="p-2 text-primary hover:bg-primary-container rounded-full"
                    onClick={() => {
                      if (group.representative?.phone) {
                        window.location.href = `tel:${group.representative.phone}`;
                      } else {
                        toast.info(t('group.about.no_phone') || 'Phone number not available.');
                      }
                    }}
                  >
                    <span className="material-symbols-outlined">call</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3.5 bg-surface border border-outline-variant/20 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-surface-container-highest overflow-hidden ring-2 ring-primary/5">
                    <img alt="Sara Kim" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi6kAWW6SXxoxYElm8ZdRySTSj6CYeLhWZ0tkE7r50EjIDvKJWzzCpoMsqzi7jGmEX8eNgYQA0kh9fRWvM-uLMY72C1LeY_F7taWuPE7NmX1NX3wT84IYxgaS4zTY98w-hD_fFpDx4Ft_Q2EdpwIdrO8w3uIZ8fkgaO5ew2AdHEEOJQQAxQWLQNte6i5kvMu0n0af2xIiaotHlGUjmptAXQIEb2mzEFwL88GMbDwUqIRT5aAiYlsg9BIDl1wg9LIta0tpsUTyDxpQ" />
                  </div>
                  <div>
                    <p className="font-label-md text-label-md text-on-surface">Sara Kim</p>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">{t("group.about.role.manager")}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    className="p-2 text-primary hover:bg-primary-container rounded-full"
                    onClick={() => toast.info(t('common.coming_soon') || 'Chat feature coming soon!')}
                  >
                    <span className="material-symbols-outlined">chat</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Section 6: Payment Info */}
      <section className="bg-secondary-container/30 p-5 rounded-2xl border border-secondary-fixed-dim/20">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-primary filled">account_balance</span>
          <h3 className="font-label-md text-label-md text-on-surface">{t("group.about.payment")}</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-label-sm text-on-surface-variant mb-1">{group.bankDetails?.bankName || 'Hana Bank'}</p>
            <p className="font-title-lg text-title-lg text-primary tracking-wider">{group.bankDetails?.accountNumber || '123-456-7890-001'}</p>
          </div>
          <button
            className="px-5 py-2.5 bg-primary text-on-primary font-label-sm text-label-sm rounded-xl active:scale-95 transition-transform"
            onClick={() => {
              navigator.clipboard.writeText(group.bankDetails?.accountNumber || '123-456-7890-001');
              toast.success(t("group.about.copied") || "Copied to clipboard!");
            }}
          >
            {t("group.about.copy")}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-10 pb-6 border-t border-outline-variant/20">
        <div className="space-y-3 text-on-surface-variant/60 font-label-sm text-label-sm leading-relaxed">
          <p className="font-semibold text-on-surface-variant/80">{group.name || 'Community Studio'}</p>
          <div className="grid grid-cols-1 gap-1">
            <p>{t("group.about.representative")} {group.representative?.name || 'Admin'}</p>
            <p>{t("group.about.registration_no")} -</p>
            <p>{t("group.about.address")} {group.address || '-'}</p>
          </div>
          <p className="pt-6 uppercase tracking-[0.2em] text-[10px] font-bold text-on-surface-variant/40">© {new Date().getFullYear()} {(group.name || 'COMMUNITY').toUpperCase()}</p>
        </div>
      </footer>
    </div>
  );
};

export default GroupAbout;
