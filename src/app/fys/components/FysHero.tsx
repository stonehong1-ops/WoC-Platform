import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface FysHeroProps {
  onOpenPoster: (lang: "ko" | "en") => void;
}

export default function FysHero({ onOpenPoster }: FysHeroProps) {
  return (
    <div className="relative w-full bg-white pt-6 pb-4 px-4 border-b border-gray-100 space-y-4">
      {/* 타이틀 및 포스터 아이콘 */}
      <div className="flex justify-between items-start">
        <div className="space-y-1.5 flex-1 pr-2">
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900 leading-tight">
            Fausto Carpino &<br /> Stephanie Fesneau
          </h1>
          <div className="h-px bg-gray-200 w-12 my-1" />
          <h2 className="text-base font-bold text-blue-600 tracking-wide uppercase">
            Seoul Workshop 2026
          </h2>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => onOpenPoster("ko")}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors border border-blue-200"
          >
            <span className="material-symbols-rounded text-xs">image</span>
            한글 포스터
          </button>
          <button
            onClick={() => onOpenPoster("en")}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors border border-purple-200"
          >
            <span className="material-symbols-rounded text-xs">image</span>
            Poster (EN)
          </button>
        </div>
      </div>
      
      {/* 일시 및 장소 정보 */}
      <div className="text-[11px] text-gray-500 space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-rounded text-gray-400 text-xs">calendar_today</span>
          <span className="font-semibold">2026.09.01 Tue – 09.07 Mon</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-rounded text-gray-400 text-xs">location_on</span>
          <span>프리스타일 스튜디오 (합정동 386-37) / Freestyle Studio</span>
        </div>
      </div>

      {/* 신청내역 확인 바로가기 버튼 */}
      <div className="pt-0.5">
        <Link
          href="/fys/check"
          className="flex items-center justify-center gap-1.5 w-full py-2.5 px-4 text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all shadow-sm active:scale-[0.99]"
        >
          <span className="material-symbols-rounded text-sm text-gray-400">search</span>
          기존신청자 확인
        </Link>
      </div>

      {/* 수퍼얼리버드 하이라이트 문구 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-3.5 rounded-xl space-y-0.5 shadow-sm">
        <p className="text-xs font-black flex items-center gap-1">
          <span className="material-symbols-rounded text-sm text-yellow-300 animate-pulse">emergency_home</span>
          7월 15일까지는 수퍼얼리버드 신청 기간입니다.
        </p>
        <p className="text-[10px] text-blue-100 font-medium leading-none">
          Super Early Bird registration is open until July 15.
        </p>
        <p className="text-[10px] text-yellow-200 font-bold pt-1">
          * 가격은 신청 시점에 따라 자동 계산됩니다. / Calculated automatically.
        </p>
      </div>
    </div>
  );
}
