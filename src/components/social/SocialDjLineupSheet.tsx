import React, { useState, useEffect } from "react";
import { Social, SocialDj } from "@/types/social";
import { socialService } from "@/lib/firebase/socialService";
import { userService } from "@/lib/firebase/userService";
import { PlatformUser } from "@/types/user";
import { v4 as uuidv4 } from "uuid";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  social: Social;
  canEdit: boolean;
  onClose: () => void;
}

export default function SocialDjLineupSheet({ social, canEdit, onClose }: Props) {
  const { t, language } = useLanguage();
  const [djs, setDjs] = useState<SocialDj[]>(social.djs || []);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [djName, setDjName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users lookup for DJ search
  const [allUsers, setAllUsers] = useState<PlatformUser[]>([]);
  const [djResults, setDjResults] = useState<PlatformUser[]>([]);
  const [showDjResults, setShowDjResults] = useState(false);
  const [selectedDjId, setSelectedDjId] = useState<string>("");

  useEffect(() => {
    if (canEdit) {
      userService.getAllUsers().then(setAllUsers).catch(console.error);
    }
  }, [canEdit]);

  const handleDjSearch = (val: string) => {
    setDjName(val);
    setSelectedDjId("");
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.includes(val))
      );
      setDjResults(filtered.slice(0, 6));
      setShowDjResults(filtered.length > 0);
    } else {
      setShowDjResults(false);
      setDjResults([]);
    }
  };

  const handleSelectDj = (u: PlatformUser) => {
    setDjName(u.nickname || "");
    setSelectedDjId(u.id);
    setShowDjResults(false);
  };

  const handleAddDj = async () => {
    if (!selectedDate || !djName.trim()) {
      alert(t('social.alert_select_date_dj'));
      return;
    }

    setIsSubmitting(true);
    try {
      const newDj: SocialDj = {
        id: uuidv4(),
        date: selectedDate,
        djName: djName.trim(),
        djId: selectedDjId || undefined,
      };

      const updatedDjs = [...djs, newDj].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      await socialService.updateSocial(social.id, {
        djs: updatedDjs,
        // Optionally update the single string if it's the next upcoming event
        djName: updatedDjs.find(d => new Date(d.date) >= new Date())?.djName || updatedDjs[updatedDjs.length - 1]?.djName || social.djName
      });

      setDjs(updatedDjs);
      setIsAdding(false);
      setSelectedDate("");
      setDjName("");
      setSelectedDjId("");
    } catch (err) {
      console.error(err);
      alert(t('social.alert_failed_add_dj'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDj = async (id: string) => {
    if (!confirm(t('social.alert_remove_dj_confirm'))) return;
    try {
      const updatedDjs = djs.filter(d => d.id !== id);
      await socialService.updateSocial(social.id, {
        djs: updatedDjs,
        djName: updatedDjs.find(d => new Date(d.date) >= new Date())?.djName || updatedDjs[updatedDjs.length - 1]?.djName || ""
      });
      setDjs(updatedDjs);
    } catch (err) {
      console.error(err);
      alert(t('social.alert_failed_remove_dj'));
    }
  };

  // Sort existing DJs
  const sortedDjs = [...djs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const upcomingDjs = sortedDjs.filter(d => new Date(d.date) >= today);
  const pastDjs = sortedDjs.filter(d => new Date(d.date) < today);

  const dateLocale = language === 'KR' ? 'ko-KR' : 'en-US';

  return (
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[210] bg-white rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f2f4f4]">
          <div>
            <h2 className="text-lg font-black text-[#2d3435]">{t('social.dj_lineup')}</h2>
            <p className="text-[11px] font-bold text-[#acb3b4] mt-0.5">{social.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-[#f8f9fa] text-[#596061] hover:bg-[#e8eaec] transition-colors">
            <span className="material-symbols-rounded text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {canEdit && (
            <div className="border border-[#e0e4e5] rounded-xl overflow-hidden">
              <button 
                onClick={() => setIsAdding(!isAdding)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[#f8f9fa] hover:bg-[#f2f4f4] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-rounded text-sm text-primary">add_circle</span>
                  <span className="text-xs font-bold text-primary">{t('social.add_dj_lineup')}</span>
                </div>
                <span className="material-symbols-rounded text-sm text-[#acb3b4]">
                  {isAdding ? "expand_less" : "expand_more"}
                </span>
              </button>
              
              {isAdding && (
                <div className="p-4 bg-white border-t border-[#e0e4e5] space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.date')}</label>
                    <input 
                      type="date" 
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-[#e0e4e5] rounded-lg text-sm font-bold text-[#2d3435] focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-[#acb3b4] uppercase tracking-wider mb-1.5">{t('social.dj_label')}</label>
                    <div className="flex items-center px-3 py-2 border border-[#e0e4e5] rounded-lg focus-within:border-primary/50 transition-colors">
                      <span className="material-symbols-rounded text-[#acb3b4] mr-1.5 text-sm">headphones</span>
                      <input 
                        type="text" 
                        value={djName}
                        onChange={e => handleDjSearch(e.target.value)}
                        onFocus={() => djName.length >= 1 && setShowDjResults(djResults.length > 0)}
                        onBlur={() => setTimeout(() => setShowDjResults(false), 200)}
                        placeholder={t('social.search_dj_placeholder_sheet')}
                        className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
                      />
                    </div>
                    {showDjResults && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
                        {djResults.map(u => (
                          <button key={u.id} onClick={() => handleSelectDj(u)}
                            className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-baseline gap-2 group transition-colors border-b border-[#f2f4f4] last:border-0">
                            <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary">{u.nickname}</p>
                            {u.nativeNickname && <span className="text-[10px] text-[#acb3b4]">({u.nativeNickname})</span>}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={handleAddDj}
                    disabled={isSubmitting}
                    className="w-full py-2.5 bg-primary text-white rounded-lg text-xs font-black tracking-wide active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {isSubmitting ? t('social.adding') : t('social.add_dj_lineup')}
                  </button>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-3">{t('social.upcoming_lineup')}</h3>
            {upcomingDjs.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center border border-dashed border-[#e0e4e5] rounded-xl">
                <span className="material-symbols-rounded text-3xl text-[#c4cacc] mb-1">headphones</span>
                <p className="text-xs font-bold text-[#acb3b4]">{t('social.no_upcoming_djs')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingDjs.map((dj) => (
                  <div key={dj.id} className="flex items-center justify-between p-3 border border-[#e0e4e5] rounded-xl bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#f8f9fa] flex items-center justify-center">
                        <span className="material-symbols-rounded text-[#596061]">headphones</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2d3435]">{dj.djName}</p>
                        <p className="text-[10px] font-bold text-primary mt-0.5">
                          {new Date(dj.date).toLocaleDateString(dateLocale, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteDj(dj.id)} className="w-8 h-8 flex items-center justify-center text-[#acb3b4] hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <span className="material-symbols-rounded text-sm">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {pastDjs.length > 0 && (
            <div>
              <h3 className="text-[10px] font-black text-[#acb3b4] uppercase tracking-widest mb-3">{t('social.past_djs')}</h3>
              <div className="space-y-2 opacity-60">
                {pastDjs.map((dj) => (
                  <div key={dj.id} className="flex items-center justify-between p-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#e8eaec] flex items-center justify-center">
                        <span className="material-symbols-rounded text-xs text-[#acb3b4]">headphones</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#596061]">{dj.djName}</p>
                        <p className="text-[10px] font-medium text-[#acb3b4]">
                          {new Date(dj.date).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {canEdit && (
                      <button onClick={() => handleDeleteDj(dj.id)} className="w-8 h-8 flex items-center justify-center text-[#c4cacc] hover:text-red-500 transition-colors">
                        <span className="material-symbols-rounded text-sm">delete</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="h-6" /> {/* Bottom padding */}
        </div>
      </div>
    </>
  );
}
