import { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ban, Pause, Play } from 'lucide-react-native';
import { useStore } from 'ditcore/store/store';
import { coachById, fmtDate, fmtTime } from 'ditcore/store/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { Button, Card, Display, ListRow, Row, Screen, Stack, StateBlock, StatusBadge, Txt } from '../../ui';
import { Clip } from '../../ui/art';
import { DitAvatar } from '../../ui/Dit';
import { useCompanion, useCompanionContext } from '../../companion/Companion';
import { raw } from '../../theme/tokens';
import { AthleteTop } from './parts';
import { useAthlete } from './hooks';

export function FeedbackList() {
  const { db } = useStore();
  const { a, first } = useAthlete();
  const nav = useNavigation<any>();
  const t = useTheme();
  useCompanionContext({ surface: 'athlete', title: `${first} · Feedback`, athleteId: a.id, prompts: ['What can you help with?'] });
  const list = db.feedback.filter((f) => f.athleteId === a.id).sort((x, y) => y.publishedAt.localeCompare(x.publishedAt));
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop />
      <Screen>
        <Display size={44}>Feedback</Display>
        {list.length === 0 ? <StateBlock kind="empty" title="No feedback yet" body="When your coach shares a note or a clip with you, it lands here." /> : (
          <Card flush>
            {list.map((f, i) => (
              <ListRow key={f.id} last={i === list.length - 1} onPress={() => nav.navigate('FeedbackDetail', { id: f.id })} label="Open feedback" style={{ alignItems: 'flex-start' }}>
                <View style={{ flex: 1, gap: 4 }}>
                  {f.status === 'withdrawn' ? <Row gap={1}><Ban size={14} color={t.textMuted} /><Txt variant="small" muted>Withdrawn by your coach</Txt></Row> : <Txt variant="small">{f.text}</Txt>}
                  <Txt variant="xs" muted>{coachById(db, f.coachId)?.name} · {fmtDate(f.publishedAt)}{f.videoId && f.status !== 'withdrawn' ? ' · clip' : ''}</Txt>
                </View>
              </ListRow>
            ))}
          </Card>
        )}
      </Screen>
    </View>
  );
}

/** AT04.02–06: coach feedback with a simulated clip and tappable comment markers. */
export function FeedbackDetail() {
  const { id } = useRoute<any>().params;
  const nav = useNavigation<any>();
  const { db } = useStore();
  const { a, first } = useAthlete();
  const h = useCompanion();
  const t = useTheme();
  const f = db.feedback.find((x) => x.id === id && x.athleteId === a.id);
  const v = f?.videoId ? db.videos.find((x) => x.id === f.videoId) : undefined;
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [w, setW] = useState(1);
  const shared = v ? v.comments.filter((c) => c.shared).sort((x, y) => x.t - y.t) : [];
  const active = shared.filter((c) => c.t <= pos).pop();
  useCompanionContext(f && f.status === 'published' ? {
    surface: 'athlete', title: `${first} · Feedback from ${coachById(db, f.coachId)?.name.split(' ')[0]}`, athleteId: a.id, videoId: v && v.share === 'shared' ? v.id : undefined,
    prompts: v ? ['Explain my coach’s comment'] : ['What can you help with?'],
  } : { surface: 'athlete', title: 'Feedback', prompts: ['What can you help with?'] });
  const durRef = useRef(0);
  durRef.current = v?.duration ?? 0;
  useEffect(() => {
    if (!playing || !v) return;
    const iv = setInterval(() => setPos((x) => { if (x + 0.25 >= durRef.current) { setPlaying(false); return durRef.current; } return x + 0.25; }), 250);
    return () => clearInterval(iv);
  }, [playing, v]);
  const seek = (s: number) => { setPlaying(false); setPos(Math.max(0, Math.min(durRef.current, s))); };

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop back />
      <Screen>
        {!f ? <StateBlock kind="archived" title="This feedback isn’t available" body="The link may be out of date." action={<Button size="sm" onPress={() => nav.goBack()}>Back</Button>} />
          : f.status === 'withdrawn' ? <StateBlock kind="withdrawn" title="Your coach withdrew this feedback" body="It’s no longer shared with you. Nothing for you to do. Ask your coach if you have questions." />
            : (
              <>
                <View style={{ gap: 6 }}>
                  <Txt variant="xs" strong color={t.roleText}>{coachById(db, f.coachId)?.name} · {fmtDate(f.publishedAt)}</Txt>
                  <Txt variant="h2">“{f.text}”</Txt>
                </View>
                {v ? (v.share === 'withdrawn' ? <StateBlock kind="withdrawn" title="Clip withdrawn" body="Your coach withdrew this clip." /> : (
                  <Stack gap={3}>
                    <View>
                      <Clip video={v} compact />
                      {active ? <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10, padding: 10, borderRadius: 8, backgroundColor: 'rgba(11,19,15,.88)' }}><Txt variant="small" color="#fff"><Txt variant="small" strong color={raw.grey[400]}>{fmtTime(active.t)}  </Txt>{active.text}</Txt></View> : null}
                    </View>
                    <Row gap={3}>
                      <Pressable accessibilityRole="button" accessibilityLabel={playing ? 'Pause' : 'Play'} onPress={() => setPlaying((p) => !p)} style={{ width: 44, height: 44, borderRadius: 8, borderWidth: 1.5, borderColor: t.lineStrong, alignItems: 'center', justifyContent: 'center' }}>
                        {playing ? <Pause size={18} color={t.text} /> : <Play size={18} color={t.text} />}
                      </Pressable>
                      <Pressable accessibilityRole="adjustable" accessibilityLabel="Position" onLayout={(e) => setW(e.nativeEvent.layout.width)} onPress={(e) => seek((e.nativeEvent.locationX / w) * v.duration)} style={{ flex: 1, height: 44, justifyContent: 'center' }}>
                        <View style={{ height: 6, borderRadius: 3, backgroundColor: t.surfaceSunk }} />
                        <View style={{ position: 'absolute', left: 0, height: 6, borderRadius: 3, backgroundColor: t.text, width: `${(pos / v.duration) * 100}%` }} />
                        {shared.map((c) => <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Coach comment at ${fmtTime(c.t)}`} hitSlop={8} onPress={() => seek(c.t)} style={{ position: 'absolute', left: `${(c.t / v.duration) * 100}%`, marginLeft: -8, width: 16, height: 16, borderRadius: 8, backgroundColor: t.hl, borderWidth: 2, borderColor: t.bg }} />)}
                      </Pressable>
                      <Txt variant="num" style={{ fontSize: 18 }}>{fmtTime(pos)}</Txt>
                    </Row>
                    <Txt variant="xs" muted>No media in the prototype. Tap a marker to jump to a coach comment.</Txt>
                    <Card flush>
                      {shared.map((c, i) => <ListRow key={c.id} last={i === shared.length - 1} onPress={() => seek(c.t)} label={`Jump to ${fmtTime(c.t)}`}><StatusBadge tone="lime" label={fmtTime(c.t)} /><Txt variant="small" style={{ flex: 1 }}>{c.text}</Txt></ListRow>)}
                    </Card>
                    <Card accent onPress={() => h.openCompanion({ ask: 'Explain my coach’s comment' })} label="Ask dit about this comment">
                      <Row gap={3}><DitAvatar state="insight" size={34} form="face" /><View style={{ flex: 1 }}><Txt strong>What should I copy from this?</Txt><Txt variant="xs" muted>dit turns the coach’s comment into a practice cue.</Txt></View></Row>
                    </Card>
                  </Stack>
                )) : null}
              </>
            )}
      </Screen>
    </View>
  );
}
