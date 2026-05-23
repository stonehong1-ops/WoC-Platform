'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, Timestamp, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/clientApp';
import { toast } from 'sonner';
import { fcmService } from '@/lib/firebase/fcmService';
import { useLanguage } from '@/contexts/LanguageContext';

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
  allowChatNotifications?: boolean;
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
                console.log('Migrating user data from phone ID to UID:', phone);
                
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
                  console.log('Migrated membership for freestyle-tango');
                }
                
                // 기존 전화번호 기반 문서 삭제
                await deleteDoc(phoneDocRef);
              }
            }
          }
        } catch (error) {
          console.error('Migration link failed:', error);
        }

        // Update last visited time
        try {
          const userDocExists = userSnap && userSnap.exists();
          const existingData = userDocExists ? userSnap.data() : null;
          
          await setDoc(userDocRef, { 
            lastVisitedAt: serverTimestamp(),
            pinnedPostIds: existingData?.pinnedPostIds ?? [],
            interactedUserIds: existingData?.interactedUserIds ?? [],
            pinnedUserIds: existingData?.pinnedUserIds ?? []
          }, { merge: true });
        } catch (error) {
          console.error('Failed to init/update user document:', error);
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
              allowChatNotifications: data.allowChatNotifications !== false,
            });
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
              allowChatNotifications: true,
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
      // 이미 허용된 상태라면 백그라운드에서 토큰을 갱신/저장합니다.
      if (Notification.permission === 'granted') {
        fcmService.requestPermissionAndGetToken(user.uid).catch(console.error);
      } 
      // 권한을 아직 묻지 않은 상태(default)일 때만 토스트를 띄웁니다.
      else if (Notification.permission === 'default') {
        // 중복 토스트 방지를 위해 약간 지연
        const timer = setTimeout(() => {
          const toastId = toast(t('auth.push_noti_title'), {
            description: t('auth.push_noti_desc'),
            duration: 15000, // 15초 후 자동 닫힘
            position: 'top-center',
            action: {
              label: t('auth.push_noti_enable'),
              onClick: async () => {
                toast.dismiss(toastId);
                try {
                  const token = await fcmService.requestPermissionAndGetToken(user.uid);
                  if (token) {
                    toast.success(t('auth.push_noti_success'));
                  } else {
                    if (Notification.permission === 'denied') {
                      toast.error(t('auth.push_noti_blocked'));
                    }
                  }
                } catch (error) {
                  console.error('Error enabling notifications:', error);
                }
              }
            },
            cancel: {
              label: t('common.later'),
              onClick: () => toast.dismiss(toastId)
            }
          });
        }, 3000); // 페이지 로딩 후 3초 뒤에 띄움

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  // Foreground FCM Listener
  useEffect(() => {
    let unsubscribeMessage = () => {};
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        unsubscribeMessage = fcmService.onMessageListener((payload: any) => {
          console.log('[Foreground Push]', payload);
          toast(payload.notification?.title || 'New Message', {
            description: payload.notification?.body,
            action: {
              label: 'View',
              onClick: () => {
                if (payload.data?.url) {
                  window.location.href = payload.data.url;
                }
              }
            }
          });
        });
      }
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
    </AuthContext.Provider>
  );
}
