// Drop-in replacement for react-native's Alert that shows AIVO-styled pop ups.
// Use:  import { Alert } from '../src/lib/dialog';   then  Alert.alert('Saved', 'Profile updated.');
// Optional 4th argument picks the look: 'success' (lime), 'danger' (red) or 'info' (cyan).
import { ReactNode, useEffect, useState } from 'react';
import { Alert as NativeAlert } from 'react-native';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { colors } from '../theme';

type Btn = { text?: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };
type Tone = 'success' | 'danger' | 'info';
type Opts = { title: string; message?: string; buttons?: Btn[]; tone?: Tone };

const TONES = {
  success: { icon: 'checkmark-circle', tint: colors.lime },
  danger: { icon: 'alert-circle', tint: colors.danger },
  info: { icon: 'information-circle', tint: colors.cyan },
} as const;

const toneFor = (o: Opts): Tone => {
  if (o.tone) return o.tone;
  const t = o.title.toLowerCase();
  if (/error|could not|failed/.test(t)) return 'danger';
  if (/saved|logged|complete|changed|updated|sent/.test(t)) return 'success';
  return 'info';
};

let show: ((o: Opts) => void) | null = null;

export const Alert = {
  alert(title: string, message?: string, buttons?: Btn[], tone?: Tone) {
    if (show) show({ title, message, buttons, tone });
    else NativeAlert.alert(title, message, buttons as any); // before the provider is mounted
  },
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [d, setD] = useState<Opts | null>(null);
  useEffect(() => { show = setD; return () => { show = null; }; }, []);

  const cancel = d?.buttons?.find(b => b.style === 'cancel');
  const action = d?.buttons?.find(b => b.style !== 'cancel');
  const tone = TONES[d ? toneFor(d) : 'info'];

  return (
    <>
      {children}
      <ConfirmDialog visible={!!d} title={d?.title ?? ''} message={d?.message} icon={tone.icon} tint={action?.style === 'destructive' ? colors.danger : tone.tint}
        single={!cancel} confirmText={action?.text ?? 'OK'} cancelText={cancel?.text ?? 'Cancel'}
        onConfirm={() => { setD(null); action?.onPress?.(); }}
        onCancel={() => { setD(null); cancel?.onPress?.(); }} />
    </>
  );
}
