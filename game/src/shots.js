// The screenshot scenes behind ?shot=start|play|vault|end. Each one loads a real room from
// the same world the player plays, then poses it — the thief, the patrols and the cameras
// placed mid-motion, the alarm at a telling level — so the frame is what a real game looks
// like at that moment, and the same seed always gives the same frame. Nothing here draws
// anything the game itself cannot show.
import { loadRoom } from './world.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

function poseGuard(guard, x, y, angle, state) {
  guard.x = x;
  guard.y = y;
  guard.angle = angle;
  guard.state = state;
  guard.pauseLeft = 0;
  guard.seenTime = 0;
}

function poseCamera(camera, offset, direction) {
  camera.offset = offset;
  camera.direction = direction;
}

/**
 * Set `world` to the named scene and return the screen to draw over it and the best score
 * to show. Unknown names stage the cover scene.
 */
export function stageShot(name, world) {
  const state = world.state;
  if (name === 'play') {
    // Room 2, mid-job: the alarm is half full, one guard is closing in on the last place
    // he saw the thief, the other patrols the far lane, both cameras are mid-sweep.
    loadRoom(world, 1);
    state.phase = 'play';
    state.player.x = 640;
    state.player.y = 480;
    state.player.facingX = 0;
    state.player.facingY = -1;
    state.player.sneaking = true;
    state.alarm = 58;
    state.coins = 2;
    state.jammers = 1;
    state.score = 240;
    state.time = 74;
    state.loot[0].taken = true;
    poseGuard(state.guards[0], 430, 470, 0.3, 'investigate');
    state.guards[0].lastSeen = { x: 640, y: 480 };
    poseGuard(state.guards[1], 980, 300, Math.PI, 'patrol');
    poseCamera(state.cameras[0], 0.5, 1);
    poseCamera(state.cameras[1], -0.6, -1);
    state.message = 'Spotted! Break line of sight to cool the alarm.';
    state.messageLeft = 99;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'vault') {
    // Room 3, the diamond within reach: the thief slips through the vault door while the
    // cameras sweep and both guards cross the room.
    loadRoom(world, 2);
    state.phase = 'play';
    state.player.x = 560;
    state.player.y = 360;
    state.player.facingX = 1;
    state.player.facingY = 0;
    state.player.sneaking = true;
    state.alarm = 71;
    state.coins = 1;
    state.jammers = 0;
    state.score = 470;
    state.time = 148;
    poseGuard(state.guards[0], 700, 180, Math.PI / 2, 'patrol');
    poseGuard(state.guards[1], 340, 560, -Math.PI / 2, 'patrol');
    poseCamera(state.cameras[0], 0.8, -1);
    poseCamera(state.cameras[1], 0.4, 1);
    poseCamera(state.cameras[2], -0.5, 1);
    state.message = 'The Meridian Diamond — grab it and run for the exit.';
    state.messageLeft = 99;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    // The getaway: the vault cleared, the diamond lifted, the score tallied.
    loadRoom(world, 2);
    state.phase = 'win';
    state.score = 1160;
    state.winBonus = 140;
    state.time = 172;
    state.loot[0].taken = true;
    state.loot[1].taken = true;
    state.player.x = 1180;
    state.player.y = 120;
    return { screen: SCREEN_WIN, best: 1160 };
  }
  // The cover: room 1 at a glance — the thief behind cover, a guard's cone sweeping the
  // lobby, a camera overhead, the gold waiting, the alarm meter already ticking.
  loadRoom(world, 0);
  state.phase = 'play';
  state.player.x = 300;
  state.player.y = 540;
  state.player.facingX = 1;
  state.player.facingY = -0.4;
  state.player.sneaking = true;
  state.alarm = 32;
  state.coins = 3;
  state.jammers = 2;
  state.score = 0;
  state.time = 21;
  poseGuard(state.guards[0], 700, 260, Math.PI / 2, 'patrol');
  poseCamera(state.cameras[0], 0.45, 1);
  state.message = 'Stay out of the cones. Grab the gold, then reach the exit.';
  state.messageLeft = 99;
  return { screen: SCREEN_PLAY, best: 0 };
}
