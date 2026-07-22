import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './clientApp';
import { WocClass, ClassGroupConnection } from '@/types/class';

const CLASSES_COLLECTION = 'classes';
const CONNECTIONS_COLLECTION = 'classGroupConnections';

export const wocClassService = {
  // ─── Class CRUD ───

  /** 클래스 생성 */
  async createClass(classData: Omit<WocClass, 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = doc(collection(db, CLASSES_COLLECTION), classData.id);
    await setDoc(docRef, {
      ...classData,
      connectedGroupIds: [],  // 반드시 빈 배열로 초기화
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return classData.id;
  },

  /** 클래스 조회 */
  async getClass(classId: string): Promise<WocClass | null> {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as WocClass;
  },

  /** 클래스 수정 (connectedGroupIds 제외) */
  async updateClass(classId: string, data: Partial<Omit<WocClass, 'id' | 'createdBy' | 'createdAt' | 'connectedGroupIds'>>): Promise<void> {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  /** 클래스 삭제 */
  async deleteClass(classId: string): Promise<void> {
    const docRef = doc(db, CLASSES_COLLECTION, classId);
    await deleteDoc(docRef);
  },

  /** Organizer가 운영하는 클래스 목록 조회 */
  async getClassesByOrganizer(organizerId: string): Promise<WocClass[]> {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('organizerId', '==', organizerId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as WocClass);
  },

  /** 특정 그룹에 연결된 클래스 목록 조회 */
  async getClassesByConnectedGroup(groupId: string): Promise<WocClass[]> {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      where('connectedGroupIds', 'array-contains', groupId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as WocClass);
  },

  /** 전체 클래스 목록 조회 (포털용) */
  async getAllClasses(): Promise<WocClass[]> {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as WocClass);
  },

  /** 클래스 실시간 구독 */
  subscribeToClasses(callback: (classes: WocClass[]) => void) {
    const q = query(
      collection(db, CLASSES_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      const classes = snap.docs.map(d => ({ id: d.id, ...d.data() }) as WocClass);
      callback(classes);
    });
  },

  // ─── 클래스 복제 (다음 달로) ───

  async duplicateClassToNextMonth(sourceClass: WocClass, targetMonth: string, newId: string): Promise<string> {
    const duplicated: Omit<WocClass, 'createdAt' | 'updatedAt'> = {
      ...sourceClass,
      id: newId,
      targetMonth,
      sourceClassId: sourceClass.id,
      connectedGroupIds: [...sourceClass.connectedGroupIds],  // 연결 관계 유지
      sessions: [],  // 세션은 새로 생성해야 함
    };
    return this.createClass(duplicated);
  },

  // ─── 그룹 연동 관계 관리 ───

  /** 그룹 연동 요청 생성 (SUBMITTED) */
  async requestGroupConnection(
    classId: string,
    groupId: string,
    requestedBy: string
  ): Promise<string> {
    const connectionId = `${classId}_${groupId}`;
    const docRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    await setDoc(docRef, {
      id: connectionId,
      classId,
      groupId,
      status: 'SUBMITTED',
      requestedBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return connectionId;
  },

  /** 자가 승인 (본인이 그룹 관리자인 경우) — batch transaction */
  async approveConnectionImmediate(
    classId: string,
    groupId: string,
    requestedBy: string,
    approvedBy: string
  ): Promise<void> {
    const batch = writeBatch(db);

    // 1. Connection 문서 생성 (SELLER_CONFIRMED)
    const connectionId = `${classId}_${groupId}`;
    const connRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    batch.set(connRef, {
      id: connectionId,
      classId,
      groupId,
      status: 'SELLER_CONFIRMED',
      requestedBy,
      approvedBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // 2. 클래스 원본의 connectedGroupIds에 추가
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    batch.update(classRef, {
      connectedGroupIds: arrayUnion(groupId),
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  },

  /** 연동 요청 승인 (그룹 관리자) — batch transaction */
  async approveConnection(connectionId: string, approvedBy: string): Promise<void> {
    const connRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    const connSnap = await getDoc(connRef);
    if (!connSnap.exists()) throw new Error('Connection not found');

    const conn = connSnap.data() as ClassGroupConnection;
    const batch = writeBatch(db);

    // 1. Connection 상태 변경
    batch.update(connRef, {
      status: 'SELLER_CONFIRMED',
      approvedBy,
      updatedAt: Timestamp.now(),
    });

    // 2. 클래스 원본의 connectedGroupIds에 추가
    const classRef = doc(db, CLASSES_COLLECTION, conn.classId);
    batch.update(classRef, {
      connectedGroupIds: arrayUnion(conn.groupId),
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  },

  /** 연동 요청 거절 (그룹 관리자) */
  async rejectConnection(connectionId: string, approvedBy: string): Promise<void> {
    const connRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    await updateDoc(connRef, {
      status: 'SELLER_REJECTED',
      approvedBy,
      updatedAt: Timestamp.now(),
    });
  },

  /** 승인된 연동 해제 — batch transaction */
  async disconnectGroup(classId: string, groupId: string): Promise<void> {
    const batch = writeBatch(db);

    // 1. Connection 문서 삭제
    const connectionId = `${classId}_${groupId}`;
    const connRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    batch.delete(connRef);

    // 2. 클래스 원본의 connectedGroupIds에서 제거
    const classRef = doc(db, CLASSES_COLLECTION, classId);
    batch.update(classRef, {
      connectedGroupIds: arrayRemove(groupId),
      updatedAt: Timestamp.now(),
    });

    await batch.commit();
  },

  /** SUBMITTED 요청 취소 (요청자 본인) */
  async cancelConnectionRequest(connectionId: string): Promise<void> {
    const connRef = doc(db, CONNECTIONS_COLLECTION, connectionId);
    await deleteDoc(connRef);
  },

  /** 특정 그룹의 연동 요청 목록 조회 */
  async getConnectionsByGroup(groupId: string): Promise<ClassGroupConnection[]> {
    const q = query(
      collection(db, CONNECTIONS_COLLECTION),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ClassGroupConnection);
  },

  /** 특정 클래스의 연동 관계 목록 조회 */
  async getConnectionsByClass(classId: string): Promise<ClassGroupConnection[]> {
    const q = query(
      collection(db, CONNECTIONS_COLLECTION),
      where('classId', '==', classId)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as ClassGroupConnection);
  },
};
