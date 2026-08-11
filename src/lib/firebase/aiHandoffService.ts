import { db } from './clientApp';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { AIHandoffMessage } from '@/types/aiHandoff';

const AI_HANDOFF_COLLECTION = 'aiHandoffMessages';

// 읽기 전용 — 클라이언트 write는 firestore.rules에서 전면 차단됨 (Admin SDK만 기록 가능).
export const aiHandoffService = {
  subscribeTimeline: (callback: (messages: AIHandoffMessage[]) => void) => {
    const q = query(collection(db, AI_HANDOFF_COLLECTION), orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as AIHandoffMessage));
    }, (err) => {
      console.error('[aiHandoffService] subscribe failed:', err);
    });
  },
};
