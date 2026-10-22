// Shared pieces for the login and register screens (same look as the AIVO web design).
import { ReactNode, useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Svg, { Circle, Defs, Line, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { Screen, T } from './ui';
import { colors } from '../theme';

const W = Dimensions.get('window').width;

// Neon glow orbs and a faint grid that fades out, behind the logo.
function AuthBackground() {
  const H = 430;
  const lines = [];
  for (let x = 0; x <= W; x += 40) lines.push(<Line key={`v${x}`} x1={x} y1={0} x2={x} y2={H} stroke={colors.border} strokeWidth={1} opacity={0.55} />);
  for (let y = 0; y <= H; y += 40) lines.push(<Line key={`h${y}`} x1={0} y1={y} x2={W} y2={y} stroke={colors.border} strokeWidth={1} opacity={0.55} />);
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, width: W, height: H }}>
      <Svg width={W} height={H}>
        <Defs>
          <RadialGradient id="lime" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.lime} stopOpacity={0.32} />
            <Stop offset="1" stopColor={colors.lime} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="cyan" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.cyan} stopOpacity={0.22} />
            <Stop offset="1" stopColor={colors.cyan} stopOpacity={0} />
          </RadialGradient>
          <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0.35" stopColor={colors.bg} stopOpacity={0} />
            <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        {lines}
        <Circle cx={W * 0.12} cy={150} r={190} fill="url(#lime)" />
        <Circle cx={W * 0.95} cy={250} r={150} fill="url(#cyan)" />
        <Rect x={0} y={0} width={W} height={H} fill="url(#fade)" />
      </Svg>
    </View>
  );
}

// Fades and slides its content up. Use delay to stagger blocks.
export function Rise({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: ViewStyle }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 520, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

export function AuthScreen({ children, back, compact }: { children: ReactNode; back?: boolean; compact?: boolean }) {
  const router = useRouter();
  return (
    <Screen>
      <AuthBackground />
      {back && (
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} hitSlop={10} accessibilityLabel="Back"
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      )}
      <Rise style={{ alignItems: 'center', marginTop: compact ? 0 : 24, marginBottom: compact ? 4 : 14 }}>
        <Text style={{
          color: colors.lime, fontSize: compact ? 52 : 68, fontWeight: '900', letterSpacing: -1, lineHeight: compact ? 60 : 78,
          textShadowColor: 'rgba(198,255,61,0.45)', textShadowRadius: 28, textShadowOffset: { width: 0, height: 0 },
        }}>AIVO</Text>
        <T bold size={compact ? 15 : 18} muted>Level up you.</T>
      </Rise>
      {children}
    </Screen>
  );
}

export function Divider() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <T muted size={12}>or</T>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}

export function GoogleButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.card,
        borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 15, opacity: pressed ? 0.7 : 1 })}>
      <Svg width={20} height={20} viewBox="0 0 48 48">
        <Path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.2C12.4 13.6 17.7 9.5 24 9.5z" />
        <Path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.6 5.9c4.4-4.1 7-10.1 7-17.6z" />
        <Path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.2a24 24 0 0 0 0 21.6l7.9-6.2z" />
        <Path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.6-5.9c-2.1 1.4-4.9 2.3-8.3 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.2C6.5 42.6 14.6 48 24 48z" />
      </Svg>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Continue with Google</Text>
    </Pressable>
  );
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'ok'; children: string }) {
  const c = tone === 'error' ? colors.danger : colors.lime;
  return (
    <View accessibilityRole="alert" style={{ borderWidth: 1, borderColor: c + '66', backgroundColor: c + '1A', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 }}>
      <T size={13} color={c}>{children}</T>
    </View>
  );
}

const LEVELS = [
  { label: '', color: colors.border }, { label: 'Weak', color: '#FF5C6C' }, { label: 'Fair', color: '#FF9F1C' },
  { label: 'Good', color: '#FFD166' }, { label: 'Strong', color: '#3DDC97' },
];
// Under 8 characters is always Weak. From 8 up, each of uppercase letter, number and symbol raises the level by one.
function checkPassword(p: string) {
  if (!p) return { level: 0, hint: '' };
  if (p.length < 8) return { level: 1, hint: 'Use at least 8 characters' };
  const missing: string[] = [];
  if (!/[A-Z]/.test(p)) missing.push('Add an uppercase letter');
  if (!/[0-9]/.test(p)) missing.push('Add a number');
  if (!/[^A-Za-z0-9]/.test(p)) missing.push('Add a symbol like ! or @');
  return { level: 4 - missing.length, hint: missing[0] ?? 'Great, that is a strong password' };
}
export function PasswordStrength({ password }: { password: string }) {
  const { level, hint } = checkPassword(password);
  const lv = LEVELS[level];
  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {[1, 2, 3, 4].map(i => <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= level ? lv.color : colors.border }} />)}
      </View>
      {level > 0 && (
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <T size={12} bold color={lv.color}>{lv.label}</T>
          <T size={11} muted>{hint}</T>
        </View>
      )}
    </View>
  );
}
