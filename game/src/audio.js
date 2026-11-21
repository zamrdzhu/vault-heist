// Sound, synthesized live with the Web Audio API — no audio files, no network. Short
// oscillator bleeps: a soft tick for footsteps is skipped (it would get old), but pickups,
// alerts, the jammer, a caught thief and the getaway each get their own little phrase.
// Everything is guarded: with no user gesture yet the context stays suspended and silent,
// and a browser without audio just never hears it.

export function createAudio() {
  return { ctx: null, master: null, alarmOsc: null };
}

/** Create the context on the first user gesture; safe to call more than once. */
export function ensureAudio(audio) {
  if (audio.ctx) {
    if (audio.ctx.state === 'suspended') audio.ctx.resume().catch(() => {});
    return;
  }
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audio.ctx = new Ctx();
    audio.master = audio.ctx.createGain();
    audio.master.gain.value = 0.16;
    audio.master.connect(audio.ctx.destination);
  } catch {
    audio.ctx = null;
  }
}

function tone(audio, freq, duration, type, volume, when = 0, slideTo = null) {
  if (!audio.ctx || !audio.master) return;
  try {
    const t0 = audio.ctx.currentTime + when;
    const osc = audio.ctx.createOscillator();
    const gain = audio.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + duration);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  } catch {
    // A failed blip is never worth breaking the game over.
  }
}

/** Two-note chime when a loot piece is lifted. */
export function playPickup(audio, big) {
  tone(audio, big ? 880 : 660, 0.12, 'sine', 0.5);
  tone(audio, big ? 1318 : 990, 0.18, 'sine', 0.5, 0.09);
}

/** A rising two-tone warning the first time a guard or camera spots the thief. */
export function playSpotted(audio) {
  tone(audio, 440, 0.14, 'square', 0.22);
  tone(audio, 587, 0.2, 'square', 0.22, 0.12);
}

/** A soft click when a noise coin is thrown. */
export function playCoin(audio) {
  tone(audio, 1568, 0.07, 'triangle', 0.4);
  tone(audio, 1175, 0.1, 'triangle', 0.3, 0.07);
}

/** A low hum when the jammer fires. */
export function playJam(audio) {
  tone(audio, 220, 0.35, 'sawtooth', 0.16, 0, 110);
}

/** A descending buzz for being caught. */
export function playCaught(audio) {
  tone(audio, 330, 0.5, 'sawtooth', 0.3, 0, 82);
}

/** A little major arpeggio for the getaway. */
export function playWin(audio) {
  const notes = [523, 659, 784, 1047];
  for (let i = 0; i < notes.length; i += 1) tone(audio, notes[i], 0.22, 'sine', 0.45, i * 0.11);
}

/** A door thunk when a room's exit opens. */
export function playDoor(audio) {
  tone(audio, 180, 0.16, 'triangle', 0.4, 0, 90);
}
