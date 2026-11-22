class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'sine',
    gainLevel = 0.14,
    delay = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {
      // Ignore Web Audio errors cleanly
    }
  }

  public click() {
    this.playTone(540, 0.06, 'triangle', 0.08);
  }

  public flip() {
    this.playTone(440, 0.08, 'sine', 0.1);
    this.playTone(620, 0.09, 'sine', 0.09, 0.05);
  }

  public correct() {
    this.playTone(523.25, 0.14, 'triangle', 0.15, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.15, 0.09);
    this.playTone(783.99, 0.24, 'triangle', 0.16, 0.18);
  }

  public wrong() {
    this.playTone(260, 0.18, 'sawtooth', 0.09, 0);
    this.playTone(210, 0.28, 'sawtooth', 0.09, 0.14);
  }

  public tick() {
    this.playTone(880, 0.04, 'sine', 0.05);
  }

  public victory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, 0.26, 'triangle', 0.16, idx * 0.11);
    });
  }
}

export const soundFX = new SoundEngine();
