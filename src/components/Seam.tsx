import { DitAvatar, type DitState } from '../companion/DitAvatar';

/** Legacy entry point kept so existing screens pick up the ditdit companion without rewrites. */
export type SeamState = 'idle' | 'listening' | 'thinking' | 'insight' | 'done' | DitState;

export function Seam({ state = 'idle', size = 24, label }: { state?: SeamState; size?: number; label?: string }) {
  const s: DitState = state === 'done' ? 'explaining' : state;
  return <DitAvatar state={s} size={size} label={label} form={size < 26 ? 'compact' : 'face'} />;
}
