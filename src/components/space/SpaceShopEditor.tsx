"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import SpaceShopAddEditor from "./SpaceShopAddEditor";

const SpaceShopEditor: React.FC = () => {
  const [activeSegment, setActiveSegment] = useState<"Selling" | "Stopped">("Selling");
  const [activeSubEditor, setActiveSubEditor] = useState<string | null>(null);

  const shopItems = [
    {
      id: 1,
      category: "Electronics",
      title: "Minimalist Smartwatch",
      description: "Premium series 4",
      price: 249.00,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6MDJz3tzjUxjBO73Gwull0WPu5PXJaghhnwmbOHSqP7ytMnR4S8I8IkvWFZ5J7Zd4MTeWUnLGO6CutCR9urz-mlJ0b4X1T93ixN3ZewoSzPAa4ieHsHpiBoyc3JUCSPdaVHe8ptYhKm9YNeT1C_SWnWF4OJ4ca21aGiyp2kfXvNdRXX4yRGXvNY3KD7WKbskjT9N-BtpD_-eBiyMo4SkTTJplOzIcI-mbOaMC36t--O_YaQHhxtDMq-Fv5OYE-EnVMHuntWp7s-I",
      status: "Active",
    },
    {
      id: 2,
      category: "Audio",
      title: "Studio Wireless Pro",
      description: "Noise Cancelling",
      price: 320.00,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAsTmIT8nLA7CvY6YkWE4MxaJ4ZsdDZo6Kvy9-0BnnbWYuz90zIlpVfpwXNGKJaRmJX2h98UNHa7CaJm94RejIJaKsqBkxfbPv1o8M4432ctA1HN84mKX6S16T4vWawQi1gRUz9ZTUigv3D6zSZbwuEnrdIbgiq7rLsnDtOiDaDpUv3Sn9ZfqD0JcIz1HdoxvFTZX_-Llx0s5mmkwZEw6lRzRbWKLnQBpmeiY32N3KpDYVlFokpBPkndXRIorrOkiMBrEUZqGg6Nsw",
      status: "Active",
    },
    {
      id: 3,
      category: "Accessories",
      title: "Leather Laptop Sleeve",
      description: "Fits 15\" Models",
      price: 65.00,
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAiGCTFpAr2_lLbcO9oYfZVTZWCOezYiDO6ZcvyK2QWnmpL6xeZRHTLXoy-y_t0dJX4yb5RRSynpQP0yEgIq5vfQdG6CVuF1XebAa_Q9Ra9Ti4T5CvO149QQu9MoSAVMgu4m329iTSYwgdPNGO4A9BN_v-JNhkADL03ipCfLbQ0qptdaenIaad9bV1yWjHzh0Xl1HCfcso6XBdWkWwJUCUAmCl3nDs94LaTwEYzMmJCppC--yhSZEbuccPuO0QqwDp_YA80sL-X2vc",
      status: "Stopped",
    },
  ];

  const filteredItems = shopItems.filter(item => 
    activeSegment === "Selling" ? item.status === "Active" : item.status === "Stopped"
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen font-body bg-transparent"
    >
      {/* Header */}
      <header className="px-6 py-6 w-full">
        <h1 className="font-headline font-extrabold text-2xl tracking-tight text-[#242c51]">Shop Settings</h1>
        <p className="text-[#515981] text-sm mt-1">Manage your community items and sales.</p>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-4 space-y-6 w-full">
        {/* Top Action Section */}
        <section className="space-y-4">
          {/* Segmented Control */}
          <div className="bg-[#e4e7ff]/50 p-1 rounded-xl flex items-center shadow-inner border border-[#a3abd7]/10">
            <button 
              onClick={() => setActiveSegment("Selling")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-headline font-bold text-sm transition-all text-center ${
                activeSegment === "Selling" 
                  ? "bg-white text-[#0057bd] shadow-sm" 
                  : "text-[#6c759e] hover:text-[#515981]"
              }`}
            >
              Selling
            </button>
            <button 
              onClick={() => setActiveSegment("Stopped")}
              className={`flex-1 py-2.5 px-4 rounded-lg font-headline font-bold text-sm transition-all text-center ${
                activeSegment === "Stopped" 
                  ? "bg-white text-[#0057bd] shadow-sm" 
                  : "text-[#6c759e] hover:text-[#515981]"
              }`}
            >
              Stopped
            </button>
          </div>

          {/* Primary Action Button */}
          <button 
            onClick={() => setActiveSubEditor("add-item")}
            className="w-full bg-[#0057bd] text-white font-headline font-bold py-4 px-6 rounded-xl shadow-lg shadow-[#0057bd]/20 flex items-center justify-center gap-2 hover:bg-[#004ca6] transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Add Item</span>
          </button>
        </section>

        <AnimatePresence>
          {activeSubEditor === "add-item" && (
            <SpaceShopAddEditor onClose={() => setActiveSubEditor(null)} />
          )}
        </AnimatePresence>

        {/* Item List */}
        <section className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.article 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-2xl p-4 shadow-sm border border-[#a3abd7]/10 flex gap-4 transition-all hover:shadow-md ${item.status === "Stopped" ? "opacity-75" : ""}`}
              >
                <div className={`w-24 h-24 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200/50 ${item.status === "Stopped" ? "grayscale" : ""}`}>
                  <img alt={item.title} className="w-full h-full object-cover" src={item.image} />
                </div>
                
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1.5 ${
                      item.status === "Active" 
                        ? "text-[#0057bd] bg-[#6e9fff]/10" 
                        : "text-[#6c759e] bg-slate-200"
                    }`}>
                      {item.category}
                    </span>
                    <h3 className={`font-headline font-extrabold text-base leading-tight ${item.status === "Active" ? "text-[#242c51]" : "text-[#6c759e]"}`}>
                      {item.title}
                    </h3>
                    <p className={`text-xs font-medium mt-0.5 ${item.status === "Active" ? "text-[#515981]" : "text-[#a3abd7]"}`}>
                      {item.description}
                    </p>
                  </div>
                  
                  <div className="flex items-end justify-between mt-2">
                    <span className={`font-headline font-bold text-lg ${item.status === "Active" ? "text-[#0057bd]" : "text-[#6c759e]"}`}>
                      ${item.price.toFixed(2)}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-black uppercase tracking-wide ${item.status === "Active" ? "text-green-600" : "text-[#a3abd7]"}`}>
                        {item.status === "Active" ? "Active" : "Stopped"}
                      </span>
                      {/* Toggle */}
                      <div 
                        className={`w-10 h-5 rounded-full relative transition-colors duration-300 shadow-inner cursor-pointer ${
                          item.status === "Active" ? "bg-[#0057bd]" : "bg-[#a3abd7]"
                        }`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow-sm ${
                          item.status === "Active" ? "right-0.5" : "left-0.5"
                        }`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
          
          {filteredItems.length === 0 && (
            <div className="py-20 text-center">
              <span className="material-symbols-outlined text-4xl text-[#a3abd7] mb-2">shopping_bag</span>
              <p className="text-[#515981] font-medium text-sm">No items in this category.</p>
            </div>
          )}
        </section>
      </main>
    </motion.div>
  );
};

export default SpaceShopEditor;
