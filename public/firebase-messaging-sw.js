// Firebase Messaging Service Worker with Live Background Push Notification Listener

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// 백그라운드 푸시(Push) 이벤트 가로채서 실시간 배너 알림 팝업 기동
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    console.log('[Service Worker] Push Received:', payload);

    // 구글 FCM 페이로드 구조에서 제목 및 본문 안전하게 추출
    const title = payload.notification?.title || payload.data?.title || 'WoC Today';
    const body = payload.notification?.body || payload.data?.message || payload.data?.body || '새로운 메시지가 도착했습니다.';
    
    // 알림 옵션 및 메타데이터 주입
    const options = {
      body: body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
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
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-192x192.png'
        })
      );
    } catch (textErr) {
      console.error('[Service Worker] Text fallback failed:', textErr);
    }
  }
});

// 사용자가 알림 배너 터치(클릭) 시, 해당 대화방 대화창 탭으로 자동 원스톱 연결
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // 페이로드에 동봉되어 있던 랜딩 타겟 URL 추출
  const actionUrl = event.notification.data?.url || '/chat';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 이미 켜져 있는 WoC 탭이 존재한다면 해당 탭을 포커스 처리
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(actionUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // 켜져 있는 탭이 없을 경우, 즉시 신규 대화창 탭을 생성하여 이동
      if (clients.openWindow) {
        return clients.openWindow(actionUrl);
      }
    })
  );
});
