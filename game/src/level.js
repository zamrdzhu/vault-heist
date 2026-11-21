// The three rooms of the Meridian Gallery job, each one a small stealth puzzle with more
// than one way through: cover and walls split every room into lanes, and the loot is never
// on the patrol line. Coordinates live in the 1280x720 field; the HUD bar sits above y=84,
// so no room geometry starts above y=92.
//
// Each room: name, subtitle, the thief's start, the exit door (locked until the room's main
// loot is taken), walls and cover (both block movement and sight), loot items, guard patrols
// and camera mounts.
import { FIELD } from './config.js';

const WALL = 16;

/** The four border walls that fence every room in. */
function borderWalls() {
  return [
    { x: 8, y: 84, w: FIELD.width - 16, h: WALL },
    { x: 8, y: FIELD.height - 12, w: FIELD.width - 16, h: WALL - 4 },
    { x: 8, y: 84, w: WALL, h: FIELD.height - 96 },
    { x: FIELD.width - 24, y: 84, w: WALL, h: FIELD.height - 96 },
  ];
}

export const ROOMS = [
  {
    name: 'Room 1 — The Lobby',
    subtitle: 'One guard, one camera. Learn the cones, then lift the gold.',
    start: { x: 90, y: 620 },
    exit: { x: 1160, y: 100, w: 84, h: 40 },
    walls: [
      ...borderWalls(),
      // Reception desk wall with a gap on each side: two lanes around it.
      { x: 420, y: 380, w: 440, h: 18 },
      // Short wall off the right side, making a pocket the patrol cannot see into.
      { x: 980, y: 300, w: 18, h: 150 },
    ],
    cover: [
      { x: 250, y: 480, w: 90, h: 60, kind: 'crate' },
      { x: 560, y: 520, w: 120, h: 70, kind: 'desk' },
      { x: 820, y: 180, w: 90, h: 60, kind: 'crate' },
      { x: 1050, y: 470, w: 110, h: 60, kind: 'case' },
      { x: 330, y: 170, w: 110, h: 60, kind: 'case' },
    ],
    loot: [
      { x: 300, y: 250, kind: 'gold', value: 100, main: true, label: 'Gold bar' },
      { x: 1120, y: 560, kind: 'painting', value: 60, main: false, label: 'Small canvas' },
    ],
    guards: [
      { waypoints: [[520, 260], [900, 260], [900, 470], [520, 470]], pause: 1.1 },
    ],
    cameras: [
      { x: 640, y: 104, baseAngle: Math.PI / 2, arc: 1.5, speed: 0.5 },
    ],
  },
  {
    name: 'Room 2 — The Gallery',
    subtitle: 'Two guards, two cameras. The paintings hang between the patrols.',
    start: { x: 90, y: 620 },
    exit: { x: 1160, y: 100, w: 84, h: 40 },
    walls: [
      ...borderWalls(),
      // Long gallery wall with a door gap in the middle: left lane or right lane.
      { x: 300, y: 400, w: 340, h: 18 },
      { x: 700, y: 400, w: 280, h: 18 },
      // A nook wall on the right, hiding the second painting from the camera.
      { x: 1000, y: 470, w: 18, h: 130 },
    ],
    cover: [
      { x: 180, y: 200, w: 100, h: 64, kind: 'case' },
      { x: 480, y: 180, w: 120, h: 64, kind: 'case' },
      { x: 760, y: 180, w: 100, h: 64, kind: 'case' },
      { x: 480, y: 540, w: 120, h: 64, kind: 'case' },
      { x: 820, y: 520, w: 100, h: 64, kind: 'crate' },
      { x: 1080, y: 240, w: 90, h: 60, kind: 'crate' },
    ],
    loot: [
      { x: 640, y: 250, kind: 'painting', value: 150, main: true, label: 'Moonlit Harbour' },
      { x: 240, y: 560, kind: 'gold', value: 80, main: false, label: 'Gold bar' },
      { x: 1130, y: 330, kind: 'painting', value: 90, main: false, label: 'Quiet Orchard' },
    ],
    guards: [
      { waypoints: [[300, 220], [300, 560], [560, 560], [560, 220]], pause: 0.9 },
      { waypoints: [[880, 520], [1120, 520], [1120, 200], [880, 200]], pause: 1.2 },
    ],
    cameras: [
      { x: 320, y: 104, baseAngle: Math.PI / 2, arc: 1.7, speed: 0.55 },
      { x: 960, y: 104, baseAngle: Math.PI / 2, arc: 1.7, speed: 0.65 },
    ],
  },
  {
    name: 'Room 3 — The Vault',
    subtitle: 'The Meridian Diamond. Three cameras, two guards, no easy lane.',
    start: { x: 90, y: 620 },
    exit: { x: 1160, y: 100, w: 84, h: 40 },
    walls: [
      ...borderWalls(),
      // The vault shell: a walled square around the diamond with two doors.
      { x: 480, y: 240, w: 320, h: 18 },
      { x: 480, y: 480, w: 120, h: 18 },
      { x: 680, y: 480, w: 120, h: 18 },
      { x: 480, y: 240, w: 18, h: 120 },
      { x: 480, y: 420, w: 18, h: 78 },
      { x: 782, y: 240, w: 18, h: 240 },
    ],
    cover: [
      { x: 200, y: 200, w: 100, h: 64, kind: 'crate' },
      { x: 200, y: 500, w: 110, h: 64, kind: 'case' },
      { x: 960, y: 500, w: 110, h: 64, kind: 'crate' },
      { x: 980, y: 200, w: 100, h: 64, kind: 'case' },
      { x: 560, y: 560, w: 120, h: 60, kind: 'crate' },
      { x: 900, y: 560, w: 120, h: 60, kind: 'case' },
    ],
    loot: [
      { x: 640, y: 360, kind: 'diamond', value: 500, main: true, label: 'The Meridian Diamond' },
      { x: 280, y: 340, kind: 'gold', value: 100, main: false, label: 'Gold bar' },
      { x: 1040, y: 340, kind: 'painting', value: 120, main: false, label: 'Crimson Study' },
    ],
    guards: [
      { waypoints: [[340, 180], [940, 180], [940, 620], [340, 620]], pause: 0.7 },
      { waypoints: [[940, 560], [340, 560], [340, 320], [940, 320]], pause: 0.9 },
    ],
    cameras: [
      { x: 640, y: 104, baseAngle: Math.PI / 2, arc: 1.9, speed: 0.6 },
      { x: 104, y: 360, baseAngle: 0, arc: 1.6, speed: 0.5 },
      { x: 1176, y: 360, baseAngle: Math.PI, arc: 1.6, speed: 0.55 },
    ],
  },
];

/** Every rectangle that blocks movement and sight in a room: walls plus cover. */
export function blockersFor(room) {
  return [...room.walls, ...room.cover];
}

/** The room's solid rectangles for movement only (same set: cover is solid too). */
export function solidsFor(room) {
  return blockersFor(room);
}
