import { useEffect, useState } from 'react';
import { Plus, Archive, RotateCcw, Check } from 'lucide-react';
import { useStore, uid } from '../../store/store';
import { Assumption, Banner, Button, Field, FlowCode, StatusBadge } from '../../components/ui';
import { useCompanionContext } from '../../companion/Companion';
import { PageHead } from './parts';
import { useWeb } from './useWeb';

interface SetupDraft { step: number; name: string; city: string; location: string; sport: string; ageGroups: string }
const KEY = 'ditdit-proto-v2:setup-draft';
const emptyDraft: SetupDraft = { step: 0, name: '', city: '', location: '', sport: 'Cricket', ageGroups: 'U14, U16' };
const loadDraft = (): SetupDraft | null => { try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : null; } catch { return null; } };
const saveDraft = (d: SetupDraft | null) => { try { if (d) localStorage.setItem(KEY, JSON.stringify(d)); else localStorage.removeItem(KEY); } catch { /* private mode */ } };

/** MW01.01–06 */
export function AcademyPage() {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const ac = w.academy;
  const [name, setName] = useState(ac.name);
  const [newLoc, setNewLoc] = useState('');
  const [setup, setSetup] = useState<SetupDraft | null>(null);
  const [saved, setSaved] = useState<SetupDraft | null>(loadDraft());
  useCompanionContext({ surface: 'web', title: 'Academy settings', prompts: ['What can you help with?'] });
  useEffect(() => { if (setup) { saveDraft(setup); setSaved(setup); } }, [setup]);

  const locDup = db.academies.find((a) => a.id === ac.id)!.locations.some((l) => l.name.toLowerCase() === newLoc.trim().toLowerCase());

  if (setup) return <SetupWizard draft={setup} setDraft={setSetup} onDone={() => { saveDraft(null); setSaved(null); setSetup(null); }} />;

  return (
    <>
      <PageHead title="Academy" codes="MW01.01–01.06" />
      {saved && (
        <div style={{ marginBottom: 16 }}>
          <Banner tone="warn" action={<Button size="sm" onClick={() => setSetup(saved)}>Resume setup</Button>}>
            You have an unfinished academy setup{saved.name ? ` for “${saved.name}”` : ''}, step {saved.step + 1} of 4. <FlowCode codes="MW01.05" />
          </Banner>
        </div>
      )}
      <div className="w-grid w-grid-2" style={{ alignItems: 'start' }}>
        <section className="card stack gap-4">
          <h2 className="h3">Details <FlowCode codes="MW01.06" /></h2>
          <Field id="ac-name" label="Academy name" error={!name.trim() ? 'Name is required.' : ''}><input id="ac-name" className="input" value={name} onChange={(e) => setName(e.target.value)} disabled={!w.canManageOrg} /></Field>
          <Field id="ac-sport" label="Sport" hint="One sport per academy in this prototype."><input id="ac-sport" className="input" value={ac.sport} disabled /></Field>
          <Assumption code="MW01.01" />
          <Button variant="primary" disabled={!w.canManageOrg || !name.trim() || name === ac.name} onClick={() => {
            update((d) => { d.academies.find((x) => x.id === ac.id)!.name = name.trim(); });
            audit(w.actorName, `Renamed academy to ${name.trim()}`, ac.id);
            toast({ tone: 'ok', text: 'Academy details saved. Every app shows the new name.' });
          }}>Save details</Button>
        </section>
        <section className="card stack gap-3">
          <h2 className="h3">Locations <FlowCode codes="MW01.02" /></h2>
          <ul className="list">
            {ac.locations.map((l) => (
              <li key={l.id} className="list-row" style={{ padding: '10px 0' }}>
                <span className="grow small strong">{l.name}</span>
                <StatusBadge status={l.status} />
                {w.canManageOrg && (l.status === 'active'
                  ? <Button size="sm" variant="ghost" icon={<Archive size={14} />} onClick={() => { update((d) => { d.academies.find((x) => x.id === ac.id)!.locations.find((y) => y.id === l.id)!.status = 'inactive'; }); toast({ tone: 'ok', text: `${l.name} closed. Past sessions there keep their location.` }); }}>Close</Button>
                  : <Button size="sm" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => update((d) => { d.academies.find((x) => x.id === ac.id)!.locations.find((y) => y.id === l.id)!.status = 'active'; })}>Reopen</Button>)}
              </li>
            ))}
          </ul>
          {w.canManageOrg && (
            <form className="row gap-2" onSubmit={(e) => { e.preventDefault(); if (!newLoc.trim() || locDup) return; update((d) => { d.academies.find((x) => x.id === ac.id)!.locations.push({ id: uid('loc'), name: newLoc.trim(), status: 'active' }); }); toast({ tone: 'ok', text: 'Location added.' }); setNewLoc(''); }}>
              <label htmlFor="new-loc" className="sr-only">New location</label>
              <input id="new-loc" className="input" placeholder="New location name" value={newLoc} onChange={(e) => setNewLoc(e.target.value)} aria-invalid={locDup} />
              <Button type="submit" icon={<Plus size={14} />} disabled={!newLoc.trim() || locDup}>Add</Button>
            </form>
          )}
          {locDup && <p className="xs" style={{ color: 'var(--err)' }}>A location with that name exists.</p>}
        </section>
      </div>
      <ScoreGovernance />
      <section className="card row between wrap gap-3" style={{ marginTop: 24 }}>
        <div><h2 className="h3">Set up another academy</h2><p className="small muted">First-time setup: create the academy, add a location, configure the sport, then complete.</p></div>
        <Button onClick={() => setSetup(saved ?? emptyDraft)} disabled={!w.canManageOrg}>{saved ? 'Resume setup' : 'Start setup'}</Button>
      </section>
    </>
  );
}

function SetupWizard({ draft, setDraft, onDone }: { draft: SetupDraft; setDraft: (d: SetupDraft | null) => void; onDone: () => void }) {
  const { db, update, toast } = useStore();
  const [touched, setTouched] = useState(false);
  const steps = ['Create academy', 'Add location', 'Configure sport', 'Complete'];
  const dupName = db.academies.some((a) => a.name.toLowerCase() === draft.name.trim().toLowerCase());
  const errs = [
    !draft.name.trim() ? 'Enter the academy name.' : dupName ? 'An academy with this name already exists.' : '',
    !draft.location.trim() ? 'Add at least one training location.' : '',
    !draft.sport ? 'Choose a sport.' : '',
    '',
  ];
  const next = () => { setTouched(true); if (errs[draft.step]) return; setTouched(false); setDraft({ ...draft, step: draft.step + 1 }); };
  return (
    <>
      <PageHead title="Academy setup" sub="Your progress saves as you go, so you can leave and resume later." codes="MW01.01–01.05" actions={<Button variant="ghost" onClick={() => setDraft(null)}>Save and exit</Button>} />
      <ol className="stepper" style={{ display: 'flex', padding: 0, margin: '0 0 24px' }} aria-label="Setup progress">
        {steps.map((s, i) => <li key={s} data-state={i < draft.step ? 'done' : i === draft.step ? 'current' : 'todo'} aria-current={i === draft.step ? 'step' : undefined}>{i + 1}. {s}</li>)}
      </ol>
      <section className="card stack gap-4" style={{ maxWidth: 560 }}>
        {draft.step === 0 && (<>
          <Field id="su-name" label="Academy name" error={touched ? errs[0] : ''}><input id="su-name" className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
          <Field id="su-city" label="City" optional><input id="su-city" className="input" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} /></Field>
        </>)}
        {draft.step === 1 && <Field id="su-loc" label="First training location" error={touched ? errs[1] : ''}><input id="su-loc" className="input" value={draft.location} onChange={(e) => setDraft({ ...draft, location: e.target.value })} placeholder="e.g. Main Ground" /></Field>}
        {draft.step === 2 && (<>
          <Field id="su-sport" label="Sport"><select id="su-sport" className="select" value={draft.sport} onChange={(e) => setDraft({ ...draft, sport: e.target.value })}>{['Cricket', 'Tennis', 'Football', 'Badminton'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field id="su-ag" label="Age groups" hint="Comma-separated"><input id="su-ag" className="input" value={draft.ageGroups} onChange={(e) => setDraft({ ...draft, ageGroups: e.target.value })} /></Field>
          <Assumption code="MW01.01" />
        </>)}
        {draft.step === 3 && (
          <div className="stack gap-2">
            <p className="h3">Ready to create {draft.name}</p>
            <p className="small muted">{draft.sport} · {draft.location} · {draft.ageGroups}</p>
            <p className="small">Next: invite a head coach, add athletes and create batches.</p>
          </div>
        )}
        <div className="row gap-2">
          {draft.step > 0 && <Button onClick={() => setDraft({ ...draft, step: draft.step - 1 })}>Back</Button>}
          {draft.step < 3 ? <Button variant="primary" onClick={next}>Continue</Button> : (
            <Button variant="primary" icon={<Check size={16} />} onClick={() => {
              update((d) => d.academies.push({ id: uid('ac'), name: draft.name.trim(), sport: draft.sport, locations: [{ id: uid('loc'), name: draft.location.trim(), status: 'active' }], setup: { step: 4, completed: true } }));
              toast({ tone: 'ok', text: `${draft.name} created. It appears in the academy switcher for its staff.` });
              onDone();
            }}>Complete setup</Button>
          )}
        </div>
      </section>
    </>
  );
}

/** Academy governance for the Dit Score and comparison (head coach / owner). */
function ScoreGovernance() {
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const st = db.scoreSettings;
  const set = (patch: Partial<typeof st>, msg: string) => {
    update((d) => { d.scoreSettings = { ...d.scoreSettings, ...patch }; });
    audit(w.actorName, msg);
    toast({ tone: 'ok', text: msg });
  };
  return (
    <section className="card stack gap-4" style={{ marginTop: 24 }} aria-labelledby="gov-h">
      <div className="row between wrap gap-2">
        <h2 id="gov-h" className="h3">Dit Score and comparison</h2>
        <span className="badge badge-outline">Illustrative method</span>
      </div>
      <label className="check-row"><input type="checkbox" checked={st.enabled} disabled={!w.canManageOrg} onChange={(e) => set({ enabled: e.target.checked }, e.target.checked ? 'Dit Scores turned on' : 'Dit Scores turned off for the academy')} /><span className="small"><strong>Show Dit Scores</strong> to athletes, families and coaches. Coaches can still pause any single score.</span></label>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }} disabled={!w.canManageOrg || !st.enabled}>
        <legend className="small strong" style={{ marginBottom: 6 }}>Squad progress comparison (opt-in for athletes)</legend>
        {db.batches.filter((b) => b.status === 'active').map((b) => (
          <label key={b.id} className="check-row"><input type="checkbox" checked={st.comparisonBatchIds.includes(b.id)} onChange={(e) => set({ comparisonBatchIds: e.target.checked ? [...st.comparisonBatchIds, b.id] : st.comparisonBatchIds.filter((x) => x !== b.id) }, `Squad comparison ${e.target.checked ? 'allowed' : 'turned off'} for ${b.name}`)} /><span className="small">{b.name}</span></label>
        ))}
      </fieldset>
      <div className="w-grid w-grid-2">
        <Field id="cmp-age" label="Comparison offered from age" hint="Below this age athletes only see their own progress.">
          <select id="cmp-age" className="select" value={st.comparisonMinAge} disabled={!w.canManageOrg} onChange={(e) => set({ comparisonMinAge: Number(e.target.value) }, `Comparison minimum age set to ${e.target.value}`)}>
            {[11, 12, 13, 14, 16].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field id="rank-age" label="Positions shown from age" hint="Younger athletes see bands (top, middle, building), never a number.">
          <select id="rank-age" className="select" value={st.rankPositionsMinAge} disabled={!w.canManageOrg} onChange={(e) => set({ rankPositionsMinAge: Number(e.target.value) }, `Rank positions from age ${e.target.value}`)}>
            {[14, 16, 18, 99].map((n) => <option key={n} value={n}>{n === 99 ? 'Never' : n}</option>)}
          </select>
        </Field>
      </div>
      <p className="xs muted">Comparison ranks improvement within one batch and one sport, never the score itself. Cross-sport and academy-wide ranking stay off until a validated method exists.</p>
    </section>
  );
}
