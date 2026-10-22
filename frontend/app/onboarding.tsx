import { ReactNode, useEffect, useRef, useState } from 'react';
import { View, Pressable, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/lib/auth';
import { Screen, T, Field, Button, Chip, Bar } from '../src/components/ui';
import { Ruler, YearWheel, Toggle } from '../src/components/pickers';
import { colors, radius } from '../src/theme';

const GOALS = [
  { k: 'lose_weight', t: 'Lose weight', d: 'Calorie deficit plan', i: 'flame' },
  { k: 'build_muscle', t: 'Build muscle', d: 'Strength and protein', i: 'barbell' },
  { k: 'endurance', t: 'Improve endurance', d: 'Cardio focus', i: 'walk' },
  { k: 'stay_healthy', t: 'Stay healthy', d: 'Balanced routine', i: 'heart' },
];
const DIETS = ['Halal', 'Vegetarian', 'No pork', 'Dairy-free', 'None'];
const SEX = [
  { k: 'male', t: 'Male', i: 'male' },
  { k: 'female', t: 'Female', i: 'female' },
  { k: 'other', t: 'Non-binary', i: 'male-female' },
];
const TITLES = ['Basics', 'Basics', 'Basics', 'Basics', 'Your goal', 'Your routine'];
const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 13 - 1930 + 1 }, (_, i) => 1930 + i);
const LB = 2.20462;

function OnboardHeader({ title, pct, onBack }: { title: string; pct: number; onBack?: () => void }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', height: 28 }}>
        <View style={{ width: 28 }}>
          {onBack && <Pressable onPress={onBack} hitSlop={10} accessibilityLabel="Back"><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>}
        </View>
        <T muted style={{ flex: 1, textAlign: 'center' }}>{title}</T>
        <View style={{ width: 28 }} />
      </View>
      <Bar pct={pct} />
    </View>
  );
}

function FadeIn({ children, fill }: { children: ReactNode; fill: boolean }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(a, { toValue: 1, duration: 240, useNativeDriver: true }).start(); }, [a]);
  return (
    <Animated.View style={[{ gap: 14, opacity: a, transform: [{ translateX: a.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }, fill && { flex: 1 }]}>
      {children}
    </Animated.View>
  );
}

export default function Onboarding() {
  const { session, refresh } = useAuth();
  const uid = session!.user.id;
  const [page, setPage] = useState(0); // 0 gender, 1 birth year, 2 height, 3 weight, 4 goal, 5 routine, 6 building
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [hUnit, setHUnit] = useState<'ft' | 'cm'>('cm');
  const [wUnit, setWUnit] = useState<'lbs' | 'kg'>('kg');
  const [f, setF] = useState({ sex: '', year: THIS_YEAR - 25, cm: 170, kg: 65, goal: '', activity: 'moderate', perWeek: 4, diets: [] as string[], notes: '' });
  const set = (k: string, v: any) => setF(p => ({ ...p, [k]: v }));
  const toggleDiet = (d: string) => set('diets', f.diets.includes(d) ? f.diets.filter(x => x !== d) : [...f.diets, d]);

  const save = async (patch: object) => {
    const { error } = await supabase.from('profiles').update(patch).eq('id', uid);
    if (error) { setErr(error.message); return false; }
    return true;
  };

  const saveBasics = async () => {
    setErr('');
    const ok = await save({ age: THIS_YEAR - f.year, sex: f.sex, height_cm: Math.round(f.cm * 10) / 10, weight_kg: Math.round(f.kg * 10) / 10 });
    if (ok) setPage(4);
  };
  const saveGoal = async () => { if (await save({ fitness_goal: f.goal })) setPage(5); };
  const run = async (patch: object) => {
    setBusy(true); setErr('');
    const ok = await save(patch);
    if (!ok) { setBusy(false); return; }
    setPage(6);
    const { error } = await supabase.functions.invoke('generate-plan');
    if (error) { setErr(error.message); setBusy(false); return; }
    await save({ onboarded: true }); await refresh();
  };
  const build = () => run({ activity_level: f.activity, workouts_per_week: f.perWeek, dietary_preferences: f.diets, health_notes: f.notes });
  const skipRoutine = () => run({ activity_level: 'moderate', workouts_per_week: 4 }); // sensible defaults
  const skipGoal = () => { setErr(''); setPage(5); };
  const skip = async () => { await save({ onboarded: true }); await refresh(); };

  if (page === 6) return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
        {err ? <Ionicons name="alert-circle" size={48} color={colors.danger} /> : <ActivityIndicator size="large" color={colors.cyan} />}
        <T size={22} bold>{err ? 'Could not build your plan' : 'Building your plan'}</T>
        <T muted style={{ textAlign: 'center' }}>{err || 'Your AI coach is tailoring workouts and meals'}</T>
        {!!err && <View style={{ gap: 10, alignSelf: 'stretch' }}><Button title="Try again" onPress={build} /><Button title="Skip for now" variant="outline" onPress={skip} /></View>}
        <T muted size={12}>General guidance only, not medical advice.</T>
      </View>
    </Screen>
  );

  // height display
  const inches = Math.round((f.cm / 2.54) * 2) / 2;
  const heightBig = hUnit === 'cm' ? f.cm.toFixed(1) : `${Math.floor(inches / 12)}'${(inches % 12).toFixed(1)}"`;
  // weight display and BMI
  const weightBig = (wUnit === 'kg' ? f.kg : f.kg * LB).toFixed(1);
  const bmi = f.kg / (f.cm / 100) ** 2;
  const [bLabel, bColor, bMsg] = bmi < 18.5 ? ['Underweight', colors.cyan, "Let's build strength together."]
    : bmi < 25 ? ['Normal', colors.lime, "You're in a healthy range. Let's keep it up!"]
    : bmi < 30 ? ['Overweight', colors.flame, "Small changes add up. Let's keep going!"]
    : ['Obese', colors.danger, "Every step counts. We'll go at your pace."];

  const scroll = page >= 4;
  return (
    <Screen scroll={scroll}>
      <OnboardHeader title={TITLES[page]} pct={(page + 1) / 6} onBack={page > 0 ? () => { setErr(''); setPage(page - 1); } : undefined} />
      <FadeIn key={page} fill={!scroll}>

        {page === 0 && <>
          <T size={28} bold>What's your gender?</T>
          {SEX.map(o => {
            const on = f.sex === o.k;
            return (
              <Pressable key={o.k} onPress={() => { set('sex', o.k); setPage(1); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, borderRadius: radius.card + 6, borderWidth: 1,
                  borderColor: on ? colors.lime : colors.border, backgroundColor: on ? '#1B2308' : colors.card }}>
                <Ionicons name={o.i as any} size={26} color={on ? colors.lime : colors.muted} />
                <T size={17} bold>{o.t}</T>
              </Pressable>
            );
          })}
        </>}

        {page === 1 && <>
          <T size={28} bold>What's your birth year?</T>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <YearWheel years={YEARS} initial={f.year} onChange={y => set('year', y)} />
          </View>
          <Button title="Continue" onPress={() => setPage(2)} />
        </>}

        {page === 2 && <>
          <T size={28} bold>What's your height?</T>
          <Toggle options={['ft', 'cm']} value={hUnit} onChange={setHUnit} />
          <View style={{ flex: 1 }}>
            {hUnit === 'cm'
              ? <Ruler key="cm" vertical min={120} max={230} step={0.5} gap={16} tallEvery={2} labelEvery={2} initial={f.cm} onChange={v => set('cm', v)} />
              : <Ruler key="ft" vertical min={48} max={90} step={0.5} gap={16} tallEvery={2} labelEvery={2} initial={f.cm / 2.54}
                  fmt={v => `${Math.floor(v / 12)}'${Math.round(v % 12)}"`} onChange={v => set('cm', v * 2.54)} />}
            <View pointerEvents="none" style={{ position: 'absolute', top: '50%', marginTop: -62, left: 150, flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
              <T size={46} bold>{heightBig}</T>
              {hUnit === 'cm' && <T size={18} bold muted style={{ marginBottom: 8 }}>cm</T>}
            </View>
          </View>
          <Button title="Continue" onPress={() => setPage(3)} />
        </>}

        {page === 3 && <>
          <T size={28} bold>What's your current weight?</T>
          <Toggle options={['lbs', 'kg']} value={wUnit} onChange={setWUnit} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 6, marginTop: 8 }}>
            <T size={56} bold>{weightBig}</T>
            <T size={20} bold muted style={{ marginBottom: 10 }}>{wUnit}</T>
          </View>
          {wUnit === 'kg'
            ? <Ruler key="kg" min={30} max={250} step={0.1} gap={8} tallEvery={10} labelEvery={10} initial={f.kg} onChange={v => set('kg', v)} />
            : <Ruler key="lbs" min={65} max={550} step={0.2} gap={8} tallEvery={5} labelEvery={25} initial={f.kg * LB} onChange={v => set('kg', v / LB)} />}
          <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.card + 4, padding: 18, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <T size={18} bold>Your BMI:</T>
              <T size={18} bold color={bColor}>{bmi.toFixed(1)}</T>
              <View style={{ backgroundColor: bColor, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 }}>
                <T size={13} bold color={colors.onLime}>{bLabel}</T>
              </View>
            </View>
            <T muted>{bMsg}</T>
          </View>
          <View style={{ flex: 1 }} />
          {!!err && <T color={colors.danger}>{err}</T>}
          <Button title="Continue" onPress={saveBasics} />
        </>}

        {page === 4 && <>
          <T size={26} bold>What's your main goal?</T>
          {GOALS.map(g => (
            <Pressable key={g.k} onPress={() => set('goal', g.k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
              borderRadius: radius.card, borderWidth: 1, borderColor: f.goal === g.k ? colors.lime : colors.border, backgroundColor: f.goal === g.k ? '#1B2308' : colors.card }}>
              <Ionicons name={g.i as any} size={22} color={f.goal === g.k ? colors.lime : colors.muted} />
              <View><T bold>{g.t}</T><T muted size={12}>{g.d}</T></View>
            </Pressable>
          ))}
          {!!err && <T color={colors.danger}>{err}</T>}
          <Button title="Continue" onPress={saveGoal} disabled={!f.goal} />
          <Button title="Skip for now" variant="outline" onPress={skipGoal} />
        </>}

        {page === 5 && <>
          <T size={26} bold>Your routine</T>
          <T muted size={12}>Activity level</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['light', 'moderate', 'active'].map(a => <Chip key={a} label={a[0].toUpperCase() + a.slice(1)} on={f.activity === a} onPress={() => set('activity', a)} />)}
          </View>
          <T muted size={12}>Workouts per week</T>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radius.btn, borderWidth: 1, borderColor: colors.border, padding: 10 }}>
            <Pressable onPress={() => set('perWeek', Math.max(1, f.perWeek - 1))}><Ionicons name="remove-circle-outline" size={26} color={colors.muted} /></Pressable>
            <T size={20} bold>{f.perWeek}</T>
            <Pressable onPress={() => set('perWeek', Math.min(7, f.perWeek + 1))}><Ionicons name="add-circle-outline" size={26} color={colors.lime} /></Pressable>
          </View>
          <T muted size={12}>Food preferences</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DIETS.map(d => <Chip key={d} label={d} on={f.diets.includes(d)} onPress={() => toggleDiet(d)} />)}
          </View>
          <Field label="Allergies or injuries, optional" value={f.notes} onChangeText={v => set('notes', v)} placeholder="e.g. peanuts, bad knee" autoCapitalize="sentences" />
          {!!err && <T color={colors.danger}>{err}</T>}
          <Button title="Create my plan" onPress={build} loading={busy} />
          <Button title="Skip for now" variant="outline" onPress={skipRoutine} disabled={busy} />
        </>}

      </FadeIn>
    </Screen>
  );
}
