// Screens — compose features into product views

const sampleWeek = [
  { day:'Mon', date:14, label:'Push', status:'done' },
  { day:'Tue', date:15, label:'Pull', status:'done' },
  { day:'Wed', date:16, label:'Legs', status:'done' },
  { day:'Thu', date:17, label:'Push', status:'' },
  { day:'Fri', date:18, label:'Pull', status:'' },
  { day:'Sat', date:19, label:'Legs', status:'' },
  { day:'Sun', date:20, label:'Rest', status:'rest' },
];

const sampleExercises = [
  { id:'e1', name:'Bench press', primary:'chest', primaryLabel:'Chest', secondary:['Triceps','Shoulders'],
    plannedSets:5, plannedReps:5, plannedWeight:80,
    sets:[{done:true,reps:5,weight:80},{done:true,reps:5,weight:80},{done:true,reps:5,weight:80},{done:false},{done:false}] },
  { id:'e2', name:'Overhead press', primary:'shoulders', primaryLabel:'Shoulders', secondary:['Triceps','Core'],
    plannedSets:4, plannedReps:8, plannedWeight:45,
    sets:[{done:true,reps:8,weight:45},{done:true,reps:8,weight:45},{done:false},{done:false}] },
  { id:'e3', name:'Cable fly', primary:'chest', primaryLabel:'Chest', secondary:['Shoulders'],
    plannedSets:3, plannedReps:12, plannedWeight:15,
    sets:[{done:false},{done:false},{done:false}] },
  { id:'e4', name:'Triceps rope pushdown', primary:'triceps', primaryLabel:'Triceps', secondary:['Forearms'],
    plannedSets:3, plannedReps:12, plannedWeight:22,
    sets:[{done:false},{done:false},{done:false}] },
];

function DashboardScreen({ persona, onGoSession }) {
  if (persona === 'coach') return <CoachDashboard/>;
  return (
    <>
      <div className="xn-page-head">
        <div>
          <div className="xn-eyebrow" style={{color:'var(--fg-3)'}}>Thursday, 17 April</div>
          <h1>Good morning, Elena</h1>
          <div className="sub">You're three sessions deep into week 3. Push day today.</div>
        </div>
        <div style={{display:'flex', gap:10}}>
          <Button variant="secondary">Edit plan</Button>
          <Button variant="primary" onClick={onGoSession} icon={<span dangerouslySetInnerHTML={{__html:I.play}}/>}>Start session</Button>
        </div>
      </div>

      <div className="xn-hero-today">
        <div className="eyebrow">Today · Push</div>
        <div className="h">Bench · overhead · chest accessories</div>
        <div className="sub">4 exercises · ~55 minutes · heavy upper</div>
        <div className="row">
          <div style={{display:'flex', gap:24}}>
            <div>
              <div className="xn-eyebrow" style={{color:'var(--xn-clay-900)',opacity:.7}}>Volume</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:34,letterSpacing:'-.02em',marginTop:4,whiteSpace:'nowrap'}}>6,480 kg</div>
            </div>
            <div>
              <div className="xn-eyebrow" style={{color:'var(--xn-clay-900)',opacity:.7}}>Top set</div>
              <div style={{fontFamily:'var(--font-display)',fontWeight:700,fontSize:34,letterSpacing:'-.02em',marginTop:4,whiteSpace:'nowrap'}}>80 kg <span style={{fontFamily:'var(--font-sans)',fontSize:14,fontWeight:500}}>× 5</span></div>
            </div>
          </div>
          <Button variant="primary" onClick={onGoSession}>Open session →</Button>
        </div>
      </div>

      <div style={{height:24}}/>
      <div className="xn-grid cols-4">
        <StatTile label="Streak" value="11" unit="days" delta="+2 vs last week"
          narrative="Eleven days in a row — your longest stretch since January."/>
        <StatTile label="Sessions this month" value="14" delta="On pace"
          narrative="You're on pace for 18 sessions this month. That matches your plan exactly."/>
        <StatTile label="Total volume" value="42.1" unit="t" delta="+8%"
          narrative="Moving eight percent more iron this week than last. Mostly from the upper days."/>
        <StatTile label="Top lift · bench" value="82.5" unit="kg" delta="+2.5 kg"
          narrative="New bench top set on Monday — two and a half kilos over last block."/>
      </div>

      <div style={{height:28}}/>
      <div className="xn-grid main">
        <div className="xn-card">
          <h3 style={{margin:'0 0 14px'}}>This week</h3>
          <WeekStrip days={sampleWeek} selected={3}/>
        </div>
        <PlanSummary plan={{name:'Push / Pull / Legs', start:'1 Apr', end:'27 May', type:'Self-planned', weeksDone:3, weeksTotal:8}}/>
      </div>
    </>
  );
}

function SessionScreen() {
  const [exs, setExs] = React.useState(sampleExercises);
  const toggle = (id, i) => {
    setExs(list => list.map(ex => ex.id === id ? {
      ...ex,
      sets: ex.sets.map((s, j) => j === i ? { done: !s.done, reps: ex.plannedReps, weight: ex.plannedWeight } : s)
    } : ex));
  };
  const totalSets = exs.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = exs.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  return (
    <>
      <div className="xn-page-head">
        <div>
          <div className="xn-eyebrow" style={{color:'var(--fg-3)'}}>Thursday · push day</div>
          <h1>Today's session</h1>
          <div className="sub">Tap a set to log it. Completed sets go sage green.</div>
        </div>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <div style={{fontFamily:'var(--font-mono)',fontSize:13,color:'var(--fg-3)'}}>{doneSets} / {totalSets} sets</div>
          <Button variant="secondary">Add exercise</Button>
          <Button variant="primary">Finish</Button>
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:14}}>
        {exs.map(ex => <ExerciseCard key={ex.id} ex={ex} onToggleSet={toggle}/>)}
      </div>
    </>
  );
}

function PlanEditorScreen() {
  return (
    <>
      <div className="xn-page-head">
        <div>
          <div className="xn-eyebrow" style={{color:'var(--fg-3)'}}>Push / Pull / Legs · week 3</div>
          <h1>Plan builder</h1>
          <div className="sub">Drag exercises, edit sets and rep ranges. Changes save as you type.</div>
        </div>
        <div style={{display:'flex', gap:10}}>
          <Button variant="secondary">Duplicate week</Button>
          <Button variant="primary" icon={<span dangerouslySetInnerHTML={{__html:I.plus}}/>}>Add exercise</Button>
        </div>
      </div>
      <div className="xn-card" style={{marginBottom:18}}>
        <WeekStrip days={sampleWeek} selected={3}/>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:12}}>
        {sampleExercises.map(ex => <ExerciseCard key={ex.id} ex={ex}/>)}
      </div>
    </>
  );
}

const sampleClients = [
  { initials:'MA', name:'Marco Aliaga', plan:'Push / pull / legs', week:3, totalWeeks:8, done:18, total:24, status:'Active' },
  { initials:'JS', name:'Jun Soh', plan:'Strength block', week:1, totalWeeks:6, done:3, total:18, status:'Pending', avTone:'sage' },
  { initials:'RD', name:'Rosa Daza', plan:'Hypertrophy · upper focus', week:5, totalWeeks:6, done:27, total:30, status:'Active', avTone:'sage' },
  { initials:'KO', name:'Kenji Ota', plan:'Return-to-training', week:2, totalWeeks:4, done:5, total:12, status:'Active' },
];

function ClientsScreen() {
  return (
    <>
      <div className="xn-page-head">
        <div>
          <div className="xn-eyebrow" style={{color:'var(--fg-3)'}}>Coach view</div>
          <h1>Clients</h1>
          <div className="sub">4 active · 1 pending invite.</div>
        </div>
        <div style={{display:'flex', gap:10}}>
          <Button variant="secondary">Export report</Button>
          <Button variant="primary" icon={<span dangerouslySetInnerHTML={{__html:I.plus}}/>}>Invite a client</Button>
        </div>
      </div>
      <div className="xn-grid cols-4" style={{marginBottom:24}}>
        <StatTile label="Clients" value="12" delta="+1 this month"/>
        <StatTile label="Sessions this week" value="38" delta="+6%"/>
        <StatTile label="Compliance" value="87" unit="%" delta="Steady"/>
        <StatTile label="At risk" value="2" delta="Flagged" down/>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:10}}>
        {sampleClients.map((c,i) => <ClientRow key={i} client={c}/>)}
      </div>
    </>
  );
}

function CoachDashboard() {
  return (
    <>
      <div className="xn-page-head">
        <div>
          <div className="xn-eyebrow" style={{color:'var(--fg-3)'}}>Coach · Thursday, 17 April</div>
          <h1>Good morning, Elena</h1>
          <div className="sub">Eight sessions logged this morning. Two clients need a nudge.</div>
        </div>
        <div style={{display:'flex', gap:10}}>
          <Button variant="secondary">Weekly brief</Button>
          <Button variant="primary">Author plan</Button>
        </div>
      </div>
      <div className="xn-grid cols-4" style={{marginBottom:24}}>
        <StatTile label="Active clients" value="12"/>
        <StatTile label="Sessions today" value="8" delta="3 remaining"/>
        <StatTile label="Compliance" value="87" unit="%" delta="+2%"/>
        <StatTile label="At risk" value="2" delta="Flagged" down/>
      </div>
      <div className="xn-card">
        <h3 style={{margin:'0 0 12px'}}>Needs attention</h3>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {sampleClients.slice(0,3).map((c,i) => <ClientRow key={i} client={c}/>)}
        </div>
      </div>
    </>
  );
}

Object.assign(window, { DashboardScreen, SessionScreen, PlanEditorScreen, ClientsScreen, CoachDashboard });
