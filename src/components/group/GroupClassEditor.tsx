import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Group, GroupClass, ClassDiscount, MonthlyPass } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";
import { toast } from "sonner";
import GroupClassAddEditor from "./GroupClassAddEditor";
import GroupClassDiscountEditor from "./GroupClassDiscountEditor";
import GroupClassMonthlyPassEditor from "./GroupClassMonthlyPassEditor";

interface GroupClassEditorProps {
  group: Group;
  onSave?: () => void;
}

type EditorType = 'add-class' | 'discount' | 'monthly-pass';

interface EditingState {
  type: EditorType;
  data: any;
}

const GroupClassEditor: React.FC<GroupClassEditorProps> = ({ group, onSave }) => {
  const [editingState, setEditingState] = useState<EditingState | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const classes = group.classes || [];
  const discounts = group.discounts || [];
  const passes = group.monthlyPasses || [];

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const formattedMonth = currentDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' });

  const handleDelete = async (type: 'class' | 'discount' | 'pass', id: string) => {
    toast.custom((t) => (
      <div className="bg-white border border-[var(--outline-variant)]/30 rounded-[28px] p-6 shadow-2xl backdrop-blur-xl max-w-md w-full">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-red-500 text-2xl font-black">delete_forever</span>
          </div>
          <div className="flex-1">
            <h4 className="font-headline font-black text-lg text-[var(--on-surface)] mb-1">삭제 확인</h4>
            <p className="text-[var(--on-surface-variant)] text-sm font-medium leading-relaxed">
              이 항목을 정말로 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => toast.dismiss(t)}
                className="flex-1 px-4 py-3 rounded-xl bg-[var(--surface-container-highest)] font-headline font-black text-[11px] uppercase tracking-widest text-[var(--on-surface)] hover:bg-[var(--surface-container-high)] transition-all"
              >
                취소
              </button>
              <button 
                onClick={async () => {
                  toast.dismiss(t);
                  executeDelete(type, id);
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 font-headline font-black text-[11px] uppercase tracking-widest text-white hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const executeDelete = async (type: 'class' | 'discount' | 'pass', id: string) => {
    setLoading(true);
    const promise = (async () => {
      let updateData: any = {};
      if (type === 'class') {
        updateData.classes = classes.filter(c => c.id !== id);
      } else if (type === 'discount') {
        updateData.discounts = discounts.filter(d => d.id !== id);
      } else if (type === 'pass') {
        updateData.monthlyPasses = passes.filter(p => p.id !== id);
      }

      await groupService.updateGroupMetadata(group.id, updateData);
      if (onSave) onSave();
    })();

    toast.promise(promise, {
      loading: '삭제 중...',
      success: '삭제되었습니다.',
      error: '삭제에 실패했습니다.',
    });

    try {
      await promise;
    } catch (error) {
      console.error(`Failed to delete ${type}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  } as const;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col min-h-screen font-body pb-32 bg-[#f8faff]"
    >
      {/* Header */}
      <header className="px-10 py-12 w-full bg-white border-b border-[#efefff] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0057bd]/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="max-w-5xl mx-auto flex items-center justify-between relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1.5 h-6 bg-[#0057bd] rounded-full" />
              <span className="text-[10px] font-black text-[#0057bd] uppercase tracking-[0.3em]">Administrative</span>
            </div>
            <h1 className="font-headline font-black text-4xl tracking-tight text-[#242c51]">Class Setting</h1>
            <p className="text-[#515981] text-sm mt-2 font-bold opacity-70">Manage community class schedules, discount packages, and monthly passes.</p>
          </div>
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-[#a3abd7] uppercase tracking-widest">Active Services</p>
              <p className="text-xl font-black text-[#242c51]">{classes.length + discounts.length + passes.length}</p>
            </div>
            <div className="w-14 h-14 bg-[#0057bd] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-[#0057bd]/20">
              <span className="material-symbols-outlined text-3xl">dashboard_customize</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-12 w-full text-[#242c51] space-y-16">
        {/* Quick Actions */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button 
            onClick={() => setEditingState({ type: 'add-class', data: null })}
            className="group relative flex flex-col items-center justify-center gap-3 p-8 bg-[#0057bd] text-white rounded-[2.5rem] font-black font-headline text-xs uppercase tracking-widest hover:shadow-2xl hover:shadow-[#0057bd]/30 transition-all active:scale-[0.97] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">add_circle</span>
            </div>
            <span>신규 수업 추가</span>
          </button>

          <button 
            onClick={() => setEditingState({ type: 'discount', data: null })}
            className="group relative flex flex-col items-center justify-center gap-3 p-8 bg-white text-[#223ea2] border-2 border-[#efefff] rounded-[2.5rem] font-black font-headline text-xs uppercase tracking-widest hover:border-[#223ea2]/30 transition-all active:scale-[0.97] shadow-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#223ea2]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 bg-[#223ea2]/5 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">percent</span>
            </div>
            <span>할인 패키지 추가</span>
          </button>

          <button 
            onClick={() => setEditingState({ type: 'monthly-pass', data: null })}
            className="group relative flex flex-col items-center justify-center gap-3 p-8 bg-white text-[#5e106a] border-2 border-[#f199f7]/30 rounded-[2.5rem] font-black font-headline text-xs uppercase tracking-widest hover:border-[#f199f7]/60 transition-all active:scale-[0.97] shadow-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#f199f7]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="w-14 h-14 bg-[#f199f7]/10 rounded-2xl flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
            </div>
            <span>정기권 추가</span>
          </button>
        </section>

        {/* Classes Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#0057bd]/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#0057bd] text-2xl">school</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline text-[#242c51] tracking-tight">개설된 수업</h2>
                <p className="text-[10px] font-bold text-[#a3abd7] uppercase tracking-[0.2em] mt-1">Regular Course Management</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white border border-[#efefff] rounded-full text-[10px] font-black text-[#515981] uppercase tracking-widest shadow-sm">
              {classes.length} 수업 개설됨
            </div>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 gap-5"
          >
            {classes.length === 0 ? (
              <motion.div variants={itemVariants} className="bg-white border-2 border-dashed border-[#efefff] rounded-[3rem] p-20 text-center shadow-sm">
                <div className="w-20 h-20 bg-[#f8faff] rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                  <span className="material-symbols-outlined text-[#a3abd7] text-4xl">add_task</span>
                </div>
                <h3 className="text-lg font-black text-[#242c51] uppercase tracking-tight mb-2">개설된 수업이 없습니다</h3>
                <p className="text-[#a3abd7] text-sm font-bold opacity-80">첫 번째 정규 수업을 추가해 보세요.</p>
              </motion.div>
            ) : (
              classes.map((cls) => (
                <motion.div 
                  key={cls.id} 
                  variants={itemVariants}
                  onClick={() => setEditingState({ type: 'add-class', data: cls })}
                  className="group/card cursor-pointer bg-white border border-[#efefff] rounded-[2.5rem] p-8 transition-all hover:border-[#0057bd]/40 shadow-[0_4px_20px_-4px_rgba(36,44,81,0.02)] hover:shadow-[0_20px_40px_-8px_rgba(0,87,189,0.1)] active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-8 relative z-10">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-4">
                        <h3 className="text-xl font-black text-[#242c51] truncate headline tracking-tight group-hover/card:text-[#0057bd] transition-colors">{cls.title}</h3>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider border transition-all ${
                          cls.status === 'Open' 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-gray-50 text-gray-500 border-gray-100'
                        }`}>
                          {cls.status === 'Open' ? '모집 중' : '마감'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#f8faff] rounded-xl flex items-center justify-center group-hover/card:bg-[#0057bd]/5 transition-colors">
                            <span className="material-symbols-outlined text-lg text-[#0057bd]">layers</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-[#a3abd7] uppercase tracking-widest">수업 레벨</p>
                            <p className="text-xs font-bold text-[#515981] uppercase">{cls.level}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#f8faff] rounded-xl flex items-center justify-center group-hover/card:bg-[#0057bd]/5 transition-colors">
                            <span className="material-symbols-outlined text-lg text-[#0057bd]">payments</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-[#a3abd7] uppercase tracking-widest">수강료</p>
                            <p className="text-xs font-black text-[#242c51]">{cls.currency === 'KRW' ? '₩' : cls.currency} {cls.amount.toLocaleString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#f8faff] rounded-xl flex items-center justify-center group-hover/card:bg-[#0057bd]/5 transition-colors">
                            <span className="material-symbols-outlined text-lg text-[#0057bd]">schedule</span>
                          </div>
                          <div>
                            <p className="text-[9px] font-black text-[#a3abd7] uppercase tracking-widest">수업 횟수</p>
                            <p className="text-xs font-bold text-[#515981]">{cls.schedule?.length || 0} 세션</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="hidden sm:flex -space-x-3">
                        {cls.instructors.map((inst, i) => (
                          <div key={i} className="relative group/avatar">
                            <img 
                              alt={inst.name} 
                              className="w-12 h-12 rounded-[1.25rem] border-4 border-white object-cover shadow-lg bg-gray-100" 
                              src={inst.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${inst.name}`}
                            />
                            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-[#242c51] text-white text-[9px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover/avatar:opacity-100 transition-all whitespace-nowrap z-20 shadow-xl pointer-events-none uppercase tracking-widest scale-90 group-hover/avatar:scale-100">
                              {inst.name}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="w-px h-12 bg-[#efefff]" />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete('class', cls.id);
                        }}
                        className="w-14 h-14 flex items-center justify-center text-[#ff4b4b] hover:bg-[#ff4b4b]/5 rounded-[1.5rem] transition-all active:scale-90 group/delete"
                        disabled={loading}
                      >
                        <span className="material-symbols-outlined text-2xl group-hover/delete:scale-110 transition-transform">delete</span>
                      </button>
                    </div>
                  </div>
                  {/* Progress Line */}
                  <div className="absolute bottom-0 left-0 h-1 bg-[#0057bd] transition-all duration-500 opacity-0 group-hover/card:opacity-100" style={{ width: '4px' }} />
                </motion.div>
              ))
            )}
          </motion.div>
        </section>

        {/* Discounts Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#223ea2]/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-[#223ea2] text-2xl">loyalty</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline text-[#242c51] tracking-tight">번들 및 할인 패키지</h2>
                <p className="text-[10px] font-bold text-[#a3abd7] uppercase tracking-[0.2em] mt-1">Pricing Strategy Management</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white border border-[#efefff] rounded-full text-[10px] font-black text-[#515981] uppercase tracking-widest shadow-sm">
              {discounts.length} 패키지
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {discounts.length === 0 ? (
              <div className="col-span-full bg-white border-2 border-[#efefff] rounded-[3rem] p-16 text-center shadow-sm">
                <p className="text-[#a3abd7] text-sm font-black headline uppercase tracking-widest opacity-60">등록된 할인 패키지가 없습니다</p>
              </div>
            ) : (
              discounts.map((discount) => (
                <div 
                  key={discount.id} 
                  onClick={() => setEditingState({ type: 'discount', data: discount })}
                  className="group cursor-pointer bg-white border border-[#efefff] rounded-[2.5rem] p-8 transition-all hover:border-[#223ea2]/40 shadow-sm hover:shadow-xl hover:shadow-[#223ea2]/5 active:scale-[0.99] relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#223ea2]/5 rounded-bl-[4rem] -mr-8 -mt-8 transition-all group-hover:scale-110" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#223ea2] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#223ea2]/20">
                          <span className="material-symbols-outlined text-xl">sell</span>
                        </div>
                        <h3 className="text-lg font-black text-[#242c51] headline tracking-tight group-hover:text-[#223ea2] transition-colors">{discount.title}</h3>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete('discount', discount.id);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-[#ff4b4b] hover:bg-[#ff4b4b]/5 rounded-xl transition-all"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[9px] font-black text-[#a3abd7] uppercase tracking-[0.2em] mb-1">패키지 요금</p>
                        <p className="text-2xl font-black text-[#223ea2] tracking-tight">{discount.currency === 'KRW' ? '₩' : discount.currency} {discount.amount.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-bold text-[#515981] opacity-70 mb-1">{discount.includedClassIds.length}개 수업 포함</p>
                        <span className="bg-[#223ea2]/10 text-[#223ea2] text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">번들 할인 적용</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Monthly Passes Section */}
        <section className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#f199f7]/20 to-[#d66edc]/10 rounded-2xl flex items-center justify-center shadow-inner border border-[#f199f7]/20">
                <span className="material-symbols-outlined text-[#d66edc] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>confirmation_number</span>
              </div>
              <div>
                <h2 className="text-2xl font-black font-headline text-[#242c51] tracking-tight">월간 정기 멤버십</h2>
                <p className="text-[10px] font-bold text-[#a3abd7] uppercase tracking-[0.2em] mt-1">Subscription Pass Management</p>
              </div>
            </div>
            <div className="px-4 py-2 bg-white border border-[#efefff] rounded-full text-[10px] font-black text-[#515981] uppercase tracking-widest shadow-sm">
              {passes.length} 정기권
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {passes.length === 0 ? (
              <div className="col-span-full bg-white border-2 border-dashed border-[#efefff] rounded-[3rem] p-16 text-center shadow-sm">
                <div className="w-16 h-16 bg-[#f8faff] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-[#a3abd7] text-3xl">confirmation_number</span>
                </div>
                <p className="text-[#a3abd7] text-sm font-black headline uppercase tracking-widest opacity-60">등록된 정기권이 없습니다</p>
              </div>
            ) : (
              passes.map((pass) => (
                <div 
                  key={pass.id} 
                  onClick={() => setEditingState({ type: 'monthly-pass', data: pass })}
                  className="group/card cursor-pointer bg-white border border-[#efefff] rounded-[2.5rem] p-8 transition-all hover:border-[#f199f7] shadow-[0_4px_20px_-4px_rgba(36,44,81,0.02)] hover:shadow-[0_24px_48px_-12px_rgba(241,153,247,0.15)] active:scale-[0.99] relative overflow-hidden"
                >
                  {/* Decorative Gradient Background */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#f199f7]/5 to-transparent rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover/card:scale-150" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#f199f7] via-[#d66edc] to-[#b84ec0] text-white rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-[#f199f7]/30 border border-white/20">
                          <span className="material-symbols-outlined text-2xl font-black" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-[#242c51] headline tracking-tight group-hover/card:text-[#d66edc] transition-colors">{pass.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="w-1.5 h-1.5 bg-[#d66edc] rounded-full" />
                             <p className="text-[10px] font-black text-[#d66edc] uppercase tracking-widest opacity-80">30일 무제한 이용권</p>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete('pass', pass.id);
                        }}
                        className="w-12 h-12 flex items-center justify-center text-[#ff4b4b] hover:bg-[#ff4b4b]/5 rounded-[1rem] transition-all group/delete"
                        disabled={loading}
                      >
                        <span className="material-symbols-outlined text-2xl group-hover/delete:scale-110 transition-transform">delete</span>
                      </button>
                    </div>

                    <div className="flex items-end justify-between gap-6 pt-4 border-t border-[#efefff]/60">
                      <div>
                        <p className="text-[10px] font-black text-[#a3abd7] uppercase tracking-[0.2em] mb-1.5">이용 요금</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm font-black text-[#5e106a] opacity-40">{pass.currency === 'KRW' ? '₩' : pass.currency}</span>
                          <span className="text-3xl font-black text-[#5e106a] tracking-tighter">{pass.amount.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-[#515981] opacity-60 leading-snug line-clamp-2 bg-[#f8faff] px-4 py-3 rounded-2xl border border-[#efefff]">
                          {pass.description || "포함된 모든 수업에 대한 무제한 이용 권한을 제공합니다."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Editors Overlay */}
      <AnimatePresence>
        {editingState?.type === "add-class" && (
          <GroupClassAddEditor 
            group={group} 
            initialData={editingState.data}
            onClose={() => setEditingState(null)} 
            onSave={onSave} 
          />
        )}
        {editingState?.type === "discount" && (
          <GroupClassDiscountEditor 
            group={group} 
            initialData={editingState.data}
            onClose={() => setEditingState(null)} 
            onSave={onSave} 
          />
        )}
        {editingState?.type === "monthly-pass" && (
          <GroupClassMonthlyPassEditor 
            group={group} 
            initialData={editingState.data}
            onClose={() => setEditingState(null)} 
            onSave={onSave} 
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default GroupClassEditor;
