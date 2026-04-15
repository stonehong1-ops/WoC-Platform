"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Tango', 'Salsa']);

  const interests = [
    { name: 'Tango', icon: 'theater_comedy', color: 'bg-orange-100 text-orange-600' },
    { name: 'Salsa', icon: 'flare', color: 'bg-blue-100 text-blue-600' },
    { name: 'Yoga', icon: 'self_improvement', color: 'bg-green-100 text-green-600' },
    { name: 'Hiking', icon: 'terrain', color: 'bg-emerald-100 text-emerald-600' },
    { name: 'Cooking', icon: 'restaurant', color: 'bg-yellow-100 text-yellow-600' },
    { name: 'Coding', icon: 'code', color: 'bg-gray-100 text-gray-600' },
    { name: 'Tennis', icon: 'sports_tennis', color: 'bg-lime-100 text-lime-600' },
    { name: 'Wine', icon: 'wine_bar', color: 'bg-red-100 text-red-600' },
  ];

  const toggleInterest = (name: string) => {
    if (selectedInterests.includes(name)) {
      setSelectedInterests(selectedInterests.filter(i => i !== name));
    } else {
      setSelectedInterests([...selectedInterests, name]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2">
          <span className="material-symbols-outlined text-2xl">arrow_back</span>
        </Link>
        <div className="flex gap-1">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`w-8 h-1 rounded-full transition-colors ${s <= step ? 'bg-[#005BC0]' : 'bg-gray-100'}`}
            ></div>
          ))}
        </div>
        <div className="w-10"></div> {/* Spacer */}
      </div>

      <div className="px-6 pb-24">
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-extrabold font-manrope mb-2">Welcome to WoC</h1>
            <p className="text-gray-500 mb-8">Join the global network of passionate communities.</p>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block px-1">Email or Phone</label>
                <input 
                  type="text" 
                  placeholder="name@example.com" 
                  className="w-full px-4 py-4 bg-[#f8f9fa] border-none rounded-2xl focus:ring-2 focus:ring-[#005BC0] font-medium"
                />
              </div>
              <button 
                onClick={() => setStep(2)}
                className="w-full py-4 bg-[#005BC0] text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-transform active:scale-95"
              >
                Send Verification Code
              </button>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-px bg-gray-100 flex-1"></div>
              <span className="text-xs font-bold text-gray-300">OR CONTINUE WITH</span>
              <div className="h-px bg-gray-100 flex-1"></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center gap-2 py-4 border border-gray-100 rounded-2xl font-bold text-sm">
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Google
              </button>
              <button className="flex items-center justify-center gap-2 py-4 border border-gray-100 rounded-2xl font-bold text-sm bg-black text-white border-black">
                <span className="material-symbols-outlined text-lg">apple</span>
                Apple
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-extrabold font-manrope mb-2">What's your vibe?</h1>
            <p className="text-gray-500 mb-8">Select at least 3 interests to personalize your feed.</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {interests.map((interest) => (
                <button
                  key={interest.name}
                  onClick={() => toggleInterest(interest.name)}
                  className={`p-4 rounded-3xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedInterests.includes(interest.name)
                      ? 'border-[#005BC0] bg-blue-50/30'
                      : 'border-gray-50 bg-[#f8f9fa]'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${interest.color}`}>
                    <span className="material-symbols-outlined text-2xl">{interest.icon}</span>
                  </div>
                  <span className="font-bold text-sm">{interest.name}</span>
                </button>
              ))}
            </div>

            {/* Featured Interest Highlight */}
            <div className="bg-black rounded-3xl p-6 text-white mb-8 overflow-hidden relative">
              <div className="relative z-10">
                <span className="px-2 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase mb-2 inline-block">Trending Community</span>
                <h3 className="text-xl font-bold mb-1">Hongdae Tango Scene</h3>
                <p className="text-sm text-gray-400 mb-4">Discover the heartbeat of Seoul's nightlife through movement.</p>
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <img key={i} src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-8 h-8 rounded-full border-2 border-black" alt="" />
                  ))}
                  <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center text-[10px] font-bold">+120</div>
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 opacity-20 transform translate-x-8 -translate-y-8">
                <span className="material-symbols-outlined text-[120px]">theater_comedy</span>
              </div>
            </div>

            <button 
              onClick={() => setStep(3)}
              disabled={selectedInterests.length < 3}
              className={`w-full py-4 rounded-2xl font-bold transition-all ${
                selectedInterests.length >= 3
                  ? 'bg-[#005BC0] text-white shadow-lg shadow-blue-100 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Continue ({selectedInterests.length}/3)
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-in fade-in scale-95 duration-500 text-center py-12">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
            </div>
            <h1 className="text-3xl font-extrabold font-manrope mb-2">You're all set!</h1>
            <p className="text-gray-500 mb-8 px-8">Your profile has been created. Ready to dive into the world of communities?</p>
            
            <Link 
              href="/"
              className="w-full py-4 bg-black text-white rounded-2xl font-bold inline-block active:scale-95 transition-transform"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
