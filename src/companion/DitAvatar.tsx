/* The ditdit companion.
   Brand idea: "dit" is the short signal in Morse code, so ditdit = two dots (··).
   The same two dots are the tittles of the i's in the wordmark, the companion's eyes,
   and the two overlapping discs of the Dit Score.

   Three explored concepts share one state vocabulary:
     A  symbol     — the two dots alone; motion carries all meaning
     B  character  — a soft capsule body with dot eyes and a mouth; most expressive
     C  hybrid     — (recommended) dots that live in a squircle face and can open into two discs
   Forms (C): compact (dots only) → face (squircle) → immersive (two discs). */

export type DitState = 'idle' | 'listening' | 'thinking' | 'explaining' | 'celebrating' | 'uncertain' | 'insight';
export type DitConcept = 'A' | 'B' | 'C';
export type DitForm = 'compact' | 'face' | 'immersive';

export const DIT_STATES: { state: DitState; label: string; meaning: string }[] = [
  { state: 'idle', label: 'Idle', meaning: 'Present, not busy. Blinks rarely.' },
  { state: 'listening', label: 'Listening', meaning: 'Mic is live. Dots pulse in a dit-dit rhythm.' },
  { state: 'thinking', label: 'Thinking', meaning: 'Reading records. Eyes look across.' },
  { state: 'explaining', label: 'Explaining', meaning: 'Talking you through something. One dot stretches to a dash.' },
  { state: 'celebrating', label: 'Celebrating', meaning: 'A coach-confirmed milestone. Happy eyes, small hop.' },
  { state: 'uncertain', label: 'Unsure', meaning: 'Not enough data, or the answer needs your coach. Head tilts.' },
  { state: 'insight', label: 'Insight ready', meaning: 'Something relevant on this screen. A notch appears.' },
];

export function DitAvatar({
  state = 'idle', concept = 'C', form = 'face', size = 40, label, still = false,
}: { state?: DitState; concept?: DitConcept; form?: DitForm; size?: number; label?: string; still?: boolean }) {
  const a11y = label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const };
  const cls = `dit dit-${concept} dit-${form}${still ? ' dit-still' : ''}`;

  if (concept === 'A' || form === 'compact') {
    return (
      <svg className={cls} data-state={state} width={size} height={size} viewBox="0 0 48 48" {...a11y}>
        <g className="dit-eyes">
          <rect className="dit-eye dit-eye-l" x="10" y="19" width="10" height="10" rx="5" />
          <rect className="dit-eye dit-eye-r" x="28" y="19" width="10" height="10" rx="5" />
        </g>
        <g className="dit-bars">
          {[8, 16, 24, 32, 40].map((x, i) => <rect key={x} className="dit-bar" x={x - 2} y="16" width="4" height="16" rx="2" style={{ animationDelay: `${i * 90}ms` }} />)}
        </g>
        <circle className="dit-burst" cx="24" cy="24" r="20" />
        <circle className="dit-notch" cx="42" cy="8" r="4" />
      </svg>
    );
  }

  if (concept === 'B') {
    return (
      <svg className={cls} data-state={state} width={size} height={size} viewBox="0 0 48 48" {...a11y}>
        <g className="dit-body-g">
          <rect className="dit-body" x="8" y="6" width="32" height="38" rx="16" />
          <rect className="dit-band" x="8" y="12" width="32" height="5" />
          <g className="dit-eyes">
            <rect className="dit-eye dit-eye-l" x="15" y="21" width="6" height="7" rx="3" />
            <rect className="dit-eye dit-eye-r" x="27" y="21" width="6" height="7" rx="3" />
          </g>
          <path className="dit-happy" d="M15 26 q3 -5 6 0 M27 26 q3 -5 6 0" />
          <path className="dit-mouth" d="M19 34 q5 4 10 0" />
        </g>
        <circle className="dit-notch" cx="42" cy="8" r="4" />
      </svg>
    );
  }

  // Concept C — hybrid face / immersive
  return (
    <svg className={cls} data-state={state} width={size} height={size} viewBox="0 0 48 48" {...a11y}>
      {form === 'immersive' ? (
        <g className="dit-discs">
          <circle className="dit-disc dit-disc-l" cx="19" cy="24" r="15" />
          <circle className="dit-disc dit-disc-r" cx="29" cy="24" r="15" />
        </g>
      ) : (
        <rect className="dit-face" x="3" y="3" width="42" height="42" rx="15" />
      )}
      <g className="dit-eyes">
        <rect className="dit-eye dit-eye-l" x="13" y="19" width="9" height="9" rx="4.5" />
        <rect className="dit-eye dit-eye-r" x="26" y="19" width="9" height="9" rx="4.5" />
      </g>
      <path className="dit-happy" d="M13 25 q4.5 -7 9 0 M26 25 q4.5 -7 9 0" />
      <circle className="dit-notch" cx="41" cy="7" r="4" />
    </svg>
  );
}
