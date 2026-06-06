import { 
  db 
} from './clientApp';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';

export interface CoachingRoom {
  id: string;
  title: string;
  coachId: string;
  coachName: string;
  studentIds: string[];
  studentNames: string[];
  status: 'active' | 'completed';
  overallProgress: number;
  activeAssignmentCount: number;
  createdAt: any;
  updatedAt: any;
}

export interface Assignment {
  id: string;
  title: string;
  status: 'open' | 'in_progress' | 'completed';
  progress: number;
  createdAt: any;
  updatedAt: any;
}

export interface CoachingFeedItem {
  id: string;
  roomId: string;
  assignmentId?: string;
  assignmentTitle?: string;
  senderId: string;
  senderName: string;
  senderRole: 'coach' | 'student' | 'system';
  type: 'text' | 'photo' | 'video' | 'progress_update' | 'system_log';
  content: string;
  mediaUrl?: string;
  progressFrom?: number;
  progressTo?: number;
  createdAt: any;
}

export const coachingService = {
  // 1. 코칭방 생성 (강사만 권한 체크는 UI와 보안 규칙에서 수행)
  async createCoachingRoom(
    title: string, 
    coachId: string, 
    coachName: string, 
    studentIds: string[], 
    studentNames: string[]
  ): Promise<string> {
    const roomRef = collection(db, 'coaching_rooms');
    const newRoom = {
      title,
      coachId,
      coachName,
      studentIds,
      studentNames,
      status: 'active',
      overallProgress: 0,
      activeAssignmentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(roomRef, newRoom);
    return docRef.id;
  },

  // 2. 참여 코칭방 실시간 조회 (강사/학생 공통)
  subscribeCoachingRooms(userId: string, callback: (rooms: CoachingRoom[]) => void) {
    const q1 = query(
      collection(db, 'coaching_rooms'),
      where('coachId', '==', userId)
    );
    const q2 = query(
      collection(db, 'coaching_rooms'),
      where('studentIds', 'array-contains', userId)
    );

    // 강사 및 학생 방 통합 실시간 수집기
    let coachRooms: CoachingRoom[] = [];
    let studentRooms: CoachingRoom[] = [];

    const handleMerge = () => {
      const merged = [...coachRooms, ...studentRooms];
      // 중복 제거 및 시간 정렬
      const uniqueMap = new Map<string, CoachingRoom>();
      merged.forEach(r => uniqueMap.set(r.id, r));
      const result = Array.from(uniqueMap.values()).sort((a, b) => {
        // 1. 개설일(createdAt) desc
        const getMs = (val: any) => {
          if (!val) return 0;
          if (typeof val.toDate === 'function') return val.toDate().getTime();
          if (val.seconds !== undefined) return val.seconds * 1000;
          if (val instanceof Date) return val.getTime();
          if (typeof val === 'number') return val;
          return 0;
        };
        const timeA = getMs(a.createdAt);
        const timeB = getMs(b.createdAt);

        if (timeB !== timeA) {
          return timeB - timeA;
        }

        // 2. 제목(title) asc
        const titleA = a.title || '';
        const titleB = b.title || '';
        return titleA.localeCompare(titleB, 'ko', { sensitivity: 'base' });
      });
      callback(result);
    };

    const unsubCoach = onSnapshot(q1, (snap) => {
      coachRooms = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      handleMerge();
    }, (err) => console.error("Error subscribing coach rooms:", err));

    const unsubStudent = onSnapshot(q2, (snap) => {
      studentRooms = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      handleMerge();
    }, (err) => console.error("Error subscribing student rooms:", err));

    return () => {
      unsubCoach();
      unsubStudent();
    };
  },

  // 3. 단일 코칭방 실시간 조회
  subscribeCoachingRoom(roomId: string, callback: (room: CoachingRoom | null) => void) {
    const docRef = doc(db, 'coaching_rooms', roomId);
    return onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as any);
      } else {
        callback(null);
      }
    }, (err) => console.error("Error subscribing coaching room:", err));
  },

  // 4. 과제 추가 및 시스템 로그 피드 자동 기록
  async createAssignment(roomId: string, title: string): Promise<string> {
    const assignmentRef = collection(db, 'coaching_rooms', roomId, 'assignments');
    const newAssignment = {
      title,
      status: 'open',
      progress: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(assignmentRef, newAssignment);

    // 타임라인에 과제 생성 시스템 로그 자동 등록
    await this.addFeedItem(roomId, {
      type: 'system_log',
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      content: `System: 새 과제 '${title}'가 생성되었습니다.`,
      assignmentId: docRef.id,
      assignmentTitle: title
    });

    // 방의 활성 과제 수 카운팅 및 룸 업데이트
    await this.recalculateRoomStats(roomId);

    return docRef.id;
  },

  // 5. 과제 진행률 및 상태 업데이트
  async updateAssignmentProgress(
    roomId: string, 
    assignmentId: string, 
    title: string, 
    fromProgress: number, 
    toProgress: number
  ): Promise<void> {
    const status = toProgress === 100 ? 'completed' : toProgress > 0 ? 'in_progress' : 'open';
    const docRef = doc(db, 'coaching_rooms', roomId, 'assignments', assignmentId);

    await updateDoc(docRef, {
      progress: toProgress,
      status,
      updatedAt: serverTimestamp()
    });

    // 타임라인에 진행률 변화 로그 기록
    await this.addFeedItem(roomId, {
      type: 'progress_update',
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      content: `System: 진행률이 ${fromProgress}%에서 ${toProgress}%로 업데이트되었습니다.`,
      assignmentId,
      assignmentTitle: title,
      progressFrom: fromProgress,
      progressTo: toProgress
    });

    // 룸 전체 요약 통계 재계산 및 룸 업데이트
    await this.recalculateRoomStats(roomId);
  },

  // 6. 피드 아이템 등록
  async addFeedItem(
    roomId: string,
    feedData: Omit<CoachingFeedItem, 'id' | 'roomId' | 'createdAt'>
  ): Promise<void> {
    const feedRef = collection(db, 'coaching_rooms', roomId, 'feed');
    await addDoc(feedRef, {
      ...feedData,
      roomId,
      createdAt: serverTimestamp()
    });

    // 코칭방의 최종 업데이트 시간 갱신
    const roomDocRef = doc(db, 'coaching_rooms', roomId);
    await updateDoc(roomDocRef, {
      updatedAt: serverTimestamp()
    });
  },

  // 7. 실시간 타임라인 피드 가져오기 (시간 역순 정렬)
  subscribeActivityFeed(roomId: string, callback: (feed: CoachingFeedItem[]) => void) {
    const q = query(
      collection(db, 'coaching_rooms', roomId, 'feed'),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      callback(items);
    }, (err) => console.error("Error subscribing activity feed:", err));
  },

  // 8. 실시간 과제 목록 가져오기
  subscribeAssignments(roomId: string, callback: (assignments: Assignment[]) => void) {
    const q = query(
      collection(db, 'coaching_rooms', roomId, 'assignments'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      callback(items);
    }, (err) => console.error("Error subscribing assignments:", err));
  },

  // 9. 방 상태 변경 (Active <-> Completed)
  async updateRoomStatus(roomId: string, status: 'active' | 'completed'): Promise<void> {
    const roomRef = doc(db, 'coaching_rooms', roomId);
    await updateDoc(roomRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // 시스템 피드 등록
    await this.addFeedItem(roomId, {
      type: 'system_log',
      senderId: 'system',
      senderName: 'System',
      senderRole: 'system',
      content: `System: 코칭 상태가 [${status === 'active' ? '진행중' : '종료'}]로 변경되었습니다.`
    });
  },

  // 내부 헬퍼: 룸 정보(전체 진행률 평균, 진행 중인 과제 수) 재계산
  async recalculateRoomStats(roomId: string): Promise<void> {
    const assignmentsSnap = await getDocs(collection(db, 'coaching_rooms', roomId, 'assignments'));
    const list = assignmentsSnap.docs.map(d => d.data() as Assignment);

    if (list.length === 0) {
      const roomRef = doc(db, 'coaching_rooms', roomId);
      await updateDoc(roomRef, {
        overallProgress: 0,
        activeAssignmentCount: 0,
        updatedAt: serverTimestamp()
      });
      return;
    }

    const totalProgress = list.reduce((sum, item) => sum + (item.progress || 0), 0);
    const overallProgress = Math.round(totalProgress / list.length);
    const activeAssignmentCount = list.filter(item => item.status !== 'completed').length;

    const roomRef = doc(db, 'coaching_rooms', roomId);
    await updateDoc(roomRef, {
      overallProgress,
      activeAssignmentCount,
      updatedAt: serverTimestamp()
    });
  },

  // 10. 피드 아이템 삭제
  async deleteFeedItem(roomId: string, feedItemId: string): Promise<void> {
    const docRef = doc(db, 'coaching_rooms', roomId, 'feed', feedItemId);
    await deleteDoc(docRef);

    // 코칭방의 최종 업데이트 시간 갱신
    const roomDocRef = doc(db, 'coaching_rooms', roomId);
    await updateDoc(roomDocRef, {
      updatedAt: serverTimestamp()
    });
  },

  // 11. 피드 내용 수정
  async updateFeedItem(roomId: string, feedItemId: string, content: string): Promise<void> {
    const docRef = doc(db, 'coaching_rooms', roomId, 'feed', feedItemId);
    await updateDoc(docRef, {
      content,
      updatedAt: serverTimestamp()
    });

    // 코칭방의 최종 업데이트 시간 갱신
    const roomDocRef = doc(db, 'coaching_rooms', roomId);
    await updateDoc(roomDocRef, {
      updatedAt: serverTimestamp()
    });
  }
};
