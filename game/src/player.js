// The thief: moves with WASD or the arrow keys, or walks toward a mouse click. Holding
// Shift sneaks — slower, but harder to spot. The player never touches the alarm or the
// loot directly; the world asks it where it is and what it is doing, then decides.
import { PLAYER } from './config.js';
import { clampToField, resolveCircleRects } from './geom.js';

export function createPlayer(start) {
  return {
    x: start.x,
    y: start.y,
    angle: -Math.PI / 2,
    sneaking: false,
    moving: false,
    /** Click-to-move target, or null when the keys are steering. */
    clickTarget: null,
    /** Where the thief last faced, for the idle pose. */
    facingX: 0,
    facingY: -1,
  };
}

/**
 * Move the thief one step. `move` is a unit-ish {x, y} from the keys; when it is zero and
 * a click target is set, the thief walks toward the click instead.
 */
export function updatePlayer(player, dt, move, solids, fieldWidth, fieldHeight) {
  let mx = move.x;
  let my = move.y;
  if (mx === 0 && my === 0 && player.clickTarget) {
    const dx = player.clickTarget.x - player.x;
    const dy = player.clickTarget.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 8) {
      player.clickTarget = null;
    } else {
      mx = dx / dist;
      my = dy / dist;
    }
  }
  const len = Math.hypot(mx, my);
  player.moving = len > 0.01;
  if (!player.moving) return;
  const speed = player.sneaking ? PLAYER.sneakSpeed : PLAYER.speed;
  const step = speed * dt;
  const nx = player.x + (mx / len) * step;
  const ny = player.y + (my / len) * step;
  const resolved = resolveCircleRects(nx, ny, PLAYER.radius, solids);
  const clamped = clampToField(resolved.x, resolved.y, PLAYER.radius, fieldWidth, fieldHeight);
  player.x = clamped.x;
  player.y = clamped.y;
  player.angle = Math.atan2(my, mx);
  player.facingX = mx / len;
  player.facingY = my / len;
}

/** Aim a click-to-move walk at the point. Any key press cancels it. */
export function setClickTarget(player, x, y) {
  player.clickTarget = { x, y };
}

/** Cancel click-to-move (called when a movement key is pressed). */
export function cancelClickTarget(player) {
  player.clickTarget = null;
}
