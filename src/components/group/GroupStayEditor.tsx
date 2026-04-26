"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, StaySettings, StayRoom } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";
import GroupStayRoomEditor from "./GroupStayRoomEditor";
import ImageWithFallback from "@/components/common/ImageWithFallback";

interface GroupStayEditorProps {
  group: Group;
}

const GroupStayEditor: React.FC<GroupStayEditorProps> = ({ group }) => {
  const [activeTab, setActiveTab] = useState<"Rooms" | "Settings">("Rooms");
  const [activeSubEditor, setActiveSubEditor] = useState<string | null>(null);
  const [editingRoom, setEditingRoom] = useState<StayRoom | undefined>(undefined);
  
  const [settings, setSettings] = useState<StaySettings>(
    group.staySettings || {
      frequency: "daily",
      minStay: 1,
      currency: "USD",
      baseAmount: 0,
      paymentMethod: "bank_transfer",
      bankDetails: {
        bankName: "",
        ownerName: "",
        accountNumber: "",
        swiftCode: "",
        additionalDetails: "",
      },
    }
  );

  const [isUpdating, setIsUpdating] = useState(false);

  const stayRooms: StayRoom[] = group.stayRooms || [];

  const handleSaveSettings = async () => {
    try {
      setIsUpdating(true);
      await groupService.updateGroupMetadata(group.id, {
        staySettings: settings,
      });
      toast.success("Stay Settings saved successfully.");
    } catch (error) {
      console.error("Error saving stay settings:", error);
      toast.error("Failed to save stay settings.");
    } finally {
      setIsUpdating(false);
    }
  };

  const updateBankDetail = (field: keyof Required<StaySettings>["bankDetails"], value: string) => {
    setSettings((prev) => ({
      ...prev,
      bankDetails: {
        ...(prev.bankDetails || {
          bankName: "",
          ownerName: "",
          accountNumber: "",
          swiftCode: "",
          additionalDetails: "",
        }),
        [field]: value,
      },
    }));
  };

  const handleToggleRoomStatus = async (room: StayRoom, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    
    const newStatus = room.status === "Active" ? "Stopped" : "Active";
    const promise = (async () => {
      const updatedRooms = stayRooms.map(sr => 
        sr.id === room.id ? { ...sr, status: newStatus } : sr
      );
      
      await groupService.updateGroupMetadata(group.id, {
        stayRooms: updatedRooms
      } as any);
    })();

    toast.promise(promise, {
      loading: "Updating status...",
      success: newStatus === "Active" ? "Room is now active." : "Room stopped.",
      error: "Failed to update status."
    });

    try {
      await promise;
    } catch (error) {
      console.error("Error updating room status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditRoom = (room: StayRoom) => {
    setEditingRoom(room);
    setActiveSubEditor("stay-room-editor");
  };

  return (
    <div className="bg-[#F1F5F9] text-[#242c51] antialiased pb-20 min-h-[max(884px,100dvh)] font-['Inter']">
      {/* TopAppBar */}
      <header className="border-b border-slate-100 px-6 py-5 sticky top-0 z-40 bg-slate-50">
        <div className="max-w-3xl mx-auto flex items-center relative">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight font-['Plus_Jakarta_Sans']">Stay Management</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Top Segmented Control */}
        <div className="bg-slate-200/50 p-1 rounded-xl flex items-center justify-between shadow-inner mb-6">
          <button 
            onClick={() => setActiveTab("Rooms")}
            className={`flex-1 py-2 px-4 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-sm transition-all text-center ${
              activeTab === "Rooms" 
                ? "bg-[#ffffff] text-[#0057bd] shadow-sm" 
                : "text-slate-500 font-semibold hover:text-slate-700"
            }`}
          >
            Rooms
          </button>
          <button 
            onClick={() => setActiveTab("Settings")}
            className={`flex-1 py-2 px-4 rounded-lg font-['Plus_Jakarta_Sans'] font-bold text-sm transition-all text-center ${
              activeTab === "Settings" 
                ? "bg-[#ffffff] text-[#0057bd] shadow-sm" 
                : "text-slate-500 font-semibold hover:text-slate-700"
            }`}
          >
            Settings
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "Rooms" ? (
            <motion.div 
              key="rooms-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Primary Action Button */}
              <button 
                onClick={() => {
                  setEditingRoom(undefined);
                  setActiveSubEditor("stay-room-editor");
                }}
                className="w-full bg-[#0057bd] text-white font-['Plus_Jakarta_Sans'] font-bold py-3.5 px-6 rounded-xl shadow-md shadow-[#0057bd]/20 flex items-center justify-center gap-2 hover:bg-[#004ca6] transition-colors active:scale-[0.99]"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Room
              </button>

              {/* Room List */}
              <div className="space-y-4">
                {stayRooms.map((room) => (
                  <article 
                    key={room.id}
                    onClick={() => handleEditRoom(room)}
                    className={`bg-[#ffffff] rounded-xl p-4 shadow-sm border border-[#a3abd7]/10 flex gap-4 active:scale-[0.99] transition-transform cursor-pointer ${
                      room.status === 'Stopped' ? 'opacity-75' : ''
                    }`}
                  >
                    <div className={`w-24 h-24 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 ${room.status === 'Stopped' ? 'grayscale' : ''}`}>
                      {room.images?.[0] ? (
                        <ImageWithFallback 
                          alt={room.title} 
                          className="w-full h-full object-cover" 
                          src={room.images[0]} 
                          fallbackType="gallery"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined text-4xl">bed</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                          room.status === 'Active' 
                            ? 'text-[#0057bd] bg-[#6e9fff]/20' 
                            : 'text-slate-500 bg-slate-200'
                        }`}>
                          {room.roomType || "Room"}
                        </span>
                        <h3 className={`font-['Plus_Jakarta_Sans'] font-extrabold text-base leading-tight ${
                          room.status === 'Active' ? 'text-[#242c51]' : 'text-slate-500'
                        }`}>
                          {room.title}
                        </h3>
                        <p className={`text-xs font-medium mt-0.5 line-clamp-1 ${
                          room.status === 'Active' ? 'text-[#515981]' : 'text-slate-400'
                        }`}>
                          Capacity: {room.capacity} {room.capacity === 1 ? 'Guest' : 'Guests'}
                        </p>
                      </div>
                      <div className="flex items-end justify-between mt-2">
                        <div className="flex items-center gap-2">
                          {room.discountPrice ? (
                            <>
                              <span className={`font-['Plus_Jakarta_Sans'] font-bold text-lg ${
                                room.status === 'Active' ? 'text-red-600' : 'text-slate-400'
                              }`}>
                                {settings.currency === 'KRW' ? '₩' : settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : ''}{room.discountPrice.toLocaleString()}
                              </span>
                              <span className="font-['Plus_Jakarta_Sans'] font-medium text-xs text-slate-400 line-through">
                                {settings.currency === 'KRW' ? '₩' : settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : ''}{room.price?.toLocaleString()}
                              </span>
                            </>
                          ) : (
                            <span className={`font-['Plus_Jakarta_Sans'] font-bold text-lg ${
                              room.status === 'Active' ? 'text-[#0057bd]' : 'text-slate-400'
                            }`}>
                              {settings.currency === 'KRW' ? '₩' : settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : ''}{room.price?.toLocaleString()}
                            </span>
                          )}
                          <span className="text-xs text-slate-400 font-medium ml-1">/ {settings.frequency === 'monthly' ? 'mo' : settings.frequency === 'weekly' ? 'wk' : 'night'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${
                            room.status === 'Active' ? 'text-green-600' : 'text-slate-400'
                          }`}>
                            {room.status === 'Active' ? 'Active' : 'Stopped'}
                          </span>
                          {/* Toggle */}
                          <div 
                            onClick={(e) => handleToggleRoomStatus(room, e)}
                            className={`w-10 h-5 rounded-full relative cursor-pointer shadow-inner transition-colors ${
                              room.status === 'Active' ? 'bg-[#0057bd]' : 'bg-slate-300'
                            }`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform ${
                              room.status === 'Active' ? 'right-0.5' : 'left-0.5'
                            }`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
                
                {stayRooms.length === 0 && (
                  <div className="py-12 text-center bg-white rounded-xl shadow-sm border border-slate-100">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">hotel</span>
                    <p className="text-slate-500 font-medium text-sm">
                      No rooms registered yet.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="settings-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="mb-4">
                <p className="font-body text-[var(--on-surface-variant)] text-sm">Configure global pricing rules, booking criteria, and payment methods for all stays.</p>
              </div>

              {/* Section 1: Booking Criteria */}
              <section className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[#0057bd]" data-icon="calendar_month">calendar_month</span>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-slate-900">Booking Criteria</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Frequency</label>
                    <div className="relative">
                      <select 
                        value={settings.frequency}
                        onChange={(e) => setSettings({ ...settings, frequency: e.target.value as any })}
                        className="w-full bg-slate-50 appearance-none border border-slate-200 rounded-lg px-4 py-3 font-['Inter'] text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm" data-icon="expand_more">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Minimum Stay</label>
                    <div className="relative">
                      <input 
                        value={settings.minStay}
                        onChange={(e) => setSettings({ ...settings, minStay: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50 appearance-none border border-slate-200 rounded-lg px-4 py-3 font-['Inter'] text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow" 
                        placeholder="e.g., 2" 
                        type="number"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none font-medium">Nights</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Pricing */}
              <section className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[#0057bd]" data-icon="payments">payments</span>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-slate-900">Global Pricing Setting</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 md:col-span-1">
                    <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Currency</label>
                    <div className="relative">
                      <select 
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full bg-slate-50 appearance-none border border-slate-200 rounded-lg px-4 py-3 font-['Inter'] text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="JPY">JPY (¥)</option>
                        <option value="KRW">KRW (₩)</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-sm" data-icon="expand_more">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Base Amount (Default)</label>
                    <input 
                      value={settings.baseAmount}
                      onChange={(e) => setSettings({ ...settings, baseAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 font-['Inter'] text-[13px] font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0057bd]/50 transition-shadow" 
                      placeholder="0.00" 
                      type="number"
                    />
                  </div>
                </div>
              </section>

              {/* Section 3: Payment Method */}
              <section className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[#0057bd]" data-icon="account_balance">account_balance</span>
                  <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-slate-900">Payment Method</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Enabled Option */}
                  <label className="relative cursor-pointer group">
                    <input 
                      checked={settings.paymentMethod === "bank_transfer"} 
                      onChange={() => setSettings({ ...settings, paymentMethod: "bank_transfer" })}
                      className="peer sr-only" 
                      name="payment_method" 
                      type="radio" 
                      value="bank_transfer"
                    />
                    <div className="w-full p-4 border-2 border-slate-200 rounded-xl peer-checked:border-[#0057bd] peer-checked:bg-[#0057bd]/5 hover:bg-slate-50 transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-900" data-icon="account_balance_wallet">account_balance_wallet</span>
                          <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-slate-900">Bank Transfer</span>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-300 peer-checked:border-[#0057bd] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#0057bd] scale-0 peer-checked:scale-100 transition-transform"></div>
                        </div>
                      </div>
                      <p className="font-['Inter'] text-[13px] text-slate-500 mt-1">Direct transfer to designated accounts.</p>
                      <div className="mt-3 inline-block px-2 py-1 bg-blue-100/50 rounded-full font-['Inter'] font-bold text-[10px] text-blue-700 uppercase tracking-wide">
                        Default
                      </div>
                    </div>
                  </label>
                  {/* Disabled Option */}
                  <label className="relative cursor-not-allowed opacity-60">
                    <input disabled className="peer sr-only" name="payment_method" type="radio" value="credit_card"/>
                    <div className="w-full p-4 border-2 border-slate-200/50 bg-slate-50 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-slate-400" data-icon="credit_card">credit_card</span>
                          <span className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-slate-400">Credit Card</span>
                        </div>
                        <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>
                      </div>
                      <p className="font-['Inter'] text-[13px] text-slate-400 mt-1">Secure online card processing.</p>
                      <div className="mt-3 inline-block px-2 py-1 bg-slate-200 rounded-full font-['Inter'] font-bold text-[10px] text-slate-500 uppercase tracking-wide">
                        Coming Soon
                      </div>
                    </div>
                  </label>
                </div>
              </section>

              {/* Section 4: Bank Account Details */}
              {settings.paymentMethod === "bank_transfer" && (
                <section className="bg-white rounded-xl shadow-sm p-6 border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-6">
                    <span className="material-symbols-outlined text-[#0057bd]" data-icon="receipt_long">receipt_long</span>
                    <h3 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-slate-900">Bank Account Details</h3>
                  </div>
                  <div className="space-y-8">
                    {/* Domestic Transfer */}
                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-200/50">
                      <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Domestic Transfer
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Bank Name</label>
                          <input 
                            value={settings.bankDetails?.bankName || ""}
                            onChange={(e) => updateBankDetail("bankName", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 font-['Inter'] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" 
                            placeholder="e.g., Chase Bank" 
                            type="text"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Account Owner Name</label>
                          <input 
                            value={settings.bankDetails?.ownerName || ""}
                            onChange={(e) => updateBankDetail("ownerName", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 font-['Inter'] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" 
                            placeholder="Full Legal Name" 
                            type="text"
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Account Number</label>
                          <input 
                            value={settings.bankDetails?.accountNumber || ""}
                            onChange={(e) => updateBankDetail("accountNumber", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 font-['Inter'] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" 
                            placeholder="Routing & Account No." 
                            type="text"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Overseas Transfer */}
                    <div className="bg-slate-50 rounded-lg p-5 border border-slate-200/50">
                      <h4 className="font-['Plus_Jakarta_Sans'] font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Overseas Transfer (Wise)
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-1">
                          <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">IBAN / SWIFT Code</label>
                          <input 
                            value={settings.bankDetails?.swiftCode || ""}
                            onChange={(e) => updateBankDetail("swiftCode", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 font-['Inter'] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow" 
                            placeholder="Enter valid SWIFT/BIC" 
                            type="text"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="font-['Inter'] font-bold text-[11px] uppercase tracking-wider text-slate-500 block">Additional Account Details</label>
                          <textarea 
                            value={settings.bankDetails?.additionalDetails || ""}
                            onChange={(e) => updateBankDetail("additionalDetails", e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-md px-3 py-2 font-['Inter'] text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#0057bd] transition-shadow resize-none" 
                            placeholder="Sort code, branch address, etc." 
                            rows={3}
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Prominent Full-Width Action Button */}
              <div className="pt-4">
                <button 
                  onClick={handleSaveSettings}
                  disabled={isUpdating}
                  className="w-full bg-[#0057bd] text-white py-4 rounded-xl font-['Plus_Jakarta_Sans'] font-bold text-base hover:bg-[#004ca6] transition-all shadow-lg shadow-[#0057bd]/25 active:scale-[0.98] duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? "Saving..." : "Save Stay Settings"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {activeSubEditor === "stay-room-editor" && (
          <GroupStayRoomEditor 
            group={group} 
            onClose={() => setActiveSubEditor(null)} 
            room={editingRoom}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroupStayEditor;
