export const xpForLevel = (l: number) => 100 * (l - 1) ** 2;
export const levelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;
export const RANKS = ['Iron', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
export const rankFor = (level: number) => RANKS[Math.min(RANKS.length - 1, Math.floor((level - 1) / 5))];

export function levelProgress(xp: number) {
  const level = levelFromXp(xp), a = xpForLevel(level), b = xpForLevel(level + 1);
  return { level, into: xp - a, span: b - a, pct: (xp - a) / (b - a) };
}

export function streakFrom(dates: string[]) {
  const days = new Set(dates.map(d => new Date(d).toDateString()));
  const d = new Date();
  if (!days.has(d.toDateString())) d.setDate(d.getDate() - 1);
  let n = 0;
  while (days.has(d.toDateString())) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

// Mifflin-St Jeor estimate. A rough guide, not medical advice.
export function calorieTarget(p: any) {
  if (!p?.weight_kg || !p?.height_cm || !p?.age) return 2000;
  const s = p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78;
  const bmr = 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + s;
  const mult = ({ light: 1.375, moderate: 1.55, active: 1.725 } as Record<string, number>)[p.activity_level] ?? 1.45;
  const adj = p.fitness_goal === 'lose_weight' ? -400 : p.fitness_goal === 'build_muscle' ? 250 : 0;
  return Math.max(1400, Math.round(bmr * mult + adj));
}
