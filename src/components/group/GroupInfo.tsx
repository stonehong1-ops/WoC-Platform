"use client";

import React from 'react';
import { Group } from '@/types/group';

export default function GroupInfo({ group }: { group: Group }) {
  return (
    <div className="bg-[#F1F5F9] font-['Inter'] text-[#242c51] min-h-screen">
      {/* 폰트 및 아이콘 스타일 주입 */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          font-family: 'Material Symbols Outlined';
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* 템플릿 전용 컬러 정의 */
        :root {
          --primary: #0057bd;
          --on-primary: #f0f2ff;
          --secondary: #3a53b7;
          --surface: #F1F5F9;
          --on-surface: #242c51;
          --on-surface-variant: #515981;
          --outline-variant: #a3abd7;
          --surface-container-lowest: #ffffff;
          --surface-container: #e4e7ff;
          --surface-container-highest: #d6dbff;
        }
      `}</style>

      <main className="py-8 px-4 max-w-7xl mx-auto space-y-8 antialiased">
        {/* Representative & Info Bento Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Profile Card */}
          <div className="md:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-[#a3abd7]/20 flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-32 h-32 rounded-2xl overflow-hidden shadow-lg flex-shrink-0">
              <img 
                alt="Representative" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBg0hcqS8R0bUIfFdr_c4et8wW4dgRDtNcQoP6_GflVR-MG9fMN80d4FlviebJ45DpKjr4TCYME9LuXk86J3oM8ZsEb-6lpWYBxP-X9U-iTSCUW4n4tXcC5y9hT0QywRNBgVtSegoopYHd0j6q9GkHUo7vIMiozel715zV4fiehpf3YY97bQFYM0ouET49EkwTSqXEru0KXaNA_WywcWXbsG1EYKxjWKrRrBYlh0CMLAcLgxTyPD3owX7gE7KI3e4ikLb1kkjENd2s"
              />
            </div>
            <div className="text-center md:text-left space-y-2">
              <h1 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#0057bd]">Alex Chen</h1>
              <p className="text-[#515981] font-medium">Community Director</p>
              <div className="flex flex-col gap-1 text-sm text-[#515981]">
                <span className="flex items-center justify-center md:justify-start gap-2">
                  <span className="material-symbols-outlined text-base">mail</span>
                  alex.chen@communityhub.org
                </span>
                <span className="flex items-center justify-center md:justify-start gap-2">
                  <span className="material-symbols-outlined text-base">call</span>
                  +1 (555) 012-3456
                </span>
              </div>
              <div className="flex gap-3 pt-3 justify-center md:justify-start">
                <a className="w-10 h-10 rounded-full bg-[#c7cfff] text-[#223ea2] flex items-center justify-center hover:scale-105 transition-transform" href="#">
                  <span className="material-symbols-outlined">social_leaderboard</span>
                </a>
                <a className="w-10 h-10 rounded-full bg-[#c7cfff] text-[#223ea2] flex items-center justify-center hover:scale-105 transition-transform" href="#">
                  <span className="material-symbols-outlined">photo_camera</span>
                </a>
                <a className="w-10 h-10 rounded-full bg-[#c7cfff] text-[#223ea2] flex items-center justify-center hover:scale-105 transition-transform" href="#">
                  <span className="material-symbols-outlined">chat</span>
                </a>
              </div>
            </div>
          </div>

          {/* Map & Location Card */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#a3abd7]/20 flex flex-col">
            <div className="h-40 w-full relative">
              <img 
                alt="Map View" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAE2AR1GeaAKwWVfAy4T6X4jG6X6WVUCAVHNFfMEgK9aCJSsHs8m3Bauz-n3fTn5UC-0MfVX1HeYZELlUp7j53FL6_DB_m5mETG_VAA2O58bc9muYhmuTCzuMEcL7_9kQGWuYvI9P4JkuVtfvjlZp0W5PsbCP2IiqzhS0VIfB6vN1_UTuHH_kkE5SGvDkazXK9-e1gWKs6284GN6-Sw64Xfbjmz9OxIX5aUX9kmz2jNiaMoLdVjbVjg-8kWOOsUIDpECsemUtQFnk0"
              />
              <div className="absolute inset-0 bg-[#0057bd]/10 pointer-events-none"></div>
            </div>
            <div className="p-4 flex-1">
              <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-[#242c51] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0057bd]">location_on</span>
                Our Location
              </h3>
              <p className="text-sm text-[#515981] mt-1 leading-relaxed">
                123 Community Way, Creative District<br/>
                San Francisco, CA 94103
              </p>
              <div className="mt-4 flex flex-row gap-2 justify-between">
                <button className="flex-1 flex flex-col items-center justify-center py-2 h-auto bg-[#e4e7ff] text-[#0057bd] rounded-lg hover:bg-[#d6dbff] transition-colors shadow-sm" title="Google Maps">
                  <span className="material-symbols-outlined text-xl mb-1">map</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">Google<br/>Map</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center py-2 h-auto bg-[#e4e7ff] text-[#0057bd] rounded-lg hover:bg-[#d6dbff] transition-colors shadow-sm" title="Naver Maps">
                  <span className="material-symbols-outlined text-xl mb-1">assistant_navigation</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">Naver<br/>Map</span>
                </button>
                <button className="flex-1 flex flex-col items-center justify-center py-2 h-auto bg-[#e4e7ff] text-[#0057bd] rounded-lg hover:bg-[#d6dbff] transition-colors shadow-sm" title="Kakao Maps">
                  <span className="material-symbols-outlined text-xl mb-1">explore</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-center leading-tight">Kakao<br/>Map</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Transit Guide */}
        <section className="bg-[#0057bd]/5 border border-[#6e9fff]/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#0057bd] text-[#f0f2ff] p-2 rounded-lg">
              <span className="material-symbols-outlined">commute</span>
            </div>
            <h2 className="text-xl font-bold font-['Plus_Jakarta_Sans'] text-[#242c51]">Transit Guide</h2>
          </div>
          <p className="text-sm text-[#515981] mt-2">Convenient public transport options available right at our doorstep.</p>
        </section>

        {/* Gallery Section: Workshops */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#242c51]">Workshops</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#d6dbff] rounded-2xl overflow-hidden group">
              <div className="h-48 relative">
                <img 
                  alt="Workshop" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhuM4qI31SOx6dc4CkC_lzba5uC1m_PHimGFd0pNWm4TN33aox81vIbYWEr44AcafKQlENcf62_OMB4OiLXxQt_-QWBVqda5XpF-vhLCGXw36duxjkB2HeZ1kle9eN8prH0AvXULJDIp_Rb29xzjYzSHzlSJXWMTDWBzfqbnhCvqeN2vVU6rrD7f6p-SErCtteE6lWLQmEFJ92YJkZgZovXzwXgIXpFw7mPKK-aULKUM0TiI6grIQTbAj4KxiMfD1ymx7PHJb9Nl8"
                />
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#242c51]">Digital Arts 101</h4>
                <p className="text-xs text-[#515981] mt-1">Mastering the basics of creative software and digital workflow.</p>
              </div>
            </div>
            <div className="bg-[#d6dbff] rounded-2xl overflow-hidden group">
              <div className="h-48 relative">
                <img 
                  alt="Workshop" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCz44um1gcDxYfHDsO-_JTDnOLMDgmIKgebmT6W-RfcaK0XocCw7G5RKwsx7h4oxvF2MtLS4R6dezEQ0_e-YnozxXFPZTFTOnldFN_vnYVjVB_io2HKVr1zrPg7Ar7kDFhc67_v0kB86kert2ts_IIVNL1oSb2-2ZZMFKvtcj6vHvD_JWp5YhHPH-unM5CxfXqoyWg5PaZ1A1AaAIPBghC9Ab66ObMbjWDdDSR051_JDiSb91bIDzz8wFukuD1xMOkacjzdB-68mM4"
                />
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#242c51]">Modern Pottery</h4>
                <p className="text-xs text-[#515981] mt-1">Tactile creativity and hand-building techniques for all levels.</p>
              </div>
            </div>
            <div className="bg-[#d6dbff] rounded-2xl overflow-hidden group">
              <div className="h-48 relative">
                <img 
                  alt="Workshop" 
                  className="w-full h-full object-cover" 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4Sy7U8PjutANz6WpQ8IKxhRg2181_UUsMe2h9aqS1693S-lD6nU9JToX4d46b2yBQYuF83q_a_RDf2Bd_V5uqgTr4Mss817U12hYSixtZcK3P91uHthehawR2hmODbrPmOvOE1Xt8oVrmbYX_A18Efcw21B-gZVKEz6jRLZhG-9f3T-ryNFfZ2cI6lBYlqwGO8vrIsskc-UnpYVKSCu-ui9yCS7zclsGtYimZ-shjPHoDgokTQPS9H1a3RZKf4CM-1A7ARtucw9I"
                />
              </div>
              <div className="p-4">
                <h4 className="font-bold text-[#242c51]">Code for Good</h4>
                <p className="text-xs text-[#515981] mt-1">Building community-driven open source projects for social impact.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Section: Socials */}
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-extrabold font-['Plus_Jakarta_Sans'] text-[#242c51]">Socials</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 snap-x">
            <div className="flex-shrink-0 w-64 aspect-[3/4] rounded-2xl overflow-hidden relative snap-start">
              <img 
                alt="Social" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBI7d2llY0AEOc5Kkw6dmTq87mE9xwBtAqGmithHJMB97jhZ3D43RchwXDLxnBbHkB3cKKtOr4WAGc99XNTir-INoVAW21X4QahA0BrmEdBT9fNAzwViUWaP3rx-P6b6voBQVUfujbA0yeAM1ztc9Y9ByoxaslqNOiwFWCG3CRVdj_ilrjm-iiOsCs3AhFIPIDTrd8kvwzH-JityLIT0gIOptqd2bkUGggewTD_YgIr85UBlQ8qdy9PnSNxpc_UjerNCT-kpZ65m-E"
              />
              <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-bold">Midnight Jazz Night</p>
              </div>
            </div>
            <div className="flex-shrink-0 w-64 aspect-[3/4] rounded-2xl overflow-hidden relative snap-start">
              <img 
                alt="Social" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXsAGkx7JEgEMa5G8jRppIsA18Q6Os9qbfckhwiUtEDSyUVOvG9ZdBrP9srDv4_27KxDwGANN2H9p9pTOmpAS-SQM1QTB-fSIkcTtoMPu-NfdvmEBzF9J-C3FcHVJPvr8T0VqhNasXPu4brYbHUL5WtdV98rra5zVrOZhCd5Rw7v1gBInQz5WY1uKKrt5vOkro96U8zcB5sqFSS--QUSKqLptitft_1VKN2sa59HJA0dCm-Auf6pRN82MTJbP1kJsDXcnV5KsjHRs"
              />
              <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-bold">Rooftop Sundowner</p>
              </div>
            </div>
            <div className="flex-shrink-0 w-64 aspect-[3/4] rounded-2xl overflow-hidden relative snap-start">
              <img 
                alt="Social" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDpuBiezvlbQ9Z186ENI2lUJC8BCeIKbpspyVKqtGEdodHx8Iwwp2GhXx9EJ9HXtMvM0CEptQcRNrMTpuodn-cihQryBNgwDoe96yZuOr1pwZQqVKULmF7Q8tv61WXY8MuCYJA2wVRTbOPLY_CTNCAyHw9xJkZbwE6dmWCP0t6FZfqFoJ-_se6lHAVdLMGoPISQKbOV_t-O8qCbWk-ZJyGwkCxRhMcGurjp5PXP9eMMv7k4TGeA-dEVmgnPyDSwqZO2fPwBm4BRkU"
              />
              <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-bold">Summer Carnival</p>
              </div>
            </div>
            <div className="flex-shrink-0 w-64 aspect-[3/4] rounded-2xl overflow-hidden relative snap-start">
              <img 
                alt="Social" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWFGHWUEDvkU4p1gwt6kpJnz3j18DF7T1kQQVgD_8Ih_r4cACCsqLYnYGd3f0p7eb5F6G1yU1M-daeE2jK0L4shAg_-z8IoWhwlMw4rwZxCGrQz1m3LVaySkkdM6JU5aAD2QjOe2XN5hr2aqYGOekQALSCOY3omNAIRa6uW8IqkLbHgl9AxNnl9x6-_G33nYC2F5bgdb-6Dg8FUqFvIlJ_dGYupXfyZeOfOPa0mKR5D75kzxmJVf-DndKsQMkU6IaiV0qxVEVT6ak"
              />
              <div className="absolute bottom-0 w-full p-4 bg-gradient-to-t from-black/80 to-transparent">
                <p className="text-white font-bold">Annual Art Gala</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
