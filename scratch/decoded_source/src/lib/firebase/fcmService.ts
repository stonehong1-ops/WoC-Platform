import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from './clientApp';
import app from './clientApp';

export const fcmService = {
  // 알림 권한 요청 및 FCM 토큰 발급
  requestPermissionAndGetToken: async (userId: string): Promise<string | null> => {
    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        return null;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('푸시 알림 권한이 거부되었습니다.');
        return null;
      }

      const messaging = getMessaging(app);
      
      // VAPID KEY는 환경변수로 관리합니다
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!vapidKey) {
        console.warn('VAPID Key가 설정되지 않아 푸시 토큰을 발급할 수 없습니다.');
        return null;
      }

      // 서비스 워커 명시적 등록 (Next.js 환경에서 필수적일 수 있음)
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      await navigator.serviceWorker.ready;

      const token = await getToken(messaging, {
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });

      if (token) {
        // 성공적으로 토큰을 발급받으면 Firestore 사용자 문서에 업데이트
        await fcmService.saveTokenToUser(userId, token);
        return token;
      } else {
        console.log('FCM 토큰을 가져오지 못했습니다.');
        return null;
      }
    } catch (error) {
      console.error('FCM 토큰 발급 중 오류:', error);
      // alert(`FCM 토큰 발급 실패: ${error}`); // 디버깅용
      return null;
    }
  },

  // 발급된 토큰을 Firestore user 문서에 저장
  saveTokenToUser: async (userId: string, token: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      // fcmTokens 배열에 추가 (중복 방지)
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token)
      });
    } catch (error) {
      console.error('FCM 토큰 저장 중 오류:', error);
    }
  },

  // 포그라운드 메시지 수신 리스너 설정
  onMessageListener: (callback: (payload: any) => void) => {
    if (typeof window === 'undefined') return () => {};
    try {
      const messaging = getMessaging(app);
      return onMessage(messaging, (payload) => {
        callback(payload);
      });
    } catch (error) {
      console.error('onMessageListener error:', error);
      return () => {};
    }
  }
};
