import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as fx from '../data/fixtures';
import type { AuditEntry, ID, QueuedCommand, Surface } from '../data/types';
import { getKV } from '../core/platform';

export interface DB {
  academies: typeof fx.academies;
  people: typeof fx.people;
  coaches: typeof fx.coaches;
  athletes: typeof fx.athletes;
  batches: typeof fx.batches;
  sessions: typeof fx.sessions;
  observations: typeof fx.observations;
  areas: typeof fx.areas;
  goals: typeof fx.goals;
  tasks: typeof fx.tasks;
  handovers: typeof fx.handovers;
  videos: typeof fx.videos;
  reassessments: typeof fx.reassessments;
  milestones: typeof fx.milestones;
  reports: typeof fx.reports;
  competitions: typeof fx.competitions;
  feedback: typeof fx.feedback;
  practiceLogs: typeof fx.practiceLogs;
  notifications: typeof fx.notifications;
  scoreSettings: typeof fx.scoreSettings;
  scorePrefs: typeof fx.scorePrefs;
  scoreReviews: typeof fx.scoreReviews;
  /** Keyed by surface + person, e.g. "athlete:p-tara" */
  companionPrefs: typeof fx.companionPrefs;
  queue: QueuedCommand[];
  audit: AuditEntry[];
  /** Idempotency keys the "server" has already applied */
  applied: string[];
}

/** Prototype controls: switches that make every documented branch triggerable. */
export interface Sim {
  online: boolean;
  slow: boolean;
  failNextSave: boolean;
  uncertainNext: boolean;
  conflictOnSync: boolean;
}

export interface Persona {
  personId: ID;
  academyId: ID;
}

export interface Toast {
  id: string;
  tone: 'ok' | 'info' | 'warn' | 'err';
  text: string;
  action?: { label: string; run: () => void };
}

const seed = (): DB => ({
  academies: fx.academies, people: fx.people, coaches: fx.coaches, athletes: fx.athletes, batches: fx.batches,
  sessions: fx.sessions, observations: fx.observations, areas: fx.areas, goals: fx.goals, tasks: fx.tasks,
  handovers: fx.handovers, videos: fx.videos, reassessments: fx.reassessments, milestones: fx.milestones,
  reports: fx.reports, competitions: fx.competitions, feedback: fx.feedback, practiceLogs: fx.practiceLogs,
  notifications: fx.notifications, scoreSettings: fx.scoreSettings, scorePrefs: fx.scorePrefs,
  scoreReviews: fx.scoreReviews, companionPrefs: fx.companionPrefs, queue: [], audit: [], applied: [],
});

const defaultPersonas: Record<Surface, Persona> = {
  web: { personId: 'p-rohan', academyId: 'ac-velocity' },
  coach: { personId: 'p-neha', academyId: 'ac-velocity' },
  parent: { personId: 'p-maya', academyId: 'ac-velocity' },
  athlete: { personId: 'p-tara', academyId: 'ac-velocity' },
};

export const STORAGE_KEY = 'ditdit-proto-v2';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = getKV().get(`${STORAGE_KEY}:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    getKV().set(`${STORAGE_KEY}:${key}`, JSON.stringify(value));
  } catch {
    /* storage unavailable: prototype keeps working in memory */
  }
}

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;
export const nowISO = () => `${fx.TODAY}T${new Date().toTimeString().slice(0, 5)}`;

export type Mutator = (db: DB) => void;

export interface CommandSpec {
  kind: QueuedCommand['kind'];
  label: string;
  refId: ID;
  /** Applied immediately to local state (optimistic, keyed by idempotencyKey) */
  apply: Mutator;
  /** Writes the record's sync state */
  setSync: (db: DB, state: 'queued' | 'sending' | 'synced' | 'failed' | 'conflict') => void;
  idempotencyKey?: string;
  /** For attendance: field that may collide with a server change */
  conflict?: QueuedCommand['conflict'];
}

export type CommandResult = 'synced' | 'queued' | 'failed' | 'duplicate' | 'uncertain' | 'conflict';

interface Store {
  db: DB;
  sim: Sim;
  personas: Record<Surface, Persona>;
  toasts: Toast[];
  update: (fn: Mutator) => void;
  setSim: (patch: Partial<Sim>) => void;
  setPersona: (surface: Surface, p: Partial<Persona>) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  /** Runs a command through the simulated network with idempotency and offline queueing. */
  command: (spec: CommandSpec) => Promise<CommandResult>;
  retry: (queueId: ID) => Promise<void>;
  resolveConflict: (queueId: ID, keep: 'mine' | 'theirs') => void;
  audit: (by: string, what: string, ref?: string) => void;
  reset: () => void;
}

const StoreCtx = createContext<Store | null>(null);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(() => load('db', seed()));
  const [sim, setSimState] = useState<Sim>(() =>
    load('sim', { online: true, slow: false, failNextSave: false, uncertainNext: false, conflictOnSync: false }),
  );
  const [personas, setPersonas] = useState<Record<Surface, Persona>>(() => load('personas', defaultPersonas));
  const [toasts, setToasts] = useState<Toast[]>([]);
  const simRef = useRef(sim);
  simRef.current = sim;
  const specs = useRef(new Map<string, CommandSpec>());

  useEffect(() => save('db', db), [db]);
  useEffect(() => save('sim', sim), [sim]);
  useEffect(() => save('personas', personas), [personas]);

  const update = useCallback((fn: Mutator) => {
    setDb((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = uid('toast');
    setToasts((ts) => [...ts.slice(-2), { ...t, id }]);
    // Toasts with an action stay until dismissed (WCAG 2.2.1)
    if (!t.action) setTimeout(() => setToasts((ts) => ts.filter((x) => x.id !== id)), t.tone === 'err' ? 8000 : 5000);
  }, []);
  const dismissToast = useCallback((id: string) => setToasts((ts) => ts.filter((x) => x.id !== id)), []);

  const audit = useCallback(
    (by: string, what: string, ref?: string) =>
      update((d) => {
        d.audit.unshift({ id: uid('au'), at: nowISO(), by, what, ref });
      }),
    [update],
  );

  const send = useCallback(
    async (key: string): Promise<CommandResult> => {
      const spec = specs.current.get(key);
      if (!spec) return 'failed';
      const s = simRef.current;
      update((d) => {
        const q = d.queue.find((x) => x.idempotencyKey === key);
        if (q) { q.status = 'sending'; q.attempts += 1; }
        spec.setSync(d, 'sending');
      });
      await wait(s.slow ? 2200 : 650);
      const now = simRef.current;
      if (!now.online) {
        update((d) => {
          const q = d.queue.find((x) => x.idempotencyKey === key);
          if (q) q.status = 'queued';
          spec.setSync(d, 'queued');
        });
        return 'queued';
      }
      if (now.failNextSave) {
        setSimState((x) => ({ ...x, failNextSave: false }));
        update((d) => {
          const q = d.queue.find((x) => x.idempotencyKey === key);
          if (q) { q.status = 'failed'; q.error = 'The server rejected the save (500). Your input is kept on this device.'; }
          spec.setSync(d, 'failed');
        });
        return 'failed';
      }
      if (now.uncertainNext) {
        // The server applied it, but the confirmation never arrived.
        setSimState((x) => ({ ...x, uncertainNext: false }));
        update((d) => {
          d.applied.push(key);
          const q = d.queue.find((x) => x.idempotencyKey === key);
          if (q) { q.status = 'failed'; q.error = 'No confirmation received. It may or may not have saved — retry is safe.'; }
          spec.setSync(d, 'failed');
        });
        return 'uncertain';
      }
      if (now.conflictOnSync && spec.conflict) {
        setSimState((x) => ({ ...x, conflictOnSync: false }));
        update((d) => {
          const q = d.queue.find((x) => x.idempotencyKey === key);
          if (q) { q.status = 'conflict'; q.conflict = spec.conflict; }
          spec.setSync(d, 'conflict');
        });
        return 'conflict';
      }
      let duplicate = false;
      update((d) => {
        duplicate = d.applied.includes(key);
        if (!duplicate) d.applied.push(key);
        d.queue = d.queue.filter((x) => x.idempotencyKey !== key);
        spec.setSync(d, 'synced');
      });
      specs.current.delete(key);
      return duplicate ? 'duplicate' : 'synced';
    },
    [update],
  );

  const command = useCallback(
    async (spec: CommandSpec): Promise<CommandResult> => {
      const key = spec.idempotencyKey ?? uid('idem');
      specs.current.set(key, spec);
      update((d) => {
        spec.apply(d);
        if (!d.queue.some((q) => q.idempotencyKey === key)) {
          d.queue.push({ id: uid('q'), idempotencyKey: key, kind: spec.kind, label: spec.label, refId: spec.refId, status: 'queued', attempts: 0 });
        }
        spec.setSync(d, 'queued');
      });
      if (!simRef.current.online) return 'queued';
      return send(key);
    },
    [send, update],
  );

  const retry = useCallback(
    async (queueId: ID) => {
      const q = db.queue.find((x) => x.id === queueId);
      if (!q) return;
      if (!specs.current.has(q.idempotencyKey)) {
        // Spec lost after reload: treat as acknowledged by the server for the prototype.
        update((d) => { d.queue = d.queue.filter((x) => x.id !== queueId); });
        toast({ tone: 'info', text: `${q.label}: synced` });
        return;
      }
      const res = await send(q.idempotencyKey);
      if (res === 'duplicate') toast({ tone: 'info', text: `${q.label}: already saved on the server, so no duplicate was created.` });
      else if (res === 'synced') toast({ tone: 'ok', text: `${q.label}: synced` });
    },
    [db.queue, send, toast, update],
  );

  const resolveConflict = useCallback(
    (queueId: ID, keep: 'mine' | 'theirs') => {
      const q = db.queue.find((x) => x.id === queueId);
      if (!q) return;
      const spec = specs.current.get(q.idempotencyKey);
      update((d) => {
        if (keep === 'theirs' && q.kind === 'attendance' && q.conflict) {
          // conflict.field holds the athlete id for attendance conflicts
          const sess = d.sessions.find((s) => q.refId === s.id);
          if (sess) sess.attendance[q.conflict.field] = q.conflict.theirs as 'present' | 'absent';
        }
        d.queue = d.queue.filter((x) => x.id !== queueId);
        d.applied.push(q.idempotencyKey);
        spec?.setSync(d, 'synced');
        d.audit.unshift({ id: uid('au'), at: nowISO(), by: 'You', what: `Resolved sync conflict on ${q.label}: kept ${keep === 'mine' ? 'your change' : 'the server version'}` });
      });
      specs.current.delete(q.idempotencyKey);
      toast({ tone: 'ok', text: keep === 'mine' ? 'Your change was kept and synced.' : 'Server version kept. Your change was discarded.' });
    },
    [db.queue, toast, update],
  );

  // Reconnect → flush the queue in order (CM14.07).
  const wasOnline = useRef(sim.online);
  useEffect(() => {
    if (sim.online && !wasOnline.current) {
      const pending = db.queue.filter((q) => q.status === 'queued');
      (async () => {
        for (const q of pending) {
          if (specs.current.has(q.idempotencyKey)) await send(q.idempotencyKey);
          else update((d) => { d.queue = d.queue.filter((x) => x.id !== q.id); });
        }
        if (pending.length) toast({ tone: 'info', text: `Back online. Syncing ${pending.length} queued ${pending.length === 1 ? 'change' : 'changes'}.` });
      })();
    }
    wasOnline.current = sim.online;
  }, [sim.online, db.queue, send, toast, update]);

  const value = useMemo<Store>(
    () => ({
      db, sim, personas, toasts, update, toast, dismissToast, command, retry, resolveConflict, audit,
      setSim: (patch) => setSimState((s) => ({ ...s, ...patch })),
      setPersona: (surface, p) => setPersonas((ps) => ({ ...ps, [surface]: { ...ps[surface], ...p } })),
      reset: () => {
        specs.current.clear();
        setDb(seed());
        setPersonas(defaultPersonas);
        setSimState({ online: true, slow: false, failNextSave: false, uncertainNext: false, conflictOnSync: false });
      },
    }),
    [db, sim, personas, toasts, update, toast, dismissToast, command, retry, resolveConflict, audit],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
