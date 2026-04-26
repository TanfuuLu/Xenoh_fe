// Sidebar, TopBar, Shell for the web app
const { useState: useStateS } = React;

function Sidebar({ persona, setPersona, screen, setScreen }) {
  const individualNav = [
    { id: 'dashboard', label: 'Dashboard', icon: I.home },
    { id: 'session', label: "Today's session", icon: I.dumbbell },
    { id: 'plan', label: 'My plan', icon: I.cal },
    { id: 'library', label: 'Exercise library', icon: I.library },
    { id: 'progress', label: 'Progress', icon: I.chart },
  ];
  const coachNav = [
    { id: 'dashboard', label: 'Overview', icon: I.home },
    { id: 'clients', label: 'Clients', icon: I.users },
    { id: 'plan', label: 'Plan builder', icon: I.cal },
    { id: 'library', label: 'Template library', icon: I.library },
    { id: 'progress', label: 'Reports', icon: I.chart },
  ];
  const nav = persona === 'coach' ? coachNav : individualNav;

  return (
    <aside className="xn-sidebar">
      <div className="xn-brand">
        <img src="../../assets/logo-mark.svg?v=3" alt="Xenoh"/>
        <span>Xenoh</span>
      </div>
      <nav className="xn-nav">
        <h6>{persona === 'coach' ? 'Coach' : 'Training'}</h6>
        {nav.map(item => (
          <a key={item.id}
             className={screen === item.id ? 'active' : ''}
             onClick={() => setScreen(item.id)}>
            <span className="ic" dangerouslySetInnerHTML={{__html: item.icon}}/>
            {item.label}
          </a>
        ))}
        <h6>Account</h6>
        <a><span className="ic" dangerouslySetInnerHTML={{__html: I.settings}}/>Settings</a>
      </nav>
      <div className="xn-persona">
        <div className="xn-persona-label">View as</div>
        <div className="xn-persona-switch">
          <button className={persona === 'individual' ? 'active' : ''} onClick={() => setPersona('individual')}>Individual</button>
          <button className={persona === 'coach' ? 'active' : ''} onClick={() => setPersona('coach')}>Coach</button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ crumbs, right }) {
  return (
    <header className="xn-topbar">
      <div className="crumbs">{crumbs}</div>
      <div className="right">
        <div className="xn-search">
          <span dangerouslySetInnerHTML={{__html: I.search}}/>
          <input placeholder="Search plans, clients, exercises…"/>
        </div>
        <IconBtn svg={I.bell}/>
        {right}
        <div className="xn-avatar">EA</div>
      </div>
    </header>
  );
}

function Shell({ persona, setPersona, screen, setScreen, crumbs, right, children }) {
  return (
    <div className="xn-shell">
      <Sidebar persona={persona} setPersona={setPersona} screen={screen} setScreen={setScreen}/>
      <main className="xn-main">
        <TopBar crumbs={crumbs} right={right}/>
        <div className="xn-content">{children}</div>
      </main>
    </div>
  );
}

Object.assign(window, { Sidebar, TopBar, Shell });
