'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/clientApp';
import { useAuth } from '@/components/providers/AuthProvider';

export default function NativePushProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  // Effect A: Push Action Listener (Registered immediately on native mount regardless of user auth state)
  useEffect(() => {
    let listenerRef: any = null;

    const setupActionListener = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import('@capacitor/push-notifications');

        listenerRef = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            console.log('[NativePush] Notification action performed:', action);
            const data = action.notification?.data || {};
            let targetUrl = data.url || data.targetUrl || data['gcm.notification.url'] || data['google.c.a.c_l'];

            if (!targetUrl && data.roomId) {
              targetUrl = `/chat?roomId=${data.roomId}`;
            }

            // URL Whitelist Validation: must start with single '/'
            if (
              typeof targetUrl === 'string' &&
              targetUrl.startsWith('/') &&
              !targetUrl.startsWith('//')
            ) {
              try {
                sessionStorage.setItem('pendingNativeDeepLink', targetUrl);
              } catch (e) {
                // Storage fail-safe
              }
              router.push(targetUrl);
            }
          }
        );
      } catch (err) {
        console.log('[NativePush] Push action listener setup skipped:', err);
      }
    };

    setupActionListener();

    return () => {
      if (listenerRef && typeof listenerRef.remove === 'function') {
        listenerRef.remove();
      }
    };
  }, [router]);

  // Effect B: Permission / Register / FCM Token Save (Requires authenticated user)
  useEffect(() => {
    if (!user || !user.uid) return;

    let cleanup: (() => void)[] = [];

    const initPush = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const platform = Capacitor.getPlatform();
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        let permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive !== 'granted') {
          return;
        }

        await PushNotifications.register();

        if (platform === 'android') {
          // Android: Capacitor registration 이벤트에서 직접 FCM 토큰을 받을 수 있음
          const listener = await PushNotifications.addListener('registration', async (token) => {
            if (token.value) {
              try {
                await updateDoc(doc(db, 'users', user.uid), {
                  fcmTokens: arrayUnion(token.value)
                });
              } catch (err) {
                console.error('[NativePush] Failed to save Android FCM token', err);
              }
            }
          });
          cleanup.push(() => listener.remove());

        } else if (platform === 'ios') {
          // iOS: Capacitor registration 이벤트는 APNs 토큰을 반환함 (FCM 토큰이 아님)
          // AppDelegate에서 Firebase Messaging이 APNs → FCM 변환 후 localStorage에 주입함
          // 1) localStorage에 이미 저장된 FCM 토큰 확인
          let fcmToken = localStorage.getItem('__ios_fcm_token__');
          
          if (fcmToken) {
            await saveFcmToken(user.uid, fcmToken);
          } else {
            // 2) 아직 없으면 AppDelegate의 CustomEvent를 대기 (최대 15초)
            const tokenPromise = new Promise<string | null>((resolve) => {
              const handler = (e: Event) => {
                const customEvent = e as CustomEvent;
                window.removeEventListener('fcmTokenReady', handler);
                resolve(customEvent.detail?.token || null);
              };
              window.addEventListener('fcmTokenReady', handler);
              cleanup.push(() => window.removeEventListener('fcmTokenReady', handler));
              
              setTimeout(() => {
                window.removeEventListener('fcmTokenReady', handler);
                // 타임아웃 시 한 번 더 localStorage 확인
                resolve(localStorage.getItem('__ios_fcm_token__'));
              }, 15000);
            });

            fcmToken = await tokenPromise;
            if (fcmToken) {
              await saveFcmToken(user.uid, fcmToken);
            }
          }
        }

      } catch (err) {
        // 플러그인 미설치(구 바이너리) → 조용히 무시
        console.log('[NativePush] Plugin not available, skipping');
      }
    };

    initPush();

    return () => {
      cleanup.forEach(fn => fn());
    };
  }, [user]);

  return <>{children}</>;
}

/** Firestore에 FCM 토큰 저장 (중복 방지를 위한 arrayUnion) */
async function saveFcmToken(uid: string, token: string) {
  try {
    await updateDoc(doc(db, 'users', uid), {
      fcmTokens: arrayUnion(token)
    });
    console.log('[NativePush] iOS FCM token saved successfully');
  } catch (err) {
    console.error('[NativePush] Failed to save iOS FCM token', err);
  }
}
