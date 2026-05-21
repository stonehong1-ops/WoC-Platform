// 사용자 프로필 정보를 불러와 프리미엄 NamecardModal로 렌더링하는 팝업 래퍼 컴포넌트
import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import NamecardModal, { NamecardUser } from './NamecardModal';

interface UserProfilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  uid: string;
  initialData?: {
    nickname?: string;
    nativeNickname?: string;
    photoURL?: string | null;
  };
}

interface FullProfile {
  nickname: string;
  nativeNickname?: string;
  photoURL?: string | null;
  bio?: string;
  isInstructor?: boolean;
  isOrganizer?: boolean;
  isDj?: boolean;
  isServiceProvider?: boolean;
  gender?: string;
  role?: string;
  joinedGroups?: string[];
  email?: string;
  career?: string;
  partnerStatus?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  phone?: string;
  phoneNumber?: string;
}

export default function UserProfilePopup({ isOpen, onClose, uid, initialData }: UserProfilePopupProps) {
  const [profile, setProfile] = useState<FullProfile | null>(initialData as FullProfile || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (!isOpen || !uid) return;

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as FullProfile);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isOpen, uid]);

  if (!isOpen) return null;

  if (loading && !profile) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!profile) return null;

  // FullProfile을 NamecardUser 형식으로 전환하는 트랜스포머
  const roles: string[] = [];
  if (profile.isInstructor) roles.push('Instructor');
  if (profile.isOrganizer) roles.push('Organizer');
  if (profile.isDj) roles.push('DJ');
  if (profile.isServiceProvider) roles.push('Service Provider');
  
  if (roles.length === 0 && profile.role) {
    roles.push(profile.role);
  }

  const namecardUser: NamecardUser = {
    uid,
    name: profile.nickname || 'User',
    nativeName: profile.nativeNickname,
    email: profile.email,
    photoURL: profile.photoURL || undefined,
    roles: roles.length > 0 ? roles : ['Member'],
    career: profile.career,
    partnerStatus: profile.partnerStatus,
    bio: profile.bio,
    socialLinks: profile.socialLinks,
    phone: profile.phone || profile.phoneNumber,
    phoneNumber: profile.phoneNumber,
    role: profile.role
  };

  return (
    <NamecardModal
      user={namecardUser}
      isOpen={isOpen}
      onClose={onClose}
      onChat={(userId) => {
        console.log("Chat clicked for user:", userId);
      }}
      onCall={(phone) => {
        if (phone) {
          window.open(`tel:${phone}`);
        } else {
          alert("전화번호가 등록되지 않았습니다.");
        }
      }}
    />
  );
}
