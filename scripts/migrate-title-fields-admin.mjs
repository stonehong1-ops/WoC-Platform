/**
 * migrate-title-fields-admin.mjs
 * Firebase Admin SDK 사용 — 보안 규칙 우회
 *
 * 실행: node scripts/migrate-title-fields-admin.mjs
 */

import { initializeApp, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';

dotenv.config({ path: '.env.local' });

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
if (!PROJECT_ID) {
  console.error('❌ NEXT_PUBLIC_FIREBASE_PROJECT_ID 환경변수가 없습니다.');
  process.exit(1);
}

// 서비스 계정 키 파일 경로 (있으면 사용, 없으면 ADC)
const SA_KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';

let app;
if (existsSync(SA_KEY_PATH)) {
  console.log(`🔑 서비스 계정 키 사용: ${SA_KEY_PATH}`);
  app = initializeApp({ credential: cert(JSON.parse(readFileSync(SA_KEY_PATH, 'utf8'))) });
} else {
  console.log('🔑 Application Default Credentials (ADC) 사용');
  app = initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
}

const db = getFirestore(app);

/* ── 배치 flush ── */
async function flushBatch(batch, count) {
  if (count > 0) {
    await batch.commit();
    console.log(`  ✅ ${count}개 커밋 완료`);
  }
}

/* ════════════════════════════════════════
   1. socials: titleEn → title, title → titleNative
   ════════════════════════════════════════ */
async function migrateSocials() {
  console.log('\n📌 [socials] 마이그레이션 시작...');
  const snap = await db.collection('socials').get();
  console.log(`  총 ${snap.size}개 문서`);

  let batch = db.batch();
  let opCount = 0, updated = 0, skipped = 0;

  for (const d of snap.docs) {
    const data = d.data();

    if (data.titleEn !== undefined) {
      const ref = db.collection('socials').doc(d.id);
      batch.update(ref, {
        title:       data.titleEn,
        titleNative: data.title || FieldValue.delete(),
        titleEn:     FieldValue.delete(),
      });
      opCount++;
      updated++;
      console.log(`  [OK] ${d.id}  "${data.titleEn}" | native: "${data.title || '-'}"`);
    } else {
      skipped++;
      console.log(`  [--] ${d.id}  SKIP`);
    }

    if (opCount >= 490) {
      await flushBatch(batch, opCount);
      batch = db.batch();
      opCount = 0;
    }
  }
  await flushBatch(batch, opCount);
  console.log(`  → socials: ${updated} 업데이트, ${skipped} 스킵`);
}

/* ════════════════════════════════════════
   2. events: nativeTitle → titleNative
   ════════════════════════════════════════ */
async function migrateEvents() {
  console.log('\n📌 [events] 마이그레이션 시작...');
  const snap = await db.collection('events').get();
  console.log(`  총 ${snap.size}개 문서`);

  let batch = db.batch();
  let opCount = 0, updated = 0, skipped = 0;

  for (const d of snap.docs) {
    const data = d.data();
    const updates = {};
    let needsUpdate = false;

    if (data.nativeTitle !== undefined) {
      updates.titleNative = data.nativeTitle;
      updates.nativeTitle = FieldValue.delete();
      needsUpdate = true;
    }
    if (data.nativeName !== undefined) {
      updates.titleNative = data.nativeName;
      updates.nativeName = FieldValue.delete();
      needsUpdate = true;
    }

    if (needsUpdate) {
      db.collection('events').doc(d.id);
      batch.update(db.collection('events').doc(d.id), updates);
      opCount++;
      updated++;
      console.log(`  [OK] ${d.id}  "${data.title}" | native: "${data.nativeTitle || data.nativeName || '-'}"`);
    } else {
      skipped++;
      console.log(`  [--] ${d.id}  SKIP`);
    }

    if (opCount >= 490) {
      await flushBatch(batch, opCount);
      batch = db.batch();
      opCount = 0;
    }
  }
  await flushBatch(batch, opCount);
  console.log(`  → events: ${updated} 업데이트, ${skipped} 스킵`);
}

/* ── Main ── */
(async () => {
  try {
    await migrateSocials();
    await migrateEvents();
    console.log('\n🎉 전체 마이그레이션 완료!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ 마이그레이션 실패:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
