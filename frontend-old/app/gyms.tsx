// Full-screen nearby gyms map: location permission, nearest gyms, route to the chosen gym.
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Screen, T, Card, Button, Chip } from '../src/components/ui';
import { PanelHeader } from '../src/components/PanelHeader';
import { Alert } from '../src/lib/dialog';
import { Gym, LatLng, Mode, Route, fmtDist, fmtTime, getRoute, openNavigation, searchGyms } from '../src/lib/gyms';
import { darkMapStyle } from '../src/lib/mapStyle';
import { colors, glow, radius } from '../src/theme';

type Stage = 'checking' | 'ask' | 'denied' | 'locating' | 'locfail' | 'searching' | 'searchfail' | 'done';

export default function Gyms() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const map = useRef<MapView>(null);
  const [stage, setStage] = useState<Stage>('checking');
  const [me, setMe] = useState<LatLng | null>(null);
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [sel, setSel] = useState<Gym | null>(null);
  const [mode, setMode] = useState<Mode>('walking');
  const [route, setRoute] = useState<Route | null>(null);
  const [routing, setRouting] = useState(false);
  const [track, setTrack] = useState(true);

  const stageRef = useRef(stage);
  stageRef.current = stage;
  const [fail, setFail] = useState<'services' | 'timeout' | 'other'>('other');
  const [stillOff, setStillOff] = useState(false);

  const findGyms = async (here: LatLng) => {
    setStage('searching');
    try { setGyms(await searchGyms(here)); setStage('done'); } catch { setStage('searchfail'); }
  };
  const locate = async () => {
    setStage('locating');
    try {
      if (!(await Location.hasServicesEnabledAsync())) { setFail('services'); setStage('locfail'); return; }
      // A recent saved position is instant; otherwise wait up to 15 seconds for a fresh one.
      let pos = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
      if (!pos) {
        try {
          pos = await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), 15000)),
          ]);
        } catch (e: any) {
          pos = await Location.getLastKnownPositionAsync(); // last resort: any older position
          if (!pos) { setFail(e?.message === 'timeout' ? 'timeout' : 'other'); setStage('locfail'); return; }
        }
      }
      const here = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setMe(here); findGyms(here);
    } catch { setFail('other'); setStage('locfail'); }
  };
  const check = async (manual = false) => {
    setStage('checking');
    const p = await Location.getForegroundPermissionsAsync();
    if (p.granted) { setStillOff(false); locate(); return; }
    setStillOff(manual);
    setStage(p.canAskAgain ? 'ask' : 'denied');
  };
  const askPermission = async () => {
    const r = await Location.requestForegroundPermissionsAsync();
    if (r.granted) locate(); else setStage(r.canAskAgain ? 'ask' : 'denied');
  };
  useEffect(() => { check(); }, []);
  // Coming back from the phone settings: try again automatically.
  useEffect(() => {
    const sub = AppState.addEventListener('change', st => {
      if (st === 'active' && (stageRef.current === 'denied' || stageRef.current === 'locfail')) check();
    });
    return () => sub.remove();
  }, []);

  // Show the user and the 5 nearest gyms once they are loaded.
  useEffect(() => {
    if (stage !== 'done' || !me || !gyms.length) return;
    const pts = [me, ...gyms.slice(0, 5).map(g => ({ latitude: g.lat, longitude: g.lon }))];
    const t = setTimeout(() => map.current?.fitToCoordinates(pts, { edgePadding: { top: 150, right: 60, bottom: 280, left: 60 }, animated: true }), 500);
    return () => clearTimeout(t);
  }, [stage]);
  // Custom markers need to redraw briefly when they change, then stop (saves battery).
  useEffect(() => { setTrack(true); const t = setTimeout(() => setTrack(false), 900); return () => clearTimeout(t); }, [gyms, sel?.id]);

  const select = (g: Gym | null) => {
    setSel(g); setRoute(null);
    if (g) map.current?.animateToRegion({ latitude: g.lat - 0.0025, longitude: g.lon, latitudeDelta: 0.012, longitudeDelta: 0.012 }, 350);
  };
  const showRoute = async (g: Gym, m: Mode) => {
    if (!me) return;
    setRouting(true);
    try {
      const r = await getRoute(me, { latitude: g.lat, longitude: g.lon }, m);
      setRoute(r);
      map.current?.fitToCoordinates(r.coords, { edgePadding: { top: 150, right: 50, bottom: 360, left: 50 }, animated: true });
    } catch {
      Alert.alert('Could not get a route', 'Try again, or tap Navigate to open your maps app.', undefined, 'danger');
    }
    setRouting(false);
  };
  const changeMode = (m: Mode) => { setMode(m); if (route && sel) showRoute(sel, m); };
  const navigate = (g: Gym) => openNavigation(g, mode).catch(() => Alert.alert('Could not open maps', 'No maps app was found on this phone.', undefined, 'danger'));
  const recenter = () => me && map.current?.animateToRegion({ ...me, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 350);

  // ---------- screens without a map ----------
  const showMap = !!me && (stage === 'searching' || stage === 'searchfail' || stage === 'done');
  if (!showMap) {
    const msg = {
      checking: { icon: 'locate', title: 'Checking permission', text: '' },
      locating: { icon: 'locate', title: 'Finding your location', text: 'This can take a few seconds.' },
      ask: { icon: 'location', title: 'Find gyms near you', text: 'Allow location so AIVO can show the closest gyms and the way to get there. It is only used while this screen is open and is not saved to your account.' },
      denied: { icon: 'location-outline', title: 'Location is turned off', text: (stillOff ? 'Location permission is still off for this app. ' : '') + 'Open Settings, go to Permissions, then Location, and choose "Allow only while using the app". While testing, the app is listed as Expo Go.' },
      locfail: fail === 'services'
        ? { icon: 'navigate-circle-outline', title: 'Location services are off', text: "Turn on Location (GPS) from your phone's quick settings, then tap Try again." }
        : fail === 'timeout'
        ? { icon: 'navigate-circle-outline', title: 'Taking too long to find you', text: 'Go near a window or outside, make sure GPS is on, then try again.' }
        : { icon: 'navigate-circle-outline', title: 'Could not get your location', text: 'Make sure location services are on, then try again.' },
    }[stage as 'checking' | 'locating' | 'ask' | 'denied' | 'locfail'];
    const busy = stage === 'checking' || stage === 'locating';
    return (
      <Screen scroll={false}>
        <PanelHeader title="Nearby gyms" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 8 }}>
          <View style={[{ width: 84, height: 84, borderRadius: 42, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, glow(colors.lime, 14)]}>
            {busy ? <ActivityIndicator color={colors.lime} /> : <Ionicons name={msg.icon as any} size={38} color={colors.lime} />}
          </View>
          <T size={22} bold style={{ textAlign: 'center' }}>{msg.title}</T>
          {!!msg.text && <T muted style={{ textAlign: 'center', lineHeight: 21 }}>{msg.text}</T>}
        </View>
        {stage === 'ask' && <><Button title="Allow location" icon="location" onPress={askPermission} /><Button title="Not now" variant="outline" onPress={() => router.back()} /></>}
        {stage === 'denied' && <><Button title="Open settings" icon="settings-outline" onPress={() => Linking.openSettings()} /><Button title="I turned it on, try again" variant="outline" onPress={() => check(true)} /></>}
        {stage === 'locfail' && <>
          {fail === 'services' && <Button title="Open location settings" icon="settings-outline" variant="outline"
            onPress={() => (Platform.OS === 'android' ? Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS') : Linking.openSettings()).catch(() => Linking.openSettings())} />}
          <Button title="Try again" onPress={() => check()} />
        </>}
      </Screen>
    );
  }

  // ---------- map screen ----------
  const Info = ({ icon, text, onPress }: { icon: keyof typeof Ionicons.glyphMap; text: string; onPress?: () => void }) => (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={colors.cyan} /><T size={12} muted style={{ flex: 1 }}>{text}</T>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <MapView ref={map} style={StyleSheet.absoluteFill} provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        customMapStyle={darkMapStyle} initialRegion={{ ...me!, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
        showsUserLocation showsMyLocationButton={false} toolbarEnabled={false} onPress={() => select(null)}>
        {gyms.map(g => (
          <Marker key={g.id} coordinate={{ latitude: g.lat, longitude: g.lon }} tracksViewChanges={track} anchor={{ x: 0.5, y: 0.5 }} onPress={() => select(g)}>
            <View style={[s.pin, sel?.id === g.id && s.pinOn]}><Ionicons name="barbell" size={18} color={colors.onLime} /></View>
          </Marker>
        ))}
        {route && <Polyline coordinates={route.coords} strokeWidth={5} strokeColor={colors.lime} />}
      </MapView>

      <View pointerEvents="box-none" style={[s.top, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => router.back()} style={s.round} accessibilityLabel="Back"><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <View style={s.title}><T bold>Nearby gyms</T></View>
        <Pressable onPress={recenter} style={s.round} accessibilityLabel="My location"><Ionicons name="locate" size={22} color={colors.lime} /></Pressable>
      </View>

      <View pointerEvents="box-none" style={[s.bottom, { paddingBottom: bottom + 12 }]}>
        {sel ? (
          <Card style={s.sheet}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1, gap: 2 }}>
                <T size={18} bold>{sel.name}</T>
                <T muted size={12}>{fmtDist(sel.distance)} away{sel.address ? `, ${sel.address}` : ''}</T>
              </View>
              <Pressable onPress={() => select(null)} hitSlop={10} accessibilityLabel="Close"><Ionicons name="close" size={22} color={colors.muted} /></Pressable>
            </View>
            {!!sel.hours && <Info icon="time-outline" text={sel.hours} />}
            {!!sel.phone && <Info icon="call-outline" text={sel.phone} onPress={() => Linking.openURL(`tel:${sel.phone}`)} />}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Walk" on={mode === 'walking'} onPress={() => changeMode('walking')} />
              <Chip label="Drive" on={mode === 'driving'} onPress={() => changeMode('driving')} />
            </View>
            {route && (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                <T size={20} bold color={colors.lime}>{fmtTime(route.duration)}</T>
                <T muted size={12}>{fmtDist(route.distance)} {mode === 'walking' ? 'on foot' : 'by car'}</T>
              </View>
            )}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Button title="Show route" icon="trail-sign-outline" variant="outline" onPress={() => showRoute(sel, mode)} loading={routing} /></View>
              <View style={{ flex: 1 }}><Button title="Navigate" icon="navigate" onPress={() => navigate(sel)} /></View>
            </View>
          </Card>
        ) : stage === 'done' && gyms.length > 0 ? (
          <FlatList horizontal data={gyms.slice(0, 12)} keyExtractor={g => g.id} showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 10 }}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => select(item)} style={s.chip}>
                {index === 0 && <T size={11} bold color={colors.lime}>NEAREST</T>}
                <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{item.name}</Text>
                <T muted size={12}>{fmtDist(item.distance)} away</T>
              </Pressable>
            )} />
        ) : (
          <Card style={s.sheet}>
            {stage === 'searching' && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}><ActivityIndicator color={colors.lime} /><T>Searching for gyms near you...</T></View>}
            {stage === 'searchfail' && <><T bold>Could not load gyms</T><T muted size={12}>Check your internet connection and try again.</T><Button title="Try again" onPress={() => me && findGyms(me)} /></>}
            {stage === 'done' && gyms.length === 0 && <><T bold>No gyms found within 20 km</T><T muted size={12}>OpenStreetMap may not list gyms in your area yet.</T><Button title="Search again" variant="outline" onPress={() => me && findGyms(me)} /></>}
          </Card>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14 },
  round: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(18,18,26,0.92)', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  title: { backgroundColor: 'rgba(18,18,26,0.92)', borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 11 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  sheet: { marginHorizontal: 12, backgroundColor: 'rgba(21,21,28,0.97)', borderRadius: 20 },
  chip: { width: 210, gap: 2, padding: 14, borderRadius: 20, backgroundColor: 'rgba(21,21,28,0.97)', borderWidth: 1, borderColor: colors.border },
  pin: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime, borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  pinOn: { backgroundColor: colors.cyan, transform: [{ scale: 1.2 }], ...glow(colors.cyan, 10) },
});
