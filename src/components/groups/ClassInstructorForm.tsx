"use client";
// 클래스 등록 시 강사를 검색하고 지정하는 폼 컴포넌트 (소셜 오거나이저 UI 100% 완전 동기화)

import React, { useState } from "react";
import { PlatformUser } from "@/types/user";

interface InstructorEntry {
  name: string;
  role: string;
  userId: string;
  avatar?: string;
}

interface ClassInstructorFormProps {
  instructors: InstructorEntry[];
  allUsers: PlatformUser[];
  t: (key: string) => string;
  onAddInstructor: (user: PlatformUser) => void;
  onRemoveInstructor: (index: number) => void;
}

export const ClassInstructorForm: React.FC<ClassInstructorFormProps> = ({
  instructors,
  allUsers,
  t,
  onAddInstructor,
  onRemoveInstructor,
}) => {
  const [instructorSearchName, setInstructorSearchName] = useState("");
  const [instructorResults, setInstructorResults] = useState<PlatformUser[]>([]);
  const [showInstructorResults, setShowInstructorResults] = useState(false);

  const handleInstructorSearch = (val: string) => {
    setInstructorSearchName(val);
    if (val.trim().length >= 1) {
      const lower = val.toLowerCase().trim();
      const filtered = allUsers.filter(u =>
        (u.nickname && u.nickname.toLowerCase().includes(lower)) ||
        (u.nativeNickname && u.nativeNickname.toLowerCase().includes(lower))
      );
      setInstructorResults(filtered.slice(0, 8));
      setShowInstructorResults(true);
    } else {
      setShowInstructorResults(false);
      setInstructorResults([]);
    }
  };

  const handleSelectInstructor = (u: PlatformUser) => {
    onAddInstructor(u);
    setInstructorSearchName("");
    setShowInstructorResults(false);
  };

  const handleAddFreeText = () => {
    if (!instructorSearchName.trim()) return;
    const name = instructorSearchName.trim();
    onAddInstructor({
      id: `free_${Date.now()}`,
      nickname: name,
      nativeNickname: name,
    } as PlatformUser);
    setInstructorSearchName("");
    setShowInstructorResults(false);
  };

  return (
    <div className="space-y-3">
      <label className="block text-[14px] font-bold text-[#acb3b4] mb-1.5">
        {t('class.instructors_label') || "강사 지정"}
      </label>

      {/* 선택된 강사 배지 영역 (검색창 위, 소셜 모달 100% 수평 레이아웃) */}
      {instructors.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e0e4e5]">
          {instructors.map((instructor, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 bg-white border border-[#e0e4e5] px-3 py-1.5 rounded-full shadow-sm"
            >
              <span className="material-symbols-rounded text-[14px] text-primary">person</span>
              <span className="text-xs font-bold text-[#2d3435]">{instructor.name}</span>
              <button
                type="button"
                onClick={() => onRemoveInstructor(index)}
                className="text-[#acb3b4] hover:text-red-500 transition-colors ml-1 flex items-center justify-center"
              >
                <span className="material-symbols-rounded text-[14px]">cancel</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 강사 검색 입력 창 */}
      <div className="relative z-30">
        <div className="relative flex items-center px-4 py-3 border border-[#e0e4e5] rounded-xl bg-[#f8f9fa] focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <span className="material-symbols-rounded text-[#acb3b4] mr-2">person_search</span>
          <input
            value={instructorSearchName}
            onChange={(e) => handleInstructorSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddFreeText();
              }
            }}
            onFocus={() => instructorSearchName.trim().length >= 1 && setShowInstructorResults(true)}
            onBlur={() => setTimeout(() => setShowInstructorResults(false), 200)}
            className="flex-1 bg-transparent border-none p-0 focus:ring-0 text-[16px] font-bold text-[#2d3435] placeholder:text-[#acb3b4] outline-none"
            placeholder={t('class.instructor_search_placeholder') || "강사 이름 검색 (엔터 입력시 추가)"}
            type="text"
          />
          {instructorSearchName.trim().length > 0 && (
            <button
              type="button"
              onClick={handleAddFreeText}
              className="ml-2 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-xs font-black hover:bg-primary/20 transition-colors shrink-0"
            >
              <span className="material-symbols-rounded text-[14px]">add</span>
            </button>
          )}
        </div>

        {/* 자동완성 드롭다운 */}
        {showInstructorResults && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-[#e0e4e5] rounded-xl shadow-lg z-50 overflow-hidden">
            {instructorResults.map(u => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleSelectInstructor(u)}
                className="w-full text-left px-4 py-3 hover:bg-[#f8f9fa] flex items-center gap-3 group transition-colors border-b border-[#f2f4f4] last:border-0 border-none"
              >
                <img
                  src={u.photoURL || "https://www.woc.today/images/default-avatar.png"}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="flex flex-col">
                  <p className="font-bold text-[#2d3435] text-sm group-hover:text-primary leading-tight">{u.nickname || u.id}</p>
                  {u.nativeNickname && <span className="text-xs text-[#acb3b4] font-medium leading-tight">{u.nativeNickname}</span>}
                </div>
              </button>
            ))}
            {instructorSearchName.trim() && (
              <button
                type="button"
                onClick={handleAddFreeText}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 cursor-pointer text-primary font-bold text-xs border-t border-[#e0e4e5] flex items-center gap-2"
              >
                <span className="material-symbols-rounded text-[16px]">add_circle</span>
                <span>"{instructorSearchName.trim()}" (직접 입력 강사로 추가)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

