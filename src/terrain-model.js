const RIDGE_POINTS = [
  [0, 0.34],
  [0.08, 0.29],
  [0.17, 0.36],
  [0.27, 0.31],
  [0.38, 0.42],
  [0.49, 0.34],
  [0.6, 0.3],
  [0.7, 0.4],
  [0.81, 0.29],
  [0.91, 0.35],
  [1, 0.27],
];

export function createTerrainProfile(width, height) {
  const safeWidth = Math.max(1, Math.round(width));
  const profile = new Float32Array(safeWidth + 1);
  const aspectRatio = safeWidth / Math.max(1, height);
  const mobileSkyOffset = safeWidth <= 900 ? 0.075 : 0;
  const portraitSkyOffset = Math.max(0, Math.min(0.07, (0.9 - aspectRatio) * 0.18));
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
    profile[x] = (ridgeY + mobileSkyOffset + portraitSkyOffset) * height + fineRock;
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
