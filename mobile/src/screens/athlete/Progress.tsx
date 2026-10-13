import { View } from 'react-native';
import { Crosshair, RotateCcw, Trophy } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { fmtDate, timelineFor } from 'ditcore/store/selectors';
import { ThemeScope, useTheme } from '../../theme/ThemeProvider';
import { Display, Screen, SectionTitle, Stack, Timeline, Txt } from '../../ui';
import { useCompanionContext } from '../../companion/Companion';
import { radius, raw } from '../../theme/tokens';
import { AthleteTop } from './parts';
import { useAthlete } from './hooks';

/** AT05: areas, milestones and the family-visible timeline. */
export function Progress() {
  const { db } = useStore();
  const { a, first } = useAthlete();
  const t = useTheme();
  useCompanionContext({ surface: 'athlete', title: `${first} · Progress`, athleteId: a.id, prompts: ['What can you help with?'] });
  const areas = db.areas.filter((x) => x.athleteId === a.id);
  const ms = db.milestones.filter((m) => m.athleteId === a.id && m.visibleToFamily);
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop />
      <Screen>
        <Display size={44}>Progress</Display>
        <Stack gap={2}>
          {areas.map((x) => {
            const achieved = x.status === 'achieved';
            return (
              <View key={x.id} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 16, borderRadius: radius.md, borderWidth: 1, borderColor: achieved ? t.hl : t.line, backgroundColor: achieved ? t.hl : t.surface }}>
                {achieved ? <Trophy size={22} color={raw.char[700]} /> : x.status === 'reopened' ? <RotateCcw size={22} color={t.warn} /> : <Crosshair size={22} color={t.roleText} />}
                <View style={{ flex: 1 }}>
                  <Txt strong color={achieved ? raw.char[700] : undefined}>{x.title}</Txt>
                  <Txt variant="xs" color={achieved ? raw.char[500] : t.textMuted}>{achieved ? 'Achieved. Nice work.' : x.status === 'reopened' ? 'Back in focus: your coach wants to sharpen this again' : x.status === 'closed' ? 'Closed' : 'Working on it now'}</Txt>
                </View>
              </View>
            );
          })}
        </Stack>
        {ms.length > 0 ? (
          <Stack gap={2}>
            <SectionTitle>Milestones</SectionTitle>
            {ms.map((m) => (
              <ThemeScope key={m.id} mode="floodlit" style={{ borderRadius: radius.md, padding: 16, gap: 6, borderWidth: 1, borderColor: raw.char[400] }}>
                <Trophy size={20} color={raw.grey[500]} />
                <Display size={26}>{m.title}</Display>
                <Txt variant="xs" muted>{fmtDate(m.date, { day: 'numeric', month: 'long', year: 'numeric' })}</Txt>
              </ThemeScope>
            ))}
          </Stack>
        ) : null}
        <Stack gap={2}><SectionTitle>Timeline</SectionTitle><Timeline items={timelineFor(db, a.id, 'family')} /></Stack>
      </Screen>
    </View>
  );
}
