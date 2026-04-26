// Marketing components + single-page landing
const { useEffect, useState: useStateMK } = React;

function MarketingNav() {
  const [scrolled, setScrolled] = useStateMK(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={`mk-nav ${scrolled ? 'scrolled' : ''}`}>
      <a href="#" className="brand"><img src="../../assets/logo-mark.svg?v=18"/>Xenoh</a>
      <nav>
        <a href="#product">Product</a>
        <a href="#how">How it works</a>
        <a href="#clients">Client system</a>
        <a href="#coaches">For coaches</a>
        <a href="#pricing">Pricing</a>
        <a href="#faq">FAQ</a>
      </nav>
      <div className="cta">
        <button className="mk-btn secondary">Sign in</button>
        <button className="mk-btn primary">Start free</button>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mk-hero">
      <div className="inner">
        <div>
          <div className="eyebrow">For individuals and coaches</div>
          <h1>Plan the work. Then do it.</h1>
          <p className="lede">Xenoh is a training journal for people who are serious about the plan — and for the coaches who write them. Weekly planning, live session logging, and a shared record that both sides trust.</p>
          <div className="actions">
            <button className="mk-btn primary lg">Start free</button>
            <button className="mk-btn secondary lg">See how it works →</button>
          </div>
        </div>
        <div className="visual">
          <div className="mk-app-preview">
            <div className="bar"><div className="dots"><span/><span/><span/></div>xenoh.app / today</div>
            <div className="body">
              <div style={{fontFamily:'var(--font-sans)',fontSize:11,fontWeight:600,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--fg-3)'}}>Today · push</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:26,letterSpacing:'-.02em',margin:'6px 0 14px'}}>Bench · overhead · accessories</div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:14}}>
                {[1,1,1,0,0].map((d,i) => (
                  <div key={i} style={{padding:'8px 6px', border:`1px solid ${d?'var(--xn-sage-400)':'var(--border-1)'}`, background: d?'var(--xn-sage-200)':'var(--bg-2)', borderRadius:8, fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-1)', textAlign:'center'}}>
                    {d ? '5 × 80' : `–`}
                  </div>
                ))}
              </div>
              <div style={{fontFamily:'var(--font-sans)', fontSize:13, color:'var(--fg-3)'}}>3 of 5 sets · bench press</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const rows = [
    {num: '12k+',  lbl: 'Active lifters', desc: 'Logging sessions every week across 40+ countries.'},
    {num: '2.3M',  lbl: 'Sets logged',    desc: 'Reps, weights, RPE — every one saved to your journal.'},
    {num: '94', suffix:'%', lbl: 'Plan compliance', desc: 'Average weekly completion for coach-authored plans.'},
    {num: '<2', suffix:'s', lbl: 'Log a set',     desc: 'Tap the weight, tap the reps. Back to the bar.'},
  ];
  return (
    <section className="mk-stats">
      {rows.map((r,i) => (
        <div key={i} className="stat">
          <div className="lbl">{r.lbl}</div>
          <div className="num">{r.num}{r.suffix ? <span>{r.suffix}</span> : null}</div>
          <div className="desc">{r.desc}</div>
        </div>
      ))}
    </section>
  );
}

function LogoBar() {
  return (
    <div className="mk-logobar">
      <div className="k">Used by coaches at</div>
      <div className="row">
        <span>Steel &amp; Stone</span>
        <span>Northline Athletics</span>
        <span>Fieldhouse</span>
        <span>Hearth Strength</span>
        <span>Kiln Barbell Club</span>
      </div>
    </div>
  );
}

function HowItWorks() {
  return (
    <section className="mk-section" id="how">
      <div className="mk-sectionhead">
        <div className="eyebrow">How it works</div>
        <h2>From blank week to finished session.</h2>
        <p>Three steps. The same three, whether you're planning your own training or writing a program for someone else.</p>
      </div>
      <div className="mk-steps">
        <div className="mk-step">
          <div className="n">01</div>
          <h4>Lay out the week.</h4>
          <p>Drag exercises from the library onto each day. Set target reps, weights, rest. Duplicate last week when it's working.</p>
          <div className="tag">≈ 5 minutes on sunday</div>
        </div>
        <div className="mk-step">
          <div className="n">02</div>
          <h4>Show up and log.</h4>
          <p>Session view opens to today's work. Tap through sets as you finish them — the app remembers weights and autofills the next rep target.</p>
          <div className="tag">live during training</div>
        </div>
        <div className="mk-step">
          <div className="n">03</div>
          <h4>See what's working.</h4>
          <p>Weekly summary shows completion, volume by muscle group, and PRs. Coach gets the same view for every client on the roster.</p>
          <div className="tag">automatic · no reports to write</div>
        </div>
      </div>
    </section>
  );
}

function FeaturePlan() {
  return (
    <section className="mk-section" id="product">
      <div className="mk-feature">
        <div className="text">
          <div className="eyebrow">Plan builder</div>
          <h2>A week, laid out like a journal.</h2>
          <p>Drag exercises onto the day they belong. Set reps, weights, rest. Duplicate a week when it's working. Nothing more complicated than that.</p>
          <ul>
            <li>Exercise templates with primary + secondary muscle groups</li>
            <li>Plan types: self-planned or authored by your coach</li>
            <li>Weekly view with completion at a glance</li>
            <li>Copy last week, edit in place, or start from a template</li>
          </ul>
        </div>
        <div className="visual">
          <div className="mk-app-preview">
            <div className="bar"><div className="dots"><span/><span/><span/></div>xenoh.app / plan</div>
            <div className="body" style={{padding:16}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:14}}>
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d,i) => {
                  const tone = i<3 ? {bg:'var(--xn-sage-200)',br:'var(--xn-sage-400)',c:'#5d6635'} : i===3 ? {bg:'var(--xn-clay-700)',br:'var(--xn-clay-800)',c:'var(--fg-on-clay)'} : i===6 ? {bg:'var(--bg-3)',br:'var(--border-1)',c:'var(--fg-3)'} : {bg:'var(--xn-paper)',br:'var(--border-1)',c:'var(--fg-1)'};
                  const label = ['Push','Pull','Legs','Push','Pull','Legs','Rest'][i];
                  return <div key={i} style={{padding:'8px 4px',background:tone.bg,border:`1px solid ${tone.br}`, borderRadius:8, textAlign:'center', color:tone.c}}>
                    <div style={{fontFamily:'var(--font-sans)', fontSize:9, fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase'}}>{d}</div>
                    <div style={{fontFamily:'var(--font-display)', fontWeight:600, fontSize:16, lineHeight:1, margin:'3px 0'}}>{14+i}</div>
                    <div style={{fontFamily:'var(--font-sans)', fontSize:9}}>{label}</div>
                  </div>;
                })}
              </div>
              {['Bench press','Overhead press','Cable fly'].map((n,i) => (
                <div key={i} style={{padding:'10px 12px', background:'var(--xn-paper)', border:'1px solid var(--border-1)', borderRadius:10, marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{fontFamily:'var(--font-display)', fontWeight:600, fontSize:15}}>{n}</div>
                  <div style={{fontFamily:'var(--font-mono)', fontSize:12, color:'var(--fg-2)'}}>{[5,4,3][i]} × {[5,8,12][i]} @ {[80,45,15][i]}kg</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClientSystem() {
  return (
    <section className="mk-section paper-alt" id="clients">
      <div className="inner">
        <div className="mk-client">
          <div className="heading">
            <div className="eyebrow">The client system</div>
            <h2>One invite. Two apps. One shared journal.</h2>
            <p>Xenoh is built around the <b>coach ↔ client relationship</b> — not as a bolt-on, but as the core. Every plan has an author. Every logged set has an audience. The same journal is visible to both sides, in the view that makes sense for each role.</p>
            <p>Relationships have real state: <b>pending</b> when you've invited, <b>accepted</b> when they're on your roster, and paused when either side wants a break. No silent disconnects, no "did they see that?".</p>
            <span className="pill">Used in 2,400+ coach ↔ client pairs today</span>
          </div>

          <div className="mk-flow">
            <h4>Relationship lifecycle</h4>
            <ol>
              <li>
                <h5>Coach sends an invite</h5>
                <p>By email. Client doesn't need an account yet.</p>
                <span className="status pending">step · email sent</span>
              </li>
              <li className="pending">
                <h5>Client accepts</h5>
                <p>Signs up or signs in, accepts in one tap. Relationship becomes <b>Accepted</b>.</p>
                <span className="status active">status · accepted</span>
              </li>
              <li>
                <h5>Coach writes a plan</h5>
                <p>Attached to the client. Appears in their app immediately.</p>
                <span className="status active">plan · assigned</span>
              </li>
              <li>
                <h5>Client logs sessions</h5>
                <p>Every set, weight, and rep syncs to the coach dashboard in real time.</p>
                <span className="status active">live · syncing</span>
              </li>
              <li>
                <h5>Either side can pause</h5>
                <p>Pause billing, keep the history. Resume any time, plan picks up where it left off.</p>
                <span className="status paused">optional · paused</span>
              </li>
            </ol>
          </div>
        </div>

        {/* invite + dual-view */}
        <div className="mk-split">
          <div className="mk-persona coach">
            <span className="badge">Coach view</span>
            <h4>Everything on one roster.</h4>
            <div className="sub">What the coach sees for every client, updated live.</div>
            <ul>
              <li><span><b>Assigned plan</b> — current block, week, day, and what's next.</span></li>
              <li><span><b>Compliance %</b> — sets completed vs. prescribed, this week and all-time.</span></li>
              <li><span><b>Last-session summary</b> — total volume, top sets, any notes the client left.</span></li>
              <li><span><b>Missed-session alerts</b> — surfaced when a client hasn't logged in 48h.</span></li>
              <li><span><b>PR pings</b> — a small note when a client hits a new best at any rep range.</span></li>
              <li><span><b>Inline replies</b> — respond to a set comment without leaving the roster.</span></li>
            </ul>
            <div className="mk-roster-stats">
              <div className="r"><div className="n">24</div><div className="l">clients</div></div>
              <div className="r"><div className="n">91<span style={{fontSize:20}}>%</span></div><div className="l">avg compliance</div></div>
              <div className="r"><div className="n">3</div><div className="l">need attention</div></div>
            </div>
          </div>

          <div className="mk-persona client">
            <span className="badge">Client view</span>
            <h4>Today's work. Nothing else.</h4>
            <div className="sub">What the client sees when they open the app.</div>
            <ul>
              <li><span><b>Today's session</b> — exercises, sets, target weights, rest timers — in order.</span></li>
              <li><span><b>Coach's notes</b> — attached to the specific exercise or set, not buried in chat.</span></li>
              <li><span><b>Auto-fill last weight</b> — what you hit last time, so you're not fumbling for a number.</span></li>
              <li><span><b>Leave a quick reply</b> — "knee felt tight on set 3" goes straight to the coach.</span></li>
              <li><span><b>Swap or skip</b> — with a reason. Coach sees it. No punishment.</span></li>
              <li><span><b>Weekly summary</b> — volume by muscle group and PRs hit, delivered Sunday.</span></li>
            </ul>

            <div className="mk-invite-card">
              <div className="top">
                <div className="from">From <b>Elena Arroyo</b> · Hearth Strength</div>
                <div style={{fontFamily:'var(--font-mono)',fontSize:11,color:'var(--fg-3)'}}>2 min ago</div>
              </div>
              <h5>You've been invited to coach on Xenoh</h5>
              <p>Elena wants to program your training for the next 12 weeks. Accepting adds her plan to your app — you can pause or end anytime.</p>
              <div className="row2">
                <button className="mk-btn primary">Accept invite</button>
                <button className="mk-btn secondary">View Elena's profile →</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCoach() {
  return (
    <section className="mk-section paper-alt" id="coaches">
      <div className="inner">
        <div className="mk-feature reverse">
          <div className="visual">
            <div className="mk-app-preview">
              <div className="bar"><div className="dots"><span/><span/><span/></div>xenoh.app / coach / clients</div>
              <div className="body" style={{padding:14, display:'flex', flexDirection:'column', gap:8}}>
                {[['MA','Marco Aliaga','Push / pull / legs · wk 3','18 / 24','sage'],
                  ['JS','Jun Soh','Strength block · wk 1','3 / 18','warn'],
                  ['RD','Rosa Daza','Hypertrophy · wk 5','27 / 30','sage']].map((c,i) => (
                    <div key={i} style={{display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, alignItems:'center', padding:'8px 10px', background:'var(--xn-paper)', border:'1px solid var(--border-1)', borderRadius:10}}>
                      <div style={{width:32, height:32, borderRadius:999, background:'var(--xn-clay-300)', color:'var(--xn-clay-900)', fontFamily:'var(--font-display)', fontWeight:700, fontSize:12, display:'flex', alignItems:'center', justifyContent:'center'}}>{c[0]}</div>
                      <div>
                        <div style={{fontFamily:'var(--font-sans)', fontWeight:600, fontSize:13}}>{c[1]}</div>
                        <div style={{fontFamily:'var(--font-sans)', fontSize:11, color:'var(--fg-3)'}}>{c[2]}</div>
                      </div>
                      <div style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-2)'}}>{c[3]}</div>
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
              <li>Templates you can drop onto any client's week</li>
              <li>Notes on the exercise, not in a separate tab</li>
              <li>Client replies in-context — no more "which set?" texts</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  const cells = [
    {g:'EX', h:'Exercise library', p:'700+ movements with primary and secondary muscle groups, tagged for quick filtering.'},
    {g:'TM', h:'Plan templates',   p:'Save any week as a template. Drop it on any client, tweak reps, done.'},
    {g:'PR', h:'PR tracking',      p:'Your best lift at every rep range, automatically. No spreadsheet required.'},
    {g:'CT', h:'Coach chat',       p:'Inline notes attached to the set, the exercise, or the week — never a separate inbox.'},
    {g:'MB', h:'Mobile-first',     p:'The session view was designed thumb-up, one-handed, mid-rest between sets.'},
    {g:'EX', h:'Export anywhere',  p:'Every plan and every log exports to CSV. Your training history belongs to you.'},
  ];
  return (
    <section className="mk-section">
      <div className="mk-sectionhead">
        <div className="eyebrow">Everything included</div>
        <h2>The whole journal. Nothing extra.</h2>
        <p>Every feature is in every plan. There's no "Pro tier" of tracking your own reps — it's just here.</p>
      </div>
      <div className="mk-grid6">
        {cells.map((c,i) => (
          <div key={i} className="cell">
            <div className="ico">{c.g}</div>
            <h5>{c.h}</h5>
            <p>{c.p}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Comparison() {
  const rows = [
    {f:'Unlimited plans and sessions', s:'yes', c:'yes'},
    {f:'Full exercise library',        s:'yes', c:'yes'},
    {f:'Progress history and PRs',     s:'yes', c:'yes'},
    {f:'Accept plans from a coach',    s:'yes', c:'yes'},
    {f:'Author plans for clients',     s:'no',  c:'yes'},
    {f:'Unlimited clients on roster',  s:'no',  c:'yes'},
    {f:'Plan templates + bulk assign', s:'no',  c:'yes'},
    {f:'Compliance reports',           s:'no',  c:'yes'},
    {f:'Public coach profile page',    s:'no',  c:'yes'},
  ];
  return (
    <section className="mk-section">
      <div className="mk-sectionhead">
        <div className="eyebrow">Solo vs. Coach</div>
        <h2>What's in each plan.</h2>
      </div>
      <table className="mk-compare">
        <thead>
          <tr>
            <th style={{width:'56%'}}>Feature</th>
            <th>Solo <span style={{fontFamily:'var(--font-sans)',fontWeight:500,fontSize:12,color:'var(--fg-3)'}}>· Free</span></th>
            <th>Coach <span style={{fontFamily:'var(--font-sans)',fontWeight:500,fontSize:12,color:'var(--fg-3)'}}>· $8 / active client</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i) => (
            <tr key={i}>
              <td className="feat">{r.f}</td>
              <td className={r.s}>{r.s === 'yes' ? 'Included' : 'Not included'}</td>
              <td className={r.c}>{r.c === 'yes' ? 'Included' : 'Not included'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Pricing() {
  return (
    <section className="mk-section" id="pricing">
      <div className="mk-sectionhead">
        <div className="eyebrow">Pricing</div>
        <h2>Two plans. That's it.</h2>
        <p>Free for individuals, forever. Coaches pay per active client and nothing else. No per-seat tax, no "Pro" paywall, no annual contracts.</p>
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
          <button className="mk-btn secondary lg">Start free</button>
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
            <li>Coach profile page</li>
            <li>Priority support within 1 business day</li>
          </ul>
          <button className="mk-btn on-dark lg">Start a 30-day trial</button>
        </div>
      </div>
    </section>
  );
}

function Testimonial() {
  return (
    <section className="mk-section">
      <div className="mk-quote">
        <blockquote>"I stopped rewriting the same spreadsheet every Sunday. My clients see exactly what I wrote, and I see every set they finish."</blockquote>
        <div className="who"><b>Elena Arroyo</b> · head coach, Hearth Strength</div>
      </div>
    </section>
  );
}

function FAQ() {
  const qs = [
    {q:"What does 'active client' mean?", a:"An active client is anyone on your roster who logged at least one set in the month. If a client takes a week off or goes on vacation, you're not billed for them. We bill daily, prorated to the second — no surprises."},
    {q:"Can I import my old training data?", a:"Yes. We support CSV import from most popular trackers, and we'll map exercises to our library automatically. For large histories (>2 years), our support team will do the import for you."},
    {q:"Does it work offline?", a:"The session view works fully offline — tap through sets, log weights, everything. When you're back online the data syncs. We assume gyms have bad reception."},
    {q:"Who owns the data?", a:"You do. Every plan and every logged set can be exported to CSV at any time, no questions asked. If you close your account, we delete everything within 30 days."},
    {q:"Is there an iPhone / Android app?", a:"The web app is installable on every modern phone (add to home screen). Native apps are in private beta — email us if you'd like early access."},
    {q:"Can I white-label it for my gym?", a:"Not yet. That's on the roadmap for Q3. In the meantime, the Coach profile page supports your logo, colors, and custom URL."},
  ];
  return (
    <section className="mk-section" id="faq">
      <div className="mk-sectionhead">
        <div className="eyebrow">Common questions</div>
        <h2>What people ask first.</h2>
      </div>
      <div className="mk-faq">
        {qs.map((q,i) => (
          <div key={i} className="q">
            <h4>{q.q}</h4>
            <p>{q.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="mk-cta">
      <h2>Plan the work.<br/>Then do it.</h2>
      <p>Free for individuals. 30-day trial for coaches. No credit card required.</p>
      <button className="btn">Create your account →</button>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mk-footer">
      <div className="inner">
        <div>
          <div className="brand"><img src="../../assets/logo-mark.svg?v=18"/>Xenoh</div>
          <div className="tag">A training journal for people who are serious about the plan — and for the coaches who write them.</div>
        </div>
        <div>
          <h6>Product</h6>
          <ul><li><a>Plan builder</a></li><li><a>Session</a></li><li><a>Library</a></li><li><a>Progress</a></li><li><a>Mobile</a></li></ul>
        </div>
        <div>
          <h6>Coaches</h6>
          <ul><li><a>For coaches</a></li><li><a>Case studies</a></li><li><a>Templates</a></li><li><a>Affiliate</a></li></ul>
        </div>
        <div>
          <h6>Company</h6>
          <ul><li><a>About</a></li><li><a>Journal</a></li><li><a>Contact</a></li><li><a>Terms</a></li><li><a>Privacy</a></li></ul>
        </div>
      </div>
      <div className="inner small">
        <div>© 2026 Xenoh. All rights reserved.</div>
        <div>Made for people who show up.</div>
      </div>
    </footer>
  );
}

function MarketingPage() {
  return (
    <div>
      <MarketingNav/>
      <Hero/>
      <Stats/>
      <LogoBar/>
      <HowItWorks/>
      <FeaturePlan/>
      <ClientSystem/>
      <FeatureCoach/>
      <FeatureGrid/>
      <Comparison/>
      <Pricing/>
      <Testimonial/>
      <FAQ/>
      <FinalCTA/>
      <Footer/>
    </div>
  );
}

Object.assign(window, { MarketingPage });
