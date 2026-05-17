/**
 * syncMilongaToSocial.ts
 * 
 * 이벤트의 milonga 타입 프로그램을 Social 모듈의 popup 이벤트로 자동 동기화.
 * - milonga 프로그램의 각 날짜별로 하나의 Social popup이 생성됨
 * - 이미 생성된 popup은 linkedEventId + linkedProgramId로 추적하여 업데이트
 * - 삭제된 milonga는 대응하는 Social popup도 삭제
 */

import { db } from './clientApp';
import {
  collection, query, where, getDocs, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { Event, EventProgram } from '@/types/event';

const SOCIALS_COLLECTION = 'socials';

interface LinkedSocial {
  id: string;
  linkedProgramId: string;
  linkedDate: string;
}

/**
 * 이벤트 저장 후 호출 — milonga 프로그램을 Social popup으로 동기화
 */
export async function syncMilongasToSocial(event: Event): Promise<{ created: number; updated: number; deleted: number }> {
  const result = { created: 0, updated: 0, deleted: 0 };

  // 1. 현재 이벤트에 연결된 기존 Social popup 조회
  const existingQuery = query(
    collection(db, SOCIALS_COLLECTION),
    where('linkedEventId', '==', event.id)
  );
  const existingSnap = await getDocs(existingQuery);
  const existingSocials: LinkedSocial[] = existingSnap.docs.map(d => ({
    id: d.id,
    linkedProgramId: d.data().linkedProgramId || '',
    linkedDate: d.data().linkedDate || '',
  }));

  // 2. milonga 프로그램에서 필요한 Social popup 목록 생성
  const milongas = (event.programs || []).filter(p => p.type === 'milonga');
  const neededKeys = new Set<string>();
  const neededMap: Record<string, { program: EventProgram; date: string }> = {};

  for (const m of milongas) {
    for (const d of m.dates) {
      const key = `${m.id}__${d}`;
      neededKeys.add(key);
      neededMap[key] = { program: m, date: d };
    }
  }

  // 3. 기존 것 중 더 이상 필요 없는 것 삭제
  for (const es of existingSocials) {
    const key = `${es.linkedProgramId}__${es.linkedDate}`;
    if (!neededKeys.has(key)) {
      await deleteDoc(doc(db, SOCIALS_COLLECTION, es.id));
      result.deleted++;
    }
  }

  // 4. 생성 또는 업데이트
  for (const key of Array.from(neededKeys)) {
    const { program, date } = neededMap[key];
    const existing = existingSocials.find(
      es => es.linkedProgramId === program.id && es.linkedDate === date
    );

    const socialData: Record<string, any> = {
      type: 'popup',
      title: program.title || event.title,
      titleNative: program.titleNative || event.titleNative || '',
      organizerId: event.hostId,
      organizerName: event.hostName || '',
      organizerNameNative: event.hostNameNative || '',
      venueId: event.venueId || '',
      venueName: event.venueName || '',
      imageUrl: event.imageUrl || '',
      startTime: program.startTime || '21:00',
      endTime: program.endTime || '01:00',
      country: event.location?.split(',')[1]?.trim() || '',
      city: event.location?.split(',')[0]?.trim() || '',
      date: Timestamp.fromDate(new Date(date)),
      djName: program.djName || '',
      price: event.pricing?.milongaPrice
        ? `${event.pricing.currency} ${event.pricing.milongaPrice.advance}`
        : '',
      description: program.description || `Part of ${event.title}`,
      staffIds: event.staffIds || [],
      staffNames: event.staffNames || [],
      // 연결 추적 필드
      linkedEventId: event.id,
      linkedProgramId: program.id,
      linkedDate: date,
    };

    if (existing) {
      await updateDoc(doc(db, SOCIALS_COLLECTION, existing.id), {
        ...socialData,
        updatedAt: serverTimestamp(),
      });
      result.updated++;
    } else {
      await addDoc(collection(db, SOCIALS_COLLECTION), {
        ...socialData,
        createdAt: serverTimestamp(),
      });
      result.created++;
    }
  }

  return result;
}

/**
 * 이벤트 삭제 시 연결된 Social popup 일괄 삭제
 */
export async function deleteLinkedSocials(eventId: string): Promise<number> {
  const q = query(
    collection(db, SOCIALS_COLLECTION),
    where('linkedEventId', '==', eventId)
  );
  const snap = await getDocs(q);
  let count = 0;
  for (const d of snap.docs) {
    await deleteDoc(doc(db, SOCIALS_COLLECTION, d.id));
    count++;
  }
  return count;
}
