import { useState } from 'react';
import { View } from 'react-native';
import { useStore } from 'ditcore/store/store';
import { ageOn } from 'ditcore/store/selectors';
import { useTheme } from '../../theme/ThemeProvider';
import { Banner, Button, Card, Display, Field, Input, Screen, Stack, Txt } from '../../ui';
import { useCompanionContext } from '../../companion/Companion';
import { AthleteTop } from './parts';
import { useAthlete } from './hooks';

/** AT01: how this athlete signs in (simulated). */
export function Access() {
  const { db } = useStore();
  const { a, first, viaParent } = useAthlete();
  const t = useTheme();
  const age = ageOn(a.born);
  const [signedIn, setSignedIn] = useState(false);
  useCompanionContext({ surface: 'athlete', title: 'Access', prompts: ['What can you help with?'] });
  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <AthleteTop back />
      <Screen>
        <Display size={40}>Your access</Display>
        <Card>
          <Stack gap={2}>
            <Txt variant="small"><Txt variant="small" strong>{a.name}</Txt> · age {age} · {db.academies.find((x) => x.id === a.academyId)?.name}</Txt>
            <Txt variant="small" muted>{a.access === 'direct' ? 'You have your own login.' : a.access === 'parent_device' ? 'You use ditdit on a parent’s device, signed in through their account.' : 'Athlete access isn’t enabled yet.'}</Txt>
          </Stack>
        </Card>
        {viaParent ? <Banner tone="info">{age >= 13 ? `${first} is ${age} and can get an own login. A guardian or the academy enables it. Until then, nothing changes.` : `${first} will be able to get an own login at 13.`}</Banner> : null}
        {a.access === 'direct' ? (signedIn ? <Banner tone="ok">Signed in (simulated).</Banner> : (
          <Stack gap={3}>
            <Field label="Username"><Input defaultValue="tara.singh" autoCapitalize="none" autoComplete="username" /></Field>
            <Field label="Password"><Input defaultValue="cricket-2026" secureTextEntry autoComplete="current-password" /></Field>
            <Button variant="highlight" block onPress={() => setSignedIn(true)}>Sign in</Button>
            <Txt variant="xs" muted>Sign-in is simulated. No account is created.</Txt>
          </Stack>
        )) : null}
        <Txt variant="small" muted>If you move to another academy, your new academy invites you again. Feedback from this academy stays here.</Txt>
      </Screen>
    </View>
  );
}
