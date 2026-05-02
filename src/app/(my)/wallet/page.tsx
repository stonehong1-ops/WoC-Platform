"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getUserCoupons, UserCoupon, useCoupon } from "@/lib/firebase/couponService";
import { getUserBalance, getTransactionHistory, Transaction } from "@/lib/firebase/walletService";
import { format } from "date-fns";
import { toast } from "sonner";

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [coupons, setCoupons] = useState<UserCoupon[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [b, c, t] = await Promise.all([
          getUserBalance(user.uid),
          getUserCoupons(user.uid),
          getTransactionHistory(user.uid)
        ]);
        setBalance(b);
        setCoupons(c);
        setTransactions(t);
      } catch (error) {
        console.error("Failed to load wallet data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleUseCoupon = async (userCouponId: string) => {
    if (!confirm("Do you want to use this coupon?")) return;
    try {
      await useCoupon(userCouponId);
      toast.success("Coupon used!");
      // Refresh coupons
      if (user) {
        const updated = await getUserCoupons(user.uid);
        setCoupons(updated);
      }
    } catch (error) {
      toast.error("Failed to use coupon.");
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 font-medium">Please sign in to view your wallet.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8FF] pb-24 font-inter">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <div className="px-6 pt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Balance Card */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#1E293B] to-[#334155] rounded-[32px] p-8 shadow-xl shadow-slate-900/10 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl -ml-12 -mb-12"></div>
          
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Current Balance</p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-extrabold tracking-tight">₩{balance.toLocaleString()}</span>
            <span className="text-slate-400 text-sm font-medium mb-1.5">Points</span>
          </div>

          <div className="flex gap-3 mt-8">
            <button className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]">
              Charge
            </button>
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]">
              Send
            </button>
          </div>
        </section>

        {/* Coupons Section */}
        <section>
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-lg font-extrabold text-[#1E293B] font-jakarta">My Coupons</h2>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{coupons.filter(c => c.status === 'UNUSED').length} Available</span>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-6 px-6 snap-x">
            {coupons.length === 0 ? (
              <div className="w-full py-8 text-center bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
                No coupons yet.
              </div>
            ) : (
              coupons.map((uc) => (
                <div 
                  key={uc.id} 
                  className={`shrink-0 w-72 rounded-2xl p-5 relative overflow-hidden snap-start transition-all border ${
                    uc.status === 'UNUSED' 
                      ? 'bg-white border-blue-100 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 opacity-60 grayscale'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${uc.status === 'UNUSED' ? 'bg-blue-500' : 'bg-slate-300'}`}></div>
                  
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      uc.status === 'UNUSED' ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {uc.couponData.type === 'FREE' ? 'Free Pass' : 'Discount'}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold">{uc.couponData.location}</p>
                  </div>

                  <h3 className="font-bold text-slate-800 line-clamp-1 mb-1">{uc.couponData.title}</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Expires: {uc.expiresAt ? format(uc.expiresAt.toMillis(), 'yyyy.MM.dd') : 'Forever'}
                  </p>

                  {uc.status === 'UNUSED' && (
                    <button 
                      onClick={() => handleUseCoupon(uc.id!)}
                      className="w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                    >
                      Use Coupon
                    </button>
                  )}
                  {uc.status === 'USED' && (
                    <div className="w-full py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl text-center">
                      Used on {uc.usedAt ? format(uc.usedAt.toMillis(), 'MM.dd') : ''}
                    </div>
                  )}
                  {uc.status === 'EXPIRED' && (
                    <div className="w-full py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl text-center">
                      Expired
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* History Section */}
        <section className="pb-8">
          <h2 className="text-lg font-extrabold text-[#1E293B] mb-4 px-2 font-jakarta">Recent Activity</h2>
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-sm">
                No recent transactions.
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {transactions.map((t) => (
                  <div key={t.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        t.type === 'CHARGE' ? 'bg-emerald-50 text-emerald-600' :
                        t.type === 'PAYMENT' ? 'bg-blue-50 text-blue-600' :
                        'bg-slate-50 text-slate-600'
                      }`}>
                        <span className="material-symbols-outlined text-[20px]">
                          {t.type === 'CHARGE' ? 'add_card' : 
                           t.type === 'PAYMENT' ? 'shopping_cart' : 
                           t.type === 'COUPON_USE' ? 'confirmation_number' : 'swap_horiz'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{t.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{format(t.createdAt.toMillis(), 'MMM d, HH:mm')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black ${
                        t.type === 'CHARGE' || t.type === 'REFUND' ? 'text-emerald-600' : 'text-slate-800'
                      }`}>
                        {t.type === 'CHARGE' || t.type === 'REFUND' ? '+' : '-'}
                        ₩{t.amount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{t.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {transactions.length > 0 && (
              <button className="w-full py-4 bg-slate-50 text-slate-500 text-xs font-bold hover:text-slate-800 transition-colors">
                View All History
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
