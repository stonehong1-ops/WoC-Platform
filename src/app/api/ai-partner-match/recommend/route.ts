import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

function getAdminDb() {
  if (!admin.apps.length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail && projectId) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId.trim(),
            clientEmail: clientEmail.trim(),
            privateKey: privateKey.replace(/\\n/g, '\n').trim(),
          }),
        });
      } catch (error: any) {
        console.error('Firebase Admin 초기화 오류:', error.stack);
      }
    }
  }
  return admin.firestore();
}

interface PurposeDetail {
  enabled: boolean;
  memo?: string;
}

interface PartnerMatchData {
  lookingForPartner: boolean;
  experienceYears?: number;
  purposes: {
    class?: PurposeDetail;
    performance?: PurposeDetail;
    competition?: PurposeDetail;
  };
  updatedAt?: any;
}

export async function POST(req: NextRequest) {
  try {
    const adminDb = getAdminDb();
    const body = await req.json();
    const { userId, cursor, limit = 10 } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // 1. Fetch current user document
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data() || {};
    const myMatch = userData.partnerMatch as PartnerMatchData | undefined;

    // If current user is not looking for a partner, return empty recommendations
    if (!myMatch || !myMatch.lookingForPartner) {
      return NextResponse.json({ items: [], hasMore: false });
    }

    const myExp = myMatch.experienceYears ?? 1;
    const myCountry = userData.countryCode || '';
    const myBlocked = userData.blockedUsers || [];

    // 2. Fetch candidates who are looking for a partner
    const usersSnapshot = await adminDb.collection('users')
      .where('partnerMatch.lookingForPartner', '==', true)
      .get();

    const candidates: any[] = [];

    usersSnapshot.forEach((doc) => {
      const cId = doc.id;
      const cData = doc.data();

      // Exclusion criteria
      if (cId === userId) return; // Self
      if (cData.deleted === true || cData.status === 'inactive') return; // Inactive
      if (cData.isPrivate === true || cData.privacy === 'private') return; // Private profile
      if (myBlocked.includes(cId)) return; // Blocked by me
      if (cData.blockedUsers && cData.blockedUsers.includes(userId)) return; // Blocked by them

      const cMatch = cData.partnerMatch as PartnerMatchData | undefined;
      if (!cMatch) return;

      // Purpose Matching & Scoring
      let score = 0;
      const reasons: string[] = [];
      const matchedPurposes: string[] = [];

      // Purposes check
      const purposesList: ('class' | 'performance' | 'competition')[] = ['class', 'performance', 'competition'];
      purposesList.forEach((purpose) => {
        const myPurpose = myMatch.purposes?.[purpose];
        const cPurpose = cMatch.purposes?.[purpose];
        if (myPurpose?.enabled && cPurpose?.enabled) {
          score += 100;
          matchedPurposes.push(purpose);
        }
      });

      if (matchedPurposes.length > 0) {
        reasons.push(`${matchedPurposes.length} 목적 일치`);
      }

      // Experience Similarity scoring
      const cExp = cMatch.experienceYears ?? 1;
      const expDiff = Math.abs(myExp - cExp);
      // Perfect match gives 50 points, difference deducts points
      const expScore = Math.max(0, 50 - expDiff * 10);
      score += expScore;
      if (expDiff <= 1) {
        reasons.push('유사한 경력');
      }

      // Location matching scoring
      const cCountry = cData.countryCode || '';
      if (myCountry && cCountry && myCountry === cCountry) {
        score += 30;
        reasons.push('동일 활동 지역');
      }

      // Add updatedAt timestamp factor
      const updatedAtMs = cMatch.updatedAt?.toDate
        ? cMatch.updatedAt.toDate().getTime()
        : (cMatch.updatedAt?._seconds ? cMatch.updatedAt._seconds * 1000 : 0);

      candidates.push({
        userId: cId,
        nickname: cData.nickname || cData.displayName || 'Unknown',
        photoUrl: cData.photoURL || cData.photoUrl || '',
        experienceYears: cExp,
        purposes: cMatch.purposes || {},
        matchedPurposes,
        score,
        reasons,
        updatedAtMs
      });
    });

    // 3. Sort candidates: primary by score desc, secondary by updatedAt desc
    candidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.updatedAtMs - a.updatedAtMs;
    });

    // 4. Pagination handling (using simple array offset as cursor)
    const startIndex = cursor ? parseInt(cursor, 10) : 0;
    const paginatedItems = candidates.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < candidates.length;
    const nextCursor = hasMore ? String(startIndex + limit) : undefined;

    return NextResponse.json({
      items: paginatedItems,
      nextCursor,
      hasMore
    });
  } catch (error) {
    console.error('Error in recommend API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
