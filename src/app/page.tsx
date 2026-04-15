'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useNavigation } from '@/components/providers/NavigationProvider';

export default function LandingPage() {
  const { user, profile } = useAuth();
  const { toggleDrawer } = useNavigation();
  const router = useRouter();

  const handleProtectedLink = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      router.push('/login');
    }
  };

  return (
    <div className="bg-white text-black antialiased">
      {/* Top Navigation Bar (Mobile App Style) */}
      <nav className="fixed top-0 left-0 right-0 lg:left-[calc(50%-28rem)] lg:right-[calc(50%-28rem)] max-w-4xl mx-auto bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <button 
          aria-label="Menu" 
          className="p-2 -ml-2"
          onClick={() => toggleDrawer()}
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-black">WoC / World Of Community</p>
        <Link 
          aria-label="Profile" 
          className="p-2 -mr-2 flex items-center justify-center" 
          href={user ? "/profile" : "/login"}
        >
          {user && profile?.photoURL ? (
            <img src={profile.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-gray-100" />
          ) : (
            <span className="material-symbols-outlined text-2xl">account_circle</span>
          )}
        </Link>
      </nav>

      {/* Header / Slogan Section */}
      <header className="px-6 pt-24 pb-12 border-b border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl md:text-8xl serif-text font-bold italic leading-none tracking-tight mb-8">Life goes ON_</h1>
          <blockquote className="text-2xl md:text-3xl serif-text italic leading-relaxed text-gray-700 max-w-2xl">
            "A curated digital broadside exploring the intersections of shared experience, niche sub-cultures, and the quiet beauty of collective living."
          </blockquote>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* SECTION 1: STAGE */}
        <article className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <img 
              alt="Flamenco dance" 
              className="w-full h-[300px] md:h-[400px] object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQnfbpiak9voFwdv7HS5c-73EGpGhC40K4S_0uJZuMyKG7OjBepWk47PBukD_6PdT95j-NIXI3zY-K0YQdqudz_EF9cG1_ynpBRy2ILXmYUz7l3PaSYcNbmBmEuQXC5T5d2A3asZ6njUJQtzZoNo8s6JuKkohtMR_cCvucYUUjYP1UaQ29YR4NB2N3Wl8FYm1DWdSY9ZgD6Ia-HaHSxmRgv5EEgeEgykzAFnVbApHIhCESuSq2ISoFRKsqfQX1gLSJpscX8xt6BDxJ" 
            />
            <div className="p-6 md:p-12">
              <header className="mb-8">
                <span className="text-sm italic text-gray-500 block mb-1">Life on</span>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">STAGE</h2>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Social Dance</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium uppercase text-xs">
                    <Link className="tap-target text-base hover:underline" href="/home" onClick={(e) => handleProtectedLink(e, '/home')}>Tango</Link>
                    <Link className="tap-target text-base hover:underline" href="/home" onClick={(e) => handleProtectedLink(e, '/home')}>Salsa</Link>
                    <Link className="tap-target text-base hover:underline" href="/home" onClick={(e) => handleProtectedLink(e, '/home')}>Bachata</Link>
                    <Link className="tap-target text-base hover:underline" href="/home" onClick={(e) => handleProtectedLink(e, '/home')}>Swing</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Stage Dance</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Flamenco</a>
                    <a className="tap-target text-base hover:underline" href="#">Street</a>
                    <a className="tap-target text-base hover:underline" href="#">Ballet</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Body Flow</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Yoga</a>
                    <a className="tap-target text-base hover:underline" href="#">Pilates</a>
                    <a className="tap-target text-base hover:underline" href="#">Contemporary</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* SECTION 2: ROAD */}
        <article className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <img 
              alt="Motorcycle at night" 
              className="w-full h-[300px] md:h-[400px] object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAehR5qdh41IQFn8WKbV4LwGktsOIxv7TEr7czQF0YcVcK0g3bcPy1VpiW-jedSFHRQ-LbbtJONgTlZxBDd9886G9-KAMEdTa8wTO5VAgt9Xq0UKdS9IYzf_qjVLZGisRG3YIuiapv1IC35y8BiF2-uE1JmQjogU8Fx6sxuEcXmqLhObRUryjV-4Tz1Tvz6z3gSlpBOU7aeQtOyWFXNTII1StZPcwezkc9scxFg_sg8xy_n6MF10FY3f_lU8Ir-FCZ1v_K4Nkl5-Oa4" 
            />
            <div className="p-6 md:p-12">
              <header className="mb-8">
                <span className="text-sm italic text-gray-500 block mb-1">Life on</span>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">ROAD</h2>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Two-Wheels</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Bike</a>
                    <a className="tap-target text-base hover:underline" href="#">Motorbike</a>
                    <a className="tap-target text-base hover:underline" href="#">E-Scooter</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Urban Sports</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Running</a>
                    <a className="tap-target text-base hover:underline" href="#">Skateboarding</a>
                    <a className="tap-target text-base hover:underline" href="#">Inline</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Nature Path</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Camping</a>
                    <a className="tap-target text-base hover:underline" href="#">Trekking</a>
                    <a className="tap-target text-base hover:underline" href="#">Climbing</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* SECTION 3: TABLE */}
        <article className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <img 
              alt="Pottery wheel" 
              className="w-full h-[300px] md:h-[400px] object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAznwU330iANlk6C6m1ID864OC6cqpzNJl9HQD-MBjwanqqDXzbTn51rsR1_K3NQ1Tc7PiMO4GB8qVy220wbIUO6KoMXSQWpaatOAFs_VxOUWtXHSsqEYDM7Z6bt6rXYWFaW_f4iXR8JHhb9l1-HRI0Nvt4dJm4bWUBqqEO73owcq83yJ-H58xB4wftIFj31v4LZqbJfYH85Mn2jHm_9o7npXvMnhIZAhp9QqfvRatp3-bmomQrWty89CLyaHx_zsN58ziw1dD30wur" 
            />
            <div className="p-6 md:p-12">
              <header className="mb-8">
                <span className="text-sm italic text-gray-500 block mb-1">Life on</span>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">TABLE</h2>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Culinary</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Cooking</a>
                    <a className="tap-target text-base hover:underline" href="#">Baking</a>
                    <a className="tap-target text-base hover:underline" href="#">Dessert</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Beverage</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Coffee</a>
                    <a className="tap-target text-base hover:underline" href="#">Wine</a>
                    <a className="tap-target text-base hover:underline" href="#">Whisky</a>
                    <a className="tap-target text-base hover:underline" href="#">Tea</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Handcraft</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Pottery</a>
                    <a className="tap-target text-base hover:underline" href="#">Woodworking</a>
                    <a className="tap-target text-base hover:underline" href="#">Knitting</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* SECTION 4: MUSE */}
        <article className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <img 
              alt="Records and books" 
              className="w-full h-[300px] md:h-[400px] object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkWU3GZ9Xuxv5bznIf2J9FxwA83wsQZnWX_58EO7OFKAZZ6enLdeZp1b3BpJ_5RDeG8xlZZHkzZj_p3kIfm9QKGDFzBEwkslLK5xOWm3EHbQMTHAUtbBqR5hiXbjF2jaQC5tpr0OvBC5-lZf1OJwjvaNILs_1T9jlGSX93_lYcu9Av95j9S0nrrnP7YpGTZloj-pCYd0XPyY6T4cQlacpS-W4oyfZVuZQ4N2a2gwn5_AL_093_sc2XzgGsObcXG-2mPLVEiJ0s8qWj" 
            />
            <div className="p-6 md:p-12">
              <header className="mb-8">
                <span className="text-sm italic text-gray-500 block mb-1">Life on</span>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">MUSE</h2>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">The Artists</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">BTS</a>
                    <a className="tap-target text-base hover:underline" href="#">K-Pop</a>
                    <a className="tap-target text-base hover:underline" href="#">Global Pop</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Screen & Page</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Cinema</a>
                    <a className="tap-target text-base hover:underline" href="#">Anime</a>
                    <a className="tap-target text-base hover:underline" href="#">Literature</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Collectors</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Vinyl</a>
                    <a className="tap-target text-base hover:underline" href="#">Figures</a>
                    <a className="tap-target text-base hover:underline" href="#">Art Pieces</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>

        {/* SECTION 5: MIND */}
        <article className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <img 
              alt="Journaling" 
              className="w-full h-[300px] md:h-[400px] object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYvtNpW9Qt-qTDYS_T_SD0bSpakBq6upAD8Zz4Zl8omVXp-CMqQ5zdeudsC-gtqXJgZctXpSoK2f63IRZzQokEPv0-A6UYAKu0EYuR6Xm_VGekTUp-bCRr7mC0s7r-4lRX7qlXdcZh2q6nH7bC9CY2zZt9vVcuraieyf46wAYqklLA-agevz0A6vuSaPKZO6E58Ze2U3yL1lZG4ps-J4hOs2Gad6VCZMYehkCaasKNAJ1Th98zVie3dvzB6NuQ6hVp6FDkcuTl31Jv" 
            />
            <div className="p-6 md:p-12">
              <header className="mb-8">
                <span className="text-sm italic text-gray-500 block mb-1">Life on</span>
                <h2 className="text-5xl font-black tracking-tighter uppercase leading-none">MIND</h2>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-4">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Language</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">English</a>
                    <a className="tap-target text-base hover:underline" href="#">Spanish</a>
                    <a className="tap-target text-base hover:underline" href="#">Japanese</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Writing</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Journaling</a>
                    <a className="tap-target text-base hover:underline" href="#">Essay</a>
                    <a className="tap-target text-base hover:underline" href="#">Copywriting</a>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Home Styling</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <a className="tap-target text-base hover:underline" href="#">Interior</a>
                    <a className="tap-target text-base hover:underline" href="#">Plant Care</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
