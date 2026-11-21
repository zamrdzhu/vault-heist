// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area; the renderer scales it to the window, so no rule below depends on the screen size.
// "Vault Heist" is an original top-down stealth game: cross each room, dodge the sweeping
// vision cones, grab the loot, and slip out the exit before the alarm meter fills.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  speed: 205,
  sneakSpeed: 115,
  /** A sneaking thief is harder to spot: guards and cameras see this much less far. */
  sneakVisionFactor: 0.62,
  /** How close the thief must be to pick a loot item up. */
  pickupRadius: 34,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 68,
  investigateSpeed: 118,
  /** How far a guard can see, in pixels, and how wide the cone is (half-angle, radians). */
  visionRange: 235,
  visionHalfAngle: 0.62,
  /** Seconds of being watched before a guard leaves patrol to investigate. */
  suspicionTime: 0.55,
  /** Seconds a guard stares at the last seen spot before giving up and returning. */
  stareTime: 1.6,
  /** Touching a guard is an instant catch, so the radius is kept a little forgiving. */
  catchRadius: 26,
};

export const CAMERA = {
  visionRange: 265,
  visionHalfAngle: 0.5,
  /** Degrees per second the camera sweeps through its arc. */
  sweepSpeed: 0.55,
};

export const ALARM = {
  /** Per second, while a guard has the thief in its cone. */
  guardRate: 46,
  /** Per second, while a camera has the thief in its cone. */
  cameraRate: 34,
  /** Per second, while nobody can see the thief. */
  decayRate: 15,
  max: 100,
};

export const TOOLS = {
  /** Noise coins per room: throw one to pull nearby guards to where it lands. */
  coinsPerRoom: 3,
  coinDistractRadius: 280,
  coinDistractTime: 3.2,
  coinThrowDistance: 150,
  /** Jammer charges per room: each freezes every camera for this long. */
  jammersPerRoom: 2,
  jamDuration: 5,
};

export const SCORE = {
  lootPoint: 1,
  timeBonusPerSecond: 5,
};

/** localStorage key for the best score. */
export const BEST_KEY = 'vault-heist-best';

export const COLORS = {
  floor: '#1c1a26',
  floorAlt: '#201d2c',
  wall: '#3a3550',
  wallTop: '#4a4468',
  cover: '#2c2f45',
  coverTop: '#3d4160',
  carpet: '#33232e',
  guard: '#e8b13c',
  guardCone: 'rgba(232, 177, 60, 0.20)',
  guardConeAlert: 'rgba(232, 80, 60, 0.30)',
  camera: '#7fd4ff',
  cameraCone: 'rgba(127, 212, 255, 0.16)',
  player: '#7ee787',
  playerSneak: '#4cc38a',
  loot: '#ffd94d',
  diamond: '#9be8ff',
  exit: '#7ee787',
  alarm: '#ff5d5d',
  text: '#f2ead8',
  dim: '#9a94b0',
};
