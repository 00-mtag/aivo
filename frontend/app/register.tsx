import { useState } from 'react';
import { View, Text } from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { signInWithGoogle } from '../src/lib/google';
import { Alert } from '../src/lib/dialog';
import { T, Field, Button } from '../src/components/ui';
import { AuthScreen, Rise, Divider, GoogleButton, Notice, PasswordStrength } from '../src/components/auth';
import { colors } from '../src/theme';

type Errs = { username?: string; email?: string; password?: string };

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errs, setErrs] = useState<Errs>({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: Errs = {};
    if (username.trim().length < 3) next.username = 'Use at least 3 characters.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Use at least 8 characters.';
    setErrs(next); setFormErr('');
    if (Object.keys(next).length) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password, options: { data: { username: username.trim(), phone: phone.trim() } },
    });
    if (error) setFormErr(error.message);
    else if (!data.session) Alert.alert('Check your email', 'Confirm your address, then log in.');
    setBusy(false);
  };

  return (
    <AuthScreen back compact>
      <Rise>
        <T size={28} bold>Create your account</T>
        <T muted>Takes about a minute.</T>
      </Rise>

      <Rise delay={80} style={{ gap: 16 }}>
        <Field label="Username" icon="person" value={username} onChangeText={setUsername} autoComplete="username" placeholder="Pick a username" error={errs.username} />
        <Field label="Email" icon="mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" placeholder="you@example.com" error={errs.email} />
        <Field label="Phone, for reminders (optional)" icon="call" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="09xx xxx xxxx" />
        <View style={{ gap: 10 }}>
          <Field label="Password" icon="lock-closed" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" error={errs.password} />
          <PasswordStrength password={password} />
        </View>
        {!!formErr && <Notice>{formErr}</Notice>}
        <View style={{ gap: 12, marginTop: 4 }}>
          <Button title="Create account" onPress={submit} loading={busy} glowing />
          <Divider />
          <GoogleButton onPress={signInWithGoogle} />
        </View>
      </Rise>

      <Rise delay={160}>
        <Link href="/login" style={{ textAlign: 'center', marginTop: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 14 }}>Have an account? </Text>
          <Text style={{ color: colors.lime, fontSize: 14, fontWeight: '700' }}>Log in</Text>
        </Link>
      </Rise>
    </AuthScreen>
  );
}
