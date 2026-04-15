'use client';

import React from 'react';

export default function PlazaPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-8 space-y-8 mb-20">
      {/* 1. Stories/Moments Section */}
      <section className="relative">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2">
          {/* Current User Add Story */}
          <div className="flex flex-col items-center flex-shrink-0 space-y-2">
            <div className="relative w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#1A73E8] to-[#d8e2ff]">
              <img
                alt="User profile"
                className="w-full h-full rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwq10h8iqrKhkDwx3N8kLEQ9afABc2tIRb8FyBiwMtWl_geyyjYDBTyYpQoWnql8pXIAiVhQaf-maejAl3OMbhi7fzUCiacjBPePAIuEhwYS-Xmpx6X1ZzXnSBepuxq4Ul3YuYhVdWvk_wYblY_DQi5SSOAfX0oFmJu9b9o_LWxIdYzQVgEhk8lJckJ5_ki71qt_szdwAQicwU_7V_wGBD2epJTVDUqcjLfrG9RZC98nCYCkBPmTY6BRY0x5v42axa2ZjQE84xEZPO"
              />
              <div className="absolute bottom-0 right-0 bg-[#1A73E8] text-white rounded-full w-5 h-5 flex items-center justify-center border-2 border-white shadow-sm">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'wght' 700" }}>
                  add
                </span>
              </div>
            </div>
            <span className="text-xs font-medium font-label">Your Story</span>
          </div>
          {/* Other Stories */}
          <div className="flex items-center gap-4">
            {[
              { name: 'Marcus', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA1U0xojGMZPVmshEIH7VHA1OgH4Ud8EDDPe_hV4t_32PlDZw5LeWX5Vh6Oc750NiWXK4D2AgSiNJdpwoU-GDKjgF1wlJxLgow_9NzuRv4ntRHre99_UWomy2dgHFVmRGSkhsWmMd92RqcrCer6CGotdTkDBWoksMI8ZXwHDa5FcTvtufrOB7HUwGXMLKC8IR6bctGdUR2l-IRdke6gZqlU82OzCeSt6fJado2eu52RKzoD0G7LvMldRDVLrGE-LFgUBYPqQQzIMRaR' },
              { name: 'Elena', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdWETI7IMvplDMJScMicfarQFkJy7SwCO_7IDHiDngCpSzJZWWheIh2wI65VKoH7F4wJXgH6y8gKAYiv0rZmI2C9jlmBpCpxImhWL4HHx2ugy9HiIxoh9DKXvo33YnyE3frJUuyClU5s48imc3rWnx_BKE_64aDBidHTStPHKqc3hUNim-gXd8pTW3kh9hgoLd1DaZ2faPrxBGUdv6M2dyZs2jp6hdSWu6nwEWZUOUym4xPK0nr6LcgxAMONEC9tQ9wN5pAPRqbZzq' },
              { name: 'Julian', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRe0t_re3pQ1dun35QJhHh_Lztn1mewLJwhVXncOzCcJtBddHay0RPNrY4_Vf2ijnFpxNL-IWd-Yc3L3Y4r3mr7dWz-SGXSIwVgaeYWsgenzUZucze82iFzwaEbQNO8rB2qOW6onof-A65vidVKJi0Gqn2l7VzGwK6BoViCGVP1oAPb6xMR7b1wdONfFreQisYLvSf_0wn4rCbiWmnQfun6xqesSBNhiindUsd0nvxWFmyiV6EltoZC7y4Ywm2SrJYRYmLuyH5b8yo' },
              { name: 'Sarah', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-0encem7XUqrUvfCKdt4ODUOUaOwDwhKDFAX1-4TTDZly6YR2z6OrTDxQ633Br44FsvghXLIX_eBt7trXIZZ4McKn8xXSn1h68d6gk9Bf-wr5Locd3a01rA7Bn7rZavWAida477OGMWeZ-BjVVAdpGqlb-QfpBo7eAob5_k7XZfUCW9EKSoVxU8H-0-3wtW6gmOCVsUg8E5dFCC_SZetofyjrS0i1ucrAw-Ib-CPw3Rbc_cKVfQNP1uOx7SqCz2M7DAjpsDILhOYw' },
            ].map((story, i) => (
              <div key={i} className="flex flex-col items-center space-y-2">
                <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-[#1A73E8] to-[#d8e2ff]">
                  <img
                    alt="User profile"
                    className="w-full h-full rounded-full border-2 border-white object-cover"
                    src={story.img}
                  />
                </div>
                <span className="text-xs font-medium font-label">{story.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Post Creation Section */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-[#acb3b4]/10">
        <div className="flex items-center gap-4">
          <img
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCOoewVVIAXeHPaq4vh1yMRClDa6jcROjJf6lS7TUCX_Si1oih8zyKOjjgXDaWElFReLp_bXIu0szvxx8LcZdwTPqJ4J_6Ge50gOWAHNt5nZgcbOFyhlk3nb-An9jDKtS6hbPebrtwgNQL_pZEadgkASXtuap_WoWPWINYMRwOPZiK3dbW-78Cw7eNyqpxdEVo4Ok0pr9ub-h03QhX0s16Bn_y4KRD8psJEVAY-e-c9f4HqFK5A8u1WBTAXQuqcoe_F4ZBHnjDCaxqS"
          />
          <div className="flex-1">
            <input
              className="w-full bg-[#f2f4f4] border-none rounded-full px-5 py-2.5 text-[#596061] placeholder:text-[#757c7d] focus:ring-1 focus:ring-[#1A73E8]/30 transition-all font-body text-sm"
              placeholder="Share a moment..."
              type="text"
            />
          </div>
          <button className="text-[#1A73E8] p-2 hover:bg-[#d8e2ff] rounded-full transition-colors">
            <span className="material-symbols-outlined">image</span>
          </button>
        </div>
      </section>

      {/* 3. Content Feed */}
      <div className="space-y-8">
        {/* Visual Post (Tokyo) */}
        <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#acb3b4]/10 group">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                alt="Author"
                className="w-8 h-8 rounded-full object-cover border border-[#acb3b4]/20"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSPihbDFVEBvDiGErA3REawW4luxaPk7Khd51BG8JhywdiyBT3Gr3bxgHDdeb0sNjQnFaGaJtzn56ab120lJxPaskfKCvxlZZP5LLBWCfwQX6_xySqceL2HwA3VRRinE1Iv0dtdZABHBF0F_nbi1teRJnAsBHiDY5f8KOFX9URxB4qoPKoIlbglzhiOjIpezgXSyftZ-OPKEUHMcz4hdvBxdt9QtIHEGOq2K9jeIeU7im_wM-8J01vvIV3lK0ul3hvGPtjFGMcTPwY"
              />
              <div>
                <p className="text-sm font-bold font-headline leading-tight">Marcus Thorne</p>
                <p className="text-[10px] text-[#757c7d] uppercase tracking-wider font-label">2 hours ago • Tokyo, Japan</p>
              </div>
            </div>
            <button className="text-[#596061]">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="relative aspect-[4/5] overflow-hidden bg-[#ebeeef]">
            <img
              alt="Tokyo cityscape"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMYL1vFFR_xJM4YVOuB3_yCIswAV7I4UkVPuVCe0tQgvFY-xhQgq5G8-qxD8sUIFpuzG4G6VFAiBN1Sdy2HchiwX8xuegB-hzB6dadKivWxZ2G69iawO7fBHb49CoiOO3ZbGnPbXbPW833OoKG8TbUg0ETkbCsagwuHdUO9xWqBYfYnzXoJvBZru-ZN3l7umjsT6gW3MK3Q6bos3cWeiOtlwq2FLQg5TqrIo2s5UMMLlHfclmSJ3Nk78SY35obguUnsDZ5zz92JPt6"
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 glass-overlay text-white">
              <h2 className="text-2xl font-bold font-headline tracking-tight mb-2">City of neon dreams.</h2>
              <p className="text-sm opacity-90 font-body">Exploring the hidden alleyways of Shibuya as the sun dips below the skyline.</p>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-1.5 group/btn">
                <span className="material-symbols-outlined text-[#596061] group-hover/btn:text-[#9f403d] transition-colors">favorite</span>
                <span className="text-xs font-medium">1.2k</span>
              </button>
              <button className="flex items-center gap-1.5 group/btn">
                <span className="material-symbols-outlined text-[#596061] group-hover/btn:text-[#1A73E8] transition-colors">chat_bubble</span>
                <span className="text-xs font-medium">84</span>
              </button>
              <button className="flex items-center gap-1.5 group/btn">
                <span className="material-symbols-outlined text-[#596061] group-hover/btn:text-[#1A73E8] transition-colors">share</span>
              </button>
            </div>
            <button className="text-[#596061] hover:text-[#1A73E8] transition-colors">
              <span className="material-symbols-outlined">bookmark</span>
            </button>
          </div>
        </article>

        {/* Text-heavy Post (Design Sprint) */}
        <article className="bg-white rounded-xl p-6 shadow-sm border border-[#acb3b4]/10">
          <div className="flex items-start gap-4 mb-4">
            <img
              alt="Author"
              className="w-10 h-10 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB85iNa-SDvQCnRbbQLCN1pJtFZL_w1PstnzhLO3oMkRN7ZXSdMiQkHYViUO4XcXoWI46S2whD4fTw2tWYFkzuCvvMx18KRIIYiHDbQAb0eba-Fn7jFjpsvbfQlKBPP-MqkDjXMFFYYbKhKZgbTzmQUJpc0CrZPzS3Med54t8F7GHrHOzeDybQ-0OwiizRbATvlyLnO-n3yTYkNQPcppWEcq4TdTepUhW_klXmZLvkn3Zy8cwe5SY3GGS7pUFoEmsOS1z7P_9dzjrDU"
            />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold font-headline text-[#2d3435]">Elena Rodriguez</p>
                <span className="text-xs text-[#757c7d] font-label">5h</span>
              </div>
              <p className="text-[#2d3435] leading-relaxed font-body">
                Just finished the new design sprint for the <span className="text-[#1A73E8] font-medium">@plaza_app</span> redesign. The focus on{' '}
                <span className="text-[#1A73E8] font-medium">#minimalism</span> and user intent is really starting to pay off. What do you all think about the new typography? 🎨✨
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-[#acb3b4]/10">
            <div className="flex gap-6">
              <button className="flex items-center gap-2 text-[#596061] hover:text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined text-lg">thumb_up</span>
                <span className="text-xs font-semibold">Support</span>
              </button>
              <button className="flex items-center gap-2 text-[#596061] hover:text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined text-lg">comment</span>
                <span className="text-xs font-semibold">Reply</span>
              </button>
            </div>
            <div className="flex -space-x-2">
              <img
                alt="User"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBBhpXLkXEGIC8wVgNsgN4DPoARlprMPQEk8H3Vza-PL5nf7LEmwHpZ-FNSnpQGz6-6NcC8_L8rzlrmoa5Gg4pKRynpUoQUvlpAE4-ovXwzUmjWNfvLCWrRieeIX1k-5c9FcGUrd_w9c0EaQTIS6Ng-v4SafH-InWqh61O4URQJI2JiZ2n_KNAtZejGDoBgVJti-JVo2x8Luaw6vv4cUq9R5QkcVMkh9tA9AQi7-5Ve5AyTmvynKXuUTcx81icnLtCTc5SAelhHBDyu"
              />
              <img
                alt="User"
                className="w-6 h-6 rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAipiFNbRsHTRCWF3aSqa5Ce084nNo1HMwHNVym466Aek8DEn5FM_tc6re4B9Kj0sQ4n8aUyaW0fiav3sSiM7SlR7W3wuiqOlbdIbxVTMWKDVHccG5IyWUEcZP6nEn_1N9moHewlAuArKhp6nxvtbT7immkXyNUQQwW-Vro7_YZJ5bBjFA4mJvke_4yQGgPy6sb8WAq7PjWprbsVjEBUQsrby-E3SqbEkRDhN0gpHY2AzSHKjIDCvFB63Vbfpp_noX_6NdnMyu7b7qm"
              />
              <div className="w-6 h-6 rounded-full bg-[#e4e9ea] border-2 border-white flex items-center justify-center">
                <span className="text-[8px] font-bold">+12</span>
              </div>
            </div>
          </div>
        </article>

        {/* Detailed Threaded Post (Typography Process) */}
        <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#acb3b4]/10">
          <header className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                alt="User Avatar"
                className="w-10 h-10 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAneJHrbckeEoLzB-PhGKEJdWZvgZZI0_4s8_3KHpkGDwS_0lHXTpZhRFRcJjJTTmDN4D8y7ygsaImHL_5Czo_vB3u5YTcJRCi8dtQWhUNUL64XFst1bQYuqht_cqr9Hd2Fg8EmFa0YEWIXYVBwE5w5GyOUVG9dbPJiVwcplPi86e_oZiALvLDlsp2b6a4m9x0t0vtBFHyoO6veDMXJkS1QRinPUCL_EYeNOtz5ynozAOsdlbE5CExKTVdFNqzFeJyCil1QCIxI6nnV"
              />
              <div>
                <h3 className="font-headline font-bold text-sm leading-tight">Julian Vance</h3>
                <p className="text-xs text-[#596061]">
                  2 hours ago • <span className="text-[#1A73E8] font-medium">Design Community</span>
                </p>
              </div>
            </div>
            <button className="material-symbols-outlined text-[#596061]">more_horiz</button>
          </header>
          <div className="px-4 pb-3">
            <p className="text-sm leading-relaxed text-[#2d3435] font-body">
              After months of iterating on the typography systems for Plaza, we've finally landed on something that feels both modern and deeply accessible.
              The challenge wasn't just finding a pair of fonts, but finding a pair that works across every language and culture we support. We explored over 40 different
              sans-serif families before choosing Manrope for headlines and Inter for body text...{' '}
              <button className="text-[#1A73E8] font-semibold hover:underline">Read More</button>
            </p>
          </div>
          <img
            alt="Typography Process"
            className="w-full aspect-video object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuB99giqRntoMKWRiga1mw7mBLi0IUmQxfLk0-nBr7T3F1dLJvXO5J1lBkc5T0cvmmR54_hdDlNgxvk6uJwHYZp7mQZ01nL7JRsUSXx4iw1w1wQwWaDV76uCSn0fbnFRrVR8K9E5wkQ-FfMjhw70SIvIJlD2QlX6-1VBa0UnjzuHiSA7zBcSf76J327J1zSJzk0FO6yG5geqwigoH_eIuc20gWSHLHka309WMSbSWVTWs0rsRBV95HT3BxAGAMbu0-0AVXK9RAaDBYfp"
          />
          <div className="p-4 border-b border-[#ebeeef]">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-1.5 text-[#596061] hover:text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                <span className="text-xs font-semibold">1.2k</span>
              </button>
              <button className="flex items-center gap-1.5 text-[#596061] hover:text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined">chat_bubble</span>
                <span className="text-xs font-semibold">84</span>
              </button>
              <button className="flex items-center gap-1.5 text-[#596061] hover:text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined">share</span>
                <span className="text-xs font-semibold">12</span>
              </button>
            </div>
          </div>

          {/* Detailed Comment Section */}
          <section className="bg-[#f2f4f4] p-4">
            <h4 className="text-xs font-bold text-[#596061] uppercase tracking-widest mb-4">Comments (84)</h4>
            <div className="space-y-6">
              {/* Parent Comment */}
              <div className="flex gap-3">
                <img
                  alt="Commenter Avatar"
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPBBFQnTVcu0MWL00VzEPA9fJxID1lVng5u4eyQeYotcMMLoW4Hf85O63X4bi8qE7tYlP5XjeSN9dKDS93AYA1J0bfJlzz7oOAySVz55-PGJP80Ve9Il-49jThLUsfHXO0Uj0PLYn9-3GiAXEgZsJ5kan95ntCgYqiADSI6LZBCM4uR_dZ-BEV99oCvirX5PLfgyx9X7TmKwi3HDJfFXlGR3mys0mApUprUNwLtyIst6PNY_-LpvPm5o7562qYG49QRf3daaIis9im"
                />
                <div className="flex-1">
                  <div className="bg-white p-3 rounded shadow-sm border border-[#acb3b4]/10">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-bold">Elena Rodriguez</span>
                      <span className="text-[10px] text-[#596061]">1h ago</span>
                    </div>
                    <p className="text-xs text-[#2d3435]">
                      The choice of Manrope is inspired. It has that geometric clarity but with enough personality to not feel clinical. How are you handling the variable weight shifts
                      on mobile?
                    </p>
                  </div>
                  <div className="flex items-center gap-4 mt-1 px-1">
                    <button className="text-[10px] font-bold text-[#1A73E8]">Reply</button>
                    <button className="flex items-center gap-1 text-[10px] text-[#596061]">
                      <span className="material-symbols-outlined text-sm">thumb_up</span> 24
                    </button>
                  </div>

                  {/* Nested Replies (Level 1) */}
                  <div className="mt-4 space-y-4 border-l-2 border-[#dde4e5] pl-4">
                    <div className="flex gap-3">
                      <img
                        alt="Author Avatar"
                        className="w-7 h-7 rounded-full object-cover shrink-0"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDsnKNWDghAmoD_JBrzPG7rjN0LoIkYUk3CWGWmNI9UijZvBBCdYdwr9NZ0D3qR9GBubo5zyit7rFdpwbTT8E-obHuXIGbf00beodcg55vlMuTe8jNUA0YO3r0tA2nqHOfnppPFan-1W9iJ1JGgAuDN0AOOIFNRP8rCIivXE1QWPWUyFmAMRPpAmvqsdmEBiQlZxy_GqmSSK2ywah0emwwNA3WLsllXepsp30OxUAn7ROYxenhMBvg-u0c07pFY7mkBp7XE7FrSIHQ2"
                      />
                      <div className="flex-1">
                        <div className="bg-white p-3 rounded shadow-sm border border-[#acb3b4]/10">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold">
                              Julian Vance <span className="ml-1 text-[9px] bg-[#1A73E8]/10 text-[#1A73E8] px-1.5 py-0.5 rounded uppercase">Author</span>
                            </span>
                            <span className="text-[10px] text-[#596061]">45m ago</span>
                          </div>
                          <p className="text-xs text-[#2d3435]">
                            Great question, Elena! We're using a clamp function for sizing and keeping the weight axes restricted to 400 and 700 to ensure rendering performance stays
                            high on older Android devices.
                          </p>
                        </div>
                        <div className="flex items-center gap-4 mt-1 px-1">
                          <button className="text-[10px] font-bold text-[#1A73E8]">Reply</button>
                          <button className="flex items-center gap-1 text-[10px] text-[#1A73E8]">
                            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                              thumb_up
                            </span>{' '}
                            8
                          </button>
                        </div>

                        {/* Nested Replies (Level 2) */}
                        <div className="mt-4 border-l-2 border-[#dde4e5] pl-4">
                          <div className="flex gap-3">
                            <img
                              alt="Reply Avatar"
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaeLZdvBqReLNAHltF2HysZ_zqa3TKF9JZLm2WSn9ru8w3E8sAo8BVziWYhHOKQLS6C5Wt6fro-hruO4xo7J2K1yvUEVX4PQS0RGhw1313MzcqWdkff3Mdn4bpSENjqKwx4nXtTAOr77NODL8ilMvg3MysS4BIfP89gJrIJkQ-o_Sl5n6nnogV4jBM-znsF56kHnnENEcBUUeH_Cul9fiZnzd2Iy5RK2-J8Tols0-0FrNFmOhQNJ6A75_5WgrptC0uZ7Ax43gThdQr"
                            />
                            <div className="flex-1">
                              <div className="bg-white p-3 rounded shadow-sm border border-[#acb3b4]/10">
                                <span className="text-xs font-bold">Marcus T.</span>
                                <p className="text-xs text-[#2d3435] mt-1">Clamp() is definitely the way to go. Are you seeing any issues with line-height on smaller viewports?</p>
                              </div>
                              <div className="flex items-center gap-4 mt-1 px-1">
                                <button className="text-[10px] font-bold text-[#1A73E8]">Reply</button>
                                <button className="flex items-center gap-1 text-[10px] text-[#596061]">
                                  <span className="material-symbols-outlined text-sm">thumb_up</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Comment Input */}
            <div className="mt-8 flex items-start gap-3 bg-white p-3 rounded-xl border border-[#acb3b4]/30">
              <img
                alt="My Avatar"
                className="w-8 h-8 rounded-full object-cover shrink-0"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpxKrr6fhTyrBo3hTr61pYKe-V0Jq2mRZJlec9iS0XHjUbigSxQ1e8F-iqwaw0u41YNqhy8SFgbUNs4axTY_OD_NrQsNF0RtNQHCzHS-4eyc5z6B3qy-Xp8XkgeEkwQjCx2gtoZGtfxkBRX0gKKhdMuWpHPj0xypvqUNgZ9hXXkQFwBPWcWQePHbqvxmIm2R7gjX0NigkkD6_rwa2_PEXb62OmmmEXKVSl5enlVd4v0nlb2nQHfSg-3-8fjrnALTEjT8XmCiYWhzEX"
              />
              <div className="flex-1 relative">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 text-xs p-0 resize-none min-h-[40px] custom-scrollbar font-body"
                  placeholder="Write a comment..."
                  rows={2}
                ></textarea>
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#ebeeef]">
                  <div className="flex gap-2">
                    <button className="material-symbols-outlined text-[#596061] text-lg">image</button>
                    <button className="material-symbols-outlined text-[#596061] text-lg">mood</button>
                  </div>
                  <button className="bg-[#1A73E8] text-white text-[10px] font-bold px-4 py-1.5 rounded uppercase tracking-wide active:scale-95 transition-transform">Post</button>
                </div>
              </div>
            </div>
          </section>
        </article>

        {/* Shared Media Grid Post (Architecture) */}
        <article className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#acb3b4]/10">
          <div className="px-4 py-2 bg-[#f2f4f4] flex items-center gap-2 border-b border-[#ebeeef]">
            <span className="material-symbols-outlined text-sm text-[#596061]">repeat</span>
            <p className="text-[10px] font-bold text-[#596061] uppercase tracking-wider font-label">Sarah Chen shared this</p>
          </div>
          <header className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                alt="Creator Avatar"
                className="w-10 h-10 rounded-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQKbNZorleLwJs6SiMnxgW8GGNZLC5TdNzS9TjVV3pI58ejw3XmvF6o9YC-C-VY87wLwSEM2Unzlm913lvxngJ_iVsLMnbXIecKMMtVkJu_TqCL1hBrV7d99Z8koR73LMZqQRl6riohJeCKxI3IEHMxQt8yLV4HuJOh7c-rnzSTg-ZLNHdPMZiV6UjH5QjDf8qc443H7lKmsRUPXCetOdtm-Qr4LKwZV5HuWr847dAP4in9ozEO8y2urdK5fLQ3QAEB2CMqhWPwivW"
              />
              <div>
                <h3 className="font-headline font-bold text-sm leading-tight">Art & Architecture</h3>
                <p className="text-xs text-[#596061]">5 hours ago</p>
              </div>
            </div>
          </header>
          <div className="px-4 pb-3">
            <p className="text-sm text-[#2d3435] font-body">
              Brutalism meets nature in this new forest retreat project. Swipe to see the interior details. <span className="text-[#1A73E8]">#Architecture #Design</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-0.5 bg-[#ebeeef]">
            <div className="relative aspect-square">
              <img
                alt="Architecture 1"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4PmUJprgnxN4CcItJkdZBJP8Cd0CTgbiRiKyyBY_yIqGVZA5Tj-AO1T98vYfJK3krgnATCxO2kJRJIj3Mo8YqdkXW1tTtTOFr7Fr1KcWwN-15_z2xA_BJt2R817ySDcraTtmtDNaCX32sHo_wJCJRxOgXt_zrvX9DRXIkpJBsrP91SL4QoGaMiatOcya9EUalQmIc0YHnUWgklZ4132okVnpZJyKz4haNkAmMeOfFYnVEag6Qh6M6juMl3vvv6kc683U59T4rk73Q"
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full border border-white/20">
                <span className="material-symbols-outlined text-[12px] text-white">person</span>
                <span className="text-[9px] font-medium text-white">@nature_builds</span>
              </div>
            </div>
            <div className="grid grid-rows-2 gap-0.5">
              <img
                alt="Architecture 2"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjohqTZVcf_y-uWw5TPs9JEC7_ezylkyrJrp4SdptfP1B4OEuajnRWJRlnxjyVSO7bWsOQjEf4wywRib2BvA5DjODJaTf96Pyw3VcaXohnYKJG39Td3w8K4INZZ0bZJyDVb0Z-SyvjJYhTV4ewMxyrjjydl-jFmF1l4YM0tYVpUR6-QGx6IyeYCgfKeX-7XW6LYpG5es_MNwuqUAO-9smXEai9O-qeXkqMPQNwFKUUeijogyUlKCdPOwL5e3fmOAwsarNy0Lgtj2Wo"
              />
              <div className="relative">
                <img
                  alt="Architecture 3"
                  className="w-full h-full object-cover"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDp2hJt7-UzBuwJHeriKxwLe1cDwCoxXR7FKioj8n1najEnyQ0s4FV6yRuxgLYQKw2JK7ulBvr3DKPiBoWqHbF30WB41ojMUfQFBEnZ60iDAoTIk2kq7tqfL9AqPXrVG88t7uD0t2HKspQS7qCuswKZSluSxd26llaoPDaZTJ4rBwe6NmFbqJsTE47zBLJxnRrNP8LtbKU4hgrc6RG4fjKkvHWek3csluhNbJq3nL2Jvbr8oWN3nrB6SjmazS9h6ne9spcR4b7jUS-i"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+4</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button className="flex items-center gap-1.5 text-[#596061] hover:text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined">favorite</span>
                <span className="text-xs font-semibold">438</span>
              </button>
              <button className="flex items-center gap-1.5 text-[#596061] hover:text-[#1A73E8] transition-colors">
                <span className="material-symbols-outlined">chat_bubble</span>
                <span className="text-xs font-semibold">18</span>
              </button>
            </div>
            <button className="material-symbols-outlined text-[#596061]">bookmark</button>
          </div>
        </article>

        {/* Simple Status Post (Tokyo Check-in) */}
        <article className="bg-white rounded-xl p-6 shadow-sm border border-[#acb3b4]/10">
          <div className="flex items-center gap-3">
            <img
              alt="User Avatar"
              className="w-10 h-10 rounded-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkdPlTKf7zMC7EmdHFfC4izDArzq-0JAxkJA4WUf9nx74M9d58Nbl5NK6xWRGUphlGDmQvEwq4KOQFsKY5UeP278Vhd2uy84hXuwmvxhrUBPWsvJSgvYoI8iUQkZyioBejPGDE3oTfmm5sFiKC7ixmkcHGiPc26qse-xZaEH9jbvSls68VC0sMPEhNpA2Q-hwj5Sv6nNQB8B_raH5T6jmxKzVqi1ju-RnPoL8Y4lMPN-ce46nab-ju6d_wGyWW9pciOSvp4Aae7wjB"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-headline font-bold text-sm">Alex Rivera</h3>
                <span className="material-symbols-outlined text-blue-500 text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </div>
              <p className="text-xs text-[#596061] leading-none font-label">
                Feeling <span className="font-bold text-[#2d3435]">Inspired</span> • Tokyo, JP
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#2d3435] leading-relaxed font-body">
            Just touched down in Tokyo! The density of design inspiration here is absolutely overwhelming in the best way possible. Expect a lot of street-style captures over the
            next few days. 🇯🇵
          </p>
          <div className="mt-4 flex items-center gap-2">
            <div className="flex -space-x-2">
              <img
                alt="A1"
                className="w-5 h-5 rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAeVlmzcwswUwC-FFBP7ZcYewOujBBXP2WG90EURme0rjA8iD2N-KHbsErx7_jSTie8fw9aBOexBsH9O056S2vv4ARWL3iWj6vLh3Fpuubqxv6e3UDIdrxvTi-F48b8uLH1aSXSnjtXLaWses1LCp1EdrvynjlUpW5WRXQ_2vL_H1Rtuxum26NJVLIqMrISZE9bxloXRWF98kGOODtZx-q-FUOzW-uCVDIr2_7MtaMGt90NN_V46LcT-0A0TdzHYt1XpSnePO2ybD8J"
              />
              <img
                alt="A2"
                className="w-5 h-5 rounded-full border-2 border-white object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCjazJ_QH5AY4kjFvq0dReLb91jSxNdcjuPCUORguibS3X3fQBriDHsSsV4ZqGaiq5LdfARNDGbsCK_Js27-tiVZAFbRQC7MbenkCFSTtagxoJtSvIWzeu4ImOAL5rUC5TwW1KsAyasT8pB-EnmX4V1SgcfUDCHYdpdJbm_tb1HIsKTTb00YqyNDWZoDeQtTbH9wemX51945YlP7U3iuOgqZ9Cvl_wn4Zqvb_wjAXtt8Srg4IBxT8936OslvtH1S4sxOvTwawoVVtZq"
              />
              <div className="w-5 h-5 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">12</div>
            </div>
            <p className="text-[10px] text-[#596061] font-medium font-label uppercase tracking-wider">Liked by Marcus and 12 others</p>
          </div>
        </article>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .glass-overlay {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dde4e5;
          border-radius: 10px;
        }
      `}</style>
    </main>
  );
}
