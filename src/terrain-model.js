const RIDGE_POINTS = [
  [0, 0.39],
  [0.08, 0.34],
  [0.16, 0.38],
  [0.225, 0.53],
  [0.3, 0.65],
  [0.365, 0.86],
  [0.42, 0.91],
  [0.472, 0.7],
  [0.525, 0.56],
  [0.59, 0.51],
  [0.665, 0.42],
  [0.74, 0.38],
  [0.825, 0.33],
  [0.9, 0.36],
  [1, 0.31],
];

export function createTerrainProfile(width, height) {
  const safeWidth = Math.max(1, Math.round(width));
  const profile = new Float32Array(safeWidth + 1);
  let pointIndex = 0;

  for (let x = 0; x <= safeWidth; x += 1) {
    const normalizedX = x / safeWidth;
    while (
      pointIndex < RIDGE_POINTS.length - 2 &&
      normalizedX > RIDGE_POINTS[pointIndex + 1][0]
    ) {
      pointIndex += 1;
    }

    const [startX, startY] = RIDGE_POINTS[pointIndex];
    const [endX, endY] = RIDGE_POINTS[pointIndex + 1];
    const progress = (normalizedX - startX) / (endX - startX);
    const ridgeY = startY + (endY - startY) * smoothStep(progress);
    const fineRock =
      Math.sin(x * 0.12) * height * 0.0028 +
      Math.sin(x * 0.037 + 1.7) * height * 0.004;
    profile[x] = ridgeY * height + fineRock;
  }

  return profile;
}

export function carveCrater(profile, centerX, centerY, radius, height) {
  const startX = Math.max(0, Math.floor(centerX - radius));
  const endX = Math.min(profile.length - 1, Math.ceil(centerX + radius));
  let changed = false;

  for (let x = startX; x <= endX; x += 1) {
    const distance = x - centerX;
    const arc = Math.sqrt(Math.max(0, radius * radius - distance * distance));
    const craterFloor = Math.min(height - 5, centerY + arc * 0.72);
    if (craterFloor > profile[x]) {
      profile[x] = craterFloor;
      changed = true;
    }
  }

  return changed;
}

function smoothStep(value) {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}
