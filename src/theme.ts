import { StyleSheet } from 'react-native';
export const C = { bg: '#111111', card: '#1c1c1c', fg: '#f2f2f2', acc: '#ffd400', mut: '#8a8a8a', ok: '#3ddc84', bad: '#ff5a5a', line: '#2a2a2a' };
export const scoreColor = (s: number) => (s >= 80 ? C.ok : s >= 60 ? C.acc : C.bad);
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16 },
  h2: { color: C.fg, fontSize: 22, fontWeight: '700', marginVertical: 12 },
  hint: { color: C.mut, fontSize: 13, marginVertical: 6 },
  card: { backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 10 },
  txt: { color: C.fg, fontSize: 16 },
  mut: { color: C.mut, fontSize: 14 },
  btn: { backgroundColor: C.acc, borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  btnTxt: { color: '#000', fontSize: 20, fontWeight: '800' },
  ghost: { backgroundColor: C.card, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, alignItems: 'center' },
});
