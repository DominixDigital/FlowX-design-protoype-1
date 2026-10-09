import { Link } from 'react-router-dom';
import { Mic, Check, ChevronLeft, Plus } from 'lucide-react';
import { Wordmark } from '../../components/chrome';
import { Seam } from '../../components/Seam';
import { PitchArt } from '../../components/art';
import './explore.css';

/* The same representative screen in three directions:
   Coach Mobile · Kabir’s athlete context (CM04.01–04.05) with a Huddle voice note → draft observation (CM05.03). */

function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <figure className="x-frame" aria-label={label}>
      <div className="x-screen">{children}</div>
    </figure>
  );
}

function DirectionA() {
  return (
    <Frame label="Direction A, Floodlit, mock screen">
      <div className="xa">
        <div className="xa-glow" aria-hidden />
        <div className="xa-top"><ChevronLeft size={16} /> Session · Nets</div>
        <p className="xa-name">Kabir<br />Singh</p>
        <div className="xa-orbit" aria-hidden>
          <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="78" /><circle cx="130" cy="88" r="58" /></svg>
          <div className="xa-big"><span>3</span><small>days to<br />reassessment</small></div>
        </div>
        <div className="xa-row"><span>Sessions attended</span><b>3 / 4</b></div>
        <div className="xa-row"><span>Notes on focus</span><b>2</b></div>
        <div className="xa-huddle">
          <div className="xa-h-head"><Seam state="done" size={18} /> Draft observation</div>
          <p>“Head stayed still on the drive; eyes level over front knee.”</p>
          <div className="xa-chips"><span>Kabir ✓</span><span>Head position ✓</span><span>Reads as progress</span></div>
          <button>Save observation</button>
        </div>
      </div>
    </Frame>
  );
}

function DirectionB() {
  return (
    <Frame label="Direction B, Matchday, mock screen">
      <div className="xb">
        <div className="xb-plate">
          <PitchArt tone="court" />
          <span className="xb-photo">Photo slot</span>
          <p className="xb-name">Kabir<br />Singh</p>
          <p className="xb-sub">Top-order batter · U16 Elite</p>
        </div>
        <div className="xb-stats">
          <div><b>75%</b><span>Attendance</span></div>
          <div><b>2</b><span>Notes</span></div>
          <div><b>12 Oct</b><span>Reassess</span></div>
        </div>
        <div className="xb-focus">
          <span>Current focus</span>
          <p>Head position on the front-foot drive</p>
        </div>
        <div className="xb-huddle">
          <span className="xb-tag">Huddle heard</span>
          <p>“Head stayed still on the drive this time…”</p>
          <button>Review draft →</button>
        </div>
      </div>
    </Frame>
  );
}

function DirectionC() {
  return (
    <Frame label="Direction C, Chalk, mock screen">
      <div className="xc">
        <div className="xc-top"><span><ChevronLeft size={14} /> Front-foot drive</span><span className="xc-sync"><Check size={10} /> Synced</span></div>
        <div className="xc-head">
          <span className="xc-av">KS</span>
          <div><p className="xc-name">Kabir Singh</p><p className="xc-meta">Top-order batter · Present</p></div>
        </div>
        <div className="xc-card">
          <span className="xc-label">Current focus</span>
          <p className="xc-focus"><mark>Head position</mark> on the front-foot drive</p>
          <p className="xc-next">Next: six-ball challenge with a still head</p>
        </div>
        <div className="xc-grid">
          <div><b>3/4</b><span>sessions</span></div>
          <div><b>3d</b><span>to reassess</span></div>
        </div>
        <div className="xc-huddle">
          <div className="xc-h-head"><Seam state="done" size={16} /> Draft observation <em>Check</em></div>
          <p>Head stayed still on the drive; eyes level over the front knee.</p>
          <div className="xc-actions"><button>Save</button><button className="ghost">Edit</button></div>
        </div>
        <div className="xc-dock"><Plus size={14} /> Note <span className="xc-mic"><Mic size={14} /></span></div>
      </div>
    </Frame>
  );
}

const CRITERIA = ['Distinctiveness', 'Readability', 'Usability', 'Brand coherence', 'Athletes', 'Coaches (daily, courtside)', 'Parents', 'Everyday use', 'Build feasibility'];
const SCORES: Record<'A' | 'B' | 'C', number[]> = {
  A: [5, 3, 3, 4, 5, 2, 2, 2, 4],
  B: [4, 3, 3, 4, 4, 2, 4, 2, 3],
  C: [3, 5, 5, 4, 3, 5, 4, 5, 5],
};

export function Explore() {
  return (
    <main className="explore" id="main" tabIndex={-1}>
      <header className="ex-head">
        <Wordmark />
        <Link to="/" className="btn btn-sm">All surfaces</Link>
      </header>
      <section className="ex-intro">
        <p className="ex-kicker">Visual exploration · Phase 3</p>
        <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}>One screen, three directions</h1>
        <p className="ex-lede">
          Every direction shows the same moment. Neha is courtside with Kabir’s athlete context open (CM04). She has just spoken a note,
          and Huddle turns it into a draft observation she has to confirm (CM05.03). The data is identical in all three. Only the visual language changes.
        </p>
      </section>

      <section className="ex-row">
        <article className="ex-dir">
          <DirectionA />
          <div>
            <h2 className="display display-md">A — Floodlit</h2>
            <p className="ex-sub">Performance Lab · ref. A</p>
            <p>Ink and charcoal, lime light, sculptural overlapping arcs, oversized numerals, translucent AI layer.</p>
            <p className="ex-verdict"><strong>Keeps:</strong> the atmosphere for AI and performance moments. <strong>Loses:</strong> glanceability in sunlight, density for lists, calm for parents.</p>
          </div>
        </article>
        <article className="ex-dir">
          <DirectionB />
          <div>
            <h2 className="display display-md">B — Matchday</h2>
            <p className="ex-sub">Sports editorial · ref. B</p>
            <p>Court-blue duotone plates, giant condensed names, image-led hierarchy, broadcast-style stat rail.</p>
            <p className="ex-verdict"><strong>Keeps:</strong> identity moments — onboarding, passport header, report cover, milestones. <strong>Loses:</strong> half the screen to imagery when a coach needs the roster.</p>
          </div>
        </article>
        <article className="ex-dir">
          <DirectionC />
          <div>
            <h2 className="display display-md">C — Chalk</h2>
            <p className="ex-sub">Functional sports intelligence · brief’s description of ref. C</p>
            <p>Chalk surfaces, forest ink, lime used like a highlighter, practical cards, sync state always visible.</p>
            <p className="ex-verdict"><strong>Keeps:</strong> everything operational. <strong>Risk:</strong> plain on its own, so it needs A and B to carry the brand.</p>
          </div>
        </article>
      </section>

      <section className="ex-compare">
        <h2 className="h2">Scored against the brief</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <caption className="sr-only">Scores out of 5 for each direction</caption>
            <thead><tr><th scope="col">Criterion</th><th scope="col">A Floodlit</th><th scope="col">B Matchday</th><th scope="col">C Chalk</th></tr></thead>
            <tbody>
              {CRITERIA.map((c, i) => (
                <tr key={c}>
                  <th scope="row" style={{ textAlign: 'left', fontWeight: 600, border: 0, borderBottom: '1px solid var(--line)', color: 'var(--text)', fontSize: 'var(--fs-sm)' }}>{c}</th>
                  {(['A', 'B', 'C'] as const).map((d) => (
                    <td key={d}><span className="ex-score" aria-label={`${SCORES[d][i]} out of 5`}>{'■'.repeat(SCORES[d][i])}<span className="ex-score-off">{'■'.repeat(5 - SCORES[d][i])}</span></span></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="xs muted" style={{ marginTop: 8 }}>
          Note: the third reference image supplied is a dark, multicolour widget grid, which doesn’t match the brief’s written description of reference C (warm off-white, forest, lime).
          I followed the written description, and took one idea from the image: glanceable tiles that hold a single metric each.
        </p>
      </section>

      <section className="ex-synth" data-theme="floodlit">
        <div>
          <p className="ex-kicker" style={{ color: 'var(--lime-400)' }}>Decision</p>
          <h2 className="display" style={{ fontSize: 'clamp(2.2rem, 5vw, 3.75rem)' }}>Chalk by default.<br />Floodlit for insight.<br />Matchday for identity.</h2>
        </div>
        <div className="stack gap-4">
          <p>
            <strong>Chalk</strong> covers about 80% of screens: rosters, forms, tasks, reports. Coaches use it in sunlight with one hand. Parents need calm.
            <strong> Floodlit</strong> is reserved for Huddle, so AI output is instantly told apart from recorded data, and for moments where performance deserves attention.
            <strong> Matchday</strong> appears only where identity matters: onboarding, the passport header, the report cover and milestones.
          </p>
          <p>
            The memorable thing is the <strong>Seam</strong>: a ball seam rather than an orb. It is the companion’s mark and its state signal.
            It shows listening, thinking, an insight being ready, or done. The display face is Big Shoulders, set uppercase like a scoreboard and used only for headlines and numerals.
            Instrument Sans carries everything else.
          </p>
          <div className="row gap-2 wrap">
            <Link className="btn btn-highlight" to="/coach/athlete/a-kabir?session=s-1005">See it in the coach app</Link>
            <Link className="btn" style={{ background: 'transparent', color: 'var(--chalk-50)', borderColor: 'var(--ink-600)' }} to="/web">See the web workspace</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
