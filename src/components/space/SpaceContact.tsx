import React from 'react';
import CommunityFooter from './CommunityFooter';

const SpaceContact = ({ community }: any) => {
  return (
    <div className="relative z-10 max-w-5xl mx-auto space-y-8 pb-32">
      {/* Header Section */}
      <div className="space-y-2">
        <h1 className="font-headline font-extrabold text-3xl md:text-4xl tracking-tight text-on-surface">Get in Touch</h1>
        <p className="font-body text-on-surface-variant text-base">We're here to help you take the next step in your tango journey.</p>
      </div>

      {/* Contact Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map & Location Card */}
        <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
          <div className="h-64 w-full bg-slate-200 relative">
            <img 
              alt="Map of Buenos Aires showing the dance studio location" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-wvDVsjBle_bGNb4hsqn6y8wjgMFWmk60T0y2Fqf8ZTV_2FZAp-tSy4auIoXmUnezOrqFP6xo4y8VPEWpM0Krkc9tSy4auIoXmUnezOrqFP6xo4y8VPEWpM0Krkc9tSzIp-ZTfnOc2k27HUgs2xGK18Chib7Pd3L4ZxB9ICwHxKoAPgMGXxsUmd8M_xGM7DrokTWYuxICSKhpTdRr0zfo7ixN_dcogUFGKlErBpBYrm886tUyeBj9XsCXfRL2-RGe_9Ob0eSUqOFTwa8qq9w_LonGpuQaxQcl65Hmyj52UkqsslsI" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent"></div>
          </div>
          <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div>
              <h2 className="font-headline font-bold text-xl text-on-surface mb-2">{community.name} Studio</h2>
              <p className="font-body text-on-surface-variant text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">location_on</span>
                1234 Milonga Way, Buenos Aires, ARG
              </p>
            </div>
            <button className="bg-primary text-on-primary px-6 py-3 rounded-lg font-label font-bold text-sm tracking-wide shadow-md shadow-primary/20 hover:scale-[0.98] active:scale-95 transition-all w-full md:w-auto">
              Get Directions
            </button>
          </div>
        </div>

        {/* Primary Contact & Representative */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6 flex flex-col gap-6 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-container">
              <img 
                alt="Portrait of Elena Rodriguez, Studio Manager" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVn84zd-Xeh1uu4i_eHn7FuikWn0TDAcoN6uVNJTzPcHT5z775wGObpG3AxHvyRAl-zg9SZmJZmKmV9hyGoCEvwb36wUCsxTmAFdnCjJMyQKPP8LlJXfVlKzLWSr0ZTrugGDqMH4wU2fOg0NOZLwGBYnftnxWsoSEgyS8iWjWL4S4d40d60OSAbDQ2QxhIl-L7EQ8g4gfUXxpRlE8s8uGsd95msP6auUVMXwoZ5ZG6RHk5cI_xC9L8G3eCcOMW5sA-46B8Xqm3XLs" 
              />
            </div>
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface">Elena Rodriguez</h3>
              <p className="font-body text-xs font-semibold text-primary uppercase tracking-wider">Studio Manager</p>
            </div>
          </div>
          <div className="space-y-3">
            <a className="flex items-center gap-3 w-full bg-secondary-container/30 hover:bg-secondary-container/50 text-on-secondary-container px-4 py-3 rounded-lg transition-colors group" href="tel:+541155551234">
              <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-secondary">call</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label text-[11px] font-bold uppercase tracking-wider text-secondary-dim">Call Us</span>
                <span className="font-body font-medium text-sm">+54 11 5555-1234</span>
              </div>
            </a>
            <button className="flex items-center gap-3 w-full bg-tertiary-container/30 hover:bg-tertiary-container/50 text-on-tertiary-container px-4 py-3 rounded-lg transition-colors group">
              <div className="w-10 h-10 rounded-full bg-tertiary-container flex items-center justify-center group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-tertiary">chat</span>
              </div>
              <div className="flex flex-col text-left">
                <span className="font-label text-[11px] font-bold uppercase tracking-wider text-tertiary-dim">In-App Chat</span>
                <span className="font-body font-medium text-sm">Typically replies in 10m</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Secondary Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transportation Info */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6">
          <h3 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">directions_transit</span>
            Getting Here
          </h3>
          <div className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="mt-1 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface text-sm">subway</span>
              </div>
              <div>
                <h4 className="font-headline font-semibold text-sm text-on-surface">Subway (Subte)</h4>
                <p className="font-body text-sm text-on-surface-variant mt-1">Take Line D (Green) to Palermo Station. Walk 3 blocks down Santa Fe Ave, turn left on Milonga Way.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="mt-1 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-on-surface text-sm">directions_bus</span>
              </div>
              <div>
                <h4 className="font-headline font-semibold text-sm text-on-surface">Bus (Colectivo)</h4>
                <p className="font-body text-sm text-on-surface-variant mt-1">Lines 15, 29, 39, and 152 drop off within a 2-minute walk from the studio entrance.</p>
              </div>
            </div>
          </div>
        </div>
        {/* Social Media & Office Hours */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-headline font-bold text-lg text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">share</span>
              Connect Online
            </h3>
            <div className="flex gap-4 mb-6">
              <a className="w-12 h-12 rounded-full bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors" href="#">
                <span className="font-headline font-bold">In</span>
              </a>
              <a className="w-12 h-12 rounded-full bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors" href="#">
                <span className="font-headline font-bold">Fb</span>
              </a>
              <a className="w-12 h-12 rounded-full bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface transition-colors" href="#">
                <span className="font-headline font-bold">X</span>
              </a>
            </div>
          </div>
          <div className="pt-4 border-t border-outline-variant/20">
            <h4 className="font-headline font-semibold text-sm text-on-surface mb-2">Office Hours</h4>
            <ul className="font-body text-sm text-on-surface-variant space-y-1">
              <li className="flex justify-between"><span>Mon - Fri</span> <span>9:00 AM - 9:00 PM</span></li>
              <li className="flex justify-between"><span>Sat - Sun</span> <span>10:00 AM - 6:00 PM</span></li>
            </ul>
          </div>
        </div>
      </div>
      <CommunityFooter communityName={community.name} />
    </div>
  );
};

export default SpaceContact;

