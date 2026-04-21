'use client';

import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  Bookmark,
  Image as ImageIcon,
  ChevronDown
} from 'lucide-react';

const REGIONS = ['전체', '서울', '경기/인천', '부산/경남', '대구/경북', '광주/전라', '대전/충청', '강원', '제주'];

const MOCK_POSTS = [
  {
    id: '1',
    user: {
      name: '스톤홍',
      handle: 'stonehong',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop',
      region: '서울'
    },
    content: '어제의 밀롱가는 정말 최고였습니다! 💃🕺\n음악도 선곡이 너무 좋았고, 분위기도 따뜻해서 시간 가는 줄 몰랐네요. 함께 춤춰주신 분들 모두 감사합니다.',
    images: [
      'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop'
    ],
    timestamp: '2시간 전',
    likes: 24,
    comments: 5,
    region: '서울'
  },
  {
    id: '2',
    user: {
      name: '제니',
      handle: 'jenn_tango',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop',
      region: '부산/경남'
    },
    content: '부산 해운대 근처에서 연습실 같이 쉐어하실 분 구합니다! 평일 저녁이나 주말 오전 위주로 생각하고 있어요. 관심 있으신 분 DM 주세요~',
    images: [],
    timestamp: '5시간 전',
    likes: 12,
    comments: 8,
    region: '부산/경남'
  }
];

export default function FeedPageClient() {
  const [selectedRegion, setSelectedRegion] = useState('전체');
  const [isRegionOpen, setIsRegionOpen] = useState(false);

  // Sync region with localStorage to match other pages
  useEffect(() => {
    const savedRegion = localStorage.getItem('woc_selected_region');
    if (savedRegion && REGIONS.includes(savedRegion)) {
      setSelectedRegion(savedRegion);
    }
  }, []);

  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    localStorage.setItem('woc_selected_region', region);
    setIsRegionOpen(false);
  };

  const filteredPosts = selectedRegion === '전체' 
    ? MOCK_POSTS 
    : MOCK_POSTS.filter(p => p.region === selectedRegion);

  return (
    <div className="min-h-screen bg-background">
      {/* Feed Header */}
      <div className="sticky top-14 bg-background/80 backdrop-blur-xl border-b border-glass-border z-20 px-4 py-3 flex justify-between items-center">
        <div className="relative">
          <button 
            onClick={() => setIsRegionOpen(!isRegionOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 rounded-full text-sm font-bold hover:bg-black/10 transition-colors"
          >
            {selectedRegion} <ChevronDown size={14} className={isRegionOpen ? "rotate-180 transition-transform" : "transition-transform"} />
          </button>
          
          {isRegionOpen && (
            <div className="absolute top-full left-0 mt-2 w-40 bg-background border border-glass-border rounded-2xl shadow-2xl py-2 z-30 animate-in fade-in zoom-in-95">
              {REGIONS.map(region => (
                <button
                  key={region}
                  onClick={() => handleRegionChange(region)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-black/5 transition-colors ${selectedRegion === region ? 'text-primary font-bold' : ''}`}
                >
                  {region}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Group Feed</div>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-black/[0.03]">
        {filteredPosts.map(post => (
          <div key={post.id} className="p-4 sm:p-6 space-y-4 hover:bg-black/[0.01] transition-colors">
            {/* User Info */}
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <img src={post.user.avatar} className="w-10 h-10 rounded-full object-cover border border-black/5" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm">{post.user.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-black/5 text-muted-foreground rounded-md uppercase tracking-wider font-bold">
                      {post.user.region}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">@{post.user.handle} • {post.timestamp}</div>
                </div>
              </div>
              <button className="text-muted-foreground p-1 hover:bg-black/5 rounded-full transition-colors">
                <MoreHorizontal size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="text-sm leading-relaxed whitespace-pre-wrap pl-1">
              {post.content}
            </div>

            {/* Images */}
            {post.images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-black/5">
                {post.images.map((img, idx) => (
                  <div key={idx} className={`relative aspect-video ${post.images.length === 1 ? 'sm:col-span-2' : ''}`}>
                    <img src={img} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-2 px-1">
              <div className="flex gap-4">
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors group">
                  <div className="p-2 group-hover:bg-red-50 rounded-full transition-colors">
                    <Heart size={20} />
                  </div>
                  <span className="text-xs font-medium">{post.likes}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group">
                  <div className="p-2 group-hover:bg-primary/10 rounded-full transition-colors">
                    <MessageCircle size={20} />
                  </div>
                  <span className="text-xs font-medium">{post.comments}</span>
                </button>
                <button className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500 transition-colors group">
                  <div className="p-2 group-hover:bg-green-50 rounded-full transition-colors">
                    <Share2 size={20} />
                  </div>
                </button>
              </div>
              <button className="text-muted-foreground p-2 hover:bg-black/5 rounded-full transition-colors">
                <Bookmark size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <div className="py-24 text-center space-y-4">
          <div className="w-16 h-16 bg-black/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
            <ImageIcon size={32} />
          </div>
          <div className="text-muted-foreground text-sm font-medium">이 지역에는 아직 게시글이 없습니다.</div>
        </div>
      )}
    </div>
  );
}
