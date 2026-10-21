import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Alert } from '../src/lib/dialog';
import { Link } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { signInWithGoogle } from '../src/lib/google';
import { Screen, T, Field, Button } from '../src/components/ui';
import { colors } from '../src/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setBusy(true); setErr('');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setErr(error.message);
    setBusy(false);
  };

  const forgot = async () => {
    if (!email.trim()) return Alert.alert('Enter your email first', 'Type your email above, then tap "Forgot password?" again.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Check your email', 'If an account exists, a reset link was sent.');
  };

  return (
    <Screen>
      <View style={{ alignItems: 'center', marginTop: 36 }}>
        <T size={18} bold>Welcome to</T>
        <Text style={{ color: colors.lime, fontSize: 76, fontWeight: '900', letterSpacing: 2, lineHeight: 84 }}>AIVO</Text>
      </View>
      <T muted size={20} style={{ textAlign: 'center', marginBottom: 6 }}>Level Up You.</T>

      <Field label="Email" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <Field label="Password" icon="lock-closed" value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable onPress={forgot} style={{ alignSelf: 'flex-end' }}>
        <Text style={{ color: '#3B82F6', fontSize: 12, fontWeight: '600' }}>Forgot password?</Text>
      </Pressable>

      {!!err && <T color={colors.danger}>{err}</T>}
      <View style={{ gap: 10, marginTop: 8 }}>
        <Button title="Log in" onPress={submit} loading={busy} disabled={!email || !password} />
        <Button title="Continue with Google" icon="logo-google" variant="secondary" onPress={signInWithGoogle} />
      </View>

      <Link href="/register" style={{ textAlign: 'center', marginTop: 10 }}>
        <Text style={{ color: colors.text, fontSize: 13 }}>New here? </Text>
        <Text style={{ color: colors.lime, fontSize: 13 }}>Create account</Text>
      </Link>
    </Screen>
  );
}
