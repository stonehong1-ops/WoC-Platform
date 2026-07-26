// WoC Platform Video Sound Manager & Lifecycle Guard (Foreground Resume Support)
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

type MuteCallback = () => void;

interface VideoItem {
  videoEl: HTMLVideoElement;
  containerEl: HTMLElement;
  onMute: MuteCallback;
}

class VideoSoundManager {
  private activeId: string | null = null;
  private registeredVideos: Map<string, VideoItem> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      // Capacitor Native와 일반 Web 분리 (중복 이벤트 리스너 차단)
      if (Capacitor.isNativePlatform()) {
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            this.handleForegroundResume();
          } else {
            this.handleBackgroundPause();
          }
        });
      } else if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.handleBackgroundPause();
          } else {
            this.handleForegroundResume();
          }
        });
      }
    }
  }

  /**
   * 카드 비디오 등록 (Foreground Resume 지원)
   */
  registerVideo(id: string, videoEl: HTMLVideoElement, containerEl: HTMLElement, onMute: MuteCallback) {
    this.registeredVideos.set(id, { videoEl, containerEl, onMute });
  }

  /**
   * 카드 비디오 등록 해제
   */
  unregisterVideo(id: string) {
    this.registeredVideos.delete(id);
    if (this.activeId === id) {
      this.activeId = null;
    }
  }

  /**
   * 새로운 비디오의 사운드를 켭니다. 기존 사운드가 켜져있던 비디오는 즉시 Mute 처리됩니다.
   */
  setActiveAudible(id: string, onMute: MuteCallback) {
    if (this.activeId && this.activeId !== id) {
      const prevMute = this.registeredVideos.get(this.activeId)?.onMute;
      if (prevMute) {
        try {
          prevMute();
        } catch (e) {
          console.warn('Failed to mute previous video:', e);
        }
      }
    }
    this.activeId = id;
  }

  /**
   * 해당 비디오의 Mute 상태 전환을 등록 해제합니다.
   */
  releaseAudible(id: string) {
    if (this.activeId === id) {
      this.activeId = null;
    }
  }

  /**
   * 백그라운드 이탈 시 모든 가청 상태를 해제하고 비디오를 정지시킵니다.
   */
  private handleBackgroundPause() {
    this.registeredVideos.forEach(({ onMute, videoEl }) => {
      try {
        onMute();
        videoEl.pause();
      } catch (e) {
        /* ignore */
      }
    });
    this.activeId = null;

    if (typeof document !== 'undefined') {
      const videos = document.querySelectorAll('video');
      videos.forEach((v) => {
        try {
          v.pause();
        } catch (e) {
          /* ignore */
        }
      });
    }
  }

  /**
   * Foreground 복귀 시 현재 viewport에 노출된 autoplay 대상 비디오만 muted 재생 시도 (스마트 재가동)
   */
  private handleForegroundResume() {
    this.activeId = null; // 이전 Unmute 상태는 자동 복원하지 않음 (muted 유지)
    const vh = window.innerHeight || document.documentElement.clientHeight;

    this.registeredVideos.forEach(({ videoEl, containerEl, onMute }) => {
      onMute(); // 소리는 muted 상태로 강제
      videoEl.muted = true;

      const rect = containerEl.getBoundingClientRect();
      const isVisible = rect.top < vh && rect.bottom > 0 && rect.height > 0;

      if (isVisible) {
        videoEl.play().catch(() => {});
      } else {
        videoEl.pause();
      }
    });
  }
}

export const videoSoundManager = new VideoSoundManager();
