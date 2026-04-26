# Iconography usage

Xenoh uses **Lucide** as the default icon set, plus a small custom
muscle-group set.

## Lucide

Loaded via ESM CDN; 1.5px stroke, `currentColor`. Pair with 14–20px
font sizes at 18–20px icon sizes. Use `stroke-linecap="round"`.

```html
<!-- In the page -->
<script type="module">
  import { createIcons, icons } from 'https://unpkg.com/lucide@latest/dist/esm/lucide.js';
  createIcons({ icons, attrs: { 'stroke-width': 1.5 } });
</script>

<i data-lucide="dumbbell"></i>
<i data-lucide="calendar"></i>
<i data-lucide="user-round"></i>
```

Preferred glyphs:

| Intent              | Lucide name          |
|---------------------|----------------------|
| Workout / plan      | `dumbbell`           |
| Schedule / week     | `calendar-days`      |
| Today / session     | `calendar-clock`     |
| Coach               | `user-round-cog`     |
| Client              | `user-round`         |
| Clients list        | `users-round`        |
| Template library    | `library`            |
| Add                 | `plus`               |
| Complete / logged   | `check`              |
| Progress / chart    | `trending-up`        |
| Notes               | `notebook-pen`       |
| Search              | `search`             |
| Settings            | `settings-2`         |
| Sign out            | `log-out`            |

## Custom muscle glyphs

Located in `assets/icons/muscle/*.svg` — one per `MuscleGroup` enum
value (chest, back, shoulders, biceps, triceps, forearms, core,
quadriceps, hamstrings, glutes, calves, fullbody). Same 1.5px stroke
as Lucide. Use them inline or as `<img>` with `filter` to recolor.

## Emoji & unicode

- **Emoji** — not used in product UI. User-generated notes may include
  emoji; don't style them.
- **Unicode** — use `×` for set × rep notation, `·` for meta separators,
  `→` for navigation, `@` for weight (`5 × 5 @ 80kg`). Never `x` for
  multiply, never `-` as a bullet.
