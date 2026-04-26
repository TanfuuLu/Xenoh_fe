# Xenoh Design System

> Train with intention. Coach with clarity.

Xenoh is a fitness web application for **planning workouts** and **managing
coach ↔ client relationships**. An individual can build their own plan; a
coach can author plans for the clients they've connected with and track
progress set-by-set.

This repository holds the visual language, typography, palette, component
recreations and brand guidance needed to build on-brand interfaces for
Xenoh — whether marketing pages, the web app, slides, or internal tools.

---

## At a glance

- **Product family:** one SaaS product with two personas — the **Individual**
  (plans their own training) and the **Coach** (manages multiple clients,
  authors plans for them).
- **Core nouns:** Plan → WeeklyWorkout → DailyWorkout → Exercise → ExerciseSet.
- **Secondary nouns:** ExerciseTemplate (library), CoachClientRelationship,
  MuscleGroup (Chest, Back, Shoulders, Biceps, Triceps, Forearms, Core,
  Quadriceps, Hamstrings, Glutes, Calves, FullBody).
- **Auth:** JWT + refresh tokens. Roles: `Individual`, `Coach`, `Admin`.

## Source material

- **Backend codebase** — `.NET` API mounted as `Xenoh_be/`
  - `src/Xenoh.Domain/Entities/*` — ApplicationUser, Plan, WeeklyWorkout,
    DailyWorkout, Exercise, ExerciseSet, ExerciseTemplate,
    CoachClientRelationship, RefreshToken
  - `src/Xenoh.Domain/Enums/*` — MuscleGroup, PlanType (Self / Coach),
    RelationshipStatus (Pending / Accepted), UserRole
  - `src/Xenoh.API/Controllers/*` — Auth, CoachClient, Coaches,
    DailyWorkouts, Exercises, ExerciseTemplates, Plans, WeeklyWorkouts
  - `openapi.json` — generated OpenAPI spec for the REST surface
- **No frontend code was provided.** The UI kit in this repo is designed
  fresh against the backend's domain model and the brand palette / font
  specified by the team — it is the authoritative visual reference going
  forward, not a reconstruction of an existing UI.
- **Brand cues provided by the team**
  - Color palette: `#A98B76`, `#BFA28C`, `#F3E4C9`, `#BABF94`
  - Typeface: **Namdhinggo** (SIL OFL — see `fonts/OFL.txt`)

---

## Index

```
README.md                   <- you are here
SKILL.md                    <- agent skill manifest
colors_and_type.css         <- the single source of truth for tokens
fonts/                      <- Namdhinggo (5 weights) + OFL license
assets/                     <- logos, icon set, textures
preview/                    <- design-system tab cards (HTML)
ui_kits/
  web_app/                  <- authenticated product (dashboard, plan, session)
  marketing/                <- public site (landing, pricing, coaches)
```

---

## Brand premise

Xenoh sits between **athletic discipline** and **craft**. It is not a
neon-and-gradients gym app; it is closer to a well-bound training journal
— warm paper, clay, sage — with a serif display face (Namdhinggo) that
feels deliberate and heritage-rooted, paired with a clean modern UI sans
(Geist) for the interface chrome.

The tone is calm, direct, and a little handsome. Athletes and coaches
already know the work is hard; the product doesn't need to shout.

---

## Content fundamentals

**Voice.** Knowledgeable training partner. Not a drill sergeant, not a
wellness influencer. Confident, specific, quietly encouraging.

**Person.** Second person for the user (`you`), first person plural when
the product acts (`we'll build your week from here`). Coaches are always
addressed as `you` too — never "as a coach…"; they know what they are.

**Casing.** Sentence case everywhere — buttons, menus, section headers,
page titles. Only product name (**Xenoh**) and proper nouns are capitalised
mid-sentence. Display headlines often drop the trailing period.

**Numbers.** Tabular, concrete, comfortable with specificity. `5 × 5 @ 80kg`
is good; `a few heavy sets` is not. Weight units follow the user's
preference (kg or lb); never mix.

**Emoji.** None in product UI, ever. Muscle groups, workout types, plan
status — all get real icons or text labels, not emoji.

**Forbidden moves.** No exclamation marks in UI copy (one allowed per
empty-state illustration). No "🚀 Let's gooo". No ALL CAPS except for the
small eyebrow/label style. No "Crush your goals". No "journey".

**Example copy**

| Context          | ✅ Xenoh                                     | 🚫 Off-brand                         |
|------------------|----------------------------------------------|--------------------------------------|
| Empty dashboard  | No plan yet. Start a week or pick a template. | Let's crush your first workout! 💪   |
| Set logged       | Set 3 logged — 8 reps at 60kg.               | Nice work, superstar! 🔥             |
| Coach invite     | Invite a client by email. They'll see your plans once they accept. | Add your squad!       |
| Error            | That date is outside the plan's range.       | Oops! Something went wrong.          |
| Login CTA        | Sign in                                      | GET STARTED NOW                      |
| Marketing lede   | Plan the work. Then do it.                   | Revolutionize your fitness journey!  |

---

## Visual foundations

### Colors

The palette is four team-supplied hues plus derived tints / shades and a
warm-grey ink scale. Everything skews **warm** — there are no cool greys,
no true blacks, no pure whites in the product UI. Paper (`#FBF7EE`) is the
default canvas; Sand (`#F3E4C9`) is the accent surface.

- **Clay** `#A98B76` — primary action, focus, brand accent.
- **Warm clay** `#BFA28C` — hover / secondary warm, dividers under focus.
- **Sand** `#F3E4C9` — hero backgrounds, soft cards, section breaks.
- **Sage** `#BABF94` — progress / success / "logged" states.
- **Ink** — warm brown-greys (`--xn-ink-*`) for text and borders.

Semantic tokens (`--fg-1/2/3`, `--bg-1/2/3`, `--accent`, `--border-1`,
etc.) are defined in `colors_and_type.css` — prefer those over hex.

### Typography

- **Display / headings:** Namdhinggo (serif) — weights 400–800. Used at
  28px and up. Tight tracking (`-0.02em`). Favours real small-caps feel
  and long, balanced lines.
- **UI / body:** Geist — weights 300–700. Default body 15px, 1.5 line
  height. Never smaller than 13px in product UI, never smaller than 12px
  at all.
- **Numeric / code:** JetBrains Mono. Tabular numerals for all weights,
  reps, timers, dates.

Namdhinggo pairs beautifully with the earthy palette; its gentle warmth
keeps the serif from feeling editorial or Condé-Nast.

### Spacing & layout

4px base unit. Container max 1200px for marketing, 1440px for the app.
Generous vertical rhythm (64–96px between marketing sections). Inside
product UI, dense but breathable: 16–24px gutters, 12–16px internal card
padding.

Fixed elements: the app's left rail (240px) and the marketing top nav
(72px tall, sticky, Paper with a 1px bottom border on scroll).

### Backgrounds

- **Primary:** Paper (`#FBF7EE`). No gradients.
- **Hero / marketing:** Sand (`#F3E4C9`), sometimes with a subtle
  film-grain texture (`assets/grain.png`, ~4% opacity) to keep the flat
  color from feeling plastic.
- **Accent bands:** short full-bleed Clay-700 strips (with Sand text) or
  Sage-500 bands. Never a three-stop gradient.

### Borders & cards

- Borders are 1px, `--border-1` (warm grey). Never black.
- Cards: 1px border + radius `--r-lg` (14px) + `--sh-sm` at rest.
  Elevation climbs to `--sh-md` on hover *only for interactive* cards.
- Dashed borders appear only in empty states and drop zones.

### Corner radii

Small chrome (inputs, chips): `--r-md` (10px). Cards & panels: `--r-lg`
(14px). Hero surfaces / sheets: `--r-xl` (20px). Buttons and pills:
`--r-pill`. Avatars: full circle.

### Shadows & elevation

Warm-tinted shadows only (brown, never blue). Five steps from `--sh-xs`
to `--sh-xl`. We also use `--sh-inset` (a 1px inner highlight) on Clay
primary buttons to give them a little press-worn dimension.

### Motion

- **Easing:** `--ease-out` (`cubic-bezier(0.22, 1, 0.36, 1)`) for entries,
  `--ease-in-out` for swaps.
- **Durations:** `--dur-fast` (120ms) for hovers, `--dur-med` (220ms) for
  panel transitions, `--dur-slow` (420ms) for route / plan-week changes.
- **Style:** fades + small translate (4–8px). No bounces, no spring
  overshoots, no parallax. A completed set gets a single 220ms fill from
  left-to-right in Sage-500 — satisfying but not gimmicky.

### States

- **Hover (interactive):** darken accent by one step
  (`--accent` → `--accent-hover`), or shift a neutral surface to `--bg-2`.
  Never change opacity alone.
- **Press:** one further darken step + 1px translateY for buttons.
- **Focus:** always visible — 3px Clay-700 ring at 35% opacity
  (`--focus-ring`), offset 2px from the element.
- **Disabled:** `--fg-4` text, no background change, no pointer cursor.
  We never grey out by lowering opacity.

### Transparency & blur

Used sparingly. The app's top bar gets a `backdrop-filter: blur(14px)`
with a 70% Paper fill when content scrolls beneath. Modals sit on a
`rgba(42, 31, 23, 0.4)` (warm ink) scrim — never pure black.

### Imagery tone

Photography, when used, is warm, matte, slightly desaturated — think
chalked hands, wooden floors, morning light through a gym window. Skin
tones breathe, greens go olive, no oversharpened HDR. For marketing
hero imagery, a subtle grain is acceptable. No stock CrossFit clichés
(backlit barbells in silhouette etc.).

---

## Iconography

- **System:** [Lucide](https://lucide.dev) (1.5px stroke, `currentColor`)
  as the default icon set, served via a CDN ESM build — see
  `assets/icons/USAGE.md`. Lucide's restrained, geometric strokes pair
  well with the serif display face without competing.
- **Custom:** a small set of muscle-group glyphs is drawn in-house
  (SVG, same 1.5px stroke) — see `assets/icons/muscle/*.svg`. These are
  used in plan editors and session summaries.
- **Logo:** `assets/logo-mark.svg` (the "X" monogram) + `assets/logo-wordmark.svg`.
- **Emoji:** not used in product UI. Allowed in user-generated content
  (workout notes) and in marketing-team social only.
- **Unicode chars:** `×` for set × rep notation (`5 × 5`), `·` for meta
  separators, `→` for navigation affordances, `@` for weight
  (`5 × 5 @ 80kg`). Never `x` for multiply. Never hyphens-as-bullets.

Full rules and a copy-paste cheatsheet are in
`assets/icons/USAGE.md`.

---

## UI kits

Each kit is a self-contained folder with its own `README.md`, an
`index.html` demo, and a set of small `.jsx` components.

- `ui_kits/web_app/` — the authenticated product. Dashboard, plan
  editor, daily session, coach's client list.
- `ui_kits/marketing/` — the public-facing site. Landing, pricing,
  "For coaches" page.

See each kit's `README.md` for the component inventory and a link to
its `index.html`.

---

## Known gaps & asks

- **No frontend source of truth.** The `Xenoh_be/` mount is backend-only,
  so every pixel in this system was designed fresh from the domain model
  and the four team-supplied hues. If there is an existing marketing
  site, Figma file, or mobile app I should align with, please attach.
- **UI sans substitution.** Namdhinggo is a display face; it can't carry
  UI. I paired it with **Geist** (Google Fonts) — clean, warm-neutral,
  humanist enough to not clash with the serif. If the team prefers
  something else (Söhne, General Sans, Inter, etc.) swap the one
  `--font-sans` var.
- **Imagery.** No brand photography was supplied. The cards and kits
  use tastefully-sized neutral placeholders. Real photos should be
  warm, matte, and desaturated per the Imagery tone section.
- **Logo.** No logo was supplied. I drew a simple `X` monogram in
  Clay-700 as a placeholder. Please replace when you have a real one.
