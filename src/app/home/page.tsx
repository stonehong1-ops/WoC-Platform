'use client';

export default function SocietyPage() {
  return (
    <>
      {/* Verbatim Assets from aiantigravity.txt */}
      <div dangerouslySetInnerHTML={{ __html: `
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <script id="tailwind-config">
          tailwind.config = {
            darkMode: "class",
            theme: {
              extend: {
                "colors": {
                  "surface-container": "#f2ecf4",
                  "outline": "#7a7582",
                  "on-secondary-fixed-variant": "#4b4263",
                  "on-error-container": "#93000a",
                  "on-primary-fixed": "#22005d",
                  "background": "#fdf7ff",
                  "inverse-surface": "#322f35",
                  "surface-bright": "#fdf7ff",
                  "on-secondary-container": "#645a7d",
                  "primary-container": "#6750a4",
                  "on-surface-variant": "#494551",
                  "tertiary-container": "#c9a74d",
                  "secondary": "#63597c",
                  "error-container": "#ffdad6",
                  "on-secondary-fixed": "#1f1635",
                  "on-tertiary-container": "#503d00",
                  "outline-variant": "#cbc4d2",
                  "surface": "#fdf7ff",
                  "on-tertiary": "#ffffff",
                  "on-background": "#1d1b20",
                  "tertiary-fixed": "#ffdf93",
                  "inverse-on-surface": "#f5eff7",
                  "on-primary": "#ffffff",
                  "inverse-primary": "#cfbcff",
                  "surface-container-lowest": "#ffffff",
                  "surface-container-highest": "#e6e0e9",
                  "on-surface": "#1d1b20",
                  "tertiary-fixed-dim": "#e7c365",
                  "on-tertiary-fixed-variant": "#594400",
                  "secondary-container": "#e1d4fd",
                  "primary": "#004190",
                  "surface-tint": "#6750a4",
                  "error": "#ba1a1a",
                  "secondary-fixed": "#e9ddff",
                  "on-primary-container": "#e0d2ff",
                  "surface-container-low": "#f8f2fa",
                  "on-primary-fixed-variant": "#4f378a",
                  "secondary-fixed-dim": "#cdc0e9",
                  "surface-dim": "#ded8e0",
                  "primary-fixed": "#e9ddff",
                  "on-error": "#ffffff",
                  "on-secondary": "#ffffff",
                  "tertiary": "#765b00",
                  "on-tertiary-fixed": "#241a00",
                  "surface-variant": "#e6e0e9",
                  "primary-fixed-dim": "#cfbcff",
                  "surface-container-high": "#ece6ee"
                },
                "borderRadius": {
                  "DEFAULT": "4px",
                  "lg": "8px",
                  "xl": "12px",
                  "full": "24px"
                },
                "spacing": {
                  "page_margin": "24px",
                  "section_gap": "40px",
                  "element_gap": "16px",
                  "component_padding_x": "16px",
                  "component_padding_y": "12px"
                },
                "fontFamily": {
                  "body-lg": ["Inter"],
                  "label-md": ["Inter"],
                  "headline-md": ["Plus Jakarta Sans"],
                  "headline-lg": ["Plus Jakarta Sans"],
                  "display-lg": ["Plus Jakarta Sans"],
                  "body-md": ["Inter"],
                  "label-sm": ["Inter"],
                  "title-lg": ["Plus Jakarta Sans"]
                },
                "fontSize": {
                  "body-lg": ["18px", {"lineHeight": "1.6", "fontWeight": "500"}],
                  "label-md": ["14px", {"lineHeight": "1.2", "fontWeight": "600"}],
                  "headline-md": ["24px", {"lineHeight": "1.3", "fontWeight": "800"}],
                  "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "800"}],
                  "display-lg": ["56px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "800"}],
                  "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "500"}],
                  "label-sm": ["12px", {"lineHeight": "1.2", "fontWeight": "500"}],
                  "title-lg": ["20px", {"lineHeight": "1.4", "fontWeight": "700"}]
                }
              }
            }
          }
        </script>
        <style>
          .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
          .hide-scrollbar::-webkit-scrollbar { display: none; }
          .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          body {
            min-height: max(884px, 100dvh);
          }
        </style>
      `}} />

      <div className="bg-background text-on-background antialiased font-body-md w-full relative">
        {/* Hero (Global) */}
        <section className="relative w-full h-[707px] flex items-end">
          <div className="absolute inset-0 z-0">
            <img alt="Seoul Tango Festival Hero" className="w-full h-full object-cover" data-alt="A dramatic cinematic shot of a professional tango couple dancing in a grand Seoul ballroom under soft warm spotlights. The aesthetic is high-end and minimalist, featuring deep blue shadows and crisp white highlights. The atmosphere is intense and cultural, reflecting the premium Global Tango Society brand identity in light mode. Soft hazy light filters through large windows in the background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsn06PBSQ_0WLj6HQver8YQxsHpUnVTWgsTikKYuzlLqX36VXybjb0NoATo1Hv5WHiEDc-PLIVQhSoGxqBJmDxTyj4DIc3g0JoObS_9E-Two_toLGaURWAO52uSzeKetaPNsDzmgs_GOFHuglgMCssXVIeaoWLUBVEe6PVREhCTg4c8WG4gzc-c1G6uJquiITKq3H4iIp33xaKic88nRh-SNwd_YG8Xaq9eS_vpzjM1V8RqyONQP-Zk_aYpRoR5aYE79Hiha-Ysqs"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-page_margin pb-section_gap w-full">
            <span className="bg-primary text-white px-3 py-1 rounded-lg font-label-md text-label-md mb-element_gap inline-block">HOT FESTIVAL</span>
            <h1 className="font-display-lg text-display-lg text-white mb-4">Seoul Tango Festival is Rising</h1>
            <p className="font-body-lg text-body-lg text-white/90 max-w-2xl mb-8">A night in Seoul with world-class maestros. Join the wave of tango where the melody of hot passion flows.</p>
            <button className="bg-primary text-white font-label-md text-label-md py-4 px-10 rounded shadow-lg hover:opacity-90 transition-opacity">Explore Festival &rarr;</button>
          </div>
        </section>

        <main className="max-w-7xl mx-auto px-page_margin py-section_gap space-y-section_gap">
          {/* Live Near You (Local) */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-headline-lg text-headline-lg">Live in Seoul</h2>
              <a className="text-primary font-label-md text-label-md flex items-center gap-1" href="#">View All <span className="material-symbols-outlined">arrow_forward</span></a>
            </div>
            <div className="flex gap-element_gap overflow-x-auto hide-scrollbar pb-4 -mx-page_margin px-page_margin md:mx-0 md:px-0">
              {/* Live Card 1 */}
              <div className="min-w-[280px] md:min-w-[320px] bg-surface-container-lowest rounded-xl border border-outline/10 overflow-hidden group">
                <div className="relative h-48">
                  <img alt="Live Tango Class" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="A close up of tango shoes on a polished wooden dance floor in a minimalist Seoul studio. The lighting is focused and warm, highlighting the texture of the leather and the shine of the floor. The composition follows the rule of thirds, emphasizing a quiet luxury aesthetic with soft-focus backgrounds." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9YYvlemi8dMkkQop5ev3hoq43mpzcxTgrHFaZOtV8pYR6qow2z9gJWHoSuPBvC_jZ74dWNBT0iWNSVtrN2UVhzbNtW7P9lMld6TcIscl7L5H2NG-ibap-OZ0X7uiFuOl0CMwAjgins2ym6Wj1m2fm5QjrYgHTG_yWFBmM3pkn7Z5MNRVPSBXFWhhsYFn4Mn_95DB8F9SUqEEqOWQWdLF7lLn9CtoPnEzOKS_jDuYbVnOcuEsY0V6joEiSihgkob9UDmJmH5Vjphw"/>
                  <span className="absolute top-3 left-3 bg-error text-white font-label-sm text-label-sm px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-outline font-label-sm text-label-sm uppercase tracking-wider mb-1">Mylonga &bull; Gangnam</p>
                  <h3 className="font-title-lg text-title-lg mb-2">Hongdae is Dancing Right Now</h3>
                  <div className="flex items-center text-on-surface-variant font-label-md text-label-md gap-2">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    20:00 - 23:30
                  </div>
                  <div className="mt-2 text-error font-label-sm text-label-sm">12 dancers &middot; 3 spots left</div>
                </div>
              </div>
              
              {/* Live Card 2 */}
              <div className="min-w-[280px] md:min-w-[320px] bg-surface-container-lowest rounded-xl border border-outline/10 overflow-hidden group">
                <div className="relative h-48">
                  <img alt="Special Workshop" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="A blurred high-speed motion shot of dancers at a vibrant social event in a modern Seoul cultural center. The color palette features deep blues and subtle red accents from the lighting. The scene conveys energy and movement through artistic motion blur while maintaining a clean, professional aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBzc05SPULNX5wT9cxuNMXicPH9sjQ2fB6G00YBvNYb3RruPVXpxjy3yCDkM4KjoTWVy6YH-LTT3NBmXfCgt92Blaco3g-Wt5drfUCZ38WqUAKtFV-G9_Q5qP3ItqpnysWaVbVwoLCpsXmXDERvxFZbVVlYSl1B1HbubKaPJ7G_pBT2_Ur5Pyn2iPb48mQm1kDHW4agakexbHOrLlp635vJwMpYcM2TVGW1WLGT3dteeHRH3xHfsbWHl-i2n8jCK2lee0DbcmPdDhI"/>
                  <span className="absolute top-3 left-3 bg-error text-white font-label-sm text-label-sm px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-outline font-label-sm text-label-sm uppercase tracking-wider mb-1">Workshop &bull; Hongdae</p>
                  <h3 className="font-title-lg text-title-lg mb-2">Late Night Tango in Itaewon</h3>
                  <div className="flex items-center text-on-surface-variant font-label-md text-label-md gap-2">
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    Alberto &amp; Sofia
                  </div>
                  <div className="mt-2 text-error font-label-sm text-label-sm">Starting in 20 min</div>
                </div>
              </div>

              {/* Live Card 3 */}
              <div className="min-w-[280px] md:min-w-[320px] bg-surface-container-lowest rounded-xl border border-outline/10 overflow-hidden group">
                <div className="relative h-48">
                  <img alt="Orchestra Live" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" data-alt="A professional DJ mixer and vinyl record in a dimly lit, sophisticated Seoul tango club. The lighting is moody with purple and blue hues reflecting off the metallic surfaces. The shot is minimalist and elegant, focusing on the equipment that creates the soulful atmosphere of a milonga." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5YY0Uue4YeAiC89lMHcefPavJ-UqeOG3IhTcNFD6xEpm6EIx-PhCpwSDK_ivruGYFJ9QlP0boeESucPbqG6ad_F146Dqd9Q5hNgb8soLKDn3V28hJhaqVp-rHUgyow8feGSKd7J1pHcfYvDeUcfC27asDuMhH2aALIqk8zIUPOWOr42kgo8a81vAQCjnogYl_ptbx63XSl-VgXUeYtcSQOj_EGKbLbg2wtlwYF6LUs1YnTVrETyRDGyCbKGvuJfYxGGRB85BQsDM"/>
                  <span className="absolute top-3 left-3 bg-error text-white font-label-sm text-label-sm px-2 py-0.5 rounded-lg flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span> LIVE
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-outline font-label-sm text-label-sm uppercase tracking-wider mb-1">Performance &bull; Itaewon</p>
                  <h3 className="font-title-lg text-title-lg mb-2">Gangnam Rooftop Milonga</h3>
                  <div className="flex items-center text-on-surface-variant font-label-md text-label-md gap-2">
                    <span className="material-symbols-outlined text-[18px]">location_on</span>
                    Vibe Hall
                  </div>
                  <div className="mt-2 text-error font-label-sm text-label-sm">Live Music &middot; Join Now</div>
                </div>
              </div>
            </div>
          </section>

          {/* Local Stories */}
          <section>
            <h2 className="font-headline-lg text-headline-lg mb-element_gap">Stories from Seoul</h2>
            <div className="space-y-6">
              {/* Story Item 1 */}
              <div className="flex flex-col md:flex-row gap-6 p-6 bg-surface-container-low rounded-xl border border-outline/5 items-start">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <img alt="User Profile" className="w-full h-full object-cover" data-alt="A professional portrait of a male tango instructor in Seoul. He is wearing a sharp, minimalist navy suit. The background is a clean, bright studio with soft natural light. He has a friendly yet professional expression, reflecting the sophisticated culture of the Global Tango Society." src="https://lh3.googleusercontent.com/aida-public/AB6AXuA73ttHAMQUsSzYwmmugvmnWs4sUCcFda7-c8p2CQfyJrEQu_Z3WQPCr0RBavG7HB811cY-YIRr5ynBR8sYirVTBjtyYOyazoDydwyt1jBvMIEg28HRIYyFSgRXylL39xLM3aP2SCrUzIPQSleQYOzDlyoTzNwqtLskNnCo3IgbS9YPmo3Hh10e4hJWn_TJq5fQoc5PWjz8PY9a3cojutUDlu-hGUeeNLsE3BXgnKh9FYmc8TLNrFLNs15JbJZvl0aNJz4zcqfjrN8"/>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-title-lg text-title-lg">김지훈 (Tango Kim)</h4>
                      <p className="text-outline font-label-sm text-label-sm">3 hours ago &bull; Milonga 'Ocho'</p>
                    </div>
                    <button className="flex items-center gap-1 text-primary font-label-sm text-label-sm border border-primary/20 px-3 py-1 rounded-full"><span className="material-symbols-outlined text-[16px]">translate</span> See Translation</button>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">어제 본 서울의 밤은 그 어느 때보다 뜨거웠습니다. 새로운 피보트 동작을 연습하며 느낀 커넥션은 정말 잊을 수 없는 경험이었어요. 서울 탱고 씬이 점점 더 성숙해지는 것 같아 기쁩니다.</p>
                  <div className="mt-4 flex gap-4">
                    <button className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">favorite</span> 128
                    </button>
                    <button className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">chat_bubble</span> 24
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-outline/5 text-outline font-label-sm text-label-sm">Seoul &middot; KR</div>
                </div>
              </div>
              
              {/* Story Item 2 */}
              <div className="flex flex-col md:flex-row gap-6 p-6 bg-surface-container-low rounded-xl border border-outline/5 items-start">
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                  <img alt="User Profile" className="w-full h-full object-cover" data-alt="A professional portrait of a female tango dancer in Seoul. She is wearing a simple yet elegant black dress with minimal jewelry. The lighting is high-key and modern, set against a pristine white background. Her look is poised and artistic, embodying the quiet luxury brand values." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJtmM7n-SlIPx5L3U6QIZH9aW2ycC29BCB5wlKCTOr-jW9IrHzvt4dXaZUbs1MHOs2BnVzwLBt_-WMzbth8Dg7Fa7zrkZ-tPdyDHdyol09hIUgbhh1vPvbr9-X2FNo8F88ZUxIHB46MrXEw9WVKL1iMFhIj9kGNsA-XP3LU0DNbke2dFH54B51jpjgWFJGdeSvIhSFr3MLbBIywJGuzKo6NSW8rv0gHqyhbj2reGsgUGe2pjPJagVKnMNea9nRqqzFgDd_2OhyUsM"/>
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-title-lg text-title-lg">이지연 (Luna Lee)</h4>
                      <p className="text-outline font-label-sm text-label-sm">5 hours ago &bull; Studio S</p>
                    </div>
                    <button className="flex items-center gap-1 text-primary font-label-sm text-label-sm border border-primary/20 px-3 py-1 rounded-full"><span className="material-symbols-outlined text-[16px]">translate</span> See Translation</button>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">초보자 분들을 위한 밀롱가 에티켓 클래스를 진행했습니다. 다들 열정적으로 참여해주셔서 뿌듯한 하루였네요. 다음 주에도 홍대에서 만나요!</p>
                  <div className="mt-4 flex gap-4">
                    <button className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">favorite</span> 95
                    </button>
                    <button className="flex items-center gap-1 text-on-surface-variant font-label-md text-label-md hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[20px]">chat_bubble</span> 18
                    </button>
                  </div>
                  <div className="mt-4 pt-4 border-t border-outline/5 text-outline font-label-sm text-label-sm">Itaewon &middot; Seoul</div>
                </div>
              </div>
            </div>
          </section>

          {/* Global Pulse */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-headline-lg text-headline-lg">Across the World</h2>
              <span className="text-outline font-label-md text-label-md">Global Updates</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer">
                <img alt="Buenos Aires" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="A wide panoramic shot of a historic plaza in Buenos Aires at dusk. The sky is a deep indigo, and the old buildings are lit with warm golden lights. The scene is elegant and timeless, capturing the birthplace of tango with a professional, editorial photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL8_eb7RxUztaKg1iYMdo3q77YGWy1m_oxA_Zk-jiXi0SDDCGmJoDIEYxhkmvzYc_swmcnJfdzEqLezzs-D_coZquzaP0_w7g2m3ODHelgVYhg8AqreHqxY7S_tmk4ulK-CPHzTCxKcALUmB8M9Tu_UE0Z7uiJHgD2EZk97puJQqwgPSUjNgXl6-ImWyck5U93i6oKSflXi-IoHfnmHP3C-ps29F2auOqAhRJu8zFT5cOpMLgOlTOtJI2y_2rOSRkCTP8tVShbgpk"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Buenos Aires is on Fire &#128293;</h3>
                </div>
              </div>
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer">
                <img alt="Tokyo" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="A sophisticated shot of a Tokyo street with neon signs reflecting in puddles on a clean sidewalk. The color palette is cool with primary blue and purple highlights. The image is minimalist and high-contrast, representing the modern urban tango scene in Japan." src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_PuFu-FYsRTEwlJKgLRpRwV8GW2zO0eJqhgoDIKKO_3dXh31X4aR7QJrpe2s_AOZwE8S4i-YGt91e4knOnOmSEcivrakJvkA986KXr_37iOamX63DpBgilh6w8ADmUk1IRPyGa7ei8MZrUv5UemwC1Uxxw4C5l_0INF_rybkexbQ8AztTk7D4f-jt6WjeEFHKWBOS5gmbtx3M2YJDyFUR1L5tUZzsSWCECrrBrA62X_eVk-LWdWqzae2ftlhQ3YI1u4CjG8_abaY"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Tokyo Nights Are Back</h3>
                </div>
              </div>
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer">
                <img alt="Istanbul" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="A luxurious interior of a classic Parisian café with ornate details and soft morning light streaming through tall windows. The aesthetic is refined and high-end, using a palette of creams and golds to convey a sense of history and European elegance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRbweg__P16c0WfFJhSwQnoj6s40dtN969tweSopFo4TjRB-Sw0sAWMVZwaKbyMUV53wZRs8btOwhi-8bk4qUFvNf61TaSb9gKJtddM0fvnliJB7Yx_tC2MjMY084JTLR48rd182OygrCHxB7E-352dPNyfgHwGEyAHUhnmhht029RyS3OZ5BnK_j8WaxvZ0JSluscI9AXH7K-h87LWj4doObby7hMPMzJziHOGbOqtSYN7gjjnnJu6x3Nr3VIqEdDGW7VBkQjrQ0"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Istanbul is Calling Dancers</h3>
                </div>
              </div>
              <div className="relative h-40 rounded-xl overflow-hidden group cursor-pointer">
                <img alt="Da nang" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" data-alt="A modern architectural shot of a building in Berlin featuring clean lines and concrete surfaces. The lighting is bright and even, creating a minimalist light-mode aesthetic. The composition is geometric and bold, reflecting the contemporary tango culture in Germany." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDI3ju5PMbshaDAj-9YPR5sWPxCFHHU2dC6T8h66vosdvpchUDZt6MW4HiwvKrtY2hLdJcsqO36eJNUM_-B3O-E93n8sdNCjgr_Y6Mgrrld3KBGrdR8Zu56DzL2sSWk8jHiQtPZp63pjfVZQ6g0qqPbneE8jYozeMJBORc6PvVsdX4XK3E2t3MVolMub-3sld6McTWNFWshK-hRL_0KAO6P3igYBiv3k44PVyfM8ChLiqtVJUVAtPz4Ci7xHrk15s4r_2Ac3IcNL-8"/>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <h3 className="text-white font-title-lg text-title-lg">Da nang's Scene is Rising</h3>
                </div>
              </div>
            </div>
          </section>

          {/* Explore Your City */}
          <section>
            <h2 className="font-headline-lg text-headline-lg mb-element_gap">Explore Seoul</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">apartment</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">Find Venues</h3>
                  <p className="font-body-md text-on-surface-variant">Discover the best milonga spots in Seoul.</p>
                </div>
              </div>
              <div className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">hotel</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">Stay Nearby</h3>
                  <p className="font-body-md text-on-surface-variant">Hand-picked accommodations near the festival.</p>
                </div>
              </div>
              <div className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">school</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">Join a Class</h3>
                  <p className="font-body-md text-on-surface-variant">Find the perfect tango class for your level.</p>
                </div>
              </div>
              <div className="group bg-surface-container-lowest border border-outline/10 p-6 rounded-xl flex items-center gap-6 hover:bg-primary/5 transition-colors cursor-pointer">
                <div className="bg-primary-container/10 p-4 rounded-full text-primary">
                  <span className="material-symbols-outlined text-[32px]">camera_roll</span>
                </div>
                <div>
                  <h3 className="font-title-lg text-title-lg mb-1">Rent a Studio</h3>
                  <p className="font-body-md text-on-surface-variant">Private studio rentals for your practice sessions.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Culture & Canvas */}
          <section>
            <h2 className="font-headline-lg text-headline-lg mb-element_gap">Culture &amp; Canvas</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {/* Card 1: Gavi’s Tango Cartoons */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm">
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">ART</span>
                <img alt="Gavi’s Tango Cartoons" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC8XY5F-qe8GeS5VzwmbFqFwcRNQ4jy2v-I2zXQH9NvbdQwl504DXnlLPrLldZjC1ZqD_mXzUzHNhuXQKypWRY5msz_szHDXAt58InwPW4GvxFV0D46E6GnqXUahZvMTl50lhKowBZXfaLyUjvHPezT6D2MBlIY_xTfM4Yy75N-V9uFwSguyTLPtQS_tkRA5jcnbKYGabthyZ71oiEFrcYdyg_btpIw6Tqg_YJaoow62i65WU5ZdND8g93OH3UmWeNu3PfZmdJMRRM"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">draw</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">Gavi’s Tango Cartoons</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">Capturing our daily lives in four panels</p>
                  <span className="text-[#0A84FF] text-[11px] font-bold tracking-wider">NEW EPISODE</span>
                </div>
              </div>
              
              {/* Card 2: Tango Music 365 */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm">
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">MUSIC</span>
                <img alt="Tango Music 365" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSg96tAeED9P7du-S5gfBX0MyoKghcRXVaF8OF4L7WEs3t74zX99HY92vgflKvKBbevBsBYIU-dk44CWuA3k2TMEaG0vk3x4oOkePpz4KiHrEWY4tfrDU9pXzAislGy7VF2gTVjAk9TCTgu26mwIxwkJrPe7QaFthO-hDRunqDESro5sj5_MbMJNMnqbHwiRW_p8f-iPVkI5IW084g9kmwt4ScOGanHmoy2q_rTIYGwleT5zSPIPIy0ZCbfuxVFRShDpmJw23yzd0"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">music_note</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">Tango Music 365</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">A Daily Journey Through Tango Sound by camus</p>
                  <span className="text-[#F5A623] text-[11px] font-bold tracking-wider">ONGOING</span>
                </div>
              </div>

              {/* Card 3: The History of Tango */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm">
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">HISTORY</span>
                <img alt="The History of Tango" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIJC03KmuulW6Q3xcECZetm-j5ZUzPh_oFNRQ9q8oZj0Ao433_Pirno4_x9dJeBWXgvsSZkrEjab_7clVxPI7mOZktOqMoIYSVuyTfZKCTkEYeky54vFIeLRBLV4Oba5rn9iCYQQmOYIVnoWklVtFoKKHyP1JkfTWze9DVdwHDoeH4imvbnxVG999sTOwaY-ldjV7ssZ88ilelC8EfvtW-0B4Mvog9Cyu2rMT51IQvWa3HGyU8CFhVPP29uwDhqYRBsvQMDShY7pw"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">history_edu</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">The History of Tango</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">Stepping on tradition towards newness by ddakji</p>
                  <span className="text-outline-variant text-[11px] font-bold tracking-wider">SERIES</span>
                </div>
              </div>

              {/* Card 4: Tango Novel */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm">
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">STORY</span>
                <img alt="Tango Novel" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH33D49mDk5pm0e3JP7j2DIpGUMaBBwTyZoYzNaNkykeq8VyByVRUR144-cvlg1axPWKXLlbKcJghqpGKMT8JxNB6w0aKi5tC13B7J5aw98t49Irh2gDQJlrYg7D06ZiFovfRBxzpfP7S9lqChBwy8fCJ2x8NcIOiBxVn4LsDZTmamMki5aw78_caImUcx3151PWIRrl7H_Yb1DU_jGUI6WMg74dgj2HPhn-SGBWzzTf97ND-cjYX0NfMzG_WB6Sp_bq317rvQcyA"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">auto_stories</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">Tango Novel</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">Stories Inspired by the Dance</p>
                  <span className="text-outline-variant/60 text-[11px] font-bold tracking-wider">COMING SOON</span>
                </div>
              </div>

              {/* Card 5: Tango Travel by Beto */}
              <div className="relative h-[450px] rounded-xl overflow-hidden group cursor-pointer border border-outline/5 shadow-sm">
                <span className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest">TRAVEL</span>
                <img alt="Tango Travel" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAL8_eb7RxUztaKg1iYMdo3q77YGWy1m_oxA_Zk-jiXi0SDDCGmJoDIEYxhkmvzYc_swmcnJfdzEqLezzs-D_coZquzaP0_w7g2m3ODHelgVYhg8AqreHqxY7S_tmk4ulK-CPHzTCxKcALUmB8M9Tu_UE0Z7uiJHgD2EZk97puJQqwgPSUjNgXl6-ImWyck5U93i6oKSflXi-IoHfnmHP3C-ps29F2auOqAhRJu8zFT5cOpMLgOlTOtJI2y_2rOSRkCTP8tVShbgpk"/>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <span className="material-symbols-outlined text-white mb-2">explore</span>
                  <h3 className="text-white font-title-lg text-title-lg mb-1">Tango Travel by Beto</h3>
                  <p className="text-white/80 font-body-md text-sm mb-3">Discover Tango Cities Around the World</p>
                  <span className="text-[#0A84FF] text-[11px] font-bold tracking-wider">NEW</span>
                </div>
              </div>
            </div>
          </section>

          {/* People */}
          <section>
            <div className="flex items-center justify-between mb-element_gap">
              <h2 className="font-headline-lg text-headline-lg">People to Know</h2>
              <a className="text-primary font-label-md text-label-md" href="#">Popular Artists</a>
            </div>
            <div className="flex gap-8 overflow-x-auto hide-scrollbar -mx-page_margin px-page_margin md:mx-0 md:px-0">
              {/* Person 1 */}
              <div className="flex-shrink-0 text-center w-32 group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1">
                  <img alt="Person" className="w-full h-full object-cover rounded-full" data-alt="A professional close-up portrait of an Argentinian tango maestro with silver hair. He has a sophisticated and calm presence. The lighting is soft and studio-quality against a clean gray background, representing high-end cultural expertise." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCl6novoFcr84rzU5Zzj5Ye-pPTl9Tqfuzj55L8XixRkAiAMJeYvsXSAeC02wMBb_uxsosFxUgXBBrfkFXYFnAqyavdQ3EYognFx9PzH4CKW04fk4iFj_m4uXBoeNWnwwCIRiHagsJIDeicr-KVhxD8zFJEOM9BLd1XTLGd0C6P9zwXwOLjdUk8cV8fwAZqR3jIjHht61dZZlsLpY75KUmnoI7FdE883nRZLMkcZBXD_1vRiL4neK2dGHsanStkclqnQI8UtwDqjpo"/>
                </div>
                <h4 className="font-title-lg text-title-lg text-body-md">Carlos R.</h4>
                <p className="text-outline font-label-sm text-label-sm">Organizing Buenos Aires Milongas</p>
              </div>
              {/* Person 2 */}
              <div className="flex-shrink-0 text-center w-32 group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1">
                  <img alt="Person" className="w-full h-full object-cover rounded-full" data-alt="A professional headshot of a female dancer in her late 20s. She is smiling naturally and wearing a modern white blouse. The lighting is bright and airy, creating a professional light-mode aesthetic that fits the modern minimalism of the brand." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDungRlgMDdqrD9wqq6nc-aZ6xPCEbUwWI0VT0N4Yoo4yfJVhn1YsFar-1lPkcf_hizSc6A2O_xts0HUwNUOvd3HH0RUsZinZ9toS5w0nZZbOffvLtVpuyjaoNnNr2JMjJwMELg8klioopwK7U51bv6yIUQdN3n0jycBLCgBI8m7bAThXKx7k1dwkHJdH9DwguByiM9_81TMDQa7Su1jIOwX8E7K3a8n5z-JUEm7KY3k53V75LX_tum5-KM1iOIxTpF6e75x6KKL4Y"/>
                </div>
                <h4 className="font-title-lg text-title-lg text-body-md">Elena M.</h4>
                <p className="text-outline font-label-sm text-label-sm">Tango Instructor &middot; Seoul</p>
              </div>
              {/* Person 3 */}
              <div className="flex-shrink-0 text-center w-32 group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1">
                  <img alt="Person" className="w-full h-full object-cover rounded-full" data-alt="A professional portrait of a male musician with a bandoneon. He is dressed in a contemporary minimalist outfit. The photo is taken in a clean architectural setting with strong natural light and sharp shadows, evoking quality and reliability." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUm0ckWNA7BdUFEAO0qzX7o1D4d8eIa_NgCpT4s_AXKdgLaGsA_TpZRHqxqjQ_EcCLCy4oEaIpAGEKCcOZovVCj_eBL0yPFGuFNPSJV29UBJANHHd8fSy8xDdfVXQUGYrdvWewunWQwLY3rcVIQ0zyIoeVwdPZa8EUrvXabd-U-3O3l1r4ujRtskqlC0sX5fpGywt9gb_-a3ZbY6j851mV87VTSlho9OJQP44vpprSRqqcOxDwjOoRBMyvkykrAcsQJAwEsBc6TK4"/>
                </div>
                <h4 className="font-title-lg text-title-lg text-body-md">Pablo G.</h4>
                <p className="text-outline font-label-sm text-label-sm">Musician</p>
              </div>
              {/* Person 4 */}
              <div className="flex-shrink-0 text-center w-32 group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1">
                  <img alt="Person" className="w-full h-full object-cover rounded-full" data-alt="A studio portrait of a woman with short hair, wearing a sleek black turtleneck. The lighting is minimalist and high-contrast, focusing on her features against a soft white background. The look is professional and refined, representing the editorial tone of the brand." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQDt0BmoE0R3OtZDOKRO3HsbyxJKyWnLyuBmy0F42c0nlIvERpaIzAdgCMf6-MnvSsT7FQfOcKCV9NlFUMZfa0svBYyaOQy04LKQyuw83RUnOdP8kTnjMLpjpvnKuLm6vGtjeM8hueVBSuD5L47163kZ-gNef9jIlmj4k65lmYe1qu-CagPlPDGyC-IK19azcgsFBBAaXNHJvLKy8mnXXFT9hLFCvbngbT_OxIJAE90UY4npLQrT_qTDQrO-0Vn8YdFc_TjnRTawc"/>
                </div>
                <h4 className="font-title-lg text-title-lg text-body-md">Sofia L.</h4>
                <p className="text-outline font-label-sm text-label-sm">Instructor</p>
              </div>
              {/* Person 5 */}
              <div className="flex-shrink-0 text-center w-32 group cursor-pointer">
                <div className="w-32 h-32 rounded-full overflow-hidden mb-3 ring-2 ring-transparent group-hover:ring-primary transition-all p-1">
                  <img alt="Person" className="w-full h-full object-cover rounded-full" data-alt="A professional portrait of an older gentleman with a warm smile. He is wearing a high-quality navy wool sweater. The lighting is soft and flattering in a clean modern interior, reflecting experience and a welcoming professional culture." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCT6sUAHSl3u-VvA1IyNrL0a5Fexa9xdG9fifv6yeTNP3bPEIdKGqsJR1m0bLA9KFGy2_hQKCFYG7uyaZ5z2N4WxBKPNHxTdELbUkHPCo-RyaJCzx0MbwRqFkjYFLFIsZMib09hWAxF3JnR4U3Ys1TDvDK6jJ8_KhpumDhbRm0GWhaGbyt4tJd8CaWOyk7Si4YXi8Svi9y656CaeRlFkgdT1JtHLsQXsXkMOgnqTlFWnB0KJjp4Po6jmvmQAVoAnb8kaYeXfLhmRxg"/>
                </div>
                <h4 className="font-title-lg text-title-lg text-body-md">Mateo B.</h4>
                <p className="text-outline font-label-sm text-label-sm">Curator</p>
              </div>
            </div>
          </section>

          {/* Visual: Feel the Moment */}
          <section>
            <h2 className="font-headline-lg text-headline-lg mb-element_gap text-center">Feel the Moment</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="aspect-square bg-surface-variant overflow-hidden group relative">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="A close-up shot of two hands gently holding each other in a tango embrace. The lighting is low-key and dramatic, focusing on the tension and connection. The photography is clean and high-end, focusing on the human elements of the dance in a minimalist style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhv85_bi1_roZXlBAsRh1L14F4hdUb8UpZ-BvqkZNtkLxQE3G_kEN4o9p57jU7pnLlk2qgAE0x-nVZEwLRCEsVch4Wj_jhfokfYd0aMTIbfdYT-4RLNf5fgjWW7eopiB5lIRQ3-d1RUEUYIUykxxmGJAK9htO4h7Mp4A6G9XhCB2DuxkzX8f3YUgf_biRCpDgU2NAiSmP3GVTCeLc7oiK0tqDgLCV0s3-7Ti1bhDrlOcMC6FaGauUK6MWOZ7ZEy4mGnyg2VRy6EXk"/>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="material-symbols-outlined text-white/80 text-4xl">play_circle</span></div>
              </div>
              <div className="aspect-square bg-surface-variant overflow-hidden group">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="A silhouette of a couple dancing tango against a large circular window with a city skyline at night. The lighting is cinematic, highlighting the sharp outlines of the dancers' forms. The composition is artistic and professional, reflecting the Global Tango Society's high-end aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBcNE3yA37F_q_6jBOxJT7QFDk_ROnYVnIPgzCFzNSx3TNs3xVNqSvM8v2X0wGRjHJKotJI841xEuyqyDeQKuVm4LY1_DyFpX9LqRQiTNfhwwnx3w_FWnF6esGCjp1waZyZpvYtL0QxY2V8PJFa2fWQ89RkTaqgMif5jQ-f82rMqy4uJhXYL5KPJ61qLOnuCaTEL46sXxYBs02sWZl3PSsI2rusuj83UbWB7Vvunp4thZ-bOQnYJ6TEiBIv6cPGO27Xc2AhKdFX8R4"/>
              </div>
              <div className="aspect-square bg-surface-variant overflow-hidden group">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="A top-down view of several pairs of tango shoes on a minimalist white studio floor. The arrangement is geometric and clean, emphasizing the variety of styles and the professional nature of the dance gear. The lighting is even and bright for a high-quality light-mode look." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqJA4SuFwvyrf80X6-HIXKc53jUbP7A7UZRZdXTFakrKiZiJNyTgc1quNvNqQn0ZhjyXpj54uotHnj8GxIppVP1treg8PdSR5W9nGDQszDJVPICSxkC8cQen-hgJ2yeahyur8V2Ii_OyYcxW988czIJkwfXF6DL8qD2uZCxGSNKP54Q72xNRix625XCcz-s5b_WVKVHfrupAI_Qnw1byLIRm6QCrYPJcK0ub6YFtSi5LLvgl4ah-qxdCsnEhTI-4BVh17mlL8-SvE"/>
              </div>
              <div className="aspect-square bg-surface-variant overflow-hidden group">
                <img alt="Visual Grid" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" data-alt="A blurred action shot of a red dress swirling during a tango performance in a modern theater. The color is the only vibrant element in an otherwise minimalist, neutral-toned setting. The photo captures movement and passion through a sophisticated editorial lens." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBu27sywOcBpK7ExBjlt2VFm2rDBOQoFUE07A6nryePDvFc87t2vQOqFAN0-GNjwY4X4wLox9ehj8rCgCjvql3cHxMrciKSdXYjpcUwUGWqsf5F2qB8Fj0fszFMj94ifHyco-SqNcYmxEdcloTdQq_cUpXSIu7EFYk9QzLul8QsZwL3jpDqeWZae7N5q2thamfydyQaKQrOn5srI0539LlF4mJ6NBmCCiie_AuH_Y57-goRmQzubPuyIiF7u2ch4ceAEPYSA18yCvc"/>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="bg-background border-t border-outline/15 py-section_gap">
          <div className="max-w-7xl mx-auto px-page_margin flex flex-col md:flex-row justify-between items-center gap-element_gap">
            <div className="font-headline-md text-headline-md font-extrabold text-on-background">Global Tango Society</div>
            <nav className="flex flex-wrap justify-center gap-6">
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">&copy;2026 World of Community. All rights reserved</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">&copy;2026 World of Community. All rights reserved</a>
              <a className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md" href="#">&copy;2026 World of Community. All rights reserved</a>
            </nav>
            <div className="text-on-surface-variant font-label-sm text-label-sm">&copy;2026 World of Community. All rights reserved</div>
          </div>
        </footer>
      </div>
    </>
  );
}

