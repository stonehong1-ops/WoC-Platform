"use client";

import React, { useState } from "react";

const MOCK_EVENTS = [
  {
    id: "1", title: "Summer Dance Festival 2026", date: "Jun 15", venue: "Grand Hall", tickets: [
      { id: "t1", name: "General Admission", price: 25, remaining: 142, total: 200, type: "general" },
      { id: "t2", name: "VIP Experience", price: 75, remaining: 18, total: 30, type: "vip" },
      { id: "t3", name: "Early Bird", price: 15, remaining: 0, total: 50, type: "earlybird" },
      { id: "t4", name: "Member Only", price: 20, remaining: 35, total: 50, type: "member" },
    ]
  },
  {
    id: "2", title: "Weekend Workshop: Hip Hop Basics", date: "Jun 22", venue: "Studio A", tickets: [
      { id: "t5", name: "Standard", price: 40, remaining: 8, total: 20, type: "general" },
      { id: "t6", name: "Free Pass (Members)", price: 0, remaining: 5, total: 10, type: "free" },
    ]
  },
];

const TYPE_STYLE: Record<string, { bg: string; text: string }> = {
  general: { bg: "bg-primary/10", text: "text-primary" },
  vip: { bg: "bg-amber-500/10", text: "text-amber-600" },
  earlybird: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  member: { bg: "bg-secondary-container/30", text: "text-on-secondary-container" },
  free: { bg: "bg-outline/10", text: "text-on-surface-variant" },
};

export default function TicketBooking() {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const event = MOCK_EVENTS.find(e => e.id === selectedEvent);

  if (event) {
    const total = event.tickets.reduce((s, t) => s + (quantities[t.id] || 0) * t.price, 0);
    return (
      <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
        <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1 text-[13px] text-primary font-semibold">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>Back to Events
        </button>
        <div className="bg-surface-container rounded-2xl p-5 border border-outline/5">
          <h2 className="text-[20px] font-bold text-on-surface">{event.title}</h2>
          <p className="text-[13px] text-on-surface-variant mt-1">{event.date} · {event.venue}</p>
        </div>

        <div className="space-y-3">
          {event.tickets.map(t => {
            const ts = TYPE_STYLE[t.type] || TYPE_STYLE.general;
            const qty = quantities[t.id] || 0;
            const soldOut = t.remaining === 0;
            return (
              <div key={t.id} className={`bg-surface-container rounded-2xl p-4 border border-outline/5 ${soldOut ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold text-on-surface">{t.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${ts.bg} ${ts.text}`}>{t.type}</span>
                    </div>
                    <p className="text-[12px] text-on-surface-variant mt-0.5">{t.remaining}/{t.total} remaining</p>
                  </div>
                  <p className="text-[20px] font-bold text-on-surface">{t.price === 0 ? "FREE" : `$${t.price}`}</p>
                </div>
                <div className="w-full h-1.5 rounded-full bg-outline/10 overflow-hidden mb-3">
                  <div className={`h-full rounded-full ${t.remaining < 10 ? "bg-error" : "bg-primary"}`} style={{ width: `${((t.total - t.remaining) / t.total) * 100}%` }} />
                </div>
                {!soldOut ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 bg-surface rounded-xl border border-outline/10 px-1">
                      <button onClick={() => setQuantities(q => ({ ...q, [t.id]: Math.max(0, (q[t.id] || 0) - 1) }))} className="w-8 h-8 flex items-center justify-center text-on-surface-variant"><span className="material-symbols-outlined text-[18px]">remove</span></button>
                      <span className="text-[16px] font-bold text-on-surface w-6 text-center">{qty}</span>
                      <button onClick={() => setQuantities(q => ({ ...q, [t.id]: Math.min(t.remaining, (q[t.id] || 0) + 1) }))} className="w-8 h-8 flex items-center justify-center text-primary"><span className="material-symbols-outlined text-[18px]">add</span></button>
                    </div>
                    {qty > 0 && <span className="text-[14px] font-bold text-primary">${qty * t.price}</span>}
                  </div>
                ) : (
                  <span className="text-[12px] font-bold text-error">SOLD OUT</span>
                )}
              </div>
            );
          })}
        </div>

        {total > 0 && (
          <div className="bg-primary rounded-2xl p-4 text-on-primary flex items-center justify-between">
            <div>
              <p className="text-[12px] opacity-80">Total</p>
              <p className="text-[24px] font-bold">${total}</p>
            </div>
            <button className="bg-on-primary text-primary px-6 py-3 rounded-xl font-bold text-[14px]">Purchase Tickets</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-on-surface">Ticket Booking</h2>
          <p className="text-[13px] text-on-surface-variant mt-0.5">Purchase event tickets & manage bookings</p>
        </div>
      </div>
      <div className="space-y-3">
        {MOCK_EVENTS.map(ev => (
          <div key={ev.id} onClick={() => { setSelectedEvent(ev.id); setQuantities({}); }} className="bg-surface-container rounded-2xl p-5 border border-outline/5 cursor-pointer hover:shadow-md transition-all">
            <h3 className="text-[16px] font-bold text-on-surface">{ev.title}</h3>
            <p className="text-[12px] text-on-surface-variant mt-1">{ev.date} · {ev.venue}</p>
            <div className="flex gap-2 mt-3">
              {ev.tickets.map(t => {
                const ts = TYPE_STYLE[t.type] || TYPE_STYLE.general;
                return <span key={t.id} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ts.bg} ${ts.text}`}>{t.price === 0 ? "FREE" : `$${t.price}`}</span>;
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
