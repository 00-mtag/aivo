import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { BottomNav } from '../../src/components/BottomNav';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Tabs tabBar={() => null} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="workout" options={{ title: 'Workout' }} />
        <Tabs.Screen name="meals" options={{ title: 'Meals' }} />
        <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
        <Tabs.Screen name="ai" options={{ title: 'AI coach' }} />
      </Tabs>
      <BottomNav />
    </View>
  );
}
