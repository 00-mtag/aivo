// In-app pop up, styled like the rest of AIVO (radius 20, dark card, neon accent).
import { useEffect, useRef } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { T } from './ui';
import { colors } from '../theme';

type IconName = keyof typeof Ionicons.glyphMap;
type Props = {
  visible: boolean; title: string; message?: string;
  confirmText?: string; cancelText?: string; danger?: boolean; tint?: string; single?: boolean; icon?: IconName;
  onConfirm: () => void; onCancel: () => void;
};

export function ConfirmDialog({ visible, title, message, confirmText = 'Confirm', cancelText = 'Cancel', danger, tint, single, icon = 'help-circle-outline', onConfirm, onCancel }: Props) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) { a.setValue(0); Animated.timing(a, { toValue: 1, duration: 180, useNativeDriver: true }).start(); }
  }, [visible]);
  const color = tint ?? (danger ? colors.danger : colors.lime);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onCancel}>
      <Animated.View style={[s.overlay, { opacity: a }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Dismiss" />
        <Animated.View style={[s.card, { transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }]}>
          <View style={[s.icon, { backgroundColor: color + '26' }]}>
            <Ionicons name={icon} size={26} color={color} />
          </View>
          <T size={20} bold style={{ textAlign: 'center' }}>{title}</T>
          {!!message && <T muted style={{ textAlign: 'center', lineHeight: 20 }}>{message}</T>}
          <View style={s.row}>
            {!single && (
              <Pressable onPress={onCancel} accessibilityRole="button" style={[s.btn, s.cancel]}>
                <T bold>{cancelText}</T>
              </Pressable>
            )}
            <Pressable onPress={onConfirm} accessibilityRole="button" style={[s.btn, { backgroundColor: color }]}>
              <T bold color={colors.onLime}>{confirmText}</T>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.72)' },
  card: {
    width: '86%', maxWidth: 360, alignItems: 'center', gap: 12, padding: 22, borderRadius: 20,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    shadowColor: '#000', shadowOpacity: 0.6, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 16,
  },
  icon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  row: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 8 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancel: { borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
});
