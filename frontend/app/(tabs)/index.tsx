import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/lib/auth';
import { levelProgress, streakFrom, calorieTarget } from '../../src/lib/game';
import { Screen, T, Card, Bar, Button, SectionLabel, Skeleton, EmptyState } from '../../src/components/ui';
import { Header } from '../../src/components/Header';
import { GymMapCard } from '../../src/components/GymMapCard';
import { colors, glow, radius } from '../../src/theme';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// WHO adult cutoffs: 18.5, 25, 30.
const bmiOf = (p: any) => {
  if (!p?.height_cm || !p?.weight_kg) return null;
  const v = p.weight_kg / (p.height_cm / 100) ** 2;
  const [label, color] = v < 18.5 ? ['Underweight', colors.cyan] : v < 25 ? ['Normal', colors.lime]
    : v < 30 ? ['Overweight', colors.flame] : ['Obese', colors.danger];
  return { v, label, color };
};

export default function Home() {
  const { session, profile, refresh } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [plan, setPlan] = useState<any[]>([]);
  const [tip, setTip] = useState('');
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(useCallback(() => {
    (async () => {
      const uid = session!.user.id;
      const [l, r, w] = await Promise.all([
        supabase.from('activity_logs').select('kind,calories_consumed,logged_at').eq('user_id', uid).order('logged_at', { ascending: false }).limit(200),
        supabase.from('ai_recommendations').select('generated_content').eq('user_id', uid).order('created_at', { ascending: false }).limit(1),
        supabase.from('workout_plans').select('id,exercise,schedule').eq('user_id', uid).order('id'),
      ]);
      setLogs(l.data ?? []);
      setPlan(w.data ?? []);
      try { setTip(JSON.parse(r.data?.[0]?.generated_content ?? '{}').tip ?? ''); } catch { setTip(''); }
      setLoaded(true);
      refresh();
    })();
  }, [session]));

  const today = new Date().toDateString();
  const todays = logs.filter(l => new Date(l.logged_at).toDateString() === today);
  const workoutDone = todays.some(l => l.kind === 'workout');
  const meals = todays.filter(l => l.kind === 'meal');
  const kcal = meals.reduce((s, l) => s + (l.calories_consumed ?? 0), 0);
  const target = calorieTarget(profile);
  const streak = streakFrom(logs.map(l => l.logged_at));
  const lp = levelProgress(profile?.xp ?? 0);
  const bmi = bmiOf(profile);
  const now = new Date();
  const R = 48, C = 2 * Math.PI * R;

  const lines = <View style={{ gap: 8 }}><Skeleton width="80%" /><Skeleton width="60%" /></View>;
  const Quest = ({ done, label, xp }: { done: boolean; label: string; xp: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={done ? colors.lime : colors.muted} />
      <T style={{ flex: 1 }} muted={!done}>{label}</T>
      <T color={colors.lime} size={12} bold>{xp}</T>
    </View>
  );

  return (
    <Screen>
      <Header name={profile?.username} level={lp.level} streak={streak} loading={!profile} />

      <SectionLabel>AI Suggestions</SectionLabel>
      <Pressable onPress={() => router.push('/ai')} accessibilityRole="button" style={[s.banner, glow(colors.lime, 16)]}>
        <View style={s.date}>
          <T size={32} bold color={colors.lime}>{now.getDate()}</T>
          <T size={13} bold color={colors.lime}>{DAYS[now.getDay()]}</T>
        </View>
        <View style={{ flex: 1 }}>
          <T size={12} color={colors.onLime}>{workoutDone ? 'Great work today!' : 'Time to workout!'}</T>
          <T size={18} bold color={colors.onLime}>Meal and Workout suggestions</T>
        </View>
        <View style={s.go}><Ionicons name="chevron-forward" size={22} color={colors.lime} /></View>
      </Pressable>

      {!!tip && (
        <Card style={{ borderColor: colors.cyan }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="sparkles" size={18} color={colors.cyan} /><T bold color={colors.cyan}>AI coach</T>
          </View>
          <T>{tip}</T>
        </Card>
      )}

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1, gap: 8 }}>
          <SectionLabel>Your BMI</SectionLabel>
          <Card style={{ minHeight: 130 }}>
            {!profile ? lines : bmi ? <>
              <T size={28} bold color={bmi.color}>{bmi.v.toFixed(1)}</T>
              <T size={12} bold color={bmi.color}>{bmi.label}</T>
              <T muted size={12}>{profile.height_cm} cm, {profile.weight_kg} kg</T>
            </> : <EmptyState icon="body" text="Add your height and weight." />}
          </Card>
        </View>
        <View style={{ flex: 1.5, gap: 8 }}>
          <SectionLabel>Upcoming Workouts</SectionLabel>
          <Card style={{ minHeight: 130 }}>
            {!loaded ? lines : plan.length ? <>
              <T bold size={13}>{plan[0].schedule}</T>
              <T muted size={12}>{plan.length} exercises in your plan</T>
            </> : <EmptyState icon="calendar-outline" text="No plan yet. Generate one in the Workout tab." />}
          </Card>
        </View>
      </View>

      <SectionLabel>Today's Meal and Workout</SectionLabel>
      <Card>
        <Quest done={workoutDone} label="Complete today's workout" xp="+50 XP" />
        <Quest done={meals.length > 0} label="Log a meal" xp="+10 XP each" />
        <Button title={workoutDone ? 'Workout done' : "Start today's workout"} onPress={() => router.push('/workout')} disabled={workoutDone} />
      </Card>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={120} height={120}>
            <Circle cx={60} cy={60} r={R} stroke={colors.border} strokeWidth={10} fill="none" />
            <Circle cx={60} cy={60} r={R} stroke={colors.cyan} strokeWidth={10} fill="none" strokeLinecap="round"
              strokeDasharray={`${Math.min(1, kcal / target) * C} ${C}`} rotation={-90} origin="60,60" />
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center' }}>
            <T size={20} bold>{kcal}</T><T muted size={11}>kcal</T>
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <T bold>Today's calories</T>
          <T muted size={12}>Target about {target} kcal</T>
          <T muted size={12}>{meals.length} meal{meals.length === 1 ? '' : 's'} logged</T>
        </View>
      </Card>

      <Card>
        <T muted size={12}>{lp.into} / {lp.span} XP to level {lp.level + 1}</T>
        <Bar pct={lp.pct} />
      </Card>

      <GymMapCard />
    </Screen>
  );
}

const s = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.lime, borderRadius: radius.card + 8, padding: 12 },
  date: { backgroundColor: colors.onLime, borderRadius: radius.card, width: 68, height: 76, alignItems: 'center', justifyContent: 'center' },
  go: { backgroundColor: colors.onLime, width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  map: { height: 150, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surface },
  mapFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
});
