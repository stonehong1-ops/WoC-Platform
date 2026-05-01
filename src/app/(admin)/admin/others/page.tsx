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
      <main className="pt-20 pb-12 px-6">
        <div className="max-w-[896px] mx-auto space-y-10">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="font-headline-lg text-on-surface">Coupon Issuance Management</h1>
            <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-container text-on-primary-container rounded-lg font-title-md shadow-md hover:shadow-xl hover:scale-[1.02] transition-all active:scale-95">
              <span className="material-symbols-outlined text-xl">add</span>
              New Coupon
            </button>
          </div>

          {/* Bento-style Grid Layout for Coupon Cards */}
          <div className="grid grid-cols-1 gap-6">
            {loading ? (
              <div className="text-center py-20 text-on-surface-variant">Loading coupons...</div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-20 text-on-surface-variant">
                <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">confirmation_number</span>
                <p className="font-title-md">No active coupons yet</p>
                <p className="text-sm mt-1">Click &quot;New Coupon&quot; to create one.</p>
              </div>
            ) : (
              coupons.map((coupon) => {
                const issuancesForThis = allIssuances[coupon.id!] || [];
                const isFree = coupon.type === 'FREE';

                return (
                  <div key={coupon.id} className="bg-surface-container-lowest p-6 rounded-[12px] shadow-sm hover:shadow-md transition-all border border-outline-variant/30 flex flex-col md:flex-row gap-6 relative group">
                    <div className="flex-1 space-y-4">
                      <div>
                        <span className={`inline-block px-2 py-1 rounded ${isFree ? 'bg-tertiary-container/10 text-on-tertiary-fixed-variant' : 'bg-secondary-container/10 text-on-secondary-fixed-variant'} text-[10px] font-bold uppercase tracking-wider mb-2`}>
                          {isFree ? 'Event Ticket' : 'Discount Coupon'}
                        </span>
                        <h2 className="font-title-md text-on-surface mb-1">{coupon.title}</h2>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-on-surface-variant text-sm">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">{isFree ? 'festival' : 'store'}</span> {coupon.location}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">{isFree ? 'celebration' : 'payments'}</span> {isFree ? 'Free' : `${(coupon.discountValue || 0).toLocaleString()} Discount`}</span>
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm">calendar_today</span> {coupon.duration === 0 ? 'Permanent' : `${coupon.duration} Month`}</span>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">group</span>
                          Recipient List
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {issuancesForThis.length === 0 ? (
                            <div className="text-sm text-on-surface-variant italic p-3">No recipients yet</div>
                          ) : (
                            issuancesForThis.map((iss) => (
                              <div key={iss.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-lg border border-transparent hover:border-outline-variant transition-colors">
                                <span className="font-body-md text-on-surface">{iss.userName || 'Unknown'}</span>
                                <span className="text-xs text-slate-500">{formatDate(iss.issuedAt)}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex md:flex-col items-center justify-between md:justify-center gap-4 md:border-l md:pl-6 border-slate-100 md:min-w-[120px]">
                      <div className="text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">Issuance</p>
                        <p className="text-xl font-black text-on-surface">{coupon.issuedCount} / {coupon.totalQuantity}</p>
                      </div>
                      <button 
                        onClick={() => handleDelete(coupon.id!, coupon.title)}
                        className="w-10 h-10 flex items-center justify-center bg-error-container text-on-error-container rounded-full hover:shadow-lg transition-shadow active:scale-90"
                      >
                        <span className="material-symbols-outlined">close</span>
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
        <div className="fixed inset-0 z-[100] bg-[#F3F4F6] overflow-y-auto">
          {/* TopAppBar */}
          <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-4 max-w-[896px] left-1/2 -translate-x-1/2 bg-slate-50 shadow-sm border-b border-slate-200">
            <div className="flex items-center gap-4">
              <button onClick={() => setShowCreate(false)} className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-slate-100 transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-slate-900">close</span>
              </button>
              <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-slate-900 text-xl">Create New Coupon</h1>
            </div>
            <button 
              onClick={handleSave}
              disabled={saving}
              className="bg-primary-container text-white px-6 py-2 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </header>

          {/* Main Content Canvas */}
          <main className="pt-24 pb-12 px-6 max-w-[896px] mx-auto space-y-6">
            {/* Card 1: Basic Info */}
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
              <h2 className="font-title-md text-title-md text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">info</span>
                Basic Info
              </h2>
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Coupon Title</label>
                  <input 
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md input-focus transition-all" 
                    placeholder="e.g. Free Milonga Entry" 
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Venue / Event</label>
                  <div className="relative">
                    <input 
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md input-focus transition-all" 
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
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
              <h2 className="font-title-md text-title-md text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">category</span>
                Category
              </h2>
              <div className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant">Type</label>
                  <div className="relative">
                    <select 
                      className="w-full appearance-none px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md input-focus transition-all cursor-pointer"
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
                    <label className="font-label-sm text-label-sm text-on-surface-variant">Discount Amount (KRW)</label>
                    <input 
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md input-focus transition-all" 
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
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
              <h2 className="font-title-md text-title-md text-primary mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">event_available</span>
                Validity
              </h2>
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Validity Period</label>
                <div className="flex items-center gap-3">
                  <input 
                    className="w-32 px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md input-focus transition-all" 
                    type="number" 
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                  />
                  <span className="font-body-md text-on-surface">Months</span>
                </div>
                <p className="mt-2 text-label-sm text-outline flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-sm mt-0.5">help</span>
                  Entering 0 makes it permanently valid, 1 or more is valid for that many months after issuance.
                </p>
              </div>
            </section>

            {/* Card 4: Quantity */}
            <section className="bg-surface-container-lowest p-6 rounded-xl shadow-sm border border-outline-variant/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-title-md text-title-md text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">inventory_2</span>
                  Quantity
                </h2>
                <span className="bg-secondary-container/20 text-secondary px-3 py-1 rounded-full text-label-xs">FCFS</span>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-sm text-label-sm text-on-surface-variant">Issuance Quantity (First come, first served)</label>
                <div className="relative group">
                  <input 
                    className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg font-body-md text-body-md input-focus transition-all" 
                    placeholder="Set limit" 
                    type="number"
                    value={formQuantity || ''}
                    onChange={(e) => setFormQuantity(Number(e.target.value))}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                    <button onClick={() => setFormQuantity(Math.max(0, formQuantity - 1))} className="p-1 hover:bg-surface-variant rounded text-on-surface-variant"><span className="material-symbols-outlined text-base">remove</span></button>
                    <button onClick={() => setFormQuantity(formQuantity + 1)} className="p-1 hover:bg-surface-variant rounded text-on-surface-variant"><span className="material-symbols-outlined text-base">add</span></button>
                  </div>
                </div>
              </div>
            </section>

            {/* Decorative / Functional Footer Area */}
            <div className="pt-4 flex flex-col items-center gap-4">
              <div className="w-12 h-1.5 bg-outline-variant/40 rounded-full"></div>
              <p className="font-label-sm text-label-sm text-outline">All fields are required before saving</p>

              {/* Preview Section */}
              <div className="w-full mt-8 bg-gradient-to-br from-primary to-secondary p-8 rounded-[32px] text-white overflow-hidden relative shadow-xl">
                <div className="absolute -right-12 -bottom-12 opacity-10">
                  <span className="material-symbols-outlined text-[200px]">confirmation_number</span>
                </div>
                <div className="relative z-10 flex flex-col gap-6">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1">
                      <span className="font-label-xs uppercase tracking-widest text-on-primary-container/80">Live Preview</span>
                      <h3 className="font-headline-lg text-headline-lg leading-tight">{formTitle || 'Your Coupon Title'}</h3>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                      <span className="material-symbols-outlined text-3xl">qr_code_2</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full font-label-sm border border-white/10">
                      {formDuration === 0 ? 'Permanent' : `Valid for ${formDuration} Months`}
                    </div>
                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full font-label-sm border border-white/10">
                      {formType === 'FREE' ? 'Free Entry' : `${(formDiscountValue || 0).toLocaleString()} KRW Off`}
                    </div>
                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full font-label-sm border border-white/10">
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
