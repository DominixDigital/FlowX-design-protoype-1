import type { ReactNode } from 'react';
import { CloudOff, Play, RefreshCw, AlertTriangle, Ban, Clapperboard } from 'lucide-react';
import type { Video } from '../data/types';
import { fmtTime } from '../store/selectors';

/** The FlowX motif: a pitch strip in perspective with a ball's flight line.
 *  Stands in for photography until licensed sport imagery exists. */
export function PitchArt({ tone = 'forest', flight = true }: { tone?: 'forest' | 'court' | 'ink'; flight?: boolean }) {
  const bg = { forest: ['#14432f', '#0b2a1d'], court: ['#1f4fb8', '#0a1a36'], ink: ['#1a2721', '#0b130f'] }[tone];
  const gid = `pa-${tone}`;
  return (
    <svg className="clip-art" viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={bg[0]} />
          <stop offset="1" stopColor={bg[1]} />
        </linearGradient>
      </defs>
      <rect width="400" height="225" fill={`url(#${gid})`} />
      {/* pitch strip in perspective */}
      <path d="M170 40 L230 40 L300 225 L100 225 Z" fill="rgba(255,255,255,0.06)" />
      <path d="M161 64 L239 64" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path d="M118 190 L282 190" stroke="rgba(255,255,255,0.45)" strokeWidth="2" />
      <path d="M142 190 L150 225 M258 190 L250 225" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
      {/* stumps */}
      <path d="M196 44 V64 M200 44 V64 M204 44 V64" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
      {flight && (
        <>
          <path d="M60 30 C 150 10, 230 60, 205 150" stroke="#d7ff3c" strokeWidth="2" fill="none" strokeDasharray="2 6" strokeLinecap="round" />
          <circle cx="205" cy="150" r="5" fill="#d7ff3c" />
        </>
      )}
    </svg>
  );
}

/** Editorial photo slot: duotone plate with the pitch motif, labelled honestly. */
export function PhotoSlot({ tone = 'court', label = 'Photo slot', children, height = 220 }: { tone?: 'forest' | 'court' | 'ink'; label?: string; children?: ReactNode; height?: number }) {
  return (
    <div className="clip" style={{ aspectRatio: 'auto', height, borderRadius: 'var(--r-lg)' }}>
      <PitchArt tone={tone} />
      <span className="badge" style={{ position: 'absolute', right: 10, top: 10, background: 'rgba(0,0,0,0.35)', color: '#fff' }}>{label}</span>
      {children}
    </div>
  );
}

/** Video reference card. Upload, processing and publication are separate states (build brief). */
export function Clip({ video, onPlay, compact }: { video: Video; onPlay?: () => void; compact?: boolean }) {
  let overlay: ReactNode = null;
  if (video.share === 'withdrawn') overlay = <span className="stack gap-1" style={{ alignItems: 'center' }}><Ban size={20} />Withdrawn by the coach</span>;
  else if (video.upload === 'local' || video.upload === 'queued') overlay = <span className="stack gap-1" style={{ alignItems: 'center' }}><CloudOff size={20} />Saved on this device · waiting to upload</span>;
  else if (video.upload === 'uploading') overlay = (
    <span className="stack gap-2" style={{ alignItems: 'center', width: '70%' }}>
      <RefreshCw size={20} />Uploading {video.progress}%
      <span className="progress" style={{ width: '100%', background: 'rgba(255,255,255,.2)' }}><span style={{ width: `${video.progress}%`, background: 'var(--lime-400)' }} /></span>
    </span>
  );
  else if (video.upload === 'failed') overlay = <span className="stack gap-1" style={{ alignItems: 'center' }}><AlertTriangle size={20} />Upload failed · clip kept on device</span>;
  else if (video.processing === 'processing' || video.processing === 'pending') overlay = <span className="stack gap-1" style={{ alignItems: 'center' }}><Clapperboard size={20} />Processing on the server</span>;
  else if (video.processing === 'failed') overlay = <span className="stack gap-1" style={{ alignItems: 'center' }}><AlertTriangle size={20} />Processing failed · re-upload needed</span>;

  const playable = !overlay && onPlay;
  return (
    <div className="clip" style={{ ['--clip-tint' as string]: video.tint }}>
      <PitchArt tone={video.tint === '#0f2a57' ? 'court' : video.tint === '#26362e' ? 'ink' : 'forest'} />
      {overlay ? <div className="clip-state">{overlay}</div> : (
        playable && (
          <button
            onClick={onPlay}
            aria-label={`Play ${video.title}`}
            style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'transparent', border: 0, color: '#fff' }}
          >
            <span style={{ width: 52, height: 52, borderRadius: 14, display: 'grid', placeItems: 'center', background: 'rgba(11,19,15,.7)' }}>
              <Play size={22} fill="currentColor" />
            </span>
          </button>
        )
      )}
      {!compact && (
        <div className="clip-meta">
          <span style={{ textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>{video.title}</span>
          <span className="num" style={{ fontSize: '1.1rem' }}>{fmtTime(video.duration)}</span>
        </div>
      )}
    </div>
  );
}
