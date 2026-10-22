// Slide-in menu from the header: Profile, Settings, Log out.
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { levelProgress, rankFor } from '../lib/game';
import { colors, glow } from '../theme';
import { T } from './ui';
import { ConfirmDialog } from './ConfirmDialog';

type IconName = keyof typeof Ionicons.glyphMap;

export function MenuDrawer({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { top, bottom } = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { session, profile } = useAuth();
  const router = useRouter();
  const W = Math.min(320, width * 0.8);
  const x = useRef(new Animated.Value(W)).current;
  const lp = levelProgress(profile?.xp ?? 0);

  useEffect(() => {
    if (visible) Animated.timing(x, { toValue: 0, duration: 220, useNativeDriver: true }).start();
  }, [visible]);

  const close = (after?: () => void) =>
    Animated.timing(x, { toValue: W, duration: 180, useNativeDriver: true }).start(() => { onClose(); after?.(); });

  const [askLogout, setAskLogout] = useState(false);
  const logout = () => close(() => setAskLogout(true));

  const Item = ({ icon, label, onPress, color = colors.text, arrow = true }: { icon: IconName; label: string; onPress: () => void; color?: string; arrow?: boolean }) => (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [s.item, pressed && { backgroundColor: colors.card }]}>
      <Ionicons name={icon} size={22} color={color} />
      <T bold color={color} style={{ flex: 1 }}>{label}</T>
      {arrow && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
    </Pressable>
  );

  return (
    <>
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => close()}>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.65)', opacity: x.interpolate({ inputRange: [0, W], outputRange: [1, 0] }) }]}>
          <Pressable style={{ flex: 1 }} onPress={() => close()} accessibilityLabel="Close menu" />
        </Animated.View>

        <Animated.View style={[s.panel, { width: W, paddingTop: top + 20, paddingBottom: bottom + 16, transform: [{ translateX: x }] }]}>
          <View style={s.who}>
            <View style={[s.avatar, glow(colors.lime, 8)]}><T size={18} bold color={colors.lime}>{lp.level}</T></View>
            <View style={{ flex: 1 }}>
              <T size={17} bold>{profile?.username ?? 'Athlete'}</T>
              <T muted size={12}>Level {lp.level}, {rankFor(lp.level)} rank</T>
              <T muted size={11}>{session?.user.email}</T>
            </View>
          </View>

          <View style={{ gap: 4, marginTop: 8 }}>
            <Item icon="person-circle-outline" label="Profile" onPress={() => close(() => router.push('/profile' as any))} />
            <Item icon="settings-outline" label="Settings" onPress={() => close(() => router.push('/settings' as any))} />
          </View>
          <View style={{ flex: 1 }} />
          <View style={s.line} />
          <Item icon="log-out-outline" label="Log out" color={colors.danger} arrow={false} onPress={logout} />
        </Animated.View>
      </View>
    </Modal>
    <ConfirmDialog visible={askLogout} icon="log-out-outline" danger title="Log out?" message="You will need to log in again to continue."
      confirmText="Log out" onCancel={() => setAskLogout(false)}
      onConfirm={() => { setAskLogout(false); supabase.auth.signOut(); }} />
    </>
  );
}

const s = StyleSheet.create({
  panel: { position: 'absolute', right: 0, top: 0, bottom: 0, backgroundColor: colors.surface, paddingHorizontal: 14,
    borderLeftWidth: 1, borderColor: colors.border, borderTopLeftRadius: 28, borderBottomLeftRadius: 28 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, paddingBottom: 18, borderBottomWidth: 1, borderColor: colors.border },
  avatar: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 10, borderRadius: 14 },
  line: { height: 1, backgroundColor: colors.border, marginBottom: 6 },
});
