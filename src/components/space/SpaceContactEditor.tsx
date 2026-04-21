"use client";

import React from "react";
import { motion } from "framer-motion";

interface SpaceContactEditorProps {
  onClose: () => void;
  onSave?: () => void;
}

export default function SpaceContactEditor({ onClose, onSave }: SpaceContactEditorProps) {
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
          <h1 className="font-headline font-bold text-xl tracking-tight text-[#242c51]">Contact Info</h1>
        </div>
        <button
          onClick={onSave || onClose}
          className="bg-[#0057bd] text-white px-6 py-2 rounded-xl font-headline font-bold hover:opacity-90 active:scale-95 transition-all"
        >
          Save
        </button>
      </header>

      <main className="pt-24 px-6 max-w-4xl mx-auto space-y-12 pb-32">
        {/* Representative Section */}
        <section className="space-y-6">
          <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Representative</h2>
          <div className="bg-white p-8 rounded-xl shadow-sm space-y-8">
            <div className="flex flex-col items-center sm:flex-row sm:space-x-8">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-[#efefff] flex items-center justify-center overflow-hidden border-2 border-dashed border-[#a3abd7]/30 hover:border-[#0057bd] transition-colors">
                  <span className="material-symbols-outlined text-4xl text-[#a3abd7]">account_circle</span>
                </div>
                <button className="absolute bottom-0 right-0 bg-[#0057bd] text-white p-2 rounded-full shadow-lg active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-sm">edit</span>
                </button>
              </div>
              <div className="flex-1 w-full mt-6 sm:mt-0 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#515981]">Full Name</label>
                  <input
                    className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40"
                    type="text"
                    defaultValue="Julian Kang"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-[#515981]">Phone Number</label>
                  <input
                    className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40"
                    placeholder="+82 10-0000-0000"
                    type="tel"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Location</h2>
            <span
              className="material-symbols-outlined text-[#0057bd]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
          </div>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            <div className="h-48 w-full bg-[#efefff] relative">
              <img
                alt="Map View"
                className="w-full h-full object-cover opacity-80"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7-NdwfiTqKyKbj9eiXsNSOaU47y_iiipygKn01ILZOdDARTnOaefq3g77AFz9kNRzEBlXSnrIyGx1OVczszYpgPRSHBKIIQ3KZ9W73ezxXqJD4g1-UXGbnZEEBbcdQP8f6kjmAr50r73BBgmc3_UyUgjZUcFZltF38rXbG36FREp1Z9soSEeRk-FnMfnR7Iz4ZP3vmSq_YXIi2VvILsN5qD_O5d08gcRvO6VvT9HCEEH6hQmvpVjavRz6aDAJHBu_K0hju_2LhqI"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#515981]">Primary Address</label>
                <div className="relative">
                  <input
                    className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl pl-4 pr-12 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40"
                    placeholder="Start typing address..."
                    type="text"
                  />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#a3abd7]">
                    search
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#515981]">Detailed Address</label>
                <input
                  className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40"
                  placeholder="Suite, floor, or building unit"
                  type="text"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#515981]">Public Transport</label>
                <textarea
                  className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40 resize-none font-body"
                  placeholder="Enter bus or subway instructions"
                  rows={4}
                ></textarea>
              </div>
            </div>
          </div>
        </section>

        {/* Social Media Section */}
        <section className="space-y-6">
          <h2 className="font-headline text-2xl font-extrabold text-[#242c51] tracking-tight">Social Media</h2>
          <div className="bg-white rounded-xl shadow-sm divide-y divide-[#e4e7ff] overflow-hidden">
            {/* Facebook */}
            <div className="p-6 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#1877F2]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#1877F2]">public</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-headline font-bold text-[#242c51]">Facebook</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[#dde1ff] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0057bd]"></div>
                  </label>
                </div>
                <input
                  className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40 text-sm"
                  type="text"
                  defaultValue="facebook.com/kineticsky"
                />
              </div>
            </div>
            {/* Instagram */}
            <div className="p-6 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#E4405F]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#E4405F]">photo_camera</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-headline font-bold text-[#242c51]">Instagram</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-[#dde1ff] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0057bd]"></div>
                  </label>
                </div>
                <input
                  className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40 text-sm"
                  type="text"
                  defaultValue="@kineticsky_official"
                />
              </div>
            </div>
            {/* X / Twitter */}
            <div className="p-6 flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-[#000000]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#000000]">close</span>
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-headline font-bold text-[#242c51]">X/Twitter</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#dde1ff] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0057bd]"></div>
                  </label>
                </div>
                <input
                  className="w-full bg-[#efefff] border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 font-headline font-bold text-[#242c51] placeholder:opacity-40 text-sm opacity-60"
                  placeholder="Link your X account"
                  type="text"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
    </motion.div>
  );
}
