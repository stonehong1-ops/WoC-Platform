// 사용자 프로필 정보를 불러와 프리미엄 NamecardModal로 렌더링하는 모달 래퍼 컴포넌트
import React, { useEffect, useState } from 'react';
import { PlatformUser } from '@/types/user';
import { userService } from '@/lib/firebase/userService';
import NamecardModal, { NamecardUser } from './NamecardModal';

interface UserProfileModalProps {
  userId: string;
  onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: UserProfileModalProps) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUserById(userId);
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (!userId) return null;

  if (loading && !user) {
    return (
      <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) return null;

  // PlatformUser를 NamecardUser 형식으로 전환하는 트랜스포머
  const roles: string[] = [];
  if ((user as any).isInstructor) roles.push('Instructor');
  if ((user as any).isOrganizer) roles.push('Organizer');
  if ((user as any).isDj) roles.push('DJ');
  if ((user as any).isServiceProvider) roles.push('Service Provider');
  
  if (roles.length === 0 && (user as any).roles) {
    roles.push(...((user as any).roles));
  }

  const namecardUser: NamecardUser = {
    uid: userId,
    name: user.nickname || (user as any).displayName || 'User',
    nativeName: (user as any).realName || (user as any).displayName || undefined,
    email: user.email,
    photoURL: user.photoURL || undefined,
    roles: roles.length > 0 ? roles : ['Member'],
    career: (user as any).career,
    partnerStatus: (user as any).partnerStatus,
    bio: (user as any).bio || '',
    socialLinks: (user as any).socialLinks || {
      whatsapp: user.phoneNumber ? `https://wa.me/${user.phoneNumber.replace(/[^0-9]/g, '')}` : undefined
    },
    phone: user.phoneNumber,
    role: (user as any).role,
    allowPhoneCalls: (user as any).allowPhoneCalls
  };

  return (
    <NamecardModal
      user={namecardUser}
      isOpen={true}
      onClose={onClose}
      onChat={() => {}}
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
