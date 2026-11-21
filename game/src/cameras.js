// Wall cameras: fixed mounts that sweep a fixed arc back and forth. A camera never moves,
// so reading its rhythm is the whole skill — slip through while it looks the other way.
// A jammer freezes every camera at once for a few seconds.
import { CAMERA } from './config.js';
import { angleDifference, lineOfSight } from './geom.js';

export function createCamera(def, index) {
  return {
    id: index,
    x: def.x,
    y: def.y,
    baseAngle: def.baseAngle,
    /** Half the total sweep, in radians. */
    arc: def.arc / 2,
    speed: def.speed ?? CAMERA.sweepSpeed,
    /** Where the camera looks now, as an offset from its base angle. */
    offset: 0,
    /** +1 or -1: which way along the arc it is sweeping. */
    direction: 1,
    /** Seconds of jam left; while above zero the camera is frozen and blind. */
    jammedLeft: 0,
  };
}

/** The heading the camera looks along right now. */
export function cameraAngle(camera) {
  return camera.baseAngle + camera.offset;
}

export function updateCamera(camera, dt) {
  if (camera.jammedLeft > 0) {
    camera.jammedLeft -= dt;
    return;
  }
  camera.offset += camera.direction * camera.speed * dt;
  if (camera.offset > camera.arc) {
    camera.offset = camera.arc;
    camera.direction = -1;
  } else if (camera.offset < -camera.arc) {
    camera.offset = -camera.arc;
    camera.direction = 1;
  }
}

/** True when the camera can see the point (px, py): in range, inside the cone, line clear. */
export function cameraCanSee(camera, px, py, blockers, sneak) {
  if (camera.jammedLeft > 0) return false;
  const dx = px - camera.x;
  const dy = py - camera.y;
  const dist = Math.hypot(dx, dy);
  const range = CAMERA.visionRange * (sneak ? 0.62 : 1);
  if (dist > range) return false;
  const angle = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angle, cameraAngle(camera))) > CAMERA.visionHalfAngle) return false;
  return lineOfSight(camera.x, camera.y, px, py, blockers);
}

/** Freeze the camera for `seconds`. */
export function jamCamera(camera, seconds) {
  camera.jammedLeft = seconds;
}
