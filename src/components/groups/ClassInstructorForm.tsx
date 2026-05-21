"use client";
// 클래스 등록 시 강사를 검색하고 지정하는 폼 컴포넌트

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
    if (val.length >= 1) {
      const lower = val.toLowerCase();
      const filtered = allUsers.filter(u =>
        u.nickname?.toLowerCase().includes(lower) ||
        u.nativeNickname?.includes(val) ||
        u.id.toLowerCase().includes(lower)
      );
      setInstructorResults(filtered.slice(0, 6));
      setShowInstructorResults(filtered.length > 0);
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

  return (
    <div className="space-y-3">
      <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">
        {t('class.instructors_label')}
      </label>
      <div className="relative z-30">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-gray-300">
            person_add
          </span>
          <input
            value={instructorSearchName}
            onChange={(e) => handleInstructorSearch(e.target.value)}
            onFocus={() => instructorSearchName.length >= 1 && setShowInstructorResults(instructorResults.length > 0)}
            onBlur={() => setTimeout(() => setShowInstructorResults(false), 200)}
            className="w-full bg-gray-50 border-none rounded-2xl pl-14 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-primary/10"
            placeholder={t('class.instructor_search_placeholder') || "Search instructors..."}
            type="text"
          />
        </div>
        {showInstructorResults && (
          <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-lg z-50 max-h-60 overflow-y-auto animate-in fade-in duration-200">
            {instructorResults.map(u => (
              <div
                key={u.id}
                onClick={() => handleSelectInstructor(u)}
                className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-b-0"
              >
                <img
                  src={u.photoURL || "https://www.woc.today/images/default-avatar.png"}
                  alt=""
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                />
                <div className="flex flex-col">
                  <p className="font-bold text-sm text-gray-800 leading-tight">{u.nickname || u.id}</p>
                  {u.nativeNickname && <span className="text-[10px] text-slate-400 font-medium leading-tight">{u.nativeNickname}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {instructors.length > 0 && (
        <div className="space-y-2 mt-3">
          {instructors.map((instructor, index) => (
            <div key={index} className="flex items-center gap-3 px-5 py-3 bg-gray-50 rounded-2xl">
              <div className="w-10 h-10 shrink-0 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {instructor.avatar ? (
                  <img src={instructor.avatar} alt={instructor.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-gray-400">person</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-800">{instructor.name}</p>
                <p className="text-[11px] font-bold text-gray-400">{instructor.role}</p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveInstructor(index)}
                className="material-symbols-outlined text-gray-300 hover:text-red-400 transition-colors p-1"
              >
                delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
