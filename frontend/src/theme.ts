// Neon pulse palette
export const colors = {
  bg: '#0B0B0F', surface: '#12121A', card: '#15151C', border: '#2A2A35',
  text: '#F4F4F6', muted: '#9B9BA8',
  lime: '#C6FF3D',   // primary action, XP, rewards
  cyan: '#3DD9FF',   // data, progress, AI coach
  flame: '#FF9F1C',  // streaks
  danger: '#FF5C6C', // errors only
  magenta: '#FF2D95', // notification badge
  onLime: '#0B0B0F',  // text on lime surfaces
};
export const radius = { card: 16, btn: 12, chip: 20, pill: 28 };
export const glow = (color: string, blur = 12) => ({
  shadowColor: color, shadowOpacity: 0.8, shadowRadius: blur, shadowOffset: { width: 0, height: 0 }, elevation: 8,
});
