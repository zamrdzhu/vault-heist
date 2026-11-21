// Loot: what the job is for. Every room hides a main piece — the exit stays locked until
// it is lifted — plus smaller pieces for the score. A piece is picked up by walking close
// enough to it; the world decides when that happens and what it is worth.

export function createLoot(defs) {
  return defs.map((def, index) => ({
    id: index,
    x: def.x,
    y: def.y,
    kind: def.kind,
    value: def.value,
    main: !!def.main,
    label: def.label,
    taken: false,
    /** Sparkle phase, so pieces shimmer at different times. */
    phase: index * 1.7,
  }));
}

/** The room's main piece, or null when it is already taken. */
export function mainLoot(loot) {
  for (let i = 0; i < loot.length; i += 1) {
    if (loot[i].main && !loot[i].taken) return loot[i];
  }
  return null;
}

/** True once the room's main piece has been lifted and the exit is open. */
export function exitUnlocked(loot) {
  return mainLoot(loot) === null;
}

/** The nearest untaken piece within `radius` of the point, or null. */
export function lootInReach(loot, x, y, radius) {
  let best = null;
  let bestDist = Infinity;
  for (let i = 0; i < loot.length; i += 1) {
    const item = loot[i];
    if (item.taken) continue;
    const dist = Math.hypot(item.x - x, item.y - y);
    if (dist <= radius && dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  }
  return best;
}
