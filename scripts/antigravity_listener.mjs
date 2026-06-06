import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

console.log('⚡ [Antigravity Daemon] Firebase Admin 권한으로 리스너 초기화 중...');

try {
  // 1. Load Local Service Account Key for Full Privileged Access
  const serviceAccountPath = path.resolve(process.cwd(), 'woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json');
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`서비스 계정 키 파일을 찾을 수 없습니다: ${serviceAccountPath}`);
  }
  
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

  // Initialize Firebase Admin (Avoid duplicate init)
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();
  console.log('✅ [Antigravity Daemon] Firebase Admin 인증 성공! 리스너 작동 시작...');
  console.log(`🌐 프로젝트 ID: ${serviceAccount.project_id}`);

  // 2. Real-time Listen on 'antigravity_terminal' with Admin privileges
  const query = db.collection('antigravity_terminal')
    .where('status', '==', 'pending')
    .where('sender', '==', 'stone');

  const unsubscribe = query.onSnapshot((snapshot) => {
    snapshot.docChanges().forEach(async (change) => {
      if (change.type === 'added') {
        const docData = change.doc.data();
        const docId = change.doc.id;
        const message = docData.message;
        const imageUrl = docData.imageUrl;

        console.log(`\n📬 [새 지시 감지] ID: ${docId}`);
        console.log(`💬 요구사항: "${message}"`);
        if (imageUrl) {
          console.log(`🖼️ 첨부 이미지: ${imageUrl}`);
        }

        // A. 승인 여부 판독 및 보안 락 해제 토큰 주입
        const normalizedMsg = (message || '').trim().toLowerCase();
        
        const englishTerms = ['y', 'yes', 'go'];
        const hasEnglishApproval = englishTerms.some(term => {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          return regex.test(normalizedMsg);
        });

        const koreanTerms = ['승인', '승인합니다', '진행', '진행해'];
        const hasKoreanApproval = koreanTerms.some(term => normalizedMsg.includes(term)) || 
                                  /(?:^|\s)고(?:\s|$)/.test(normalizedMsg);

        const isApproval = hasEnglishApproval || hasKoreanApproval;

        if (isApproval) {
          try {
            const gateDir = path.join(process.cwd(), '.safe_gate');
            if (!fs.existsSync(gateDir)) {
              fs.mkdirSync(gateDir, { recursive: true });
            }
            const tokenPath = path.join(gateDir, 'approve.token');
            fs.writeFileSync(tokenPath, 'approved', 'utf-8');
            console.log(`🔑 [모바일 승인] 보안 락 토큰 생성 완료: ${tokenPath}`);

            const docRef = db.collection('antigravity_terminal').doc(docId);
            await docRef.update({ 
              status: 'completed',
              agentResponse: '⚡ [모바일 승인 확인] 보안 락이 일시적으로 완전 해제되었습니다! 대기 중인 모든 에이전트 작업 및 빌드 배포 처리가 논스톱 가동됩니다.'
            });
            console.log(`⚡ [상태 갱신] 문서 ${docId} -> '완료(completed)' 전환 및 피드백 전송 완료!`);
          } catch (lockErr) {
            console.error('❌ 모바일 승인 토큰 생성 실패:', lockErr);
          }
        } else {
          try {
            const docRef = db.collection('antigravity_terminal').doc(docId);
            await docRef.update({ status: 'in_progress' });
            console.log(`⚡ [상태 갱신] 문서 ${docId} -> '작업 중(in_progress)' 전환 완료!`);
          } catch (err) {
            console.error('❌ 상태 갱신 실패:', err);
          }
        }

        // B. 로컬 public/antigravity.txt 백업 기록
        try {
          const publicPath = path.join(process.cwd(), 'public', 'antigravity.txt');
          let fileContent = `스톤님의 실시간 지시사항:\n${message}\n`;
          if (imageUrl) {
            fileContent += `첨부 이미지: ${imageUrl}\n`;
          }
          fileContent += `\n전송 일시: ${new Date().toISOString()}\n`;
          fs.writeFileSync(publicPath, fileContent, 'utf-8');
          console.log(`💾 [파일 백업] public/antigravity.txt 기록 완료!`);
        } catch (fsErr) {
          console.warn('⚠️ 파일 시스템 백업 건너뜀:', fsErr.message);
        }
      }
    });
  }, (error) => {
    console.error('❌ Firestore Admin 리스너 에러:', error);
  });

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n🛑 데몬을 안전하게 종료합니다.');
    unsubscribe();
    process.exit(0);
  });

} catch (globalErr) {
  console.error('❌ 데몬 구동 중 치명적 오류 발생:', globalErr);
  process.exit(1);
}
