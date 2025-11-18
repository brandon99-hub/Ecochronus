export function calculateLevelFromXP(xp: number): number {
  if (xp < 0) return 1;
  
  let level = 1;
  let requiredXP = 100;
  
  while (xp >= requiredXP) {
    level++;
    requiredXP += 100 * level;
  }
  
  return level;
}

export function getXPForLevel(level: number): number {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 1; i < level; i++) {
    totalXP += 100 * i;
  }
  
  return totalXP;
}

export function getXPRequiredForNextLevel(currentLevel: number): number {
  return 100 * (currentLevel + 1);
}

export function getXPProgress(currentXP: number, currentLevel: number): {
  currentLevelXP: number;
  nextLevelXP: number;
  progressPercent: number;
} {
  const currentLevelXP = getXPForLevel(currentLevel);
  const nextLevelXP = getXPForLevel(currentLevel + 1);
  const xpInCurrentLevel = currentXP - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercent = xpNeededForNextLevel > 0 
    ? Math.min(100, Math.round((xpInCurrentLevel / xpNeededForNextLevel) * 100))
    : 100;
  
  return {
    currentLevelXP,
    nextLevelXP,
    progressPercent,
  };
}

