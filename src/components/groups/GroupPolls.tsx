"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/firebase/clientApp";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  runTransaction, 
  serverTimestamp 
} from "firebase/firestore";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  question: string;
  type: "single" | "multiple";
  options: PollOption[];
  votes: Record<string, string[]>; // optionId -> uids[]
  author: {
    uid: string;
    name: string;
    avatar?: string;
  };
  createdAt: any;
  deadline: string;
  isAnonymous: boolean;
  isClosed: boolean;
}

interface GroupPollsProps {
  groupId: string;
  user: any;
  members: any[];
}

export default function GroupPolls({ groupId, user, members }: GroupPollsProps) {
  const { t } = useLanguage();
  
  // Real-time Polls Data
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "closed">("all");
  
  // Create Poll Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [pollType, setPollType] = useState<"single" | "multiple">("single");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 1. Firebase 실시간 리스너 바인딩
  useEffect(() => {
    if (!groupId) return;

    const q = query(
      collection(db, "groups", groupId, "polls"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Poll[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Poll);
      });
      setPolls(list);
      setLoading(false);
    }, (err) => {
      console.error("Error reading polls:", err);
      toast.error(t("chat.settlement_action_failed", "불러오기에 실패했습니다."));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [groupId]);

  // 2. 투표 행사 처리 (트랜잭션 안전 제어)
  const handleVote = async (pollId: string, optionId: string, type: "single" | "multiple") => {
    if (!user) {
      toast.error(t("auth.login_required", "로그인이 필요합니다."));
      return;
    }

    try {
      const pollRef = doc(db, "groups", groupId, "polls", pollId);
      
      await runTransaction(db, async (transaction) => {
        const sfDoc = await transaction.get(pollRef);
        if (!sfDoc.exists()) {
          throw new Error("Document does not exist!");
        }

        const data = sfDoc.data() as Omit<Poll, "id">;
        const currentVotes = { ...data.votes };

        // Ensure option arrays exist
        data.options.forEach(opt => {
          if (!currentVotes[opt.id]) {
            currentVotes[opt.id] = [];
          }
        });

        if (type === "single") {
          // 단일선택: 해당 유저의 기존 투표 기록을 모든 옵션에서 삭제하고 새 선택지에만 추가
          Object.keys(currentVotes).forEach((optId) => {
            currentVotes[optId] = (currentVotes[optId] || []).filter(uid => uid !== user.uid);
          });
          currentVotes[optionId] = [...(currentVotes[optionId] || []), user.uid];
        } else {
          // 다중선택: 토글 처리
          const optionUsers = currentVotes[optionId] || [];
          if (optionUsers.includes(user.uid)) {
            currentVotes[optionId] = optionUsers.filter(uid => uid !== user.uid);
          } else {
            currentVotes[optionId] = [...optionUsers, user.uid];
          }
        }

        transaction.update(pollRef, { votes: currentVotes });
      });

      toast.success(t("poll.toast_voted", "투표가 실시간 반영되었습니다!"));
    } catch (err) {
      console.error("Vote failure:", err);
      toast.error(t("chat.settlement_action_failed", "처리에 실패했습니다."));
    }
  };

  // 3. 투표 개설 처리 (Create Poll)
  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!question.trim()) {
      toast.error(t("poll.toast.enter_question", "질문을 입력해 주세요."));
      return;
    }

    const validOptions = options.map(opt => opt.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      toast.error(t("poll.toast.min_options", "최소 2개의 선택지가 필요합니다."));
      return;
    }

    setSubmitting(true);
    try {
      const votesRecord: Record<string, string[]> = {};
      const formattedOptions: PollOption[] = validOptions.map((text, index) => {
        const id = String.fromCharCode(97 + index); // a, b, c, d...
        votesRecord[id] = [];
        return { id, text };
      });

      const today = new Date();
      today.setDate(today.getDate() + 7);
      const defaultDeadline = today.toISOString().split("T")[0];

      const newPollData = {
        question: question.trim(),
        type: pollType,
        options: formattedOptions,
        votes: votesRecord,
        author: {
          uid: user.uid,
          name: user.displayName || "Anonymous",
          avatar: user.photoURL || ""
        },
        createdAt: serverTimestamp(),
        deadline: deadline || defaultDeadline,
        isAnonymous: !!isAnonymous,
        isClosed: false
      };

      await addDoc(collection(db, "groups", groupId, "polls"), newPollData);
      
      toast.success(t("poll.toast_created", "새 투표가 개설되었습니다!"));
      
      // Reset Form State
      setQuestion("");
      setOptions(["", ""]);
      setPollType("single");
      setIsAnonymous(false);
      setDeadline("");
      setIsModalOpen(false);
    } catch (err) {
      console.error("Create poll failure:", err);
      toast.error(t("chat.settlement_action_failed", "투표 생성에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  // 4. 투표 마감 처리 (Close Poll)
  const handleClosePoll = async (pollId: string) => {
    try {
      await updateDoc(doc(db, "groups", groupId, "polls", pollId), {
        isClosed: true
      });
      toast.success(t("poll.toast_closed", "투표가 마감되었습니다!"));
    } catch (err) {
      console.error("Close poll failure:", err);
      toast.error(t("chat.settlement_action_failed", "마감에 실패했습니다."));
    }
  };

  // 5. 투표 삭제 처리 (Delete Poll)
  const handleDeletePoll = async (pollId: string) => {
    if (!window.confirm(t("poll.confirm_delete", "이 투표를 영구 삭제하시겠습니까?"))) return;
    try {
      await deleteDoc(doc(db, "groups", groupId, "polls", pollId));
      toast.success(t("poll.toast_deleted", "투표가 삭제되었습니다!"));
    } catch (err) {
      console.error("Delete poll failure:", err);
      toast.error(t("chat.settlement_action_failed", "삭제에 실패했습니다."));
    }
  };

  // Option 동적 제어 함수
  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const addOptionSlot = () => {
    if (options.length >= 10) {
      toast.error(t("poll.toast.max_options", "최대 10개까지 선택지를 지정할 수 있습니다."));
      return;
    }
    setOptions([...options, ""]);
  };

  const removeOptionSlot = (index: number) => {
    if (options.length <= 2) {
      toast.error(t("poll.toast.min_options", "최소 2개의 선택지가 필요합니다."));
      return;
    }
    const updated = options.filter((_, i) => i !== index);
    setOptions(updated);
  };

  // Filtered Polls list
  const filteredPolls = polls.filter((p) => {
    if (filter === "active") return !p.isClosed;
    if (filter === "closed") return p.isClosed;
    return true;
  });

  return (
    <div className="px-4 py-6 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-black text-zinc-800 font-headline">
            {t("group.tab.polls", "투표")}
          </h2>
          <p className="text-[12.5px] text-zinc-400 font-body">
            {t("poll.subtitle", "멤버들의 지혜를 모으고 합리적인 결정을 내립니다.")}
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl text-[13px] font-black shadow-md hover:shadow-lg active:scale-98 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          {t("poll.create", "투표 만들기")}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-zinc-100/50 p-1 rounded-2xl w-fit">
        {(["all", "active", "closed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-[12px] font-black capitalize transition-all ${
              filter === f
                ? "bg-white text-blue-600 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
            }`}
          >
            {f === "all" 
              ? t("poll.filter.all", "전체") 
              : f === "active" 
                ? t("poll.filter.active", "진행중") 
                : t("poll.filter.closed", "마감됨")}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
          <span className="material-symbols-outlined text-3xl animate-spin mb-2">autorenew</span>
          <span className="text-xs">{t("poll.syncing", "실시간 투표 목록 동기화 중...")}</span>
        </div>
      ) : filteredPolls.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-zinc-100 rounded-3xl">
          <span className="material-symbols-outlined text-4xl text-zinc-300 mb-3">how_to_vote</span>
          <p className="text-[13px] font-bold text-zinc-400">{t("poll.no_polls", "등록된 투표가 없습니다.")}</p>
          <p className="text-[11px] text-zinc-400/80 mt-1">{t("poll.no_polls_desc", "상단의 투표 만들기 단추를 눌러 첫 제안을 올릴 수 있습니다.")}</p>
        </div>
      ) : (
        /* Poll Cards List */
        <div className="space-y-5">
          {filteredPolls.map((poll) => {
            // Calculate total participants (unique users who voted)
            const allVotersSet = new Set<string>();
            Object.values(poll.votes || {}).forEach((uids) => {
              uids.forEach(uid => allVotersSet.add(uid));
            });
            const totalVotersCount = allVotersSet.size;

            const isAuthor = user && poll.author?.uid === user.uid;

            return (
              <div
                key={poll.id}
                className={`bg-white border rounded-3xl p-5.5 relative transition-all ${
                  poll.isClosed 
                    ? "border-zinc-100 opacity-70" 
                    : "border-zinc-100 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Poll Top Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-blue-600 text-[18px]">how_to_vote</span>
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-zinc-700 leading-none mb-1">
                        {poll.author?.name || "Anonymous"}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {t("poll.ends_at", { date: poll.deadline })}
                      </p>
                    </div>
                  </div>
                  
                  {/* Badge Row */}
                  <div className="flex items-center gap-1.5">
                    {poll.isAnonymous && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-100/30 text-amber-600 text-[9.5px] font-black">
                        {t("poll.anonymous_label", "익명")}
                      </span>
                    )}
                    {poll.isClosed ? (
                      <span className="px-2 py-0.5 rounded-lg bg-zinc-100 text-zinc-500 text-[9.5px] font-black">
                        {t("poll.closed", "마감됨")}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 text-[9.5px] font-black">
                        {poll.type === "multiple" 
                          ? t("poll.multiple_choice", "복수선택") 
                          : t("poll.single_choice", "단일선택")}
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <h3 className="text-[15.5px] font-extrabold text-zinc-800 mb-4 leading-snug">
                  {poll.question}
                </h3>

                {/* Options List */}
                <div className="space-y-2.5 mb-4.5">
                  {poll.options.map((opt) => {
                    const uids = poll.votes?.[opt.id] || [];
                    const isVoted = user ? uids.includes(user.uid) : false;
                    
                    // Percentage calculation
                    const percentage = totalVotersCount > 0 
                      ? Math.round((uids.length / totalVotersCount) * 100) 
                      : 0;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => !poll.isClosed && handleVote(poll.id, opt.id, poll.type)}
                        disabled={poll.isClosed}
                        className={`w-full text-left relative overflow-hidden rounded-2xl p-3.5 transition-all border ${
                          isVoted
                            ? "bg-blue-50/30 border-blue-500/30"
                            : "bg-zinc-50/50 border-zinc-100/40 hover:border-zinc-200"
                        }`}
                      >
                        {/* Interactive result percentage bar */}
                        <div
                          className={`absolute inset-y-0 left-0 rounded-2xl transition-all duration-700 ease-out ${
                            isVoted ? "bg-blue-500/10" : "bg-zinc-200/20"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                        
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox / Radio indicator circle */}
                            <div className={`w-4.5 h-4.5 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                              isVoted 
                                ? "border-blue-500 bg-blue-500" 
                                : "border-zinc-300"
                            }`}>
                              {isVoted && (
                                <span className="material-symbols-outlined text-white text-[12px] font-black">check</span>
                              )}
                            </div>
                            <span className={`text-[13.5px] truncate ${
                              isVoted ? "font-extrabold text-blue-600" : "text-zinc-700"
                            }`}>
                              {opt.text}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            <span className="text-[12.5px] font-black text-zinc-700">
                              {percentage}%
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              ({uids.length}{t("poll.votes", "표")})
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Poll Footer Toolbar */}
                <div className="flex items-center justify-between text-[11.5px] text-zinc-400 border-t border-zinc-50 pt-3">
                  <div className="flex items-center gap-1.5 font-bold">
                    <span className="material-symbols-outlined text-[15px] text-zinc-400 shrink-0">group</span>
                    <span>{t("poll.total_voters", { count: totalVotersCount })}</span>
                  </div>

                  {/* Creator specific action trigger */}
                  {isAuthor && (
                    <div className="flex items-center gap-2">
                      {!poll.isClosed && (
                        <button 
                          onClick={() => handleClosePoll(poll.id)}
                          className="px-2.5 py-1 text-zinc-500 hover:text-amber-600 bg-zinc-100 hover:bg-amber-50 border border-zinc-200 rounded-lg transition-all font-black"
                        >
                          {t("poll.close_action", "마감하기")}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeletePoll(poll.id)}
                        className="px-2.5 py-1 text-zinc-400 hover:text-red-600 bg-zinc-100 hover:bg-red-50 border border-zinc-200 rounded-lg transition-all font-black"
                      >
                        {t("poll.delete_action", "삭제")}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. 투표 생성 팝업 모달 창 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop screen */}
          <div 
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="bg-white border border-zinc-100 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative z-10 animate-in zoom-in-95 duration-200">
            {/* Top Bar Accent */}
            <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 w-full" />
            
            <form onSubmit={handleCreatePoll} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-black text-zinc-800 font-headline">
                  {t("poll.create", "투표 만들기")}
                </h3>
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-700"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Question form field */}
              <div className="space-y-1.5">
                <label className="text-[11.5px] font-black text-zinc-500 uppercase tracking-wider block">
                  {t("poll.question", "투표 질문 *")}
                </label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t("poll.question_placeholder", "예: 우리 이번 주 모임 뒤풀이 장소 어디가 좋을까요?")}
                  className="w-full bg-zinc-50 border border-zinc-100 focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-3.5 text-[13.5px] font-bold transition-all"
                />
              </div>

              {/* Options Dynamic Slot Field */}
              <div className="space-y-2">
                <label className="text-[11.5px] font-black text-zinc-500 uppercase tracking-wider block">
                  {t("poll.options", "투표 선택지 *")}
                </label>
                
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {options.map((opt, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={opt}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={t("poll.option_slot_label", { index: index + 1 })}
                        className="w-full bg-zinc-50 border border-zinc-100 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-2.5 text-[12.5px] font-bold transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => removeOptionSlot(index)}
                        className="w-8 h-8 shrink-0 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-50 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                      </button>
                    </div>
                  ))}
                </div>
                
                <button
                  type="button"
                  onClick={addOptionSlot}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-zinc-500 hover:text-blue-600 hover:bg-blue-50/50 border border-dashed border-zinc-200 hover:border-blue-200 rounded-xl text-[11px] font-black transition-all"
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  {t("poll.add_option", "선택지 추가")}
                </button>
              </div>

              {/* Deadline & Settings Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-black text-zinc-500 uppercase tracking-wider block">
                    {t("poll.deadline", "마감 기한")}
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl px-4 py-3 text-[12.5px] font-bold transition-all text-zinc-700"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[11.5px] font-black text-zinc-500 uppercase tracking-wider block">
                    {t("poll.choice_type", "선택 방식")}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPollType("single")}
                      className={`flex-1 py-3 text-[11px] font-black rounded-2xl border transition-all ${
                        pollType === "single"
                          ? "bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-zinc-50 border-zinc-100 text-zinc-500"
                      }`}
                    >
                      {t("poll.single_choice", "단일선택")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPollType("multiple")}
                      className={`flex-1 py-3 text-[11px] font-black rounded-2xl border transition-all ${
                        pollType === "multiple"
                          ? "bg-blue-50 border-blue-500 text-blue-600"
                          : "bg-zinc-50 border-zinc-100 text-zinc-500"
                      }`}
                    >
                      {t("poll.multiple_choice", "복수선택")}
                    </button>
                  </div>
                </div>
              </div>

              {/* Toggles (Anonymous) */}
              <div className="flex items-center justify-between bg-zinc-50/50 p-3 rounded-2xl border border-zinc-100/50">
                <div className="flex flex-col">
                  <span className="text-[12.5px] font-black text-zinc-700">
                    {t("poll.anonymous", "익명 투표")}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {t("poll.anonymous_desc", "누가 어떤 항목에 투표했는지 밝히지 않습니다.")}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`w-10 h-6.5 rounded-full p-1 transition-all ${
                    isAnonymous ? "bg-blue-600 flex justify-end" : "bg-zinc-300 flex justify-start"
                  }`}
                >
                  <div className="w-4.5 h-4.5 rounded-full bg-white shadow-xs" />
                </button>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2 border-t border-zinc-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3.5 text-zinc-500 hover:text-zinc-800 text-[13px] font-black bg-zinc-50 border border-zinc-100 rounded-2xl transition-all font-body"
                >
                  {t("poll.cancel", "취소")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3.5 text-white text-[13px] font-black bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-md hover:shadow-lg hover:from-blue-700 active:scale-98 transition-all flex items-center justify-center gap-1.5 font-body"
                >
                  {submitting && (
                    <span className="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                  )}
                  {t("poll.submit", "투표 올리기")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
