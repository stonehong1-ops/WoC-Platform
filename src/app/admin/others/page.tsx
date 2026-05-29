"use client";

import { useState, useEffect } from 'react';
import { Coupon, UserCoupon, getActiveCoupons, getAllCouponIssuances, createCoupon, deleteCoupon } from '@/lib/firebase/couponService';

export default function AdminOthersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [allIssuances, setAllIssuances] = useState<Record<string, UserCoupon[]>>({});
  const [loading, setLoading] = useState(true);

  // Create form state
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<'FREE' | 'DISCOUNT'>('FREE');
  const [formDuration, setFormDuration] = useState(0);
  const [formQuantity, setFormQuantity] = useState(0);
  const [formDiscountValue, setFormDiscountValue] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const activeCoupons = await getActiveCoupons();
      setCoupons(activeCoupons);

      const activeIds = activeCoupons.map(c => c.id).filter(Boolean) as string[];
      if (activeIds.length > 0) {
        const issuances = await getAllCouponIssuances(activeIds);
        const grouped: Record<string, UserCoupon[]> = {};
        issuances.forEach(iss => {
          if (!grouped[iss.couponId]) grouped[iss.couponId] = [];
          grouped[iss.couponId].push(iss);
        });
        setAllIssuances(grouped);
      } else {
        setAllIssuances({});
      }
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleSave = async () => {
    if (!formTitle.trim() || !formLocation.trim() || formQuantity <= 0) {
      alert('Please fill in all required fields (Title, Venue, Quantity > 0).');
      return;
    }
    setSaving(true);
    try {
      await createCoupon({
        title: formTitle,
        location: formLocation,
        type: formType,
        discountValue: formType === 'DISCOUNT' ? formDiscountValue : undefined,
        duration: formDuration,
        totalQuantity: formQuantity,
        scope: 'GLOBAL',
      });
      // Reset form
      setFormTitle('');
      setFormLocation('');
      setFormType('FREE');
      setFormDuration(0);
      setFormQuantity(0);
      setFormDiscountValue(0);
      setShowCreate(false);
      fetchCoupons();
    } catch (err) {
      console.error("Failed to create coupon:", err);
      alert('Failed to create coupon. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to deactivate "${title}"?`)) return;
    try {
      await deleteCoupon(couponId);
      fetchCoupons();
    } catch (err) {
      console.error("Failed to delete coupon:", err);
      alert('Failed to deactivate coupon.');
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp?.toDate) return '-';
    const d = timestamp.toDate();
    return `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <style jsx global>{`
        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .custom-shadow {
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
        }
        .input-focus:focus {
          outline: none;
          border-color: #0057bd;
          box-shadow: 0 0 0 1px #0057bd;
        }
      `}</style>

      {/* Main Content Area */}
      <main className="pt-20 pb-12 px-4 bg-surface min-h-screen">
        <div className="max-w-[896px] mx-auto space-y-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
            <div>
              <h1 className="text-2xl font-black text-on-surface tracking-tight">Coupon Issuance Management</h1>
              <p className="text-xs text-outline mt-1">이벤트 입장 티켓 및 상점 할인 쿠폰을 발행하고 수령 현황을 관리합니다.</p>
            </div>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-md hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95 cursor-pointer">
              <span className="material-symbols-outlined text-lg font-bold">add</span>
              New Coupon
            </button>
          </div>

          {/* Bento-style Grid Layout for Coupon Cards */}
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="text-center py-20 text-outline flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Loading coupons...
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant bg-white border border-outline-variant/30 rounded-2xl p-8">
                <span className="material-symbols-outlined text-5xl mb-3 block text-outline opacity-40">confirmation_number</span>
                <p className="font-bold text-on-surface">No active coupons yet</p>
                <p className="text-xs text-outline mt-1">Click &quot;New Coupon&quot; to create one.</p>
              </div>
            ) : (
              coupons.map((coupon) => {
                const issuancesForThis = allIssuances[coupon.id!] || [];
                const isFree = coupon.type === 'FREE';

                return (
                  <div key={coupon.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all border border-outline-variant/30 flex flex-col md:flex-row gap-6 relative group">
                    <div className="flex-grow space-y-6">
                      <div>
                        <span className={`inline-block px-2.5 py-1 rounded-lg ${isFree ? 'bg-tertiary-container/10 text-on-tertiary-fixed-variant border border-tertiary-container/20' : 'bg-secondary-container/10 text-on-secondary-fixed-variant border border-secondary-container/20'} text-[10px] font-bold uppercase tracking-wider mb-2.5`}>
                          {isFree ? 'Event Ticket' : 'Discount Coupon'}
                        </span>
                        <h2 className="font-extrabold text-lg text-on-surface mb-1.5">{coupon.title}</h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-outline text-xs font-semibold">
                          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">{isFree ? 'festival' : 'store'}</span> {coupon.location}</span>
                          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">{isFree ? 'celebration' : 'payments'}</span> {isFree ? 'Free' : `${(coupon.discountValue || 0).toLocaleString()} Discount`}</span>
                          <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">calendar_today</span> {coupon.duration === 0 ? 'Permanent' : `${coupon.duration} Month`}</span>
                        </div>
                      </div>
                      
                      <div className="pt-5 border-t border-outline-variant/20">
                        <h3 className="text-[10px] font-extrabold text-outline uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">group</span>
                          Recipient List ({issuancesForThis.length})
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {issuancesForThis.length === 0 ? (
                            <div className="text-xs text-outline italic p-3 bg-surface-container-low/40 rounded-xl border border-outline-variant/10">No recipients yet</div>
                          ) : (
                            issuancesForThis.map((iss) => (
                              <div key={iss.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
                                <span className="text-xs font-bold text-on-surface">{iss.userName || 'Unknown'}</span>
                                <span className="text-[10px] text-outline font-medium">{formatDate(iss.issuedAt)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex md:flex-col items-center justify-between md:justify-center gap-4 md:border-l md:pl-6 border-outline-variant/20 md:min-w-[140px] shrink-0 bg-surface-container-low/30 p-4 rounded-xl md:bg-transparent md:p-0">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-1">Issuance Status</p>
                        <p className="text-xl font-black text-primary">{coupon.issuedCount} <span className="text-xs font-bold text-outline">/ {coupon.totalQuantity}</span></p>
                      </div>
                      <button 
                        onClick={() => handleDelete(coupon.id!, coupon.title)}
                        className="w-10 h-10 flex items-center justify-center bg-error-container/20 text-error rounded-xl hover:bg-error-container hover:text-on-error hover:shadow-lg transition-all active:scale-90 cursor-pointer"
                        title="쿠폰 비활성화"
                      >
                        <span className="material-symbols-outlined text-[20px] font-bold">close</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* ═══ Create New Coupon Full Popup ═══ */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] bg-surface overflow-y-auto">
          {/* TopAppBar */}
          <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 max-w-[896px] left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowCreate(false)} className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-surface-container transition-all active:scale-[0.98] cursor-pointer">
                <span className="material-symbols-outlined text-on-surface">close</span>
              </button>
              <h1 className="font-headline font-black text-on-surface text-lg tracking-tight">Create New Coupon</h1>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold text-xs hover:brightness-105 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md shadow-primary/10"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </header>

          {/* Main Content Canvas */}
          <main className="pt-24 pb-16 px-6 max-w-[896px] mx-auto space-y-6">
            {/* Card 1: Basic Info */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all">
              <h2 className="text-sm font-bold text-primary mb-5 flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">info</span>
                Basic Info
              </h2>
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-wider">Coupon Title</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-outline-variant" 
                    placeholder="e.g. Free Milonga Entry" 
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-wider">Venue / Event</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-outline-variant" 
                      placeholder="e.g. Gangnam Lucie" 
                      type="text"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Card 2: Category */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all">
              <h2 className="text-sm font-bold text-primary mb-5 flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">category</span>
                Category
              </h2>
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-outline uppercase tracking-wider">Type</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none cursor-pointer"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as 'FREE' | 'DISCOUNT')}
                    >
                      <option value="FREE">FREE</option>
                      <option value="DISCOUNT">D.C</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-outline">keyboard_arrow_down</span>
                  </div>
                </div>
                {formType === 'DISCOUNT' && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-outline uppercase tracking-wider">Discount Amount (KRW)</label>
                    <input 
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-outline-variant" 
                      placeholder="e.g. 20000" 
                      type="number"
                      value={formDiscountValue || ''}
                      onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* Card 3: Validity */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all">
              <h2 className="text-sm font-bold text-primary mb-5 flex items-center gap-2 uppercase tracking-wider">
                <span className="material-symbols-outlined text-lg">event_available</span>
                Validity
              </h2>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Validity Period</label>
                <div className="flex items-center gap-3">
                  <input 
                    className="w-32 px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all" 
                    type="number" 
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                  />
                  <span className="text-sm font-bold text-on-surface">Months</span>
                </div>
                <p className="mt-3 text-[10px] text-outline flex items-start gap-1.5 font-medium">
                  <span className="material-symbols-outlined text-sm mt-0.5 text-primary">info</span>
                  Entering 0 makes it permanently valid, 1 or more is valid for that many months after issuance.
                </p>
              </div>
            </section>

            {/* Card 4: Quantity */}
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-outline-variant/20 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-primary flex items-center gap-2 uppercase tracking-wider">
                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                  Quantity
                </h2>
                <span className="bg-secondary/10 border border-secondary/20 text-secondary px-3 py-1 rounded-xl text-[10px] font-bold">FCFS</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-outline uppercase tracking-wider">Issuance Quantity (First come, first served)</label>
                <div className="relative group">
                  <input 
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/60 rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary focus:bg-white focus:outline-none transition-all placeholder:text-outline-variant" 
                    placeholder="Set limit" 
                    type="number"
                    value={formQuantity || ''}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <button onClick={() => setFormQuantity(Math.max(0, formQuantity - 1))} className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant"><span className="material-symbols-outlined text-base">remove</span></button>
                    <button onClick={() => setFormQuantity(formQuantity + 1)} className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant"><span className="material-symbols-outlined text-base">add</span></button>
                  </div>
                </div>
              </div>
            </section>

            {/* Decorative / Functional Footer Area */}
            <div className="pt-4 flex flex-col items-center gap-4">
              <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full"></div>
              <p className="text-[10px] text-outline font-bold uppercase tracking-wider">All fields are required before saving</p>

              {/* Preview Section */}
              <div className="w-full mt-8 bg-gradient-to-br from-primary to-secondary p-8 rounded-[24px] text-on-primary overflow-hidden relative shadow-lg">
                <div className="absolute -right-12 -bottom-12 opacity-10">
                  <span className="material-symbols-outlined text-[200px]">confirmation_number</span>
                </div>
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-on-primary/80">Live Preview</span>
                      <h3 className="text-xl font-black leading-tight tracking-tight">{formTitle || 'Your Coupon Title'}</h3>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-bold border border-white/5">
                      {formDuration === 0 ? 'Permanent' : `Valid for ${formDuration} Months`}
                    </div>
                    <div className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-bold border border-white/5">
                      {formType === 'FREE' ? 'Free Entry' : `${(formDiscountValue || 0).toLocaleString()} KRW Off`}
                    </div>
                    <div className="px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-bold border border-white/5">
                      {formQuantity || 0} pcs
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      )}
    </>
  );
}
