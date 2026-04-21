import React from 'react';
import GroupFooter from './GroupFooter';


const GroupGallery = ({ group }: any) => {
  return (
    <div className="relative z-10 group-y-12 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Gallery Header & Filters */}
      <section className="group-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">Gallery</h2>
            <p className="font-body text-sm font-medium text-on-surface-variant mt-1">Explore moments from the dance floor.</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button className="bg-primary text-on-primary font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2 rounded-full shadow-md shadow-primary/20 shrink-0">All Media</button>
            <button className="bg-surface-container-lowest text-on-surface border border-outline-variant/20 hover:bg-surface-container-low transition-colors font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2 rounded-full shadow-sm shrink-0">Photos</button>
            <button className="bg-surface-container-lowest text-on-surface border border-outline-variant/20 hover:bg-surface-container-low transition-colors font-label font-bold text-[11px] uppercase tracking-wider px-5 py-2 rounded-full shadow-sm shrink-0">Videos</button>
          </div>
        </div>
      </section>

      {/* Section: Milonga Nights (Bento Grid) */}
      <section className="group-y-4">
        <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined icon-fill text-primary">nightlife</span>
          Milonga Nights
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 auto-rows-[160px] md:auto-rows-[200px]">
          {/* Featured Item */}
          <div className="col-span-2 row-span-2 relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest">
            <img
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCI8DpnaTiYGDV709Jk2pPLfyFjmDihpzOclcXXWCKNxOUecKdoJHWxfogTfTwOPS0hqJfJN3CPpx7NO4M_l_awYb-g2Hj7tEhTniEv5ixUEkuzrwuXLjYZHsq-Ueu4XEDU0TcK8oqo45rg7V-OLxOfi9bfa5RHp7DeN7D8n5j4qWHDrx3Jw976zkoIoFbOhyzV_KmFlKPEEg511GsVwd9KkHiZ80P6td5xs6Gdp-tHaNIFHBNxqCZN12wBQBa1p8EPLAQcMst-tBk"
              alt="Grand Winter Gala"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#020a2f]/80 via-[#020a2f]/20 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-5 md:p-6 w-full">
              <span className="inline-block bg-tertiary-container/80 text-on-tertiary-container backdrop-blur-md font-label font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full mb-2">Featured</span>
              <h4 className="font-headline font-bold text-white text-lg md:text-xl leading-tight">Grand Winter Gala 2023</h4>
              <p className="font-body text-xs text-white/80 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">photo_library</span> 42 Photos
              </p>
            </div>
          </div>
          {/* Grid Item 1 */}
          <div className="relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest">
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuABV7DiKvKCf8H-4aa6jCYiti4MunvJTFxvqt1y9ebA1J2IjSjH2f6x6JFBgwCFGZDEdA1g7ZyAKaOqw04d8hROzf790vFONZNTyKQV4D1mwqHdvMCWfSH3Csh2drHLg_deMbQs-WHZYcYOLDvOB8vXmBNcvVnIOITtPU9rm7po7nM812YQjqTUgm3-3r-XpZjDE9oZeaAk-gMjq49-0owKR5JtGK0Wa_7UXBltj68SYfV1OByHWaQyAHjCPIivEIGmKYLdEmUjvU0"
              alt="Tango Shoes"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
          </div>
          {/* Grid Item 2 */}
          <div className="relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest">
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwc8YEHchhnEOoQ8lOnkj6-fnAvnepDrNRKmBdgWHGx0o1-QcCuW-gqVfNB5IMyO2vr9gzeH_bbc1icSWQ_mfcucnEfPtheg9YOh0DucG8ZgVhepE6uo9CUK2TbDpNvMaqmiXaeH6Jt8GtEi4gLlsRkBHBfa4-ncME40GIKu7bonLF_zVLypvHKKkxn6vJpg3ijnMwyCxLl2TWRf8eWmkeai9ghAjqvqJr2JDQq6iBpQeYwwDx3_-vNCC1u-sojSvZyT0DzXgcN_Y"
              alt="Tango Silhouette"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-1.5 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[16px]">play_arrow</span>
            </div>
          </div>
          {/* Grid Item 3 (Horizontal Span on Mobile) */}
          <div className="col-span-2 md:col-span-1 relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest">
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoPBJ587QRTEYsq6NMeeQKdL9WluXUQtiNBkzU3ohoWH1ol7WlsvRJpw1urSKyvCAsHRnRKl3hbXAjmyj2XhDqzeMtVcPJgVb95SsGW4J7x_drCcANq2kG_mOZX_8Ldp4GBU1mE8azsoHAZQa8aw6b7cnUVtWReSKER_d_m481Kpp_xQF6usfRrVGCgKrDF6LFOP3KssgRA3s8-2KlhuvXGvrEPwJ0DGE_1sslyHaz4nqufxf-RSXT07AuwtURWNmOcjYOh5i6Ohs"
              alt="Artistic Tango"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
          </div>
          {/* Grid Item 4 */}
          <div className="relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest">
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDonAuN-557HILRcccSkvoa1zSk_9weMVNVZJApAcCyyWoZy4q8YS-f9vAA-BOcC0So1wmkAiLyec_RKYGcAjM4CVzDaW4Coe5UHT-2Jo6NQhbTbdG_ko5gIGqVpANOJM9NKMxj6IpIKqef4pykVInRNN5zPXJ7SoikPtjfRoQSGDGIwnIfIIEF1QLgLNEHh9fdqS7lVVM1-R_rfDRGM04y24PHLdXSBHkq1-JwOpya5elqlYHQLadToQKIuCBPvOkqDbX6Zjs_WWg"
              alt="Live Band"
            />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
          </div>
        </div>
      </section>

      {/* Section: Class Moments */}
      <section className="group-y-4">
        <h3 className="font-headline font-bold text-xl text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined icon-fill text-secondary">school</span>
          Class Moments
        </h3>
        <div className="flex flex-col md:flex-row gap-3 md:gap-4 h-auto md:h-[300px]">
          <div className="w-full md:w-1/3 relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest h-[200px] md:h-full">
            <img
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSsmYKGQgpaqZNNdn9FtG4pNtIz-0wDajs7oz9HTrRfzNJ7GYmPCsEZZvn-RshEVjL1ToLvGROT-oj6bm70luCT2sf6Q1dqAaPgcwG90M1L4nxsobbc4D0T1hEL3KjkfSwNbKZkKOKkPnBKID-nng4JPmvw8GQ6muNc_oOFM02TIa8S9l7xSanTk5tZmTKZaZQmvjN4MqAxkneiboDrRVk7sL9yheWYdyecUza4K7suuQ87UbncpGj6kDtWAIGfYJFvjLd8LH8QDc"
              alt="Beginner Basics"
            />
            <div className="absolute bottom-3 left-3 bg-surface-container-lowest/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm">
              <p className="font-headline font-bold text-sm text-on-surface">Beginner Basics</p>
            </div>
          </div>
          <div className="w-full md:w-2/3 grid grid-cols-2 gap-3 md:gap-4 h-[300px] md:h-full">
            <div className="relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest h-full">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAptemV-ZEqkTD9cpcXCSG5IKFbEQzhwhlNwU9wR3QAbxYKTRjJTeIdxdSD_noCiuk92ky4_wYnIe0rPnc1g2TxGrDcavOLJK9qW7NVZ695tap-Jnc6gfWpwTo4g5L51SvlqDNCK5mWjAF8-C6B0Cdc0Qn38Np_DVe7reAfEmpchmCuTWZPljEQybySiRejvr2IWO1iqNmcxPfaJVBzStjcNguzKImWP80HLEpky2WMNZxGDpzLLwzrQNS-AAFAnrqB7KxD_lic2-c"
                alt="Instructor"
              />
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-sm group cursor-pointer bg-surface-container-lowest h-full">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDebm_xG9s4PuaVyrQU5y43yS2JbrO2U9I1CjTAGd8LJM2MPU1itfxuUhbMHdlmIVpNIyJhGfJZ-m2yjZH0_7HXt8B_lhxMsYWjOGMy9eDutWQsD1zqt2vCC2hjmBLapRvpvHPUVjtnvYXvOacDtMvQg87Qb8P1G-ChHN0vA1DWsIC18FrVQLh6LkUgHoC0ORhCl_GCbsrkAJCNsPwoPGvvoV69LjdhExNOY9GWqk8rOha40Du7LJ9ztRVjVzLFI35REuLW6RBTW2c"
                alt="Connection"
              />
            </div>
          </div>
        </div>
    </section>
    <GroupFooter communityName={group.name} />
  </div>
  );
};

export default GroupGallery;

