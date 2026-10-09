export type SeamState = 'idle' | 'listening' | 'thinking' | 'insight' | 'done';

/** The FlowX companion: a ball seam. Two arcs, stitched, never a glowing orb.
 *  idle — still; listening — stitches run; thinking — arcs turn; insight — lime notch; done — arcs go lime. */
export function Seam({ state = 'idle', size = 24, label }: { state?: SeamState; size?: number; label?: string }) {
  return (
    <svg
      className="seam"
      data-state={state}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className="arcs">
        <path className="arc-a" d="M7 4.5 C 15 9, 15 23, 7 27.5" />
        <path className="arc-b" d="M25 4.5 C 17 9, 17 23, 25 27.5" />
        <path className="stitch" d="M10 6.5 C 16.6 11, 16.6 21, 10 25.5" />
        <path className="stitch" d="M22 6.5 C 15.4 11, 15.4 21, 22 25.5" />
      </g>
      <circle className="notch" cx="27.5" cy="4.5" r="3" />
    </svg>
  );
}
