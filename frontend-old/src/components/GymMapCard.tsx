// Dashboard card. Tapping it opens the full-screen gym map.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Card, T } from './ui';
import { colors, glow } from '../theme';

export function GymMapCard() {
  const router = useRouter();
  const [granted, setGranted] = useState(false);
  const pulse = useRef(new Animated.Value(0)).current;

  useFocusEffect(useCallback(() => {
    Location.getForegroundPermissionsAsync().then(p => setGranted(p.granted)).catch(() => {});
  }, []));
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Pressable onPress={() => router.push('/gyms' as any)} accessibilityRole="button" accessibilityLabel="Find best gym near you">
      <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
        <View style={s.map}>
          <View style={[s.road, { top: 24, left: -40, width: 460, transform: [{ rotate: '16deg' }] }]} />
          <View style={[s.road, { top: 96, left: -60, width: 480, transform: [{ rotate: '-11deg' }] }]} />
          <View style={[s.road, { top: 70, left: 110, width: 300, transform: [{ rotate: '72deg' }] }]} />
          <View style={s.center}>
            <Animated.View style={[s.ring, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] }) }] }]} />
            <View style={[s.pin, glow(colors.lime, 12)]}><Ionicons name="barbell" size={20} color={colors.onLime} /></View>
          </View>
          <T muted size={12} style={s.hint}>{granted ? 'Tap to see gyms around you' : 'Tap to turn on location and find gyms'}</T>
        </View>
        <View style={s.foot}>
          <T bold size={15}>Find best gym near you</T>
          <Ionicons name="chevron-forward" size={24} color={colors.lime} />
        </View>
      </Card>
    </Pressable>
  );
}

const s = StyleSheet.create({
  map: { height: 160, backgroundColor: colors.surface, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  road: { position: 'absolute', height: 6, borderRadius: 3, backgroundColor: colors.border },
  center: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime },
  pin: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', bottom: 10 },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
});
