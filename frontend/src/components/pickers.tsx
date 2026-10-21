// Scroll-based pickers for onboarding: Ruler (horizontal or vertical), YearWheel, Toggle. No extra packages.
import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, View } from 'react-native';
import { T } from './ui';
import { colors } from '../theme';

type RulerProps = {
  min: number; max: number; step: number; initial: number; onChange: (v: number) => void;
  vertical?: boolean; gap?: number; tallEvery: number; labelEvery: number; fmt?: (v: number) => string;
};

// Only ticks near the center are rendered, so long scales stay fast. Vertical rulers count down from max (top).
export function Ruler({ min, max, step, initial, onChange, vertical = false, gap = 8, tallEvery, labelEvery, fmt = String }: RulerProps) {
  const ref = useRef<ScrollView>(null);
  const ready = useRef(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const count = Math.round((max - min) / step);
  const valAt = (i: number) => Math.round((vertical ? max - i * step : min + i * step) * 100) / 100;
  const idxOf = (v: number) => Math.max(0, Math.min(count, Math.round((vertical ? max - v : v - min) / step)));
  const [idx, setIdx] = useState(() => idxOf(initial));
  const size = vertical ? box.h : box.w;
  const pad = size / 2;

  useEffect(() => {
    if (!size) return;
    const t = setTimeout(() => {
      const o = idxOf(initial) * gap;
      ref.current?.scrollTo(vertical ? { y: o, animated: false } : { x: o, animated: false });
      ready.current = true;
    }, 60);
    return () => clearTimeout(t);
  }, [size]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBox(b => (b.w === width && b.h === height ? b : { w: width, h: height }));
  };
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!ready.current) return;
    const o = vertical ? e.nativeEvent.contentOffset.y : e.nativeEvent.contentOffset.x;
    const i = Math.max(0, Math.min(count, Math.round(o / gap)));
    if (i !== idx) { setIdx(i); onChange(valAt(i)); }
  };

  const span = Math.ceil(pad / gap) + 3;
  const ticks = [];
  for (let i = Math.max(0, idx - span); i <= Math.min(count, idx + span); i++) {
    const p = pad + i * gap;
    const tall = i % tallEvery === 0;
    ticks.push(vertical
      ? <View key={`t${i}`} style={{ position: 'absolute', top: p - 0.5, left: 0, height: 1, width: tall ? 56 : 30, backgroundColor: tall ? colors.text : colors.muted }} />
      : <View key={`t${i}`} style={{ position: 'absolute', left: p - 0.5, bottom: 0, width: 1, height: tall ? 46 : 26, backgroundColor: tall ? colors.text : colors.muted }} />);
    if (i % labelEvery === 0) {
      ticks.push(vertical
        ? <T key={`l${i}`} bold size={15} style={{ position: 'absolute', top: p - 10, left: 66 }}>{fmt(valAt(i))}</T>
        : <T key={`l${i}`} bold size={15} style={{ position: 'absolute', left: p - 30, top: 0, width: 60, textAlign: 'center' }}>{fmt(valAt(i))}</T>);
    }
  }

  return (
    <View style={vertical ? { flex: 1 } : { height: 96 }} onLayout={onLayout}>
      <ScrollView ref={ref} horizontal={!vertical} snapToInterval={gap} decelerationRate="fast" scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false} showsVerticalScrollIndicator={false} onScroll={onScroll}
        contentContainerStyle={vertical ? { height: count * gap + size, width: box.w } : { width: count * gap + size, height: box.h }}>
        {ticks}
      </ScrollView>
      <View pointerEvents="none" style={vertical
        ? { position: 'absolute', top: pad - 1, left: 0, width: '72%', height: 2, backgroundColor: colors.lime }
        : { position: 'absolute', left: pad - 1, bottom: 0, width: 2, height: 64, backgroundColor: colors.lime }} />
    </View>
  );
}

const ITEM = 56;
export function YearWheel({ years, initial, onChange }: { years: number[]; initial: number; onChange: (y: number) => void }) {
  const ref = useRef<ScrollView>(null);
  const ready = useRef(false);
  const [sel, setSel] = useState(Math.max(0, years.indexOf(initial)));
  useEffect(() => {
    const t = setTimeout(() => { ref.current?.scrollTo({ y: sel * ITEM, animated: false }); ready.current = true; }, 60);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={{ height: ITEM * 5, alignSelf: 'stretch' }}>
      <View pointerEvents="none" style={{ position: 'absolute', top: ITEM * 2, left: 0, right: 0, height: ITEM, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }} />
      <ScrollView ref={ref} snapToInterval={ITEM} decelerationRate="fast" showsVerticalScrollIndicator={false} scrollEventThrottle={16}
        contentContainerStyle={{ paddingVertical: ITEM * 2 }}
        onScroll={(e) => {
          if (!ready.current) return;
          const i = Math.max(0, Math.min(years.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM)));
          if (i !== sel) { setSel(i); onChange(years[i]); }
        }}>
        {years.map((y, i) => (
          <Pressable key={y} onPress={() => ref.current?.scrollTo({ y: i * ITEM, animated: true })}
            style={{ height: ITEM, alignItems: 'center', justifyContent: 'center' }}>
            <T size={i === sel ? 30 : 22} bold color={i === sel ? colors.lime : colors.muted}>{String(y)}</T>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export function Toggle<A extends string>({ options, value, onChange }: { options: [A, A]; value: A; onChange: (v: A) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignSelf: 'center', backgroundColor: colors.card, borderRadius: 22, padding: 3, borderWidth: 1, borderColor: colors.border }}>
      {options.map(o => (
        <Pressable key={o} onPress={() => onChange(o)}
          style={{ paddingHorizontal: 28, paddingVertical: 9, borderRadius: 19, backgroundColor: value === o ? colors.lime : 'transparent' }}>
          <T bold color={value === o ? colors.onLime : colors.muted}>{o}</T>
        </Pressable>
      ))}
    </View>
  );
}
