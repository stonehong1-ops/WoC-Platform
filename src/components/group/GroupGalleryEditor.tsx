"use client";

import React from "react";
import { motion } from "framer-motion";

interface GroupGalleryEditorProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function GroupGalleryEditor({ onClose, onSave }: GroupGalleryEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-[100] bg-[#f7f5ff] overflow-y-auto font-body"
    >
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-[#f7f5ff] flex items-center justify-between px-6 h-16 shadow-[0_4px_32px_rgba(36,44,81,0.06)]">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="active:scale-95 transition-transform text-[#0057bd] hover:bg-[#d6dbff] p-2 rounded-full duration-200"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline font-bold text-xl tracking-tight text-[#242c51]">Gallery Editor</h1>
        </div>
        <button
          onClick={onSave || onClose}
          className="bg-[#0057bd] text-white px-6 py-2 rounded-xl font-headline font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          Save
        </button>
      </header>

      <main className="pt-24 px-6 max-w-4xl mx-auto group-y-12 pb-32">
        {/* Cloud Storage Usage Bar */}
        <section className="bg-white p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Cloud Storage</h2>
              <p className="text-[#515981] text-sm mt-1">Using 6.4 GB of 10 GB</p>
            </div>
            <span className="text-[#0057bd] font-bold text-lg">64%</span>
          </div>
          <div className="h-3 w-full bg-[#efefff] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#0057bd] to-[#893c92] w-[64%] rounded-full"></div>
          </div>
        </section>

        {/* Gallery Sections List */}
        <div className="group-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Gallery Sections</h3>
            <span className="text-xs font-bold uppercase tracking-widest text-[#6c759e]">Manage Layout</span>
          </div>

          {/* Single Section Example: Milonga Highlights */}
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="p-8 group-y-6">
              {/* Section Title Input */}
              <div className="group-y-2">
                <label className="text-sm font-semibold text-[#515981]">Section Title</label>
                <input
                  className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40"
                  type="text"
                  defaultValue="Milonga Highlights"
                />
              </div>

              {/* Media Type Toggle */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[#515981]">Media Type</label>
                <div className="flex bg-[#efefff] p-1 rounded-xl w-fit">
                  <button className="px-6 py-2 rounded-lg bg-white text-[#0057bd] shadow-sm font-bold text-sm flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">photo_library</span>
                    Photos
                  </button>
                  <button className="px-6 py-2 rounded-lg text-[#515981] hover:text-[#0057bd] font-bold text-sm flex items-center gap-2 transition-colors">
                    <span className="material-symbols-outlined text-sm">movie</span>
                    Videos
                  </button>
                </div>
                <p className="text-[11px] text-[#6c759e] italic mt-1">* Note: Media types cannot coexist in the same section.</p>
              </div>

              {/* Photos Grid Selection State */}
              <div className="group-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-[#515981]">Up to 10 photos</label>
                  <span className="text-xs font-medium text-[#004ca6]">3 / 10 Used</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {/* Photo 1 */}
                  <div className="relative aspect-square rounded-lg overflow-hidden group/item">
                    <img
                      className="w-full h-full object-cover"
                      alt="tango dancers"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCAvGbfCS2RkgboVWgJGh5dSvgSwJ4k3zmY1Ze92pmiDOpD1XF5HsnBwfuDyXkpj46E0c2-b7Cxisi3NTqvDuJxiEXFbLPkufbLOmnW_jOr0nNRo5kTailzfJ-Cv4TS4LlXcShtnIPd-ewSD67fkVc15FN4V4JmRDYzvyBmLSV08g3wGd0z_2jE5QhbUos1JvTGkJsbTXxlM4BKstOnmq_iPNe6AoHZ7Kb2rk6de1TUF7yWc-8GQyN-xsmsN2Rtp8x3neJlyfkphEQ"
                    />
                    <button className="absolute top-1 right-1 bg-[#b31b25] text-white p-1 rounded-full shadow-lg opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  {/* Photo 2 */}
                  <div className="relative aspect-square rounded-lg overflow-hidden group/item">
                    <img
                      className="w-full h-full object-cover"
                      alt="tango shoes"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDu9cgQy-ODOil4Bf6up0LmABZ0DtwSYLJ7hRlWyYABlifycX-2KINmevPm1A0t5-YRFk1UQMTxu2HBDJe0iPNuez8PSS2Th9aMk2cTIPvxvdqJr4XYde-hCSe-TFsT-N_9Q05Q2hn1-Akr002M1G0x4QLnIqxyT26LylR58dWYLskNE_0XSboJXBukFZVw0IraEuKy6vJhUv7EDhv7pHQiBA2eue8ZbT0c9f6oECmpNoj3nYdZsV8byxJY8DNggnVeUipRQfFfuA4"
                    />
                    <button className="absolute top-1 right-1 bg-[#b31b25] text-white p-1 rounded-full shadow-lg opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  {/* Photo 3 */}
                  <div className="relative aspect-square rounded-lg overflow-hidden group/item">
                    <img
                      className="w-full h-full object-cover"
                      alt="tango hall"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuChwT5Z3mmLOlHFtVUcXrtX7Rvfzgp8D1Ww0r_-IP9AThRG1CPfFwucN0UFjQeS7-JlMbPscn9_cpYgs8-tV8cUu_WrGVtW-H1hTCZV5R7vgeAc6tWjvL1TcXpxQvNUQ_uOX1vxkh77QmaOSck0RJm0phT31uPO3chWW_zPVvDQh9myrbuM7PRxiwanGspFrloXDMuNHjuWVXpYZ3OOixgyuO3GVOLrzr91a2Cdbd4U0AoZhQixa1vVwRuCsv-1ryd-tGcNvbKjzOo"
                    />
                    <button className="absolute top-1 right-1 bg-[#b31b25] text-white p-1 rounded-full shadow-lg opacity-0 group-hover/item:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                  {/* Add Photo Button */}
                  <button className="aspect-square rounded-lg border-2 border-dashed border-[#a3abd7]/30 hover:border-[#0057bd] hover:bg-[#dde1ff] transition-all flex flex-col items-center justify-center gap-1 group/btn">
                    <span className="material-symbols-outlined text-[#a3abd7] group-hover/btn:text-[#0057bd]">
                      add_a_photo
                    </span>
                    <span className="text-[10px] font-bold text-[#a3abd7] group-hover/btn:text-[#0057bd] uppercase tracking-tighter">
                      Add
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add New Section Button */}
          <button className="w-full py-8 border-2 border-dashed border-[#0057bd]/30 rounded-xl flex flex-col items-center justify-center gap-2 text-[#0057bd] font-bold hover:bg-[#0057bd]/5 transition-all active:scale-[0.98]">
            <span className="material-symbols-outlined text-3xl">add_circle</span>
            <span className="font-headline font-bold">Add New Section</span>
          </button>
        </div>
      </main>
    </motion.div>
  );
}
