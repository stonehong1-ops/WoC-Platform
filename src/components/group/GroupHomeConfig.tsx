"use client";

import React from "react";
import { motion } from "framer-motion";

interface GroupHomeConfigProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function GroupHomeConfig({ onClose, onSave }: GroupHomeConfigProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] bg-[#f7f5ff] overflow-y-auto font-body"
    >
      {/* TopAppBar */}
      <header className="w-full sticky top-0 z-50 bg-[#f7f5ff] shadow-[0_4px_32px_rgba(36,44,81,0.06)] flex justify-between items-center px-6 h-16 border-none">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-[#0057bd] hover:bg-[#d6dbff] transition-colors p-2 rounded-full active:scale-95 duration-200"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-[#242c51]">Home Config</h1>
        </div>
        <button
          onClick={onSave || onClose}
          className="bg-[#0057bd] text-white px-6 py-2 rounded-xl font-headline font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          Save
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 group-y-12 pb-32">
        {/* Section 1: Brand Identity */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Brand Identity</h2>
            <p className="text-[#515981] text-sm mt-1">Define your core presence.</p>
          </div>
          <div className="md:col-span-8 bg-white p-8 rounded-xl shadow-sm group-y-6">
            <div className="group-y-2">
              <label className="text-sm font-semibold text-[#515981]">Brand Name</label>
              <input
                className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 text-[#242c51] placeholder:opacity-40"
                placeholder="e.g. Kinetic Sky"
                type="text"
              />
            </div>
            <div className="group-y-2">
              <label className="text-sm font-semibold text-[#515981]">Website Address</label>
              <div className="flex items-center bg-[#efefff] rounded-xl px-4 overflow-hidden focus-within:ring-2 focus-within:ring-[#0057bd]">
                <span className="text-[#515981] opacity-60 font-medium py-3">woc.today/group/</span>
                <input
                  className="flex-1 bg-transparent border-none focus:ring-0 py-3 text-[#242c51] placeholder:opacity-40"
                  placeholder="brandname"
                  type="text"
                />
              </div>
              <div className="flex items-center gap-1 text-[#0057bd] text-xs font-semibold px-1">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                Available
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Hero Image */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Hero Image</h2>
            <p className="text-[#515981] text-sm mt-1">High-quality visual anchor.</p>
          </div>
          <div className="md:col-span-8">
            <div className="relative group cursor-pointer aspect-video w-full bg-[#efefff] rounded-xl overflow-hidden border-2 border-dashed border-[#a3abd7]/30 flex flex-col items-center justify-center transition-all hover:bg-[#dde1ff]">
              <img
                className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-20 transition-opacity"
                alt="modern minimalist office"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUMm41-wNI41GTo4qzGhhiKYCCjlq26EguVUSS19yGENhoHVeywenT94qfYNRge51__fyXm_tH5f0OXVrDA0Tn3eV2omf_fGeU76pV-6vT6PjIGgPbO1P3DvNv1Usvkk63POj4GF4YKQBUQbU09hiPl4ecyyqCEr8KWNwms03i95hZf1br7sIr3jbDmwzReAReCkeiuEW62lEx3alKlRWct_EwXgKFQxTsVGgwwrKqe9dm6aNUW05n6M4tbKvLX2ozMZjf4CTbEU0"
              />
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-[#0057bd]/10 text-[#0057bd] flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
                </div>
                <span className="font-headline font-bold text-[#0057bd]">Upload Representative Photo</span>
                <span className="text-xs text-[#515981] mt-1">JPG, PNG up to 10MB</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Brand Story */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Brand Story</h2>
            <p className="text-[#515981] text-sm mt-1">Narrative and core values.</p>
          </div>
          <div className="md:col-span-8 bg-white p-8 rounded-xl shadow-sm">
            <div className="group-y-2">
              <label className="text-sm font-semibold text-[#515981]">Description</label>
              <textarea
                className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 text-[#242c51] placeholder:opacity-40 resize-none font-body"
                placeholder="Share your story... ✨"
                rows={5}
              ></textarea>
            </div>
          </div>
        </section>

        {/* Section 4: Key Services */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-20">
          <div className="md:col-span-4">
            <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Key Services</h2>
            <p className="text-[#515981] text-sm mt-1">Capabilities and offerings.</p>
          </div>
          <div className="md:col-span-8 group-y-4">
            <div className="group-y-6">
              {/* Service Item 1 */}
              <div className="bg-white p-6 rounded-xl shadow-sm group-y-4 border border-[#a3abd7]/10 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#c7cfff] flex items-center justify-center text-[#223ea2] shrink-0">
                      <span className="material-symbols-outlined">architecture</span>
                    </div>
                    <div className="flex-1 group-y-1">
                      <label className="text-xs font-semibold text-[#515981]">Service Title</label>
                      <input
                        className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-lg px-4 py-2 text-[#242c51] font-semibold"
                        type="text"
                        defaultValue="Design Strategy"
                      />
                    </div>
                  </div>
                  <button className="text-[#b31b25] p-2 hover:bg-[#fb5151]/10 rounded-full transition-all ml-2">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
                <div className="group-y-1">
                  <label className="text-xs font-semibold text-[#515981]">Service Description</label>
                  <textarea
                    className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-lg px-4 py-2 text-[#242c51] text-sm placeholder:opacity-40 resize-none font-body"
                    placeholder="Describe this service..."
                    rows={2}
                    defaultValue="Defining visual direction and brand guidelines."
                  ></textarea>
                </div>
              </div>

              {/* Service Item 2 */}
              <div className="bg-white p-6 rounded-xl shadow-sm group-y-4 border border-[#a3abd7]/10 relative group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-xl bg-[#f199f7] flex items-center justify-center text-[#5e106a] shrink-0">
                      <span className="material-symbols-outlined">analytics</span>
                    </div>
                    <div className="flex-1 group-y-1">
                      <label className="text-xs font-semibold text-[#515981]">Service Title</label>
                      <input
                        className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-lg px-4 py-2 text-[#242c51] font-semibold"
                        type="text"
                        defaultValue="Market Analysis"
                      />
                    </div>
                  </div>
                  <button className="text-[#b31b25] p-2 hover:bg-[#fb5151]/10 rounded-full transition-all ml-2">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
                <div className="group-y-1">
                  <label className="text-xs font-semibold text-[#515981]">Service Description</label>
                  <textarea
                    className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-lg px-4 py-2 text-[#242c51] text-sm placeholder:opacity-40 resize-none font-body"
                    placeholder="Describe this service..."
                    rows={2}
                    defaultValue="In-depth research on competitors and industry trends."
                  ></textarea>
                </div>
              </div>

              {/* Add New Service Button */}
              <button className="w-full py-6 border-2 border-dashed border-[#0057bd]/30 rounded-xl flex flex-col items-center justify-center gap-2 text-[#0057bd] font-bold hover:bg-[#0057bd]/5 transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-3xl">add_circle</span>
                <span>Add New Service</span>
              </button>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
