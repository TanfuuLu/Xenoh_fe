import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuthStore } from '@/features/auth'
import '@/styles/marketing.css'

// ─── Redirect logged-in users to dashboard ───────────────────────────────────
export function LandingPage() {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (accessToken) return <Navigate to="/dashboard" replace />

  return (
    <div style={{ background: 'var(--xn-paper)', minHeight: '100vh' }}>
      <MarketingNav />
      <Hero />
      <Stats />
      <LogoBar />
      <HowItWorks />
      <FeaturePlan />
      <FeatureCoach />
      <FeatureGrid />
      <Testimonial />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}

// ─── Nav ─────────────────────────────────────────────────────────────────────
function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <header className={`mk-nav${scrolled ? ' scrolled' : ''}`}>
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        <img src="/assets/logo-mark.svg" alt="Xenoh" />
        Xenoh
      </Link>
      <nav>
        <a href="#how">How it works</a>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
        <Link to="/about" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>About</Link>
      </nav>
      <div className="cta">
        <Link to="/login" className="mk-btn secondary">Sign in</Link>
        <Link to="/register" className="mk-btn clay">Start free →</Link>
      </div>
    </header>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="mk-hero">
      <div className="inner">
        <div>
          <div className="eyebrow">For individuals and coaches</div>
          <h1>Plan the work.<br />Then do it.</h1>
          <p className="lede">
            Xenoh is a training journal for people who are serious about the plan — and for the coaches who write them.
            Weekly planning, live session logging, and a shared record that both sides trust.
          </p>
          <div className="actions">
            <Link to="/register" className="mk-btn primary lg">Create free account</Link>
            <a href="#how" className="mk-btn secondary lg">See how it works →</a>
          </div>
        </div>
        <div className="visual">
          <div style={{ padding: 22 }}>
            <div className="mk-app-preview">
              <div className="bar">
                <div className="dots"><span /><span /><span /></div>
                xenoh.app / today
              </div>
              <div className="body">
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>
                  Today · push
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-.02em', margin: '6px 0 14px', color: 'var(--fg-1)' }}>
                  Bench · overhead · fly
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
                  {[true, true, true, false, false].map((done, i) => (
                    <div key={i} style={{
                      padding: '8px 6px',
                      border: `1px solid ${done ? 'var(--xn-sage-400)' : 'var(--border-1)'}`,
                      background: done ? 'var(--xn-sage-200)' : 'var(--bg-2)',
                      borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: done ? '#3d4a1e' : 'var(--fg-3)', textAlign: 'center',
                    }}>
                      {done ? '5×80' : '–'}
                    </div>
                  ))}
                </div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--fg-3)' }}>
                  3 of 5 sets · bench press
                </div>

                {/* Second exercise */}
                <div style={{ marginTop: 12, padding: '12px 14px', background: 'var(--bg-3)', borderRadius: 10, border: '1px solid var(--border-1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16, color: 'var(--fg-1)' }}>Overhead press</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-3)' }}>4×8 @ 40kg</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                    {[false, false, false, false].map((_, i) => (
                      <div key={i} style={{ flex: 1, height: 28, border: '1px solid var(--border-1)', borderRadius: 6, background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-4)' }}>{i + 1}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Stats ────────────────────────────────────────────────────────────────────
function Stats() {
  const data = [
    { num: '12k', suffix: '+', lbl: 'Active lifters', desc: 'Logging sessions every week across 40+ countries.' },
    { num: '2.3M', suffix: '', lbl: 'Sets logged', desc: 'Reps, weights, RPE — every one saved to your journal.' },
    { num: '94', suffix: '%', lbl: 'Plan compliance', desc: 'Average weekly completion for coach-authored plans.' },
    { num: '<2', suffix: 's', lbl: 'Log a set', desc: 'Tap the weight, tap the reps. Back to the bar.' },
  ]
  return (
    <div className="mk-stats">
      {data.map((s, i) => (
        <div key={i} className="stat">
          <div className="lbl">{s.lbl}</div>
          <div className="num">{s.num}{s.suffix && <span>{s.suffix}</span>}</div>
          <div className="desc">{s.desc}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Logo bar ─────────────────────────────────────────────────────────────────
function LogoBar() {
  return (
    <div className="mk-logobar">
      <div className="k">Used by coaches at</div>
      <div className="row">
        {['Steel & Stone', 'Northline Athletics', 'Fieldhouse', 'Hearth Strength', 'Kiln Barbell Club'].map((n) => (
          <span key={n}>{n}</span>
        ))}
      </div>
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      n: '01', h: 'Lay out the week.',
      p: 'Drag exercises from the library onto each day. Set target reps, weights, rest. Duplicate last week when it is working.',
      tag: '≈ 5 minutes on sunday',
    },
    {
      n: '02', h: 'Show up and log.',
      p: 'Session view opens to today\'s work. Tap through sets as you finish them — the app remembers weights and autofills the next rep target.',
      tag: 'live during training',
    },
    {
      n: '03', h: 'See what\'s working.',
      p: 'Weekly summary shows completion, volume by muscle group, and PRs. Coach gets the same view for every client on the roster.',
      tag: 'automatic · no reports to write',
    },
  ]
  return (
    <section className="mk-section" id="how">
      <div className="mk-section-head">
        <div className="eyebrow">How it works</div>
        <h2>From blank week to finished session.</h2>
        <p>Three steps — the same three, whether you are planning your own training or writing a program for someone else.</p>
      </div>
      <div className="mk-steps">
        {steps.map((s) => (
          <div key={s.n} className="mk-step">
            <div className="n">{s.n}</div>
            <h4>{s.h}</h4>
            <p>{s.p}</p>
            <div className="tag">{s.tag}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Feature: plan builder ────────────────────────────────────────────────────
function FeaturePlan() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const labels = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs', 'Rest']
  const exercises = [
    { name: 'Bench press', sets: 5, reps: 5, weight: 80 },
    { name: 'Overhead press', sets: 4, reps: 8, weight: 45 },
    { name: 'Cable fly', sets: 3, reps: 12, weight: 15 },
  ]
  return (
    <section className="mk-section" id="features">
      <div className="mk-feature">
        <div className="text">
          <div className="eyebrow">Plan builder</div>
          <h2>A week, laid out like a journal.</h2>
          <p>Add exercises to the day they belong. Set reps, weights, rest. Nothing more complicated than that.</p>
          <ul>
            <li>Exercise templates with primary and secondary muscle groups</li>
            <li>Self-planned or authored by your coach</li>
            <li>Weekly view with completion at a glance</li>
            <li>Up to 3 concurrent training plans</li>
          </ul>
        </div>
        <div className="visual">
          <div className="body" style={{ padding: 18 }}>
            {/* Week strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5, marginBottom: 14 }}>
              {days.map((d, i) => {
                const isDone = i < 3
                const isToday = i === 3
                const isRest = i === 6
                const bg = isToday ? 'var(--xn-clay-700)' : isDone ? 'var(--xn-sage-200)' : isRest ? 'var(--bg-3)' : 'var(--bg-2)'
                const border = isToday ? 'var(--xn-clay-800)' : isDone ? 'var(--xn-sage-400)' : 'var(--border-1)'
                const color = isToday ? 'var(--fg-on-clay)' : isDone ? '#3d5226' : isRest ? 'var(--fg-3)' : 'var(--fg-1)'
                return (
                  <div key={d} style={{ padding: '8px 4px', background: bg, border: `1px solid ${border}`, borderRadius: 8, textAlign: 'center', color }}>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 600, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .8 }}>{d}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 17, lineHeight: 1, margin: '3px 0' }}>{14 + i}</div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9 }}>{labels[i]}</div>
                  </div>
                )
              })}
            </div>
            {exercises.map((ex, i) => (
              <div key={i} style={{ padding: '10px 14px', background: 'var(--xn-paper)', border: '1px solid var(--border-1)', borderRadius: 10, marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 15, color: 'var(--fg-1)' }}>{ex.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)' }}>{ex.sets}×{ex.reps} @ {ex.weight}kg</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Feature: coach system ────────────────────────────────────────────────────
function FeatureCoach() {
  const clients = [
    { init: 'MA', name: 'Marco Aliaga', plan: 'Push / pull / legs · wk 3', stat: '18 / 24' },
    { init: 'JS', name: 'Jun Soh', plan: 'Strength block · wk 1', stat: '3 / 18' },
    { init: 'RD', name: 'Rosa Daza', plan: 'Hypertrophy · wk 5', stat: '27 / 30' },
  ]
  return (
    <div className="mk-paper-alt">
      <div className="inner">
        <div className="mk-feature reverse">
          <div className="visual">
            <div className="mk-app-preview">
              <div className="bar">
                <div className="dots"><span /><span /><span /></div>
                xenoh.app / coach / clients
              </div>
              <div className="body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {clients.map((c, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center', padding: '10px 12px', background: 'var(--xn-paper)', border: '1px solid var(--border-1)', borderRadius: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 999, background: 'var(--xn-clay-300)', color: 'var(--xn-clay-900)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{c.init}</div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13, color: 'var(--fg-1)' }}>{c.name}</div>
                      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{c.plan}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--fg-2)' }}>{c.stat}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text">
            <div className="eyebrow">For coaches</div>
            <h2>Write the plan once. See every set they log.</h2>
            <p>Invite a client by email. Once they accept, the plan you author lives in their app — and every rep they complete lives in yours.</p>
            <ul>
              <li>One roster, compliance at a glance</li>
              <li>Plan templates you can drop on any client</li>
              <li>Notes on the exercise, not in a separate tab</li>
              <li>Coach dashboard with Big 3 PRs and last workout</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Feature grid ─────────────────────────────────────────────────────────────
function FeatureGrid() {
  const cells = [
    { ico: '📚', h: 'Exercise library', p: '700+ movements with primary and secondary muscle groups, tagged for quick filtering.' },
    { ico: '📋', h: 'Plan templates', p: 'Save any week as a template. Drop it on any client, tweak reps, done.' },
    { ico: '🏆', h: 'PR tracking', p: 'Your best lift at every rep range, automatically. No spreadsheet required.' },
    { ico: '📊', h: 'Progress charts', p: 'Bodyweight history and workout trends over time, visible to both coach and client.' },
    { ico: '📱', h: 'Mobile-first', p: 'The session view was designed thumb-up, one-handed, mid-rest between sets.' },
    { ico: '📤', h: 'Full data export', p: 'Every plan and every log exports to CSV. Your training history belongs to you.' },
  ]
  return (
    <section className="mk-section">
      <div className="mk-section-head">
        <div className="eyebrow">Everything included</div>
        <h2>The whole journal. Nothing extra.</h2>
        <p>Every feature is in every plan. There is no "Pro tier" for tracking your own reps.</p>
      </div>
      <div className="mk-grid6">
        {cells.map((c, i) => (
          <div key={i} className="cell">
            <div className="ico">{c.ico}</div>
            <h5>{c.h}</h5>
            <p>{c.p}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Testimonial ──────────────────────────────────────────────────────────────
function Testimonial() {
  return (
    <section className="mk-section">
      <div className="mk-quote">
        <blockquote>
          "I stopped rewriting the same spreadsheet every Sunday. My clients see exactly what I wrote, and I see every set they finish."
        </blockquote>
        <div className="who"><b>Elena Arroyo</b> · head coach, Hearth Strength</div>
      </div>
    </section>
  )
}

// ─── Pricing ──────────────────────────────────────────────────────────────────
function Pricing() {
  return (
    <section className="mk-section" id="pricing">
      <div className="mk-section-head">
        <div className="eyebrow">Pricing</div>
        <h2>Two plans. That's it.</h2>
        <p>Free for individuals, forever. Coaches pay per active client and nothing else.</p>
      </div>
      <div className="mk-pricing">
        <div className="mk-price">
          <div>
            <div className="tier">Individual</div>
            <h3>Solo</h3>
          </div>
          <div className="amount">Free<span> · forever</span></div>
          <p>For anyone planning their own training.</p>
          <ul>
            <li>Unlimited plans and sessions</li>
            <li>Full exercise library</li>
            <li>Progress history and PRs</li>
            <li>Accept plans from a coach</li>
            <li>CSV export</li>
          </ul>
          <Link to="/register" className="mk-btn secondary lg">Start free</Link>
        </div>
        <div className="mk-price featured">
          <div>
            <div className="tier">Coach</div>
            <h3>Coach</h3>
          </div>
          <div className="amount">$8<span> / active client / month</span></div>
          <p>Everything in Solo, plus the tools to run a roster.</p>
          <ul>
            <li>Unlimited clients — billed only when active</li>
            <li>Plan templates and bulk assignment</li>
            <li>Compliance reports per client</li>
            <li>Coach dashboard with client stats</li>
            <li>Priority support within 1 business day</li>
          </ul>
          <Link to="/register" className="mk-btn on-dark lg">Start a 30-day trial</Link>
        </div>
      </div>
    </section>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
function FAQ() {
  const qs = [
    { q: "What does 'active client' mean?", a: "An active client is anyone on your roster who logged at least one set in the month. If a client takes a week off, you're not billed for them. We bill daily, prorated." },
    { q: "Does it work offline?", a: "The session view works fully offline — tap through sets, log weights, everything. When you're back online the data syncs. We assume gyms have bad reception." },
    { q: "Can I use it without a coach?", a: "Absolutely. The Solo plan is free forever. You can create your own plans, log sessions, and track progress with no coach involved." },
    { q: "Who owns the data?", a: "You do. Every plan and every logged set can be exported to CSV at any time, no questions asked. If you close your account, we delete everything within 30 days." },
    { q: "Can clients see the plans their coach wrote?", a: "Yes. Coach-authored plans appear directly in the client's app. The client can log sets and mark exercises done. The coach sees every update in real time." },
    { q: "How does the coach–client relationship work?", a: "The client searches for a coach and sends a request. Once the coach accepts, they can create plans for that client. Either side can terminate the relationship at any time." },
  ]
  return (
    <section className="mk-section" id="faq">
      <div className="mk-section-head">
        <div className="eyebrow">Common questions</div>
        <h2>What people ask first.</h2>
      </div>
      <div className="mk-faq">
        {qs.map((q, i) => (
          <div key={i} className="q">
            <h4>{q.q}</h4>
            <p>{q.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="mk-cta">
      <h2>Plan the work.<br />Then do it.</h2>
      <p>Free for individuals. 30-day trial for coaches. No credit card required.</p>
      <Link to="/register" className="mk-btn on-dark lg" style={{ position: 'relative' }}>
        Create your account →
      </Link>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="mk-footer">
      <div className="inner">
        <div>
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <img src="/assets/logo-mark.svg" alt="" />
            Xenoh
          </Link>
          <div className="tag">A training journal for people who are serious about the plan — and for the coaches who write them.</div>
        </div>
        <div>
          <h6>Product</h6>
          <ul>
            <li><a href="#features">Plan builder</a></li>
            <li><a href="#features">Session logging</a></li>
            <li><a href="#features">Exercise library</a></li>
            <li><a href="#features">PR tracking</a></li>
          </ul>
        </div>
        <div>
          <h6>Coaches</h6>
          <ul>
            <li><a href="#pricing">For coaches</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>How it works</Link></li>
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
      </div>
      <div className="small">
        <div>© 2026 Xenoh. All rights reserved.</div>
        <div>Made for people who show up.</div>
      </div>
    </footer>
  )
}
