# Xenoh — Web app UI kit

The authenticated product. Two personas share one shell:

- **Individual** — plans their own training, logs their sessions.
- **Coach** — manages a client list, authors plans on their behalf.

## Components

| File                | What it is                                           |
|---------------------|------------------------------------------------------|
| `Shell.jsx`         | Left rail + top bar + main content layout            |
| `Sidebar.jsx`       | Left nav (logo, primary links, persona switcher)     |
| `TopBar.jsx`        | Search, notifications, user menu                     |
| `Button.jsx`        | Primary / secondary / ghost / danger                 |
| `Chip.jsx`          | Status badges and muscle-group chips                 |
| `MuscleIcon.jsx`    | Renders the 12-icon custom set                       |
| `WeekStrip.jsx`     | 7-day selector with completion states                |
| `ExerciseCard.jsx`  | Exercise + sets, with logging                        |
| `ClientRow.jsx`     | Coach's view of a single client                      |
| `StatTile.jsx`      | Dashboard stat + delta                               |
| `PlanSummary.jsx`   | Plan card (dates, weeks remaining, type)             |

## Screens demonstrated in `index.html`

1. **Dashboard** — today's session + this week's overview + streak.
2. **Plan editor** — week strip + a day's exercises, editable.
3. **Session** — today's workout, logging sets one by one.
4. **Coach clients** — list of all the coach's clients.

Switch screens with the top-right "View" dropdown. Persona switches
between Individual and Coach views in the sidebar.

Source of truth: `Xenoh_be/src/Xenoh.Domain/Entities/*` and the
palette/font brief from the team.
