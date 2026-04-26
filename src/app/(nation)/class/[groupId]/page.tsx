'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { groupService } from '@/lib/firebase/groupService';
import { Group, GroupClass } from '@/types/group';
import { useAuth } from '@/components/providers/AuthProvider';
import { classRegistrationService } from '@/lib/firebase/classRegistrationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

export default function ClubClassSelectionPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pay_later'>('paid');
  const [showSuccess, setShowSuccess] = useState(false);
  const [passSelectedClassIds, setPassSelectedClassIds] = useState<Set<string>>(new Set());
  const { user, profile } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'leader' | 'follower' | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);

  useEffect(() => {
    if (isApplyModalOpen && !selectedRole) {
      if (profile?.role) {
        setSelectedRole(profile.role as 'leader' | 'follower');
      } else if (profile?.gender) {
        const g = profile.gender.toLowerCase();
        if (g === 'male' || g === 'm') setSelectedRole('leader');
        else setSelectedRole('follower');
      } else {
        setSelectedRole('follower');
      }
    }
  }, [isApplyModalOpen, profile, selectedRole]);

  useEffect(() => {
    if (!groupId) return;
    
    const fetchGroupData = async () => {
      try {
        const groupData = await groupService.getGroup(groupId);
        setGroup(groupData);
        if (groupData?.ownerId && !groupData.representative?.name) {
          const userDoc = await getDoc(doc(db, 'users', groupData.ownerId));
          if (userDoc.exists()) {
            setOwnerName(userDoc.data().nickname || userDoc.data().name || null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch group data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupData();
  }, [groupId]);

  const handleCardClick = (item: any) => {
    setSelectedClassDetail(item);
    if (item.itemType === 'monthlyPass') {
      const currentMonthStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + (new Date().getDate() >= 15 ? 2 : 1)).padStart(2, '0')}`;
      const allGroupClasses = group?.classes || [];
      const classes = allGroupClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
      const passClasses = item.includedClassIds && item.includedClassIds.length > 0 
        ? classes.filter(c => item.includedClassIds.includes(c.id))
        : classes;
      setPassSelectedClassIds(new Set(passClasses.map(c => c.id)));
    }
  };

  const handleAddToBasket = (classId: string) => {
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      newSet.add(classId);
      return newSet;
    });
    setSelectedClassDetail(null); // Close modal after adding
  };

  const handleRemoveFromBasket = (classId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // prevent opening modal if clicked from card icon
    setSelectedClasses(prev => {
      const newSet = new Set(prev);
      newSet.delete(classId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center space-y-4">
        <span className="material-symbols-outlined text-4xl text-outline">error</span>
        <h2 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">Club not found</h2>
        <button onClick={() => router.back()} className="text-primary hover:underline">Go back</button>
      </div>
    );
  }

  const d = new Date();
  if (d.getDate() >= 15) {
    d.setMonth(d.getMonth() + 1);
  }
  const currentMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  const allGroupClasses = group.classes || [];
  const classes = allGroupClasses.filter(cls => !cls.targetMonth || cls.targetMonth === currentMonthStr);
  const monthlyPasses = (group.monthlyPasses || []).filter(p => !p.targetMonth || p.targetMonth === currentMonthStr);
  const discounts = (group.discounts || []).filter(d => !d.targetMonth || d.targetMonth === currentMonthStr);

  const packages = [
    ...monthlyPasses.map(p => ({ ...p, itemType: 'monthlyPass' as const, amount: p.amount, currency: p.currency })),
    ...discounts.map(d => ({ ...d, itemType: 'discount' as const, amount: d.amount, currency: d.currency }))
  ];

  const allItems = [...packages, ...classes.map(c => ({ ...c, itemType: 'class' as const }))];

  const renderCard = (item: any) => {
    const isSelected = selectedClasses.has(item.id);
    const defaultImage = group.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuB1p5rRdvtL-_VZhYwuM5MJDuvurQqiK2vqkkLl3r_dwEVxiPKlX0v3cO4F6BCXbtAkB0Q8LgdYPXpulMQC7OhDnpZDm4PVGzUhlOhIUsK4pTtNuG7W0x6Ziaa9OkOWTxpNT9DQtAIOrSLEpd_kYzKwdQPM79igTUu5b71LE8nXV-HzgPua49ngYKfkuNrhw0Oc7MATmil610O-g5S_6vTxHH6rslO4R5tUouyECPnKi4XO4lsxBGv9PRgyZLrNLtaL22TU2nCrIXk";
    const itemImage = item.imageUrl || defaultImage;
    
    let dateDisplay = item.itemType === 'monthlyPass' ? 'Monthly Pass' : item.itemType === 'discount' ? 'Bundle' : "TBD";
    if (item.itemType === 'class') {
      if (item.schedule && item.schedule.length > 0) {
        dateDisplay = item.schedule[0].date || "TBD";
      }
      if (item.targetMonth) {
        const parts = item.targetMonth.split('-');
        if (parts.length === 2) {
          const monthNum = parseInt(parts[1], 10);
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          if (monthNum >= 1 && monthNum <= 12) {
            dateDisplay = `${monthNum}, ${monthNames[monthNum - 1]}`;
          } else {
            dateDisplay = item.targetMonth;
          }
        } else {
          dateDisplay = item.targetMonth;
        }
      }
    }
  
    const instructor = item.instructors && item.instructors.length > 0 ? item.instructors[0] : null;
  
    return (
      <div 
        key={item.id}
        onClick={() => handleCardClick(item)}
        className={`group relative ${isSelected ? 'bg-primary-fixed border-primary/20 shadow-md' : 'bg-surface-container-lowest border-outline-variant/30 shadow-sm hover:shadow-md hover:border-outline-variant/60'} rounded-[24px] p-[0.5rem] pr-5 flex items-stretch gap-4 border transition-all duration-300 cursor-pointer`}
      >
        <div className="w-24 h-24 rounded-[16px] overflow-hidden relative flex-shrink-0 bg-secondary-fixed">
          <img 
            alt={item.title} 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
            src={itemImage}
          />
          {isSelected && item.itemType === 'class' && item.maxCapacity && item.maxCapacity < 5 && (
             <div className="absolute top-2 left-2 bg-error text-on-error font-['Inter'] text-[10px] font-bold leading-[1rem] px-2 py-1 rounded-md uppercase tracking-wider">Few spots left</div>
          )}
        </div>
        
        <div className="flex-grow py-2 flex flex-col justify-between">
          <div>
            <div className="flex flex-col mb-1">
              <h3 className={`font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] ${isSelected ? 'text-on-primary-fixed-variant' : 'text-on-surface'} line-clamp-2`}>{item.title}</h3>
            </div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className={`font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] ${isSelected ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'} uppercase tracking-wider`}>{dateDisplay}</span>
            </div>
          </div>
          
          {instructor && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-secondary-container overflow-hidden flex items-center justify-center text-on-secondary-container font-['Inter'] text-[0.75rem] font-semibold leading-[1rem]">
                {instructor.avatar ? (
                  <img alt={instructor.name} className="w-full h-full object-cover" src={instructor.avatar} />
                ) : (
                  instructor.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <span className={`font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] ${isSelected ? 'text-on-primary-fixed-variant' : 'text-on-surface-variant'}`}>{instructor.name}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-center pl-2">
          {isSelected ? (
            <button 
              onClick={(e) => handleRemoveFromBasket(item.id, e)}
              className="w-12 h-12 flex-shrink-0 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-fixed"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_basket</span>
            </button>
          ) : (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                handleAddToBasket(item.id);
              }}
              className="w-12 h-12 flex-shrink-0 rounded-full bg-surface text-primary border border-outline-variant/40 flex items-center justify-center hover:bg-primary-fixed hover:border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <span className="material-symbols-outlined">shopping_basket</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  if (showSuccess) {
    return (
      <div className="bg-background text-on-background min-h-screen flex flex-col justify-center items-center relative z-[100]">
        <main className="w-full max-w-[56rem] mx-auto px-[1.5rem] py-[2.5rem] flex flex-col items-center text-center">
          {/* Success Icon/Illustration */}
          <div className="mb-8 relative flex justify-center items-center w-32 h-32 rounded-full bg-primary-container/20 shadow-xl">
            <div className="absolute inset-0 bg-primary-container/10 rounded-full animate-pulse blur-xl"></div>
            <span className="material-symbols-outlined text-primary text-6xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          
          {/* Typography Messages */}
          <h1 className="font-['Plus_Jakarta_Sans'] text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] text-primary mb-4">
            Application Successful!
          </h1>
          <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant max-w-sm mb-12">
            You can check your class application status in <br/><span className="font-bold text-primary">My Info &gt; History</span>
          </p>
          
          {/* Primary Action */}
          <button 
            onClick={() => router.push('/home')} 
            className="w-full max-w-[320px] bg-primary text-on-primary py-4 px-6 rounded-xl shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem]">Back to Home</span>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background min-h-screen antialiased selection:bg-primary-fixed selection:text-on-primary-fixed relative pt-16">
      {/* Custom Sub-page Header */}
      <header className="sticky top-16 z-40 bg-surface/90 backdrop-blur-xl border-b border-surface-variant px-[1.5rem] py-4">
        <div className="max-w-[56rem] mx-auto flex items-center gap-[1rem]">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant text-on-surface transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">{group.name}</h1>
            <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant">Owner: {group.representative?.name || ownerName || "Group Admin"}</span>
          </div>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="max-w-[56rem] mx-auto px-[1.5rem] py-[2.5rem] pb-[140px]">
        <div className="flex flex-col gap-4">
          
          {packages.length > 0 && (
            <div className="flex flex-col gap-4 mb-4">
              <h2 className="font-['Plus_Jakarta_Sans'] text-[1.25rem] font-extrabold leading-[1.75rem] text-on-surface ml-2">Packages</h2>
              {packages.map(pkg => renderCard(pkg))}
            </div>
          )}

          {classes.length > 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="font-['Plus_Jakarta_Sans'] text-[1.25rem] font-extrabold leading-[1.75rem] text-on-surface ml-2 mt-4">Single Classes</h2>
              {classes.map(cls => renderCard(cls))}
            </div>
          )}

          {packages.length === 0 && classes.length === 0 && (
            <div className="text-center py-20 bg-surface-container-lowest rounded-xl border-2 border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-outline text-4xl mb-2">event_busy</span>
              <p className="text-sm font-bold text-on-surface-variant">No items available for this club.</p>
            </div>
          )}

        </div>
      </main>
      
      {/* Contextual Floating Action Bar (Basket/Apply) - ALWAYS VISIBLE */}
      {!selectedClassDetail && (() => {
        const subtotal = Array.from(selectedClasses).reduce((sum, id) => {
          const item = allItems.find(c => c.id === id);
          return sum + (item?.amount || 0);
        }, 0);
        
        const currency = selectedClasses.size > 0 
          ? allItems.find(c => c.id === Array.from(selectedClasses)[0])?.currency || "KRW"
          : "KRW";

        return (
          <div className="fixed bottom-[72px] left-0 right-0 z-40 px-[1.5rem] pb-4 pt-6 pointer-events-none bg-gradient-to-t from-background via-background/80 to-transparent animate-in slide-in-from-bottom-full duration-300">
            <div className="max-w-[400px] mx-auto pointer-events-auto">
              <div className="bg-inverse-surface rounded-full p-2 flex items-center justify-between shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
                <div className="flex items-center gap-3 pl-4">
                  <div className="relative">
                    <span className="material-symbols-outlined text-inverse-on-surface text-[28px]">shopping_basket</span>
                    <div className="absolute -top-1 -right-2 bg-primary-container text-on-primary-container w-5 h-5 rounded-full flex items-center justify-center font-['Inter'] text-[10px] font-bold leading-[1rem] border-2 border-inverse-surface">
                      {selectedClasses.size}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-outline-variant">Subtotal</span>
                    <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-inverse-on-surface leading-none">
                      {subtotal.toLocaleString()} {currency}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    if (selectedClasses.size === 0) {
                      alert("Please select a class first.");
                      return;
                    }
                    setIsApplyModalOpen(true);
                  }}
                  className="bg-primary-container text-on-primary-container px-8 py-3.5 rounded-full font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] hover:bg-primary hover:text-on-primary transition-colors focus:outline-none focus:ring-4 focus:ring-primary/30 active:scale-95 duration-200"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Item Details Popup Modal */}
      {selectedClassDetail && (
        <div className="fixed inset-0 z-[200] bg-surface text-on-surface overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
          {selectedClassDetail.itemType === 'discount' && (
            <div className="min-h-screen bg-background text-on-background pb-24">
              <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl font-['Plus_Jakarta_Sans'] font-semibold docked full-width top-0 sticky z-50 shadow-sm flex items-center justify-between px-6 h-16 w-full max-w-[896px] mx-auto">
                <button onClick={() => setSelectedClassDetail(null)} className="text-on-background hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors p-2 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>arrow_back</span>
                </button>
                <h1 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-on-background tracking-tight">Bundle Details</h1>
                <div className="w-10"></div>
              </header>
              <main className="max-w-[896px] mx-auto space-y-10 px-[1.5rem] mt-6">
                <section className="relative w-full aspect-[4/3] rounded-xl overflow-hidden shadow-md">
                  <img 
                    alt={selectedClassDetail.title} 
                    className="w-full h-full object-cover" 
                    src={selectedClassDetail.imageUrl || group.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuB5Zs_rz5iaNtfFGjPYS9bKIZm-ivx2f7pPZjex6hRPolQEqbteCeQ8ubawB-IMdL4FChiE7wOGS4-0DzCUMQB_1xy_oeM5aHzNB529TxCseYy6d-2Dg0I3F-VsN1PTet34oFvLCGqPZyXgszobuKUBKYqm-Qwrare7sicxUNgD56ftZ-ZU6RpZXNfcZstG85e76Mw6gqWckHzZr4MDbcztnAoA1Yl2BcnU6smPlgQys6-dwZGjgzL9JEXVtLeHLC-xFlJNr7xvioI"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-6">
                    <h2 className="text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] font-['Plus_Jakarta_Sans'] text-[#ffffff] mb-2">{selectedClassDetail.title}</h2>
                  </div>
                </section>
                <section className="space-y-4">
                  <div className="flex gap-2">
                    <span className="bg-[#0057bd] text-[#c2d3ff] font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] px-3 py-1 rounded-full uppercase tracking-wider">Bundle Deal</span>
                    <span className="bg-[#e7e7f1] text-[#424753] font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] px-3 py-1 rounded-full uppercase tracking-wider">Discounted</span>
                  </div>
                  <p className="text-[#424753] leading-relaxed whitespace-pre-line">
                    {selectedClassDetail.discountDescription || selectedClassDetail.description || "No description provided."}
                  </p>
                </section>
                <section className="bg-[#f2f3fc] rounded-xl p-6 shadow-sm border border-transparent hover:border-[#c2c6d5] transition-colors flex items-center justify-between">
                  <div>
                    <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-[#727784] uppercase tracking-wider mb-1">Bundle Price</p>
                    <div className="flex items-baseline gap-3">
                      <span className="text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] font-['Plus_Jakarta_Sans'] text-[#004190]">
                        {selectedClassDetail.amount?.toLocaleString()} {selectedClassDetail.currency || 'KRW'}
                      </span>
                      {(() => {
                        const originalPrice = (selectedClassDetail.includedClassIds || []).reduce((sum: number, id: string) => {
                          const cls = classes.find(c => c.id === id);
                          return sum + (cls?.amount || 0);
                        }, 0);
                        if (originalPrice > selectedClassDetail.amount) {
                          return (
                            <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-[#727784] line-through">
                              {originalPrice.toLocaleString()} {selectedClassDetail.currency || 'KRW'}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  <div className="bg-[#0057bd]/20 text-[#004190] text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] w-12 h-12 rounded-full flex items-center justify-center">
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>percent</span>
                  </div>
                </section>
                <section className="space-y-4">
                  <h3 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-[#191b22] border-b border-[#e7e7f1] pb-2">Included Classes</h3>
                  <ul className="space-y-3">
                    {(selectedClassDetail.includedClassIds || []).map((id: string) => {
                      const cls = classes.find(c => c.id === id);
                      if (!cls) return null;
                      return (
                        <li key={id} className="bg-[#ffffff] rounded-xl p-4 shadow-sm flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#e7e7f1] flex items-center justify-center text-[#004190] flex-shrink-0">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>school</span>
                          </div>
                          <div>
                            <h4 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-[#191b22]">{cls.title}</h4>
                            <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-[#424753]">{cls.schedule?.length || 0} Sessions</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </section>
                <section className="space-y-4 pb-20">
                  <h3 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-[#191b22] border-b border-[#e7e7f1] pb-2">Instructors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {(() => {
                      const uniqueInstructors = new Map();
                      (selectedClassDetail.includedClassIds || []).forEach((id: string) => {
                        const cls = classes.find(c => c.id === id);
                        if (cls && cls.instructors) {
                          cls.instructors.forEach((inst: any) => {
                            if (!uniqueInstructors.has(inst.name)) {
                              uniqueInstructors.set(inst.name, inst);
                            }
                          });
                        }
                      });
                      const instructorList = Array.from(uniqueInstructors.values());
                      if (instructorList.length === 0) {
                        return <p className="text-[#424753] col-span-2">No instructors listed.</p>;
                      }
                      return instructorList.map((inst, idx) => (
                        <div key={idx} className="bg-[#f2f3fc] rounded-xl p-4 shadow-sm text-center flex flex-col items-center">
                          {inst.avatar ? (
                            <img alt={inst.name} className="w-16 h-16 rounded-full object-cover mb-3" src={inst.avatar} />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-[#8097ff] text-[#03288f] flex items-center justify-center text-xl font-bold mb-3">
                              {inst.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <h4 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-[#191b22] text-sm">{inst.name}</h4>
                          <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-[#424753]">Instructor</p>
                        </div>
                      ));
                    })()}
                  </div>
                </section>
              </main>
              <div className="fixed bottom-6 right-6 z-50 flex gap-3">
                <button 
                  onClick={() => setSelectedClassDetail(null)}
                  className="bg-surface text-primary border border-primary font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-sm hover:bg-primary-fixed transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">close</span>
                  Cancel
                </button>
                {selectedClasses.has(selectedClassDetail.id) ? (
                  <button 
                    onClick={(e) => handleRemoveFromBasket(selectedClassDetail.id, e)}
                    className="bg-surface text-error border border-error font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-sm hover:bg-error-container transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">remove_shopping_cart</span>
                    Remove
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAddToBasket(selectedClassDetail.id)}
                    className="bg-primary text-on-primary font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-[0_10px_25px_rgba(0,65,144,0.4)] hover:shadow-[0_15px_35px_rgba(0,65,144,0.5)] hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">shopping_basket</span>
                    Add to Basket
                  </button>
                )}
              </div>
            </div>
          )}

          {selectedClassDetail.itemType === 'monthlyPass' && (
            <div className="min-h-screen bg-background text-on-background flex flex-col items-center">
              <header className="fixed w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl docked full-width top-0 z-50 shadow-sm">
                <div className="flex items-center justify-between px-4 h-16 max-w-[896px] mx-auto border-b border-slate-100 dark:border-slate-800">
                  <button onClick={() => setSelectedClassDetail(null)} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors rounded-full active:scale-95 duration-200">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                  <h1 className="font-['Plus_Jakarta_Sans'] font-bold text-lg text-blue-600 dark:text-blue-400">Monthly Pass</h1>
                  <div className="w-10"></div>
                </div>
              </header>
              <main className="w-full max-w-[896px] mx-auto mt-16 pb-32">
                <section className="w-full aspect-[16/9] relative overflow-hidden bg-[#e7e7f1]">
                  <img 
                    alt="Hero Image" 
                    className="w-full h-full object-cover" 
                    src={selectedClassDetail.imageUrl || group.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuDQYl1Zn-tGhFyRrN916cLK79Vi4UkS3evyrv2w77wZ2G4joSdJ5hSvEUKMRiWqch9oHwXbuilkbFAHVI8u8BTJwjMEHoe-Tn8pOU5H8pMgL9C3dp6ox5ysYMOGoVv5taUXIi5uAsmPp1sZyFY3u--O0Dh8MgDdB6m6FDdC5yPpcgZOpofgT6iEFImyyPzv7B3cYRiiRd1x8dIi5VQdpEmWgxNKTf6NOOtQDg4fhjAuQXgpkXdX8AItMmb7GpJvQInF1f1wNZQgyCo"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </section>
                <section className="p-[1.5rem] space-y-[1rem]">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] font-['Plus_Jakarta_Sans'] text-[#191b22]">{selectedClassDetail.title}</h2>
                      <p className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-[#004190] mt-1">{selectedClassDetail.amount?.toLocaleString()} {selectedClassDetail.currency || 'KRW'}</p>
                    </div>
                  </div>
                  <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-[#424753] whitespace-pre-line">
                    {selectedClassDetail.description || "No description provided."}
                  </p>
                </section>
                <section className="px-[1.5rem] pt-[1rem] pb-[2.5rem]">
                  <h3 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-[#191b22] mb-4">Select Classes</h3>
                  <div className="space-y-3">
                    {(() => {
                      const passClasses = selectedClassDetail.includedClassIds && selectedClassDetail.includedClassIds.length > 0 
                        ? classes.filter(c => selectedClassDetail.includedClassIds.includes(c.id))
                        : classes;
                      return passClasses.map((cls: any) => {
                        const isChecked = passSelectedClassIds.has(cls.id);
                        return (
                          <label key={cls.id} className="flex items-center p-4 bg-[#ffffff] rounded-xl shadow-sm border border-[#c2c6d5] hover:border-[#004190] transition-colors cursor-pointer group">
                            <input 
                              type="checkbox" 
                              className="sr-only" 
                              checked={isChecked}
                              onChange={() => {
                                setPassSelectedClassIds(prev => {
                                  const newSet = new Set(prev);
                                  if (newSet.has(cls.id)) {
                                    newSet.delete(cls.id);
                                  } else {
                                    newSet.add(cls.id);
                                  }
                                  return newSet;
                                });
                              }}
                            />
                            <div className="flex-1">
                              <h4 className="text-[1.125rem] font-bold leading-[1.5rem] font-['Plus_Jakarta_Sans'] text-[#191b22]">{cls.title}</h4>
                              <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-[#424753] mt-1">{cls.schedule?.length || 0} Sessions</p>
                            </div>
                            <div className={`relative flex items-center justify-center w-6 h-6 rounded border-2 transition-colors ${isChecked ? 'border-[#004190] bg-[#004190] text-[#ffffff]' : 'border-[#c2c6d5] bg-transparent'}`}>
                              {isChecked && <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>}
                            </div>
                          </label>
                        );
                      });
                    })()}
                  </div>
                </section>
              </main>
              <div className="fixed bottom-6 right-6 z-50 flex gap-3">
                <button 
                  onClick={() => setSelectedClassDetail(null)}
                  className="bg-surface text-primary border border-primary font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-sm hover:bg-primary-fixed transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">close</span>
                  Cancel
                </button>
                {selectedClasses.has(selectedClassDetail.id) ? (
                  <button 
                    onClick={(e) => handleRemoveFromBasket(selectedClassDetail.id, e)}
                    className="bg-surface text-error border border-error font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-sm hover:bg-error-container transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">remove_shopping_cart</span>
                    Remove
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAddToBasket(selectedClassDetail.id)}
                    className="bg-primary text-on-primary font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-[0_10px_25px_rgba(0,65,144,0.4)] hover:shadow-[0_15px_35px_rgba(0,65,144,0.5)] hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">shopping_basket</span>
                    Add to Basket
                  </button>
                )}
              </div>
            </div>
          )}

          {(!selectedClassDetail.itemType || selectedClassDetail.itemType === 'class') && (
            <div className="bg-surface text-on-surface">
              <div className="fixed top-0 w-full flex justify-between items-center px-4 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-800 shadow-sm z-50">
                <button 
                  onClick={() => setSelectedClassDetail(null)}
                  className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors rounded-full active:scale-95 duration-200"
                >
                  <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">close</span>
                </button>
                <h1 className="font-['Plus_Jakarta_SANS'] font-bold text-lg tracking-tight text-blue-600 dark:text-blue-400">Details</h1>
                <button className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors rounded-full active:scale-95 duration-200">
                  <span className="material-symbols-outlined text-zinc-500 dark:text-zinc-400">share</span>
                </button>
              </div>
              
              <main className="pt-16 pb-32 max-w-[896px] mx-auto w-full px-[1.5rem]">
                <div className="mt-[1rem] relative w-full aspect-video rounded-xl overflow-hidden shadow-sm">
                  <img 
                    alt={selectedClassDetail.title} 
                    className="object-cover w-full h-full" 
                    src={selectedClassDetail.imageUrl || group.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuCA4vsobDgF82u1B1JsGIqJnP-zNx5SIzq6B9xu5x_E9_PqmQbPtFY4fexFjOUzOXV-v5KSdelCxfu98BHvquxP9D0rB0j71KHN1JI8ynh80ATv2I6IwOog0QlQ3TQ8ud87HBTBCjrfO-iEJpJm018uw7eTzAoj3UyYFPvQbGyfmwD3BIJV9K8YBFnxKUvhQiA5ql6dMxPVQGBv94acZLS6P6nIyME-EQtNm9GfBaaU1FoICfYBo68m20GJmQD1NgUY3bJVcuLr5EA"}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <h2 className="font-['Plus_Jakarta_Sans'] text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] text-white">{selectedClassDetail.title}</h2>
                  </div>
                </div>
                
                <section className="mt-[2.5rem]">
                  <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant whitespace-pre-line">
                    {selectedClassDetail.description || selectedClassDetail.discountDescription || "No description provided."}
                  </p>
                </section>
                
                {selectedClassDetail.location && (
                  <section className="mt-[2.5rem]">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-[1rem]">Venue</h3>
                    <div className="bg-surface-container-low rounded-xl p-4 shadow-sm border border-transparent hover:border-outline-variant transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">location_on</span>
                      <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface font-semibold">{selectedClassDetail.location}</span>
                    </div>
                  </section>
                )}
                
                {selectedClassDetail.level && (
                  <section className="mt-[2.5rem]">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-[1rem]">Class Information</h3>
                    <div className="space-y-4">
                      {selectedClassDetail.level && (
                        <div>
                          <label className="block font-['Inter'] text-[10px] font-bold leading-[1rem] text-on-surface-variant uppercase tracking-widest mb-2">Level</label>
                          <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 cursor-pointer">
                            <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{selectedClassDetail.level}</span>
                            <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                          </div>
                        </div>
                      )}
                      {selectedClassDetail.classType && (
                        <div>
                          <label className="block font-['Inter'] text-[10px] font-bold leading-[1rem] text-on-surface-variant uppercase tracking-widest mb-2">Class Type</label>
                          <div className="flex items-center justify-between bg-surface-container-low border border-outline-variant/50 rounded-xl px-4 py-3 cursor-pointer">
                            <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface">{selectedClassDetail.classType}</span>
                            <span className="material-symbols-outlined text-on-surface-variant">expand_more</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
                
                {(selectedClassDetail.maxCapacity || selectedClassDetail.leaderCount || selectedClassDetail.followerCount) && (
                  <section className="mt-[2.5rem]">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-[1rem]">Capacity</h3>
                    <div className="bg-surface-container-low rounded-xl p-4 shadow-sm border border-transparent hover:border-outline-variant transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-2xl">group</span>
                        <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface font-semibold">Max Capacity</span>
                      </div>
                      <div className="flex gap-6">
                        {selectedClassDetail.leaderCount !== undefined && (
                          <div className="text-center">
                            <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-primary font-bold">{selectedClassDetail.leaderCount}</span>
                            <span className="font-['Inter'] text-[10px] font-bold leading-[1rem] block text-on-surface-variant mt-1">Male</span>
                          </div>
                        )}
                        {selectedClassDetail.followerCount !== undefined && (
                          <div className="text-center">
                            <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-tertiary font-bold">{selectedClassDetail.followerCount}</span>
                            <span className="font-['Inter'] text-[10px] font-bold leading-[1rem] block text-on-surface-variant mt-1">Female</span>
                          </div>
                        )}
                        {selectedClassDetail.leaderCount === undefined && selectedClassDetail.followerCount === undefined && (
                           <div className="text-center">
                            <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-primary font-bold">{selectedClassDetail.maxCapacity}</span>
                            <span className="font-['Inter'] text-[10px] font-bold leading-[1rem] block text-on-surface-variant mt-1">Total</span>
                           </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}
                
                <section className="mt-[2.5rem]">
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-[1rem]">Pricing</h3>
                  <div className="bg-surface-container-low rounded-xl p-4 shadow-sm border border-transparent hover:border-outline-variant transition-colors flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface font-semibold">Course Fee</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">payments</span>
                      <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface font-bold">
                        {selectedClassDetail.amount ? selectedClassDetail.amount.toLocaleString() : "0"} {selectedClassDetail.currency || "KRW"}
                      </span>
                    </div>
                  </div>
                </section>
                
                {selectedClassDetail.instructors && selectedClassDetail.instructors.length > 0 && (
                  <section className="mt-[2.5rem]">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-[1rem]">Instructors</h3>
                    <div className={`grid ${selectedClassDetail.instructors.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                      {selectedClassDetail.instructors.map((instructor: any, idx: number) => (
                        <div key={idx} className="bg-surface-container-low rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-md transition-shadow">
                          {instructor.avatar ? (
                            <img 
                              alt={instructor.name} 
                              className="w-16 h-16 rounded-full object-cover mb-2" 
                              src={instructor.avatar}
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xl font-bold mb-2">
                              {instructor.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface text-center">{instructor.name}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
                
                {selectedClassDetail.schedule && selectedClassDetail.schedule.length > 0 && (
                  <section className="mt-[2.5rem]">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-[1rem]">Schedule</h3>
                    <div className="space-y-4">
                      {selectedClassDetail.schedule.map((sched: any, idx: number) => {
                        const dateObj = new Date(sched.date);
                        const month = dateObj.toLocaleString('en-US', { month: 'short' });
                        const day = dateObj.getDate();
                        return (
                          <div key={idx} className="flex items-start gap-4 p-4 bg-surface-container-low rounded-xl border border-transparent hover:border-outline-variant transition-colors">
                            <div className="flex-shrink-0 bg-primary-container text-on-primary-container rounded-lg p-2 flex flex-col items-center justify-center min-w-[3rem]">
                              <span className="font-['Inter'] text-[10px] font-bold leading-[1rem] uppercase">{isNaN(day) ? 'TBD' : month}</span>
                              <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] leading-none mt-1">{isNaN(day) ? '-' : day}</span>
                            </div>
                            <div>
                              <p className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface">{sched.timeSlot || `${selectedClassDetail.startTime} - ${selectedClassDetail.endTime}`}</p>
                              <p className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant mt-1">{sched.content || `Week ${sched.week}`}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
                
                {selectedClassDetail.videoUrl && (
                  <section className="mt-[2.5rem]">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface mb-[1rem]">Reference Material</h3>
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm bg-surface-container-highest flex items-center justify-center cursor-pointer group hover:shadow-md transition-shadow">
                      <img 
                        alt="Video thumbnail" 
                        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500" 
                        src={selectedClassDetail.imageUrl || group.coverImage || "https://lh3.googleusercontent.com/aida-public/AB6AXuD6W7noZkrevreOOeX5vYgFSyaUmskVpt1LX7TRmZWZnfMADsIRn2eHVgkp8eNVIbo2HO--zrfVbzchg6WASxZ8tVhlEiCrS3eVOTr7P_bnf-IeLkQxZK1STzp6dPOCTM1pKwUt-o8BBS7sjBOujRHp9CKldSx5NgBNkhXqRKYr4TgSdJTedsePVy3KX76RhwgSRlHQ9WbQVAFWk3VaN3HDgc_UhmvHh5HcJhAz8FYxH9uIvnLcLKTUshwO96RbxvM9RPJTz7tQfE8"}
                      />
                      <div className="relative z-10 w-16 h-16 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                      </div>
                    </div>
                  </section>
                )}
              </main>
              
              <div className="fixed bottom-6 right-6 z-50 flex gap-3">
                <button 
                  onClick={() => setSelectedClassDetail(null)}
                  className="bg-surface text-primary border border-primary font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-sm hover:bg-primary-fixed transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined">close</span>
                  Cancel
                </button>
                
                {selectedClasses.has(selectedClassDetail.id) ? (
                  <button 
                    onClick={(e) => handleRemoveFromBasket(selectedClassDetail.id, e)}
                    className="bg-surface text-error border border-error font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-sm hover:bg-error-container transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">remove_shopping_cart</span>
                    Remove
                  </button>
                ) : (
                  <button 
                    onClick={() => handleAddToBasket(selectedClassDetail.id)}
                    className="bg-primary text-on-primary font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] py-4 px-6 rounded-full shadow-[0_10px_25px_rgba(0,65,144,0.4)] hover:shadow-[0_15px_35px_rgba(0,65,144,0.5)] hover:-translate-y-1 transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined">shopping_basket</span>
                    Add to Basket
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Information Popup Modal */}
      {isApplyModalOpen && (() => {
        const subtotal = Array.from(selectedClasses).reduce((sum, id) => {
          const item = allItems.find(c => c.id === id);
          return sum + (item?.amount || 0);
        }, 0);
        
        const currency = selectedClasses.size > 0 
          ? allItems.find(c => c.id === Array.from(selectedClasses)[0])?.currency || "KRW"
          : "KRW";

        return (
          <>
            {/* Dark Overlay */}
            <div className="fixed inset-0 bg-on-background/60 backdrop-blur-sm z-[200] animate-in fade-in duration-200"></div>
            
            {/* Popup Container */}
            <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
              {/* Popup Card */}
              <div className="bg-surface-container-lowest rounded-[24px] shadow-2xl overflow-hidden flex flex-col w-full max-w-[400px] max-h-[90vh] animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-surface-variant flex items-center justify-between bg-surface-bright flex-shrink-0">
                  <h2 className="font-['Plus_Jakarta_Sans'] text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] text-on-surface">Payment Information</h2>
                  <button 
                    onClick={() => setIsApplyModalOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-outline"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                
                {/* Scrollable Content */}
                <div className="px-6 py-6 overflow-y-auto flex flex-col gap-[2.5rem]">
                  
                  {/* Role Selection Section */}
                  <section className="flex flex-col gap-4">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">Your Role <span className="text-error">*</span></h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer relative">
                        <input 
                          type="radio" 
                          name="user_role" 
                          className="peer sr-only" 
                          checked={selectedRole === 'leader'}
                          onChange={() => setSelectedRole('leader')}
                        />
                        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-4 text-center peer-checked:border-primary peer-checked:bg-primary/5 transition-all h-full flex items-center justify-center">
                          <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface peer-checked:text-primary font-semibold block">Leader</span>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                      </label>
                      <label className="cursor-pointer relative">
                        <input 
                          type="radio" 
                          name="user_role" 
                          className="peer sr-only" 
                          checked={selectedRole === 'follower'}
                          onChange={() => setSelectedRole('follower')}
                        />
                        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-4 text-center peer-checked:border-primary peer-checked:bg-primary/5 transition-all h-full flex items-center justify-center">
                          <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface peer-checked:text-primary font-semibold block">Follower</span>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                      </label>
                    </div>
                  </section>

                  {/* Applied Classes Section */}
                  <section className="flex flex-col gap-4">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">Applied Items</h3>
                    <div className="bg-surface-container-low rounded-xl border border-outline-variant overflow-hidden">
                      <ul className="divide-y divide-outline-variant">
                        {Array.from(selectedClasses).map(classId => {
                          const item = allItems.find(c => c.id === classId);
                          if (!item) return null;
                          return (
                            <li key={classId} className="p-4 flex justify-between items-center bg-surface-container-lowest">
                              <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant line-clamp-1 mr-4">{item.title}</span>
                              <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface font-semibold flex-shrink-0">
                                {item.amount ? item.amount.toLocaleString() : "0"} {item.currency || "KRW"}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                      {/* Total Row */}
                      <div className="p-4 bg-primary-container/10 border-t border-primary/20 flex justify-between items-center">
                        <span className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-primary">Total Amount</span>
                        <span className="font-['Plus_Jakarta_Sans'] text-[1.5rem] font-extrabold leading-[2rem] tracking-[-0.025em] text-primary">
                          {subtotal.toLocaleString()} {currency}
                        </span>
                      </div>
                    </div>
                  </section>
                  
                  {/* Bank Info Section */}
                  <section className="flex flex-col gap-3">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">Transfer Details</h3>
                    <div className="bg-surface-container p-4 rounded-xl border border-surface-variant flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0 text-primary">
                        <span className="material-symbols-outlined">account_balance</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-['Inter'] text-[0.75rem] font-semibold leading-[1rem] text-on-surface-variant mb-1">Bank Account</span>
                        <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface font-semibold tracking-wide">
                          {group.classPaymentSettings?.bankDetails?.bankName || "Kakao Bank"} {group.classPaymentSettings?.bankDetails?.accountNumber || "111111"}
                        </span>
                        <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface-variant mt-0.5">
                          {group.classPaymentSettings?.bankDetails?.accountHolder || group.ownerId || "Hong"}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          const bankInfo = `${group.classPaymentSettings?.bankDetails?.bankName || "Kakao Bank"} ${group.classPaymentSettings?.bankDetails?.accountNumber || "111111"}`;
                          navigator.clipboard.writeText(bankInfo);
                          alert("Account info copied to clipboard!");
                        }}
                        className="ml-auto text-primary hover:text-primary-container p-2 rounded-lg hover:bg-primary/5 transition-colors self-center"
                      >
                        <span className="material-symbols-outlined">content_copy</span>
                      </button>
                    </div>
                  </section>
                  
                  {/* Payment Status Section */}
                  <section className="flex flex-col gap-3">
                    <h3 className="font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] text-on-surface">Payment Status</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="cursor-pointer relative">
                        <input 
                          type="radio" 
                          name="payment_status" 
                          className="peer sr-only" 
                          checked={paymentStatus === 'paid'}
                          onChange={() => setPaymentStatus('paid')}
                        />
                        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-4 text-center peer-checked:border-primary peer-checked:bg-primary/5 transition-all h-full flex items-center justify-center">
                          <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface peer-checked:text-primary font-semibold block">Already Paid</span>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                      </label>
                      <label className="cursor-pointer relative">
                        <input 
                          type="radio" 
                          name="payment_status" 
                          className="peer sr-only" 
                          checked={paymentStatus === 'pay_later'}
                          onChange={() => setPaymentStatus('pay_later')}
                        />
                        <div className="bg-surface-container-lowest border-2 border-outline-variant rounded-xl p-4 text-center peer-checked:border-primary peer-checked:bg-primary/5 transition-all h-full flex items-center justify-center">
                          <span className="font-['Inter'] text-[0.875rem] font-medium leading-[1.25rem] text-on-surface peer-checked:text-primary font-semibold block">Pay After Application</span>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 peer-checked:opacity-100 transition-opacity text-primary">
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        </div>
                      </label>
                    </div>
                  </section>
                </div>
                
                {/* Footer Action */}
                <div className="p-6 bg-surface-bright border-t border-surface-variant flex-shrink-0">
                  <button 
                    onClick={async () => {
                      if (!user) {
                        toast.error("로그인이 필요합니다.");
                        return;
                      }
                      if (!selectedRole) {
                        toast.error("리더/팔로어 역할을 선택해주세요.");
                        return;
                      }
                      setIsApplying(true);
                      try {
                        for (const classId of Array.from(selectedClasses)) {
                          const item = allItems.find(c => c.id === classId);
                          if (!item) continue;
                          
                          const regData: any = {
                            classId: item.id,
                            groupId: groupId,
                            userId: user.uid,
                            classTitle: item.title,
                            applicantName: profile?.nickname || 'Unknown',
                            status: paymentStatus === 'paid' ? 'PAYMENT_REPORTED' : 'PAYMENT_PENDING',
                            amount: item.amount || 0,
                            currency: item.currency || 'KRW',
                            role: selectedRole === 'leader' ? 'Leader' : 'Follower'
                          };

                          await classRegistrationService.addRegistration(regData);
                        }
                        setIsApplyModalOpen(false);
                        setShowSuccess(true);
                        setSelectedClasses(new Set());
                      } catch (error: any) {
                        console.error("Error applying:", error?.code, error?.message, error);
                        alert(`[Error] 신청이 실패했습니다.\n\n사유: ${error?.code || error?.message || '알 수 없는 오류'}\n\n※ 만약 'permission-denied' 에러라면 Firebase Firestore Rules에 'class_registrations' 컬렉션 쓰기 권한이 없는 것입니다.`);
                      } finally {
                        setIsApplying(false);
                      }
                    }}
                    disabled={isApplying}
                    className="w-full bg-primary text-on-primary font-['Plus_Jakarta_Sans'] text-[1.125rem] font-bold leading-[1.5rem] py-4 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isApplying ? 'Processing...' : 'Apply Now'}
                  </button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

    </div>
  );
}
