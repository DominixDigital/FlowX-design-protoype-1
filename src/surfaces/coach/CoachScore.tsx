import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldCheck, PauseCircle, PlayCircle, AlertTriangle } from 'lucide-react';
import { useStore, nowISO } from '../../store/store';
import { athleteById, coachById, fmtDate } from '../../store/selectors';
import { Banner, Button, FlowCode, StateBlock } from '../../components/ui';
import { useCompanionContext } from '../../companion/Companion';
import { ScoreBreakdown, ScoreSignal } from '../../score/ScoreViz';
import { computeDitScore, scoreChange } from '../../score/ditScore';
import { CoachHeader, CoachGate, NotFound } from './parts';
import { useCoach } from './useCoach';

/** Coach validation of the data behind an athlete's Dit Score (coach = source of truth). */
export function CoachScoreReview() {
  const { id } = useParams();
  const { db, update, audit, toast } = useStore();
  const c = useCoach();
  const a = athleteById(db, id);
  const [note, setNote] = useState('');
  useCompanionContext(a ? { surface: 'coach', title: `Dit Score inputs · ${a.name}`, athleteId: a.id, prompts: ['Why did the Dit Score change?', 'What counts towards the Dit Score?'] } : null);
  if (!a) return <NotFound what="athlete" back="/coach/athletes" />;
  const review = db.scoreReviews.find((r) => r.athleteId === a.id);
  const raw = computeDitScore({ ...db, scoreReviews: db.scoreReviews.filter((r) => r.athleteId !== a.id) }, a.id);
  const ch = scoreChange(db, a.id);
  const isPrimary = a.primaryCoachId === c.coach?.id || c.role === 'head_coach';

  const record = (paused: boolean) => {
    update((d) => {
      d.scoreReviews = d.scoreReviews.filter((r) => r.athleteId !== a.id);
      d.scoreReviews.push({ athleteId: a.id, reviewedById: c.coach!.id, at: nowISO(), paused, note: paused ? note.trim() : undefined });
    });
    audit(c.person.name, paused ? `Paused ${a.name}’s Dit Score: ${note}` : `Confirmed ${a.name}’s Dit Score inputs`, a.id);
    toast({ tone: 'ok', text: paused ? 'Score paused. The athlete sees “paused by your coach”, with no reason shown.' : 'Inputs confirmed. The athlete sees that a coach checked them.' });
    setNote('');
  };

  const selfReported = raw.kind === 'scored' && raw.dims.find((d) => d.def.trust === 'self_reported' && (d.value ?? 0) >= 100);

  return (
    <>
      <CoachHeader back={`/coach/athlete/${a.id}`} backLabel={a.name.split(' ')[0]} />
      <CoachGate>
        <section className="m-section">
          <p className="small muted">{a.name}</p>
          <h1 className="display display-lg">Dit Score inputs</h1>
          <FlowCode codes="Score validation · coach review" />
        </section>
        <section className="m-section card stack gap-2">
          <div className="row between">
            <ScoreSignal state={raw} />
            <span className="badge badge-outline">Illustrative</span>
          </div>
          {raw.kind === 'scored' && <p className="small muted">{ch ? `${ch.delta >= 0 ? '+' : ''}${ch.delta} since ${fmtDate(ch.since)}` : 'First scored week'} · {raw.coverage}% of planned inputs measurable</p>}
          {raw.kind === 'building' && <p className="small">No score yet. Missing: {raw.missing.join('; ')}.</p>}
          {review && <p className="xs muted">Last review: {coachById(db, review.reviewedById)?.name}, {fmtDate(review.at)}{review.paused ? ' · paused' : ''}</p>}
        </section>

        {selfReported && <div className="m-section"><Banner tone="warn"><AlertTriangle size={14} style={{ display: 'inline' }} /> Practice is at 100% and self-reported. Worth a word before you confirm.</Banner></div>}

        {(raw.kind === 'scored' || raw.kind === 'building') ? (
          <section className="m-section card">
            <ScoreBreakdown state={raw} audience="coach" />
          </section>
        ) : <div className="m-section"><StateBlock kind="empty" title="Scores are off at this academy" /></div>}

        <section className="m-section stack gap-3">
          {!isPrimary && <Banner tone="info">Only {a.name.split(' ')[0]}’s primary coach or the head coach can confirm or pause the score.</Banner>}
          <Button variant="primary" size="lg" block icon={<ShieldCheck size={16} />} disabled={!isPrimary} onClick={() => record(false)}>
            {review?.paused ? 'Resume and confirm inputs' : 'Inputs look right'}
          </Button>
          {!review?.paused && (
            <div className="card stack gap-2">
              <label htmlFor="pause-note" className="small strong">Pause the score</label>
              <p className="xs muted">Use this if the data looks wrong, for example a mismarked session. The athlete isn’t told why.</p>
              <input id="pause-note" className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason, for coaches only" />
              <Button variant="danger" icon={<PauseCircle size={16} />} disabled={!isPrimary || !note.trim()} onClick={() => record(true)}>Pause score</Button>
            </div>
          )}
          {review?.paused && <p className="small muted row gap-1"><PlayCircle size={14} /> Paused: “{review.note}”</p>}
        </section>
      </CoachGate>
    </>
  );
}
