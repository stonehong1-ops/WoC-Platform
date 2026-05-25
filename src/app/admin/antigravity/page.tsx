"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { storageService } from "@/lib/firebase/storageService";
import { db } from "@/lib/firebase/clientApp";
import { collection, addDoc, onSnapshot, query, orderBy, limit, serverTimestamp } from "firebase/firestore";

interface Message {
  id: string;
  sender: "stone" | "antigravity";
  message: string;
  imageUrl?: string | null;
  status: "pending" | "in_progress" | "completed";
  timestamp: string | Date;
}

export default function AntigravityTerminalPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Image Upload States
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to real-time messages from Firestore
  useEffect(() => {
    setIsLoading(true);
    const q = query(
      collection(db, "antigravity_terminal"),
      orderBy("timestamp", "asc"),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messagesData.push({
          id: doc.id,
          sender: (data.sender || "stone") as "stone" | "antigravity",
          message: data.message || "",
          imageUrl: data.imageUrl || null,
          status: (data.status || "pending") as "pending" | "in_progress" | "completed",
          timestamp: data.timestamp ? (data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp)) : new Date(),
        });
      });
      setMessages(messagesData);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle Image File Selection and Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const storagePath = `chat/${Date.now()}_${file.name}`;
      const downloadUrl = await storageService.uploadFile(file, storagePath, (progress) => {
        setUploadProgress(Math.round(progress));
      });
      setAttachedImageUrl(downloadUrl);
    } catch (err) {
      console.error("Image upload failed:", err);
      alert(language === "KR" ? "이미지 업로드에 실패했습니다." : "Image upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputText.trim() && !attachedImageUrl) || isSending) return;

    const messageToSend = inputText;
    const imageToSend = attachedImageUrl;

    setInputText("");
    setAttachedImageUrl(null);
    setIsSending(true);

    try {
      // 1. Direct write to Firestore with current Auth session
      await addDoc(collection(db, "antigravity_terminal"), {
        sender: "stone",
        message: messageToSend,
        imageUrl: imageToSend || null,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      // 2. Fire and forget to API route for local backup log (won't block UI if offline/serverless fails)
      fetch("/api/antigravity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend, imageUrl: imageToSend }),
      }).catch((err) => {
        console.warn("Local file backup skipped or failed:", err);
      });

    } catch (err) {
      console.error("Error sending message to Firestore:", err);
      alert(language === "KR" ? "메시지 전송에 실패했습니다." : "Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-blue-500/10">
      {/* Sleek Appbar */}
      <header className="px-4 py-3.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0 shadow-sm relative z-20">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-blue-500 text-[20px] fill-1 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          <span className="text-sm font-bold text-slate-800 tracking-wide">
            {language === "KR" ? "모바일 에이전트" : "Mobile Agent"}
          </span>
        </div>
        <button
          onClick={() => router.push("/profile")}
          className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 transition-colors flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined !text-[14px]">arrow_back</span>
          {language === "KR" ? "돌아가기" : "Back"}
        </button>
      </header>

      {/* Main Container: Expanded to full width without sidebars */}
      <div className="flex-grow flex flex-col overflow-hidden relative w-full max-w-3xl mx-auto">
        
        {/* Chat Logs Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-slate-400 font-mono">LOADING TERMINAL LOGS...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Introduction Card */}
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 text-blue-700 text-xs leading-relaxed shadow-sm">
                <strong>🤖 {language === "KR" ? "모바일 에이전트 소통 채널" : "Mobile Agent Hot-Line"}</strong><br />
                {language === "KR" ? 
                  "모바일 환경에서 사용자 테스트 중에 버그 제보나 기획 수정을 즉각 요청하실 수 있는 1:1 대화방입니다. 카메라 모양 버튼을 눌러 스크린샷 캡처 이미지도 함께 툭 던져주시면 바로 인지하고 수정에 착수합니다." : 
                  "Send bug reports or planning updates during user testing. Tap the camera button to upload screenshots and attach them directly to your commands."}
              </div>

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "stone" ? "ml-auto items-end" : "mr-auto items-start"
                  }`}
                >
                  {/* Speaker Name */}
                  <span className="text-[9px] font-mono font-bold tracking-widest text-slate-400 mb-1 uppercase">
                    {msg.sender === "stone" ? "STONE (LEADER)" : "MOBILE AGENT (AI)"}
                  </span>

                  {/* Message bubble */}
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed font-mono whitespace-pre-wrap flex flex-col gap-2 ${
                      msg.sender === "stone"
                        ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10"
                        : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm shadow-slate-100/50"
                    }`}
                  >
                    {/* Attached Image Thumbnail */}
                    {msg.imageUrl && (
                      <div 
                        onClick={() => setLightboxUrl(msg.imageUrl || null)}
                        className="rounded-lg overflow-hidden border border-black/5 cursor-zoom-in max-w-[240px] max-h-[320px] shadow-sm"
                      >
                        <img 
                          src={msg.imageUrl} 
                          alt="Attachment" 
                          className="w-full h-full object-cover max-w-full hover:opacity-95 transition-opacity"
                        />
                      </div>
                    )}
                    {/* Message text */}
                    {msg.message}
                  </div>

                  {/* Timestamp & Status Footer */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-mono text-slate-400">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {msg.sender === "stone" && (
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                          msg.status === "completed"
                            ? "bg-green-500/10 text-green-600 border border-green-200"
                            : msg.status === "in_progress"
                            ? "bg-amber-500/10 text-amber-600 border border-amber-200 animate-pulse"
                            : "bg-blue-500/10 text-blue-600 border border-blue-200"
                        }`}
                      >
                        {msg.status === "completed"
                          ? "배포 완료"
                          : msg.status === "in_progress"
                          ? "작업 중"
                          : "대기 중"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Bar Section with Photo Upload Button */}
        <div className="shrink-0 bg-white border-t border-slate-200/80 p-3 shadow-lg relative z-10 flex flex-col gap-2">
          {/* File Attachment Status Bar */}
          {isUploading && (
            <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg border border-slate-200 animate-pulse text-[11px] font-mono text-slate-500">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>{language === "KR" ? `이미지 업로드 중... (${uploadProgress || 0}%)` : `Uploading image... (${uploadProgress || 0}%)`}</span>
            </div>
          )}
          
          {attachedImageUrl && (
            <div className="relative self-start p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2">
              <div className="w-12 h-12 rounded overflow-hidden border border-slate-200">
                <img src={attachedImageUrl} alt="Attachment Preview" className="w-full h-full object-cover" />
              </div>
              <button 
                onClick={() => setAttachedImageUrl(null)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 shadow-lg cursor-pointer"
              >
                <span className="material-symbols-outlined !text-[12px]">close</span>
              </button>
            </div>
          )}

          {/* Form and buttons */}
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            {/* hidden file selector */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageUpload} 
              accept="image/*" 
              className="hidden" 
            />
            {/* Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isSending}
              className="h-12 w-12 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
            >
              <span className="material-symbols-outlined !text-[20px]">photo_camera</span>
            </button>

            {/* Input Message field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isSending || isUploading}
              placeholder={
                language === "KR" ? "에이전트에게 지시할 코멘트 입력..." : "Instruct your agent..."
              }
              className="flex-grow h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!inputText.trim() && !attachedImageUrl) || isSending || isUploading}
              className="h-12 w-12 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center shrink-0 transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-blue-600 shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="material-symbols-outlined !text-[20px]">send</span>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Premium Lightbox Modal for Images */}
      {lightboxUrl && (
        <div 
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-[99999] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-200"
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={lightboxUrl} 
              alt="Enlarged" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
            />
            <button 
              onClick={() => setLightboxUrl(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/55 text-white hover:bg-black/75 flex items-center justify-center transition-colors shadow-lg"
            >
              <span className="material-symbols-outlined !text-[22px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
