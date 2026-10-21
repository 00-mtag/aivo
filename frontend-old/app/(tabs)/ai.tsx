import { Ionicons } from '@expo/vector-icons';
import { Screen, T, Card } from '../../src/components/ui';
import { colors } from '../../src/theme';

export default function AiCoach() {
  return (
    <Screen>
      <T size={26} bold style={{ marginTop: 8 }}>AI coach</T>
      <Card style={{ alignItems: 'center', paddingVertical: 32 }}>
        <Ionicons name="sparkles" size={40} color={colors.cyan} />
        <T bold>Chat and suggestions are coming soon</T>
        <T muted size={12} style={{ textAlign: 'center' }}>For now, your daily tip appears on the Home screen.</T>
      </Card>
    </Screen>
  );
}
