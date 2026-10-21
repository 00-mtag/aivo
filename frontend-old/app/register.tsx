import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Alert } from '../src/lib/dialog';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import { signInWithGoogle } from '../src/lib/google';
import { Screen, T, Field, Button } from '../src/components/ui';
import { colors } from '../src/theme';

const LEVELS = [
  { label: '', color: '#2A2A35' },
  { label: 'Weak', color: '#FF5C6C' },
  { label: 'Fair', color: '#FF9F1C' },
  { label: 'Good', color: '#FFD166' },
  { label: 'Strong', color: '#3DDC97' },
];

// 0 = empty. Under 8 characters is always Weak. From 8 up, each of
// uppercase letter, number and symbol raises the level by one.
function check(p: string) {
  if (!p) return { level: 0, hint: '' };
  if (p.length < 8) return { level: 1, hint: 'Use at least 8 characters' };
  const missing: string[] = [];
  if (!/[A-Z]/.test(p)) missing.push('Add an uppercase letter');
  if (!/[0-9]/.test(p)) missing.push('Add a number');
  if (!/[^A-Za-z0-9]/.test(p)) missing.push('Add a symbol like ! or @');
  return { level: 4 - missing.length, hint: missing[0] ?? 'Great, that is a strong password' };
}

export default function Register() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const { level, hint } = check(password);
  const lv = LEVELS[level];

  const submit = async () => {
    setBusy(true); setErr('');
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password, options: { data: { username: username.trim(), phone: phone.trim() } },
    });
    if (error) setErr(error.message);
    else if (!data.session) Alert.alert('Check your email', 'Confirm your address, then log in.');
    setBusy(false);
  };

  return (
    <Screen>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/login'))} hitSlop={10}
        style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="arrow-back" size={18} color="#000000" />
      </Pressable>

      <View>
        <T size={28} bold>Create your account</T>
        <T muted size={11}>Takes about a minute</T>
      </View>

      <Field label="Username" icon="person" value={username} onChangeText={setUsername} />
      <Field label="Email" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Phone, for reminders" icon="call" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <View style={{ gap: 6 }}>
        <Field label="Password" icon="lock-closed" value={password} onChangeText={setPassword} secureTextEntry />
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[1, 2, 3, 4].map(i => (
            <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= level ? lv.color : colors.border }} />
          ))}
        </View>
        {level > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <T size={12} bold color={lv.color}>{lv.label}</T>
            <T size={11} muted>{hint}</T>
          </View>
        )}
      </View>

      {!!err && <T color={colors.danger}>{err}</T>}
      <View style={{ gap: 10, marginTop: 8 }}>
        <Button title="Create account" onPress={submit} loading={busy} disabled={!username || !email || password.length < 8} />
        <Button title="Continue with Google" icon="logo-google" variant="secondary" onPress={signInWithGoogle} />
      </View>

      <Link href="/login" style={{ textAlign: 'center', marginTop: 10 }}>
        <Text style={{ color: colors.text, fontSize: 13 }}>Have an account? </Text>
        <Text style={{ color: colors.lime, fontSize: 13 }}>Log in</Text>
      </Link>
    </Screen>
  );
}
