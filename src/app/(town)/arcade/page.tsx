'use client';

import React from 'react';

export default function ArcadePage() {
  return (
    <main className="bg-background font-body text-on-surface min-h-screen pt-16">
      {/* Hero Section */}
      <section className="relative w-full h-[618px] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Community Arcade Hongdae Hub Interior" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDFS7LxLPHTu5TG6JbstbHTdZ1GibV05Qncif6NmhKAR7yxr4uXIZaVJcf7389nc-9TOE4Gx36Ts7h0vX8M9tSMEJ42olPF-aow8Wbl2XpvvBZ1lQW6wq3JokwNP2xfsn_zzcUn3TAIAwFI3vIpFrNGoADa_9aGI3SpIFGA3dBC7vznqHc0xpNBTb7uK4p6Y2vkdaYdscv8XO2ZGAkrWPWH8K2aNHw3IeCx-oCjDvXKhz70o6smvTdUmE9V50P4-n6uAW7EydE3E57"
          />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-2xl">
            <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-white mb-6 tracking-tight leading-tight">
              Community Arcade: <br/> Hongdae Hub
            </h1>
            <p className="font-body text-lg md:text-xl text-white/90 font-light mb-8 max-w-lg">
              Bridging the gap between our online community and offline experiences.
            </p>
            <div className="flex items-center gap-4">
              <button className="bg-primary text-on-primary px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Visit Today
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Essential Services Section */}
      <section className="py-24 container mx-auto px-6">
        <div className="mb-12 text-center md:text-left">
          <span className="text-primary font-bold tracking-widest text-xs uppercase">Essential Services</span>
          <h2 className="font-headline font-bold text-3xl mt-2 text-on-surface">Designed for the Community</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Service 1 */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 flex flex-col group hover:border-primary/40 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined">shopping_basket</span>
            </div>
            <h3 className="font-headline font-bold text-xl mb-3">Online Pickup</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Pick up your community orders here instantly.</p>
          </div>
          {/* Service 2 */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 flex flex-col group hover:border-primary/40 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined">apparel</span>
            </div>
            <h3 className="font-headline font-bold text-xl mb-3">Direct Shopping</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Try on and buy Tango shoes, dresses, and more.</p>
          </div>
          {/* Service 3 */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 flex flex-col group hover:border-primary/40 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined">local_shipping</span>
            </div>
            <h3 className="font-headline font-bold text-xl mb-3">Global Logistics</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Your hub for overseas shipping and returns.</p>
            <button className="mt-auto border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Return Request
            </button>
          </div>
          {/* Service 4 */}
          <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 flex flex-col group hover:border-primary/40 transition-colors shadow-sm">
            <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-6 text-primary">
              <span className="material-symbols-outlined">handyman</span>
            </div>
            <h3 className="font-headline font-bold text-xl mb-3">Repair & Care</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed mb-6">Expert repair service for your community gear.</p>
            <button className="mt-auto border border-primary text-primary hover:bg-primary hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">
              Repair Request
            </button>
          </div>
        </div>
      </section>

      {/* Current Arrivals Section */}
      <section className="py-24 bg-surface-container-low overflow-hidden">
        <div className="container mx-auto px-6 mb-12 flex justify-between items-end">
          <div>
            <span className="text-primary font-bold tracking-widest text-xs uppercase">Curated Selection</span>
            <h2 className="font-headline font-bold text-3xl mt-2">Current Arrivals</h2>
          </div>
          <div className="hidden md:flex gap-2">
            <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface transition-colors">
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <button className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-surface transition-colors">
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
        <div className="flex gap-6 px-6 overflow-x-auto hide-scrollbar snap-x snap-mandatory">
          {/* Item 1 */}
          <div className="min-w-[300px] md:min-w-[320px] snap-start bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group">
            <div className="h-80 overflow-hidden">
              <img 
                alt="Tango Shoes" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuChwDYzDzTyhtp30Dtn7Kj7AixRxmOFvmmXjd-GoeHQmIXavq4TPIXz9gilHZm1Gx7tr2E5zh0TYOG1aOE6CTduXYGR8dYDcyiyx5HgkT_oBGU-MlSfJGrsyAcBRHNPUAeHoJjlNxXwasCt9QTL3FsO-bUVBKXMy6oeL2nZ9fiC2hvpMSSQzVRlpj8rz0VvO3t_S6qkEVvbtxxw0pvU0mY7xUolSPRg2N04jPa1u9bPraemfOc9NFITVnB5_39kktF_8yyLutpAxn9e"
              />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary-container rounded mb-2 inline-block uppercase">Hub Exclusive</span>
              <h4 className="font-headline font-bold text-lg">Velvet Azure Pro</h4>
              <p className="text-on-surface-variant text-sm mt-1">Handcrafted performance footwear.</p>
            </div>
          </div>
          {/* Item 2 */}
          <div className="min-w-[300px] md:min-w-[320px] snap-start bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group">
            <div className="h-80 overflow-hidden">
              <img 
                alt="Silk Dress" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvlNDIYIc5MU6eroV-_d4jo-1pnV9JBho_CoWI6UtdwTUTyHkO6YK0PELuJYM2hDTwFdKYicFJvmzGP4jczD40hBCqkyuJVY8ZtXvjyhDU9jYonsnPf6awOw4f5bWdzg4JwWhlgUCg0Xms8S4-WOEiwQnl7Nh2tIATUX90HFIXpqzreCP7lHnaBh_EEjXUa2Aw8UeA26Fuq3c7wzGtPzUkj8UXqIAjVKfKr5zMTD3al8XWddDG37NqiZCKokvRg-Xzx5-E1PwIC3Rm"
              />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary-container rounded mb-2 inline-block uppercase">New Arrival</span>
              <h4 className="font-headline font-bold text-lg">Midnight Flow Silk</h4>
              <p className="text-on-surface-variant text-sm mt-1">Premium silk movement dress.</p>
            </div>
          </div>
          {/* Item 3 */}
          <div className="min-w-[300px] md:min-w-[320px] snap-start bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm group">
            <div className="h-80 overflow-hidden">
              <img 
                alt="Arcade Bottle" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZvOARL_O-OS_eMREAxzSassUE4W2Gva99gFYbYS6JoXeQX3HTVsm7d8oyavCKaJ2o1dh3I2_9XX4tr2aaMhCUpDHg-1S9M0uH3JUnNAm0hb0cu_CHzpI8ncX9XsiDaEIAcec4CC91zrP-0IjWcoUXL5qV3a__GjXl_Kp6d8IvK7Y6He8PUOQRzAk9BfAjJm080osaMuVT9tgwdVwDEVThf3shkqFdd1yhJohBU3nsizcx83prybfPprfuyltIkidFKjy6MtggypSt"
              />
            </div>
            <div className="p-6">
              <span className="text-[10px] font-bold text-primary px-2 py-1 bg-primary-container rounded mb-2 inline-block uppercase">Limited Edition</span>
              <h4 className="font-headline font-bold text-lg">Arcade Hydro-X</h4>
              <p className="text-on-surface-variant text-sm mt-1">Insulated community gear.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Q&A / Help Center Section */}
      <section className="py-24 container mx-auto px-6 border-b border-outline-variant/10">
        <div className="flex flex-col lg:flex-row gap-16">
          <div className="lg:w-1/3 text-center lg:text-left">
            <span className="text-primary font-bold tracking-widest text-xs uppercase">Help Center</span>
            <h2 className="font-headline font-bold text-3xl mt-2 mb-6 text-on-surface">Common Questions</h2>
            <p className="text-on-surface-variant mb-8 text-sm leading-relaxed">
              Can't find what you're looking for? Our team at the Hongdae Hub is ready to assist you in person or online.
            </p>
            <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-semibold w-full lg:w-auto shadow-sm active:scale-95 transition-transform">
              Contact Support
            </button>
          </div>
          <div className="lg:w-2/3 space-y-4">
            {[
              "How do I track my online pickup order?",
              "What is the average repair time?",
              "Can I return items purchased online at the Hub?",
              "Are there special events hosted at Hongdae Hub?"
            ].map((q, i) => (
              <div key={i} className="border border-outline-variant/30 rounded-xl p-6 bg-surface-container-lowest hover:border-primary/20 transition-colors shadow-sm cursor-pointer group">
                <div className="flex justify-between items-center w-full text-left font-bold text-lg text-on-surface group-hover:text-primary transition-colors">
                  <span className="text-base md:text-lg">{q}</span>
                  <span className="material-symbols-outlined text-primary group-hover:rotate-90 transition-transform">add</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location & Hours Section */}
      <section className="py-24 container mx-auto px-6 pb-32">
        <div className="bg-surface-container-highest rounded-2xl overflow-hidden flex flex-col lg:flex-row shadow-lg border border-outline-variant/20">
          <div className="flex-1 min-h-[400px] relative overflow-hidden">
            <img 
              alt="Map location visualization" 
              className="w-full h-full object-cover grayscale opacity-80" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDZj6hJIUrG5S0e-UI_wd6XnbRxDRju-oYprOz25d6VgTp9X7CSEOnezEOdGaNDvzZLz4LUPQ3n1wdiehAjbb12TcqRkxb6F5Bx34axFCFIDHCGG0XfPUr2JZjU6m6o2rqRrcJvbHAjitdl9HsKJy8erUaD6mfVwze0VU7BHfP0V7a1XLi_T05w8qNqpuHM1aVKpaY24vfm-ZjBA33jdSuE-62neWIbVH4C1cQOhifd9KGpa16B-_ZbR82GgipLtRSz02sJtatvGcHC"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-primary text-white p-4 rounded-full shadow-2xl animate-bounce">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
              </div>
            </div>
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-[10px] font-bold text-on-surface uppercase">Currently Open</span>
            </div>
          </div>
          <div className="p-10 lg:p-16 lg:max-w-md bg-white flex flex-col justify-center">
            <h2 className="font-headline font-bold text-3xl mb-8 text-on-surface">Visit the Hub</h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">map</span>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Address</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    123 Wausan-ro, Mapo-gu<br/>
                    Near Hongdae Stn. Exit 9<br/>
                    Seoul, South Korea
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <div>
                  <h4 className="font-bold text-sm text-on-surface">Opening Hours</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed">
                    Mon – Fri: 11:00 AM – 8:00 PM<br/>
                    Sat – Sun: 12:00 PM – 9:00 PM
                  </p>
                </div>
              </div>
              <div className="pt-4 space-y-3">
                <button className="w-full bg-primary text-on-primary py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md">
                  <span className="material-symbols-outlined text-[20px]">call</span>
                  Call Hub
                </button>
                <button className="w-full border border-outline-variant text-on-surface-variant py-4 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-surface active:scale-[0.98] transition-all">
                  <span className="material-symbols-outlined text-[20px]">directions</span>
                  Get Directions
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </main>
  );
}
