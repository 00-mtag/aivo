import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { T } from './ui';
import { colors } from '../theme';

export function PanelHeader({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} hitSlop={10} accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={28} color={colors.text} />
      </Pressable>
      <T size={24} bold>{title}</T>
    </View>
  );
}
