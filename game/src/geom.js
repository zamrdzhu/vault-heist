// Small 2D geometry helpers the stealth rules lean on: line of sight between two points
// past axis-aligned rectangles, and a circle pushed out of rectangles (walls and cover).
// Everything here is pure arithmetic, so the guards, the cameras and the player all agree
// on what "blocked" means.

/** True when the segment (x1,y1)-(x2,y2) touches or crosses the rectangle. */
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  // Slab test, one axis at a time; a zero delta means the segment runs parallel to the axis.
  if (dx === 0) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** True when nothing in `blockers` stands between the two points. */
export function lineOfSight(x1, y1, x2, y2, blockers) {
  for (let i = 0; i < blockers.length; i += 1) {
    if (segmentHitsRect(x1, y1, x2, y2, blockers[i])) return false;
  }
  return true;
}

/** The smallest signed angle between two headings, in (-PI, PI]. */
export function angleDifference(a, b) {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}

/**
 * Push a circle (x, y, radius) out of every rectangle it overlaps. Returns the corrected
 * position; moving x first and then y lets the circle slide along a wall instead of sticking.
 */
export function resolveCircleRects(x, y, radius, rects) {
  let px = x;
  let py = y;
  for (let pass = 0; pass < 2; pass += 1) {
    for (let i = 0; i < rects.length; i += 1) {
      const r = rects[i];
      const cx = Math.max(r.x, Math.min(px, r.x + r.w));
      const cy = Math.max(r.y, Math.min(py, r.y + r.h));
      const dx = px - cx;
      const dy = py - cy;
      const distSq = dx * dx + dy * dy;
      if (distSq >= radius * radius) continue;
      if (distSq === 0) {
        // Centre inside the rectangle: push out along the shallowest side.
        const left = px - r.x;
        const right = r.x + r.w - px;
        const top = py - r.y;
        const bottom = r.y + r.h - py;
        const min = Math.min(left, right, top, bottom);
        if (min === left) px = r.x - radius;
        else if (min === right) px = r.x + r.w + radius;
        else if (min === top) py = r.y - radius;
        else py = r.y + r.h + radius;
      } else {
        const dist = Math.sqrt(distSq);
        px = cx + (dx / dist) * radius;
        py = cy + (dy / dist) * radius;
      }
    }
  }
  return { x: px, y: py };
}

/** Clamp a point into the field, keeping a margin of `radius` from every edge. */
export function clampToField(x, y, radius, width, height) {
  return {
    x: Math.max(radius, Math.min(width - radius, x)),
    y: Math.max(radius, Math.min(height - radius, y)),
  };
}
