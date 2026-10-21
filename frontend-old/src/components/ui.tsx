import { ReactNode, RefObject, useEffect, useRef, useState } from 'react';
import { useSegments } from 'expo-router';
import { Animated, DimensionValue, Keyboard, Platform, View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;

// Distance the keyboard covers the bottom of this view (0 if the window already resizes for it).
function useKeyboardOverlap(ref: RefObject<View | null>, onShow: (keyboardTop: number) => void) {
  const [pad, setPad] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', e => {
      const top = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, h) => { setPad(Math.max(0, Math.round(y + h - top))); onShow(top); });
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setPad(0));
    return () => { show.remove(); hide.remove(); };
  }, [ref]);
  return pad;
}

export const Screen = ({ children, scroll = true }: { children: ReactNode; scroll?: boolean }) => {
  const inTabs = (useSegments() as string[]).includes('(tabs)');
  const box = useRef<View>(null);
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  // When the keyboard opens, shrink the view above it and scroll the focused field into sight.
  const pad = useKeyboardOverlap(box, (keyboardTop) => {
    setTimeout(() => {
      (TextInput as any).State?.currentlyFocusedInput?.()?.measureInWindow?.((_x: number, y: number, _w: number, h: number) => {
        const over = y + h + 28 - keyboardTop;
        if (over > 0) scrollRef.current?.scrollTo({ y: offset.current + over, animated: true });
      });
    }, 140);
  });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View ref={box} collapsable={false} style={{ flex: 1, paddingBottom: pad }}>
        {scroll
          ? <ScrollView ref={scrollRef} scrollEventThrottle={16} onScroll={e => { offset.current = e.nativeEvent.contentOffset.y; }}
              contentContainerStyle={{ padding: 22, paddingBottom: inTabs ? 120 : 22, gap: 14 }} keyboardShouldPersistTaps="handled">{children}</ScrollView>
          : <View style={{ flex: 1, padding: 22, gap: 14 }}>{children}</View>}
      </View>
    </SafeAreaView>
  );
};

export const T = ({ children, style, muted, size = 14, bold, color }:
  { children: ReactNode; style?: TextStyle; muted?: boolean; size?: number; bold?: boolean; color?: string }) => (
  <Text style={[{ color: color ?? (muted ? colors.muted : colors.text), fontSize: size, fontWeight: bold ? '700' : '400' }, style]}>{children}</Text>
);

export const Button = ({ title, onPress, loading, disabled, variant = 'primary', icon }:
  { title: string; onPress: () => void; loading?: boolean; disabled?: boolean; variant?: 'primary' | 'outline' | 'secondary'; icon?: IconName }) => {
  const bg = variant === 'primary' ? colors.lime : variant === 'secondary' ? colors.card : 'transparent';
  const border = variant === 'primary' ? colors.lime : variant === 'secondary' ? colors.card : colors.border;
  const fg = variant === 'primary' ? colors.bg : colors.text;
  return (
    <Pressable onPress={onPress} disabled={loading || disabled}
      style={({ pressed }) => ({
        backgroundColor: bg, borderWidth: 1, borderColor: border, borderRadius: 14,
        paddingVertical: 15, alignItems: 'center', opacity: pressed || disabled ? 0.7 : 1,
      })}>
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.lime} />
        : <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {icon && <Ionicons name={icon} size={20} color={fg} />}
            <Text style={{ color: fg, fontWeight: '700', fontSize: 16 }}>{title}</Text>
          </View>}
    </Pressable>
  );
};

export const Field = ({ label, icon, ...p }: { label: string; icon?: IconName } & TextInputProps) => {
  const [focus, setFocus] = useState(false);
  const [hide, setHide] = useState(!!p.secureTextEntry);
  return (
    <View style={{ gap: 6 }}>
      <T size={12} bold>{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card,
        borderRadius: radius.btn, borderWidth: 1, borderColor: focus ? colors.lime : 'transparent', paddingHorizontal: 12 }}>
        {icon && <Ionicons name={icon} size={18} color={colors.muted} />}
        <TextInput {...p} secureTextEntry={hide} placeholderTextColor={colors.muted}
          autoCapitalize={p.autoCapitalize ?? 'none'}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
          style={{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 13 }} />
        {p.secureTextEntry && (
          <Pressable onPress={() => setHide(!hide)} hitSlop={10}>
            <Ionicons name={hide ? 'eye' : 'eye-off'} size={20} color={colors.muted} />
          </Pressable>
        )}
      </View>
    </View>
  );
};

export const Chip = ({ label, on, onPress }: { label: string; on?: boolean; onPress: () => void }) => (
  <Pressable onPress={onPress} style={{ borderWidth: 1, borderColor: on ? colors.lime : colors.border,
    backgroundColor: on ? '#1B2308' : colors.card, borderRadius: radius.chip, paddingHorizontal: 14, paddingVertical: 8 }}>
    <Text style={{ color: on ? colors.lime : colors.muted, fontWeight: on ? '700' : '400' }}>{label}</Text>
  </Pressable>
);

export const Card = ({ children, style }: { children: ReactNode; style?: ViewStyle }) => (
  <View style={[{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 16, gap: 10 }, style]}>{children}</View>
);

export const Bar = ({ pct, color = colors.lime }: { pct: number; color?: string }) => (
  <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: 'hidden' }}>
    <View style={{ width: `${Math.max(0, Math.min(1, pct)) * 100}%`, height: 8, backgroundColor: color }} />
  </View>
);

export const Steps = ({ step, total = 3 }: { step: number; total?: number }) => (
  <View style={{ flexDirection: 'row', gap: 4 }}>
    {Array.from({ length: total }, (_, i) => (
      <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? colors.lime : colors.border }} />
    ))}
  </View>
);

export const SectionLabel = ({ children }: { children: string }) => (
  <T size={13} bold style={{ marginTop: 6 }}>{children}</T>
);

export const Skeleton = ({ height = 14, width = '100%' }: { height?: number; width?: DimensionValue }) => {
  const o = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(o, { toValue: 0.9, duration: 700, useNativeDriver: true }),
      Animated.timing(o, { toValue: 0.35, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [o]);
  return <Animated.View style={{ height, width, borderRadius: 8, backgroundColor: colors.border, opacity: o }} />;
};

export const EmptyState = ({ icon, text }: { icon: IconName; text: string }) => (
  <View style={{ gap: 8 }}>
    <Ionicons name={icon} size={22} color={colors.cyan} />
    <T muted size={12}>{text}</T>
  </View>
);
