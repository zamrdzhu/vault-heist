[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/zamrdzhu/vault-heist/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/zamrdzhu/vault-heist/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

# Vault Heist — The Meridian Gallery Job

A top-down stealth heist game, built for the [make.fun best heist game bounty](https://make.fun/bounty/best-heist-game-20261122-0559). Cross three rooms of the Meridian Gallery, slip past patrolling guards and sweeping wall cameras, lift the loot — the Meridian Diamond in the vault — and get out before the alarm meter fills.

## How to play

- **WASD / arrow keys** — move. **Click the floor** — walk there.
- **Shift** — sneak: slower, but guards and cameras spot you from less far away.
- **Q** — throw a noise coin (3 per room): nearby guards leave their patrol to investigate where it lands.
- **E** — fire the jammer (2 per room): freezes every camera for 5 seconds. Click the HUD buttons to use them with the mouse too.
- Grab the room's **main loot** to unlock the exit, then reach the green door. The third room's exit is the getaway.
- Being watched fills the **alarm meter**; hidden, it drains. A full meter — or a guard's touch — ends the run.

## The rooms

1. **The Lobby** — one guard, one camera. Learn the cones, lift the gold.
2. **The Gallery** — two guards, two cameras, paintings hanging between the patrols.
3. **The Vault** — the Meridian Diamond behind a walled vault, three cameras, two crossing patrols.

Guards pause, look around, freeze and stare when they glimpse you, then leave patrol to investigate the last place they saw you. Cameras sweep fixed arcs — read the rhythm and slip through while they look away. Every room has more than one lane through it, and cover blocks both movement and sight.

## Run it

No build step, no network: plain static files under `game/`, vanilla JS + Canvas 2D, sounds synthesized live with the Web Audio API. Screenshots in `screenshots/` are real renders of the game's own code, staged by `game/src/shots.js` (`?shot=start|play|vault|end`) and captured in headless Chrome.

```sh
node serve.ts
# open http://localhost:8080
```

`main.ts` (Node 22, standard library only) hands the game in: it copies `game/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

## Layout

- `game/index.html` — the page shell and canvas.
- `game/src/config.js` — every tuning number and colour.
- `game/src/geom.js` — line of sight and collision geometry.
- `game/src/level.js` — the three rooms: walls, cover, loot, patrols, cameras.
- `game/src/guards.js` — patrol, suspicion, investigation and distraction.
- `game/src/cameras.js` — sweeping wall cameras and the jammer.
- `game/src/player.js` — the thief: keys, click-to-move, sneaking.
- `game/src/loot.js` — loot pieces and the locked exit.
- `game/src/audio.js` — synthesized Web Audio bleeps.
- `game/src/input.js` — keyboard and mouse.
- `game/src/render.js` — everything painted on the canvas, HUD included.
- `game/src/world.js` — the alarm, the tools, room progression, win/lose.
- `game/src/shots.js` — the staged scenes behind `?shot=start|play|vault|end`.
- `game/src/main.js` — boot and the fixed-step game loop.
- `game/src/random.js` — a deterministic random source.
- `main.ts` — the hand-in program. `serve.ts` — a tiny static server for local play.
