import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath = './woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json';
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

export async function POST(req: Request) {
  try {
    const { candidateId } = await req.json();
    if (!candidateId) {
      return NextResponse.json({ error: 'Candidate ID가 없습니다.' }, { status: 400 });
    }

    // 1. Candidate 문서 조회
    const candidateRef = db.collection('socialRadarCandidates').doc(candidateId);
    const candidateDoc = await candidateRef.get();
    if (!candidateDoc.exists) {
      return NextResponse.json({ error: '해당 후보 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    const candidate = candidateDoc.data()!;
    const ext = candidate.extracted || {};
    const match = candidate.match || {};
    const changes = candidate.detectedChanges || {};

    // 2. 마크다운 작업카드 포맷 생성
    const todayStr = new Date().toISOString().split('T')[0];
    const markdownContent = `# Social Register Task

## Candidate

- Title: ${ext.titleNative || ext.title || 'N/A'}
- Region: ${ext.region || 'N/A'}
- Venue: ${ext.venue || 'N/A'}
- Date: ${ext.date || 'N/A'}
- Day: ${ext.dayOfWeek || 'N/A'}
- Time: ${ext.startTime || 'N/A'} ~ ${ext.endTime || 'N/A'}
- DJ: ${ext.dj || 'N/A'}
- Organizer: ${ext.organizer || 'N/A'}
- Source URL: ${candidate.sourceUrl || 'N/A'}
- Source Type: ${candidate.sourceType || 'manual'}

## Existing Social Match

- Match Status: ${match.status || 'unknown'}
- Existing Social ID: ${match.socialId || 'N/A'}
- Existing Social Title: ${match.socialTitle || 'N/A'}
- Match Confidence: ${match.confidence || 0}%
- Match Reason: ${match.reason || 'N/A'}

## Detected Changes

- Poster: ${changes.poster ? 'Yes' : 'No'}
- DJ: ${changes.dj ? 'Yes' : 'No'}
- Description: ${changes.description ? 'Yes' : 'No'}
- Time: ${changes.time ? 'Yes' : 'No'}
- Venue: ${changes.venue ? 'Yes' : 'No'}
- New Social: ${changes.newSocial ? 'Yes' : 'No'}

## Source Summary

원문 요약:
${ext.description || '요약된 내용이 없습니다.'}

## Instruction

Check existing Social Register data and the current knowhow.md.

If this is an existing social:
- Update only the changed fields.
- Do not overwrite unrelated data.
- Preserve existing stable fields.

If this is a new social:
- Register it according to Social Register rules and knowhow.md.
- Use existing venue/region conventions.
- Avoid duplicate Social creation.

Do not modify Header/Footer/JumpPad/Canvas Root.
Do not change unrelated Social data.
Do not open CreateSocialModal.
Do not directly write from Social Radar into socials unless this task is explicitly processed through Social Register.
`;

    // 3. Firestore socialRegisterTasks 컬렉션에 영구 저장 (핵심 성공 요건)
    const taskRef = await db.collection('socialRegisterTasks').add({
      candidateId,
      markdownContent,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // 4. 로컬 파일 쓰기 시도 (Warning Guard 적용)
    let fileWarning: string | undefined = undefined;
    try {
      const taskDir = path.join(process.cwd(), 'social-register-tasks');
      // 디렉토리가 없으면 생성
      if (!fs.existsSync(taskDir)) {
        await fs.promises.mkdir(taskDir, { recursive: true });
      }

      const filePath = path.join(taskDir, `${todayStr}.md`);
      // 파일이 있으면 뒤에 개행 후 덧붙임, 없으면 새로 작성
      const fileText = `\n\n---\n\n${markdownContent}`;
      await fs.promises.appendFile(filePath, fileText, 'utf-8');
      console.log(`Successfully appended task to local file: ${filePath}`);
    } catch (fsErr: any) {
      console.warn('Local file system write skipped or failed (Production or Read-only environment):', fsErr.message);
      fileWarning = `로컬 파일 저장이 건너뛰어졌거나 실패하였습니다 (Production/Vercel 환경 등). Firestore 저장은 정상 완료되었습니다. Error: ${fsErr.message}`;
    }

    // 5. Candidate 상태 갱신
    await candidateRef.update({
      handoffStatus: 'sent_to_antigravity',
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({
      success: true,
      taskId: taskRef.id,
      warning: fileWarning
    });
  } catch (err: any) {
    console.error('Handoff route error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
