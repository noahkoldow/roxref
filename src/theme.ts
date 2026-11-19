import { StyleSheet } from 'react-native';
export const C = { bg: '#111111', card: '#1c1c1c', fg: '#f2f2f2', acc: '#ffd400', mut: '#8a8a8a', ok: '#3ddc84', bad: '#ff5a5a', line: '#2a2a2a' };
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16 },
  h2: { color: C.fg, fontSize: 22, fontWeight: '700', marginVertical: 12 },
  hint: { color: C.mut, fontSize: 13, marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  txt: { color: C.fg, fontSize: 16, fontVariant: ['tabular-nums'] },
  mut: { color: C.mut, fontSize: 14, fontVariant: ['tabular-nums'] },
  ghost: { backgroundColor: C.card, paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
});
