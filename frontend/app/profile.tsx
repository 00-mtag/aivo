// Account panel: overview, personal information, fitness goals and preferences, change password.
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Alert } from '../src/lib/dialog';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/lib/auth';
import { levelProgress, rankFor } from '../src/lib/game';
import { Screen, T, Card, Field, Button, Chip, Bar } from '../src/components/ui';
import { PanelHeader } from '../src/components/PanelHeader';
import { colors, glow } from '../src/theme';

const GOALS = [
  { k: 'lose_weight', t: 'Lose weight' }, { k: 'build_muscle', t: 'Build muscle' },
  { k: 'endurance', t: 'Endurance' }, { k: 'stay_healthy', t: 'Stay healthy' },
];
const DIETS = ['Halal', 'Vegetarian', 'No pork', 'Dairy-free', 'None'];
const num = (s: string) => parseFloat(s.replace(',', '.'));

export default function Profile() {
  const { session, profile, refresh } = useAuth();
  const uid = session!.user.id;
  const lp = levelProgress(profile?.xp ?? 0);
  const [busy, setBusy] = useState('');
  const [p, setP] = useState({ username: profile?.username ?? '', phone: profile?.phone ?? '', age: String(profile?.age ?? ''), height: String(profile?.height_cm ?? ''), weight: String(profile?.weight_kg ?? '') });
  const [g, setG] = useState({ goal: profile?.fitness_goal ?? '', activity: profile?.activity_level ?? 'moderate', perWeek: profile?.workouts_per_week ?? 4, diets: (profile?.dietary_preferences ?? []) as string[], notes: profile?.health_notes ?? '' });
  const [pw, setPw] = useState({ a: '', b: '' });

  const update = async (key: string, patch: object, msg: string) => {
    setBusy(key);
    const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
    setBusy('');
    if (error) return Alert.alert('Error', error.message);
    await refresh(); Alert.alert('Saved', msg);
  };

  const savePersonal = () => {
    const age = num(p.age), h = num(p.height), w = num(p.weight);
    if (!p.username.trim()) return Alert.alert('Enter a username');
    if (!(age >= 13 && age <= 100 && h >= 100 && h <= 250 && w >= 25 && w <= 300))
      return Alert.alert('Check your numbers', 'Age 13 to 100, height 100 to 250 cm, weight 25 to 300 kg.');
    update('personal', { username: p.username.trim(), phone: p.phone.trim(), age: Math.round(age), height_cm: h, weight_kg: w }, 'Personal information updated.');
  };
  const saveGoals = () =>
    update('goals', { fitness_goal: g.goal || null, activity_level: g.activity, workouts_per_week: g.perWeek, dietary_preferences: g.diets, health_notes: g.notes }, 'Goals updated. Use "New plan" in the Workout tab to apply them.');

  const savePw = async () => {
    if (pw.a.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    if (pw.a !== pw.b) return Alert.alert('Passwords do not match');
    setBusy('pw');
    const { error } = await supabase.auth.updateUser({ password: pw.a });
    setBusy('');
    if (error) return Alert.alert('Error', error.message);
    setPw({ a: '', b: '' }); Alert.alert('Password changed');
  };

  return (
    <Screen>
      <PanelHeader title="Profile" />

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={[{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, glow(colors.lime, 8)]}>
          <T size={22} bold color={colors.lime}>{lp.level}</T>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T size={18} bold>{profile?.username ?? 'Athlete'}</T>
          <T muted size={12}>{session?.user.email}</T>
          <T muted size={12}>{rankFor(lp.level)} rank, {lp.into} / {lp.span} XP to level {lp.level + 1}</T>
          <Bar pct={lp.pct} />
        </View>
      </Card>

      <Card>
        <T bold size={16}>Personal information</T>
        <Field label="Username" icon="person" value={p.username} onChangeText={v => setP({ ...p, username: v })} />
        <Field label="Phone" icon="call" value={p.phone} onChangeText={v => setP({ ...p, phone: v })} keyboardType="phone-pad" />
        <Field label="Age" value={p.age} onChangeText={v => setP({ ...p, age: v })} keyboardType="number-pad" />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Height, cm" value={p.height} onChangeText={v => setP({ ...p, height: v })} keyboardType="decimal-pad" /></View>
          <View style={{ flex: 1 }}><Field label="Weight, kg" value={p.weight} onChangeText={v => setP({ ...p, weight: v })} keyboardType="decimal-pad" /></View>
        </View>
        <Button title="Save changes" onPress={savePersonal} loading={busy === 'personal'} />
      </Card>

      <Card>
        <T bold size={16}>Fitness goals and preferences</T>
        <T muted size={12}>Main goal</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GOALS.map(o => <Chip key={o.k} label={o.t} on={g.goal === o.k} onPress={() => setG({ ...g, goal: o.k })} />)}
        </View>
        <T muted size={12}>Activity level</T>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['light', 'moderate', 'active'].map(a => <Chip key={a} label={a[0].toUpperCase() + a.slice(1)} on={g.activity === a} onPress={() => setG({ ...g, activity: a })} />)}
        </View>
        <T muted size={12}>Workouts per week</T>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.bg, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
          <Pressable onPress={() => setG({ ...g, perWeek: Math.max(1, g.perWeek - 1) })}><Ionicons name="remove-circle-outline" size={26} color={colors.muted} /></Pressable>
          <T size={20} bold>{g.perWeek}</T>
          <Pressable onPress={() => setG({ ...g, perWeek: Math.min(7, g.perWeek + 1) })}><Ionicons name="add-circle-outline" size={26} color={colors.lime} /></Pressable>
        </View>
        <T muted size={12}>Food preferences</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DIETS.map(d => <Chip key={d} label={d} on={g.diets.includes(d)} onPress={() => setG({ ...g, diets: g.diets.includes(d) ? g.diets.filter(x => x !== d) : [...g.diets, d] })} />)}
        </View>
        <Field label="Allergies or injuries" value={g.notes} onChangeText={v => setG({ ...g, notes: v })} placeholder="e.g. peanuts, bad knee" autoCapitalize="sentences" />
        <Button title="Save preferences" onPress={saveGoals} loading={busy === 'goals'} />
      </Card>

      <Card>
        <T bold size={16}>Change password</T>
        <Field label="New password" icon="lock-closed" value={pw.a} onChangeText={v => setPw({ ...pw, a: v })} secureTextEntry />
        <Field label="Confirm new password" icon="lock-closed" value={pw.b} onChangeText={v => setPw({ ...pw, b: v })} secureTextEntry />
        <Button title="Update password" onPress={savePw} loading={busy === 'pw'} disabled={!pw.a || !pw.b} />
      </Card>
    </Screen>
  );
}
