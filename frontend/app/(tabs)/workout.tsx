import { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Alert } from '../../src/lib/dialog';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { Screen, T, Card, Button } from '../../src/components/ui';
import { colors } from '../../src/theme';

export default function Workout() {
  const { session, refresh } = useAuth();
  const uid = session!.user.id;
  const [items, setItems] = useState<any[]>([]);
  const [done, setDone] = useState<Record<number, boolean>>({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('workout_plans').select('*').eq('user_id', uid).order('id');
    setItems(data ?? []); setDone({});
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const finish = async () => {
    setBusy(true);
    const names = items.filter(i => done[i.id]).map(i => i.exercise).join(', ') || 'Workout';
    const { error } = await supabase.from('activity_logs').insert({ user_id: uid, kind: 'workout', exercises_performed: names });
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    await refresh(); Alert.alert('Quest complete', '+50 XP');
  };

  const regenerate = async () => {
    setBusy(true);
    const { error } = await supabase.functions.invoke('generate-plan');
    setBusy(false);
    if (error) Alert.alert('Could not build plan', error.message); else load();
  };

  const count = Object.values(done).filter(Boolean).length;
  return (
    <Screen>
      <T size={26} bold style={{ marginTop: 8 }}>Workout</T>
      {items.length > 0 && <T muted>{items[0].schedule}</T>}
      {items.length === 0 && <Card><T muted>No workout plan yet.</T><Button title="Generate my plan" onPress={regenerate} loading={busy} /></Card>}
      {items.map(i => (
        <Pressable key={i.id} onPress={() => setDone(d => ({ ...d, [i.id]: !d[i.id] }))}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderColor: done[i.id] ? colors.lime : colors.border }}>
            <Ionicons name={done[i.id] ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={done[i.id] ? colors.lime : colors.muted} />
            <View style={{ flex: 1 }}>
              <T bold>{i.exercise}</T>
              <T muted size={12}>{i.sets} sets x {i.repetitions} reps</T>
            </View>
          </Card>
        </Pressable>
      ))}
      {items.length > 0 && <>
        <Button title={`Finish workout (+50 XP)`} onPress={finish} loading={busy} disabled={count === 0} />
        <Button title="New plan" variant="outline" onPress={regenerate} disabled={busy} />
      </>}
    </Screen>
  );
}
