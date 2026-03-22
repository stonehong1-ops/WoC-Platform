'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  User, 
  Music, 
  Share2, 
  Heart, 
  Users,
  ExternalLink,
  MessageCircle,
  CheckCircle2
} from 'lucide-react';

export default function SocialDetailClient() {
  const params = useParams();
  const router = useRouter();
  const id = params.id;

  // Mock Data (matches the data in SocialPageClient)
  const event = {
    id: id,
    title: "밀롱가 엘 불린 (El Bulin)",
    place: "합정 턴 (Turn)",
    date: "2026-03-23",
    time: "20:00 - 23:30",
    djs: ["DJ 스톤홍", "DJ 켈리"],
    organizer: "El Bulin Team",
    region: "서울",
    category: "Milonga",
    price: "15,000원",
    description: "합정의 힙한 밀롱가 엘 불린에 여러분을 초대합니다. 아늑한 분위기와 최고의 음악으로 가득한 밤을 함께 즐겨요.\n\n- 예약 필수 아님\n- 주차 가능\n- 외부 주류 반입 금지",
    image: "https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=2070&auto=format&fit=crop",
    attendees: 42
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <img 
          src={event.image} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button 
            onClick={() => router.back()}
            className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex gap-2">
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg">
              <Share2 size={20} />
            </button>
            <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-lg">
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-12 relative z-10 space-y-8">
        {/* Title & Badge */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-full">
              {event.category}
            </span>
            <span className="px-3 py-1 bg-black/5 text-muted-foreground text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
              <Users size={10} /> {event.attendees}명 참여중
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight">{event.title}</h1>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-glass p-4 rounded-2xl border border-glass-border space-y-1">
            <div className="text-muted-foreground">
              <Calendar size={16} />
            </div>
            <div className="text-sm font-bold">{event.date}</div>
            <div className="text-xs text-muted-foreground">{event.time}</div>
          </div>
          <div className="bg-glass p-4 rounded-2xl border border-glass-border space-y-1">
            <div className="text-muted-foreground">
              <MapPin size={16} />
            </div>
            <div className="text-sm font-bold">{event.place}</div>
            <div className="text-xs text-muted-foreground">{event.region}</div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-black/5">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <Music size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">주요 DJ</div>
              <div className="text-sm font-bold">{event.djs.join(", ")}</div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-black/5">
            <div className="p-3 bg-white rounded-xl shadow-sm">
              <User size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">오거나이저</div>
              <div className="text-sm font-bold">{event.organizer}</div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-3">
          <h3 className="font-bold text-lg">상세 설명</h3>
          <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {event.description}
          </p>
        </div>

        {/* Location Placeholder */}
        <div className="space-y-3 pb-8">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">장소 위치</h3>
            <button className="text-primary text-xs font-bold flex items-center gap-1">
              지도 앱에서 보기 <ExternalLink size={12} />
            </button>
          </div>
          <div className="h-48 w-full bg-black/5 rounded-3xl border border-dashed border-black/10 flex items-center justify-center overflow-hidden">
            <div className="text-center space-y-2">
              <MapPin size={32} className="mx-auto text-muted-foreground/30" />
              <div className="text-xs text-muted-foreground font-medium">지도가 곧 준비됩니다.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-glass-border z-20">
        <div className="max-w-2xl mx-auto flex gap-3">
          <button className="p-4 bg-glass border border-glass-border rounded-2xl text-foreground active:scale-95 transition-all">
            <MessageCircle size={24} />
          </button>
          <button 
            className="flex-1 bg-primary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-95 transition-all"
            onClick={() => alert('참여 신청이 완료되었습니다!')}
          >
            참여하기 <CheckCircle2 size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
