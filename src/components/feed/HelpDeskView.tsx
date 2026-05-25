'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigation } from '@/components/providers/NavigationProvider';
import UniversalFeed from './UniversalFeed';

export default function HelpDeskView() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const { setGlobalNavHidden } = useNavigation();
  
  // Accordion active index state
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  useEffect(() => {
    setGlobalNavHidden(true);
    return () => setGlobalNavHidden(false);
  }, [setGlobalNavHidden]);

  const context = {
    scope: 'helpdesk',
    scopeId: 'helpdesk',
    title: t('help_desk.title'),
  };

  const faqItems = [
    {
      q: t('helpdesk.faq.q1') || 'How do I make a payment?',
      a: t('helpdesk.faq.a1') || 'Once you submit the application, the host will review it and send payment instructions. After you deposit to the designated account, the host will confirm and approve.'
    },
    {
      q: t('helpdesk.faq.q2') || 'What is the refund and cancellation policy?',
      a: t('helpdesk.faq.a2') || 'Generally, cancellations made up to 24 hours before the class or rental start are eligible for a 100% refund. Same-day cancellations may not be refundable. Please refer to each group\'s policy for details.'
    },
    {
      q: t('helpdesk.faq.q3') || 'I want to delete my personal data or close my account.',
      a: t('helpdesk.faq.a3') || 'If you request account deletion through the 1:1 inquiry in the Helpdesk, all personal data will be completely destroyed within 24 hours.'
    }
  ];

  const toggleFaq = (idx: number) => {
    setActiveFaqIndex(activeFaqIndex === idx ? null : idx);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-[#FAF8FF] flex flex-col overflow-hidden text-on-surface">
      {/* Header */}
      <header className="h-16 flex items-center px-4 border-b border-slate-100 shrink-0 bg-white shadow-sm z-10">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-full transition-colors mr-2 text-slate-600"
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <div className="flex flex-col text-left">
          <h1 className="font-headline font-extrabold text-[17px] leading-tight tracking-tight text-slate-800 uppercase">
            {t('help_desk.title')}
          </h1>
          <p className="text-[10px] text-slate-400 font-semibold tracking-tighter mt-0.5">
            {t('help_desk.desc')}
          </p>
        </div>
      </header>

      {/* Feed Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="max-w-[600px] mx-auto min-h-full bg-white shadow-sm border-x border-slate-100/50 pb-24">
          
          {/* Welcome Card */}
          <div className="p-5 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 border-b border-slate-100/50 text-left">
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-white shadow-sm text-sm text-slate-600 leading-relaxed flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">support_agent</span>
              </div>
              <div className="flex-1 mt-0.5">
                <p className="font-bold text-slate-800 text-[13px] mb-1">{t('help_desk.title') || 'CS Helpdesk'}</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{t('help_desk.welcome')}"</p>
              </div>
            </div>
          </div>

          {/* Interactive Folding FAQ Section */}
          <div className="px-5 py-6 border-b border-slate-100/50 text-left">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary text-[20px] font-bold">quiz</span>
              <h3 className="font-headline font-black text-sm text-slate-800 uppercase tracking-tight">
                {t('helpdesk.faq_title') || 'Frequently Asked Questions (FAQ)'}
              </h3>
            </div>
            
            <div className="space-y-2.5">
              {faqItems.map((item, idx) => {
                const isOpen = activeFaqIndex === idx;
                return (
                  <div 
                    key={idx} 
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOpen ? 'border-primary/30 bg-primary/5 shadow-sm' : 'border-slate-100 bg-white'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-4 py-3.5 flex items-center justify-between text-left focus:outline-none"
                    >
                      <span className={`text-[13px] font-bold tracking-tight pr-4 leading-tight ${isOpen ? 'text-primary' : 'text-slate-700'}`}>
                        {item.q}
                      </span>
                      <span className={`material-symbols-outlined text-[20px] text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`}>
                        keyboard_arrow_down
                      </span>
                    </button>
                    
                    <div 
                      className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isOpen ? 'max-h-[200px] border-t border-slate-100/50' : 'max-h-0'
                      }`}
                    >
                      <div className="p-4 text-xs font-medium text-slate-500 leading-relaxed bg-white/40">
                        {item.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Inquiry Feed */}
          <div className="pt-2 text-left">
            <UniversalFeed
              context={context}
              currentUser={user}
              profile={profile}
            />
          </div>
          
        </div>
      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
