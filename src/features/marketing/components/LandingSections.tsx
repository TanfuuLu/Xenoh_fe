import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher'
import { useLandingCopy } from './landingCopy'

export function MarketingNav() {
  const t = useLandingCopy()
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
        <a href="#how">{t.nav.how}</a>
        <a href="#features">{t.nav.features}</a>
        <a href="#pricing">{t.nav.pricing}</a>
        <a href="#faq">{t.nav.faq}</a>
        <Link to="/about" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 500, fontSize: 14 }}>{t.nav.about}</Link>
      </nav>
      <div className="cta">
        <LanguageSwitcher />
        <Link to="/login" className="mk-btn secondary">{t.nav.signIn}</Link>
        <Link to="/register" className="mk-btn clay">{t.nav.startFree}</Link>
      </div>
    </header>
  )
}

export function Hero() {
  const t = useLandingCopy()
  return (
    <section className="mk-hero">
      <div className="inner">
        <div>
          <div className="eyebrow">{t.hero.eyebrow}</div>
          <h1>{t.hero.title}</h1>
          <p className="lede">{t.hero.lede}</p>
          <div className="actions">
            <Link to="/register" className="mk-btn primary lg">{t.hero.primary}</Link>
            <a href="#how" className="mk-btn secondary lg">{t.hero.secondary}</a>
          </div>
        </div>
        <div className="visual mk-intro-preview-shell">
          <div className="mk-intro-preview-pad">
            <div className="mk-app-preview mk-today-preview">
              <div className="bar">
                <div className="dots"><span /><span /><span /></div>
                xenoh.app / today
              </div>
              <div className="body mk-today-body">
                <div className="mk-preview-kicker">
                  {t.hero.today}
                </div>
                <div className="mk-preview-title">
                  {t.hero.workout}
                </div>
                <div className="mk-set-grid">
                  {[true, true, true, false, false].map((done, i) => (
                    <div key={i} className={`mk-set-cell${done ? ' done' : ''}`}>
                      {done ? '5x80' : '-'}
                    </div>
                  ))}
                </div>
                <div className="mk-preview-progress">
                  {t.hero.sets}
                </div>
                <div className="mk-next-exercise">
                  <div className="mk-next-exercise-head">
                    <div>{t.hero.overhead}</div>
                    <span>4x8 @ 40kg</span>
                  </div>
                  <div className="mk-next-set-row">
                    {[false, false, false, false].map((_, i) => (
                      <div key={i}>{i + 1}</div>
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

export function Stats() {
  const t = useLandingCopy()
  return (
    <div className="mk-stats">
      {t.stats.map((s, i) => (
        <a key={i} href="#features" className="stat mk-card-link" aria-label={`${t.how.view} ${s.lbl}`}>
          <div className="lbl">{s.lbl}</div>
          <div className="num">{s.num}{s.suffix && <span>{s.suffix}</span>}</div>
          <div className="desc">{s.desc}</div>
        </a>
      ))}
    </div>
  )
}

export function LogoBar() {
  const t = useLandingCopy()
  return (
    <div className="mk-logobar">
      <div className="k">{t.logoBar.label}</div>
      <div className="row">
        {t.logoBar.names.map((n) => <span key={n}>{n}</span>)}
      </div>
    </div>
  )
}

export function HowItWorks() {
  const t = useLandingCopy()
  return (
    <section className="mk-section" id="how">
      <div className="mk-section-head">
        <div className="eyebrow">{t.how.eyebrow}</div>
        <h2>{t.how.title}</h2>
        <p>{t.how.desc}</p>
      </div>
      <div className="mk-steps">
        {t.how.steps.map((s) => (
          <a key={s.n} href="#features" className="mk-step mk-card-link" aria-label={`${s.h} ${t.how.view}`}>
            <div className="n">{s.n}</div>
            <h4>{s.h}</h4>
            <p>{s.p}</p>
            <div className="tag">{s.tag}</div>
          </a>
        ))}
      </div>
    </section>
  )
}

export function FeaturePlan() {
  const t = useLandingCopy()
  return (
    <section className="mk-section" id="features">
      <div className="mk-feature">
        <div className="text">
          <div className="eyebrow">{t.plan.eyebrow}</div>
          <h2>{t.plan.title}</h2>
          <p>{t.plan.desc}</p>
          <ul>{t.plan.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div className="visual mk-week-preview">
          <div className="body mk-week-body">
            <div className="mk-week-strip">
              {t.plan.days.map((d, i) => {
                const isDone = i < 3
                const isToday = i === 3
                const isRest = i === 6
                return (
                  <div key={d} className={`mk-week-day${isDone ? ' done' : ''}${isToday ? ' today' : ''}${isRest ? ' rest' : ''}`}>
                    <div>{d}</div>
                    <strong>{14 + i}</strong>
                    <span>{t.plan.labels[i]}</span>
                  </div>
                )
              })}
            </div>
            {t.plan.exercises.map((ex) => (
              <div key={ex.name} className="mk-week-exercise">
                <strong>{ex.name}</strong>
                <span>{ex.sets}x{ex.reps} @ {ex.weight}kg</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export function FeatureCoach() {
  const t = useLandingCopy()
  return (
    <div className="mk-paper-alt">
      <div className="inner">
        <div className="mk-feature reverse">
          <div className="visual mk-coach-preview-shell">
            <div className="mk-app-preview mk-coach-preview">
              <div className="bar">
                <div className="dots"><span /><span /><span /></div>
                xenoh.app / coach / clients
              </div>
              <div className="body mk-coach-list">
                {t.coach.clients.map((c) => (
                  <div key={c.name} className="mk-coach-client">
                    <div className="mk-client-avatar">{c.init}</div>
                    <div>
                      <strong>{c.name}</strong>
                      <p>{c.plan}</p>
                    </div>
                    <span>{c.stat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="text">
            <div className="eyebrow">{t.coach.eyebrow}</div>
            <h2>{t.coach.title}</h2>
            <p>{t.coach.desc}</p>
            <ul>{t.coach.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export function FeatureGrid() {
  const t = useLandingCopy()
  return (
    <section className="mk-section">
      <div className="mk-section-head">
        <div className="eyebrow">{t.grid.eyebrow}</div>
        <h2>{t.grid.title}</h2>
        <p>{t.grid.desc}</p>
      </div>
      <div className="mk-grid6">
        {t.grid.cells.map((c) => (
          <a key={c.h} href="#pricing" className="cell mk-card-link" aria-label={`${c.h}. ${t.grid.view}`}>
            <div className="ico">{c.ico}</div>
            <h5>{c.h}</h5>
            <p>{c.p}</p>
          </a>
        ))}
      </div>
    </section>
  )
}

export function Testimonial() {
  const t = useLandingCopy()
  return (
    <section className="mk-section">
      <div className="mk-quote">
        <blockquote>{t.testimonial.quote}</blockquote>
        <div className="who"><b>Elena Arroyo</b> - {t.testimonial.who}</div>
      </div>
    </section>
  )
}

export function Pricing() {
  const t = useLandingCopy()
  return (
    <section className="mk-section" id="pricing">
      <div className="mk-section-head">
        <div className="eyebrow">{t.pricing.eyebrow}</div>
        <h2>{t.pricing.title}</h2>
        <p>{t.pricing.desc}</p>
      </div>
      <div className="mk-pricing">
        <Link to="/register" className="mk-price mk-card-link" aria-label={t.pricing.soloAria}>
          <div><div className="tier">{t.pricing.soloTier}</div><h3>{t.pricing.soloName}</h3></div>
          <div className="amount">{t.pricing.soloPrice}<span>{t.pricing.soloUnit}</span></div>
          <p>{t.pricing.soloDesc}</p>
          <ul>{t.pricing.soloFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
          <span className="mk-btn secondary lg">{t.pricing.soloButton}</span>
        </Link>
        <Link to="/register" className="mk-price highlighted mk-card-link" aria-label={t.pricing.userAria}>
          <div><div className="tier">{t.pricing.userTier}</div><h3>{t.pricing.userName}</h3></div>
          <div className="amount">{t.pricing.userPrice}<span>{t.pricing.userUnit}</span></div>
          <p>{t.pricing.userDesc}</p>
          <ul>{t.pricing.userFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
          <span className="mk-btn secondary lg">{t.pricing.userButton}</span>
        </Link>
        <Link to="/register" className="mk-price featured mk-card-link" aria-label={t.pricing.coachAria}>
          <div><div className="tier">{t.pricing.coachTier}</div><h3>{t.pricing.coachName}</h3></div>
          <div className="amount">{t.pricing.coachPrice}<span>{t.pricing.coachUnit}</span></div>
          <p>{t.pricing.coachDesc}</p>
          <ul>{t.pricing.coachFeatures.map((item) => <li key={item}>{item}</li>)}</ul>
          <span className="mk-btn on-dark lg">{t.pricing.coachButton}</span>
        </Link>
      </div>
    </section>
  )
}

export function FAQ() {
  const t = useLandingCopy()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="mk-section" id="faq">
      <div className="mk-section-head">
        <div className="eyebrow">{t.faq.eyebrow}</div>
        <h2>{t.faq.title}</h2>
      </div>
      <div className="mk-faq">
        {t.faq.qs.map((q, i) => {
          const isOpen = openIndex === i

          return (
            <div key={q.q} className={`q mk-faq-item${isOpen ? ' open' : ''}`}>
              <button
                type="button"
                className="mk-faq-trigger"
                aria-expanded={isOpen}
                aria-controls={`faq-answer-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
              >
                <span>{q.q}</span>
                <span className="mk-faq-icon" aria-hidden="true">{isOpen ? '-' : '+'}</span>
              </button>
              <div id={`faq-answer-${i}`} className="mk-faq-answer" hidden={!isOpen}>
                <p>{q.a}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export function FinalCTA() {
  const t = useLandingCopy()
  return (
    <section className="mk-cta">
      <h2>{t.cta.title}</h2>
      <p>{t.cta.desc}</p>
      <Link to="/register" className="mk-btn on-dark lg" style={{ position: 'relative' }}>
        {t.cta.button}
      </Link>
    </section>
  )
}

export function Footer() {
  const t = useLandingCopy()
  return (
    <footer className="mk-footer">
      <div className="inner">
        <div>
          <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
            <img src="/assets/logo-mark.svg" alt="" />
            Xenoh
          </Link>
          <div className="tag">{t.footer.tag}</div>
        </div>
        <div>
          <h6>{t.footer.product}</h6>
          <ul>
            {t.footer.productLinks.map((label) => <li key={label}><a href="#features">{label}</a></li>)}
          </ul>
        </div>
        <div>
          <h6>{t.footer.coaches}</h6>
          <ul>
            <li><a href="#pricing">{t.footer.coachLinks[0]}</a></li>
            <li><a href="#pricing">{t.footer.coachLinks[1]}</a></li>
            <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.coachLinks[2]}</Link></li>
          </ul>
        </div>
        <div>
          <h6>{t.footer.company}</h6>
          <ul>
            <li><Link to="/about" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.companyLinks[0]}</Link></li>
            <li><Link to="/login" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.companyLinks[1]}</Link></li>
            <li><Link to="/register" style={{ color: 'inherit', textDecoration: 'none' }}>{t.footer.companyLinks[2]}</Link></li>
          </ul>
        </div>
      </div>
      <div className="small">
        <div>{t.footer.copyright}</div>
        <div>{t.footer.madeFor}</div>
      </div>
    </footer>
  )
}
