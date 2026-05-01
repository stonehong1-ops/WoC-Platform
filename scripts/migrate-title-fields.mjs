/**
 * migrate-title-fields.mjs
 *
 * 목적: Firestore 스키마를 영문 우선 구조로 정리
 *
 * [socials]
 *   Before: title(한글), titleEn(영문)
 *   After:  title(영문 필수), titleNative(한글 선택)
 *
 * [events]
 *   Before: nativeTitle(한글)
 *   After:  titleNative(한글 선택)
 *
 * 실행: node scripts/migrate-title-fields.mjs
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  doc,
  deleteField,
} from 'firebase/firestore';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app  = initializeApp(firebaseConfig);
const db   = getFirestore(app);

/* ── 헬퍼: 배치 flush (Firestore 최대 500개/배치) ── */
async function flushBatch(batch, count) {
  if (count > 0) {
    await batch.commit();
    console.log(`  ✅ Committed ${count} operations`);
  }
}

/* ════════════════════════════════════════════
   1. socials: titleEn → title, title → titleNative
   ════════════════════════════════════════════ */
async function migrateSocials() {
  console.log('\n📌 [socials] 마이그레이션 시작...');
  const snap = await getDocs(collection(db, 'socials'));
  console.log(`  총 ${snap.size}개 문서`);

  let batch    = writeBatch(db);
  let opCount  = 0;
  let updated  = 0;
  let skipped  = 0;

  for (const d of snap.docs) {
    const data = d.data();

    // titleEn 필드가 있는 경우만 마이그레이션
    if (data.titleEn !== undefined) {
      const ref = doc(db, 'socials', d.id);
      batch.update(ref, {
        title:       data.titleEn,            // 영문 → title (필수)
        titleNative: data.title || deleteField(), // 한글 → titleNative (없으면 삭제)
        titleEn:     deleteField(),            // 제거
      });
      opCount++;
      updated++;
      console.log(`  [UPDATE] ${d.id}`);
      console.log(`           title: "${data.titleEn}"  |  titleNative: "${data.title || '(없음)'}"`);
    } else if (data.title && !data.titleNative) {
      // titleEn도 없고 titleNative도 없는 경우 — title이 이미 영문이면 그대로 유지
      console.log(`  [SKIP]   ${d.id} — titleEn 없음, 기존 title 유지: "${data.title}"`);
      skipped++;
    } else {
      console.log(`  [SKIP]   ${d.id} — 이미 올바른 구조`);
      skipped++;
    }

    // 500개마다 flush
    if (opCount >= 490) {
      await flushBatch(batch, opCount);
      batch   = writeBatch(db);
      opCount = 0;
    }
  }
  await flushBatch(batch, opCount);
  console.log(`  → 완료: ${updated}개 업데이트, ${skipped}개 스킵`);
}

/* ════════════════════════════════════════════
   2. events: nativeTitle → titleNative
   ════════════════════════════════════════════ */
async function migrateEvents() {
  console.log('\n📌 [events] 마이그레이션 시작...');
  const snap = await getDocs(collection(db, 'events'));
  console.log(`  총 ${snap.size}개 문서`);

  let batch    = writeBatch(db);
  let opCount  = 0;
  let updated  = 0;
  let skipped  = 0;

  for (const d of snap.docs) {
    const data = d.data();

    if (data.nativeTitle !== undefined) {
      const ref = doc(db, 'events', d.id);
      batch.update(ref, {
        titleNative: data.nativeTitle, // nativeTitle → titleNative
        nativeTitle: deleteField(),    // 제거
      });
      opCount++;
      updated++;
      console.log(`  [UPDATE] ${d.id}`);
      console.log(`           title: "${data.title}"  |  titleNative: "${data.nativeTitle}"`);
    } else if (data.nativeName !== undefined) {
      // 혹시 nativeName 필드가 있는 경우도 처리
      const ref = doc(db, 'events', d.id);
      batch.update(ref, {
        titleNative: data.nativeName,
        nativeName:  deleteField(),
      });
      opCount++;
      updated++;
      console.log(`  [UPDATE-nativeName] ${d.id}: "${data.nativeName}"`);
    } else {
      console.log(`  [SKIP]   ${d.id} — 이미 올바른 구조`);
      skipped++;
    }

    if (opCount >= 490) {
      await flushBatch(batch, opCount);
      batch   = writeBatch(db);
      opCount = 0;
    }
  }
  await flushBatch(batch, opCount);
  console.log(`  → 완료: ${updated}개 업데이트, ${skipped}개 스킵`);
}

/* ── Main ── */
(async () => {
  try {
    await migrateSocials();
    await migrateEvents();
    console.log('\n🎉 전체 마이그레이션 완료!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ 마이그레이션 실패:', err);
    process.exit(1);
  }
})();
