'use client';

import { useEffect } from 'react';

export default function SWUnregister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 이미 1회 청소를 완전 성공으로 종료한 경우 중복 실행 방지
    const CLEANUP_KEY = 'woc_pwa_cleaned_v1';
    if (localStorage.getItem(CLEANUP_KEY)) return;

    const runCleanup = async () => {
      const tasks: Promise<any>[] = [];

      // 1단계: 기존 PWA Service Worker 등록 해제 (Unregister)
      if ('serviceWorker' in navigator) {
        const swTask = navigator.serviceWorker.getRegistrations().then(async (registrations) => {
          const unregPromises = registrations.map((reg) =>
            reg.unregister().then((success) => {
              if (success) console.log('[SW Cleanup] Service Worker unregistered.');
            }).catch((err) => {
              console.error('[SW Cleanup] Unregister error:', err);
              throw err;
            })
          );
          await Promise.all(unregPromises);
        }).catch((err) => {
          console.error('[SW Cleanup] Get registrations error:', err);
          throw err;
        });
        tasks.push(swTask);
      }

      // 2단계: Tango World PWA 전용 캐시 키 선별 삭제 (startsWith 정밀 대조)
      if ('caches' in window) {
        const cacheTask = caches.keys().then(async (cacheNames) => {
          const TARGET_PREFIXES = ['woc-v1', 'woc-pwa', 'workbox-', 'woc-static', 'woc-runtime'];
          const deletePromises = cacheNames
            .filter((name) => {
              const lower = name.toLowerCase();
              return TARGET_PREFIXES.some((prefix) => lower.startsWith(prefix));
            })
            .map((name) =>
              caches.delete(name).then((deleted) => {
                if (deleted) console.log(`[Cache Cleanup] Targeted PWA cache '${name}' deleted.`);
              }).catch((err) => {
                console.error(`[Cache Cleanup] Delete error for '${name}':`, err);
                throw err;
              })
            );
          await Promise.all(deletePromises);
        }).catch((err) => {
          console.error('[Cache Cleanup] List caches error:', err);
          throw err;
        });
        tasks.push(cacheTask);
      }

      // 모든 비동기 작업 결과 정밀 검증: 100% 성공(rejected === 0개)일 때만 완료 마킹
      try {
        const results = await Promise.allSettled(tasks);
        const hasFailure = results.some((r) => r.status === 'rejected');

        if (!hasFailure) {
          localStorage.setItem(CLEANUP_KEY, 'done');
          console.log('[SW Cleanup] All PWA cleanup tasks succeeded & marked done.');
        } else {
          console.warn('[SW Cleanup] Some cleanup tasks failed. Will retry on next session.');
        }
      } catch (e) {
        console.error('[SW Cleanup] Cleanup execution error:', e);
      }
    };

    runCleanup();
  }, []);

  return null;
}
