import { Link } from 'react-router'
import { useAuthStore } from '@/features/auth'
import '@/styles/marketing.css'

export function AboutPage() {
  const accessToken = useAuthStore((s) => s.accessToken)

  return (
    <div style={{ background: 'var(--xn-paper)', minHeight: '100vh' }}>
      {/* Nav */}
      <header className="mk-nav scrolled">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <img src="/assets/logo-mark.svg" alt="Xenoh" />
          Xenoh
        </Link>
        <nav>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>Home</Link>
          <a href="/#how">How it works</a>
          <a href="/#pricing">Pricing</a>
          <a href="/#faq">FAQ</a>
        </nav>
        <div className="cta">
          {accessToken ? (
            <Link to="/dashboard" className="mk-btn clay">Go to app →</Link>
          ) : (
            <>
              <Link to="/login" className="mk-btn secondary">Sign in</Link>
              <Link to="/register" className="mk-btn clay">Start free →</Link>
            </>
          )}
        </div>
      </header>

      {/* Page hero */}
      <section style={{
        background: 'linear-gradient(135deg, var(--xn-clay-200) 0%, var(--xn-clay-100) 100%)',
        borderBottom: '1px solid var(--xn-clay-300)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'url(/assets/grain.svg)', backgroundSize: '360px',
          opacity: .06, pointerEvents: 'none',
        }} />
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '80px 40px 88px', position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--xn-clay-800)', marginBottom: 18 }}>
            About Xenoh
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 64, lineHeight: 1, letterSpacing: '-0.025em', color: 'var(--xn-ink-900)', margin: '0 0 24px', textWrap: 'balance' }}>
            Built for the bar.<br />Not for the app.
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 19, lineHeight: 1.6, color: 'var(--xn-ink-700)', maxWidth: 560, margin: 0 }}>
            Xenoh started as a notebook problem. Coaches were writing programs in spreadsheets,
            clients were logging sets in notes apps, and nobody had the full picture.
            We built the thing that was missing.
          </p>
        </div>
      </section>

      {/* Origin story */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <Eyebrow>The problem</Eyebrow>
            <h2 style={heading2}>The plan and the log were never in the same place.</h2>
            <p style={bodyText}>
              Every serious coach had a system. A Google Sheet for the program, a WhatsApp thread for check-ins,
              a separate app where clients logged their own numbers. Three tools. Three sources of truth.
              None of them talking to each other.
            </p>
            <p style={bodyText}>
              Clients didn't always follow the sheet. Coaches didn't always see what clients actually did.
              The gap between the written plan and the logged session was where progress got lost.
            </p>
          </div>
          <div>
            <Eyebrow>The fix</Eyebrow>
            <h2 style={heading2}>One journal. Two views. Both sides trust it.</h2>
            <p style={bodyText}>
              A coach writes a plan. It appears in the client's app immediately — formatted for a phone,
              designed to log mid-set with one hand. Every rep the client logs flows back to the coach dashboard
              in real time.
            </p>
            <p style={bodyText}>
              The journal belongs to both of them. The coach sees everything. The client sees what they need to see.
              No exports, no screenshots, no "did you see my message?"
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <div style={{ background: 'var(--xn-paper-alt)', borderTop: '1px solid var(--xn-clay-300)', borderBottom: '1px solid var(--xn-clay-300)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url(/assets/grain.svg)', backgroundSize: '360px', opacity: .04, pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 40px', position: 'relative' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <Eyebrow>What we believe</Eyebrow>
            <h2 style={{ ...heading2, textAlign: 'center', fontSize: 44, maxWidth: 600, margin: '0 auto' }}>
              Principles we don't argue about.
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              {
                n: '01',
                h: 'Precision over narrative.',
                p: '5 × 5 @ 80 kg is more useful than "a few heavy sets." Numbers are the language of training. We keep them front and center.',
              },
              {
                n: '02',
                h: 'The coach-client relationship is the product.',
                p: 'Not a feature, not a tab, not an add-on. The shared journal between two people is the core of what Xenoh does.',
              },
              {
                n: '03',
                h: 'Fast enough to use between sets.',
                p: 'If it takes more than two taps to log a set, it will not get logged. Every UX decision runs through that constraint.',
              },
              {
                n: '04',
                h: 'Your data is yours.',
                p: 'Every plan and every log exports to CSV at any time. If you leave, everything leaves with you. We do not hold data hostage.',
              },
              {
                n: '05',
                h: 'Calm motion, warm palette.',
                p: 'Gyms are already loud and bright. The app should feel like a well-worn training journal, not a dashboard.',
              },
              {
                n: '06',
                h: 'No dark patterns.',
                p: 'No streak guilt. No "you\'re falling behind" push notifications. No gamification of something that\'s already its own reward.',
              },
            ].map((v) => (
              <a key={v.n} href="/#features" className="mk-card-link" style={{ background: 'var(--bg-2)', border: '1px solid var(--border-1)', borderRadius: 18, padding: '24px 26px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: 'var(--xn-clay-400)', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: 14 }}>{v.n}</div>
                <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em', margin: '0 0 10px', color: 'var(--fg-1)' }}>{v.h}</h4>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.65, color: 'var(--fg-2)', margin: 0 }}>{v.p}</p>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* How the app works — deep dive */}
      <section style={{ maxWidth: 820, margin: '0 auto', padding: '80px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <Eyebrow>Under the hood</Eyebrow>
          <h2 style={{ ...heading2, textAlign: 'center' }}>How everything connects.</h2>
        </div>

        <div style={{ display: 'grid', gap: 20 }}>
        {[
          {
            title: 'Plans',
            desc: 'A plan is a block of training — a named period with a start date, an end date, and a set of weekly workouts inside it. Each week has daily workouts. Each daily workout has exercises. Each exercise has sets with target reps and weight.',
            detail: 'Plans can be Self (you wrote it) or Coach (your coach wrote it). If your coach wrote it, you can log sets and mark exercises done — but only the coach can add, remove, or rename exercises.',
          },
          {
            title: 'The coach–client relationship',
            desc: 'A client finds a coach on the coaches page and sends a request. The coach sees the pending request on their dashboard and accepts it. Once active, the coach can write plans for that client. Either side can terminate the relationship at any time.',
            detail: 'Terminating removes all coach-authored plans from the client\'s app. The client\'s own self-authored plans are untouched.',
          },
          {
            title: 'Logging a session',
            desc: 'Open the day. See the exercises. For each set, enter the actual reps and weight you used (or leave the defaults to use the planned values), then tap the circle to mark it done. The set turns green. The progress bar advances.',
            detail: 'Optimistic updates mean the UI responds instantly — no spinner, no waiting. If the server rejects a change, the state rolls back automatically.',
          },
          {
            title: 'PRs and progress',
            desc: 'Every time you complete a set, we compare the weight to your previous best at that rep count. If it\'s a new PR, it\'s flagged on the exercise card.',
            detail: 'The coach dashboard shows each client\'s Big 3 PRs (squat, bench, deadlift) at a glance, plus last workout date, plan compliance %, and current bodyweight.',
          },
        ].map((item, i) => (
          <a
            key={i}
            href="/#features"
            className="mk-card-link"
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr',
              gap: 40,
              padding: '34px 36px',
              border: '1px solid var(--xn-clay-300)',
              borderRadius: 8,
              background: 'var(--xn-paper)',
              boxShadow: '0 10px 28px rgba(60, 39, 24, 0.08)',
            }}
          >
            <div style={{ paddingTop: 4 }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em', margin: 0, color: 'var(--fg-1)' }}>{item.title}</h3>
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 16, lineHeight: 1.65, color: 'var(--fg-1)', margin: '0 0 12px' }}>{item.desc}</p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, lineHeight: 1.65, color: 'var(--fg-3)', margin: 0, borderLeft: '2px solid var(--xn-clay-400)', paddingLeft: 14 }}>{item.detail}</p>
            </div>
          </a>
        ))}
        </div>
      </section>

      {/* Tech stack note */}
      <div style={{ background: 'var(--bg-3)', borderTop: '1px solid var(--border-1)', borderBottom: '1px solid var(--border-1)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <Eyebrow>Frontend</Eyebrow>
            <p style={{ ...bodyText, marginBottom: 0 }}>
              React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query v5 · Zustand · React Router v7 · Framer Motion · Recharts
            </p>
          </div>
          <div>
            <Eyebrow>Backend</Eyebrow>
            <p style={{ ...bodyText, marginBottom: 0 }}>
              .NET 9 · ASP.NET Core · Entity Framework Core · SQL Server · Mediator (CQRS) · ASP.NET Core Identity · JWT + refresh tokens
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="mk-cta">
        <h2>Ready to start?</h2>
        <p>Free for individuals. 30-day trial for coaches. No credit card required.</p>
        <Link to="/register" className="mk-btn on-dark lg" style={{ position: 'relative' }}>
          Create your account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="mk-footer">
        <div className="inner">
          <div>
            <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
              <img src="/assets/logo-mark.svg" alt="" />
              Xenoh
            </Link>
            <div className="tag">A training journal for people who are serious about the plan.</div>
          </div>
          <div>
            <h6>Product</h6>
            <ul>
              <li><a href="/#features">Features</a></li>
              <li><a href="/#how">How it works</a></li>
              <li><a href="/#pricing">Pricing</a></li>
            </ul>
          </div>
          <div>
            <h6>Company</h6>
            <ul>
              <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About</Link></li>
              <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>Sign in</Link></li>
              <li><Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>Get started</Link></li>
            </ul>
          </div>
          <div>
            <h6>Legal</h6>
            <ul>
              <li><a href="#">Privacy</a></li>
              <li><a href="#">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="small">
          <div>© 2026 Xenoh. All rights reserved.</div>
          <div>Made for people who show up.</div>
        </div>
      </footer>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: 'var(--xn-clay-700)', marginBottom: 14 }}>
      {children}
    </div>
  )
}

const heading2: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  fontSize: 36,
  lineHeight: 1.08,
  letterSpacing: '-0.02em',
  color: 'var(--fg-1)',
  margin: '0 0 18px',
}

const bodyText: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 16,
  lineHeight: 1.65,
  color: 'var(--fg-2)',
  margin: '0 0 14px',
}
