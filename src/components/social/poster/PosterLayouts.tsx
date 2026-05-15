"use client";
import React from "react";
import { PosterData } from "./posterTypes";

/* --- shared helpers --- */
const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold ${className}`}>{children}</p>
);
const Sep = () => <div className="w-6 h-[1px] bg-white/30 my-1" />;

/* --- Street Grunge helpers --- */
const SLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[10px] uppercase font-black bg-yellow-400 text-black px-1.5 py-0.5 inline-block ${className}`}>{children}</p>
);

const PaperCutout = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white text-black p-1 shadow-[4px_4px_0_rgba(0,0,0,0.3)] transform -rotate-1 ${className}`}>{children}</div>
);

/* --- T0: None --- */
const LayoutNone = () => <></>;

/* --- T1: Classic (sample 1) --- */
const LayoutClassic = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
    {/* Title top-left */}
    <div className="absolute top-[12%] left-[7%] max-w-[65%]">
      <h1 className="text-[42px] font-black leading-[1.05] text-white tracking-tight drop-shadow-lg" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
        {d.title}
      </h1>
    </div>
    {/* Date top-right */}
    <div className="absolute top-[12%] right-[7%] text-right text-white">
      <p className="text-[28px] font-black leading-none">
        {d.dateStr} <span className="text-[18px] font-bold">{d.dayStr}</span>
      </p>
      <p className="text-[14px] font-medium mt-1 text-white/80">{d.timeStr}</p>
    </div>
    {/* DJ bottom-left */}
    {d.djName && (
      <div className="absolute bottom-[22%] left-[7%]">
        <Label>DJ</Label>
        <Sep />
        <p className="text-[32px] font-black text-white leading-tight">{d.djName}</p>
      </div>
    )}
    {/* Bottom info grid */}
    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm border-t border-white/10">
      <div className="grid grid-cols-3 divide-x divide-white/10 px-4 py-4">
        <div className="pr-3">
          <Label>ORG.</Label><Sep />
          <p className="text-[14px] font-bold text-white">{d.orgName}</p>
          {d.orgPhone && <p className="text-[11px] text-white/50 mt-0.5">{d.orgPhone}</p>}
        </div>
        <div className="px-3">
          <Label>FEE</Label><Sep />
          <p className="text-[14px] font-bold text-white">{d.fee || "Free"}</p>
        </div>
        <div className="pl-3">
          <Label>VENUE</Label><Sep />
          <p className="text-[14px] font-bold text-white leading-tight">{d.venueName}</p>
          {d.venueLocation && <p className="text-[10px] text-white/50 mt-0.5">{d.venueLocation}</p>}
        </div>
      </div>
    </div>
  </>
);

/* --- T2: Center Stage --- */
const LayoutCenter = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black/40" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-6">
      <p className="text-[13px] tracking-[0.4em] uppercase font-bold text-white/60 mb-3">MILONGA</p>
      <h1 className="text-[48px] font-black leading-[1] tracking-tight">{d.title}</h1>
      <div className="w-12 h-[2px] bg-white/40 my-4" />
      <p className="text-[20px] font-bold">{d.dateStr} <span className="text-white/60">{d.dayStr}</span></p>
      <p className="text-[14px] text-white/70 mt-1">{d.timeStr}</p>
      {d.djName && <p className="text-[16px] font-bold mt-4">DJ {d.djName}</p>}
    </div>
    <div className="absolute bottom-0 left-0 right-0 text-center py-4 bg-gradient-to-t from-black/80 to-transparent">
      <p className="text-[12px] text-white/60">{d.venueName}{d.venueLocation ? ` • ${d.venueLocation}` : ""}</p>
      {d.fee && <p className="text-[11px] text-white/40 mt-1">{d.fee}</p>}
    </div>
  </>
);

/* --- T3: Bottom Heavy --- */
const LayoutBottom = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
    <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 text-white">
      <h1 className="text-[40px] font-black leading-[1.05] tracking-tight mb-2">{d.title}</h1>
      <div className="flex items-center gap-3 text-[14px] font-bold mb-3">
        <span>{d.dateStr} {d.dayStr}</span>
        <span className="w-1 h-1 rounded-full bg-white/40" />
        <span className="text-white/70">{d.timeStr}</span>
      </div>
      {d.djName && (
        <div className="mb-3">
          <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">DJ</span>
          <p className="text-[22px] font-black">{d.djName}</p>
        </div>
      )}
      <div className="border-t border-white/15 pt-3 flex justify-between text-[11px]">
        <div><Label>VENUE</Label><p className="font-bold text-white mt-1">{d.venueName}</p></div>
        <div className="text-right"><Label>ORG</Label><p className="font-bold text-white mt-1">{d.orgName}</p></div>
        {d.fee && <div className="text-right"><Label>FEE</Label><p className="font-bold text-white mt-1">{d.fee}</p></div>}
      </div>
    </div>
  </>
);

/* --- T4: Minimal --- */
const LayoutMinimal = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute top-[8%] left-[7%]">
      <p className="text-[13px] tracking-[0.3em] uppercase font-bold text-white/80">{d.dateStr} {d.dayStr}</p>
    </div>
    <div className="absolute bottom-[6%] left-[7%] right-[7%]">
      <h1 className="text-[36px] font-black text-white leading-[1.05] tracking-tight drop-shadow-lg">{d.title}</h1>
      <p className="text-[12px] text-white/60 mt-2 font-medium">{d.timeStr} • {d.venueName}</p>
    </div>
  </>
);

/* --- T5: Left Panel --- */
const LayoutLeftPanel = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute top-0 left-0 bottom-0 w-[42%] bg-black/75 flex flex-col justify-between p-5 text-white">
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold mb-2">MILONGA</p>
        <h1 className="text-[28px] font-black leading-[1.1] tracking-tight">{d.title}</h1>
      </div>
      <div className="space-y-4">
        <div><Label>DATE</Label><p className="text-[14px] font-bold mt-1">{d.dateStr} {d.dayStr}</p><p className="text-[12px] text-white/60">{d.timeStr}</p></div>
        {d.djName && <div><Label>DJ</Label><p className="text-[14px] font-bold mt-1">{d.djName}</p></div>}
        <div><Label>VENUE</Label><p className="text-[14px] font-bold mt-1">{d.venueName}</p></div>
        <div><Label>ORG</Label><p className="text-[12px] font-bold mt-1">{d.orgName}</p></div>
        {d.fee && <div><Label>FEE</Label><p className="text-[12px] font-bold mt-1">{d.fee}</p></div>}
      </div>
    </div>
  </>
);

/* --- T6: Right Panel --- */
const LayoutRightPanel = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute top-0 right-0 bottom-0 w-[42%] bg-black/75 flex flex-col justify-between p-5 text-white text-right">
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-white/50 font-bold mb-2">MILONGA</p>
        <h1 className="text-[28px] font-black leading-[1.1] tracking-tight">{d.title}</h1>
      </div>
      <div className="space-y-4">
        <div><Label className="text-right">{d.dateStr} {d.dayStr}</Label><p className="text-[12px] text-white/60">{d.timeStr}</p></div>
        {d.djName && <div><Label className="text-right">DJ</Label><p className="text-[14px] font-bold mt-1">{d.djName}</p></div>}
        <div><Label className="text-right">VENUE</Label><p className="text-[13px] font-bold mt-1">{d.venueName}</p></div>
        {d.fee && <div><Label className="text-right">FEE</Label><p className="text-[12px] font-bold mt-1">{d.fee}</p></div>}
        <div><Label className="text-right">ORG</Label><p className="text-[12px] font-bold mt-1">{d.orgName}</p></div>
      </div>
    </div>
  </>
);

/* --- T7: Ticket Strip --- */
const LayoutTicket = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
    <div className="absolute top-[8%] left-0 right-0 text-center text-white">
      <h1 className="text-[44px] font-black tracking-tight leading-[1]">{d.title}</h1>
    </div>
    <div className="absolute bottom-0 left-0 right-0">
      <div className="border-t-2 border-dashed border-white/30 mx-4" />
      <div className="bg-black/80 px-5 py-4 flex items-center justify-between text-white">
        <div>
          <p className="text-[20px] font-black">{d.dateStr} <span className="text-[14px] font-bold text-white/60">{d.dayStr}</span></p>
          <p className="text-[11px] text-white/50">{d.timeStr}</p>
        </div>
        <div className="w-[1px] h-10 bg-white/20" />
        <div className="text-center">
          {d.djName && <p className="text-[13px] font-bold">DJ {d.djName}</p>}
          <p className="text-[11px] text-white/50 mt-0.5">{d.venueName}</p>
        </div>
        <div className="w-[1px] h-10 bg-white/20" />
        <div className="text-right">
          <p className="text-[14px] font-black">{d.fee || "Free"}</p>
          <p className="text-[10px] text-white/40">{d.orgName}</p>
        </div>
      </div>
    </div>
  </>
);

/* --- T8: Magazine --- */
const LayoutMagazine = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/40" />
    <div className="absolute top-[6%] left-[7%] text-white">
      <p className="text-[11px] tracking-[0.5em] uppercase font-bold text-white/50 mb-1">MILONGA</p>
      <div className="w-8 h-[2px] bg-white/60" />
    </div>
    <div className="absolute top-[6%] right-[7%] text-right text-white">
      <p className="text-[24px] font-black leading-none">{d.fee || "Free"}</p>
    </div>
    <div className="absolute top-[20%] left-[7%] right-[7%]">
      <h1 className="text-[52px] font-black text-white leading-[0.95] tracking-tighter" style={{ textShadow: "0 4px 30px rgba(0,0,0,0.5)" }}>{d.title}</h1>
    </div>
    <div className="absolute bottom-[6%] left-[7%] right-[7%] text-white">
      <div className="flex justify-between items-end">
        <div>
          {d.djName && <p className="text-[18px] font-black mb-1">DJ {d.djName}</p>}
          <p className="text-[11px] text-white/50">{d.orgName}</p>
        </div>
        <div className="text-right">
          <p className="text-[16px] font-bold">{d.dateStr} {d.dayStr}</p>
          <p className="text-[11px] text-white/50">{d.timeStr} • {d.venueName}</p>
        </div>
      </div>
    </div>
  </>
);

/* --- T9: Elegant Frame --- */
const LayoutElegant = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black/30" />
    <div className="absolute inset-4 border border-white/30 flex flex-col justify-between p-6 text-white text-center">
      <div>
        <p className="text-[11px] tracking-[0.6em] uppercase text-white/50 font-light">MILONGA</p>
        <div className="w-8 h-[1px] bg-white/30 mx-auto my-3" />
        <h1 className="text-[38px] font-light tracking-wide leading-[1.1]" style={{ fontFamily: "Georgia, serif" }}>{d.title}</h1>
      </div>
      <div className="space-y-1">
        <p className="text-[18px] font-light tracking-wide">{d.dateStr} {d.dayStr}</p>
        <p className="text-[12px] text-white/60">{d.timeStr}</p>
        {d.djName && <><div className="w-6 h-[1px] bg-white/20 mx-auto my-2" /><p className="text-[14px]">DJ {d.djName}</p></>}
      </div>
      <div>
        <div className="w-12 h-[1px] bg-white/20 mx-auto mb-3" />
        <p className="text-[12px] text-white/60">{d.venueName}</p>
        <p className="text-[10px] text-white/40 mt-1">{d.orgName} {d.fee ? ` • ${d.fee}` : ""}</p>
      </div>
    </div>
  </>
);

/* --- T10: Bold Type --- */
const LayoutBoldType = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black/50" />
    <div className="absolute inset-0 flex flex-col justify-center px-6 text-white">
      <h1 className="text-[64px] font-black leading-[0.9] tracking-tighter uppercase" style={{ textShadow: "0 0 40px rgba(0,0,0,0.8)" }}>{d.title}</h1>
      <div className="mt-4 flex items-center gap-3">
        <span className="text-[24px] font-black">{d.dateStr}</span>
        <span className="text-[14px] font-bold text-white/50">{d.dayStr} • {d.timeStr}</span>
      </div>
    </div>
    <div className="absolute bottom-4 left-6 right-6 flex justify-between text-white text-[11px]">
      {d.djName && <span className="font-bold">DJ {d.djName}</span>}
      <span className="text-white/50">{d.venueName}</span>
      <span className="text-white/50">{d.fee}</span>
    </div>
  </>
);

/* --- T11: Corner Spread --- */
const LayoutCorners = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-transparent to-black/50" />
    <div className="absolute top-[6%] left-[6%] text-white max-w-[55%]">
      <h1 className="text-[36px] font-black leading-[1.05] tracking-tight">{d.title}</h1>
    </div>
    <div className="absolute top-[6%] right-[6%] text-right text-white">
      <p className="text-[22px] font-black">{d.dateStr}</p>
      <p className="text-[12px] font-bold text-white/60">{d.dayStr}</p>
    </div>
    <div className="absolute bottom-[6%] left-[6%] text-white">
      {d.djName && <p className="text-[18px] font-black">DJ {d.djName}</p>}
      <p className="text-[11px] text-white/50 mt-1">{d.orgName}</p>
    </div>
    <div className="absolute bottom-[6%] right-[6%] text-right text-white">
      <p className="text-[13px] font-bold">{d.venueName}</p>
      <p className="text-[11px] text-white/50 mt-0.5">{d.timeStr}</p>
      {d.fee && <p className="text-[11px] text-white/50">{d.fee}</p>}
    </div>
  </>
);

/* --- T12: Cinematic Bars --- */
const LayoutCinematic = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute top-0 left-0 right-0 h-[18%] bg-black flex items-end px-5 pb-3">
      <div className="flex-1">
        <h1 className="text-[28px] font-black text-white tracking-tight leading-[1.1]">{d.title}</h1>
      </div>
      <div className="text-right text-white ml-4">
        <p className="text-[16px] font-black">{d.dateStr} {d.dayStr}</p>
        <p className="text-[11px] text-white/50">{d.timeStr}</p>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-[14%] bg-black flex items-center px-5">
      <div className="flex-1 flex items-center gap-4 text-white text-[11px]">
        {d.djName && <div><Label>DJ</Label><p className="font-bold mt-0.5">{d.djName}</p></div>}
        <div className="w-[1px] h-6 bg-white/15" />
        <div><Label>VENUE</Label><p className="font-bold mt-0.5">{d.venueName}</p></div>
        <div className="w-[1px] h-6 bg-white/15" />
        <div><Label>ORG</Label><p className="font-bold mt-0.5">{d.orgName}</p></div>
        {d.fee && <><div className="w-[1px] h-6 bg-white/15" /><div><Label>FEE</Label><p className="font-bold mt-0.5">{d.fee}</p></div></>}
      </div>
    </div>
  </>
);

/* --- T13: Diagonal Band --- */
const LayoutDiagonal = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black/20" />
    <div className="absolute top-[30%] -left-[5%] -right-[5%] bg-black/70 py-5 px-8 text-white" style={{ transform: "rotate(-5deg)" }}>
      <h1 className="text-[36px] font-black tracking-tight leading-[1.05]">{d.title}</h1>
      <p className="text-[13px] font-bold mt-1">{d.dateStr} {d.dayStr} <span className="text-white/50"> • {d.timeStr}</span></p>
    </div>
    <div className="absolute bottom-[5%] left-[6%] text-white">
      {d.djName && <p className="text-[16px] font-black">DJ {d.djName}</p>}
      <p className="text-[11px] text-white/50 mt-1">{d.venueName} • {d.orgName}</p>
    </div>
  </>
);

/* --- T14: Neon Glow --- */
const LayoutNeon = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black/60" />
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
      <h1 className="text-[42px] font-black text-white leading-[1.05] tracking-tight" style={{ textShadow: "0 0 20px rgba(255,100,200,0.7), 0 0 40px rgba(255,100,200,0.4), 0 0 80px rgba(255,100,200,0.2)" }}>{d.title}</h1>
      <p className="text-[16px] font-bold mt-4 text-white/80" style={{ textShadow: "0 0 10px rgba(100,200,255,0.6)" }}>{d.dateStr} {d.dayStr}</p>
      <p className="text-[12px] text-white/50 mt-1">{d.timeStr}</p>
      {d.djName && <p className="text-[14px] font-bold mt-4 text-white/70" style={{ textShadow: "0 0 15px rgba(100,255,200,0.5)" }}>DJ {d.djName}</p>}
    </div>
    <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white/40">
      <p>{d.venueName} • {d.orgName} {d.fee ? ` • ${d.fee}` : ""}</p>
    </div>
  </>
);

/* --- T15: Gradient Wash --- */
const LayoutGradientWash = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/30 to-black/70" />
    <div className="absolute top-[10%] left-[7%] right-[7%] text-white">
      <p className="text-[11px] tracking-[0.4em] uppercase text-white/40 font-bold">MILONGA</p>
      <h1 className="text-[44px] font-black leading-[1] tracking-tight mt-2">{d.title}</h1>
    </div>
    <div className="absolute top-[45%] left-[7%] text-white">
      <p className="text-[20px] font-black">{d.dateStr} <span className="text-[14px] text-white/60">{d.dayStr}</span></p>
      <p className="text-[12px] text-white/50 mt-1">{d.timeStr}</p>
    </div>
    {d.djName && <div className="absolute top-[58%] left-[7%] text-white"><Label>DJ</Label><p className="text-[20px] font-black mt-1">{d.djName}</p></div>}
    <div className="absolute bottom-[5%] left-[7%] right-[7%] flex justify-between text-white text-[11px]">
      <div><Label>VENUE</Label><p className="font-bold mt-1">{d.venueName}</p></div>
      <div className="text-right"><Label>ORG</Label><p className="font-bold mt-1">{d.orgName}</p></div>
    </div>
  </>
);

/* --- T16: Vertical Title --- */
const LayoutVertical = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
    <div className="absolute top-[8%] left-[4%] bottom-[8%] flex items-center">
      <h1 className="text-[48px] font-black text-white tracking-tight" style={{ writingMode: "vertical-rl", textOrientation: "mixed", textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>{d.title}</h1>
    </div>
    <div className="absolute bottom-[6%] right-[6%] text-right text-white">
      <p className="text-[20px] font-black">{d.dateStr} {d.dayStr}</p>
      <p className="text-[12px] text-white/60 mt-1">{d.timeStr}</p>
      {d.djName && <p className="text-[14px] font-bold mt-3">DJ {d.djName}</p>}
      <p className="text-[11px] text-white/40 mt-2">{d.venueName}</p>
      <p className="text-[10px] text-white/30">{d.orgName} {d.fee ? ` • ${d.fee}` : ""}</p>
    </div>
  </>
);

/* --- T17: Compact Card --- */
const LayoutCompact = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black/20" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] bg-black/80 rounded-2xl p-6 text-white text-center">
      <p className="text-[10px] tracking-[0.4em] uppercase text-white/40 font-bold mb-2">MILONGA</p>
      <h1 className="text-[30px] font-black leading-[1.1] tracking-tight">{d.title}</h1>
      <div className="w-8 h-[1px] bg-white/20 mx-auto my-3" />
      <p className="text-[16px] font-bold">{d.dateStr} {d.dayStr}</p>
      <p className="text-[11px] text-white/50 mt-1">{d.timeStr}</p>
      {d.djName && <p className="text-[13px] font-bold mt-3">DJ {d.djName}</p>}
      <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-white/60 space-y-1">
        <p>{d.venueName}{d.venueLocation ? ` • ${d.venueLocation}` : ""}</p>
        <p>{d.orgName} {d.fee ? ` • ${d.fee}` : ""}</p>
      </div>
    </div>
  </>
);

/* --- T18: Split Horizontal --- */
const LayoutSplit = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute top-0 left-0 right-0 h-[35%] bg-black flex flex-col justify-end p-5 text-white">
      <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold mb-2">MILONGA</p>
      <h1 className="text-[34px] font-black leading-[1.05] tracking-tight">{d.title}</h1>
      <div className="flex items-center gap-3 mt-2 text-[13px]">
        <span className="font-bold">{d.dateStr} {d.dayStr}</span>
        <span className="text-white/50">{d.timeStr}</span>
      </div>
    </div>
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent pt-8 pb-4 px-5 text-white">
      <div className="flex justify-between text-[11px]">
        {d.djName && <div><Label>DJ</Label><p className="font-bold mt-1">{d.djName}</p></div>}
        <div><Label>VENUE</Label><p className="font-bold mt-1">{d.venueName}</p></div>
        {d.fee && <div className="text-right"><Label>FEE</Label><p className="font-bold mt-1">{d.fee}</p></div>}
      </div>
    </div>
  </>
);

/* --- T19: Frame Border --- */
const LayoutFrame = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-3 border-2 border-white/50" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />
    <div className="absolute top-[5%] left-0 right-0 text-center text-white">
      <p className="text-[10px] tracking-[0.6em] uppercase text-white/60 font-bold">MILONGA</p>
    </div>
    <div className="absolute bottom-[5%] left-[6%] right-[6%] text-white text-center">
      <h1 className="text-[36px] font-black leading-[1.05] tracking-tight">{d.title}</h1>
      <p className="text-[15px] font-bold mt-2">{d.dateStr} {d.dayStr} <span className="text-white/50"> • {d.timeStr}</span></p>
      {d.djName && <p className="text-[13px] font-bold mt-2 text-white/80">DJ {d.djName}</p>}
      <div className="w-10 h-[1px] bg-white/30 mx-auto my-3" />
      <p className="text-[11px] text-white/50">{d.venueName} • {d.orgName} {d.fee ? ` • ${d.fee}` : ""}</p>
    </div>
  </>
);

/* --- Dark-bg helpers (for editorial layouts) --- */
const DarkLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[9px] uppercase tracking-[0.18em] text-black/40 font-bold ${className}`}>{children}</p>
);
const DarkSep = () => <div className="w-5 h-[2px] bg-black my-1" />;

/* --- T20: Editorial --- */
const LayoutEditorial = ({ d }: { d: PosterData }) => (
  <>
    {/* White covers around the image window (image shows at: top:22% right:0 bottom:30% left:42%) */}
    <div className="absolute top-0 left-0 right-0 h-[22%] bg-white" />
    <div className="absolute top-[22%] left-0 w-[42%] bottom-[34%] bg-white" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[22%] left-[42%] right-0 bottom-[34%] overflow-hidden bg-gray-100">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Top header */}
    <div className="absolute top-0 left-0 right-0 flex justify-between items-center px-[6%] py-[4%]">
      <p className="text-[11px] tracking-[0.25em] uppercase font-bold text-black/80">TANGO SOCIAL</p>
      <p className="text-[13px] font-bold text-black/80">{d.dateStr?.split(".")[0] || new Date().getFullYear()}</p>
    </div>
    {/* Giant title */}
    <div className="absolute top-[7%] left-[5%] right-[5%]">
      <h1 className="text-[52px] font-black text-black leading-[0.92] tracking-[-0.03em] uppercase">{d.title}</h1>
    </div>
    {/* Left info blocks (beside the image) */}
    <div className="absolute top-[24%] left-[6%] w-[34%] space-y-[10%]">
      <div>
        <DarkLabel>DATE</DarkLabel><DarkSep />
        <p className="text-[36px] font-black text-black leading-[1]">{d.dateStr}</p>
        <p className="text-[18px] font-black text-black uppercase">{d.dayStr}</p>
      </div>
      <div>
        <DarkLabel>TIME</DarkLabel><DarkSep />
        <p className="text-[28px] font-black text-black leading-[1]">{d.timeStr}</p>
      </div>
      <div>
        <DarkLabel>ORG</DarkLabel><DarkSep />
        <p className="text-[18px] font-black text-black leading-tight">{d.orgName}</p>
        {d.orgPhone && <p className="text-[12px] text-black/50 mt-0.5">{d.orgPhone}</p>}
      </div>
    </div>
    {/* Bottom bar */}
    <div className="absolute bottom-0 left-0 right-0 h-[34%] bg-white border-t-2 border-black/10">
      <div className="flex h-full">
        <div className="flex-1 flex flex-col justify-center px-[6%] border-r-2 border-black/10">
          <DarkLabel>DJ</DarkLabel><DarkSep />
          <p className="text-[28px] font-black text-black">{d.djName || "\u2014"}</p>
        </div>
        <div className="flex-1 flex flex-col justify-center px-[6%]">
          <DarkLabel>VENUE</DarkLabel><DarkSep />
          <p className="text-[22px] font-black text-black leading-tight">{d.venueName}</p>
          {d.venueLocation && <p className="text-[11px] text-black/40 uppercase tracking-wider mt-1">{d.venueLocation}</p>}
        </div>
      </div>
      {/* Footer */}
      <div className="absolute bottom-[3%] left-[6%] right-[6%] flex justify-between items-center border-t border-black/10 pt-2">
        <p className="text-[9px] tracking-[0.15em] uppercase text-black/40 font-bold">TANGO CONNECTS US</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <div className="w-2 h-2 bg-black rounded-full" />
          <div className="w-2 h-2 bg-black rounded-full" />
        </div>
      </div>
    </div>
  </>
);

/* --- T21: Editorial Left (image on left, info on right, white bg) --- */
const LayoutEditorialLeft = ({ d }: { d: PosterData }) => (
  <>
    {/* White cover: right side only (image shows on left: top:0 left:0 bottom:25% right:45%) */}
    <div className="absolute top-0 left-[55%] right-0 bottom-[28%] bg-white" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-0 left-0 right-[45%] bottom-[28%] overflow-hidden bg-gray-100">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Right info column */}
    <div className="absolute top-[5%] left-[58%] right-[5%] bottom-[28%] flex flex-col justify-between">
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-black/40 font-bold">MILONGA</p>
        <h1 className="text-[40px] font-black text-black leading-[0.92] tracking-tight mt-2 uppercase">{d.title}</h1>
      </div>
      <div className="space-y-4">
        <div>
          <DarkLabel>DATE</DarkLabel><DarkSep />
          <p className="text-[28px] font-black text-black leading-[1]">{d.dateStr}</p>
          <p className="text-[14px] font-bold text-black/60 uppercase">{d.dayStr}</p>
        </div>
        <div>
          <DarkLabel>TIME</DarkLabel><DarkSep />
          <p className="text-[22px] font-black text-black">{d.timeStr}</p>
        </div>
        {d.djName && <div>
          <DarkLabel>DJ</DarkLabel><DarkSep />
          <p className="text-[20px] font-black text-black">{d.djName}</p>
        </div>}
      </div>
    </div>
    {/* Bottom info bar */}
    <div className="absolute bottom-0 left-0 right-0 h-[28%] bg-black flex items-center px-[6%]">
      <div className="flex-1 space-y-1">
        <Label>VENUE</Label><Sep />
        <p className="text-[18px] font-bold text-white">{d.venueName}</p>
        {d.venueLocation && <p className="text-[10px] text-white/40 uppercase tracking-wider">{d.venueLocation}</p>}
      </div>
      <div className="w-[1px] h-12 bg-white/20 mx-4" />
      <div className="text-right space-y-1">
        <Label className="text-right">ORG</Label><div className="w-5 h-[1px] bg-white/30 my-1 ml-auto" />
        <p className="text-[14px] font-bold text-white">{d.orgName}</p>
        {d.fee && <p className="text-[12px] text-white/50">{d.fee}</p>}
      </div>
    </div>
  </>
);

/* --- T22: Editorial Top (image on top, info block below) --- */
const LayoutEditorialTop = ({ d }: { d: PosterData }) => (
  <>
    {/* Only bottom area is covered -- image shows through the top 50% */}
    <div className="absolute top-0 left-0 right-0 bottom-[54%] overflow-hidden bg-gray-100">
      {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />}
    </div>
    <div className="absolute top-[46%] left-0 right-0 bottom-0 bg-[#f5f0eb] px-[7%] flex flex-col justify-between py-[3%]">
      <div>
        <h1 className="text-[44px] font-black text-black leading-[0.92] tracking-tight uppercase">{d.title}</h1>
        <div className="flex items-center gap-3 mt-3">
          <p className="text-[22px] font-black text-black">{d.dateStr}</p>
          <p className="text-[14px] font-bold text-black/50 uppercase">{d.dayStr}</p>
          <span className="w-1 h-1 rounded-full bg-black/30" />
          <p className="text-[14px] font-medium text-black/50">{d.timeStr}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 border-t-2 border-black/10 pt-4">
        {d.djName && <div>
          <DarkLabel>DJ</DarkLabel><DarkSep />
          <p className="text-[16px] font-black text-black">{d.djName}</p>
        </div>}
        <div>
          <DarkLabel>VENUE</DarkLabel><DarkSep />
          <p className="text-[14px] font-black text-black leading-tight">{d.venueName}</p>
        </div>
        <div>
          <DarkLabel>ORG</DarkLabel><DarkSep />
          <p className="text-[14px] font-black text-black">{d.orgName}</p>
          {d.fee && <p className="text-[11px] text-black/40 mt-0.5">{d.fee}</p>}
        </div>
      </div>
      <div className="flex justify-between items-center text-[9px] text-black/30 uppercase tracking-widest">
        <span>TANGO SOCIAL</span>
        <span>{d.dateStr?.split(".")[0] || ""}</span>
      </div>
    </div>
  </>
);

/* --- T23: Editorial Bottom (info block on top, image below) --- */
const LayoutEditorialBottom = ({ d }: { d: PosterData }) => (
  <>
    {/* Only top area is covered -- image shows through the bottom 55% */}
    {/* Image slot */}
    <div className="absolute top-[41%] left-0 right-0 bottom-0 overflow-hidden bg-gray-100">
      {d.imageUrl && <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />}
    </div>
    <div className="absolute top-0 left-0 right-0 h-[49%] bg-black px-[7%] flex flex-col justify-between py-[5%]">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-white/40 font-bold">MILONGA</p>
          <h1 className="text-[48px] font-black text-white leading-[0.9] tracking-tight mt-2 uppercase">{d.title}</h1>
        </div>
        <div className="text-right">
          <p className="text-[32px] font-black text-white leading-[1]">{d.dateStr}</p>
          <p className="text-[14px] font-bold text-white/50 uppercase">{d.dayStr}</p>
        </div>
      </div>
      <div className="flex items-end justify-between border-t border-white/15 pt-3">
        <div className="flex gap-6">
          <div><Label>TIME</Label><Sep /><p className="text-[16px] font-black text-white">{d.timeStr}</p></div>
          {d.djName && <div><Label>DJ</Label><Sep /><p className="text-[16px] font-black text-white">{d.djName}</p></div>}
        </div>
        <div className="text-right">
          <p className="text-[12px] font-bold text-white/70">{d.venueName}</p>
          <p className="text-[10px] text-white/40">{d.orgName} {d.fee ? ` • ${d.fee}` : ""}</p>
        </div>
      </div>
    </div>
  </>
);

/* --- T24: Editorial Quarter (image in bottom-right quarter, rest is info) --- */
const LayoutEditorialQuarter = ({ d }: { d: PosterData }) => (
  <>
    {/* Dark covers around image window (image at: top:32% left:50% right:0 bottom:15%) */}
    <div className="absolute top-0 left-0 right-0 h-[32%] bg-[#1a1a1a]" />
    <div className="absolute top-[32%] left-0 w-[50%] bottom-[15%] bg-[#1a1a1a]" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[32%] left-[50%] right-0 bottom-[15%] overflow-hidden bg-black">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Top section: full-width title */}
    <div className="absolute top-[5%] left-[6%] right-[6%]">
      <p className="text-[10px] tracking-[0.4em] uppercase text-white/30 font-bold mb-2">TANGO SOCIAL</p>
      <h1 className="text-[56px] font-black text-white leading-[0.88] tracking-tight uppercase">{d.title}</h1>
    </div>
    {/* Left info column (top-left, beside image area) */}
    <div className="absolute top-[35%] left-[6%] w-[42%] space-y-5">
      <div>
        <Label>DATE</Label><Sep />
        <p className="text-[32px] font-black text-white leading-[1]">{d.dateStr}</p>
        <p className="text-[16px] font-bold text-white/50 uppercase">{d.dayStr}</p>
      </div>
      <div>
        <Label>TIME</Label><Sep />
        <p className="text-[24px] font-black text-white">{d.timeStr}</p>
      </div>
      {d.djName && <div>
        <Label>DJ</Label><Sep />
        <p className="text-[22px] font-black text-white">{d.djName}</p>
      </div>}
      <div>
        <Label>ORG</Label><Sep />
        <p className="text-[14px] font-bold text-white">{d.orgName}</p>
        {d.orgPhone && <p className="text-[11px] text-white/40 mt-0.5">{d.orgPhone}</p>}
      </div>
    </div>
    {/* Bottom bar */}
    <div className="absolute bottom-0 left-0 right-0 h-[15%] bg-[#1a1a1a] border-t border-white/10 flex items-center px-[6%]">
      <div className="flex-1">
        <Label>VENUE</Label>
        <p className="text-[16px] font-bold text-white mt-1">{d.venueName}</p>
        {d.venueLocation && <p className="text-[10px] text-white/30 uppercase tracking-wider">{d.venueLocation}</p>}
      </div>
      {d.fee && <div className="text-right">
        <Label className="text-right">FEE</Label>
        <p className="text-[16px] font-bold text-white mt-1">{d.fee}</p>
      </div>}
    </div>
  </>
);

/* --- T25: Editorial Strip (thin image strip on left, wide info panel on right) --- */
const LayoutEditorialStrip = ({ d }: { d: PosterData }) => (
  <>
    {/* Right panel covers right 65% -- image shows through left 35% */}
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-0 left-0 w-[35%] bottom-0 overflow-hidden bg-gray-100">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    <div className="absolute top-0 left-[35%] right-0 bottom-0 bg-white border-l-[3px] border-black flex flex-col justify-between py-[5%] px-[5%]">
      <div>
        <p className="text-[10px] tracking-[0.35em] uppercase text-black/35 font-bold">MILONGA</p>
        <div className="w-8 h-[3px] bg-black my-3" />
        <h1 className="text-[38px] font-black text-black leading-[0.9] tracking-tight uppercase">{d.title}</h1>
      </div>
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <DarkLabel>DATE</DarkLabel><DarkSep />
            <p className="text-[26px] font-black text-black leading-[1]">{d.dateStr}</p>
            <p className="text-[13px] font-bold text-black/50 uppercase">{d.dayStr}</p>
          </div>
          <div className="flex-1">
            <DarkLabel>TIME</DarkLabel><DarkSep />
            <p className="text-[22px] font-black text-black">{d.timeStr}</p>
          </div>
        </div>
        {d.djName && <div>
          <DarkLabel>DJ</DarkLabel><DarkSep />
          <p className="text-[22px] font-black text-black">{d.djName}</p>
        </div>}
        <div>
          <DarkLabel>VENUE</DarkLabel><DarkSep />
          <p className="text-[16px] font-black text-black leading-tight">{d.venueName}</p>
          {d.venueLocation && <p className="text-[10px] text-black/40 uppercase tracking-wider mt-0.5">{d.venueLocation}</p>}
        </div>
      </div>
      <div className="border-t-2 border-black/10 pt-3 flex justify-between items-end">
        <div>
          <DarkLabel>ORG</DarkLabel>
          <p className="text-[13px] font-bold text-black mt-1">{d.orgName}</p>
          {d.orgPhone && <p className="text-[11px] text-black/40">{d.orgPhone}</p>}
        </div>
        {d.fee && <div className="text-right">
          <DarkLabel>FEE</DarkLabel>
          <p className="text-[14px] font-bold text-black mt-1">{d.fee}</p>
        </div>}
      </div>
    </div>
  </>
);

/* --- Gallery shared helpers --- */
const GLabel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[9px] uppercase tracking-[0.25em] font-medium ${className}`}>{children}</p>
);

/* --- G1: Gallery (Reference) -- image: top 28% to bottom 28% --- */
const LayoutGallery = ({ d }: { d: PosterData }) => (
  <>
    {/* Cream panels: top, left/right strips beside image, bottom */}
    <div className="absolute top-0 left-0 right-0 h-[28%] bg-[#f5f0ea]" />
    <div className="absolute top-[28%] left-0 w-[8%] bottom-[36%] bg-[#f5f0ea]" />
    <div className="absolute top-[28%] right-0 w-[8%] bottom-[36%] bg-[#f5f0ea]" />
    <div className="absolute bottom-0 left-0 right-0 h-[36%] bg-[#f5f0ea]" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[28%] left-[8%] right-[8%] bottom-[36%] overflow-hidden bg-gray-100">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Title area */}
    <div className="absolute top-[8%] left-[8%] right-[8%]">
      <h1 className="text-[36px] font-bold leading-[1.1] text-[#2a2420] tracking-[0.12em] uppercase" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        {d.title}
      </h1>
      <div className="w-6 h-[2px] bg-[#2a2420] mt-3 mb-2" />
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a8078] font-medium">
        {d.venueLocation} • {d.dateStr}
      </p>
    </div>
    {/* 3-column info grid */}
    <div className="absolute bottom-[14%] left-[8%] right-[8%]">
      <div className="grid grid-cols-3 gap-0">
        <div className="pr-3 border-r border-[#d0c8c0]">
          <GLabel className="text-[#a09890]">DJ</GLabel>
          <div className="w-5 h-[1px] bg-[#c0b8b0] my-0.5" />
          <p className="text-[18px] font-semibold text-[#2a2420]" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.djName || "TBA"}</p>
        </div>
        <div className="px-3 text-center border-r border-[#d0c8c0]">
          <p className="text-[24px] font-bold text-[#2a2420] leading-none" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {d.dateStr} <span className="text-[14px] font-medium tracking-wider">{d.dayStr}</span>
          </p>
          <div className="w-5 h-[1px] bg-[#c0b8b0] my-0.5 mx-auto" />
          <p className="text-[12px] text-[#8a8078] font-medium">{d.timeStr}</p>
        </div>
        <div className="pl-3">
          <GLabel className="text-[#a09890]">ORG</GLabel>
          <div className="w-5 h-[1px] bg-[#c0b8b0] my-0.5" />
          <p className="text-[18px] font-semibold text-[#2a2420]" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.orgName}</p>
          {d.orgPhone && <p className="text-[10px] text-[#a09890] mt-0.5">{d.orgPhone}</p>}
        </div>
      </div>
    </div>
    {/* Bottom venue */}
    <div className="absolute bottom-[3%] left-[8%] right-[8%]">
      <div className="h-[1px] bg-[#d0c8c0] mb-2.5" />
      <p className="text-[14px] font-semibold text-[#2a2420] italic" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.venueName}</p>
      <p className="text-[10px] text-[#a09890] mt-0.5">{d.venueLocation}</p>
    </div>
  </>
);

/* --- G2: Gallery Dark -- image: top 28% to bottom 28% --- */
const LayoutGalleryDark = ({ d }: { d: PosterData }) => (
  <>
    {/* Dark panels */}
    <div className="absolute top-0 left-0 right-0 h-[28%] bg-[#1a1714]" />
    <div className="absolute top-[28%] left-0 w-[8%] bottom-[36%] bg-[#1a1714]" />
    <div className="absolute top-[28%] right-0 w-[8%] bottom-[36%] bg-[#1a1714]" />
    <div className="absolute bottom-0 left-0 right-0 h-[36%] bg-[#1a1714]" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[28%] left-[8%] right-[8%] bottom-[36%] overflow-hidden bg-[#2a2420]">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Title */}
    <div className="absolute top-[8%] left-[8%] right-[8%]">
      <h1 className="text-[36px] font-bold leading-[1.1] text-[#e8ddd0] tracking-[0.12em] uppercase" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        {d.title}
      </h1>
      <div className="w-6 h-[2px] bg-[#c4a872] mt-3 mb-2" />
      <p className="text-[11px] uppercase tracking-[0.3em] text-[#8a7e70] font-medium">
        {d.venueLocation} • {d.dateStr}
      </p>
    </div>
    {/* 3-column grid */}
    <div className="absolute bottom-[14%] left-[8%] right-[8%]">
      <div className="grid grid-cols-3 gap-0">
        <div className="pr-3 border-r border-[#3a3530]">
          <GLabel className="text-[#8a7e70]">DJ</GLabel>
          <div className="w-5 h-[1px] bg-[#c4a872] my-0.5" />
          <p className="text-[18px] font-semibold text-[#e8ddd0]" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.djName || "TBA"}</p>
        </div>
        <div className="px-3 text-center border-r border-[#3a3530]">
          <p className="text-[24px] font-bold text-[#e8ddd0] leading-none" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {d.dateStr} <span className="text-[14px] font-medium tracking-wider text-[#c4a872]">{d.dayStr}</span>
          </p>
          <div className="w-5 h-[1px] bg-[#c4a872] my-0.5 mx-auto" />
          <p className="text-[12px] text-[#8a7e70] font-medium">{d.timeStr}</p>
        </div>
        <div className="pl-3">
          <GLabel className="text-[#8a7e70]">ORG</GLabel>
          <div className="w-5 h-[1px] bg-[#c4a872] my-0.5" />
          <p className="text-[18px] font-semibold text-[#e8ddd0]" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.orgName}</p>
          {d.orgPhone && <p className="text-[10px] text-[#6a6058] mt-0.5">{d.orgPhone}</p>}
        </div>
      </div>
    </div>
    {/* Venue */}
    <div className="absolute bottom-[3%] left-[8%] right-[8%]">
      <div className="h-[1px] bg-[#3a3530] mb-2.5" />
      <p className="text-[14px] font-semibold text-[#c4a872] italic" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.venueName}</p>
      <p className="text-[10px] text-[#6a6058] mt-0.5">{d.venueLocation}</p>
    </div>
  </>
);

/* ?? G3: Gallery Left ??image on right (left 44% to right 6%, top 6% to bottom 6%) ?? */
const LayoutGalleryLeft = ({ d }: { d: PosterData }) => (
  <>
    {/* Cream panel: left column + strips around image */}
    <div className="absolute top-0 left-0 bottom-0 w-[44%] bg-[#f5f0ea]" />
    <div className="absolute top-0 left-[44%] right-0 h-[6%] bg-[#f5f0ea]" />
    <div className="absolute bottom-0 left-[44%] right-0 h-[6%] bg-[#f5f0ea]" />
    <div className="absolute top-[6%] right-0 w-[6%] bottom-[6%] bg-[#f5f0ea]" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[6%] left-[44%] right-[6%] bottom-[6%] overflow-hidden bg-gray-100">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Left column text */}
    <div className="absolute top-0 left-0 bottom-0 w-[42%] flex flex-col justify-between py-[10%] px-[7%]">
      <div>
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#a09890] font-medium mb-3">{d.venueLocation}</p>
        <h1 className="text-[30px] font-bold leading-[1.1] text-[#2a2420] tracking-[0.08em] uppercase" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
          {d.title}
        </h1>
        <div className="w-6 h-[2px] bg-[#2a2420] mt-3" />
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-[22px] font-bold text-[#2a2420] leading-none" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {d.dateStr}
          </p>
          <p className="text-[13px] text-[#8a8078] font-medium mt-0.5">{d.dayStr} • {d.timeStr}</p>
        </div>
        <div className="h-[1px] bg-[#d0c8c0]" />
        {d.djName && <div>
          <GLabel className="text-[#a09890]">DJ</GLabel>
          <p className="text-[16px] font-semibold text-[#2a2420] mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.djName}</p>
        </div>}
        <div>
          <GLabel className="text-[#a09890]">ORG</GLabel>
          <p className="text-[16px] font-semibold text-[#2a2420] mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.orgName}</p>
        </div>
        <div className="h-[1px] bg-[#d0c8c0]" />
        <div>
          <p className="text-[13px] font-semibold text-[#2a2420] italic" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.venueName}</p>
          <p className="text-[10px] text-[#a09890] mt-0.5">{d.venueLocation}</p>
        </div>
      </div>
    </div>
  </>
);

/* ?? G4: Gallery Minimal ??image: top 38% to bottom 38%, left/right 15% ?? */
const LayoutGalleryMinimal = ({ d }: { d: PosterData }) => (
  <>
    {/* Cream panels around small center image */}
    <div className="absolute top-0 left-0 right-0 h-[38%] bg-[#faf8f5]" />
    <div className="absolute top-[38%] left-0 w-[15%] bottom-[38%] bg-[#faf8f5]" />
    <div className="absolute top-[38%] right-0 w-[15%] bottom-[38%] bg-[#faf8f5]" />
    <div className="absolute bottom-0 left-0 right-0 h-[38%] bg-[#faf8f5]" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[38%] left-[15%] right-[15%] bottom-[38%] overflow-hidden bg-gray-100">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Top content */}
    <div className="absolute top-[8%] left-[12%] right-[12%] flex flex-col items-center">
      <p className="text-[9px] uppercase tracking-[0.4em] text-[#b0a8a0] font-medium mb-4">{d.venueLocation}</p>
      <h1 className="text-[32px] font-bold leading-[1.1] text-[#2a2420] tracking-[0.15em] uppercase text-center" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        {d.title}
      </h1>
      <div className="w-8 h-[1px] bg-[#c0b8b0] mt-4" />
    </div>
    {/* Bottom content */}
    <div className="absolute bottom-[8%] left-[12%] right-[12%] flex flex-col items-center">
      <div className="w-8 h-[1px] bg-[#c0b8b0] mb-4" />
      <p className="text-[28px] font-bold text-[#2a2420] leading-none" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        {d.dateStr} <span className="text-[16px] font-medium tracking-wider">{d.dayStr}</span>
      </p>
      <p className="text-[12px] text-[#8a8078] font-medium mt-1.5">{d.timeStr}</p>
      <div className="flex items-center gap-4 mt-4">
        {d.djName && <>
          <div className="text-center">
            <GLabel className="text-[#b0a8a0]">DJ</GLabel>
            <p className="text-[14px] font-semibold text-[#2a2420] mt-0.5" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.djName}</p>
          </div>
          <div className="w-[1px] h-6 bg-[#d0c8c0]" />
        </>}
        <div className="text-center">
          <GLabel className="text-[#b0a8a0]">ORG</GLabel>
          <p className="text-[14px] font-semibold text-[#2a2420] mt-0.5" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.orgName}</p>
        </div>
      </div>
      <div className="h-[1px] bg-[#d0c8c0] w-full mt-4 mb-2" />
      <p className="text-[12px] font-semibold text-[#2a2420] italic" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.venueName}</p>
    </div>
  </>
);

/* ?? G5: Gallery Border ??image: top 32% to bottom 28%, left/right 12% ?? */
const LayoutGalleryBorder = ({ d }: { d: PosterData }) => (
  <>
    {/* Cream panels around image */}
    <div className="absolute top-0 left-0 right-0 h-[32%] bg-[#f0ece6]" />
    <div className="absolute top-[32%] left-0 w-[12%] bottom-[36%] bg-[#f0ece6]" />
    <div className="absolute top-[32%] right-0 w-[12%] bottom-[36%] bg-[#f0ece6]" />
    <div className="absolute bottom-0 left-0 right-0 h-[36%] bg-[#f0ece6]" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[32%] left-[12%] right-[12%] bottom-[36%] overflow-hidden bg-gray-200">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Outer thin border */}
    <div className="absolute inset-[4%] border border-[#c8c0b8] pointer-events-none" />
    {/* Title */}
    <div className="absolute top-[6%] left-[8%] right-[8%]">
      <p className="text-[9px] uppercase tracking-[0.4em] text-[#a09890] font-medium mb-2">{d.dateStr} • {d.dayStr}</p>
      <h1 className="text-[32px] font-bold leading-[1.05] text-[#2a2420] tracking-[0.1em] uppercase" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        {d.title}
      </h1>
      <div className="w-6 h-[2px] bg-[#2a2420] mt-2" />
    </div>
    {/* Image border frame */}
    <div className="absolute top-[32%] left-[12%] right-[12%] bottom-[36%] border border-[#c8c0b8] pointer-events-none" />
    {/* Bottom info */}
    <div className="absolute bottom-[6%] left-[8%] right-[8%]">
      <div className="grid grid-cols-3 gap-0">
        <div className="pr-3 border-r border-[#c8c0b8]">
          <GLabel className="text-[#a09890]">DJ</GLabel>
          <p className="text-[16px] font-semibold text-[#2a2420] mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.djName || "TBA"}</p>
        </div>
        <div className="px-3 text-center border-r border-[#c8c0b8]">
          <GLabel className="text-[#a09890]">TIME</GLabel>
          <p className="text-[16px] font-semibold text-[#2a2420] mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.timeStr}</p>
        </div>
        <div className="pl-3 text-right">
          <GLabel className="text-[#a09890]">ORG</GLabel>
          <p className="text-[16px] font-semibold text-[#2a2420] mt-1" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.orgName}</p>
        </div>
      </div>
      <div className="h-[1px] bg-[#c8c0b8] mt-2 mb-2" />
      <p className="text-[12px] font-semibold text-[#2a2420] italic" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{d.venueName}</p>
      <p className="text-[9px] text-[#a09890] mt-0.5">{d.venueLocation}</p>
    </div>
  </>
);

/* ?? G6: Gallery Mono ??image: top 22% to bottom 26%, left/right 8% ?? */
const LayoutGalleryMono = ({ d }: { d: PosterData }) => (
  <>
    {/* White panels */}
    <div className="absolute top-0 left-0 right-0 h-[22%] bg-white" />
    <div className="absolute top-[22%] left-0 w-[8%] bottom-[34%] bg-white" />
    <div className="absolute top-[22%] right-0 w-[8%] bottom-[34%] bg-white" />
    <div className="absolute bottom-0 left-0 right-0 h-[34%] bg-white" />
    {/* Image slot */}
    {d.imageUrl && (
      <div className="absolute top-[22%] left-[8%] right-[8%] bottom-[34%] overflow-hidden bg-gray-50">
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    {/* Title */}
    <div className="absolute top-[7%] left-[8%] right-[8%]">
      <h1 className="text-[34px] font-extrabold leading-[1.05] text-[#111] tracking-[0.02em] uppercase" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>
        {d.title}
      </h1>
      <div className="flex items-center gap-3 mt-2">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#999] font-semibold">{d.venueLocation}</p>
        <div className="flex-1 h-[1px] bg-[#e0e0e0]" />
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#999] font-semibold">{d.dateStr} {d.dayStr}</p>
      </div>
    </div>
    {/* Image border */}
    <div className="absolute top-[22%] left-[8%] right-[8%] bottom-[34%] border border-[#e8e8e8] pointer-events-none" />
    {/* Bottom section */}
    <div className="absolute bottom-[8%] left-[8%] right-[8%]">
      <div className="grid grid-cols-3 gap-0 mb-2">
        <div className="pr-3 border-r border-[#e0e0e0]">
          <p className="text-[8px] uppercase tracking-[0.2em] text-[#aaa] font-bold">DJ</p>
          <p className="text-[16px] font-bold text-[#111] mt-1" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>{d.djName || "TBA"}</p>
        </div>
        <div className="px-3 text-center border-r border-[#e0e0e0]">
          <p className="text-[8px] uppercase tracking-[0.2em] text-[#aaa] font-bold">TIME</p>
          <p className="text-[16px] font-bold text-[#111] mt-1" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>{d.timeStr}</p>
        </div>
        <div className="pl-3 text-right">
          <p className="text-[8px] uppercase tracking-[0.2em] text-[#aaa] font-bold">ORG</p>
          <p className="text-[16px] font-bold text-[#111] mt-1" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>{d.orgName}</p>
        </div>
      </div>
      <div className="h-[1px] bg-[#e0e0e0] mb-2" />
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold text-[#111]" style={{ fontFamily: "'Inter', 'Helvetica', sans-serif" }}>{d.venueName}</p>
        {d.fee && <p className="text-[11px] font-bold text-[#666] bg-[#f5f5f5] px-2 py-0.5 rounded">{d.fee}</p>}
      </div>
    </div>
  </>
);

/* --- Street Grunge Styles (S1-S5) --- */

/* --- S1: Street Original --- */
const LayoutStreet1 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-[#0a0a0a]" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
    
    {/* Background giant text */}
    <div className="absolute top-[10%] -left-[10%] opacity-10 select-none pointer-events-none">
      <h2 className="text-[180px] font-black text-white leading-none tracking-tighter uppercase italic">STREET</h2>
    </div>

    {/* Image area with rough border */}
    {d.imageUrl && (
      <div className="absolute top-[18%] left-[10%] right-[10%] bottom-[32%] border-[4px] border-white p-1 transform rotate-1">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale contrast-125" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}

    {/* Main Title - Overlapping */}
    <div className="absolute top-[48%] left-[5%] right-[5%] z-10">
      <div className="bg-yellow-400 p-3 transform -rotate-2 shadow-[8px_8px_0_rgba(255,255,255,0.2)]">
        <h1 className="text-[42px] font-black text-black leading-none uppercase tracking-tighter italic">
          {d.title}
        </h1>
      </div>
    </div>

    {/* Info Blocks */}
    <div className="absolute bottom-[8%] left-[8%] right-[8%] flex justify-between items-end">
      <div className="space-y-2">
        <PaperCutout className="px-3 py-1">
          <p className="text-[18px] font-black uppercase">{d.dateStr} {d.dayStr}</p>
        </PaperCutout>
        <div className="bg-white text-black px-2 py-1 font-bold text-[14px] inline-block transform rotate-1">
          {d.timeStr} @ {d.venueName}
        </div>
      </div>
      <div className="text-right">
        {d.djName && (
          <div className="mb-2">
            <SLabel className="mb-1">LINEUP</SLabel>
            <p className="text-[24px] font-black text-white uppercase italic leading-none">{d.djName}</p>
          </div>
        )}
        <p className="text-[10px] text-white/50 font-bold tracking-widest">{d.orgName} PRESENTS</p>
      </div>
    </div>
  </>
);

/* --- S2: Highlight --- */
const LayoutStreet2 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black" />
    {/* Neon Grid Pattern */}
    <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "linear-gradient(#33ff00 1px, transparent 1px), linear-gradient(90deg, #33ff00 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
    
    {/* Image Slot - Full width background but filtered */}
    {d.imageUrl && (
      <div className="absolute inset-0 opacity-40 mix-blend-screen">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}

    <div className="absolute top-[10%] left-[8%]">
      <div className="border-l-8 border-[#33ff00] pl-4">
        <h1 className="text-[54px] font-black text-white leading-[0.85] uppercase tracking-tighter">
          {d.title.split(' ').map((word, i) => (
            <span key={i} className="block">{word}</span>
          ))}
        </h1>
      </div>
    </div>

    <div className="absolute top-[40%] right-[5%] transform rotate-90 origin-right">
      <p className="text-[60px] font-black text-[#33ff00] opacity-50 tracking-tighter uppercase">{d.dateStr}</p>
    </div>

    <div className="absolute bottom-[10%] left-[8%] right-[8%] space-y-6">
      <div className="flex gap-4">
        <div className="bg-[#33ff00] text-black px-4 py-2 font-black text-[20px] uppercase">
          {d.dayStr} / {d.timeStr}
        </div>
        <div className="border-2 border-[#33ff00] text-[#33ff00] px-4 py-2 font-black text-[20px] uppercase">
          {d.fee || "ENTRANCE FREE"}
        </div>
      </div>
      
      <div className="flex justify-between items-center border-t border-white/20 pt-4">
        <div>
          <Label className="text-[#33ff00]">LOCATION</Label>
          <p className="text-white font-black text-[18px]">{d.venueName}</p>
          <p className="text-white/50 text-[12px]">{d.venueLocation}</p>
        </div>
        <div className="text-right">
          <Label className="text-[#33ff00]">SPECIAL GUEST</Label>
          <p className="text-white font-black text-[22px] italic uppercase">{d.djName}</p>
        </div>
      </div>
    </div>
  </>
);

/* --- S3: Collage --- */
const LayoutStreet3 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-[#e5e5e5]" />
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-40" />
    
    {/* Scattered elements */}
    <div className="absolute top-[5%] left-[10%] w-[120px] h-[120px] bg-red-600 transform rotate-12 -z-0" />
    <div className="absolute bottom-[20%] right-[5%] w-[150px] h-[40px] bg-black transform -rotate-3" />
    
    {/* Title block */}
    <div className="absolute top-[12%] left-[8%] right-[8%] z-10">
      <h1 className="text-[48px] font-black text-black leading-none uppercase tracking-tighter">
        <span className="bg-black text-white px-2 py-1 inline-block transform -rotate-1 mb-1">{d.title.split(' ')[0]}</span>
        <br />
        <span className="bg-white border-2 border-black px-2 py-1 inline-block transform rotate-2">{d.title.split(' ').slice(1).join(' ')}</span>
      </h1>
    </div>

    {/* Main Image - Taped Look */}
    {d.imageUrl && (
      <div className="absolute top-[35%] left-[15%] right-[15%] bottom-[25%] bg-white p-2 shadow-xl transform rotate-1">
        {/* Tape strips */}
        <div className="absolute -top-3 left-1/4 w-12 h-6 bg-white/60 backdrop-blur-sm transform -rotate-12 z-20" />
        <div className="absolute -bottom-3 right-1/4 w-12 h-6 bg-white/60 backdrop-blur-sm transform rotate-12 z-20" />
        <img src={d.imageUrl} className="w-full h-full object-cover sepia-[0.3]" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}

    {/* Info pieces */}
    <div className="absolute bottom-[5%] left-[5%] right-[5%] flex flex-wrap gap-3">
      <div className="bg-yellow-300 text-black px-3 py-1 font-bold text-[16px] border border-black transform rotate-2">
        {d.dateStr}
      </div>
      <div className="bg-white text-black px-3 py-1 font-bold text-[16px] border border-black transform -rotate-1">
        {d.timeStr}
      </div>
      <div className="bg-black text-white px-3 py-1 font-bold text-[16px] transform rotate-3">
        {d.venueName}
      </div>
      {d.djName && (
        <div className="bg-red-600 text-white px-3 py-1 font-bold text-[16px] transform -rotate-2">
          DJ {d.djName}
        </div>
      )}
    </div>
  </>
);

/* --- S4: Raw (B&W) --- */
const LayoutStreet4 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-white" />
    
    {/* Heavy contrast background image */}
    {d.imageUrl && (
      <div className="absolute inset-0 opacity-90 overflow-hidden">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale contrast-[2] brightness-[0.8]" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}

    {/* Large outline text */}
    <div className="absolute top-[15%] left-[5%] right-[5%] text-center">
      <h1 className="text-[60px] font-black leading-none uppercase tracking-tighter text-white" style={{ WebkitTextStroke: "2px black" }}>
        {d.title}
      </h1>
    </div>

    {/* Details block at bottom */}
    <div className="absolute bottom-0 left-0 right-0 bg-black text-white p-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[36px] font-black italic">{d.dateStr}</p>
        <div className="text-right">
          <p className="text-[14px] font-bold uppercase tracking-widest">{d.dayStr} / {d.timeStr}</p>
          <p className="text-[12px] opacity-60 uppercase">{d.venueName}</p>
        </div>
      </div>
      <div className="border-t border-white/30 pt-4 flex justify-between text-[11px] font-bold uppercase tracking-[0.2em]">
        <span>{d.orgName}</span>
        {d.djName && <span>HOSTED BY {d.djName}</span>}
      </div>
    </div>
  </>
);

/* --- S5: Tape --- */
const LayoutStreet5 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-[#111]" />
    
    {/* Decorative strips */}
    <div className="absolute top-0 left-0 right-0 h-4 bg-yellow-400 repeating-linear-gradient" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)" }} />
    <div className="absolute bottom-0 left-0 right-0 h-4 bg-yellow-400 repeating-linear-gradient" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 10px, #000 10px, #000 20px)" }} />

    {/* Image with tape on corners */}
    {d.imageUrl && (
      <div className="absolute top-[10%] left-[10%] right-[10%] bottom-[40%] bg-zinc-900 overflow-hidden border-4 border-zinc-800">
        <img src={d.imageUrl} className="w-full h-full object-cover contrast-125 saturate-50" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        {/* Tape elements */}
        <div className="absolute top-2 left-[-15px] w-16 h-8 bg-white/30 backdrop-blur-sm rotate-[-35deg]" />
        <div className="absolute top-2 right-[-15px] w-16 h-8 bg-white/30 backdrop-blur-sm rotate-[35deg]" />
      </div>
    )}

    {/* Typographic chaos bottom section */}
    <div className="absolute bottom-[6%] left-[8%] right-[8%] z-10">
      <h1 className="text-[34px] font-black text-white leading-none uppercase tracking-tighter mb-4">
        {d.title}
      </h1>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white text-black p-2 font-black text-[18px] uppercase transform rotate-[-1deg]">
          {d.dateStr}
        </div>
        <div className="bg-yellow-400 text-black p-2 font-black text-[18px] uppercase transform rotate-[2deg]">
          {d.timeStr}
        </div>
        <div className="col-span-2 bg-zinc-800 text-white p-2 font-bold text-[14px] uppercase border border-zinc-700">
          {d.venueName} / {d.djName || "NO DJ"}
        </div>
      </div>
      
      <p className="mt-4 text-[9px] text-zinc-500 font-bold tracking-[0.3em] uppercase text-center">
        {d.orgName} • ALL RIGHTS RESERVED • {new Date().getFullYear()}
      </p>
    </div>
  </>
);

/* ?? Registry ?? */
/* --- S6: Stencil --- */
const LayoutStreet6 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-zinc-900" />
    {d.imageUrl && (
      <div className="absolute inset-0 opacity-40">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale brightness-50" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    <div className="absolute top-[10%] left-[5%] right-[5%] border-4 border-white/20 p-6 flex flex-col items-center">
      <h1 className="text-[52px] font-black leading-none uppercase tracking-[-0.05em] text-white text-center drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
        {d.title}
      </h1>
      <div className="w-full h-[2px] bg-yellow-500 my-4" />
      <p className="text-[24px] font-black text-yellow-500 italic uppercase">{d.dateStr} {d.dayStr}</p>
    </div>
    <div className="absolute bottom-[10%] left-[5%] right-[5%] flex justify-between items-end">
      <div className="bg-white text-black p-4 transform -rotate-3 shadow-xl">
        <p className="text-[12px] font-black uppercase tracking-widest leading-none">Venue</p>
        <p className="text-[20px] font-black uppercase mt-1">{d.venueName}</p>
      </div>
      <div className="text-right text-white">
        <p className="text-[14px] font-bold uppercase tracking-tighter">{d.timeStr}</p>
        {d.djName && <p className="text-[18px] font-black text-yellow-500 uppercase">{d.djName}</p>}
      </div>
    </div>
  </>
);

/* --- S7: Brutalist --- */
const LayoutStreet7 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-red-600" />
    <div className="absolute inset-0 opacity-30 mix-blend-multiply">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
    </div>
    <div className="absolute inset-0 border-[20px] border-black flex flex-col">
      <div className="bg-black text-white p-4">
        <h1 className="text-[38px] font-black leading-none uppercase tracking-tighter italic">
          {d.title}
        </h1>
      </div>
      <div className="mt-auto bg-black text-white p-6 flex justify-between items-center">
        <div>
          <p className="text-[42px] font-black leading-none">{d.dateStr}</p>
          <p className="text-[16px] font-bold text-red-500 uppercase">{d.dayStr}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black uppercase">{d.venueName}</p>
          <p className="text-[12px] opacity-70 uppercase tracking-widest">{d.timeStr}</p>
        </div>
      </div>
    </div>
  </>
);

/* --- S8: Flash --- */
const LayoutStreet8 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black" />
    <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover contrast-150 saturate-200" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
    </div>
    <div className="absolute top-[45%] left-0 right-0 flex flex-col items-center px-6">
      <div className="bg-yellow-400 text-black px-4 py-2 font-black text-[48px] leading-none uppercase skew-x-[-10deg] mb-4 shadow-[10px_10px_0_rgba(255,255,255,0.2)]">
        {d.title}
      </div>
      <div className="w-full grid grid-cols-3 gap-2 mt-8">
        <div className="bg-zinc-900 border border-zinc-800 p-3 text-center">
          <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Date</p>
          <p className="text-[16px] text-white font-black">{d.dateStr}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 text-center">
          <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Time</p>
          <p className="text-[16px] text-white font-black">{d.timeStr}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-3 text-center">
          <p className="text-[9px] text-zinc-500 font-bold uppercase mb-1">Fee</p>
          <p className="text-[16px] text-white font-black">{d.fee || "FREE"}</p>
        </div>
      </div>
      <p className="mt-8 text-[20px] font-black text-white uppercase tracking-tighter">@ {d.venueName}</p>
      {d.djName && <p className="text-[14px] font-bold text-yellow-400 uppercase mt-1">Special Guest: {d.djName}</p>}
    </div>
  </>
);

/* --- S9: Cyber --- */
const LayoutStreet9 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-zinc-950" />
    <div className="absolute inset-0 border-2 border-cyan-500/20 m-4" />
    {d.imageUrl && (
      <div className="absolute inset-0 opacity-30 mix-blend-lighten">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale contrast-150" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    <div className="absolute top-[15%] left-[10%]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-[2px] bg-cyan-400" />
        <p className="text-[12px] font-black text-cyan-400 tracking-[0.5em] uppercase">Transmission</p>
      </div>
      <h1 className="text-[56px] font-black text-white leading-none uppercase tracking-tighter drop-shadow-[0_0_15px_rgba(6,182,212,0.5)]">
        {d.title}
      </h1>
    </div>
    <div className="absolute bottom-[10%] left-[10%] right-[10%] border-t border-cyan-500/30 pt-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[32px] font-black text-white leading-none">{d.dateStr}</p>
          <p className="text-[14px] font-bold text-cyan-400 uppercase mt-1">{d.dayStr}</p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-black text-white uppercase">{d.venueName}</p>
          <p className="text-[12px] text-cyan-400/70 font-bold uppercase mt-1">{d.timeStr}</p>
        </div>
      </div>
      <div className="mt-6 flex gap-4">
        <div className="bg-cyan-500 text-black px-2 py-0.5 text-[10px] font-black uppercase">Secure Access</div>
        <div className="border border-cyan-500/50 text-cyan-500 px-2 py-0.5 text-[10px] font-black uppercase">{d.fee || "Open Source"}</div>
      </div>
    </div>
  </>
);

/* --- S10: Glitch (RGB Split) --- */
const LayoutStreet10 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black" />
    {d.imageUrl && (
      <div className="absolute inset-0 opacity-40 mix-blend-screen overflow-hidden">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale contrast-200" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-cyan-500/20" />
      </div>
    )}
    <div className="absolute inset-0 flex flex-col justify-center items-center p-8">
      <div className="relative">
        <h1 className="text-[52px] font-black leading-none uppercase tracking-tighter text-white z-10 relative drop-shadow-[2px_2px_0_rgba(255,0,0,0.8)]">
          {d.title}
        </h1>
        <h1 className="absolute top-[2px] left-[2px] text-[52px] font-black leading-none uppercase tracking-tighter text-cyan-400 opacity-70 z-0 select-none">
          {d.title}
        </h1>
        <h1 className="absolute top-[-2px] left-[-2px] text-[52px] font-black leading-none uppercase tracking-tighter text-red-500 opacity-70 z-0 select-none">
          {d.title}
        </h1>
      </div>
      <div className="mt-8 bg-white text-black px-6 py-2 transform skew-x-[-15deg] font-black text-[20px] shadow-[5px_5px_0_rgba(0,255,255,0.5)]">
        {d.dateStr} {d.dayStr}
      </div>
    </div>
    <div className="absolute bottom-[8%] left-0 right-0 px-10 flex justify-between items-end border-b-4 border-white/20 pb-4 mx-8">
      <div>
        <p className="text-[12px] font-bold text-cyan-300 uppercase tracking-widest">{d.venueName}</p>
        <p className="text-[10px] text-white/50 uppercase mt-1">{d.venueLocation}</p>
      </div>
      <div className="text-right">
        <p className="text-[14px] font-black text-white">{d.timeStr}</p>
        <p className="text-[10px] text-red-400 font-bold mt-1 uppercase">Live Stream</p>
      </div>
    </div>
  </>
);

/* --- S11: Neo-Graffiti (Street Art) --- */
const LayoutStreet11 = ({ d }: { d: PosterData }) => {
  const [month, day] = d.dateStr.includes('.') ? d.dateStr.split('.') : ['EVENT', 'NOW'];
  return (
    <>
      <div className="absolute inset-0 bg-[#121212]" />
      {d.imageUrl && (
        <div className="absolute inset-0 opacity-50 grayscale contrast-125 brightness-75">
          <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        </div>
      )}
      <div className="absolute inset-0 p-8 flex flex-col">
        <div className="mb-10">
          <div className="inline-block bg-lime-400 text-black px-4 py-1 text-[12px] font-black uppercase tracking-tighter mb-2">Social Gathering</div>
          <h1 className="text-[64px] font-black text-white leading-[0.8] tracking-[-0.05em] uppercase break-words drop-shadow-[4px_4px_0_rgba(163,230,53,1)]">
            {d.title}
          </h1>
        </div>
        <div className="mt-auto space-y-6">
          <div className="flex gap-4">
            <div className="w-24 h-24 bg-white text-black flex flex-col items-center justify-center rounded-sm rotate-[-5deg] shadow-lg">
              <span className="text-[10px] font-black opacity-30 uppercase">Month</span>
              <span className="text-[32px] font-black leading-none">{month}</span>
            </div>
            <div className="w-24 h-24 bg-lime-400 text-black flex flex-col items-center justify-center rounded-sm rotate-[3deg] shadow-lg">
              <span className="text-[10px] font-black opacity-30 uppercase">Day</span>
              <span className="text-[32px] font-black leading-none">{day}</span>
            </div>
          </div>
          <div className="bg-black/80 backdrop-blur-sm p-6 border-l-4 border-lime-400">
            <div className="flex justify-between items-center text-white">
              <div>
                <p className="text-[18px] font-black uppercase tracking-tight">{d.venueName}</p>
                <p className="text-[12px] font-bold text-lime-400/80">{d.timeStr}</p>
              </div>
              <div className="text-right">
                <p className="text-[14px] font-black italic">{d.fee || "JOIN US"}</p>
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest">{d.djName || "SELECTORS"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* --- S12: Polarized (High Contrast) --- */
const LayoutStreet12 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-[#ff3e00]" />
    {d.imageUrl && (
      <div className="absolute inset-0 mix-blend-multiply opacity-80">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale contrast-200 brightness-150" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      </div>
    )}
    <div className="absolute inset-0 p-10 flex flex-col text-white font-sans">
      <div className="border-t-[12px] border-white pt-6">
        <p className="text-[14px] font-black uppercase tracking-[0.4em] mb-4">World of Community Presence</p>
        <h1 className="text-[72px] font-black leading-[0.75] tracking-tighter uppercase italic break-words">
          {d.title}
        </h1>
      </div>
      <div className="mt-auto flex justify-between items-end border-b-[12px] border-white pb-6">
        <div className="space-y-1">
          <p className="text-[48px] font-black leading-none">{d.dateStr}</p>
          <p className="text-[16px] font-bold opacity-80 uppercase tracking-widest">{d.dayStr} {d.timeStr}</p>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-black uppercase mb-1">{d.venueName}</p>
          <p className="text-[12px] font-bold bg-white text-[#ff3e00] px-2 py-0.5 inline-block">{d.fee || "INVITATION ONLY"}</p>
        </div>
      </div>
    </div>
  </>
);

/* --- S13: Industrial (Mono/Tech) --- */
const LayoutStreet13 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-[#1a1a1a]" />
    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
    {d.imageUrl && (
      <div className="absolute top-[10%] right-[10%] left-[10%] h-[40%] border-2 border-white/20 overflow-hidden">
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale contrast-125" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-mono px-1 py-0.5 tracking-tighter">SOURCE_IMG.RAW</div>
      </div>
    )}
    <div className="absolute inset-0 p-10 flex flex-col font-mono text-white">
      <div className="mt-auto pt-[45%]">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-[1px] flex-1 bg-white/30" />
          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-white/50">Transmission Log</p>
        </div>
        <h1 className="text-[42px] font-black leading-none uppercase tracking-tight mb-8">
          {d.title}
        </h1>
        <div className="grid grid-cols-2 gap-4 border border-white/10 p-6 bg-white/5 backdrop-blur-md">
          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-bold opacity-30 uppercase mb-1">[ Date_Identifier ]</p>
              <p className="text-[16px] font-black">{d.dateStr} {d.dayStr}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold opacity-30 uppercase mb-1">[ Temporal_Range ]</p>
              <p className="text-[16px] font-black">{d.timeStr}</p>
            </div>
          </div>
          <div className="space-y-4 text-right">
            <div>
              <p className="text-[9px] font-bold opacity-30 uppercase mb-1">[ Localization ]</p>
              <p className="text-[16px] font-black uppercase">{d.venueName}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold opacity-30 uppercase mb-1">[ Entity_Host ]</p>
              <p className="text-[16px] font-black uppercase">{d.orgName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
);

/* --- S14: Underground (Culture) --- */
const LayoutStreet14 = ({ d }: { d: PosterData }) => (
  <>
    <div className="absolute inset-0 bg-black overflow-hidden" />
    <div className="absolute top-[-5%] left-[-5%] w-[110%] h-[110%] opacity-40 blur-2xl saturate-200 animate-pulse">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
    </div>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />
    <div className="absolute inset-0 flex flex-col p-12 font-sans overflow-hidden">
      <div className="absolute top-20 -left-10 text-[180px] font-black text-white opacity-[0.03] tracking-tighter leading-none select-none uppercase">
        {d.title}
      </div>
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-auto">
          <div className="w-12 h-12 bg-white flex items-center justify-center text-black font-black text-[20px]">W</div>
          <p className="text-white text-[12px] font-black tracking-[0.5em] uppercase vertical-rl rotate-180 opacity-40">Underground Culture</p>
        </div>
        <div className="mb-12">
          <h1 className="text-[58px] font-black text-white leading-[0.85] tracking-[-0.05em] uppercase mb-4 drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            {d.title}
          </h1>
          <div className="flex gap-3">
            <span className="bg-zinc-800 text-white px-3 py-1 text-[11px] font-black uppercase rounded-full">@{d.venueName}</span>
            <span className="bg-white text-black px-3 py-1 text-[11px] font-black uppercase rounded-full">{d.dateStr}</span>
          </div>
        </div>
        <div className="flex justify-between items-end border-t border-white/20 pt-8">
          <div>
            <p className="text-[10px] font-black uppercase text-white/30 mb-2 tracking-widest">Featured Selectors</p>
            <p className="text-[20px] font-black text-white uppercase italic">{d.djName || "Special Guests"}</p>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-black text-white">{d.timeStr}</p>
            <p className="text-[11px] font-bold text-white/50 uppercase">{d.fee || "Limited Entry"}</p>
          </div>
        </div>
      </div>
    </div>
  </>
);

/* --- C1: Clean Editorial (Reference Image) --- */
const LayoutClean1 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#f4f3f1] p-10 flex flex-col font-serif">
    {/* Top Bar */}
    <div className="flex justify-between items-center border-b border-black pb-2 mb-12">
      <p className="text-[10px] tracking-[0.2em] font-sans font-bold uppercase">{d.venueLocation || "SEOUL TANGO SOCIAL"}</p>
      <p className="text-[10px] tracking-[0.2em] font-sans font-bold">2026</p>
    </div>

    {/* Main Section */}
    <div className="flex gap-8 mb-12">
      <div className="flex-1 flex flex-col">
        <h1 className="text-[64px] font-bold text-black leading-[0.9] tracking-tight mb-2">
          {d.title}
        </h1>
        <h2 className="text-[56px] italic text-[#8b1d1d] leading-[0.9] tracking-tight">
          {d.titleNative || d.djName}
        </h2>
        <div className="w-10 h-[2px] bg-black my-8" />
        <p className="text-[14px] leading-relaxed text-black/70 max-w-[240px] font-sans">
          An evening of {d.title} in the heart of {d.venueLocation || "the city"}.
        </p>
      </div>
      <div className="w-[45%] aspect-square bg-gray-200 overflow-hidden shadow-lg">
        {d.imageUrl && (
          <img src={d.imageUrl} className="w-full h-full object-cover grayscale" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        )}
      </div>
    </div>

    {/* Info Grid */}
    <div className="mt-auto grid grid-cols-3 gap-y-8 border-t border-black/20 pt-8 font-sans">
      <div className="border-r border-black/10 pr-4">
        <p className="text-[9px] font-bold text-[#8b1d1d] uppercase tracking-widest mb-2">Date</p>
        <p className="text-[32px] font-bold leading-none">{d.dateStr} <span className="text-[14px] font-normal text-black/60">{d.dayStr}</span></p>
      </div>
      <div className="border-r border-black/10 px-4">
        <p className="text-[9px] font-bold text-[#8b1d1d] uppercase tracking-widest mb-2">Time</p>
        <p className="text-[20px] font-medium">{d.timeStr}</p>
      </div>
      <div className="pl-4">
        <p className="text-[9px] font-bold text-[#8b1d1d] uppercase tracking-widest mb-2">DJ</p>
        <p className="text-[24px] font-bold leading-none italic font-serif">{d.djName || "TBA"}</p>
      </div>
      
      <div className="border-r border-black/10 pr-4">
        <p className="text-[9px] font-bold text-[#8b1d1d] uppercase tracking-widest mb-2">Org</p>
        <p className="text-[16px] font-bold">{d.orgName}</p>
        <p className="text-[10px] text-black/40 mt-1">{d.orgPhone}</p>
      </div>
      <div className="border-r border-black/10 px-4">
        <p className="text-[9px] font-bold text-[#8b1d1d] uppercase tracking-widest mb-2">Venue</p>
        <p className="text-[16px] font-bold leading-tight">{d.venueName}</p>
        <p className="text-[10px] text-black/40 mt-1">{d.venueLocation}</p>
      </div>
      <div className="pl-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-full border border-black/20 flex items-center justify-center text-[10px] font-bold">W</div>
        <div className="text-[9px] font-bold uppercase tracking-tighter leading-tight">
          World of<br/>Community
        </div>
      </div>
    </div>
  </div>
);

/* --- C2: Clean Center (Balanced) --- */
const LayoutClean2 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-white p-12 flex flex-col items-center text-center font-serif">
    <div className="text-[10px] tracking-[0.5em] uppercase text-black/30 mb-8 font-sans font-black">
      Special Event • {d.dateStr}
    </div>
    
    <div className="w-full h-1/2 bg-gray-100 overflow-hidden mb-10 shadow-2xl">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover saturate-[0.8] contrast-110" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
    </div>

    <h1 className="text-[48px] font-bold text-black leading-tight tracking-tight mb-4 px-6">
      {d.title}
    </h1>
    <div className="w-12 h-[1px] bg-black/20 mb-6" />
    
    <div className="flex gap-10 font-sans text-[12px] font-bold tracking-widest uppercase text-black/60">
      <span>{d.venueName}</span>
      <span>•</span>
      <span>{d.timeStr}</span>
      <span>•</span>
      <span>DJ {d.djName || "TBA"}</span>
    </div>

    <div className="mt-auto pt-8 border-t border-black/5 w-full flex justify-between items-end font-sans">
      <div className="text-left">
        <p className="text-[9px] font-black uppercase text-black/20 mb-1">Organizer</p>
        <p className="text-[11px] font-bold text-black/40">{d.orgName}</p>
      </div>
      <div className="text-right">
        <p className="text-[9px] font-black uppercase text-black/20 mb-1">Entrance Fee</p>
        <p className="text-[11px] font-bold text-black/40">{d.fee || "FREE ACCESS"}</p>
      </div>
    </div>
  </div>
);

/* --- C3: Clean Vertical (Split) --- */
const LayoutClean3 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#fafafa] flex font-sans">
    <div className="w-[35%] bg-black text-white p-8 flex flex-col justify-between">
      <div className="rotate-90 origin-left translate-x-10 mt-10 whitespace-nowrap">
        <p className="text-[42px] font-black tracking-tighter opacity-10">TANGO SOCIAL</p>
      </div>
      <div className="space-y-8">
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase mb-2">When</p>
          <p className="text-[20px] font-black leading-none">{d.dateStr}</p>
          <p className="text-[14px] font-bold text-white/60">{d.dayStr}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-white/40 uppercase mb-2">Music</p>
          <p className="text-[18px] font-black">{d.djName || "Selection"}</p>
        </div>
      </div>
    </div>
    <div className="flex-1 p-10 flex flex-col">
      <div className="h-[60%] bg-gray-200 overflow-hidden mb-8">
        {d.imageUrl && (
          <img src={d.imageUrl} className="w-full h-full object-cover grayscale brightness-90" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        )}
      </div>
      <h1 className="text-[36px] font-black text-black leading-[0.9] tracking-tighter uppercase mb-4">
        {d.title}
      </h1>
      <p className="text-[13px] font-bold text-black/40 mb-auto">{d.timeStr} @ {d.venueName}</p>
      
      <div className="flex justify-between items-center border-t border-black/10 pt-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-black/30">{d.orgName}</p>
        <p className="text-[14px] font-black italic">{d.fee || "FREE"}</p>
      </div>
    </div>
  </div>
);

/* --- C4: Clean Dark (Night) --- */
const LayoutClean4 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#0f0f0f] text-white p-12 flex flex-col font-serif">
    <div className="absolute top-0 right-0 p-12 opacity-20">
      <div className="w-24 h-24 border border-white rounded-full flex items-center justify-center text-[10px] font-sans font-bold">2026</div>
    </div>
    
    <div className="mt-12 mb-8">
      <p className="text-[12px] font-sans font-bold tracking-[0.4em] uppercase text-[#d4af37] mb-4">The Night of Tango</p>
      <h1 className="text-[60px] font-bold leading-none tracking-tighter">
        {d.title}
      </h1>
    </div>

    <div className="flex-1 flex gap-8">
      <div className="flex-1 bg-zinc-900 overflow-hidden relative border border-white/5">
        {d.imageUrl && (
          <img src={d.imageUrl} className="w-full h-full object-cover contrast-125 brightness-75" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
      </div>
      <div className="w-[30%] flex flex-col justify-end space-y-6">
        <div>
          <p className="text-[9px] font-sans font-black uppercase tracking-widest text-white/30 mb-2">Date</p>
          <p className="text-[24px] font-bold leading-none">{d.dateStr}</p>
          <p className="text-[14px] font-sans font-bold text-white/50">{d.dayStr}</p>
        </div>
        <div>
          <p className="text-[9px] font-sans font-black uppercase tracking-widest text-white/30 mb-2">DJ Set</p>
          <p className="text-[18px] font-bold italic text-[#d4af37]">{d.djName || "TBA"}</p>
        </div>
      </div>
    </div>

    <div className="mt-12 flex justify-between items-end border-t border-white/10 pt-8 font-sans">
      <div>
        <p className="text-[14px] font-bold text-white/80">{d.venueName}</p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">{d.venueLocation}</p>
      </div>
      <div className="text-right">
        <p className="text-[12px] font-bold text-[#d4af37]">{d.timeStr}</p>
        <p className="text-[10px] text-white/40 mt-1">{d.fee || "INVITATION ONLY"}</p>
      </div>
    </div>
  </div>
);

/* --- C5: Clean Minimal (Gallery) --- */
const LayoutClean5 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-white p-6 flex flex-col font-sans">
    <div className="border border-black flex-1 flex flex-col p-10 relative">
      <div className="flex justify-between items-start mb-12">
        <h1 className="text-[32px] font-black tracking-tighter leading-none uppercase max-w-[200px]">
          {d.title}
        </h1>
        <div className="text-right">
          <p className="text-[14px] font-black">{d.dateStr}</p>
          <p className="text-[10px] font-bold opacity-30">{d.dayStr}</p>
        </div>
      </div>

      <div className="flex-1 bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full h-full relative overflow-hidden shadow-sm">
           {d.imageUrl && (
            <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-8">
        <div>
          <p className="text-[8px] font-black uppercase tracking-widest mb-3 opacity-20">Information</p>
          <p className="text-[13px] font-bold leading-snug">
            Featuring music by {d.djName || "special selectors"} and hosted by {d.orgName}.
          </p>
        </div>
        <div className="text-right flex flex-col justify-end">
          <p className="text-[14px] font-black italic">{d.venueName}</p>
          <p className="text-[10px] font-bold opacity-40">{d.timeStr}</p>
        </div>
      </div>

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-black" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-black" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-black" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-black" />
    </div>
  </div>
);

/* --- C6: Clean Typographic (Statement) --- */
const LayoutClean6 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-white flex flex-col font-sans overflow-hidden">
    <div className="absolute inset-0 opacity-10">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover grayscale scale-110 blur-sm" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
    </div>
    <div className="relative z-10 flex-1 p-12 flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[10px] font-black tracking-[0.3em] uppercase">{d.venueLocation || "Special Edition"}</p>
        <p className="text-[10px] font-black">EST. 2026</p>
      </div>
      
      <div className="mt-12">
        <h1 className="text-[84px] font-black leading-[0.8] tracking-tighter uppercase break-words">
          {d.title}
        </h1>
        <div className="mt-8 flex items-center gap-4">
          <div className="h-[2px] w-12 bg-black" />
          <p className="text-[14px] font-bold italic serif uppercase">{d.djName || "TBA"}</p>
        </div>
      </div>

      <div className="mt-auto flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-[42px] font-black leading-none">{d.dateStr}</p>
          <p className="text-[14px] font-bold opacity-40 uppercase tracking-widest">{d.dayStr} {d.timeStr}</p>
        </div>
        <div className="text-right max-w-[200px]">
          <p className="text-[14px] font-black uppercase mb-1">{d.venueName}</p>
          <p className="text-[10px] font-medium opacity-50">{d.fee || "By Registration"}</p>
        </div>
      </div>
    </div>
  </div>
);

/* --- C7: Clean Grid (Structured) --- */
const LayoutClean7 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#f8f8f8] p-8 font-sans">
    <div className="w-full h-full border border-black/10 flex flex-col">
      <div className="grid grid-cols-2 border-b border-black/10">
        <div className="p-6 border-r border-black/10">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1">Title</p>
          <h1 className="text-[28px] font-black leading-tight uppercase">{d.title}</h1>
        </div>
        <div className="p-6">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1">Artist</p>
          <p className="text-[24px] font-bold italic">{d.djName || d.orgName}</p>
        </div>
      </div>
      
      <div className="flex-1 flex border-b border-black/10">
        <div className="w-[60%] p-6 relative overflow-hidden bg-white">
          {d.imageUrl && (
            <img src={d.imageUrl} className="w-full h-full object-cover contrast-110 grayscale" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-6 border-b border-black/10">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-4">Date</p>
            <p className="text-[40px] font-black leading-none">{d.dateStr}</p>
            <p className="text-[14px] font-bold mt-1">{d.dayStr}</p>
          </div>
          <div className="flex-1 p-6">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-4">Time</p>
            <p className="text-[20px] font-bold">{d.timeStr}</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex justify-between items-center bg-white">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest opacity-20 mb-1">Location</p>
          <p className="text-[14px] font-bold">{d.venueName}, {d.venueLocation}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black italic">{d.fee || "₩0"}</p>
        </div>
      </div>
    </div>
  </div>
);

/* --- C8: Clean Soft (Elegant) --- */
const LayoutClean8 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#fdfcf9] p-10 flex flex-col font-serif">
    <div className="text-center mb-10">
      <p className="text-[11px] font-sans font-bold tracking-[0.5em] uppercase text-amber-900/40 mb-4">World of Community Presence</p>
      <h1 className="text-[44px] italic font-medium text-[#2d2d2d] leading-tight">
        {d.title}
      </h1>
    </div>

    <div className="flex-1 relative mb-10">
      <div className="absolute inset-0 rounded-[40px] overflow-hidden shadow-2xl shadow-amber-900/10 border-[12px] border-white">
        {d.imageUrl && (
          <img src={d.imageUrl} className="w-full h-full object-cover saturate-[0.7]" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        )}
      </div>
    </div>

    <div className="grid grid-cols-3 gap-8 font-sans items-center">
      <div className="text-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-amber-900/30 mb-1">When</p>
        <p className="text-[14px] font-bold text-zinc-800">{d.dateStr} {d.dayStr}</p>
      </div>
      <div className="text-center flex justify-center">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-[10px] font-black text-amber-900/40 border border-amber-100">WoC</div>
      </div>
      <div className="text-center">
        <p className="text-[9px] font-black uppercase tracking-widest text-amber-900/30 mb-1">Where</p>
        <p className="text-[14px] font-bold text-zinc-800">{d.venueName}</p>
      </div>
    </div>
  </div>
);

/* --- C9: Clean Modern (Asymmetric) --- */
const LayoutClean9 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#1a1a1a] flex font-sans overflow-hidden">
    <div className="w-[45%] h-full relative">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover contrast-125 saturate-0" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-10 left-10 text-white vertical-rl rotate-180 flex items-center gap-4">
        <div className="w-[1px] h-20 bg-white/30" />
        <p className="text-[10px] font-black tracking-[0.4em] uppercase opacity-50">Modern Perspective</p>
      </div>
    </div>
    
    <div className="flex-1 p-12 flex flex-col text-white">
      <div className="text-right mb-12">
        <p className="text-[56px] font-black leading-[0.85] tracking-tighter uppercase break-words">
          {d.title}
        </p>
      </div>

      <div className="mt-auto space-y-10">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[32px] font-black leading-none">{d.dateStr}</p>
            <p className="text-[12px] font-bold text-white/40 mt-1 uppercase">{d.dayStr} {d.timeStr}</p>
          </div>
          <div className="text-right">
            <p className="text-[14px] font-bold uppercase tracking-widest">{d.djName || "SELECTORS"}</p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[16px] font-black uppercase">{d.venueName}</p>
              <p className="text-[10px] opacity-40 uppercase tracking-widest">{d.venueLocation}</p>
            </div>
            <p className="text-[12px] font-black italic">{d.fee || "JOIN US"}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* --- C10: Clean Classic (Magazine) --- */
const LayoutClean10 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-white p-6 font-serif">
    <div className="w-full h-full border border-black p-10 flex flex-col relative">
      <div className="text-center mb-8">
        <div className="flex justify-center gap-10 text-[10px] font-sans font-black tracking-[0.3em] uppercase opacity-30 mb-6">
          <span>{d.venueLocation || "CITY GUIDE"}</span>
          <span>•</span>
          <span>{d.dateStr} EDITION</span>
          <span>•</span>
          <span>VOL. 01</span>
        </div>
        <h1 className="text-[64px] font-bold text-black leading-none tracking-tight">
          {d.title}
        </h1>
      </div>

      <div className="flex-1 bg-zinc-100 overflow-hidden shadow-inner">
        {d.imageUrl && (
          <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        )}
      </div>

      <div className="mt-8 flex justify-between items-center font-sans">
        <div>
          <p className="text-[20px] font-black leading-tight uppercase">{d.venueName}</p>
          <p className="text-[12px] font-bold opacity-40">{d.timeStr}</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-black italic uppercase tracking-tighter">Guest List Only</p>
          <p className="text-[10px] font-bold opacity-40">{d.fee || "MEMBERS ONLY"}</p>
        </div>
      </div>

      <div className="absolute top-1/2 -right-4 -translate-y-1/2 rotate-90">
        <p className="text-[10px] font-sans font-black tracking-widest text-black/10 uppercase whitespace-nowrap">WORLD OF COMMUNITY MAGAZINE 2026</p>
      </div>
    </div>
  </div>
);


/* --- C11: Clean Zen (Minimal) --- */
const LayoutClean11 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#f9f9f9] p-16 flex flex-col items-center justify-center font-sans overflow-hidden">
    <div className="w-[80%] h-[60%] relative mb-12 group">
      <div className="absolute -inset-4 border border-black/5 rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-all duration-700" />
      <div className="w-full h-full rounded-full overflow-hidden border-[8px] border-white shadow-xl relative z-10">
        {d.imageUrl && (
          <img src={d.imageUrl} className="w-full h-full object-cover grayscale brightness-105 contrast-90" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        )}
      </div>
    </div>
    <div className="text-center space-y-4 relative z-10">
      <p className="text-[10px] font-black tracking-[0.6em] uppercase text-black/20">The Art of Silence</p>
      <h1 className="text-[42px] font-light tracking-widest uppercase text-black/80">{d.title}</h1>
      <div className="flex items-center justify-center gap-6 pt-4">
        <div className="h-[1px] w-8 bg-black/10" />
        <p className="text-[12px] font-bold tracking-widest text-black/40">{d.dateStr} • {d.venueName}</p>
        <div className="h-[1px] w-8 bg-black/10" />
      </div>
    </div>
  </div>
);

/* --- C12: Clean Fashion (High-end) --- */
const LayoutClean12 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-white flex flex-col font-serif overflow-hidden">
    <div className="h-[70%] relative">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover contrast-110 saturate-[0.8]" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-transparent to-white" />
      <div className="absolute top-12 left-12">
        <p className="text-white text-[14px] font-sans font-black tracking-[0.3em] uppercase opacity-80">Collection 2026</p>
      </div>
    </div>
    <div className="flex-1 px-12 pb-12 flex flex-col">
      <div className="mt-[-60px] relative z-10">
        <h1 className="text-[82px] font-bold text-black leading-[0.8] tracking-tighter uppercase mb-6 drop-shadow-[0_4px_10px_rgba(255,255,255,0.8)]">
          {d.title}
        </h1>
        <div className="grid grid-cols-2 gap-12 font-sans">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-2">Music Direction</p>
            <p className="text-[18px] font-bold italic">{d.djName || "Special Curator"}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black uppercase tracking-widest text-black/20 mb-2">Location / Time</p>
            <p className="text-[16px] font-black uppercase">{d.venueName}</p>
            <p className="text-[12px] font-bold opacity-40">{d.timeStr} • {d.dateStr}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* --- C13: Clean Architectural (Structural) --- */
const LayoutClean13 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-[#ebebeb] p-4 font-sans overflow-hidden">
    <div className="w-full h-full border-[1px] border-black/10 flex">
      <div className="w-20 border-r border-black/10 flex flex-col justify-between p-6 bg-white/50">
        <p className="text-[10px] font-black vertical-rl rotate-180 uppercase tracking-widest opacity-20">Structure_01</p>
        <div className="w-8 h-8 bg-black flex items-center justify-center text-white text-[12px] font-black">W</div>
      </div>
      <div className="flex-1 flex flex-col">
        <div className="h-[45%] p-8 flex flex-col justify-center">
          <h1 className="text-[54px] font-black leading-[0.9] tracking-tighter uppercase mb-4">
            {d.title}
          </h1>
          <p className="text-[14px] font-bold opacity-40 max-w-[300px]">Systematic approach to community gathering and spatial interaction.</p>
        </div>
        <div className="flex-1 flex border-t border-black/10">
          <div className="flex-1 p-8 border-r border-black/10 relative overflow-hidden bg-white">
            {d.imageUrl && (
              <img src={d.imageUrl} className="w-full h-full object-cover grayscale contrast-125 brightness-110" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
            )}
          </div>
          <div className="w-[40%] p-8 flex flex-col justify-between bg-zinc-50">
            <div className="space-y-6">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-20 mb-2">Temporal</p>
                <p className="text-[18px] font-black">{d.dateStr}</p>
                <p className="text-[11px] font-bold opacity-40">{d.dayStr} {d.timeStr}</p>
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-20 mb-2">Spatial</p>
                <p className="text-[14px] font-black uppercase">{d.venueName}</p>
              </div>
            </div>
            <div className="pt-6 border-t border-black/5">
              <p className="text-[12px] font-black italic">{d.fee || "Registered"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* --- C14: Clean Glow (Emotional) --- */
const LayoutClean14 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-black text-white font-sans overflow-hidden">
    <div className="absolute inset-0 opacity-60">
      {d.imageUrl && (
        <img src={d.imageUrl} className="w-full h-full object-cover blur-md scale-110" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
      )}
    </div>
    <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-transparent" />
    <div className="relative h-full p-16 flex flex-col">
      <div className="mb-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-[1px] bg-white/20" />
          <p className="text-[10px] font-black tracking-[0.5em] uppercase text-white/40">Evening Mood</p>
        </div>
        <h1 className="text-[72px] font-black leading-none tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">
          {d.title}
        </h1>
        <p className="text-[18px] font-bold italic text-white/60">Music by {d.djName || "Deep Selectors"}</p>
      </div>
      
      <div className="mt-auto flex justify-between items-end">
        <div className="space-y-2">
          <p className="text-[48px] font-black leading-none">{d.dateStr}</p>
          <div className="flex gap-4 items-center">
            <span className="text-[14px] font-bold text-white/40 uppercase tracking-widest">{d.dayStr}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <span className="text-[14px] font-bold text-white/40 uppercase tracking-widest">{d.timeStr}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[20px] font-black uppercase mb-1">{d.venueName}</p>
          <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">{d.venueLocation}</p>
        </div>
      </div>
    </div>
  </div>
);

/* --- C15: Clean Bold (Modern) --- */
const LayoutClean15 = ({ d }: { d: PosterData }) => (
  <div className="absolute inset-0 bg-white flex flex-col font-sans overflow-hidden">
    <div className="p-8 border-b-[20px] border-black flex justify-between items-end">
      <h1 className="text-[52px] font-black leading-[0.8] tracking-tighter uppercase">
        {d.title.split(' ').map((word, i) => (
          <span key={i} className="block">{word}</span>
        ))}
      </h1>
      <div className="text-right">
        <p className="text-[14px] font-black leading-none mb-1">{d.dateStr}</p>
        <p className="text-[10px] font-bold opacity-30 uppercase">{d.dayStr}</p>
      </div>
    </div>
    <div className="flex-1 flex">
      <div className="w-1/2 border-r-[20px] border-black p-8 flex flex-col justify-between">
        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-black uppercase mb-2 tracking-widest">Event_Identity</p>
            <p className="text-[18px] font-black uppercase leading-tight">{d.orgName}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase mb-2 tracking-widest">Artist_Profile</p>
            <p className="text-[18px] font-black uppercase leading-tight">{d.djName || "TBA"}</p>
          </div>
        </div>
        <div className="text-[80px] font-black opacity-5 leading-none -ml-4 select-none">
          WoC
        </div>
      </div>
      <div className="flex-1 relative bg-zinc-100">
        {d.imageUrl && (
          <img src={d.imageUrl} className="w-full h-full object-cover" alt="" crossOrigin="anonymous" loading="eager" decoding="sync" />
        )}
        <div className="absolute bottom-8 right-8 bg-black text-white p-6 min-w-[160px]">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Location</p>
          <p className="text-[16px] font-black uppercase leading-tight mb-4">{d.venueName}</p>
          <p className="text-[12px] font-bold italic">{d.timeStr}</p>
        </div>
      </div>
    </div>
  </div>
);

export const POSTER_LAYOUTS: { id: string; name: string; Component: React.FC<{ d: PosterData }> }[] = [
  { id: "none", name: "None", Component: LayoutNone },
  { id: "classic", name: "Classic", Component: LayoutClassic },
  { id: "center", name: "Center", Component: LayoutCenter },
  { id: "bottom", name: "Bottom", Component: LayoutBottom },
  { id: "minimal", name: "Minimal", Component: LayoutMinimal },
  { id: "leftpanel", name: "Left Panel", Component: LayoutLeftPanel },
  { id: "rightpanel", name: "Right Panel", Component: LayoutRightPanel },
  { id: "ticket", name: "Ticket", Component: LayoutTicket },
  { id: "magazine", name: "Magazine", Component: LayoutMagazine },
  { id: "elegant", name: "Elegant", Component: LayoutElegant },
  { id: "boldtype", name: "Bold Type", Component: LayoutBoldType },
  { id: "corners", name: "Corners", Component: LayoutCorners },
  { id: "cinematic", name: "Cinematic", Component: LayoutCinematic },
  { id: "diagonal", name: "Diagonal", Component: LayoutDiagonal },
  { id: "neon", name: "Neon", Component: LayoutNeon },
  { id: "gradientwash", name: "Gradient", Component: LayoutGradientWash },
  { id: "vertical", name: "Vertical", Component: LayoutVertical },
  { id: "compact", name: "Compact", Component: LayoutCompact },
  { id: "split", name: "Split", Component: LayoutSplit },
  { id: "frame", name: "Frame", Component: LayoutFrame },
  { id: "editorial", name: "Editorial", Component: LayoutEditorial },
  { id: "editorial-left", name: "Editorial Left", Component: LayoutEditorialLeft },
  { id: "editorial-top", name: "Editorial Top", Component: LayoutEditorialTop },
  { id: "editorial-bottom", name: "Editorial Bottom", Component: LayoutEditorialBottom },
  { id: "editorial-quarter", name: "Editorial Quarter", Component: LayoutEditorialQuarter },
  { id: "editorial-strip", name: "Editorial Strip", Component: LayoutEditorialStrip },
  { id: "gallery", name: "Gallery", Component: LayoutGallery },
  { id: "gallery-dark", name: "Gallery Dark", Component: LayoutGalleryDark },
  { id: "gallery-left", name: "Gallery Left", Component: LayoutGalleryLeft },
  { id: "gallery-minimal", name: "Gallery Minimal", Component: LayoutGalleryMinimal },
  { id: "gallery-border", name: "Gallery Border", Component: LayoutGalleryBorder },
  { id: "gallery-mono", name: "Gallery Mono", Component: LayoutGalleryMono },
  { id: "street-1", name: "Street Original", Component: LayoutStreet1 },
  { id: "street-2", name: "Highlight", Component: LayoutStreet2 },
  { id: "street-3", name: "Collage", Component: LayoutStreet3 },
  { id: "street-4", name: "Raw", Component: LayoutStreet4 },
  { id: "street-5", name: "Tape", Component: LayoutStreet5 },
  { id: "street-6", name: "Stencil", Component: LayoutStreet6 },
  { id: "street-7", name: "Brutalist", Component: LayoutStreet7 },
  { id: "street-8", name: "Flash", Component: LayoutStreet8 },
  { id: "street-9", name: "Cyber", Component: LayoutStreet9 },
  { id: "street-10", name: "Glitch", Component: LayoutStreet10 },
  { id: "street-11", name: "Graffiti", Component: LayoutStreet11 },
  { id: "street-12", name: "Polarized", Component: LayoutStreet12 },
  { id: "street-13", name: "Industrial", Component: LayoutStreet13 },
  { id: "street-14", name: "Underground", Component: LayoutStreet14 },
  { id: "clean-1", name: "Clean Editorial", Component: LayoutClean1 },
  { id: "clean-2", name: "Clean Balanced", Component: LayoutClean2 },
  { id: "clean-3", name: "Clean Split", Component: LayoutClean3 },
  { id: "clean-4", name: "Clean Night", Component: LayoutClean4 },
  { id: "clean-5", name: "Clean Gallery", Component: LayoutClean5 },
  { id: "clean-6", name: "Clean Statement", Component: LayoutClean6 },
  { id: "clean-7", name: "Clean Structured", Component: LayoutClean7 },
  { id: "clean-8", name: "Clean Elegant", Component: LayoutClean8 },
  { id: "clean-9", name: "Clean Modern", Component: LayoutClean9 },
  { id: "clean-10", name: "Clean Magazine", Component: LayoutClean10 },
  { id: "clean-11", name: "Clean Zen", Component: LayoutClean11 },
  { id: "clean-12", name: "Clean Fashion", Component: LayoutClean12 },
  { id: "clean-13", name: "Clean Architectural", Component: LayoutClean13 },
  { id: "clean-14", name: "Clean Glow", Component: LayoutClean14 },
  { id: "clean-15", name: "Clean Bold", Component: LayoutClean15 },
];

