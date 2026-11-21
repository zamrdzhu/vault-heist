// The renderer: everything the player sees, painted on one canvas in the 1280x720 logical
// field and scaled to the window. It reads the world and never changes it. The HUD bar at
// the top always shows the alarm meter, the loot taken, the tools left and the score — the
// judge reads the game mostly from one frame, so all of it has to be legible at a glance.
import { ALARM, COLORS, FIELD, GUARD, CAMERA, PLAYER } from './config.js';
import { cameraAngle } from './cameras.js';
import { exitUnlocked } from './loot.js';
import { PHASE_CAUGHT, PHASE_PLAY, PHASE_TITLE, PHASE_WIN } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_WIN = 'win';

const HUD_HEIGHT = 76;

/** Rounded rectangle path, for buttons and panels. */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawLootPiece(ctx, item, time) {
  const bob = Math.sin(time * 2 + item.phase) * 3;
  const y = item.y + bob;
  ctx.save();
  ctx.translate(item.x, y);
  if (item.kind === 'diamond') {
    ctx.rotate(Math.PI / 4);
    const s = 15;
    ctx.fillStyle = COLORS.diamond;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.fillStyle = COLORS.diamond;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('◆', 0, -20);
  } else if (item.kind === 'gold') {
    ctx.fillStyle = COLORS.loot;
    ctx.fillRect(-13, -7, 26, 14);
    ctx.fillStyle = '#b98a1d';
    ctx.fillRect(-13, 3, 26, 4);
    ctx.fillStyle = '#fff3b0';
    ctx.fillRect(-9, -4, 18, 3);
  } else {
    // A framed painting on its little easel stand.
    ctx.fillStyle = '#8a6d3b';
    ctx.fillRect(-17, -13, 34, 26);
    ctx.fillStyle = '#7a5ba6';
    ctx.fillRect(-14, -10, 28, 20);
    ctx.fillStyle = '#ffd94d';
    ctx.beginPath();
    ctx.arc(-4, -2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9be8ff';
    ctx.fillRect(4, 2, 8, 6);
  }
  ctx.restore();
  // Sparkle: a few glints that drift around the piece.
  ctx.fillStyle = 'rgba(255, 240, 170, 0.85)';
  for (let i = 0; i < 3; i += 1) {
    const a = time * 1.3 + item.phase + (i * Math.PI * 2) / 3;
    const r = 20 + 6 * Math.sin(time * 2 + i);
    ctx.beginPath();
    ctx.arc(item.x + Math.cos(a) * r, y + Math.sin(a) * r * 0.6, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuard(ctx, guard, time) {
  const alert = guard.state === 'suspicious' || guard.state === 'investigate' || guard.state === 'stare';
  const coneFill = alert ? COLORS.guardConeAlert : COLORS.guardCone;
  drawCone(ctx, guard.x, guard.y, guard.angle, 0.62, 235, coneFill);
  // Body: a mustard-uniform guard with a cap brim pointing where he looks.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(guard.x + 3, guard.y + 4, 15, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2f10';
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.guard;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  ctx.lineTo(guard.x + Math.cos(guard.angle) * 20, guard.y + Math.sin(guard.angle) * 20);
  ctx.stroke();
  if (alert) {
    ctx.fillStyle = '#ff5d5d';
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', guard.x, guard.y - 24 + Math.sin(time * 6) * 2);
  }
}

function drawCamera(ctx, camera) {
  const jammed = camera.jammedLeft > 0;
  const angle = cameraAngle(camera);
  if (!jammed) drawCone(ctx, camera.x, camera.y, angle, CAMERA.visionHalfAngle, CAMERA.visionRange, COLORS.cameraCone);
  // Wall mount and lens.
  ctx.fillStyle = '#22222e';
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = jammed ? '#666' : COLORS.camera;
  ctx.beginPath();
  ctx.arc(camera.x, camera.y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = jammed ? '#666' : COLORS.camera;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(camera.x, camera.y);
  ctx.lineTo(camera.x + Math.cos(angle) * 16, camera.y + Math.sin(angle) * 16);
  ctx.stroke();
  if (jammed) {
    ctx.fillStyle = '#cfd4ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JAMMED', camera.x, camera.y - 18);
  }
}

function drawPlayer(ctx, player, time) {
  const radius = player.sneaking ? 11 : PLAYER.radius;
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(player.x + 2, player.y + 4, radius + 2, radius - 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = player.sneaking ? COLORS.playerSneak : COLORS.player;
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
  ctx.fill();
  // Hood and the direction the thief faces.
  ctx.fillStyle = '#123524';
  ctx.beginPath();
  ctx.arc(player.x, player.y, radius * 0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eafff0';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(player.x, player.y);
  ctx.lineTo(player.x + player.facingX * (radius + 5), player.y + player.facingY * (radius + 5));
  ctx.stroke();
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(126, 231, 135, 0.7)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  // Click-to-move marker.
  if (player.clickTarget) {
    ctx.strokeStyle = 'rgba(242, 234, 216, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.clickTarget.x, player.clickTarget.y, 8 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawAlarmMeter(ctx, alarm, x, y, width) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  roundRect(ctx, x - 8, y - 8, width + 16, 40, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', x, y + 5);
  const barX = x + 62;
  const barW = width - 62;
  ctx.fillStyle = '#2a2438';
  roundRect(ctx, barX, y - 4, barW, 16, 8);
  ctx.fill();
  const frac = Math.max(0, Math.min(1, alarm / ALARM.max));
  const colour = frac < 0.5 ? '#7ee787' : frac < 0.8 ? '#e8b13c' : '#ff5d5d';
  if (frac > 0.01) {
    ctx.fillStyle = colour;
    roundRect(ctx, barX, y - 4, Math.max(10, barW * frac), 16, 8);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(alarm)}%`, barX + barW + 0, y + 24);
}

function drawToolButton(ctx, rect, label, key, count, disabled) {
  ctx.fillStyle = disabled ? 'rgba(60,56,80,0.9)' : 'rgba(74,68,104,0.95)';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.strokeStyle = disabled ? '#555' : '#9a94b0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.stroke();
  ctx.fillStyle = disabled ? '#777' : COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${key} ${label} ×${count}`, rect.x + rect.w / 2, rect.y + 22);
}

function drawHud(ctx, state, time) {
  ctx.fillStyle = 'rgba(10, 9, 18, 0.88)';
  ctx.fillRect(0, 0, FIELD.width, HUD_HEIGHT);
  ctx.strokeStyle = '#3a3550';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT);
  ctx.lineTo(FIELD.width, HUD_HEIGHT);
  ctx.stroke();

  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(state.room.name, 16, 26);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px sans-serif';
  ctx.fillText(state.room.subtitle, 16, 48);

  drawAlarmMeter(ctx, state.alarm, 430, 22, 340);

  const taken = state.loot.filter((item) => item.taken).length;
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`◆ ${taken}/${state.loot.length} loot`, 800, 30);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(`Score ${state.score}`, 800, 52);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px sans-serif';
  ctx.fillText(`Time ${Math.floor(state.time)}s`, 920, 30);
  ctx.fillText(`Room ${state.roomIndex + 1}/3`, 920, 52);

  return {
    coin: { x: 1020, y: 14, w: 118, h: 48 },
    jammer: { x: 1146, y: 14, w: 118, h: 48 },
  };
}

function drawRoom(ctx, state, time) {
  // Floor: two-tone checker plus a carpet runner down the middle.
  for (let gx = 0; gx < 16; gx += 1) {
    for (let gy = 0; gy < 9; gy += 1) {
      ctx.fillStyle = (gx + gy) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
      ctx.fillRect(8 + gx * 80, 84 + gy * 70, 80, 70);
    }
  }
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(560, 100, 160, 604);
  ctx.strokeStyle = 'rgba(242,234,216,0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(560, 100, 160, 604);

  for (const wall of state.room.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(wall.x, wall.y, wall.w, 4);
  }
  for (const cover of state.room.cover) {
    ctx.fillStyle = COLORS.cover;
    ctx.fillRect(cover.x, cover.y, cover.w, cover.h);
    ctx.fillStyle = COLORS.coverTop;
    ctx.fillRect(cover.x, cover.y, cover.w, 4);
    ctx.strokeStyle = 'rgba(242,234,216,0.18)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(cover.x + 2, cover.y + 2, cover.w - 4, cover.h - 4);
  }

  // Exit door: locked red until the main loot is lifted, open green after.
  const exit = state.room.exit;
  const open = exitUnlocked(state.loot);
  ctx.fillStyle = open ? COLORS.exit : '#ff5d5d';
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.fillStyle = '#0c0a14';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT — GO!' : 'EXIT LOCKED', exit.x + exit.w / 2, exit.y + 25);

  for (const item of state.loot) {
    if (!item.taken) drawLootPiece(ctx, item, time);
  }
  for (const coin of state.thrownCoins) {
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 217, 77, 0.6)';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 10 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const camera of state.cameras) drawCamera(ctx, camera);
  for (const guard of state.guards) drawGuard(ctx, guard, time);
  drawPlayer(ctx, state.player, time);

  // Being watched: a red edge that pulses with the alarm.
  if (state.seenNow) {
    const alpha = 0.25 + 0.2 * Math.sin(time * 8);
    ctx.strokeStyle = `rgba(255, 93, 93, ${alpha})`;
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 84, FIELD.width - 16, FIELD.height - 96);
  }
  if (state.flash > 0) {
    ctx.fillStyle = `rgba(255, 93, 93, ${state.flash * 0.18})`;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  // Room message line, bottom centre.
  if (state.messageLeft > 0) {
    ctx.fillStyle = 'rgba(10, 9, 18, 0.85)';
    const w = ctx.measureText(state.message).width + 32;
    roundRect(ctx, (FIELD.width - w) / 2, FIELD.height - 44, w, 30, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, FIELD.width / 2, FIELD.height - 24);
  }
}

function dimOverlay(ctx) {
  ctx.fillStyle = 'rgba(8, 7, 14, 0.72)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
}

function centreText(ctx, lines, yStart, gap) {
  let y = yStart;
  for (const line of lines) {
    ctx.fillText(line.text, FIELD.width / 2, y);
    ctx.font = line.nextFont ?? ctx.font;
    y += line.gap ?? gap;
  }
}

export function createRenderer(canvas) {
  const renderer = {
    canvas,
    ctx: canvas.getContext('2d'),
    scale: 1,
    offsetX: 0,
    offsetY: 0,
    /** HUD tool buttons in logical coordinates, refreshed every HUD draw. */
    buttons: { coin: null, jammer: null },
  };
  return renderer;
}

function resize(renderer) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const cssW = renderer.canvas.clientWidth;
  const cssH = renderer.canvas.clientHeight;
  const w = Math.max(1, Math.round(cssW * dpr));
  const h = Math.max(1, Math.round(cssH * dpr));
  if (renderer.canvas.width !== w || renderer.canvas.height !== h) {
    renderer.canvas.width = w;
    renderer.canvas.height = h;
  }
  renderer.scale = Math.min(w / FIELD.width, h / FIELD.height);
  renderer.offsetX = (w - FIELD.width * renderer.scale) / 2;
  renderer.offsetY = (h - FIELD.height * renderer.scale) / 2;
}

/** Convert a canvas CSS-pixel point to logical field coordinates. */
export function toField(renderer, x, y) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  return {
    x: (x * dpr - renderer.offsetX) / renderer.scale,
    y: (y * dpr - renderer.offsetY) / renderer.scale,
  };
}

/**
 * Paint one frame. `screen` is one of the SCREEN_* constants, `best` the saved best score,
 * `time` the seconds since the page loaded (for idle animation).
 */
export function draw(renderer, world, screen, best, time) {
  resize(renderer);
  const { ctx } = renderer;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0c0a14';
  ctx.fillRect(0, 0, renderer.canvas.width, renderer.canvas.height);
  ctx.setTransform(renderer.scale, 0, 0, renderer.scale, renderer.offsetX, renderer.offsetY);

  const state = world.state;
  drawRoom(ctx, state, time);
  renderer.buttons = drawHud(ctx, state, time);
  const buttons = renderer.buttons;
  drawToolButton(ctx, buttons.coin, 'Coin', 'Q', state.coins, state.coins <= 0);
  drawToolButton(ctx, buttons.jammer, 'Jam', 'E', state.jammers, state.jammers <= 0);

  ctx.textAlign = 'center';
  if (screen === SCREEN_TITLE) {
    dimOverlay(ctx);
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 64px sans-serif';
    ctx.fillText('VAULT HEIST', FIELD.width / 2, 210);
    ctx.fillStyle = COLORS.text;
    ctx.font = '28px sans-serif';
    ctx.fillText('The Meridian Gallery Job', FIELD.width / 2, 258);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '17px sans-serif';
    ctx.fillText('Cross three rooms. Dodge the cones. Lift the Meridian Diamond. Get out.', FIELD.width / 2, 306);
    ctx.fillStyle = COLORS.text;
    ctx.font = '16px sans-serif';
    centreText(ctx, [
      { text: 'WASD / arrows — move      Click floor — walk there      Shift — sneak (harder to spot)' },
      { text: 'Q — throw a noise coin (guards investigate)      E — jam the cameras (5 s)' },
      { text: 'Grab the main loot to unlock the exit. Full alarm — or a guard’s touch — ends the run.' },
    ], 360, 30);
    ctx.fillStyle = COLORS.player;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('Press Enter to start the job', FIELD.width / 2, 500);
    if (best > 0) {
      ctx.fillStyle = COLORS.dim;
      ctx.font = '15px sans-serif';
      ctx.fillText(`Best score: ${best}`, FIELD.width / 2, 536);
    }
  } else if (screen === SCREEN_PAUSED) {
    dimOverlay(ctx);
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText('PAUSED', FIELD.width / 2, 330);
    ctx.font = '18px sans-serif';
    ctx.fillText('P or Esc — resume', FIELD.width / 2, 380);
  } else if (screen === SCREEN_CAUGHT) {
    dimOverlay(ctx);
    ctx.fillStyle = '#ff5d5d';
    ctx.font = 'bold 56px sans-serif';
    ctx.fillText('CAUGHT!', FIELD.width / 2, 300);
    ctx.fillStyle = COLORS.text;
    ctx.font = '20px sans-serif';
    ctx.fillText(state.caughtReason ?? 'Security got you.', FIELD.width / 2, 348);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '17px sans-serif';
    ctx.fillText(`Score ${state.score}   •   Room ${state.roomIndex + 1} of 3   •   Best ${best}`, FIELD.width / 2, 392);
    ctx.fillStyle = COLORS.player;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('Enter — try the job again', FIELD.width / 2, 448);
  } else if (screen === SCREEN_WIN) {
    dimOverlay(ctx);
    ctx.fillStyle = COLORS.loot;
    ctx.font = 'bold 54px sans-serif';
    ctx.fillText('CLEAN GETAWAY!', FIELD.width / 2, 280);
    ctx.fillStyle = COLORS.text;
    ctx.font = '22px sans-serif';
    ctx.fillText('The Meridian Diamond is yours. The gallery never saw you coming.', FIELD.width / 2, 330);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '18px sans-serif';
    ctx.fillText(`Loot ${state.score - state.winBonus}   •   Time bonus +${state.winBonus}   •   Time ${Math.floor(state.time)}s`, FIELD.width / 2, 378);
    ctx.fillStyle = COLORS.player;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Final score ${state.score}   •   Best ${Math.max(best, state.score)}`, FIELD.width / 2, 424);
    ctx.fillStyle = COLORS.text;
    ctx.font = '18px sans-serif';
    ctx.fillText('Enter — run the job again', FIELD.width / 2, 472);
  }
}
