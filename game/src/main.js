// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), and the renderer paints what is
// there. The game moves between four screens: title, play, paused, caught and win.
//
// ?seed=N fixes the random source. ?shot=start|play|vault|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_WIN, PHASE_CAUGHT, PHASE_PLAY, PHASE_TITLE, PHASE_WIN, startRun, stepWorld } from './world.js';
import {
  ACTION_COIN, ACTION_CONFIRM, ACTION_JAMMER, ACTION_PAUSE, createInput, readMove, readSneak, takeActions, takeClick,
} from './input.js';
import { createAudio, ensureAudio } from './audio.js';
import { createRenderer, draw, SCREEN_CAUGHT, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, toField } from './render.js';
import { stageShot } from './shots.js';
import { cancelClickTarget, setClickTarget } from './player.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const audio = createAudio();
world.audio = audio;
// A read-only handle for automated playtests (screenshots, smoke tests): the game never
// reads it back, and it changes nothing about play.
window.__vaultHeist = { world, get screen() { return screen; } };
const renderer = createRenderer(canvas);
const input = createInput(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(score) {
  try {
    const best = readBest();
    if (score > best) window.localStorage.setItem(BEST_KEY, String(score));
  } catch {
    // A browser that refuses storage just never keeps a best score.
  }
}

function announce(text) {
  if (status) status.textContent = text;
}

let best = readBest();
let screen = SCREEN_TITLE;
let paused = false;
let time = 0;

function setScreen(next) {
  screen = next;
  if (next === SCREEN_TITLE) announce('Vault Heist title screen. Press Enter to start the job.');
  else if (next === SCREEN_CAUGHT) announce('Caught. Press Enter to try the job again.');
  else if (next === SCREEN_WIN) announce(`Clean getaway. Final score ${world.state.score}. Press Enter to play again.`);
  else if (next === SCREEN_PAUSED) announce('Paused.');
  else announce('Playing Vault Heist.');
}

if (shot) {
  // Screenshot mode: stage the scene, paint it twice, and signal readiness.
  const staged = stageShot(shot, world);
  best = staged.best;
  draw(renderer, world, staged.screen, best, 1.2);
  draw(renderer, world, staged.screen, best, 1.2);
  window.__shotReady = true;
} else {
  setScreen(SCREEN_TITLE);

  /** A click on a HUD tool button uses that tool; anywhere else walks the thief there. */
  function handleClick(field) {
    ensureAudio(audio);
    const buttons = renderer.buttons;
    if (field.y >= 0 && field.y <= 76) {
      if (buttons.coin && field.x >= buttons.coin.x && field.x <= buttons.coin.x + buttons.coin.w
        && field.y >= buttons.coin.y && field.y <= buttons.coin.y + buttons.coin.h) {
        input.actions.push(ACTION_COIN);
        return;
      }
      if (buttons.jammer && field.x >= buttons.jammer.x && field.x <= buttons.jammer.x + buttons.jammer.w
        && field.y >= buttons.jammer.y && field.y <= buttons.jammer.y + buttons.jammer.h) {
        input.actions.push(ACTION_JAMMER);
        return;
      }
    }
    if (screen === SCREEN_PLAY && !paused && world.state.phase === PHASE_PLAY) {
      setClickTarget(world.state.player, field.x, field.y);
    }
  }

  let last = performance.now();
  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    time += elapsed;

    const actions = takeActions(input);
    const click = takeClick(input);
    if (click) handleClick(toField(renderer, click.x, click.y));

    // Screen actions (confirm / pause) are handled here; play actions (coin / jammer)
    // are collected and handed to the world with the next step.
    const gameActions = [];
    for (const action of actions) {
      ensureAudio(audio);
      if (action === ACTION_CONFIRM) {
        if (screen === SCREEN_TITLE) {
          startRun(world);
          setScreen(SCREEN_PLAY);
        } else if (screen === SCREEN_CAUGHT || screen === SCREEN_WIN) {
          startRun(world);
          setScreen(SCREEN_PLAY);
        }
      } else if (action === ACTION_PAUSE) {
        if (screen === SCREEN_PLAY || screen === SCREEN_PAUSED) {
          paused = !paused;
          setScreen(paused ? SCREEN_PAUSED : SCREEN_PLAY);
        }
      } else if (action === ACTION_COIN || action === ACTION_JAMMER) {
        gameActions.push(action);
      }
    }

    if (screen === SCREEN_PLAY && !paused) {
      const move = readMove(input);
      if (move.x !== 0 || move.y !== 0) cancelClickTarget(world.state.player);
      let left = elapsed;
      let firstStep = true;
      while (left > 0) {
        const dt = Math.min(STEP, left);
        const events = stepWorld(world, dt, move, readSneak(input), firstStep ? gameActions : []);
        firstStep = false;
        if (events & EVENT_WIN) {
          saveBest(world.state.score);
          best = readBest();
          setScreen(SCREEN_WIN);
        }
        left -= dt;
        if (world.state.phase !== PHASE_PLAY) break;
      }
      if (world.state.phase === PHASE_CAUGHT) {
        saveBest(world.state.score);
        best = readBest();
        setScreen(SCREEN_CAUGHT);
      }
    }

    draw(renderer, world, screen, best, time);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
