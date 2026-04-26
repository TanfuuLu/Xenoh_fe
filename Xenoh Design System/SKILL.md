---
name: xenoh-design
description: Use this skill to generate well-branded interfaces and assets for Xenoh — a fitness web application for workout planning and coach↔client management — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

Start here:

- `README.md` — product context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — the single source of truth for colors, typography, spacing, radii, shadows, and motion tokens. Drop this on every page before any other stylesheet.
- `fonts/` — **Namdhinggo** (the display serif) in five weights. SIL OFL.
- `assets/` — logo mark, wordmark (light + dark), 12 muscle-group glyphs, and a warm grain texture.
- `ui_kits/web_app/` — the authenticated product. Includes a Shell (sidebar + top bar), primitives, and four screens (dashboard, session, plan editor, coach/clients). Open `index.html` to see it working.
- `ui_kits/marketing/` — the public-facing site. Hero + features + pricing + testimonial + CTA + footer.
- `preview/` — atomic design-system cards (colors, type, spacing, components). Good for copy-pasting small snippets.

**If creating visual artifacts** (slides, mocks, throwaway prototypes, etc.), copy the assets out of this skill into your working folder and write static HTML files for the user to view. Start every page with:

```html
<link rel="stylesheet" href="<path-to>/colors_and_type.css"/>
```

Then pull components from `ui_kits/` or patterns from `preview/`. Pair Namdhinggo (`--font-display`) with Geist (`--font-sans`). Use Clay-700 (`--accent`) for primary action, Sage-500 (`--accent-2`) for success/logged states, Sand (`--bg-4`) for hero surfaces. Never introduce cool greys, true blacks, or pure whites — everything skews warm.

**If working on production code**, you can copy the `assets/` and read the rules in `README.md` to become an expert in designing with this brand.

**If the user invokes this skill without any other guidance**, ask them what they want to build or design (a landing page, an app screen, a slide, an email, etc.), ask 2–4 questions about audience, tone, length, and variations, and act as an expert designer who outputs HTML artifacts or production code depending on the need.

**Rules of thumb for Xenoh:**

- Sentence case everywhere. No emoji in product UI. No exclamation marks.
- Numbers are specific and tabular — `5 × 5 @ 80 kg`, never "a few heavy sets".
- Warm tones only. No cool greys, no pure black, no gradient buttons.
- Motion is calm — fades + small translates, never bouncy springs.
- Iconography is Lucide (1.5px stroke) plus the custom muscle glyphs in `assets/icons/muscle/`.
