import { Link, useNavigate } from 'react-router-dom';
import { Check, ExternalLink } from 'lucide-react';
import { useStore } from '../../store/store';
import { fmtDate } from '../../store/selectors';
import { Banner, FlowCode } from '../../components/ui';
import { useHuddleContext } from '../../huddle/Huddle';
import { CoachHeader } from './parts';
import { useCoach } from './useCoach';

const ROLE: Record<string, string> = { owner: 'Owner', head_coach: 'Head coach', coach: 'Coach', assistant: 'Assistant coach', parent: 'Parent', athlete: 'Athlete' };

/** CM01.02–03 · XS01.01–07: identify role, choose academy, handle parent+coach overlap. */
export function ContextSwitch() {
  const { db, setPersona, personas } = useStore();
  const c = useCoach();
  const nav = useNavigate();
  useHuddleContext({ surface: 'coach', title: 'Academy and role', prompts: ['What can you help with?'] });

  return (
    <>
      <CoachHeader back="/coach" backLabel="Today" />
      <section className="m-section">
        <p className="small muted">Signed in as {c.person.name}</p>
        <h1 className="display display-lg">Choose academy</h1>
        <FlowCode codes="CM01.02–01.03 · XS01.04" />
      </section>
      <ul className="list card card-flush m-section">
        {c.person.memberships.map((m) => {
          const ac = db.academies.find((a) => a.id === m.academyId)!;
          const isCurrent = personas.coach.academyId === m.academyId;
          const coachRole = ['head_coach', 'coach', 'assistant'].includes(m.role);
          return (
            <li key={m.academyId + m.role}>
              {coachRole ? (
                <button className="list-row" onClick={() => { setPersona('coach', { academyId: m.academyId }); nav('/coach'); }} aria-current={isCurrent || undefined}>
                  <span className="grow stack">
                    <span className="small strong">{ac.name}</span>
                    <span className="xs muted">
                      {ROLE[m.role]}{m.expiresOn ? ` · temporary until ${fmtDate(m.expiresOn)}` : ''}{m.status === 'removed' ? ' · access removed' : ''}
                    </span>
                  </span>
                  {isCurrent && <Check size={18} color="var(--forest-600)" aria-label="Current" />}
                </button>
              ) : (
                <Link className="list-row" to="/parent" onClick={() => setPersona('parent', { personId: c.person.id, academyId: m.academyId })}>
                  <span className="grow stack">
                    <span className="small strong">{ac.name}</span>
                    <span className="xs muted">{ROLE[m.role]}: opens in the Parent App</span>
                  </span>
                  <ExternalLink size={16} aria-hidden />
                </Link>
              )}
            </li>
          );
        })}
      </ul>
      {c.person.memberships.some((m) => m.role === 'parent') && (
        <div className="m-section">
          <Banner tone="info">
            You’re also a parent. Coaching and family views are kept apart: your child’s internal coaching notes never show in the Parent App, even to you. <FlowCode codes="PA01.07 · XS01.03" />
          </Banner>
        </div>
      )}
      {c.membership?.expiresOn && (
        <div className="m-section"><Banner tone="warn">Temporary access ends {fmtDate(c.membership.expiresOn)}. After that, open tasks return to the head coach. <FlowCode codes="XS01.07" /></Banner></div>
      )}
    </>
  );
}
