"use client";

import React, { useState } from "react";

const MOCK_PRODUCTS = [
  { id: "1", name: "Official Group T-Shirt", variant: "Black / M", sku: "TSH-BLK-M", stock: 45, reserved: 5, sold: 120, status: "in-stock" as const, image: "👕" },
  { id: "2", name: "Official Group T-Shirt", variant: "Black / L", sku: "TSH-BLK-L", stock: 3, reserved: 2, sold: 85, status: "low-stock" as const, image: "👕" },
  { id: "3", name: "Logo Cap", variant: "White", sku: "CAP-WHT", stock: 22, reserved: 0, sold: 58, status: "in-stock" as const, image: "🧢" },
  { id: "4", name: "Dance Practice Towel", variant: "One Size", sku: "TWL-001", stock: 0, reserved: 0, sold: 200, status: "sold-out" as const, image: "🏋️" },
  { id: "5", name: "Premium Hoodie", variant: "Navy / XL", sku: "HOD-NVY-XL", stock: 8, reserved: 3, sold: 42, status: "low-stock" as const, image: "🧥" },
  { id: "6", name: "Sticker Pack", variant: "Set of 5", sku: "STK-005", stock: 150, reserved: 10, sold: 310, status: "in-stock" as const, image: "🎨" },
];

const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  "in-stock": { bg: "bg-primary/10", text: "text-primary", label: "In Stock" },
  "low-stock": { bg: "bg-amber-500/10", text: "text-amber-600", label: "Low Stock" },
  "sold-out": { bg: "bg-error/10", text: "text-error", label: "Sold Out" },
};

export default function ProductInventory() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_PRODUCTS
    .filter(p => filter === "all" || p.status === filter)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  const totalStock = MOCK_PRODUCTS.reduce((s, p) => s + p.stock, 0);
  const totalSold = MOCK_PRODUCTS.reduce((s, p) => s + p.sold, 0);
  const lowStockCount = MOCK_PRODUCTS.filter(p => p.status === "low-stock").length;
  const soldOutCount = MOCK_PRODUCTS.filter(p => p.status === "sold-out").length;

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Product Inventory</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Stock levels & inventory management</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary rounded-full text-[13px] font-semibold shadow-md">
          <span className="material-symbols-outlined text-[18px]">add</span>Adjust
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-surface-container rounded-xl p-3 text-center border border-outline/5"><p className="text-[20px] font-bold text-on-surface">{totalStock}</p><p className="text-[9px] text-on-surface-variant font-semibold">In Stock</p></div>
        <div className="bg-primary/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-primary">{totalSold}</p><p className="text-[9px] text-on-surface-variant font-semibold">Total Sold</p></div>
        <div className="bg-amber-500/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-amber-600">{lowStockCount}</p><p className="text-[9px] text-on-surface-variant font-semibold">Low Stock</p></div>
        <div className="bg-error/10 rounded-xl p-3 text-center"><p className="text-[20px] font-bold text-error">{soldOutCount}</p><p className="text-[9px] text-on-surface-variant font-semibold">Sold Out</p></div>
      </div>

      {/* Search */}
      <div className="relative">
        <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40">search</span>
        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-surface-container border border-outline/10 rounded-xl pl-10 pr-4 py-2.5 text-[13px]" placeholder="Search products..." />
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[["all", "All"], ["in-stock", "In Stock"], ["low-stock", "Low Stock"], ["sold-out", "Sold Out"]].map(([k, v]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-[11px] font-semibold ${filter === k ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"}`}>{v}</button>
        ))}
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filtered.map(p => {
          const st = STATUS_MAP[p.status];
          return (
            <div key={p.id} className={`bg-surface-container rounded-xl p-4 border border-outline/5 ${p.status === "sold-out" ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-[24px] shrink-0">{p.image}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[14px] font-semibold text-on-surface truncate">{p.name}</p>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${st.bg} ${st.text}`}>{st.label}</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">{p.variant} · SKU: {p.sku}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3 bg-surface rounded-lg p-2">
                <div className="flex-1 text-center"><p className="text-[16px] font-bold text-on-surface">{p.stock}</p><p className="text-[8px] text-on-surface-variant font-semibold">Available</p></div>
                <div className="w-px h-6 bg-outline/10" />
                <div className="flex-1 text-center"><p className="text-[16px] font-bold text-amber-600">{p.reserved}</p><p className="text-[8px] text-on-surface-variant font-semibold">Reserved</p></div>
                <div className="w-px h-6 bg-outline/10" />
                <div className="flex-1 text-center"><p className="text-[16px] font-bold text-primary">{p.sold}</p><p className="text-[8px] text-on-surface-variant font-semibold">Sold</p></div>
              </div>
              {p.status === "low-stock" && (
                <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                  <span className="material-symbols-outlined text-[14px]">warning</span>
                  <span className="text-[11px] font-semibold">Low stock alert — consider restocking</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
