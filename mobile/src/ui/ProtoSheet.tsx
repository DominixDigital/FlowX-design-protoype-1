import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { SlidersHorizontal } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useStore } from 'ditcore/store/store';
import { geminiEnabled, setGeminiEnabled } from 'ditcore/companion/gemini';
import { useTheme } from '../theme/ThemeProvider';
import { Button, Row, Sheet, Stack, Txt } from './index';

/** Prototype controls: make every documented offline, failure and conflict branch triggerable on a phone. */
export function ProtoButton() {
  const [open, setOpen] = useState(false);
  const t = useTheme();
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Prototype controls" hitSlop={8} onPress={() => setOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: t.textMuted, alignItems: 'center', justifyContent: 'center' }}>
        <SlidersHorizontal size={15} color={t.text} />
      </Pressable>
      <ProtoSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row between style={{ minHeight: 44 }}>
      <Txt variant="small" style={{ flex: 1 }}>{label}</Txt>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} />
    </Row>
  );
}

export function ProtoSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { sim, setSim, reset, toast } = useStore();
  const nav = useNavigation<any>();
  const [gem, setGem] = useState(geminiEnabled);
  return (
    <Sheet visible={visible} onClose={onClose}>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        <Txt variant="h3">Prototype controls</Txt>
        <Txt variant="xs" muted>Simulate the network and server so every documented state can be shown on a phone.</Txt>
        <Toggle label="Network online" value={sim.online} onChange={(v) => setSim({ online: v })} />
        <Toggle label="Slow network" value={sim.slow} onChange={(v) => setSim({ slow: v })} />
        <Toggle label="Fail the next save" value={sim.failNextSave} onChange={(v) => setSim({ failNextSave: v })} />
        <Toggle label="Lose the next confirmation" value={sim.uncertainNext} onChange={(v) => setSim({ uncertainNext: v })} />
        <Toggle label="Conflict on next attendance sync" value={sim.conflictOnSync} onChange={(v) => setSim({ conflictOnSync: v })} />
        <Toggle label="Gemini for open questions" value={gem} onChange={(v) => { setGem(v); setGeminiEnabled(v); }} />
        <View style={{ height: 8 }} />
        <Stack gap={2}>
          <Button block onPress={() => { onClose(); nav.getParent()?.navigate('Launcher') ?? nav.navigate('Launcher'); }}>Switch app or person</Button>
          <Button block variant="danger" onPress={() => { reset(); toast({ tone: 'ok', text: 'Demo data reset.' }); onClose(); }}>Reset all demo data</Button>
        </Stack>
      </ScrollView>
    </Sheet>
  );
}
