'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, Timestamp, updateDoc, serverTimestamp, deleteField } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/clientApp';
import { toast } from 'sonner';
import { fcmService } from '@/lib/firebase/fcmService';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface UserProfile {
  uid: string;
  email: string | null;
  nickname: string;
  nativeNickname?: string;
  bio?: string;
  countryCode: string;
  photoURL: string | null;
  phoneNumber?: string;
  authMethod?: string;
  gender?: string;
  isRegistered: boolean;
  // Roles
  isInstructor?: boolean;
  isOrganizer?: boolean;
  isDj?: boolean;
  isServiceProvider?: boolean;
  role?: 'leader' | 'follower';
  isAdmin?: boolean;
  systemRole?: string;
  joinedGroups?: string[];
  lastVisitedAt?: any;
  pinnedPostIds?: string[];
  interactedUserIds?: string[];
  pinnedUserIds?: string[];
  career?: string;
  partnerStatus?: string;
  allowPhoneCalls?: boolean;
  customSchedules?: any[];
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  showLogin: boolean;
  setShowLogin: (show: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  showLogin: false,
  setShowLogin: () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [activeNotification, setActiveNotification] = useState<{title: string; body: string; url?: string} | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // 이전 프로필 구독 해제
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      setUser(firebaseUser);
      
      if (firebaseUser) {
        // [Link Logic] 사전 등록된 데이터가 있는지 확인 (전화번호 기준)
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        let userSnap: any = null;
        try {
          userSnap = await getDoc(userDocRef);
          
          if (!userSnap.exists()) {
            // 처음 로그인하는 사용자라면 전화번호 기반 데이터 검색
            const phone = firebaseUser.phoneNumber;
            if (phone) {
              const phoneDocRef = doc(db, 'users', phone);
              const phoneSnap = await getDoc(phoneDocRef);
              
              if (phoneSnap.exists()) {
                const migratedData = phoneSnap.data();
                
                // 새로운 UID 문서로 데이터 복사
                await setDoc(userDocRef, {
                  ...migratedData,
                  uid: firebaseUser.uid,
                  migratedAt: Timestamp.now(),
                  isRegistered: true,
                  authMethod: migratedData.authMethod || 'phone'
                });

                // [Group Membership Migration] 프리스타일탱고 멤버십 이전
                const oldMemberRef = doc(db, 'groups', 'freestyle-tango', 'members', phone);
                const memberSnap = await getDoc(oldMemberRef);
                
                if (memberSnap.exists()) {
                  const memberData = memberSnap.data();
                  const newMemberRef = doc(db, 'groups', 'freestyle-tango', 'members', firebaseUser.uid);
                  await setDoc(newMemberRef, {
                    ...memberData,
                    userId: firebaseUser.uid,
                    migratedAt: Timestamp.now()
                  });
                  await deleteDoc(oldMemberRef);
                }
                
                // 기존 전화번호 기반 문서 삭제
                await deleteDoc(phoneDocRef);
              }
            }
          }
        } catch (error) {
          console.error('Migration link failed:', error);
        }

        // Update last visited time only for registered users
        try {
          const userDocExists = userSnap && userSnap.exists();
          if (userDocExists && userSnap.data()?.isRegistered === true) {
            const existingData = userSnap.data();
            await setDoc(userDocRef, { 
              lastVisitedAt: serverTimestamp(),
              pinnedPostIds: existingData?.pinnedPostIds ?? [],
              interactedUserIds: existingData?.interactedUserIds ?? [],
              pinnedUserIds: existingData?.pinnedUserIds ?? []
            }, { merge: true });
          }
        } catch (error) {
          console.error('Failed to update lastVisitedAt:', error);
        }

        // 실시간 프로필 감시 시작
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              uid: firebaseUser.uid,
              email: data.email || firebaseUser.email,
              nickname: data.nickname || '',
              nativeNickname: data.nativeNickname || '',
              bio: data.bio || '',
              countryCode: data.countryCode || '',
              photoURL: data.photoURL || firebaseUser.photoURL,
              phoneNumber: data.phoneNumber || firebaseUser.phoneNumber || '',
              authMethod: data.authMethod || '',
              gender: data.gender || '',
              role: (data.role as 'leader' | 'follower') || undefined,
              isRegistered: data.isRegistered === true,
              isInstructor: data.isInstructor || false,
              isOrganizer: data.isOrganizer || false,
              isDj: data.isDj || false,
              isServiceProvider: data.isServiceProvider || false,
              isAdmin: data.isAdmin || false,
              systemRole: data.systemRole || '',
              joinedGroups: data.joinedGroups || [],
              pinnedPostIds: data.pinnedPostIds || [],
              interactedUserIds: data.interactedUserIds || [],
              pinnedUserIds: data.pinnedUserIds || [],
              career: data.career || '',
              partnerStatus: data.partnerStatus || '',
              allowPhoneCalls: data.allowPhoneCalls !== false,
              customSchedules: data.customSchedules || [],
            });

            // 구시대 알림 비허용 필드가 DB 문서에 남아 있다면 완전 영구 영탈(삭제)
            if ('allowChatNotifications' in data) {
              const uRef = doc(db, 'users', firebaseUser.uid);
              updateDoc(uRef, {
                allowChatNotifications: deleteField()
              }).catch(e => console.error("Failed to delete legacy field allowChatNotifications:", e));
            }
          } else {
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              nickname: '',
              countryCode: '',
              photoURL: firebaseUser.photoURL,
              phoneNumber: firebaseUser.phoneNumber || '',
              isRegistered: false,
              pinnedPostIds: [],
              interactedUserIds: [],
              pinnedUserIds: [],
              career: '',
              partnerStatus: '',
              allowPhoneCalls: true,
            });
          }
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Push Notification Permission Prompt (Option 1)
  useEffect(() => {
    if (user && typeof window !== 'undefined' && 'Notification' in window) {
      // PWA 앱(standalone) 환경에서만 알림 권한을 요청하여, 앱 미설치 상태의 설치 유도 화면에서 알림 팝업이 뜨지 않도록 방어
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      if (isStandalone) {
        fcmService.requestPermissionAndGetToken(user.uid).catch(console.error);
      }
    }
  }, [user]);

  // Foreground FCM Listener with In-App Banner Popup
  useEffect(() => {
    let unsubscribeMessage = () => {};
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      unsubscribeMessage = fcmService.onMessageListener((payload: any) => {
        // Trigger Premium In-App Notification Banner
        setActiveNotification({
          title: payload.notification?.title || 'New Message',
          body: payload.notification?.body || '',
          url: payload.data?.url
        });

        // Auto close after 4.5 seconds
        const timer = setTimeout(() => {
          setActiveNotification(null);
        }, 4500);

        return () => clearTimeout(timer);
      });
    }

    return () => {
      unsubscribeMessage();
    };
  }, [user]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, showLogin, setShowLogin, signOut }}>
      {children}
      
      {/* Foreground In-App Notification Banner */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 16, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            onClick={() => {
              if (activeNotification.url) {
                window.location.href = activeNotification.url;
              }
              setActiveNotification(null);
            }}
            className="fixed top-0 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[9999] bg-white/95 backdrop-blur-md px-5 py-4 rounded-2xl shadow-[0_8px_30px_rgba(11,90,192,0.18)] border border-blue-50/50 flex gap-3.5 items-center cursor-pointer select-none active:scale-[0.98] transition-transform duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20">
              <span className="material-symbols-outlined text-[22px]">notifications_active</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-[13px] font-black text-gray-900 truncate uppercase tracking-tight">{activeNotification.title}</h4>
              <p className="text-[12px] font-medium text-gray-500 truncate mt-0.5">{activeNotification.body}</p>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setActiveNotification(null);
              }}
              className="w-7 h-7 rounded-full bg-gray-100/80 hover:bg-gray-200 flex items-center justify-center text-gray-400 shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthContext.Provider>
  );
}
