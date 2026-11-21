// A tiny deterministic random source (mulberry32) so a seed always replays the same room:
// sparkle positions, dust motes and the small jitter in a guard's pause all come from here
// and nowhere else.

export function createRandom(seed) {
  let a = seed >>> 0;
  return {
    /** Next float in [0, 1). */
    next() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Next float in [min, max). */
    range(min, max) {
      return min + this.next() * (max - min);
    },
    /** Next integer in [min, max]. */
    int(min, max) {
      return Math.floor(this.range(min, max + 1));
    },
  };
}
