'use client';

import React from 'react';

export default function ChatPage() {
  return (
    <main className="max-w-2xl mx-auto min-h-screen pb-24">
      {/* Search & Filter Bar */}
      <div className="px-4 py-3 sticky top-16 bg-[#F9F9F9]/80 backdrop-blur-md z-10">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-500 text-lg">search</span>
          </div>
          <input
            className="block w-full pl-10 pr-3 py-2.5 bg-gray-100 border-none rounded-full text-sm placeholder:text-gray-500 focus:ring-2 focus:ring-[#005bc0]/20 transition-all outline-none"
            placeholder="Search messages"
            type="text"
          />
        </div>
      </div>

      {/* Scrollable Body Content */}
      <div className="space-y-1">
        {/* 1. Notice Item */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors group">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
              <span 
                className="material-symbols-outlined text-[#9f403d] text-3xl" 
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                report_gmailerrorred
              </span>
            </div>
          </div>
          <div className="ml-4 flex-1 text-left">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-extrabold text-[15px] text-gray-900">Admin Notice</h3>
              <span className="text-xs text-gray-500">Just now</span>
            </div>
            <p className="text-sm font-semibold text-[#9f403d] line-clamp-1 mt-0.5">Your subscription is about to expire. Renew now to avoid interruption.</p>
          </div>
        </button>

        {/* 2. Freestyle Chat */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-[#005bc0]/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-[#005bc0] text-3xl">auto_awesome</span>
            </div>
          </div>
          <div className="ml-4 flex-1 text-left border-b border-gray-100 pb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-bold text-[15px] text-gray-900">Open chat (Freestyle tango)</h3>
              <span className="text-xs text-gray-500">2m</span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">I can help you draft a response to Sarah's last message.</p>
          </div>
        </button>

        {/* 3. Group Chat: Project Tango Team */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors">
          <div className="relative flex-shrink-0 w-14 h-14">
            {/* Overlapping Avatars */}
            <img 
              className="absolute top-0 right-0 w-9 h-9 rounded-full border-2 border-white z-10 object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuApp6fGD9_YwgFQ-qkqzfNJszhqpZJ916vFYWWoZt5uugQzo6zrSQS04XU2Fyr3uiXfMuTdXrWCRoNpSjfvN9lSXDB5ywvkWQvX34cv6MdC9kSdCFlzplwTx4PZw4HCSMbeyVtlytNiaLZoj1g3AlGBulL4djw5hE2C1aT_9Kce98GeWME7sX9yupQz8CUIkwZ0oOOEIwvwL6MQqNaSdKz7TrHRt3potaPyqYH4SzGvDrUAX2f29TYQRhjUJ0KtbYe7qTMMeGpvbm_6" 
              alt="Team member"
            />
            <img 
              className="absolute bottom-0 left-0 w-9 h-9 rounded-full border-2 border-white z-0 object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTuB0Y_yWZ_WGcZwvNiD8S6BPKaGtvKWv-hS6h1rr4y4sYJtvFnSV1BD3fS33HM48l3lbCfm6KGJJLRfW7jZBN8PNtL53KwWn9mlQWhA-BVXu9i1AfdHx0O5aTM-0BrJd_fN6NIAGm4DEwQweJC7UcXrfOxWq4rnFpAK5tsCuiIUw83Gw1DlibP-mUahEgK5efo3zm1ZuyrOoBVTATt2mfDSN0qqz6Qn8my_R9RK_hODm2bso7hc-OKJu4Zf7pT02_zHs8z6ts1jVN" 
              alt="Team member"
            />
          </div>
          <div className="ml-4 flex-1 text-left border-b border-gray-100 pb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-bold text-[15px] text-gray-900 line-clamp-1">Project Tango Team</h3>
              <span className="text-xs text-gray-500">15m</span>
            </div>
            <div className="flex items-center mt-0.5">
              <span className="text-sm font-semibold text-gray-900 mr-1">Alex:</span>
              <p className="text-sm text-gray-500 line-clamp-1">The final designs are ready for review!</p>
            </div>
          </div>
        </button>

        {/* 4. Marcus Chen */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors">
          <div className="relative flex-shrink-0">
            <img 
              className="w-14 h-14 rounded-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbcCicpnrasWMWGy48UjB0CeLGPpz4eOKeKNJkOY6DZ6pJf41cOE_z51ZpjuJSHFbIT-KMUqBrgyYJgSEnG1yiGyUan7ej8tjanbq4fQ68TroyIyOcYWlxdhCtPnswzdP1fKGAyXyApaRouVUgXSRGklKirCuUvKfjr0wQhHh8gwFY1xx6dZdnKX-9ERdR_6lfDam6aXhAOVprKNBkiSmuLQI2FmdETHJGO8tCaw7cWMuz2wWxNv6-6XQu1QpoXaBvj1HmKE-Yl-jq" 
              alt="Marcus Chen"
            />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="ml-4 flex-1 text-left border-b border-gray-100 pb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-bold text-[15px] text-gray-900">Marcus Chen</h3>
              <span className="text-xs text-gray-500">1h</span>
            </div>
            <p className="text-sm font-bold text-gray-900 line-clamp-1 mt-0.5">Are we still on for the meeting at 4 PM today?</p>
          </div>
        </button>

        {/* 5. Elena Rodriguez */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors">
          <div className="relative flex-shrink-0">
            <img 
              className="w-14 h-14 rounded-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC2MNjO1H4YB_XUbZc75vX0NUPiSYY6QNGu1W8Mhf7AIb1WAV32lKevG_1IK8JD9QqJTd57JtVb1MQ5V_mhZmtmLEISytz4NUW7pvPk1FyXH_CWzmTOz5v6KLiBQVua2FmHpCntK4xvw4hgEn50-k9ysM-dryTwRUmmVcLem4N46ep1uqAWujxw6Y5ifVfryDtqbC7ad_gKcD7dutU6ITBguIjs5R_RzClB_TSRLDFKQUCUS8k5cpuZxY6ru2OwDGqmkfYgl2iYgvl7" 
              alt="Elena"
            />
          </div>
          <div className="ml-4 flex-1 text-left border-b border-gray-100 pb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-bold text-[15px] text-gray-900">Elena Rodriguez</h3>
              <span className="text-xs text-gray-500">3h</span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">Thanks for sending over those files. I'll check them out.</p>
          </div>
        </button>

        {/* 6. Jordan Smith */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors">
          <div className="relative flex-shrink-0">
            <img 
              className="w-14 h-14 rounded-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwuE-aZBL8x4s3tRh0QXsPy-OhLle_5AxcDVY5gbiu8SsCXoAijeWQXzyYtcwwcR7tZgWlZqdAuVvWIiaw8ti12ntlVPmM03ZlIGk0L7NTvdZSYBriXA-f1nn_u_6EHuilYyCXEK1KFSbQokdDVCjTxVrxAxau3rU58fAQaaRKvkdFf8fsrOeLwyBFnjoxRDsUjWRx5Mkloscs48_Eyc2THonJODKz8L8VXZ73myzB_DMS2MCh1pLa9Nt-aDuXLgX9pg-WJeoUZGxV" 
              alt="Jordan"
            />
            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="ml-4 flex-1 text-left border-b border-gray-100 pb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-bold text-[15px] text-gray-900">Jordan Smith</h3>
              <span className="text-xs text-gray-500">5h</span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">You: Sent a photo</p>
          </div>
        </button>

        {/* 7. Sarah Wilson */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors">
          <div className="relative flex-shrink-0">
            <img 
              className="w-14 h-14 rounded-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAINIaEo_HD6D0CXPZKg4kakLZ3pJLQ-yF8Je7YgzrW2EdlRiWWfu6X0I_cjJe5lVP9SAbosG4_eHNrRjDS6oENjORAbpHQJJEZ4FvWunkuU1elz4TkpKRPiwCA0hX0s9r4RoL-CPNKgWwJyo500f9IiOG_GIsIIpUMrZAEFpd9ERXo2ZMVvVOUCCLPW7JijS0XnD6aMUP0ddGY55cv3piyhyGgcS8sFDvW8wckYSobeuv4ZFczxuK617GHjRniyHORBCEyw3yv5032" 
              alt="Sarah"
            />
          </div>
          <div className="ml-4 flex-1 text-left border-b border-gray-100 pb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-bold text-[15px] text-gray-900">Sarah Wilson</h3>
              <span className="text-xs text-gray-500">Yesterday</span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">That looks amazing! How did you do the lighting?</p>
          </div>
        </button>

        {/* 8. Unknown User */}
        <button className="w-full flex items-center px-4 py-4 hover:bg-gray-100/50 transition-colors">
          <div className="relative flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="material-symbols-outlined text-gray-400 text-2xl">person</span>
            </div>
          </div>
          <div className="ml-4 flex-1 text-left border-b border-gray-100 pb-4">
            <div className="flex justify-between items-baseline">
              <h3 className="font-headline font-bold text-[15px] text-gray-900">Unknown User</h3>
              <span className="text-xs text-gray-500">Oct 24</span>
            </div>
            <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">Hey, is this still available?</p>
          </div>
        </button>
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-28 right-6 z-40">
        <button className="w-14 h-14 bg-[#005bc0] text-white rounded-full shadow-lg shadow-[#005bc0]/30 flex items-center justify-center active:scale-90 transition-transform duration-200 focus:outline-none focus:ring-4 focus:ring-[#005bc0]/20">
          <span className="material-symbols-outlined text-3xl">add</span>
        </button>
      </div>
    </main>
  );
}
