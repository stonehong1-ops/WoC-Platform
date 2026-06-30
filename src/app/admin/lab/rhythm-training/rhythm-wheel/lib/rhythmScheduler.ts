import { RhythmPattern } from "../types";

export class RhythmScheduler {
  private audioCtx: AudioContext | null = null;
  private timerId: any = null;
  private nextBeatTime = 0.0; // 다음 정박 비트 시작 시간 (AudioContext.currentTime 기준)
  private currentSubIndex = 0; // 현재 패턴 내에서 재생할 음표 인덱스 (beats 배열 내 인덱스)
  private isPlaying = false;

  // 스케줄러 옵션
  private bpm = 96;
  private volume = 0.8;
  private useAccent = true;
  private isLoop = true;
  private isRandom = false;

  private pattern: RhythmPattern;
  private onTickCallback?: (index: number, time: number, isAccent: boolean) => void;
  private onLoopCompleted?: () => void;

  // lookahead 및 스케줄 윈도우 크기
  private lookahead = 25.0; // 스케줄 타이머 호출 주기 (ms)
  private scheduleAheadTime = 0.1; // 미리 예약해 둘 시간 범위 (초)

  constructor(
    initialPattern: RhythmPattern,
    options?: {
      bpm?: number;
      volume?: number;
      useAccent?: boolean;
      isLoop?: boolean;
      isRandom?: boolean;
    }
  ) {
    this.pattern = initialPattern;
    if (options) {
      if (options.bpm !== undefined) this.bpm = options.bpm;
      if (options.volume !== undefined) this.volume = options.volume;
      if (options.useAccent !== undefined) this.useAccent = options.useAccent;
      if (options.isLoop !== undefined) this.isLoop = options.isLoop;
      if (options.isRandom !== undefined) this.isRandom = options.isRandom;
    }
  }

  // AudioContext 초기화 및 기동
  public async start(
    onTick: (index: number, time: number, isAccent: boolean) => void,
    onLoopCompleted: () => void
  ) {
    if (this.isPlaying) return;

    this.onTickCallback = onTick;
    this.onLoopCompleted = onLoopCompleted;

    // Web Audio API 기동 (유저 인터랙션 아래에서 호출 보장 필요)
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.nextBeatTime = this.audioCtx.currentTime + 0.05;
    this.currentSubIndex = 0;

    // 백그라운드 틱 스케줄링 타이머 구동
    this.timerId = setInterval(() => this.scheduler(), this.lookahead);
  }

  // 멈춤 및 정리
  public stop() {
    if (!this.isPlaying) return;

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.audioCtx) {
      // 리소스 해제 및 기동 정지
      if (this.audioCtx.state !== "closed") {
        this.audioCtx.suspend();
      }
    }

    this.isPlaying = false;
  }

  public destroy() {
    this.stop();
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
  }

  // 실시간 설정 갱신
  public setBpm(newBpm: number) {
    this.bpm = Math.max(60, Math.min(180, newBpm));
  }

  public setVolume(newVolume: number) {
    this.volume = Math.max(0, Math.min(1, newVolume));
  }

  public setAccent(useAccent: boolean) {
    this.useAccent = useAccent;
  }

  public setLoop(isLoop: boolean) {
    this.isLoop = isLoop;
  }

  public setRandom(isRandom: boolean) {
    this.isRandom = isRandom;
  }

  public setPattern(newPattern: RhythmPattern) {
    this.pattern = newPattern;
    // 패턴이 바뀌면 현재 subdivision 인덱스를 초기화함
    this.currentSubIndex = 0;
  }

  // 스케줄러 핵심 메커니즘
  private scheduler() {
    if (!this.audioCtx) return;

    // 다음 예약할 대상 시간이 현재 시각 + 앞서 내다볼 윈도우 시간 이내에 있으면 예약을 처리함
    while (this.nextBeatTime < this.audioCtx.currentTime + this.scheduleAheadTime) {
      // 1. 현재 서브비트 재생 예약
      this.scheduleTone(this.currentSubIndex, this.nextBeatTime);
      this.advanceBeat();
    }
  }

  // 다음 예약 타이밍으로 변수 이동
  private advanceBeat() {
    const beatDuration = 60.0 / this.bpm; // 1박자(beat) 지속시간 (초)
    const beatsArray = this.pattern.beats;
    
    this.currentSubIndex++;

    if (this.currentSubIndex >= beatsArray.length) {
      // 한 패턴(1박자) 루프가 끝났을 때
      this.currentSubIndex = 0;
      this.nextBeatTime += beatDuration; // 다음 비트로 시간 이동

      // 루프 완료 콜백 트리거 (무작위 선택 등에 활용)
      if (this.onLoopCompleted) {
        this.onLoopCompleted();
      }
    }
  }

  // Audio 노드 스케줄링 및 비프음 연주
  private scheduleTone(subIndex: number, beatStartTime: number) {
    if (!this.audioCtx) return;

    const beatsArray = this.pattern.beats;
    const beatDuration = 60.0 / this.bpm;
    const subOffset = beatsArray[subIndex]; // 예: 0, 0.25, 0.5, 0.75
    
    // 이 서브비트의 실제 오디오 재생 시간 산출
    const toneTime = beatStartTime + subOffset * beatDuration;

    // 강세 판별 (기본적으로 beats 인덱스 0번이 강세이며, accents 배열에 정의된 인덱스 포함)
    const isAccent = this.useAccent && (this.pattern.accents?.includes(subIndex) || subIndex === 0);

    // OscillatorNode와 GainNode 생성
    const osc = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    // 톤 피치: 강세는 높은음, 약세는 낮은음
    osc.frequency.setValueAtTime(isAccent ? 1200 : 800, toneTime);
    osc.type = "sine";

    // 볼륨 엔벨로프 설정 (틱 소리의 타닥거림 클릭 노이즈 방지)
    const startVolume = isAccent ? this.volume * 1.0 : this.volume * 0.5;
    const duration = isAccent ? 0.08 : 0.04; // 강세는 약간 더 길게

    gainNode.gain.setValueAtTime(0, toneTime);
    gainNode.gain.linearRampToValueAtTime(startVolume, toneTime + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.001, toneTime + duration);

    // 구동 및 정지 예약
    osc.start(toneTime);
    osc.stop(toneTime + duration + 0.01);

    // UI 애니메이션 동기화를 위한 콜백 트리거
    const timeDelta = toneTime - this.audioCtx.currentTime;
    setTimeout(() => {
      if (this.isPlaying && this.onTickCallback) {
        this.onTickCallback(subIndex, toneTime, isAccent);
      }
    }, Math.max(0, timeDelta * 1000));
  }
}
