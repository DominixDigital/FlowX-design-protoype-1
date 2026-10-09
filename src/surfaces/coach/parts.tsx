import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BackLink, SyncPill } from '../../components/chrome';
import { StateBlock } from '../../components/ui';
import { useCoach, denyReason } from './useCoach';

export function CoachHeader({ back, backLabel, title, right }: { back?: string; backLabel?: string; title?: ReactNode; right?: ReactNode }) {
  return (
    <div className="m-top" style={{ margin: '0 calc(var(--s-4) * -1)', position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)' }}>
      {back ? <BackLink to={back} label={backLabel} /> : null}
      <div className="grow m-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
      {right}
      <SyncPill to="/coach/sync" />
    </div>
  );
}

/** Wraps any coach screen: revalidates role, academy and access on every render (XS01.05–07, XS07.S07). */
export function CoachGate({ children }: { children: ReactNode }) {
  const c = useCoach();
  if (c.canAct) return <>{children}</>;
  return (
    <div className="m-section">
      <StateBlock
        kind="permission"
        title="You can’t use Coach Mobile here"
        body={denyReason(c)}
        action={<Link className="btn btn-sm" to="/coach/context">Switch academy or role</Link>}
      />
    </div>
  );
}

export function NotFound({ what, back }: { what: string; back: string }) {
  return (
    <div className="m-section">
      <StateBlock
        kind="archived"
        title={`This ${what} is no longer available`}
        body="It may have been archived, reassigned or deleted after you opened the list. Anything you saved before that is kept."
        action={<Link className="btn btn-sm" to={back}>Go back</Link>}
      />
    </div>
  );
}
