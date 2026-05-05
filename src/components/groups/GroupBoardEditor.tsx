"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Group, GroupBoard } from "@/types/group";
import { groupService } from "@/lib/firebase/groupService";

interface GroupBoardEditorProps {
  group: Group;
  onClose: () => void;
}

const GroupBoardEditor: React.FC<GroupBoardEditorProps> = ({ group, onClose }) => {
  const [boards, setBoards] = useState<GroupBoard[]>(group.boards || [
    { id: 'notice', title: "Group Announcements", permission: 'Only Admin', order: 0 }
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await groupService.updateGroupMetadata(group.id, {
        boards: boards
      });
      onClose();
    } catch (error) {
      console.error("Error saving boards:", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const addBoard = () => {
    if (boards.length >= 10) {
      alert("Maximum 10 boards allowed.");
      return;
    }
    const newBoard: GroupBoard = {
      id: Math.random().toString(36).substring(2, 9),
      title: "",
      permission: 'Everyone',
      order: boards.length
    };
    setBoards([...boards, newBoard]);
  };

  const deleteBoard = (id: string) => {
    if (id === 'notice') {
      alert("The mandatory notice board cannot be deleted.");
      return;
    }
    setBoards(boards.filter(b => b.id !== id));
  };

  const updateBoard = (id: string, updates: Partial<GroupBoard>) => {
    setBoards(boards.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[100] bg-[#f7f5ff] flex flex-col overflow-y-auto no-scrollbar font-body"
    >
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-[#f7f5ff]/80 backdrop-blur-xl border-b border-[#a3abd7]/10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center text-[#0057bd] hover:bg-[#0057bd]/5 transition-all"
            >
              <span className="material-symbols-outlined text-[#0057bd]">arrow_back</span>
            </button>
            <h1 className="text-base font-headline font-semibold text-[#242c51]">Board Settings</h1>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className={`px-8 py-2.5 rounded-xl font-headline font-black transition-all active:scale-95 ${
              isSaving
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-[#0057bd] text-white hover:bg-[#004bb3] shadow-lg shadow-blue-900/10"
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 pt-8 pb-32 w-full">
        {/* Section 1: Notice Board */}
        <section className="mb-10">
          <div className="flex items-end justify-between mb-4">
            <div>
              <span className="text-[#515981] font-label text-xs font-semibold uppercase tracking-widest block mb-1">Section 01</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#242c51] font-headline">Notice Board</h2>
            </div>
            <span className="bg-[#f199f7] text-[#5e106a] px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pinned</span>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-[#a3abd7]/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div>
                <label className="block text-sm font-semibold text-[#515981] mb-2">Board Title</label>
                <input 
                  className="w-full bg-[#efefff] border-none rounded-xl px-4 py-3 text-[#242c51] opacity-70 cursor-not-allowed font-medium" 
                  disabled 
                  type="text" 
                  value="Group Announcements"
                />
              </div>
              <div className="flex items-center justify-between bg-[#efefff]/50 p-4 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-[#242c51]">Who can post?</p>
                  <p className="text-xs text-[#515981]">Default setting for announcements</p>
                </div>
                <div className="bg-[#0057bd] text-white px-4 py-1.5 rounded-full text-xs font-bold">Only Admin</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Board List */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-[#515981] font-label text-xs font-semibold uppercase tracking-widest block mb-1">Section 02</span>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#242c51] font-headline">Board List</h2>
            </div>
            <div className="text-sm font-medium text-[#515981] bg-[#dde1ff] px-3 py-1 rounded-full">
              {boards.length} / 10 Boards
            </div>
          </div>
          <div className="flex flex-col gap-4">
            {boards.filter(b => b.id !== 'notice').map((board) => (
              <div key={board.id} className="bg-white rounded-xl p-6 shadow-sm group hover:ring-2 hover:ring-[#0057bd]/20 transition-all">
                <div className="flex flex-col md:flex-row gap-6 md:items-end">
                  <div className="flex-grow">
                    <label className="block text-sm font-semibold text-[#515981] mb-2">Board Title</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-[#efefff] focus:bg-white border-none focus:ring-2 focus:ring-[#0057bd] rounded-xl px-4 py-3 text-[#242c51] font-medium transition-all" 
                        type="text" 
                        placeholder="Enter board title..."
                        value={board.title}
                        onChange={(e) => updateBoard(board.id, { title: e.target.value })}
                      />
                      <span className="material-symbols-outlined absolute right-3 top-3 text-[#515981] opacity-30">drag_indicator</span>
                    </div>
                  </div>
                  <div className="md:w-64">
                    <label className="block text-sm font-semibold text-[#515981] mb-2">Who can post?</label>
                    <div className="flex bg-[#efefff] p-1 rounded-xl">
                      <button 
                        onClick={() => updateBoard(board.id, { permission: 'Only Admin' })}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${board.permission === 'Only Admin' ? 'bg-white shadow-sm text-[#0057bd]' : 'text-[#515981] hover:text-[#242c51]'}`}
                      >
                        Only Admin
                      </button>
                      <button 
                        onClick={() => updateBoard(board.id, { permission: 'Everyone' })}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${board.permission === 'Everyone' ? 'bg-white shadow-sm text-[#0057bd]' : 'text-[#515981] hover:text-[#242c51]'}`}
                      >
                        Everyone
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteBoard(board.id)}
                    className="h-12 w-12 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <span className="material-symbols-outlined">delete_outline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3: Add New Board */}
        <section>
          <button 
            onClick={addBoard}
            className="w-full group flex items-center justify-center gap-3 py-6 rounded-2xl bg-[#efefff] border-2 border-dashed border-[#a3abd7] hover:border-[#0057bd] hover:bg-[#dde1ff] transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-full bg-[#0057bd]/10 group-hover:bg-[#0057bd] group-hover:text-white flex items-center justify-center transition-colors">
              <span className="material-symbols-outlined">add</span>
            </div>
            <span className="text-lg font-bold text-[#0057bd]">Add New Board</span>
          </button>
        </section>
      </main>
    </motion.div>
  );
};

export default GroupBoardEditor;
