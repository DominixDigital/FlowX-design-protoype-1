import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { FlowCode } from '../../components/ui';

export function PageHead({ title, sub, codes, actions }: { title: ReactNode; sub?: ReactNode; codes?: string; actions?: ReactNode }) {
  return (
    <div className="w-page-head">
      <div>
        {sub && <p className="small muted" style={{ marginBottom: 4 }}>{sub}</p>}
        <h1 className="display display-xl">{title}</h1>
        {codes && <FlowCode codes={codes} />}
      </div>
      {actions && <div className="row gap-2 wrap">{actions}</div>}
    </div>
  );
}

/** Side panel for editing details while keeping the list in view (ux-designer decision tree). */
export function Drawer({ open, title, onClose, children, width = 520 }: { open: boolean; title: string; onClose: () => void; children: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="scrim" style={{ position: 'fixed' }} onClick={onClose} aria-hidden />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: `min(${width}px, 100vw)`, zIndex: 45, background: 'var(--surface)', boxShadow: '-30px 0 80px -40px rgba(0,0,0,.6)', display: 'flex', flexDirection: 'column', animation: 'slidein var(--t-slow) var(--ease-out)' }}
      >
        <div className="row between" style={{ padding: '16px 24px', borderBottom: '1px solid var(--line)' }}>
          <h2 className="h2">{title}</h2>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div style={{ overflowY: 'auto', padding: 24 }} className="stack gap-4">{children}</div>
      </div>
    </>
  );
}
