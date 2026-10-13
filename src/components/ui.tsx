import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import {
  AlertTriangle, Ban, Check, CircleDashed, CloudOff, FileClock, Info, Lock, RefreshCw, Archive, X, Trophy,
  Eye, FileText, Video, Flag, NotebookPen, CalendarCheck,
} from 'lucide-react';
import { assumptions } from '../data/policy';
import { useStore } from '../store/store';
import type { TimelineItem } from '../store/selectors';
import { fmtDate, initials } from '../store/selectors';

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'highlight' | 'ghost' | 'danger' | 'default';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  pending?: boolean;
  icon?: ReactNode;
};

/** While pending, the button stays focusable but blocks repeat submits (build brief: dedupe). */
export function Button({ variant = 'default', size = 'md', block, pending, icon, children, className = '', onClick, ...rest }: BtnProps) {
  const cls = ['btn', variant !== 'default' && `btn-${variant}`, size !== 'md' && `btn-${size}`, block && 'btn-block', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button
      type="button"
      className={cls}
      aria-busy={pending || undefined}
      aria-disabled={pending || rest.disabled || undefined}
      onClick={(e) => {
        if (pending) return;
        onClick?.(e);
      }}
      {...rest}
    >
      {pending ? <span className="spinner" aria-hidden /> : icon}
      {children}
    </button>
  );
}

const STATUS: Record<string, { tone: string; icon: ReactNode; label: string }> = {
  // publication & lifecycle
  draft: { tone: '', icon: <CircleDashed size={12} />, label: 'Draft' },
  approved: { tone: 'info', icon: <Check size={12} />, label: 'Approved' },
  published: { tone: 'ok', icon: <Check size={12} />, label: 'Published' },
  corrected: { tone: 'warn', icon: <FileClock size={12} />, label: 'Corrected' },
  withdrawn: { tone: 'err', icon: <Ban size={12} />, label: 'Withdrawn' },
  archived: { tone: 'outline', icon: <Archive size={12} />, label: 'Archived' },
  inactive: { tone: 'outline', icon: <Archive size={12} />, label: 'Inactive' },
  invited: { tone: 'info', icon: <CircleDashed size={12} />, label: 'Invited' },
  active: { tone: 'ok', icon: <Check size={12} />, label: 'Active' },
  transferred: { tone: 'outline', icon: <RefreshCw size={12} />, label: 'Transferred' },
  duplicate_suspected: { tone: 'warn', icon: <AlertTriangle size={12} />, label: 'Possible duplicate' },
  // sync
  local: { tone: '', icon: <CircleDashed size={12} />, label: 'On this device' },
  queued: { tone: 'warn', icon: <CloudOff size={12} />, label: 'Queued' },
  sending: { tone: 'info', icon: <RefreshCw size={12} />, label: 'Sending' },
  synced: { tone: 'ok', icon: <Check size={12} />, label: 'Synced' },
  failed: { tone: 'err', icon: <X size={12} />, label: 'Failed' },
  conflict: { tone: 'err', icon: <AlertTriangle size={12} />, label: 'Conflict' },
  // tasks
  open: { tone: 'info', icon: <CircleDashed size={12} />, label: 'Open' },
  in_progress: { tone: 'warn', icon: <RefreshCw size={12} />, label: 'In progress' },
  blocked: { tone: 'err', icon: <Ban size={12} />, label: 'Blocked' },
  completed: { tone: 'ok', icon: <Check size={12} />, label: 'Completed' },
  cancelled: { tone: 'outline', icon: <X size={12} />, label: 'Cancelled' },
  // reassessment
  pending: { tone: 'info', icon: <CircleDashed size={12} />, label: 'Pending' },
  submitted: { tone: 'warn', icon: <FileClock size={12} />, label: 'Awaiting approval' },
  // video
  uploading: { tone: 'info', icon: <RefreshCw size={12} />, label: 'Uploading' },
  uploaded: { tone: 'ok', icon: <Check size={12} />, label: 'Uploaded' },
  processing: { tone: 'info', icon: <RefreshCw size={12} />, label: 'Processing' },
  ready: { tone: 'ok', icon: <Check size={12} />, label: 'Ready' },
  shared: { tone: 'lime', icon: <Eye size={12} />, label: 'Shared' },
  private: { tone: 'outline', icon: <Lock size={12} />, label: 'Coaches only' },
  // area
  achieved: { tone: 'lime', icon: <Trophy size={12} />, label: 'Achieved' },
  reopened: { tone: 'warn', icon: <RefreshCw size={12} />, label: 'Reopened' },
  closed: { tone: 'outline', icon: <Archive size={12} />, label: 'Closed' },
  scheduled: { tone: 'outline', icon: <CircleDashed size={12} />, label: 'Scheduled' },
};

/** Status always pairs a shape glyph with text — colour is never the only signal. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const s = STATUS[status] ?? { tone: '', icon: null, label: status };
  return (
    <span className={`badge ${s.tone ? `badge-${s.tone}` : ''}`}>
      {s.icon}
      {label ?? s.label}
    </span>
  );
}

export function Assumption({ code }: { code: string }) {
  const a = assumptions[code];
  if (!a) return null;
  return (
    <span className="assumption" title={`${a.code} — FigJam marker: “${a.marker}”. Prototype assumption: ${a.assumption}`}>
      <Info size={12} aria-hidden />
      Assumption {a.code}
      <span className="sr-only">: {a.assumption}</span>
    </span>
  );
}

export function AssumptionNote({ code }: { code: string }) {
  const a = assumptions[code];
  if (!a) return null;
  return (
    <p className="xs" style={{ color: 'var(--warn)' }}>
      <strong>Assumption {a.code}</strong> (“{a.marker}”): {a.assumption}
    </p>
  );
}

export const FlowCode = ({ codes }: { codes: string }) => <span className="flow-code">{codes}</span>;

export function Avatar({ name, size, muted }: { name: string; size?: 'sm' | 'lg'; muted?: boolean }) {
  return (
    <span className={`avatar ${size ? `avatar-${size}` : ''} ${muted ? 'avatar-muted' : ''}`} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function Banner({ tone = 'info', children, action }: { tone?: 'info' | 'warn' | 'err' | 'ok'; children: ReactNode; action?: ReactNode }) {
  const icon = { info: <Info size={16} />, warn: <AlertTriangle size={16} />, err: <AlertTriangle size={16} />, ok: <Check size={16} /> }[tone];
  return (
    <div className={`banner ${tone !== 'info' ? `banner-${tone}` : ''}`} role={tone === 'err' ? 'alert' : 'status'}>
      {icon}
      <div className="grow">{children}</div>
      {action}
    </div>
  );
}

export function StateBlock({
  kind, title, body, action,
}: { kind: 'empty' | 'error' | 'permission' | 'archived' | 'offline' | 'withdrawn'; title: string; body?: ReactNode; action?: ReactNode }) {
  const map = {
    empty: { cls: '', icon: <CircleDashed size={20} /> },
    error: { cls: 'state-err', icon: <AlertTriangle size={20} /> },
    permission: { cls: 'state-warn', icon: <Lock size={20} /> },
    archived: { cls: '', icon: <Archive size={20} /> },
    offline: { cls: 'state-info', icon: <CloudOff size={20} /> },
    withdrawn: { cls: 'state-warn', icon: <Ban size={20} /> },
  }[kind];
  return (
    <div className={`state ${map.cls}`} role={kind === 'error' ? 'alert' : undefined}>
      <span className="state-icon" aria-hidden>{map.icon}</span>
      <h3 className="h3">{title}</h3>
      {body && <div className="small muted" style={{ maxWidth: '52ch' }}>{body}</div>}
      {action}
    </div>
  );
}

export function Field({
  id, label, hint, error, children, optional,
}: { id: string; label: string; hint?: string; error?: string; optional?: boolean; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>
        {label} {optional && <span className="muted" style={{ fontWeight: 400 }}>(optional)</span>}
      </label>
      {children}
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && (
        <span className="error" id={`${id}-err`} role="alert">
          <AlertTriangle size={12} aria-hidden /> {error}
        </span>
      )}
    </div>
  );
}

export function Metric({ label, value, basis, accent, code }: { label: string; value: ReactNode; basis: string; accent?: boolean; code?: string }) {
  return (
    <div className="metric" style={accent ? { background: 'var(--hl)', borderColor: 'var(--hl)', color: 'var(--char-700)' } : undefined}>
      <span className="metric-label">{label}</span>
      <span className="num">{value}</span>
      <span className="metric-basis" style={accent ? { color: 'var(--char-700)' } : undefined}>{basis}</span>
      {code && <span className="flow-code" style={accent ? { color: 'var(--char-700)' } : undefined}>{code}</span>}
    </div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="toast" data-tone={t.tone}>
          <span className="toast-mark" aria-hidden />
          <span className="grow">{t.text}</span>
          {t.action && (
            <button onClick={() => { t.action!.run(); dismissToast(t.id); }}>{t.action.label}</button>
          )}
          <button aria-label="Dismiss" onClick={() => dismissToast(t.id)} style={{ color: 'var(--grey-600)' }}>
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Destructive-action guard. Uses native <dialog> for focus trapping and Esc. */
export function ConfirmDialog({
  open, title, body, confirmLabel, tone = 'primary', onConfirm, onCancel, children,
}: {
  open: boolean; title: string; body?: ReactNode; confirmLabel: string; tone?: 'primary' | 'danger';
  onConfirm: () => void; onCancel: () => void; children?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="dialog" onCancel={(e) => { e.preventDefault(); onCancel(); }} aria-labelledby="dlg-title">
      <div className="dialog-body">
        <h2 id="dlg-title" className="h2">{title}</h2>
        {body && <div className="small muted">{body}</div>}
        {children}
        <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </dialog>
  );
}

const TL_ICON: Record<TimelineItem['kind'], ReactNode> = {
  observation: <NotebookPen size={12} />,
  milestone: <Trophy size={12} />,
  reassessment: <Flag size={12} />,
  video: <Video size={12} />,
  area: <Flag size={12} />,
  report: <FileText size={12} />,
  session: <CalendarCheck size={12} />,
};

export function Timeline({ items, empty }: { items: TimelineItem[]; empty?: string }) {
  if (!items.length) return <StateBlock kind="empty" title={empty ?? 'Nothing recorded yet'} />;
  return (
    <ol className="timeline">
      {items.map((i) => (
        <li key={`${i.kind}-${i.id}`}>
          <span className="tl-dot" data-kind={i.kind} aria-hidden>{TL_ICON[i.kind]}</span>
          <div>
            <div className="xs muted">{fmtDate(i.date, { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div className="small strong">{i.title}</div>
            {i.detail && <p className="small muted" style={{ marginTop: 2 }}>{i.detail}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
