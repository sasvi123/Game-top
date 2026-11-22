// Sound Engine using Web Audio API (Zero external dependencies)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.muted = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioCtx();
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.8;
    this.masterGain.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.masterGain);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.35;
    this.bgmGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : 0.8;
    }
    return this.muted;
  }

  // Soft footstep sound on grass
  playStep() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250 + Math.random() * 50, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Jump swoosh
  playJump() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.22);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  // Land impact
  playLand() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.12);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Spring Mushroom Bounce "Boing!"
  playBounce() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const mod = this.ctx.createOscillator();
    const modGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.35);

    // Vibrato / Spring wiggle
    mod.type = 'sine';
    mod.frequency.setValueAtTime(18, now);
    modGain.gain.setValueAtTime(70, now);
    modGain.gain.exponentialRampToValueAtTime(5, now + 0.35);

    mod.connect(modGain);
    modGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    mod.start(now);
    osc.start(now);
    mod.stop(now + 0.38);
    osc.stop(now + 0.38);
  }

  // Speed Boost Ring Whoosh
  playSpeedBoost() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.3);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Cake Slice Pickup Chime (magical harp / bell arpeggio)
  playPickupCake(sliceIndex = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    // Pentatonic scale arpeggios that vary with slice index
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
    const baseOffset = (sliceIndex % 3);
    const notes = [
      scale[baseOffset],
      scale[baseOffset + 2],
      scale[baseOffset + 4],
      scale[baseOffset + 5] || 1318.51
    ];

    notes.forEach((freq, idx) => {
      const noteTime = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.35, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.65);
    });
  }

  // Respawn chime
  playRespawn() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    [329.63, 440.0, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      gain.gain.setValueAtTime(0.25, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.4);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.4);
    });
  }

  // Grand Victory Fanfare
  playVictory() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const fanfareNotes = [
      { f: 523.25, t: 0.00, d: 0.2 }, // C5
      { f: 523.25, t: 0.22, d: 0.2 }, // C5
      { f: 523.25, t: 0.44, d: 0.2 }, // C5
      { f: 659.25, t: 0.66, d: 0.4 }, // E5
      { f: 783.99, t: 1.08, d: 0.3 }, // G5
      { f: 1046.50, t: 1.40, d: 1.2 }  // High C6
    ];

    fanfareNotes.forEach(({ f, t, d }) => {
      const startTime = now + t;
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, startTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(f * 2, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + d);

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(startTime);
      osc2.start(startTime);
      osc.stop(startTime + d);
      osc2.stop(startTime + d);
    });
  }

  // Cozy Background Meadow Music (synthesized pentatonic acoustic vibes)
  startBGM() {
    if (!this.ctx || this.bgmPlaying) return;
    this.bgmPlaying = true;

    const chords = [
      [261.63, 329.63, 392.00], // C major
      [220.00, 261.63, 329.63], // A minor
      [174.61, 220.00, 261.63], // F major
      [196.00, 246.94, 293.66]  // G major
    ];

    const melodyNotes = [
      523.25, 587.33, 659.25, 783.99, 880.00, 1046.50
    ];

    let chordStep = 0;
    const playChordBar = () => {
      if (!this.bgmPlaying || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = chords[chordStep % chords.length];
      chordStep++;

      // Soft pad chords
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.connect(gain);
        gain.connect(this.bgmGain);

        osc.start(now);
        osc.stop(now + 3.9);
      });

      // Cheerful marimba-like melody notes scattered within the 4-second bar
      const melodyCount = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < melodyCount; i++) {
        const noteTime = now + (i * 0.75) + Math.random() * 0.2;
        const noteFreq = melodyNotes[Math.floor(Math.random() * melodyNotes.length)];

        const mOsc = this.ctx.createOscillator();
        const mGain = this.ctx.createGain();
        mOsc.type = 'triangle';
        mOsc.frequency.setValueAtTime(noteFreq, noteTime);

        mGain.gain.setValueAtTime(0, noteTime);
        mGain.gain.linearRampToValueAtTime(0.12, noteTime + 0.02);
        mGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        mOsc.connect(mGain);
        mGain.connect(this.bgmGain);

        mOsc.start(noteTime);
        mOsc.stop(noteTime + 0.5);
      }

      this.bgmTimer = setTimeout(playChordBar, 3800);
    };

    playChordBar();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

export const sound = new SoundEngine();
