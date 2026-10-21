import { useCallback, useState } from 'react';
import { Dimensions, View } from 'react-native';
import { Alert } from '../../src/lib/dialog';
import { useFocusEffect } from 'expo-router';
import Svg, { Polyline, Circle } from 'react-native-svg';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { Screen, T, Card, Button, Field } from '../../src/components/ui';
import { colors } from '../../src/theme';

export default function Progress() {
  const { session, refresh } = useAuth();
  const uid = session!.user.id;
  const [rows, setRows] = useState<any[]>([]);
  const [w, setW] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('progress').select('*').eq('user_id', uid).order('id');
    setRows(data ?? []);
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const add = async () => {
    const kg = parseFloat(w.replace(',', '.'));
    if (!(kg >= 25 && kg <= 300)) return Alert.alert('Enter a valid weight in kg');
    setBusy(true);
    const { error } = await supabase.from('progress').insert({ user_id: uid, weight_kg: kg });
    if (!error) await supabase.from('profiles').update({ weight_kg: kg }).eq('id', uid);
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    setW(''); await refresh(); load(); Alert.alert('Weigh-in saved', '+20 XP');
  };

  const pts = rows.slice(-12), W = Dimensions.get('window').width - 40 - 32, H = 120;
  const ws = pts.map(r => Number(r.weight_kg));
  const min = Math.min(...ws) - 1, max = Math.max(...ws) + 1;
  const xy = pts.map((r, i) => [pts.length > 1 ? (i / (pts.length - 1)) * W : W / 2, H - ((Number(r.weight_kg) - min) / (max - min)) * H]);
  const change = pts.length > 1 ? ws[ws.length - 1] - ws[0] : 0;

  return (
    <Screen>
      <T size={26} bold style={{ marginTop: 8 }}>Progress</T>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T muted size={12}>Weight, last {pts.length || 0} weigh-ins</T>
          {pts.length > 1 && <T color={colors.cyan} size={12} bold>{change > 0 ? '+' : ''}{change.toFixed(1)} kg</T>}
        </View>
        {pts.length === 0 ? <T muted>No weigh-ins yet. Add your first below.</T> : (
          <Svg width={W} height={H + 8}>
            <Polyline points={xy.map(p => p.join(',')).join(' ')} fill="none" stroke={colors.cyan} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            {xy.map((p, i) => <Circle key={i} cx={p[0]} cy={p[1]} r={4} fill={colors.cyan} />)}
          </Svg>
        )}
      </Card>
      <Card>
        <T bold>New weigh-in</T>
        <Field label="Weight, kg" value={w} onChangeText={setW} keyboardType="decimal-pad" placeholder="e.g. 67.5" />
        <Button title="Save (+20 XP)" onPress={add} loading={busy} disabled={!w} />
      </Card>
    </Screen>
  );
}
