'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';
import { useLanguage } from '@/contexts/LanguageContext';
import { chatService } from '@/lib/firebase/chatService';
import { toast } from 'sonner';

interface PurposeDetail {
  enabled: boolean;
  memo?: string;
}

interface PartnerMatchSettings {
  lookingForPartner: boolean;
  experienceYears?: number;
  purposes: {
    class: PurposeDetail;
    performance: PurposeDetail;
    competition: PurposeDetail;
  };
}

interface PartnerCandidate {
  userId: string;
  nickname: string;
  photoUrl?: string;
  experienceYears?: number;
  purposes: {
    class?: PurposeDetail;
    performance?: PurposeDetail;
    competition?: PurposeDetail;
  };
  matchedPurposes: ('class' | 'performance' | 'competition')[];
  score: number;
  reasons: string[];
}

export default function AiPartnerMatch() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Settings states
  const [lookingForPartner, setLookingForPartner] = useState(false);
  const [experienceYears, setExperienceYears] = useState<number>(1);
  const [classEnabled, setClassEnabled] = useState(false);
  const [classMemo, setClassMemo] = useState('');
  const [performanceEnabled, setPerformanceEnabled] = useState(false);
  const [performanceMemo, setPerformanceMemo] = useState('');
  const [competitionEnabled, setCompetitionEnabled] = useState(false);
  const [competitionMemo, setCompetitionMemo] = useState('');

  // UI/Search states
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [candidates, setCandidates] = useState<PartnerCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [isConnectingChat, setIsConnectingChat] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function loadSettings() {
      if (!user?.uid) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const snapshot = await getDoc(userRef);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const matchSettings = data.partnerMatch as PartnerMatchSettings | undefined;
          if (matchSettings) {
            setLookingForPartner(matchSettings.lookingForPartner || false);
            setExperienceYears(matchSettings.experienceYears ?? 1);
            
            const classObj = matchSettings.purposes?.class;
            setClassEnabled(classObj?.enabled || false);
            setClassMemo(classObj?.memo || '');

            const perfObj = matchSettings.purposes?.performance;
            setPerformanceEnabled(perfObj?.enabled || false);
            setPerformanceMemo(perfObj?.memo || '');

            const compObj = matchSettings.purposes?.competition;
            setCompetitionEnabled(compObj?.enabled || false);
            setCompetitionMemo(compObj?.memo || '');
          }
        }
      } catch (error) {
        console.error('Failed to load partner match settings:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    }
    loadSettings();
  }, [user]);

  // Initial search when lookingForPartner is loaded and is true
  useEffect(() => {
    if (!isLoadingSettings && lookingForPartner && user?.uid) {
      handleSearch(true);
    }
  }, [isLoadingSettings, user]);

  // Save Settings & Trigger Search
  const handleSaveAndSearch = async () => {
    if (!user?.uid) return;
    try {
      setIsSaving(true);
      const userRef = doc(db, 'users', user.uid);
      const partnerMatchData = {
        lookingForPartner,
        experienceYears,
        purposes: {
          class: { enabled: classEnabled, memo: classMemo },
          performance: { enabled: performanceEnabled, memo: performanceMemo },
          competition: { enabled: competitionEnabled, memo: competitionMemo },
        },
        updatedAt: serverTimestamp(),
      };
      await updateDoc(userRef, {
        partnerMatch: partnerMatchData,
      });
      toast.success(t('myinfo.save_success') || 'Settings saved.');
      
      if (lookingForPartner) {
        await handleSearch(true);
      } else {
        setCandidates([]);
        setCursor(undefined);
        setHasMore(false);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error(t('myinfo.save_error') || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Perform search (initial or load more)
  const handleSearch = async (initial = false) => {
    if (!user?.uid) return;
    try {
      setIsSearching(true);
      const currentCursor = initial ? undefined : cursor;
      const res = await fetch('/api/ai-partner-match/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          cursor: currentCursor,
          limit: 10,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (initial) {
          setCandidates(data.items || []);
        } else {
          setCandidates((prev) => [...prev, ...(data.items || [])]);
        }
        setCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } else {
        console.error('Search request failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Chat Connection
  const handleConnectChat = async (targetUid: string) => {
    if (!user?.uid) return;
    try {
      setIsConnectingChat(targetUid);
      const roomId = await chatService.getOrCreatePrivateRoom([user.uid, targetUid], user.uid, 'personal');
      router.push(`/chat?roomId=${roomId}`);
    } catch (error) {
      console.error('Chat connection failed:', error);
      toast.error(t('create_menu.no_permission') || 'Failed to open chat.');
    } finally {
      setIsConnectingChat(null);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <span className="material-symbols-outlined text-[48px] animate-spin text-slate-300">hourglass_empty</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between z-10 -mx-4 -mt-6 mb-2">
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50">
          <span className="material-symbols-outlined text-[20px] text-slate-600">arrow_back</span>
        </button>
        <span className="text-[16px] font-bold text-slate-800">{t('ai_partner.title')}</span>
        <div className="w-8" />
      </div>

      <p className="text-[13px] text-slate-500 leading-relaxed -mt-2">
        {t('ai_partner.description')}
      </p>

      {/* 1. Settings Section */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col gap-5">
        {/* Toggle Looking for Partner */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-slate-800">{t('ai_partner.looking')}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">{t('ai_partner.looking_help')}</p>
          </div>
          <button
            onClick={() => setLookingForPartner(!lookingForPartner)}
            type="button"
            className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
              lookingForPartner ? 'bg-[#007AFF]' : 'bg-slate-200'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                lookingForPartner ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* Experience Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[14px] font-bold text-slate-700">{t('ai_partner.experience')}</label>
          <div className="relative">
            <select
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseFloat(e.target.value))}
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-[14px] font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#007AFF]/20 appearance-none"
            >
              <option value={0.5}>0.5{t('myinfo.career_year') || '년'}</option>
              <option value={1}>1{t('myinfo.career_year') || '년'}</option>
              <option value={2}>2{t('myinfo.career_year') || '년'}</option>
              <option value={3}>3{t('myinfo.career_year') || '년'}</option>
              <option value={5}>5{t('myinfo.career_year_over') || '년 이상'}</option>
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[18px]">expand_more</span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Purposes with individual memo */}
        <div className="flex flex-col gap-3">
          <label className="text-[14px] font-bold text-slate-700">{t('ai_partner.purposes')}</label>
          
          {/* Class */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={classEnabled}
                onChange={(e) => setClassEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#007AFF] border-slate-300 focus:ring-[#007AFF]/20"
              />
              <span className="text-[13px] font-semibold text-slate-700">{t('ai_partner.purpose_class')}</span>
            </label>
            {classEnabled && (
              <input
                type="text"
                value={classMemo}
                onChange={(e) => setClassMemo(e.target.value)}
                placeholder={t('ai_partner.memo_placeholder_class')}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#007AFF]/20"
              />
            )}
          </div>

          {/* Performance */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={performanceEnabled}
                onChange={(e) => setPerformanceEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#007AFF] border-slate-300 focus:ring-[#007AFF]/20"
              />
              <span className="text-[13px] font-semibold text-slate-700">{t('ai_partner.purpose_performance')}</span>
            </label>
            {performanceEnabled && (
              <input
                type="text"
                value={performanceMemo}
                onChange={(e) => setPerformanceMemo(e.target.value)}
                placeholder={t('ai_partner.memo_placeholder_performance')}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#007AFF]/20"
              />
            )}
          </div>

          {/* Competition */}
          <div className="flex flex-col gap-2 mt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={competitionEnabled}
                onChange={(e) => setCompetitionEnabled(e.target.checked)}
                className="w-4 h-4 rounded text-[#007AFF] border-slate-300 focus:ring-[#007AFF]/20"
              />
              <span className="text-[13px] font-semibold text-slate-700">{t('ai_partner.purpose_competition')}</span>
            </label>
            {competitionEnabled && (
              <input
                type="text"
                value={competitionMemo}
                onChange={(e) => setCompetitionMemo(e.target.value)}
                placeholder={t('ai_partner.memo_placeholder_competition')}
                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-[12px] text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#007AFF]/20"
              />
            )}
          </div>
        </div>

        {/* Search/Save Button */}
        <button
          onClick={handleSaveAndSearch}
          disabled={isSaving || isSearching}
          className="w-full py-3.5 rounded-xl bg-[#007AFF] text-white text-[14px] font-bold disabled:opacity-50 active:scale-95 transition-all hover:bg-[#0063D1] shadow-sm flex items-center justify-center gap-1.5 mt-2"
        >
          {isSaving ? (
            <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_empty</span>
          ) : (
            <span className="material-symbols-outlined text-[18px]">search</span>
          )}
          {t('ai_partner.search')}
        </button>
      </div>

      {/* 2. Recommended Partners Section */}
      <div className="flex flex-col gap-4">
        <h3 className="text-[14px] font-bold text-slate-800 px-1">{t('ai_partner.recommended')}</h3>

        {!lookingForPartner ? (
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
            <span className="material-symbols-outlined text-slate-300 text-[36px] mb-2">info</span>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              {t('ai_partner.looking_help')}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {candidates.map((candidate) => {
              const classMemoVal = candidate.purposes.class?.memo || '';
              const performanceMemoVal = candidate.purposes.performance?.memo || '';
              const competitionMemoVal = candidate.purposes.competition?.memo || '';
              const classFallback = t('ai_partner.memo_placeholder_class');
              const performanceFallback = t('ai_partner.memo_placeholder_performance');
              const competitionFallback = t('ai_partner.memo_placeholder_competition');

              return (
                <div
                  key={candidate.userId}
                  className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition-shadow"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 flex items-center justify-center border border-slate-100">
                    {candidate.photoUrl ? (
                      <img src={candidate.photoUrl} alt={candidate.nickname} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-[24px]">person</span>
                    )}
                  </div>

                  {/* Candidate Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[14px] font-bold text-slate-800 truncate">{candidate.nickname}</p>
                      <button
                        onClick={() => handleConnectChat(candidate.userId)}
                        disabled={isConnectingChat !== null}
                        className="w-9 h-9 rounded-full bg-[#007AFF]/10 hover:bg-[#007AFF]/20 text-[#007AFF] flex items-center justify-center active:scale-90 transition-all flex-shrink-0"
                      >
                        {isConnectingChat === candidate.userId ? (
                          <span className="material-symbols-outlined text-[18px] animate-spin">hourglass_empty</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">chat</span>
                        )}
                      </button>
                    </div>

                    <p className="text-[12px] text-slate-400 font-semibold mt-0.5">
                      {t('ai_partner.experience')}: {candidate.experienceYears ?? 0.5}{t('myinfo.career_year') || '년'}
                    </p>

                    {/* Purposes & Memos */}
                    <div className="flex flex-col gap-2 mt-3">
                      {candidate.purposes.class?.enabled && (
                        <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#007AFF]" />
                            <span className="text-[11px] font-bold text-slate-600">{t('ai_partner.purpose_class')}</span>
                          </div>
                          <p className="text-[12px] text-slate-500 leading-normal font-medium">
                            {classMemoVal ? classMemoVal : classFallback}
                          </p>
                        </div>
                      )}

                      {candidate.purposes.performance?.enabled && (
                        <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            <span className="text-[11px] font-bold text-slate-600">{t('ai_partner.purpose_performance')}</span>
                          </div>
                          <p className="text-[12px] text-slate-500 leading-normal font-medium">
                            {performanceMemoVal ? performanceMemoVal : performanceFallback}
                          </p>
                        </div>
                      )}

                      {candidate.purposes.competition?.enabled && (
                        <div className="bg-slate-50/50 rounded-xl p-2.5 border border-slate-100/50">
                          <div className="flex items-center gap-1 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            <span className="text-[11px] font-bold text-slate-600">{t('ai_partner.purpose_competition')}</span>
                          </div>
                          <p className="text-[12px] text-slate-500 leading-normal font-medium">
                            {competitionMemoVal ? competitionMemoVal : competitionFallback}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {isSearching && (
              <div className="flex items-center justify-center py-4">
                <span className="material-symbols-outlined text-[24px] animate-spin text-slate-300">hourglass_empty</span>
              </div>
            )}

            {!isSearching && candidates.length === 0 && (
              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-100">
                <p className="text-[13px] text-slate-400">{t('ai_partner.empty')}</p>
              </div>
            )}

            {!isSearching && candidates.length > 0 && (
              <div className="mt-2">
                {hasMore ? (
                  <button
                    onClick={() => handleSearch(false)}
                    className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-[13px] font-bold active:scale-95 transition-all hover:bg-slate-50 flex items-center justify-center gap-1"
                  >
                    <span>{t('ai_partner.load_more')}</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                ) : (
                  <p className="text-[11px] text-slate-400 text-center py-3 font-medium">
                    {t('ai_partner.no_more')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
