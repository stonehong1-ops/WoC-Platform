'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLocation } from '@/components/providers/LocationProvider';
import SubFooter from '@/components/SubFooter';

export default function ExplorePage() {
  const { profile, user } = useAuth();
  const { location, setIsSelectorOpen } = useLocation();
  const displayName = profile?.nickname || user?.displayName || 'Stone';

  return (
    <div className="bg-[#FAF8FF] text-black antialiased w-full pb-32 pt-4">
      {/* Header Message Section */}
      <header className="px-6 mb-16 max-w-5xl mx-auto pt-2">
        <div className="flex justify-between items-start mb-6">
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-5xl font-bold italic tracking-tight text-slate-900 leading-tight animate-in fade-in slide-in-from-left-4 duration-1000">
              Life goes ON<span className="text-[#007AFF] inline-block animate-pulse">_</span>
            </h1>
            <div className="h-1 w-16 bg-[#007AFF]/20 rounded-full mt-2"></div>
          </div>

        </div>
        
        <div className="space-y-3 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
          <h1 className="text-xl sm:text-2xl text-on-surface font-medium leading-tight">
            <span className="font-bold">{displayName},</span> this is a space where everyone on Earth connects through shared hobbies.
          </h1>
          <p className="text-sm sm:text-base text-slate-500 font-normal leading-relaxed">
            Discover new experiences in our diverse societies.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* SECTION 1: STAGE */}
        <article className="border-b border-slate-100/50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
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
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=tango">Tango</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=salsa">Salsa</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=bachata">Bachata</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=swing">Swing</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Stage Dance</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=flamenco">Flamenco</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=street">Street</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=ballet">Ballet</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Body Flow</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=yoga">Yoga</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=pilates">Pilates</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=contemporary">Contemporary</Link>
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
                    <Link className="tap-target text-base hover:underline" href="/home?society=bike">Bike</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=motorbike">Motorbike</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=e-scooter">E-Scooter</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Urban Sports</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=running">Running</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=skateboarding">Skateboarding</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=inline">Inline</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Nature Path</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=camping">Camping</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=trekking">Trekking</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=climbing">Climbing</Link>
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
                    <Link className="tap-target text-base hover:underline" href="/home?society=cooking">Cooking</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=baking">Baking</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=dessert">Dessert</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Beverage</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=coffee">Coffee</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=wine">Wine</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=whisky">Whisky</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=tea">Tea</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Handcraft</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=pottery">Pottery</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=woodworking">Woodworking</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=knitting">Knitting</Link>
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
                    <Link className="tap-target text-base hover:underline" href="/home?society=bts">BTS</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=k-pop">K-Pop</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=global-pop">Global Pop</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Screen & Page</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=cinema">Cinema</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=anime">Anime</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=literature">Literature</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Collectors</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=vinyl">Vinyl</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=figures">Figures</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=art-pieces">Art Pieces</Link>
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
                    <Link className="tap-target text-base hover:underline" href="/home?society=english">English</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=spanish">Spanish</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=japanese">Japanese</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Writing</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=journaling">Journaling</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=essay">Essay</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=copywriting">Copywriting</Link>
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Home Styling</h4>
                  <div className="flex flex-wrap gap-x-4 font-medium">
                    <Link className="tap-target text-base hover:underline" href="/home?society=interior">Interior</Link>
                    <Link className="tap-target text-base hover:underline" href="/home?society=plant-care">Plant Care</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Footer Restoration */}
      <SubFooter />
    </div>
  );
}
