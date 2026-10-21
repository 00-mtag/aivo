import { View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/lib/auth';
import { DialogProvider } from '../src/lib/dialog';
import { colors } from '../src/theme';

function Gate() {
  const { session, profile, loading } = useAuth();
  const authed = !!session;
  if (loading || (authed && !profile)) {
    return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.lime} /></View>;
  }
  const onboarded = !!profile?.onboarded;
  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!authed}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
        </Stack.Protected>
        <Stack.Protected guard={authed && !onboarded}>
          <Stack.Screen name="onboarding" />
        </Stack.Protected>
        <Stack.Protected guard={authed && onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="gyms" options={{ animation: 'fade_from_bottom' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function Root() {
  return <AuthProvider><DialogProvider><Gate /></DialogProvider></AuthProvider>;
}
