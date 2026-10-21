import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, glow } from '../theme';
import { T, Skeleton } from './ui';
import { MenuDrawer } from './MenuDrawer';

const greeting = (d = new Date()) => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

function PulseBadge({ count }: { count: number }) {
  const ring = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(ring, { toValue: 1, duration: 1400, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [ring]);
  return (
    <View style={s.badgeWrap} pointerEvents="none">
      <Animated.View style={[s.ring, {
        opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
        transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 2.2] }) }],
      }]} />
      <View style={[s.badge, glow(colors.magenta, 8)]}>
        <T size={9} bold>{count > 9 ? '9+' : String(count)}</T>
      </View>
    </View>
  );
}

type Props = { name?: string; level: number; streak: number; unread?: number; loading?: boolean; onBell?: () => void };

export function Header({ name, level, streak, unread = 0, loading, onBell }: Props) {
  const [menu, setMenu] = useState(false);
  return (
    <View style={s.bar}>
      <View style={s.row}>
        <View style={[s.avatar, glow(colors.lime, 8)]}>
          <T size={16} bold color={colors.lime}>{level}</T>
        </View>
        <View>
          <T muted size={11}>{greeting()}</T>
          {loading ? <Skeleton width={110} height={16} /> : <T size={17} bold>{name ?? 'Athlete'}</T>}
        </View>
      </View>
      <View style={[s.row, { gap: 18 }]}>
        <View style={s.row}>
          <Ionicons name="flame" size={18} color={streak ? colors.flame : colors.muted} />
          <T bold color={streak ? colors.flame : colors.muted}>{streak}</T>
        </View>
        <Pressable onPress={onBell} hitSlop={10} accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {unread > 0 && <PulseBadge count={unread} />}
        </Pressable>
        <Pressable onPress={() => setMenu(true)} hitSlop={10} accessibilityLabel="Menu">
          <Ionicons name="menu" size={26} color={colors.text} />
        </Pressable>
      </View>
      <MenuDrawer visible={menu} onClose={() => setMenu(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  badgeWrap: { position: 'absolute', top: -4, right: -4, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.magenta },
  badge: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.magenta, alignItems: 'center', justifyContent: 'center' },
});
