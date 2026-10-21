// Floating pill navigation: no background band, content scrolls behind it.
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, glow, radius } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;
const TABS: { path: string; icon: IconName; label: string }[] = [
  { path: '/', icon: 'home', label: 'Home' },
  { path: '/workout', icon: 'barbell', label: 'Workout' },
  { path: '/meals', icon: 'restaurant', label: 'Meals' },
  { path: '/progress', icon: 'stats-chart', label: 'Progress' },
  { path: '/ai', icon: 'sparkles', label: 'AI coach' },
];

export function BottomNav() {
  const { bottom } = useSafeAreaInsets();
  const pathname = usePathname();
  const router = useRouter();
  return (
    <View pointerEvents="box-none" style={[s.wrap, { bottom: Math.max(bottom, 12) }]}>
      <View style={s.pill}>
        {TABS.map(t => {
          const focused = pathname === t.path;
          return (
            <Pressable key={t.path} onPress={() => !focused && router.navigate(t.path as any)}
              accessibilityRole="button" accessibilityLabel={t.label} accessibilityState={{ selected: focused }} style={s.item}>
              <Ionicons name={t.icon} size={24} color={focused ? colors.lime : colors.muted} />
              <View style={[s.bar, focused && [{ backgroundColor: colors.lime }, glow(colors.lime, 8)]]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  pill: {
    flexDirection: 'row', paddingVertical: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: 'rgba(18,18,26,0.94)',
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 14,
  },
  item: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: 22, height: 3, borderRadius: 2, backgroundColor: 'transparent' },
});
