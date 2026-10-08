/* ===== procedural sound effects (Web Audio), started on the first click ===== */
const Sound = {
  ctx: null, master: null, muted: false, amb: null,
  init() {
    if (this.ctx) return;
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.7; this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    let last = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown noise
    this.noise = buf;
  },
  setMuted(m) { this.muted = m; if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.7, this.ctx.currentTime, 0.05); },
  env(g, t, a, peak, dec) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + dec); },
  tone(freq, dur, type = 'sine', vol = 0.2, slideTo) {
    if (!this.ctx) return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    this.env(g, t, 0.01, vol, dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.05);
  },
  burst(dur, cutoff, vol = 0.3, q = 1) {
    if (!this.ctx) return; const t = this.ctx.currentTime, s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; f.type = 'lowpass'; f.frequency.value = cutoff; f.Q.value = q; this.env(g, t, 0.01, vol, dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t, Math.random()); s.stop(t + dur + 0.1);
  },
  click() { this.tone(660, 0.06, 'triangle', 0.08); },
  munch() { for (let i = 0; i < 3; i++) setTimeout(() => this.burst(0.07, 1400, 0.25, 3), i * 90); },
  chomp() { this.burst(0.25, 500, 0.5); this.tone(180, 0.3, 'sawtooth', 0.15, 60); },
  roar() {
    if (!this.ctx) return; const t = this.ctx.currentTime, o = this.ctx.createOscillator(), lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t); o.frequency.linearRampToValueAtTime(70, t + 1.1);
    lfo.frequency.value = 23; lg.gain.value = 18; lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.linearRampToValueAtTime(300, t + 1.1);
    this.env(g, t, 0.12, 0.35, 1.1); o.connect(f); f.connect(g); g.connect(this.master); o.start(t); lfo.start(t); o.stop(t + 1.3); lfo.stop(t + 1.3);
    this.burst(1.1, 600, 0.25);
  },
  step(big) { this.burst(0.12, big ? 160 : 260, big ? 0.35 : 0.15); },
  whoosh() { this.burst(0.5, 900, 0.18); },
  win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.35, 'triangle', 0.18), i * 140)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'sine', 0.18), i * 180)); },
  ambient(kind) {
    if (!this.ctx) return; if (this.amb) { try { this.amb.src.stop(); } catch (e) {} this.amb = null; }
    if (!kind) return;
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; s.loop = true; f.type = 'lowpass'; f.frequency.value = kind === 'volcano' ? 220 : kind === 'swamp' ? 500 : 350;
    g.gain.value = kind === 'museum' ? 0.02 : 0.07; s.connect(f); f.connect(g); g.connect(this.master); s.start(); this.amb = { src: s };
  },
};
