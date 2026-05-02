"use client";

import React, { useState, useEffect } from "react";
import { Group } from "@/types/group";
import { Coupon, createCoupon, getActiveCoupons, deleteCoupon } from "@/lib/firebase/couponService";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

interface CouponAdminProps {
  group: Group;
}

const CouponAdmin: React.FC<CouponAdminProps> = ({ group }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // New Coupon Form State
  const [newCoupon, setNewCoupon] = useState<Omit<Coupon, 'id' | 'issuedCount' | 'createdAt' | 'status'>>({
    title: "",
    location: group.name,
    type: "DISCOUNT",
    discountValue: 0,
    duration: 1, // Default 1 month
    totalQuantity: 100,
    scope: "GROUP",
    groupId: group.id
  });

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const data = await getActiveCoupons({ scope: 'GROUP', groupId: group.id });
      setCoupons(data);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      toast.error("Failed to load coupons.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [group.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.title) {
      toast.error("Please enter a coupon title.");
      return;
    }
    setIsCreating(true);
    try {
      await createCoupon(newCoupon);
      toast.success("Coupon created successfully!");
      setNewCoupon({
        ...newCoupon,
        title: "",
        discountValue: 0
      });
      fetchCoupons();
    } catch (error) {
      console.error("Failed to create coupon:", error);
      toast.error("Failed to create coupon.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to deactivate this coupon?")) return;
    try {
      await deleteCoupon(id);
      toast.success("Coupon deactivated.");
      fetchCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      toast.error("Failed to deactivate coupon.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Create Coupon Form */}
      <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="font-headline font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">add_circle</span>
          Create New Group Coupon
        </h3>
        
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coupon Title</label>
            <input
              type="text"
              value={newCoupon.title}
              onChange={(e) => setNewCoupon({ ...newCoupon, title: e.target.value })}
              placeholder="e.g. 10% Membership Discount"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount Type</label>
            <select
              value={newCoupon.type}
              onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as 'FREE' | 'DISCOUNT' })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all"
            >
              <option value="DISCOUNT">Discount Amount (₩)</option>
              <option value="FREE">Free Pass</option>
            </select>
          </div>

          {newCoupon.type === 'DISCOUNT' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Discount Amount (₩)</label>
              <input
                type="number"
                value={newCoupon.discountValue}
                onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: Number(e.target.value) })}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration (Months)</label>
            <input
              type="number"
              value={newCoupon.duration}
              onChange={(e) => setNewCoupon({ ...newCoupon, duration: Number(e.target.value) })}
              placeholder="0 for Unlimited"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Quantity</label>
            <input
              type="number"
              value={newCoupon.totalQuantity}
              onChange={(e) => setNewCoupon({ ...newCoupon, totalQuantity: Number(e.target.value) })}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="md:col-span-2 pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Coupon"}
            </button>
          </div>
        </form>
      </section>

      {/* Coupon List */}
      <section className="space-y-4">
        <h3 className="font-headline font-bold text-xl text-slate-800 px-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-blue-600">confirmation_number</span>
          Active Coupons
        </h3>
        
        {isLoading ? (
          <div className="p-12 text-center text-slate-400">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
            No active coupons found for this group.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-blue-100">
                      {coupon.type === 'FREE' ? 'Free Pass' : `₩${coupon.discountValue?.toLocaleString()} OFF`}
                    </span>
                    <h4 className="font-headline font-bold text-lg text-slate-800 mt-2">{coupon.title}</h4>
                  </div>
                  <button
                    onClick={() => coupon.id && handleDelete(coupon.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                  >
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity</p>
                    <p className="text-sm font-bold text-slate-700">
                      {coupon.issuedCount} / {coupon.totalQuantity}
                    </p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full transition-all duration-1000" 
                        style={{ width: `${Math.min(100, (coupon.issuedCount / coupon.totalQuantity) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Validity</p>
                    <p className="text-sm font-bold text-slate-700">
                      {coupon.duration === 0 ? 'Unlimited' : `${coupon.duration} Months`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CouponAdmin;
