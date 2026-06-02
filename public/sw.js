const CACHE_VERSION = 'woc-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// PWA 필수 자격 규격: 제미나이 정밀 처방 초경량 안전 fetch 패스스루 (Error & Rejection 방지)
// 최소한의 PWA 자격 유지를 충족하며, 어떠한 런타임 캐싱 개입 없이 안전하게 통과시킵니다.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request).catch(() => new Response("Offline")));
});

// ========================================================
// FCM 백그라운드 실시간 푸시 수신 및 배너 알림 처리 로직
// ========================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const title = payload.notification?.title || payload.data?.title || 'WoC Today';
    const body = payload.notification?.body || payload.data?.message || payload.data?.body || '새로운 메시지가 도착했습니다.';
    
    // tag = roomId → 같은 채팅방 알림은 최신 1개로 자동 교체 (카카오톡 방식)
    const tag = payload.data?.roomId || payload.data?.type || 'woc-default';

    const options = {
      body: body,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      tag: tag,
      renotify: true,
      data: payload.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (err) {
    console.error('[Service Worker] Push event handling failed, falling back to text:', err);
    try {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('WoC Today', {
          body: text,
          icon: '/icon.png',
          badge: '/icon.png',
          tag: 'woc-fallback',
          renotify: true
        })
      );
    } catch (textErr) {
      console.error('[Service Worker] Text fallback failed:', textErr);
    }
  }
});

// 푸시 알림 배너 터치(클릭) 시 타겟 URL로 이동 브릿지
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const actionUrl = event.notification.data?.url || '/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(actionUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});
