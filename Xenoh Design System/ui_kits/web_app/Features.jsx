// Feature components — cards used across screens

function StatTile({ label, value, unit, delta, down, sand, narrative }) {
  const t = useXnTweaks();
  const mode = t.progress || 'numbers';
  return (
    <div className={`xn-card xn-stat ${sand ? 'sand' : ''}`}>
      <div className="label">{label}</div>
      <div className="value">{value}{unit && <span className="unit">{unit}</span>}</div>
      {delta && <div className={`delta ${down ? 'down' : ''}`}>{delta}</div>}
      {mode === 'narrative' && narrative && <div className="narrative">{narrative}</div>}
    </div>
  );
}

function WeekStrip({ days, onSelect, selected }) {
  return (
    <div className="xn-week">
      {days.map((day, i) => (
        <div key={i}
             className={`xn-day ${day.status || ''} ${selected === i ? 'today' : ''}`}
             onClick={() => onSelect && onSelect(i)}>
          <span className="d">{day.day}</span>
          <span className="n">{day.date}</span>
          <span className="l">{day.label}</span>
        </div>
      ))}
    </div>
  );
}

function useXnTweaks() {
  const [, force] = React.useReducer(x => x + 1, 0);
  React.useEffect(() => {
    const on = () => force();
    window.addEventListener('__xn_tweaks_changed', on);
    return () => window.removeEventListener('__xn_tweaks_changed', on);
  }, []);
  return window.__xnTweaks || {};
}

function ExerciseCard({ ex, onToggleSet }) {
  const t = useXnTweaks();
  const allDone = ex.sets.length > 0 && ex.sets.every(s => s.done);
  const mode = t.progress || 'numbers';
  const doneCount = ex.sets.filter(s => s.done).length;
  const pct = Math.round((doneCount / ex.sets.length) * 100);
  const cls = [
    'xn-ex',
    allDone ? 'complete' : '',
    allDone ? 'tone-sage' : '',
  ].filter(Boolean).join(' ');
  const remain = ex.sets.length - doneCount;
  const topWeight = Math.max(...ex.sets.filter(s => s.done).map(s => s.weight || 0), 0);
  const narrativeText = allDone
    ? <>All <b>{ex.sets.length}</b> sets logged at <b>{ex.plannedReps} × {ex.plannedWeight} kg</b>. Nicely done.</>
    : doneCount === 0
      ? <>Up next — <b>{ex.plannedSets} × {ex.plannedReps}</b> at <b>{ex.plannedWeight} kg</b>. Tap a set when it's in the books.</>
      : <><b>{doneCount}</b> of <b>{ex.sets.length}</b> sets in, top set at <b>{topWeight} kg</b>. <b>{remain}</b> to go.</>;
  return (
    <div className={cls} style={{'--xn-progress': pct + '%'}}>
      <div>
        <div className="name">{ex.name}</div>
        <div className="meta">
          <MuscleIcon name={ex.primary} size={18}/>
          <Chip tone="accent">{ex.primaryLabel}</Chip>
          <span>{ex.secondary.join(' · ')}</span>
        </div>
      </div>
      <div className="setline">{ex.plannedSets} × {ex.plannedReps} <span style={{color:'var(--fg-3)'}}>@</span> {ex.plannedWeight} kg</div>
      <div className="sets">
        {ex.sets.map((s, i) => (
          <div key={i} className={`xn-set ${s.done ? 'done' : ''}`}
               onClick={() => onToggleSet && onToggleSet(ex.id, i)}>
            <span>{s.done ? `${s.reps} × ${s.weight}` : `– × ${ex.plannedWeight}`}</span>
            {s.done ? <span className="tick"/> : <span style={{color:'var(--fg-4)'}}>{i+1}</span>}
          </div>
        ))}
      </div>
      {mode === 'narrative' && (
        <div className="narrative">
          {narrativeText}
          {!allDone && onToggleSet && <span className="tapline">Tap a set on the card to log it.</span>}
        </div>
      )}
    </div>
  );
}

function ClientRow({ client, onOpen }) {
  return (
    <div className="xn-clientrow" onClick={onOpen}>
      <div className={`av ${client.avTone || ''}`}>{client.initials}</div>
      <div>
        <div className="name">{client.name}</div>
        <div className="meta">{client.plan} · week {client.week} of {client.totalWeeks}</div>
      </div>
      <div className="stat">{client.done} / {client.total} sessions</div>
      <Chip tone={client.status === 'Active' ? 'sage' : 'warn'} dot={client.status === 'Active' ? 'var(--xn-success)' : 'var(--xn-warning)'}>{client.status}</Chip>
      <span style={{color:'var(--fg-4)', fontFamily:'var(--font-mono)'}}>→</span>
    </div>
  );
}

function PlanSummary({ plan }) {
  const pct = Math.round((plan.weeksDone / plan.weeksTotal) * 100);
  return (
    <div className="xn-plan">
      <div className="name">{plan.name}</div>
      <div className="dates">{plan.start} → {plan.end} · {plan.type}</div>
      <div className="progress"><div style={{width: pct + '%'}}/></div>
      <div style={{fontFamily:'var(--font-sans)', fontSize:12, color:'var(--fg-3)'}}>
        Week {plan.weeksDone} of {plan.weeksTotal}
      </div>
    </div>
  );
}

Object.assign(window, { StatTile, WeekStrip, ExerciseCard, ClientRow, PlanSummary });
