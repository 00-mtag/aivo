import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { signInWithGoogle } from '../src/lib/google';
import { Alert } from '../src/lib/dialog';
import { T, Field, Button } from '../src/components/ui';
import { AuthScreen, Rise, Divider, GoogleButton, Notice } from '../src/components/auth';
import { colors } from '../src/theme';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errs, setErrs] = useState<{ email?: string; password?: string }>({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: { email?: string; password?: string } = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Enter your password.';
    setErrs(next); setFormErr('');
    if (next.email || next.password) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) setFormErr(error.message);
    setBusy(false);
  };

  const forgot = async () => {
    if (!email.trim()) return Alert.alert('Enter your email first', 'Type your email above, then tap "Forgot password?" again.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Check your email', 'If an account exists, a reset link was sent.');
  };

  return (
    <AuthScreen>
      <Rise>
        <T size={28} bold>Welcome back</T>
        <T muted>Log in to keep your streak going.</T>
      </Rise>

      <Rise delay={80} style={{ gap: 16 }}>
        <Field label="Email" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="you@example.com" error={errs.email} />
        <Field label="Password" icon="lock-closed" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" placeholder="Your password" error={errs.password} />
        <Pressable onPress={forgot} hitSlop={8} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ color: colors.cyan, fontSize: 13, fontWeight: '700' }}>Forgot password?</Text>
        </Pressable>
        {!!formErr && <Notice>{formErr}</Notice>}
        <View style={{ gap: 12, marginTop: 4 }}>
          <Button title="Log in" onPress={submit} loading={busy} glowing />
          <Divider />
          <GoogleButton onPress={signInWithGoogle} />
        </View>
      </Rise>

      <Rise delay={160}>
        <Link href="/register" style={{ textAlign: 'center', marginTop: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}>New here? </Text>
          <Text style={{ color: colors.lime, fontSize: 14, fontWeight: '700' }}>Create account</Text>
        </Link>
      </Rise>
    </AuthScreen>
  );
}
