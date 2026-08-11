import { NextResponse } from 'next/server';
import admin from '@/lib/server/firebaseAdmin';

/**
 * 회원 수 집계.
 *
 * 홈 화면이 "총 회원 수 / 최근 7일 신규 가입" 두 숫자를 보여주려고 users 컬렉션을
 * 통째로 내려받아 클라이언트에서 세고 있었다. 숫자 두 개 때문에 424명의 문서가
 * (email·phoneNumber 포함) 브라우저까지 오는 구조였다.
 *
 * Firestore 집계 쿼리는 문서를 읽지 않고 개수만 돌려주므로, 서버에서 count() 두 번이면 끝난다.
 * 반환값은 집계 수치뿐이라 개인정보가 없다 — 홈은 비로그인도 보므로 인증을 요구하지 않는다.
 */
export async function GET() {
  try {
    const db = admin.firestore();
    const sevenDaysAgo = admin.firestore.Timestamp.fromMillis(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    const [totalSnap, recentSnap, countrySnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('users').where('createdAt', '>=', sevenDaysAgo).count().get(),
      // 회원이 어느 나라에 있는지 집계. countryCode 하나만 읽으므로 문서 전체가 오가지 않는다.
      db.collection('users').select('countryCode').get(),
    ]);

    const countries = new Set<string>();
    countrySnap.docs.forEach(d => {
      const raw = d.get('countryCode');
      if (!raw || typeof raw !== 'string') return;
      let c = raw.trim().toUpperCase();
      // "+82 (KR)" 처럼 저장돼 있어 국가 코드만 뽑아낸다.
      const m = c.match(/\(([A-Z]{2})\)/);
      if (m) c = m[1];
      const alias: Record<string, string> = {
        KR: 'SOUTH KOREA', KOREA: 'SOUTH KOREA', SOUTH_KOREA: 'SOUTH KOREA',
        SG: 'SINGAPORE', US: 'UNITED STATES', USA: 'UNITED STATES',
        CN: 'CHINA', AU: 'AUSTRALIA', HK: 'HONG KONG', JP: 'JAPAN',
      };
      countries.add(alias[c] || c);
    });

    return NextResponse.json({
      totalMembers: totalSnap.data().count,
      weeklyNewMembers: recentSnap.data().count,
      memberCountries: Array.from(countries),
    });
  } catch (error: any) {
    console.error('Member stats error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
