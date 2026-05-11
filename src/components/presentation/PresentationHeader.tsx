import React from 'react';

const PresentationHeader = () => {
  return (
    <header className="absolute top-0 left-0 w-full z-50 flex justify-between items-center px-[60px] lg:px-[80px] py-[24px] bg-transparent">
      <div className="flex items-center">
        <span className="font-['Geist'] text-[12px] leading-[1.5] tracking-[0.15em] font-medium text-[#444748]/60 uppercase">World of Community 2026</span>
      </div>
      <div className="flex items-center">
        <span className="font-['Space_Grotesk'] text-[18px] leading-[1.6] font-bold tracking-[0.2em] text-[#1c1b1b]">WoC</span>
      </div>
      <div className="flex items-center">
        <span className="font-['Geist'] text-[12px] leading-[1.5] tracking-[0.15em] font-medium text-[#444748]/60 uppercase">Confidential</span>
      </div>
    </header>
  );
};

export default PresentationHeader;
