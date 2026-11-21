// Guards: they walk their patrol waypoints, pause to look around, and watch a vision cone.
// Being watched raises the alarm; a guard that has stared at the thief long enough leaves
// patrol to investigate the last place it saw one, then walks back and resumes its round.
import { GUARD } from './config.js';
import { angleDifference, lineOfSight } from './geom.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_SUSPICIOUS = 'suspicious';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_RETURN = 'return';
export const GUARD_STARE = 'stare';

export function createGuard(def, index) {
  const start = def.waypoints[0];
  return {
    id: index,
    x: start[0],
    y: start[1],
    angle: Math.PI / 2,
    waypointIndex: 1 % def.waypoints.length,
    waypoints: def.waypoints,
    pause: def.pause ?? 1,
    pauseLeft: 0,
    state: GUARD_PATROL,
    /** Seconds this guard has had the thief in sight without a break. */
    seenTime: 0,
    /** Where the thief was last seen, or null. */
    lastSeen: null,
    stareLeft: 0,
    /** A thrown coin pulls the guard here while this is above zero. */
    distract: null,
    distractLeft: 0,
    speed: GUARD.patrolSpeed,
  };
}

/** True when the guard can see the point (px, py): in range, inside the cone, line clear. */
export function guardCanSee(guard, px, py, blockers, sneak) {
  const dx = px - guard.x;
  const dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = GUARD.visionRange * (sneak ? 0.62 : 1);
  if (dist > range) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angle, guard.angle)) > GUARD.visionHalfAngle) return false;
  return lineOfSight(guard.x, guard.y, px, py, blockers);
}

/** Walk toward (tx, ty) at `speed`, facing the way it moves; returns true on arrival. */
function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

function nextWaypoint(guard) {
  guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
  guard.pauseLeft = guard.pause;
}

/**
 * Advance one guard a step. `seen` says whether it has the thief in sight this step, and
 * `player` gives the thief's position for investigating. The guard never needs the alarm;
 * it only reacts to what it sees.
 */
export function updateGuard(guard, dt, seen, player) {
  if (seen) {
    guard.seenTime += dt;
    guard.lastSeen = { x: player.x, y: player.y };
  } else {
    guard.seenTime = 0;
  }

  // A coin beats everything: walk to where it landed and look around.
  if (guard.distract) {
    guard.distractLeft -= dt;
    if (guard.distractLeft <= 0) {
      guard.distract = null;
      guard.state = GUARD_RETURN;
    } else if (walkToward(guard, guard.distract.x, guard.distract.y, GUARD.investigateSpeed, dt)) {
      guard.angle += dt * 1.5;
    }
    return;
  }

  switch (guard.state) {
    case GUARD_PATROL: {
      if (guard.pauseLeft > 0) {
        guard.pauseLeft -= dt;
        guard.angle += dt * 0.9;
        break;
      }
      const target = guard.waypoints[guard.waypointIndex];
      if (walkToward(guard, target[0], target[1], GUARD.patrolSpeed, dt)) nextWaypoint(guard);
      if (guard.seenTime >= GUARD.suspicionTime) guard.state = GUARD_SUSPICIOUS;
      break;
    }
    case GUARD_SUSPICIOUS: {
      // Freeze and stare at the thief: a fair warning before the chase starts.
      guard.angle = Math.atan2(player.y - guard.y, player.x - guard.x);
      if (!seen) {
        guard.state = GUARD_PATROL;
      } else if (guard.seenTime >= GUARD.suspicionTime + 0.8) {
        guard.state = GUARD_INVESTIGATE;
      }
      break;
    }
    case GUARD_INVESTIGATE: {
      if (guard.lastSeen && walkToward(guard, guard.lastSeen.x, guard.lastSeen.y, GUARD.investigateSpeed, dt)) {
        guard.state = GUARD_STARE;
        guard.stareLeft = GUARD.stareTime;
      }
      if (seen && guard.seenTime >= GUARD.suspicionTime) {
        guard.lastSeen = { x: player.x, y: player.y };
      }
      break;
    }
    case GUARD_STARE: {
      guard.stareLeft -= dt;
      guard.angle += dt * 1.2;
      if (guard.stareLeft <= 0) guard.state = GUARD_RETURN;
      break;
    }
    case GUARD_RETURN: {
      // Walk back to the nearest waypoint, then resume the patrol from there.
      let nearest = 0;
      let nearestDist = Infinity;
      for (let i = 0; i < guard.waypoints.length; i += 1) {
        const d = Math.hypot(guard.waypoints[i][0] - guard.x, guard.waypoints[i][1] - guard.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = i;
        }
      }
      const target = guard.waypoints[nearest];
      if (walkToward(guard, target[0], target[1], GUARD.patrolSpeed, dt)) {
        guard.waypointIndex = (nearest + 1) % guard.waypoints.length;
        guard.state = GUARD_PATROL;
        guard.pauseLeft = guard.pause;
      }
      if (guard.seenTime >= GUARD.suspicionTime) guard.state = GUARD_SUSPICIOUS;
      break;
    }
    default:
      break;
  }
}

/** Send a guard to investigate a thrown coin's landing spot. */
export function distractGuard(guard, x, y, seconds) {
  guard.distract = { x, y };
  guard.distractLeft = seconds;
  guard.seenTime = 0;
}
