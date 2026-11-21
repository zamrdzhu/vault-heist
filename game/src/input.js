// Input: keyboard and mouse, read fresh every frame. WASD or arrows move, Shift sneaks,
// Q throws a noise coin, E fires the jammer, P or Escape pauses, Enter confirms a screen.
// A mouse click on the floor walks the thief there; a click on a HUD tool button uses it.
// The module keeps no game state — it only reports what the player's hands are doing.

export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_COIN = 'coin';
export const ACTION_JAMMER = 'jammer';

const MOVE_KEYS = {
  KeyW: { x: 0, y: -1 },
  ArrowUp: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  ArrowDown: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  ArrowLeft: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const ACTION_KEYS = {
  Enter: ACTION_CONFIRM,
  Space: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyQ: ACTION_COIN,
  KeyE: ACTION_JAMMER,
};

export function createInput(canvas) {
  const input = {
    keys: new Set(),
    /** Actions pressed since the last frame was read, in order. */
    actions: [],
    /** The latest mouse position in canvas CSS pixels, or null. */
    mouse: null,
    /** A click the game has not consumed yet: {x, y} in canvas CSS pixels. */
    click: null,
  };

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    if (MOVE_KEYS[event.code] || ACTION_KEYS[event.code] || event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
      event.preventDefault();
    }
    input.keys.add(event.code);
    const action = ACTION_KEYS[event.code];
    if (action) input.actions.push(action);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    input.keys.clear();
  });

  canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.click = { x: event.clientX - rect.left, y: event.clientY - rect.top };
  });
  return input;
}

/** The movement vector from the keys held now, normalised to length 1. */
export function readMove(input) {
  let x = 0;
  let y = 0;
  for (const code of input.keys) {
    const dir = MOVE_KEYS[code];
    if (dir) {
      x += dir.x;
      y += dir.y;
    }
  }
  const len = Math.hypot(x, y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/** True while either Shift key is held. */
export function readSneak(input) {
  return input.keys.has('ShiftLeft') || input.keys.has('ShiftRight');
}

/** Take and clear the actions pressed since the last read. */
export function takeActions(input) {
  const actions = input.actions;
  input.actions = [];
  return actions;
}

/** Take and clear a pending mouse click, if any. */
export function takeClick(input) {
  const click = input.click;
  input.click = null;
  return click;
}
