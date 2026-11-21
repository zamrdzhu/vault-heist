// The world: one room at a time, the alarm, the tools and the win/lose rules. It owns no
// drawing and no DOM — it only advances the state one fixed step at a time and reports
// what happened, so the renderer and the screenshot stager can both read the same truth.
//
// A room is won by lifting its main loot and reaching the exit; the third room's exit is
// the getaway. The alarm fills while any guard or camera has the thief in sight and drains
// while hidden; a full meter, or a guard's touch, ends the run.
import { ALARM, FIELD, GUARD, PLAYER, SCORE, STEP, TOOLS } from './config.js';
import { blockersFor, ROOMS, solidsFor } from './level.js';
import { createLoot, exitUnlocked, lootInReach, mainLoot } from './loot.js';
import { createGuard, distractGuard, guardCanSee, updateGuard } from './guards.js';
import { cameraAngle, cameraCanSee, createCamera, jamCamera, updateCamera } from './cameras.js';
import { createPlayer, updatePlayer } from './player.js';
import { createRandom } from './random.js';
import {
  playCaught, playCoin, playDoor, playJam, playPickup, playSpotted, playWin,
} from './audio.js';

export const EVENT_NONE = 0;
export const EVENT_LOOT = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_WIN = 8;
export const EVENT_ROOM = 16;
export const EVENT_EXIT_OPEN = 32;
export const EVENT_COIN = 64;
export const EVENT_JAMMER = 128;

export const PHASE_TITLE = 'title';
export const PHASE_PLAY = 'play';
export const PHASE_CAUGHT = 'caught';
export const PHASE_WIN = 'win';

export function createWorld(seed) {
  const world = {
    random: createRandom(seed),
    audio: null,
    state: null,
  };
  resetWorld(world);
  return world;
}

/** Build the state for a room index, refilling that room's tools and clearing the alarm. */
export function loadRoom(world, roomIndex) {
  const room = ROOMS[roomIndex];
  const state = world.state;
  state.roomIndex = roomIndex;
  state.room = room;
  state.player = createPlayer(room.start);
  state.guards = room.guards.map((def, i) => createGuard(def, i));
  state.cameras = room.cameras.map((def, i) => createCamera(def, i));
  state.loot = createLoot(room.loot);
  state.blockers = blockersFor(room);
  state.solids = solidsFor(room);
  state.alarm = 0;
  state.coins = TOOLS.coinsPerRoom;
  state.jammers = TOOLS.jammersPerRoom;
  state.thrownCoins = [];
  state.seenNow = false;
  state.seenBefore = false;
  state.roomTime = 0;
  state.flash = 0;
  state.message = '';
  state.messageLeft = 0;
  state.exitOpen = false;
}

export function resetWorld(world) {
  world.state = {
    phase: PHASE_TITLE,
    roomIndex: 0,
    room: null,
    player: null,
    guards: [],
    cameras: [],
    loot: [],
    blockers: [],
    solids: [],
    alarm: 0,
    coins: TOOLS.coinsPerRoom,
    jammers: TOOLS.jammersPerRoom,
    thrownCoins: [],
    seenNow: false,
    seenBefore: false,
    score: 0,
    time: 0,
    roomTime: 0,
    flash: 0,
    message: '',
    messageLeft: 0,
    exitOpen: false,
    winBonus: 0,
  };
  loadRoom(world, 0);
  world.state.phase = PHASE_TITLE;
}

/** Start a fresh run from the title screen. */
export function startRun(world) {
  resetWorld(world);
  world.state.phase = PHASE_PLAY;
}

function showMessage(state, text, seconds) {
  state.message = text;
  state.messageLeft = seconds;
}

function throwCoin(world) {
  const state = world.state;
  if (state.coins <= 0 || state.phase !== PHASE_PLAY) return EVENT_NONE;
  state.coins -= 1;
  const player = state.player;
  const x = player.x + player.facingX * TOOLS.coinThrowDistance;
  const y = player.y + player.facingY * TOOLS.coinThrowDistance;
  const coin = { x, y, left: TOOLS.coinDistractTime };
  state.thrownCoins.push(coin);
  for (const guard of state.guards) {
    if (Math.hypot(guard.x - x, guard.y - y) <= TOOLS.coinDistractRadius) {
      distractGuard(guard, x, y, TOOLS.coinDistractTime);
    }
  }
  playCoin(world.audio);
  showMessage(state, 'Coin tossed — the guards go to look.', 1.6);
  return EVENT_COIN;
}

function fireJammer(world) {
  const state = world.state;
  if (state.jammers <= 0 || state.phase !== PHASE_PLAY) return EVENT_NONE;
  state.jammers -= 1;
  for (const camera of state.cameras) jamCamera(camera, TOOLS.jamDuration);
  playJam(world.audio);
  showMessage(state, `Cameras jammed for ${TOOLS.jamDuration} seconds.`, 1.8);
  return EVENT_JAMMER;
}

function catchThief(world, reason) {
  const state = world.state;
  if (state.phase !== PHASE_PLAY) return EVENT_NONE;
  state.phase = PHASE_CAUGHT;
  state.caughtReason = reason;
  state.flash = 1;
  playCaught(world.audio);
  return EVENT_CAUGHT;
}

/**
 * Advance the world one fixed step. `move` is the normalised key vector, `sneak` the Shift
 * state, `actions` the pressed action names. Returns a bitmask of what happened.
 */
export function stepWorld(world, dt, move, sneak, actions) {
  const state = world.state;
  if (state.phase !== PHASE_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;
  state.time += dt;
  state.roomTime += dt;
  if (state.flash > 0) state.flash = Math.max(0, state.flash - dt * 2);
  if (state.messageLeft > 0) state.messageLeft -= dt;

  for (const action of actions) {
    if (action === 'coin') events |= throwCoin(world);
    else if (action === 'jammer') events |= fireJammer(world);
  }
  if (state.phase !== PHASE_PLAY) return events;

  const player = state.player;
  player.sneaking = sneak;
  updatePlayer(player, dt, move, state.solids, FIELD.width, FIELD.height);

  // Thrown coins tick down and vanish.
  for (let i = state.thrownCoins.length - 1; i >= 0; i -= 1) {
    state.thrownCoins[i].left -= dt;
    if (state.thrownCoins[i].left <= 0) state.thrownCoins.splice(i, 1);
  }

  for (const camera of state.cameras) updateCamera(camera, dt);

  // Sight: guards and cameras each check the thief, then the alarm follows.
  let guardSees = false;
  let cameraSees = false;
  for (const guard of state.guards) {
    const sees = guardCanSee(guard, player.x, player.y, state.blockers, sneak);
    if (sees) guardSees = true;
    updateGuard(guard, dt, sees, player);
    if (Math.hypot(guard.x - player.x, guard.y - player.y) < GUARD.catchRadius) {
      return events | catchThief(world, 'A guard grabbed you.');
    }
  }
  for (const camera of state.cameras) {
    if (cameraCanSee(camera, player.x, player.y, state.blockers, sneak)) cameraSees = true;
  }

  state.seenBefore = state.seenNow;
  state.seenNow = guardSees || cameraSees;
  if (state.seenNow && !state.seenBefore) {
    events |= EVENT_SPOTTED;
    playSpotted(world.audio);
    state.flash = 0.7;
  }
  if (guardSees) state.alarm += ALARM.guardRate * dt;
  else if (cameraSees) state.alarm += ALARM.cameraRate * dt;
  else state.alarm = Math.max(0, state.alarm - ALARM.decayRate * dt);
  if (state.alarm >= ALARM.max) {
    return events | catchThief(world, 'The alarm hit full — security swarmed the room.');
  }

  // Loot: walk close enough and it is yours.
  const item = lootInReach(state.loot, player.x, player.y, PLAYER.pickupRadius);
  if (item) {
    item.taken = true;
    state.score += item.value;
    events |= EVENT_LOOT;
    playPickup(world.audio, item.main);
    showMessage(state, `${item.label} lifted — +${item.value}.`, 1.8);
    if (item.main) {
      state.exitOpen = true;
      events |= EVENT_EXIT_OPEN;
      playDoor(world.audio);
      showMessage(state, 'Main loot secured — the exit is open. Get out!', 2.4);
    }
  }

  // Exit: only open once the main loot is taken.
  const exit = state.room.exit;
  if (
    state.exitOpen
    && player.x > exit.x && player.x < exit.x + exit.w
    && player.y > exit.y && player.y < exit.y + exit.h
  ) {
    if (state.roomIndex + 1 >= ROOMS.length) {
      state.phase = PHASE_WIN;
      state.winBonus = Math.max(0, Math.round((300 - state.time) * SCORE.timeBonusPerSecond));
      state.score += state.winBonus;
      playWin(world.audio);
      return events | EVENT_WIN;
    }
    loadRoom(world, state.roomIndex + 1);
    state.phase = PHASE_PLAY;
    showMessage(state, `${state.room.name} — ${state.room.subtitle}`, 2.6);
    return events | EVENT_ROOM;
  }
  return events;
}

/** The heading a camera looks along — re-exported so the renderer needs one import. */
export function cameraHeading(camera) {
  return cameraAngle(camera);
}

export { STEP };
