import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Alert } from '../../src/lib/dialog';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { Screen, T, Card, Button, Bar } from '../../src/components/ui';
import { colors } from '../../src/theme';

const Macro = ({ label, g, max }: { label: string; g: number; max: number }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <T muted size={12} style={{ width: 14 }}>{label}</T>
    <View style={{ flex: 1 }}><Bar pct={g / max} color={colors.cyan} /></View>
    <T size={12} style={{ width: 36, textAlign: 'right' }}>{Math.round(g)}g</T>
  </View>
);

export default function Meals() {
  const { session, refresh } = useAuth();
  const uid = session!.user.id;
  const [items, setItems] = useState<any[]>([]);
  const [busy, setBusy] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    supabase.from('meal_plans').select('*').eq('user_id', uid).order('id').then(({ data }) => setItems(data ?? []));
  }, []));

  const log = async (m: any) => {
    setBusy(m.id);
    const { error } = await supabase.from('activity_logs').insert({ user_id: uid, kind: 'meal', meals_logged: m.meal_recommendation, calories_consumed: m.calories });
    setBusy(null);
    if (error) return Alert.alert('Error', error.message);
    await refresh(); Alert.alert('Meal logged', '+10 XP');
  };

  return (
    <Screen>
      <T size={26} bold style={{ marginTop: 8 }}>Meal plan</T>
      {items.length === 0 && <Card><T muted>No meal plan yet. Generate your plan from the Workout tab.</T></Card>}
      {items.map(m => (
        <Card key={m.id}>
          <T color={colors.cyan} size={12} bold>{(m.meal_type ?? 'Meal').toUpperCase()}</T>
          <T bold size={16}>{m.meal_recommendation}</T>
          <T muted size={12}>{m.calories} kcal</T>
          {!!m.recipes && <T muted size={13}>{m.recipes}</T>}
          <Macro label="P" g={m.protein_g ?? 0} max={60} />
          <Macro label="C" g={m.carbs_g ?? 0} max={100} />
          <Macro label="F" g={m.fat_g ?? 0} max={40} />
          <Button title="Log this meal" variant="outline" onPress={() => log(m)} loading={busy === m.id} />
        </Card>
      ))}
    </Screen>
  );
}
