import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Plus, Check, Send, FileClock, Ban, Eye, RefreshCw } from 'lucide-react';
import { useStore, uid, nowISO } from '../../store/store';
import { athleteById, currentFocus, fmtDate } from '../../store/selectors';
import type { Report } from '../../data/types';
import { Assumption, Banner, Button, ConfirmDialog, Field, FlowCode, StatusBadge, StateBlock } from '../../components/ui';
import { ReportView } from '../../components/ReportView';
import { Seam } from '../../components/Seam';
import { useHuddle, useHuddleContext } from '../../huddle/Huddle';
import { PageHead } from './parts';
import { useWeb } from './useWeb';

export function ReportsPage() {
  const { db, update, audit } = useStore();
  const w = useWeb();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [athleteId, setAthleteId] = useState(params.get('athlete') ?? '');
  useHuddleContext({ surface: 'web', title: 'Parent reports', prompts: ['What can you help with?'] });

  const start = () => {
    if (!athleteId) return;
    const existing = db.reports.find((r) => r.athleteId === athleteId && r.period === 'October 2026');
    if (existing) { nav(`/web/reports/${existing.id}`); return; }
    const id = uid('rep');
    const { area } = currentFocus(db, athleteId);
    update((d) => d.reports.push({
      id, athleteId, period: 'October 2026', status: 'draft', version: 1, comment: '', focusSummary: area?.title ?? '',
      includes: { attendance: true, milestone: true, competition: true, video: false }, videoId: null,
      milestoneId: null, competitionId: null, history: [{ at: nowISO(), event: 'Draft started', by: w.actorName }],
    }));
    audit(w.actorName, `Started report for ${athleteById(db, athleteId)?.name}`, id);
    nav(`/web/reports/${id}`);
  };

  return (
    <>
      <PageHead title="Parent reports" codes="MW11.01 · MW06.07" />
      <section className="card row gap-3 wrap" style={{ marginBottom: 24 }}>
        <label htmlFor="rep-ath" className="strong">Start a report for</label>
        <select id="rep-ath" className="select" style={{ maxWidth: 280 }} value={athleteId} onChange={(e) => setAthleteId(e.target.value)}>
          <option value="">Choose athlete…</option>
          {db.athletes.filter((a) => a.status === 'active').map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <Button variant="primary" icon={<Plus size={16} />} disabled={!athleteId} onClick={start}>Start October report</Button>
      </section>
      <div className="card card-flush" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead><tr><th>Athlete</th><th>Period</th><th>Version</th><th>Published</th><th>Status</th></tr></thead>
          <tbody>
            {db.reports.map((r) => (
              <tr key={r.id}>
                <td><Link to={`/web/reports/${r.id}`}>{athleteById(db, r.athleteId)?.name}</Link></td>
                <td>{r.period}</td><td>v{r.version}</td>
                <td>{r.publishedAt ? fmtDate(r.publishedAt) : '—'}</td>
                <td><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** MW11.02–11 · XS03.03 · XS04.S06 */
export function ReportComposer() {
  const { reportId } = useParams();
  const { db, update, audit, toast } = useStore();
  const w = useWeb();
  const h = useHuddle();
  const report = db.reports.find((r) => r.id === reportId);
  const [draft, setDraft] = useState<Report | null>(report ?? null);
  const [correcting, setCorrecting] = useState(false);
  const [correctionNote, setCorrectionNote] = useState('');
  const [confirm, setConfirm] = useState<'share' | 'withdraw' | 'publish-correction' | null>(null);
  const [saving, setSaving] = useState(false);

  // Re-sync the editor only when the stored report itself changes (not on unrelated store updates).
  const storedKey = report ? JSON.stringify(report) : '';
  useEffect(() => {
    if (storedKey && !correcting) setDraft(JSON.parse(storedKey) as Report);
  }, [storedKey, correcting]);

  useHuddleContext(report ? {
    surface: 'web', title: `Report · ${athleteById(db, report.athleteId)?.name} · ${report.period}`, athleteId: report.athleteId,
    prompts: ['Draft a parent-friendly comment', 'Summarise recent sessions'],
  } : null, { useText: { label: 'Insert into coach comment', run: (t) => setDraft((d) => (d ? { ...d, comment: t } : d)) } });

  if (!report || !draft) return <StateBlock kind="archived" title="Report not found" action={<Link className="btn btn-sm" to="/web/reports">All reports</Link>} />;
  const athlete = athleteById(db, report.athleteId)!;
  const editable = report.status === 'draft' || correcting;
  const milestones = db.milestones.filter((m) => m.athleteId === athlete.id);
  const familyMilestones = milestones.filter((m) => m.visibleToFamily);
  const comps = db.competitions.filter((c) => c.athleteIds.includes(athlete.id));
  const vids = db.videos.filter((v) => v.athleteId === athlete.id && v.share === 'shared' && v.processing === 'ready');
  const dirty = JSON.stringify(draft) !== JSON.stringify(report);
  const guardians = athlete.guardianIds.map((g) => db.people.find((p) => p.id === g)!).filter(Boolean);

  const set = (patch: Partial<Report>) => setDraft({ ...draft, ...patch });
  const inc = (k: keyof Report['includes'], v: boolean) => setDraft({ ...draft, includes: { ...draft.includes, [k]: v } });

  /** XS04.S06: refuse to overwrite if someone else changed the report meanwhile. */
  const saveDraft = () => {
    const current = db.reports.find((r) => r.id === report.id)!;
    if (current.version !== draft.version || current.status !== report.status) {
      toast({ tone: 'err', text: 'Someone else changed this report. Reload to see their version. Your edits are still on screen.' });
      return;
    }
    setSaving(true);
    setTimeout(() => {
      update((d) => { const r = d.reports.find((x) => x.id === report.id)!; Object.assign(r, { comment: draft.comment, focusSummary: draft.focusSummary, includes: draft.includes, milestoneId: draft.milestoneId, competitionId: draft.competitionId, videoId: draft.videoId }); });
      setSaving(false);
      toast({ tone: 'ok', text: 'Draft saved.' });
    }, 300);
  };

  const pull = () => {
    const { area, goal } = currentFocus(db, athlete.id);
    set({
      focusSummary: area ? `${area.title}${goal ? ` — ${goal.title.charAt(0).toLowerCase()}${goal.title.slice(1)}` : ''}` : draft.focusSummary,
      milestoneId: familyMilestones[0]?.id ?? null,
      competitionId: comps.sort((a, b) => b.date.localeCompare(a.date))[0]?.id ?? null,
      videoId: vids[0]?.id ?? null,
    });
    toast({ tone: 'info', text: 'Pulled the current focus, latest milestone, competition and shared clip.' });
  };

  const notifyGuardians = (title: string, body: string) => update((d) => guardians.forEach((g) => d.notifications.push({ id: uid('n'), personId: g.id, kind: 'report', title, body, route: `/parent/report/${report.id}`, target: { type: 'report', id: report.id }, createdAt: nowISO(), read: false })));

  const commentErr = editable && draft.comment.trim().length > 0 && draft.comment.trim().length < 20 ? 'A comment for parents should be at least a sentence.' : '';

  return (
    <>
      <PageHead
        title={`${athlete.name.split(' ')[0]}’s report`}
        sub={<><Link to="/web/reports">Parent reports</Link> · {report.period} · v{report.version}</>}
        codes="MW11.02–11.11"
        actions={<StatusBadge status={report.status} />}
      />
      {report.status === 'corrected' && !correcting && <div style={{ marginBottom: 16 }}><Banner tone="warn"><FileClock size={14} style={{ display: 'inline' }} /> Corrected to v{report.version}: {report.correctionNote}</Banner></div>}
      {report.status === 'withdrawn' && <div style={{ marginBottom: 16 }}><Banner tone="err">Withdrawn. Guardians see a withdrawn notice instead of the report.</Banner></div>}
      {correcting && <div style={{ marginBottom: 16 }}><Banner tone="warn">Correcting a published report. Guardians will see version {report.version + 1} with your correction note, and the earlier version is kept. <Assumption code="MW11.11" /></Banner></div>}

      <div className="w-split" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(340px, 440px)' }}>
        <section className="stack gap-6" aria-label="Compose report">
          <div className="card stack gap-4">
            <div className="row between">
              <h2 className="h3">Development <FlowCode codes="MW11.02" /></h2>
              {editable && <Button size="sm" icon={<RefreshCw size={14} />} onClick={pull}>Pull latest</Button>}
            </div>
            <Field id="rc-focus" label="Current focus, in family-friendly words">
              <input id="rc-focus" className="input" value={draft.focusSummary} onChange={(e) => set({ focusSummary: e.target.value })} disabled={!editable} />
            </Field>
          </div>

          <div className="card stack gap-3">
            <div className="row between wrap gap-2">
              <h2 className="h3">Coach comment <FlowCode codes="MW11.03" /></h2>
              {editable && (
                <button className="seam-btn" onClick={() => h.openHuddle({ ask: 'Draft a parent-friendly comment' })}>
                  <Seam size={20} /> Draft with Huddle
                </button>
              )}
            </div>
            <Field id="rc-comment" label="Comment" hint="Parents read this first. Huddle drafts only from family-visible records, and you edit before approving." error={commentErr}>
              <textarea id="rc-comment" className="textarea" style={{ minHeight: 140 }} value={draft.comment} onChange={(e) => set({ comment: e.target.value })} disabled={!editable} aria-invalid={!!commentErr} />
            </Field>
            <Assumption code="PA04.04" />
          </div>

          <div className="card stack gap-2">
            <h2 className="h3">Include <FlowCode codes="MW11.04–11.07" /></h2>
            <label className="check-row"><input type="checkbox" checked={draft.includes.attendance} disabled={!editable} onChange={(e) => inc('attendance', e.target.checked)} /><span className="small"><strong>Attendance</strong>: from recorded sessions</span></label>
            <label className="check-row"><input type="checkbox" checked={draft.includes.milestone} disabled={!editable || !familyMilestones.length} onChange={(e) => inc('milestone', e.target.checked)} />
              <span className="small grow"><strong>Milestone</strong> <Assumption code="MW11.05" />
                {familyMilestones.length ? (
                  <select aria-label="Milestone" className="select" style={{ marginTop: 6 }} value={draft.milestoneId ?? ''} disabled={!editable || !draft.includes.milestone} onChange={(e) => set({ milestoneId: e.target.value || null })}>
                    <option value="">Choose…</option>{familyMilestones.map((m) => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                ) : <span className="muted"> · none yet</span>}
              </span>
            </label>
            <label className="check-row"><input type="checkbox" checked={draft.includes.competition} disabled={!editable || !comps.length} onChange={(e) => inc('competition', e.target.checked)} />
              <span className="small grow"><strong>Competition update</strong> <Assumption code="MW11.06" />
                {comps.length > 0 && (
                  <select aria-label="Competition" className="select" style={{ marginTop: 6 }} value={draft.competitionId ?? ''} disabled={!editable || !draft.includes.competition} onChange={(e) => set({ competitionId: e.target.value || null })}>
                    <option value="">Choose…</option>{comps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </span>
            </label>
            <label className="check-row"><input type="checkbox" checked={draft.includes.video} disabled={!editable || !vids.length} onChange={(e) => inc('video', e.target.checked)} />
              <span className="small grow"><strong>Video</strong>: only clips already shared with the athlete{!vids.length && <span className="muted"> · none shared yet</span>}
                {vids.length > 0 && (
                  <select aria-label="Video" className="select" style={{ marginTop: 6 }} value={draft.videoId ?? ''} disabled={!editable || !draft.includes.video} onChange={(e) => set({ videoId: e.target.value || null })}>
                    <option value="">Choose…</option>{vids.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
                  </select>
                )}
              </span>
            </label>
          </div>

          {correcting && (
            <Field id="rc-corr" label="What was corrected?" hint="Guardians see this note at the top of the report." error={!correctionNote.trim() ? 'A correction note is required.' : ''}>
              <input id="rc-corr" className="input" value={correctionNote} onChange={(e) => setCorrectionNote(e.target.value)} />
            </Field>
          )}

          <div className="card stack gap-3" style={{ borderColor: 'var(--line-strong)' }}>
            <h2 className="h3">Publish</h2>
            <p className="small muted">Goes to {guardians.length ? guardians.map((g) => g.name).join(' and ') : 'no linked guardian yet'}.</p>
            <div className="row gap-2 wrap">
              {report.status === 'draft' && (
                <>
                  <Button onClick={saveDraft} pending={saving} disabled={!dirty}>Save draft</Button>
                  <Button variant="primary" icon={<Check size={16} />} disabled={!w.canApprove || dirty || !report.comment.trim()} title={!w.canApprove ? 'Only the head coach approves' : dirty ? 'Save your changes first' : !report.comment.trim() ? 'Add a coach comment first' : undefined}
                    onClick={() => {
                      update((d) => { const r = d.reports.find((x) => x.id === report.id)!; r.status = 'approved'; r.approvedById = w.coach?.id; r.history.push({ at: nowISO(), event: 'Approved', by: w.actorName }); });
                      audit(w.actorName, `Approved report for ${athlete.name}`, report.id);
                      toast({ tone: 'ok', text: 'Approved. Share it when you’re ready.' });
                    }}>Approve <FlowCode codes="MW11.09" /></Button>
                </>
              )}
              {report.status === 'approved' && (
                <>
                  <Button variant="primary" icon={<Send size={16} />} disabled={!guardians.length} onClick={() => setConfirm('share')}>Share with family</Button>
                  <Button onClick={() => update((d) => { const r = d.reports.find((x) => x.id === report.id)!; r.status = 'draft'; r.history.push({ at: nowISO(), event: 'Returned to draft', by: w.actorName }); })}>Back to draft</Button>
                </>
              )}
              {(report.status === 'published' || report.status === 'corrected') && !correcting && (
                <>
                  <Button icon={<FileClock size={16} />} disabled={!w.canApprove} onClick={() => setCorrecting(true)}>Correct shared report</Button>
                  <Button variant="danger" icon={<Ban size={16} />} disabled={!w.canApprove} onClick={() => setConfirm('withdraw')}>Withdraw</Button>
                </>
              )}
              {correcting && (
                <>
                  <Button variant="primary" disabled={!correctionNote.trim() || !dirty} onClick={() => setConfirm('publish-correction')}>Publish correction</Button>
                  <Button variant="ghost" onClick={() => { setCorrecting(false); setDraft(report); setCorrectionNote(''); }}>Discard correction</Button>
                </>
              )}
            </div>
            {!w.canApprove && <p className="xs muted">Signed in as owner: approving and publishing need the head coach.</p>}
            {report.status === 'draft' && w.canApprove && !report.comment.trim() && !dirty && <p className="xs muted">Add and save a coach comment to approve.</p>}
          </div>

          <details>
            <summary className="small strong" style={{ cursor: 'pointer' }}>History ({report.history.length})</summary>
            <ul className="list" style={{ marginTop: 8 }}>
              {report.history.map((x, i) => <li key={i} className="small" style={{ padding: '6px 0' }}>{fmtDate(x.at)}: {x.event} · {x.by}</li>)}
            </ul>
          </details>
        </section>

        <aside style={{ position: 'sticky', top: 80 }} aria-label="Parent preview">
          <div className="row between" style={{ marginBottom: 8 }}>
            <p className="small strong row gap-1"><Eye size={14} /> What the parent sees</p>
            <FlowCode codes="MW11.08" />
          </div>
          <div className="card" style={{ background: 'var(--chalk-100)', maxHeight: 'calc(100vh - 140px)', overflowY: 'auto' }}>
            <ReportView db={db} report={{ ...draft, status: correcting ? 'corrected' : draft.status, version: correcting ? report.version + 1 : draft.version, correctionNote: correcting ? correctionNote || '…' : draft.correctionNote }} />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirm === 'share'}
        title="Share with the family?"
        body={`${guardians.map((g) => g.name).join(' and ')} will get a notification and can read it in the Parent App. Once shared, changes are published as visible corrections.`}
        confirmLabel="Share report"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          update((d) => { const r = d.reports.find((x) => x.id === report.id)!; r.status = 'published'; r.publishedAt = nowISO(); r.history.push({ at: nowISO(), event: 'Published to guardians', by: w.actorName }); });
          notifyGuardians(`${athlete.name.split(' ')[0]}’s ${report.period} report is ready`, 'Read the coach’s comment and current focus.');
          audit(w.actorName, `Shared report for ${athlete.name}`, report.id);
          toast({ tone: 'ok', text: 'Shared. Guardians have been notified.' });
          setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === 'publish-correction'}
        title={`Publish version ${report.version + 1}?`}
        body="Guardians get a notification that the report was corrected, with your note. The earlier version is kept in history."
        confirmLabel="Publish correction"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          update((d) => {
            const r = d.reports.find((x) => x.id === report.id)!;
            Object.assign(r, { comment: draft.comment, focusSummary: draft.focusSummary, includes: draft.includes, milestoneId: draft.milestoneId, competitionId: draft.competitionId, videoId: draft.videoId });
            r.version += 1; r.status = 'corrected'; r.correctionNote = correctionNote.trim(); r.publishedAt = nowISO();
            r.history.push({ at: nowISO(), event: `Corrected → v${r.version} (${correctionNote.trim()})`, by: w.actorName });
          });
          notifyGuardians(`${athlete.name.split(' ')[0]}’s report was corrected`, correctionNote.trim());
          audit(w.actorName, `Published correction for ${athlete.name}’s report`, report.id);
          toast({ tone: 'ok', text: 'Correction published.' });
          setCorrecting(false); setCorrectionNote(''); setConfirm(null);
        }}
      />
      <ConfirmDialog
        open={confirm === 'withdraw'}
        title="Withdraw this report?"
        body="Guardians who open it, including from an old notification, see that it was withdrawn. It stays in history here."
        confirmLabel="Withdraw report"
        tone="danger"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          update((d) => { const r = d.reports.find((x) => x.id === report.id)!; r.status = 'withdrawn'; r.history.push({ at: nowISO(), event: 'Withdrawn', by: w.actorName }); });
          audit(w.actorName, `Withdrew report for ${athlete.name}`, report.id);
          toast({ tone: 'ok', text: 'Report withdrawn.' });
          setConfirm(null);
        }}
      />
    </>
  );
}
