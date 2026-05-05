'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, query, where, getDocs, setDoc, doc, writeBatch, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/components/providers/AuthProvider';
import { notificationService } from '@/lib/firebase/notificationService';

export default function SeedScenarioPage() {
  const { profile } = useAuth();
  const [adminAccount, setAdminAccount] = useState('');
  const [userAccount, setUserAccount] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const runSeed = async () => {
    if (!adminAccount || !userAccount) {
      alert('Admin 계정과 User 계정을 모두 입력해주세요.');
      return;
    }
    
    setLoading(true);
    setLogs([]);
    addLog('🚀 시드 시나리오 생성을 시작합니다...');

    try {
      // 1. 유저 찾기 (이메일 또는 전화번호 기준)
      addLog(`사용자 검색 중: ${adminAccount}, ${userAccount}`);
      
      const adminField = adminAccount.includes('@') ? 'email' : 'phoneNumber';
      const userField = userAccount.includes('@') ? 'email' : 'phoneNumber';
      
      const adminQ = query(collection(db, 'users'), where(adminField, '==', adminAccount));
      const userQ = query(collection(db, 'users'), where(userField, '==', userAccount));
      
      const adminSnap = await getDocs(adminQ);
      const userSnap = await getDocs(userQ);

      if (adminSnap.empty) throw new Error(`Admin 사용자를 찾을 수 없습니다: ${adminAccount}`);
      if (userSnap.empty) throw new Error(`User 사용자를 찾을 수 없습니다: ${userAccount}`);

      const adminUser = { id: adminSnap.docs[0].id, ...adminSnap.docs[0].data() } as any;
      const normalUser = { id: userSnap.docs[0].id, ...userSnap.docs[0].data() } as any;

      addLog(`✅ 유저 매칭 성공! Admin(${adminUser.nickname}), User(${normalUser.nickname})`);

      const batch = writeBatch(db);
      const now = Timestamp.now();

      // 2. 그룹 생성 (Tango Life Seoul)
      const groupId = 'seed_group_tango_life_seoul';
      const groupRef = doc(db, 'groups', groupId);
      batch.set(groupRef, {
        name: 'Tango Life Seoul',
        description: '시나리오로 생성된 테스트 그룹입니다.',
        ownerId: adminUser.id,
        coverImage: 'https://images.unsplash.com/photo-1504609774528-693ea897a390?q=80&w=1000',
        memberCount: 2,
        createdAt: now,
        updatedAt: now,
        isPublished: true,
        membershipPolicy: { joinStrategy: 'invite' },
        activeServices: { class: true, shop: true, stay: true, rental: true }
      });
      addLog('✅ [1/5] 그룹 데이터 (Tango Life Seoul) 생성 준비됨.');

      // 3. 멤버 등록 (Admin: owner, User: active)
      const adminMemberRef = doc(db, 'groups', groupId, 'members', adminUser.id);
      batch.set(adminMemberRef, {
        name: adminUser.nickname || 'Admin',
        role: 'owner',
        status: 'active',
        joinedAt: now
      });

      const userMemberRef = doc(db, 'groups', groupId, 'members', normalUser.id);
      batch.set(userMemberRef, {
        name: normalUser.nickname || 'User',
        role: 'member',
        status: 'active',
        joinedAt: now
      });
      addLog('✅ [2/5] 그룹 멤버 권한 (owner, active) 부여 준비됨.');

      // 4. 클래스 생성 (밀롱가 초급 집중 클래스)
      const classId = 'seed_class_milonga_basic';
      const classRef = doc(db, 'groups', groupId, 'classes', classId);
      batch.set(classRef, {
        title: '밀롱가 초급 집중 클래스 (Seed)',
        description: '시나리오 생성용 더미 클래스입니다.',
        level: 'Basic',
        currency: 'KRW',
        amount: 80000,
        status: 'Open',
        targetMonth: '2026-05',
        maxCapacity: 20,
        instructors: [{ name: adminUser.nickname || '강사', role: 'Main Instructor' }],
        schedule: [
          { week: 1, date: '2026-05-10', timeSlot: '19:00 - 21:00', content: '밀롱가 베이직' },
          { week: 2, date: '2026-05-17', timeSlot: '19:00 - 21:00', content: '밀롱가 리듬' }
        ],
        createdAt: now
      });
      addLog('✅ [3/5] 그룹 내 클래스 (밀롱가 초급) 생성 준비됨.');

      // 5. User의 클래스 수강 신청 (History 데이터 용도)
      const registrationId = 'seed_reg_001';
      const regRef = doc(db, 'groups', groupId, 'class_registrations', registrationId);
      batch.set(regRef, {
        classId: classId,
        groupId: groupId,
        userId: normalUser.id,
        classTitle: '밀롱가 초급 집중 클래스 (Seed)',
        applicantName: normalUser.nickname,
        userAvatar: normalUser.photoURL || '',
        status: 'PAYMENT_REPORTED', // 관리자 승인 대기 상태
        amount: 80000,
        currency: 'KRW',
        depositorName: normalUser.nickname,
        depositDate: '2026-05-02',
        appliedAt: now,
        updatedAt: now,
        itemType: 'class',
        groupName: 'Tango Life Seoul'
      });
      addLog('✅ [4/5] 일반 사용자의 클래스 수강 신청 내역(History) 생성 준비됨.');

      // 알림(Notification) 생성은 batch 대신 service를 사용 (FCM 발송 등 부수 효과)
      // 배치는 커밋 처리
      await batch.commit();
      addLog('💾 DB Batch 저장 완료!');

      // 6. 알림(Notifications) 생성
      // 6-1. User에게 온 초대 알림 (INFO) - 푸터 배지용
      await notificationService.createNotification({
        targetUserId: normalUser.id,
        category: 'GROUP',
        title: '그룹 가입 승인',
        message: `'Tango Life Seoul' 그룹의 가입이 승인되었습니다.`,
        actionUrl: `/group/${groupId}`,
      });

      // 6-2. Admin에게 온 Todo 알림 (TODO) - 관리자 할일 배지용
      await notificationService.createTodo({
        targetUserId: adminUser.id,
        groupId: groupId,
        category: 'CLASS',
        title: '새로운 수강 신청',
        message: `${normalUser.nickname}님이 '밀롱가 초급 집중 클래스'에 수강 신청(입금보고)을 하였습니다.`,
        actionUrl: `/group/${groupId}?tab=admin`,
        referenceId: registrationId
      });
      
      addLog('✅ [5/5] 두 사용자의 알림(Notifications) 발송 완료!');
      addLog('🎉 시나리오 씨드 데이터 생성이 성공적으로 완료되었습니다.');

    } catch (error: any) {
      console.error(error);
      addLog(`❌ 오류 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!profile?.isAdmin) {
    return <div className="p-10 text-center text-red-500 font-bold">접근 권한이 없습니다 (시스템 관리자만 가능).</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 pt-20">
      <h1 className="text-2xl font-black mb-6">🌱 시나리오 기반 씨드 데이터 생성기</h1>
      <p className="text-gray-600 mb-6 text-sm">
        이 도구는 상상된 가짜 데이터가 아니라, 실제 서비스의 <code>addDoc</code>, <code>setDoc</code> 구조와 타임스탬프 로직을 그대로 거쳐 그룹, 클래스, 멤버, 수강 신청 내역, 그리고 알림(Notification)까지 유기적으로 연결된 완벽한 데이터를 구성합니다.
      </p>

      <div className="space-y-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Admin 계정 (이메일 또는 전화번호)</label>
          <input 
            type="text" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="admin@example.com 또는 +8210..."
            value={adminAccount}
            onChange={e => setAdminAccount(e.target.value.trim())}
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">User 계정 (이메일 또는 전화번호)</label>
          <input 
            type="text" 
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            placeholder="user@example.com 또는 +8210..."
            value={userAccount}
            onChange={e => setUserAccount(e.target.value.trim())}
          />
        </div>
        <button 
          onClick={runSeed}
          disabled={loading}
          className="w-full py-4 mt-4 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
        >
          {loading ? '생성 중...' : '시나리오 데이터 주입 실행'}
        </button>
      </div>

      {logs.length > 0 && (
        <div className="bg-black text-green-400 p-4 rounded-xl font-mono text-xs overflow-y-auto max-h-[300px]">
          {logs.map((log, idx) => (
            <div key={idx} className="mb-1">{log}</div>
          ))}
        </div>
      )}
    </div>
  );
}
