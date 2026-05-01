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
  isSeller?: boolean;
  isServiceProvider?: boolean;
  role?: string;
  isAdmin?: boolean;
  systemRole?: string;
  joinedGroups?: string[];
  lastVisitedAt?: any;
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
        
        try {
          const userSnap = await getDoc(userDocRef);
          
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
          await updateDoc(userDocRef, { lastVisitedAt: serverTimestamp() });
        } catch (error) {
          console.log('User document might not exist yet for lastVisitedAt update');
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
              isRegistered: true,
              isInstructor: data.isInstructor || false,
              isSeller: data.isSeller || false,
              isServiceProvider: data.isServiceProvider || false,
              isAdmin: data.isAdmin || false,
              systemRole: data.systemRole || '',
              joinedGroups: data.joinedGroups || [],
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
          const toastId = toast('새로운 채팅 알림을 실시간으로 받으시겠습니까?', {
            description: '채팅이 오면 알림을 받아볼 수 있습니다.',
            duration: 15000, // 15초 후 자동 닫힘
            position: 'top-center',
            action: {
              label: '알림 켜기',
              onClick: async () => {
                toast.dismiss(toastId);
                try {
                  const token = await fcmService.requestPermissionAndGetToken(user.uid);
                  if (token) {
                    toast.success('푸시 알림이 성공적으로 켜졌습니다!');
                  } else {
                    if (Notification.permission === 'denied') {
                      toast.error('브라우저 알림 권한이 차단되어 설정할 수 없습니다.');
                    }
                  }
                } catch (error) {
                  console.error('Error enabling notifications:', error);
                }
              }
            },
            cancel: {
              label: '나중에',
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
