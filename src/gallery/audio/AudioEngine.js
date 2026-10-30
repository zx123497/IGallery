/* eslint-disable require-jsdoc */
// Everything audible in the gallery is synthesized with the Web Audio API, so the
// project ships no audio files. The context can only start after a user gesture,
// which is why the gallery opens with an "enter" button.

// Slow, open chords (MIDI note numbers): Cmaj9, Am9, Fmaj7#11, Gsus
const CHORDS = [
  [48, 55, 64, 71, 74],
  [45, 52, 60, 67, 71],
  [41, 48, 57, 64, 71],
  [43, 50, 57, 62, 69],
];
// Notes for the sparse glassy melody, a C major pentatonic.
const MELODY = [72, 74, 76, 79, 81, 84, 86, 88];
const CHORD_SECONDS = 9;

const midiToHz = (note) => 440 * Math.pow(2, (note - 69) / 12);

class AudioEngine {
  constructor() {
    this.context = null;
    this.musicOn = true;
    this.volume = 0.6;
    this.rainOn = false;
    this.timers = [];
  }

  // Must be called from a user gesture handler.
  start() {
    if (this.context) {
      this.context.resume();
      return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    this.context = context;

    this.master = context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(context.destination);

    this.reverb = context.createConvolver();
    this.reverb.buffer = this.impulseResponse(3.2);
    const reverbReturn = context.createGain();
    reverbReturn.gain.value = 0.55;
    this.reverb.connect(reverbReturn).connect(this.master);

    this.music = context.createGain();
    this.music.gain.value = 0;
    this.music.connect(this.master);
    this.music.connect(this.reverb);

    this.sfx = context.createGain();
    this.sfx.gain.value = 0.9;
    this.sfx.connect(this.master);

    this.noise = this.noiseBuffer(2);
    this.startRain();
    this.scheduleChords();
    this.scheduleMelody();
    this.setMusicOn(this.musicOn, 4);

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) context.suspend();
      else context.resume();
    });
  }

  impulseResponse(seconds) {
    const {sampleRate} = this.context;
    const length = Math.floor(sampleRate * seconds);
    const buffer = this.context.createBuffer(2, length, sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.6);
    }
    return buffer;
  }

  noiseBuffer(seconds) {
    const {sampleRate} = this.context;
    const buffer = this.context.createBuffer(1, sampleRate * seconds, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  scheduleChords() {
    let index = 0;
    const playNext = () => {
      this.playChord(CHORDS[index % CHORDS.length]);
      index++;
      this.timers.push(setTimeout(playNext, CHORD_SECONDS * 1000));
    };
    playNext();
  }

  playChord(notes) {
    const context = this.context;
    const now = context.currentTime;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.3;
    const lfo = context.createOscillator();
    const lfoDepth = context.createGain();
    lfo.frequency.value = 0.07;
    lfoDepth.gain.value = 350;
    lfo.connect(lfoDepth).connect(filter.frequency);
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(0.055, now + 3);
    envelope.gain.setValueAtTime(0.055, now + CHORD_SECONDS - 1);
    envelope.gain.linearRampToValueAtTime(0, now + CHORD_SECONDS + 3);
    filter.connect(envelope).connect(this.music);

    const end = now + CHORD_SECONDS + 3.2;
    notes.forEach((note) => {
      [-6, 6].forEach((detune) => {
        const oscillator = context.createOscillator();
        oscillator.type = note < 52 ? "sine" : "triangle";
        oscillator.frequency.value = midiToHz(note);
        oscillator.detune.value = detune;
        oscillator.connect(filter);
        oscillator.start(now);
        oscillator.stop(end);
      });
    });
    lfo.start(now);
    lfo.stop(end);
  }

  scheduleMelody() {
    const playNext = () => {
      if (Math.random() < 0.75) this.bell(MELODY[Math.floor(Math.random() * MELODY.length)], 0.035, this.music);
      this.timers.push(setTimeout(playNext, 1400 + Math.random() * 3200));
    };
    this.timers.push(setTimeout(playNext, 3000));
  }

  bell(note, level, destination = this.sfx) {
    const context = this.context;
    const now = context.currentTime;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(level, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 2.6);
    envelope.connect(destination);
    envelope.connect(this.reverb);
    // a bell is a fundamental plus a few inharmonic partials
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(([ratio, gain]) => {
      const oscillator = context.createOscillator();
      const partial = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = midiToHz(note) * ratio;
      partial.gain.value = gain;
      oscillator.connect(partial).connect(envelope);
      oscillator.start(now);
      oscillator.stop(now + 2.7);
    });
  }

  noiseBurst({duration, frequency, q = 1, level, type = "bandpass", sweepTo, destination = this.sfx}) {
    if (!this.context) return;
    const context = this.context;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    source.playbackRate.value = 0.8 + Math.random() * 0.4;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, now);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(sweepTo, now + duration);
    filter.Q.value = q;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(level, now + Math.min(0.01, duration / 4));
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(envelope).connect(destination);
    source.start(now, Math.random() * 1.5);
    source.stop(now + duration + 0.05);
  }

  startRain() {
    const context = this.context;
    const source = context.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 2400;
    filter.Q.value = 0.4;
    this.rainGain = context.createGain();
    this.rainGain.gain.value = 0;
    source.connect(filter).connect(this.rainGain).connect(this.master);
    source.start();
  }

  setRain(on) {
    this.rainOn = on;
    if (!this.context) return;
    this.rainGain.gain.setTargetAtTime(on ? 0.12 : 0, this.context.currentTime, 1.2);
  }

  setMusicOn(on, fadeSeconds = 1.5) {
    this.musicOn = on;
    if (!this.context) return;
    const now = this.context.currentTime;
    this.music.gain.cancelScheduledValues(now);
    this.music.gain.setValueAtTime(this.music.gain.value, now);
    this.music.gain.linearRampToValueAtTime(on ? 1 : 0, now + fadeSeconds);
  }

  setVolume(volume) {
    this.volume = volume;
    if (this.context) this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.1);
  }

  footstep() {
    this.noiseBurst({duration: 0.09, frequency: 700 + Math.random() * 300, q: 1.2, level: 0.18, type: "lowpass"});
  }

  chime() {
    if (this.context) this.bell(84, 0.06);
  }

  whoosh() {
    this.noiseBurst({duration: 1.4, frequency: 180, sweepTo: 3200, q: 2, level: 0.35});
    if (this.context) setTimeout(() => this.bell(79, 0.05), 500);
  }

  shutter() {
    this.noiseBurst({duration: 0.05, frequency: 3000, q: 0.8, level: 0.4, type: "highpass"});
    setTimeout(() => this.noiseBurst({duration: 0.07, frequency: 1800, q: 0.8, level: 0.3, type: "highpass"}), 90);
  }

  bounce(strength) {
    this.noiseBurst({duration: 0.12, frequency: 160 + strength * 120, q: 3, level: Math.min(0.35, strength * 0.12), type: "lowpass"});
  }

  click() {
    this.noiseBurst({duration: 0.03, frequency: 2500, q: 3, level: 0.12});
  }
}

const audio = new AudioEngine();
export default audio;
