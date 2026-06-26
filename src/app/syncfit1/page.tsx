'use client';

import React, { useState, useEffect } from 'react';
import { Style, TimelineMessage, StyleStatus, STYLE_STATUS, Media } from './types';
import { mockStyles, mockMessages, mockMedia } from './mockData';
import { useSyncFitLanguage } from './SyncFitLanguageContext';
import StyleList from './components/StyleList';
import CollaborationFeed from './components/CollaborationFeed';
import StyleDetailPanel, { TabType } from './components/StyleDetailPanel';

// Firebase db & storage 수입
import { db, storage } from '@/lib/firebase/clientApp';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface SyncFitUser {
  name: string;
  role: 'admin' | 'designer' | 'factory_staff' | 'vendor_staff';
  lang: 'KR' | 'CN';
}

const MANAGERS: SyncFitUser[] = [
  { name: '한국매니저', role: 'admin', lang: 'KR' },
  { name: '중국매니저', role: 'factory_staff', lang: 'CN' }
];

const DESIGNERS: SyncFitUser[] = Array.from({ length: 3 }, (_, i) => ({
  name: `디자이너 ${i + 1}`,
  role: 'designer',
  lang: 'KR'
}));

const FACTORY_STAFF: SyncFitUser[] = Array.from({ length: 10 }, (_, i) => ({
  name: `공장직원 ${i + 1}`,
  role: 'factory_staff',
  lang: 'CN'
}));

const VENDORS: SyncFitUser[] = Array.from({ length: 30 }, (_, i) => ({
  name: `업체 ${i + 1}`,
  role: 'vendor_staff',
  lang: 'KR'
}));

export default function SyncFitPage() {
  const { tx, language, setLanguage } = useSyncFitLanguage();
  const [styles, setStyles] = useState<Style[]>([]);
  const [allMessages, setAllMessages] = useState<TimelineMessage[]>([]);
  const [readLogs, setReadLogs] = useState<Record<string, string>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [activeStyleId, setActiveStyleId] = useState<string>('');
  
  // 로그인 사용자 세션 상태
  const [currentUser, setCurrentUser] = useState<SyncFitUser | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string>('managers');
  
  // 모바일 전용 네비게이션 탭 상태 (Stitch 탭에 맞게 구성)
  const [activeMobileTab, setActiveMobileTab] = useState<'styles' | 'updates' | 'tools' | 'specs'>('styles');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const activeStyle = styles.find((s) => s.id === activeStyleId) || null;

  // activeStyleId에 매핑되는 대화 메시지 파생 상태
  const messages = React.useMemo(() => {
    return allMessages
      .filter((m) => m.styleId === activeStyleId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allMessages, activeStyleId]);

  // 세션 자동 복원
  useEffect(() => {
    const saved = localStorage.getItem('syncfit1_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        setActiveMobileTab('styles');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 모바일 메뉴 뒤로가기 가로채기
  useEffect(() => {
    if (isMobileMenuOpen) {
      window.history.pushState({ popup: 'mobile-menu' }, '');
      
      const handlePopState = () => {
        setIsMobileMenuOpen(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    if (window.history.state?.popup === 'mobile-menu') {
      window.history.back();
    }
  };

  // Firestore & Storage 실시간 동기화 및 최초 1회 Seeding 처리
  useEffect(() => {
    const stylesCol = collection(db, 'syncfit_styles');
    
    const unsubscribeStyles = onSnapshot(stylesCol, async (snapshot) => {
      if (snapshot.empty) {
        // 1회성 데이터 Seeding 시작
        const batch = writeBatch(db);
        mockStyles.forEach((style) => {
          const docRef = doc(db, 'syncfit_styles', style.id);
          batch.set(docRef, {
            ...style,
            updatedAt: new Date().toISOString()
          });
        });
        
        mockMedia.forEach((media) => {
          const mediaRef = doc(db, 'syncfit_media', media.id);
          batch.set(mediaRef, media);
        });

        mockMessages.forEach((msg) => {
          const msgRef = doc(db, 'syncfit_messages', msg.id);
          batch.set(msgRef, msg);
        });

        try {
          await batch.commit();
        } catch (err) {
          console.error('Failed to commit seeding batch:', err);
        }
        return;
      }
      
      const loadedStyles: Style[] = [];
      snapshot.forEach((docSnapshot) => {
        loadedStyles.push(docSnapshot.data() as Style);
      });
      loadedStyles.sort((a, b) => a.id.localeCompare(b.id));
      setStyles(loadedStyles);
      if (loadedStyles.length > 0 && !activeStyleId) {
        setActiveStyleId(loadedStyles[0].id);
      }
    });

    const mediaCol = collection(db, 'syncfit_media');
    const unsubscribeMedia = onSnapshot(mediaCol, (snapshot) => {
      const loadedMedia: Media[] = [];
      snapshot.forEach((docSnapshot) => {
        loadedMedia.push(docSnapshot.data() as Media);
      });
      setMediaList(loadedMedia);
    });

    return () => {
      unsubscribeStyles();
      unsubscribeMedia();
    };
  }, [activeStyleId]);

  // 전체 메시지 실시간 구독
  useEffect(() => {
    const messagesCol = collection(db, 'syncfit_messages');
    const unsubscribeMessages = onSnapshot(messagesCol, (snapshot) => {
      const loadedMessages: TimelineMessage[] = [];
      snapshot.forEach((docSnapshot) => {
        loadedMessages.push(docSnapshot.data() as TimelineMessage);
      });
      setAllMessages(loadedMessages);
    });

    return () => {
      unsubscribeMessages();
    };
  }, []);

  // 현재 로그인 사용자의 읽음 로그 실시간 구독
  useEffect(() => {
    if (!currentUser) return;
    const readLogsCol = collection(db, 'syncfit_read_logs');
    const q = query(readLogsCol, where('userName', '==', currentUser.name));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: Record<string, string> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.styleId && data.lastReadAt) {
          logs[data.styleId] = data.lastReadAt;
        }
      });
      setReadLogs(logs);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 읽음 로그 업데이트
  const updateLastRead = async (styleId: string) => {
    if (!styleId || !currentUser) return;
    const docId = `${currentUser.name}_${styleId}`;
    try {
      await setDoc(doc(db, 'syncfit_read_logs', docId), {
        id: docId,
        userRole: currentUser.role,
        userName: currentUser.name,
        styleId,
        lastReadAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.error('Failed to update read log:', err);
    }
  };

  useEffect(() => {
    if (activeStyleId) {
      updateLastRead(activeStyleId);
    }
  }, [activeStyleId, currentUser]);

  const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].createdAt : '';
  useEffect(() => {
    if (activeStyleId && lastMessageTime) {
      updateLastRead(activeStyleId);
    }
  }, [activeStyleId, lastMessageTime]);

  // 스타일별 미독 개수 계산
  const unreadCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    styles.forEach((style) => {
      const lastRead = readLogs[style.id] ? new Date(readLogs[style.id]).getTime() : 0;
      const styleMessages = allMessages.filter((m) => m.styleId === style.id);
      const unread = styleMessages.filter((m) => new Date(m.createdAt).getTime() > lastRead).length;
      counts[style.id] = unread;
    });
    return counts;
  }, [styles, allMessages, readLogs]);

  // 로그인 핸들러
  const handleLogin = (user: SyncFitUser) => {
    setCurrentUser(user);
    localStorage.setItem('syncfit1_user', JSON.stringify(user));
    setActiveMobileTab('styles');
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('syncfit1_user');
    setActiveStyleId('');
    setIsMobileMenuOpen(false);
  };

  // 신규 상품 등록 핸들러
  const handleAddStyle = async () => {
    if (!newStyleName.trim()) return;

    const nextNum = styles.length > 0
      ? Math.max(...styles.map(s => {
          const match = s.id.match(/ST-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })) + 1
      : 1;
    const nextId = `ST-${String(nextNum).padStart(5, '0')}`;

    const newStyle: Style = {
      id: nextId,
      name: newStyleName.trim(),
      status: STYLE_STATUS.DESIGN,
      vendorId: 'vendor-01',
      factoryId: 'factory-01',
      techPackUrl: '',
      techPackVersion: 'V1',
      colorBook: {
        fabricName: '기본 면 원단',
        colors: [
          { name: 'Black', hex: '#000000' },
          { name: 'White', hex: '#FFFFFF' }
        ]
      },
      scmPrice: {
        factoryCostRmb: 0,
        exchangeRate: 195,
        duty: 1000,
        shipping: 500,
        margin: 3000
      },
      qrLogs: []
    };

    try {
      await setDoc(doc(db, 'syncfit_styles', nextId), {
        ...newStyle,
        updatedAt: new Date().toISOString()
      });
      setActiveStyleId(nextId);
      setIsAddModalOpen(false);
      setNewStyleName('');
      setActiveMobileTab('updates');
    } catch (err) {
      console.error('Failed to create new style in Firestore:', err);
    }
  };

  // 메시지 전송 핸들러
  const handleSendMessage = async (content: string, statusUpdate?: StyleStatus, mediaId?: string) => {
    if (!activeStyle || !currentUser) return;

    const newMsgId = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const newMsg: TimelineMessage = {
      id: newMsgId,
      styleId: activeStyle.id,
      sender: {
        name: currentUser.name,
        role: currentUser.role,
        lang: currentUser.lang
      },
      content,
      translations: {
        KR: currentUser.lang === 'KR' ? content : `[자동 번역] ${content}`,
        CN: currentUser.lang === 'CN' ? content : `[自动翻译] ${content}`
      },
      createdAt: new Date().toISOString(),
      mediaId,
      logUpdate: statusUpdate ? {
        prevStatus: activeStyle.status,
        nextStatus: statusUpdate
      } : undefined
    };

    try {
      await setDoc(doc(db, 'syncfit_messages', newMsgId), newMsg);
    } catch (err) {
      console.error('Failed to send message to Firestore:', err);
    }
  };

  // 미디어 업로드 핸들러
  const handleUploadMedia = (file: File, type: Media['type']): string => {
    if (!activeStyle) return '';
    
    const newMediaId = `MEDIA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    (async () => {
      try {
        const fileRef = ref(storage, `syncfit/${activeStyle.id}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(fileRef, file);
        const downloadUrl = await getDownloadURL(uploadResult.ref);
        
        const newMedia: Media = {
          id: newMediaId,
          styleId: activeStyle.id,
          type,
          url: downloadUrl,
          fileName: file.name,
          uploadedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'syncfit_media', newMediaId), newMedia);
      } catch (err) {
        console.error('Failed to upload file to Storage/Firestore:', err);
      }
    })();

    return newMediaId;
  };

  // 상태 업데이트 핸들러
  const handleUpdateStatus = async (newStatus: StyleStatus) => {
    if (!activeStyle) return;

    const updatedQrLogs = [...activeStyle.qrLogs];
    
    if (newStatus === STYLE_STATUS.SAMPLE_REVIEW && !updatedQrLogs.some(l => l.stage === 'Review')) {
      updatedQrLogs.push({
        stage: 'Review',
        timestamp: new Date().toISOString(),
        location: '서울 본사 3층 디자인실'
      });
    } else if (newStatus === STYLE_STATUS.PROD_CONFIRM && !updatedQrLogs.some(l => l.stage === 'Confirmed')) {
      updatedQrLogs.push({
        stage: 'Confirmed',
        timestamp: new Date().toISOString(),
        location: '최종 대货 생산 승인 완료'
      });
    }

    try {
      const styleRef = doc(db, 'syncfit_styles', activeStyle.id);
      await updateDoc(styleRef, {
        status: newStatus,
        qrLogs: updatedQrLogs,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update status in Firestore:', err);
    }
  };

  // SCM 가격 변경 핸들러
  const handleUpdateSCM = async (updatedScm: Style['scmPrice']) => {
    if (!activeStyle) return;

    try {
      const styleRef = doc(db, 'syncfit_styles', activeStyle.id);
      await updateDoc(styleRef, {
        scmPrice: updatedScm,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to update SCM in Firestore:', err);
    }
  };

  // 대货 생산 승인
  const handleConfirmProduction = () => {
    if (!activeStyle) return;
    handleUpdateStatus(STYLE_STATUS.PROD_CONFIRM);
    handleSendMessage(
      `[생산 확정] 사장님/디자이너 권한으로 최종 대货 1차 생산을 승인했습니다.`,
      STYLE_STATUS.PROD_CONFIRM
    );
  };

  // 로그인 스크린 (사용자 선택 화면)
  if (!currentUser) {
    return (
      <div className="w-full h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 bg-white border-b border-slate-100 text-center flex flex-col items-center gap-2.5">
            <span className="material-symbols-outlined text-[36px] text-blue-600">sync_saved_locally</span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">SyncFit 로그인</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">접속할 역할을 선택해 주세요</p>
            </div>
          </div>

          {/* List Users with Accordion */}
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[420px] scrollbar-thin">
            {/* 1. 매니저 그룹 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setExpandedGroup(expandedGroup === 'managers' ? '' : 'managers')}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-[13px] font-bold text-slate-700">👑 관리 매니저</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  {expandedGroup === 'managers' ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expandedGroup === 'managers' && (
                <div className="p-3 bg-white grid grid-cols-2 gap-2 border-t border-slate-200">
                  {MANAGERS.map(user => (
                    <button
                      key={user.name}
                      onClick={() => handleLogin(user)}
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[12px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1.5 cursor-pointer shadow-xs focus:outline-none"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. 디자이너 그룹 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setExpandedGroup(expandedGroup === 'designers' ? '' : 'designers')}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-[13px] font-bold text-slate-700">🎨 디자이너 본사</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  {expandedGroup === 'designers' ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expandedGroup === 'designers' && (
                <div className="p-3 bg-white grid grid-cols-2 gap-2 border-t border-slate-200">
                  {DESIGNERS.map(user => (
                    <button
                      key={user.name}
                      onClick={() => handleLogin(user)}
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[12px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1.5 cursor-pointer shadow-xs focus:outline-none"
                    >
                      <span className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" />
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 3. 공장직원 그룹 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setExpandedGroup(expandedGroup === 'factory' ? '' : 'factory')}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-[13px] font-bold text-slate-700">🏭 공장 생산 스태프</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  {expandedGroup === 'factory' ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expandedGroup === 'factory' && (
                <div className="p-3 bg-white grid grid-cols-2 gap-2 border-t border-slate-200">
                  {FACTORY_STAFF.map(user => (
                    <button
                      key={user.name}
                      onClick={() => handleLogin(user)}
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[12px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1.5 cursor-pointer shadow-xs focus:outline-none"
                    >
                      <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full flex-shrink-0" />
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 4. 협력업체 그룹 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setExpandedGroup(expandedGroup === 'vendors' ? '' : 'vendors')}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left focus:outline-none"
              >
                <span className="text-[13px] font-bold text-slate-700">🏢 협력 바이어 / 업체</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  {expandedGroup === 'vendors' ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expandedGroup === 'vendors' && (
                <div className="p-3 bg-white grid grid-cols-3 gap-2 border-t border-slate-200">
                  {VENDORS.map(user => (
                    <button
                      key={user.name}
                      onClick={() => handleLogin(user)}
                      className="px-2 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1 cursor-pointer shadow-xs focus:outline-none"
                    >
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0" />
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 메인 애플리케이션 (Stitch 원본 데스크톱/모바일 반응형 100% 포팅)
  return (
    <div className="w-full h-screen bg-background text-on-surface font-body-md overflow-hidden flex flex-col relative">
      
      {/* Stitch 원본 GNB TopAppBar (135라인) */}
      <header className="bg-surface dark:bg-on-background border-b border-outline-variant dark:border-outline docked full-width top-0 z-50 flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-16 shrink-0">
        <div className="flex items-center gap-md">
          {/* 모바일 햄버거 가로채기 버튼 */}
          <span 
            onClick={() => setIsMobileMenuOpen(true)}
            className="material-symbols-outlined text-primary cursor-pointer active:scale-95 duration-150 md:hidden"
          >
            menu
          </span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed select-none">SyncFit</h1>
        </div>

        <div className="flex items-center gap-md">
          <div className="hidden md:flex gap-sm">
            <button className="font-label-md text-label-md px-4 py-2 text-primary dark:text-primary-fixed font-semibold hover:bg-surface-container-low transition-colors duration-150 rounded-lg">Dashboard</button>
            <button className="font-label-md text-label-md px-4 py-2 text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low transition-colors duration-150 rounded-lg">Assets</button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="font-label-md text-label-md text-on-surface font-bold">{currentUser.name}</p>
              <p className="text-[11px] text-on-surface-variant uppercase">{currentUser.role}</p>
            </div>
            <img 
              onClick={handleLogout}
              alt="User profile avatar (Click to Logout)" 
              className="w-10 h-10 rounded-full border border-outline-variant cursor-pointer hover:opacity-80 transition-opacity" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_OaloiSBhv7poWUrzSgJ9gLH8js6PhnLfvQs9dvxYKOAxG2UzP73V7_bwhaBvkHNi_YNqGId6mJvD7CjJYjJqGLN6q-FWuVIE7an4hQueGHB5oPvQSI8vVL_89Fmt_IoayZ62lps34LEQbS24Wxa2RPgVEF91vWQSrVz06T4TNSembpdN1E3ePhMpeMzCZrZT4hsHU-GH1UTKEf2mFUK3EoSrqNw9FIBkide7UArRbfu7xeUwE4uYounz1b77ROUaxtkiW-71-a2k" 
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* ==================== [1] 모바일 레이아웃 (md 미만: 하단 네비게이션 제어) ==================== */}
        <div className="flex-1 flex flex-col md:hidden w-full h-full bg-white relative overflow-hidden">
          <main className="flex-1 flex overflow-hidden relative">
            {activeMobileTab === 'styles' && (
              <StyleList
                styles={styles}
                activeStyleId={activeStyleId}
                onSelectStyle={(id) => {
                  setActiveStyleId(id);
                  setActiveMobileTab('updates');
                }}
                unreadCounts={unreadCounts}
                onAddStyleClick={() => setIsAddModalOpen(true)}
              />
            )}

            {activeMobileTab === 'updates' && (
              <CollaborationFeed
                activeStyle={activeStyle}
                messages={messages}
                mediaList={mediaList}
                onSendMessage={handleSendMessage}
                onUploadMedia={handleUploadMedia}
                onUpdateStatus={handleUpdateStatus}
                currentUser={currentUser}
              />
            )}

            {activeMobileTab === 'tools' && activeStyle && (
              <StyleDetailPanel
                style={activeStyle}
                userRole={currentUser.role}
                mediaList={mediaList}
                onConfirmProduction={handleConfirmProduction}
                onUploadMedia={handleUploadMedia}
                onSendMessage={handleSendMessage}
                onUpdateSCM={handleUpdateSCM}
                forcedTab="tools"
              />
            )}

            {activeMobileTab === 'specs' && activeStyle && (
              <StyleDetailPanel
                style={activeStyle}
                userRole={currentUser.role}
                mediaList={mediaList}
                onConfirmProduction={handleConfirmProduction}
                onUploadMedia={handleUploadMedia}
                onSendMessage={handleSendMessage}
                onUpdateSCM={handleUpdateSCM}
                forcedTab="specs"
              />
            )}
          </main>

          {/* 모바일 햄버거 메뉴 오버레이 */}
          {isMobileMenuOpen && activeStyle && (
            <div className="absolute inset-0 z-[60] bg-white text-slate-800 flex flex-col w-full h-full animate-fade-in">
              <div className="h-16 bg-white border-b border-slate-200 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button onClick={closeMobileMenu} className="flex items-center justify-center p-1.5 rounded-lg text-slate-500 hover:bg-slate-100">
                    <span className="material-symbols-outlined text-[20px] font-bold">arrow_back</span>
                  </button>
                  <span className="text-sm font-bold text-slate-800">{activeStyle.id} • {activeStyle.name}</span>
                </div>
                <button onClick={closeMobileMenu} className="text-slate-400 hover:text-slate-700">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <div className="flex-1 p-5 flex flex-col gap-4 bg-slate-50">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200">WORKSPACE TOOLS</h4>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => { setActiveMobileTab('styles'); closeMobileMenu(); }}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-left text-sm font-bold flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-primary">style</span> Styles List
                  </button>
                  <button 
                    onClick={() => { setActiveMobileTab('updates'); closeMobileMenu(); }}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-left text-sm font-bold flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-primary">notifications</span> Collaboration Feed
                  </button>
                  <button 
                    onClick={() => { setActiveMobileTab('tools'); closeMobileMenu(); }}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-left text-sm font-bold flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-primary">construction</span> SCM & Showroom
                  </button>
                  <button 
                    onClick={() => { setActiveMobileTab('specs'); closeMobileMenu(); }}
                    className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-left text-sm font-bold flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-primary">description</span> Specs & Tech Pack
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 모바일 하단 네비게이션 탭바 (317라인 0px 편차 마크업) */}
          <nav className="bg-surface dark:bg-on-background border-t border-outline-variant dark:border-outline shadow-md flex justify-around items-center h-16 pb-safe shrink-0 z-40">
            <div 
              onClick={() => setActiveMobileTab('styles')}
              className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 p-2 ${
                activeMobileTab === 'styles' ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeMobileTab === 'styles' ? "'FILL' 1" : "'FILL' 0" }}>style</span>
              <span className="font-label-sm-mobile text-label-sm-mobile">Styles</span>
            </div>
            <div 
              onClick={() => setActiveMobileTab('updates')}
              className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 p-2 ${
                activeMobileTab === 'updates' ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeMobileTab === 'updates' ? "'FILL' 1" : "'FILL' 0" }}>notifications</span>
              <span className="font-label-sm-mobile text-label-sm-mobile">Updates</span>
            </div>
            <div 
              onClick={() => setActiveMobileTab('tools')}
              className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 p-2 ${
                activeMobileTab === 'tools' ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeMobileTab === 'tools' ? "'FILL' 1" : "'FILL' 0" }}>construction</span>
              <span className="font-label-sm-mobile text-label-sm-mobile">Tools</span>
            </div>
            <div 
              onClick={() => setActiveMobileTab('specs')}
              className={`flex flex-col items-center justify-center cursor-pointer transition-all duration-200 p-2 ${
                activeMobileTab === 'specs' ? 'bg-primary-container text-on-primary-container rounded-full px-4 py-1' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: activeMobileTab === 'specs' ? "'FILL' 1" : "'FILL' 0" }}>description</span>
              <span className="font-label-sm-mobile text-label-sm-mobile">Specs</span>
            </div>
          </nav>
        </div>

        {/* ==================== [2] 데스크톱 레이아웃 (md 이상: 3단 상시 고정 배치) ==================== */}
        <div className="hidden md:flex flex-row w-full h-full pl-[80px] relative overflow-hidden bg-slate-50">
          
          {/* 데스크톱 전용 좌측 사이드바 (336라인 0px 편차 마크업) */}
          <nav className="flex flex-col gap-sm p-md h-full w-20 absolute left-0 top-0 border-r border-outline-variant bg-surface-container-low z-40">
            <div className="flex flex-col items-center gap-lg pt-md">
              <div className="p-3 bg-secondary-container text-on-secondary-container rounded-lg cursor-pointer duration-200 ease-in-out transition-all">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>grid_view</span>
              </div>
              <div className="p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg cursor-pointer transition-all">
                <span className="material-symbols-outlined">account_tree</span>
              </div>
              <div className="p-3 text-on-surface-variant hover:bg-surface-variant rounded-lg cursor-pointer transition-all">
                <span className="material-symbols-outlined">build</span>
              </div>
            </div>
            <div className="mt-auto flex flex-col items-center gap-md pb-md">
              <div className="p-3 text-on-surface-variant hover:bg-surface-container-high rounded-lg cursor-pointer">
                <span className="material-symbols-outlined">settings</span>
              </div>
            </div>
          </nav>

          {/* 1단: 스타일 탐색기 */}
          <StyleList
            styles={styles}
            activeStyleId={activeStyleId}
            onSelectStyle={(id) => setActiveStyleId(id)}
            unreadCounts={unreadCounts}
            onAddStyleClick={() => setIsAddModalOpen(true)}
          />

          {/* 2단: 채팅 피드 */}
          <CollaborationFeed
            activeStyle={activeStyle}
            messages={messages}
            mediaList={mediaList}
            onSendMessage={handleSendMessage}
            onUploadMedia={handleUploadMedia}
            onUpdateStatus={handleUpdateStatus}
            currentUser={currentUser}
          />

          {/* 3단: 도구 탭 패널 (상시 우측 노출, 260라인 0px 편차 마크업) */}
          {activeStyle ? (
            <div className="w-[320px] xl:w-[400px] h-full shrink-0">
              <StyleDetailPanel
                style={activeStyle}
                userRole={currentUser.role}
                mediaList={mediaList}
                onConfirmProduction={handleConfirmProduction}
                onUploadMedia={handleUploadMedia}
                onSendMessage={handleSendMessage}
                onUpdateSCM={handleUpdateSCM}
              />
            </div>
          ) : (
            <div className="w-[320px] xl:w-[400px] h-full shrink-0 flex items-center justify-center text-slate-400 border-l border-outline-variant bg-white text-xs">
              스타일을 선택하여 도구를 여세요.
            </div>
          )}
        </div>

      </div>

      {/* 모바일/PC 통합 플로팅 액션 버튼 (355라인) */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 bg-primary text-white w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform z-50 focus:outline-none"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>

      {/* 신규 상품 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] max-w-[90%] overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-[13px] font-bold tracking-tight flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-400">add_circle</span>
                신규 스타일 등록
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">스타일(상품)명</label>
                <input
                  type="text"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[13px] focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  placeholder="예: 에어로 퍼포먼스 플리스자켓"
                />
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-[12px] font-bold text-slate-605 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleAddStyle}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-bold shadow-sm transition-colors cursor-pointer"
                >
                  등록 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
