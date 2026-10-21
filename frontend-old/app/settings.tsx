import { ReactNode, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Alert } from '../src/lib/dialog';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/lib/auth';
import { Screen, T, Card } from '../src/components/ui';
import { PanelHeader } from '../src/components/PanelHeader';
import { ConfirmDialog } from '../src/components/ConfirmDialog';
import { colors } from '../src/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const Row = ({ icon, label, value, onPress }: { icon: IconName; label: string; value?: string; onPress?: () => void }) => (
  <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 }}>
    <Ionicons name={icon} size={22} color={colors.cyan} />
    <View style={{ flex: 1 }}>
      <T bold>{label}</T>
      {!!value && <T muted size={12}>{value}</T>}
    </View>
    {onPress && <Ionicons name="chevron-forward" size={18} color={colors.muted} />}
  </Pressable>
);
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <View style={{ gap: 8 }}><T muted size={12} bold>{title}</T><Card style={{ gap: 4 }}>{children}</Card></View>
);

export default function Settings() {
  const router = useRouter();
  const { session, refresh } = useAuth();

  const [askRedo, setAskRedo] = useState(false);
  const redo = async () => {
    setAskRedo(false);
    const { error } = await supabase.from('profiles').update({ onboarded: false }).eq('id', session!.user.id);
    if (error) return Alert.alert('Error', error.message);
    await refresh(); // the app moves to the setup questions by itself
  };

  return (
    <Screen>
      <PanelHeader title="Settings" />
      <Section title="ACCOUNT">
        <Row icon="mail-outline" label="Email" value={session?.user.email} />
        <Row icon="person-circle-outline" label="Profile and password" value="Edit your details and goals" onPress={() => router.push('/profile' as any)} />
      </Section>
      <Section title="SETUP">
        <Row icon="refresh-outline" label="Redo setup questions" value="Update gender, birth year, height and weight" onPress={() => setAskRedo(true)} />
      </Section>
      <Section title="ABOUT">
        <Row icon="information-circle-outline" label="Version" value={Constants.expoConfig?.version ?? '1.0.0'} />
        <Row icon="shield-checkmark-outline" label="Health notice" value="AIVO gives general guidance only, not medical advice." />
      </Section>
      <ConfirmDialog visible={askRedo} icon="refresh-outline" title="Redo setup questions?"
        message="You will answer the setup questions again. Your logs and progress are kept."
        confirmText="Redo" onCancel={() => setAskRedo(false)} onConfirm={redo} />
    </Screen>
  );
}
