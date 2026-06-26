'use client';

import React, { useState, useEffect } from 'react';
import { Style, TimelineMessage, StyleStatus, STYLE_STATUS, Media } from './types';
import { mockStyles, mockMessages, mockMedia } from './mockData';
import { useSyncFitLanguage } from './SyncFitLanguageContext';
import StyleList from './components/StyleList';
import CollaborationFeed from './components/CollaborationFeed';
import StyleDetailPanel from './components/StyleDetailPanel';

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
  
  // 모바일 전용 네비게이션 및 오버레이 상태
  const [activeMobileTab, setActiveMobileTab] = useState<'user-select' | 'list' | 'feed'>('user-select');
  const [activeToolOverlay, setActiveToolOverlay] = useState<'none' | 'techpack' | 'filemanager' | 'showroom' | 'scm'>('none');
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false);

  const activeStyle = styles.find((s) => s.id === activeStyleId) || null;

  // activeStyleId에 매핑되는 대화 메시지 파생 상태
  const messages = React.useMemo(() => {
    return allMessages
      .filter((m) => m.styleId === activeStyleId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [allMessages, activeStyleId]);

  // 세션 자동 복원
  useEffect(() => {
    const saved = localStorage.getItem('syncfit_user');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        setCurrentUser(user);
        setActiveMobileTab('list');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // 1. 햄버거 드로어 디바이스 뒤로가기 가로채기
  useEffect(() => {
    if (isHamburgerOpen) {
      window.history.pushState({ popup: 'hamburger' }, '');
      
      const handlePopState = () => {
        setIsHamburgerOpen(false);
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isHamburgerOpen]);

  // 2. 도구 풀스크린 오버레이 디바이스 뒤로가기 가로채기
  useEffect(() => {
    if (activeToolOverlay !== 'none') {
      window.history.pushState({ popup: 'tool-overlay' }, '');
      
      const handlePopState = () => {
        setActiveToolOverlay('none');
      };
      
      window.addEventListener('popstate', handlePopState);
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [activeToolOverlay]);

  // 수동 닫기 핸들러 (브라우저 히스토리 스택 동기화)
  const closeHamburger = () => {
    setIsHamburgerOpen(false);
    if (window.history.state?.popup === 'hamburger') {
      window.history.back();
    }
  };

  const closeToolOverlay = () => {
    setActiveToolOverlay('none');
    if (window.history.state?.popup === 'tool-overlay') {
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

  // 1. 전체 메시지 실시간 구독
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

  // 2. 현재 로그인 사용자의 읽음 로그 실시간 구독
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

  // 3. activeStyleId 변경 및 현재 방에 새 메시지 수신 시 읽음 로그 업데이트
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

  // 4. 스타일별 미독 개수 계산
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
    localStorage.setItem('syncfit_user', JSON.stringify(user));
    setActiveMobileTab('list');
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('syncfit_user');
    setActiveMobileTab('user-select');
    setActiveStyleId('');
    setActiveToolOverlay('none');
    setIsHamburgerOpen(false);
  };

  // 5. 상품 등록 핸들러
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
        exchangeRate: 185,
        duty: 8,
        shipping: 2,
        margin: 30
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
      setActiveMobileTab('feed');
    } catch (err) {
      console.error('Failed to create new style in Firestore:', err);
    }
  };

  // 1. Send Message handler (Firestore 영구 보존)
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
      mediaId, // 첨부된 미디어 리소스 매핑
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

  // 2. 미디어 동적 업로드 (Storage 실 업로드 및 Firestore 메타 등록)
  const handleUploadMedia = (file: File, type: Media['type']): string => {
    if (!activeStyle) return '';
    
    const newMediaId = `MEDIA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 백그라운드 비동기 처리
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

    return newMediaId; // 피드 연동용으로 즉각 고유 ID 리턴
  };

  // 3. Status update handler (Firestore 반영)
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

  // 4. Update SCM prices (Firestore 반영)
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

  // 5. Production confirm
  const handleConfirmProduction = () => {
    if (!activeStyle) return;
    handleUpdateStatus(STYLE_STATUS.PROD_CONFIRM);
    handleSendMessage(
      `[생산 확정] 사장님/디자이너 권한으로 최종 대货 1차 생산을 승인했습니다.`,
      STYLE_STATUS.PROD_CONFIRM
    );
  };

  // 1. 로그인 스크린 렌더링 (전체 라이트모드로 개편)
  if (!currentUser) {
    return (
      <div className="w-full h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 bg-white border-b border-slate-100 text-center flex flex-col items-center gap-2.5">
            <span className="material-symbols-outlined text-[36px] text-blue-600">sync_saved_locally</span>
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">SyncFit 로그인</h1>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">접속할 역할을 선택해 주세요</p>
            </div>
          </div>

          {/* List Users with Accordion */}
          <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[420px] scrollbar-thin">
            
            {/* 1. 매니저 그룹 */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <button
                onClick={() => setExpandedGroup(expandedGroup === 'managers' ? '' : 'managers')}
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left"
              >
                <span className="text-[13px] font-black text-slate-700">👑 관리 매니저</span>
                <span className="material-symbols-outlined text-slate-400 text-[18px]">
                  {expandedGroup === 'managers' ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {expandedGroup === 'managers' && (
                <div className="p-3 bg-white grid grid-cols-2 gap-2 border-t border-slate-200 animate-fade-in">
                  {MANAGERS.map(user => (
                    <button
                      key={user.name}
                      onClick={() => handleLogin(user)}
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[12px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-blue-500"
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
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left"
              >
                <span className="text-[13px] font-black text-slate-700">🎨 디자이너 본사</span>
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
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[12px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-blue-500"
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
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left"
              >
                <span className="text-[13px] font-black text-slate-700">🏭 공장 생산 스태프</span>
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
                      className="px-3 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[12px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1.5 cursor-pointer shadow-xs hover:border-blue-500"
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
                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/60 transition-colors flex items-center justify-between text-left"
              >
                <span className="text-[13px] font-black text-slate-700">🏢 협력 바이어 / 업체</span>
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
                      className="px-2 py-2 bg-slate-50 hover:bg-blue-600 hover:text-white rounded-lg text-[11px] font-bold text-slate-700 border border-slate-200 transition-all text-left truncate flex items-center gap-1 cursor-pointer shadow-xs hover:border-blue-500"
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

  // 2. 메인 애플리케이션 렌더링 (전체 라이트모드로 개편)
  return (
    <div className="w-full h-screen flex flex-col overflow-hidden bg-slate-50 max-w-[600px] mx-auto shadow-2xl relative border-x border-slate-200">
      
      {/* GNB Header (라이트모드) */}
      <header className="h-14 bg-white text-slate-800 flex items-center justify-between px-4 z-20 shadow-sm border-b border-slate-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-blue-600">
            sync_saved_locally
          </span>
          <span className="text-[13px] font-black tracking-wider text-slate-850">
            SyncFit
          </span>
          <span className="text-[8px] font-black bg-blue-500 text-white px-1 py-0.5 rounded tracking-wider uppercase scale-90">
            실시스템
          </span>
        </div>

        {/* Top bar tools (Current User Info & Logout) */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
              {currentUser.name}
            </span>
            <button
              onClick={handleLogout}
              className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-red-500 transition-colors flex items-center justify-center cursor-pointer border border-slate-200 bg-white"
              title="로그아웃"
            >
              <span className="material-symbols-outlined text-[15px] font-black">logout</span>
            </button>
          </div>

          {/* Lang Toggle KO/CN */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setLanguage('KO')}
              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all ${
                language === 'KO' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLanguage('CN')}
              className={`px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all ${
                language === 'CN' ? 'bg-white text-slate-800 shadow-xs border border-slate-200' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              CN
            </button>
          </div>
        </div>
      </header>

      {/* Main Panel Content (Mobile-First Page Navigation) */}
      <main className="flex-1 flex overflow-hidden relative bg-white">
        
        {/* Step 1: 스타일 목록 뷰 */}
        <div className={`w-full h-full flex-shrink-0 transition-all duration-300 ${activeMobileTab === 'list' ? 'block' : 'hidden'}`}>
          <StyleList
            styles={styles}
            activeStyleId={activeStyleId}
            onSelectStyle={(id) => {
              setActiveStyleId(id);
              setActiveMobileTab('feed');
            }}
            unreadCounts={unreadCounts}
            onAddStyleClick={() => setIsAddModalOpen(true)}
          />
        </div>

        {/* Step 2: 채팅방 풀스크린 뷰 */}
        <div className={`w-full h-full flex-shrink-0 transition-all duration-300 ${activeMobileTab === 'feed' ? 'block' : 'hidden'}`}>
          <CollaborationFeed
            activeStyle={activeStyle}
            messages={messages}
            mediaList={mediaList}
            onSendMessage={handleSendMessage}
            onUploadMedia={handleUploadMedia}
            onUpdateStatus={handleUpdateStatus}
            onBackToList={() => setActiveMobileTab('list')}
            onHamburgerClick={() => setIsHamburgerOpen(true)}
          />
        </div>

      </main>

      {/* 3. 삼선 햄버거 메뉴 (풀스크린 모달 - 라이트모드) */}
      {isHamburgerOpen && activeStyle && (
        <div 
          className="absolute inset-0 z-40 bg-white text-slate-800 flex flex-col w-full h-full animate-fade-in"
        >
          {/* Header info with Back button */}
          <div className="h-14 bg-white border-b border-slate-200 px-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <button 
                onClick={closeHamburger}
                className="flex items-center justify-center p-1 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px] font-black">arrow_back</span>
              </button>
              <div className="flex flex-col min-w-0">
                <span className="text-[12px] font-black text-blue-600 leading-none">{activeStyle.id}</span>
                <span className="text-[13px] font-bold text-slate-800 truncate leading-none mt-1">{activeStyle.name}</span>
              </div>
            </div>
            <button 
              onClick={closeHamburger}
              className="text-slate-400 hover:text-slate-700 flex items-center justify-center p-1 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* List Menu Items */}
          <div className="flex-1 p-5 flex flex-col gap-4 bg-slate-50/50">
            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-200 flex-shrink-0">도구 및 정보</h4>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setActiveToolOverlay('techpack');
                  closeHamburger();
                }}
                className="w-full h-14 px-4 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[14px] font-black transition-all flex items-center gap-3.5 text-left border border-slate-200 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600">folder_open</span>
                작업지시서
              </button>

              <button
                onClick={() => {
                  setActiveToolOverlay('filemanager');
                  closeHamburger();
                }}
                className="w-full h-14 px-4 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[14px] font-black transition-all flex items-center gap-3.5 text-left border border-slate-200 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600">inventory_2</span>
                파일관리
              </button>

              <button
                onClick={() => {
                  setActiveToolOverlay('showroom');
                  closeHamburger();
                }}
                className="w-full h-14 px-4 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[14px] font-black transition-all flex items-center gap-3.5 text-left border border-slate-200 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600">palette</span>
                가상쇼룸
              </button>

              <button
                onClick={() => {
                  setActiveToolOverlay('scm');
                  closeHamburger();
                }}
                className="w-full h-14 px-4 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-xl text-[14px] font-black transition-all flex items-center gap-3.5 text-left border border-slate-200 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[20px] text-blue-600">calculate</span>
                SCM 계산기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 4대 기능 풀스크린 오버레이 모달 */}
      {activeToolOverlay !== 'none' && activeStyle && currentUser && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col max-w-[600px] mx-auto border-x border-slate-200">
          <StyleDetailPanel
            style={activeStyle}
            userRole={currentUser.role}
            mediaList={mediaList}
            onConfirmProduction={handleConfirmProduction}
            onUploadMedia={handleUploadMedia}
            onSendMessage={handleSendMessage}
            onUpdateSCM={handleUpdateSCM}
            forcedTab={activeToolOverlay}
            onClose={closeToolOverlay}
          />
        </div>
      )}

      {/* 상품 등록 모달 */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-[400px] max-w-[90%] overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="text-[14px] font-black tracking-tight flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-blue-400">add_circle</span>
                신규 상품 등록
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">상품명</label>
                <input
                  type="text"
                  placeholder="예: 2026 FW 오버핏 티셔츠"
                  value={newStyleName}
                  onChange={(e) => setNewStyleName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-[13px] bg-slate-50/50 focus:outline-none focus:border-blue-500 transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddStyle();
                    }
                  }}
                />
              </div>
            </div>
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 h-9 rounded-lg text-slate-500 hover:bg-slate-100 text-[12px] font-bold transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddStyle}
                disabled={!newStyleName.trim()}
                className="px-4 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-[12px] font-black tracking-tight transition-all shadow-md"
              >
                등록하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
