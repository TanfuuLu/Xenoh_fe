# Xenoh Frontend

Xenoh Frontend is the React web application for the Xenoh training platform. It includes the public website, authenticated user experience, workout planning flows, nutrition views, coach-client workflows, progress tracking, and client-facing interfaces powered by the Xenoh Backend API.

The app is built with Vite and follows a feature-oriented structure so product areas can grow without mixing shared UI, app wiring, and domain-specific code.

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- Zustand
- React Hook Form
- Zod
- Tailwind CSS
- Framer Motion
- Recharts
- Microsoft SignalR client when real-time features are needed

## Repository Structure

```text
Xenoh_fe/
  public/                  Static assets
  src/
    app/                   App shell, routing, providers, startup wiring
    features/              Product features grouped by domain
    shared/                Shared components, layouts, utilities, API helpers
    styles/                Global styling
  package.json
  vite.config.ts
  tsconfig*.json
```

## Prerequisites

- Node.js
- npm
- Running Xenoh Backend API for local API calls

Check installed versions:

```powershell
node --version
npm --version
```

## Environment Setup

Create a local environment file from the public example:

```powershell
Copy-Item .env.example .env.development
```

Set the backend API URL:

```text
VITE_API_URL=https://localhost:7017
```

Use the actual backend URL for your local environment. If the backend is running over HTTP, use the matching HTTP URL.

Do not commit real environment files. `.env.development`, `.env.production`, and other local environment files are ignored by Git.

Important frontend security rule:

- Only expose values that are safe for browsers.
- Any variable prefixed with `VITE_` can be included in the client bundle.
- Keep private API keys, payment secrets, SMTP credentials, JWT signing keys, and AI provider keys on the backend only.

## Install Dependencies

From the frontend repository root:

```powershell
npm install
```

## Run Locally

Start the Vite development server:

```powershell
npm run dev
```

The default local URL is usually:

```text
http://localhost:5173
```

If that port is busy, Vite will print the actual URL in the terminal.

## Build

Create a production build:

```powershell
npm run build
```

Preview the production build locally:

```powershell
npm run preview
```

## Lint

Run ESLint:

```powershell
npm run lint
```

## API Integration

The frontend talks to the backend through the configured `VITE_API_URL`.

Typical flow:

1. User signs in through the frontend.
2. Frontend sends credentials to the backend API.
3. Backend returns authentication data.
4. Frontend stores only the client-safe authentication state required for requests.
5. Axios/TanStack Query call protected API endpoints.
6. Server-side authorization decides whether the current user can access or mutate data.

Keep business rules on the backend. The frontend can validate forms and improve UX, but the backend remains the source of truth for permissions, ownership, payments, and data integrity.

## Feature Development Guidelines

- Put domain-specific UI and logic in `src/features`.
- Put reusable layout, API helpers, controls, and utilities in `src/shared`.
- Keep app-level providers and routing in `src/app`.
- Use typed request and response models where practical.
- Use TanStack Query for server state.
- Use local component state or Zustand for client-only UI state.
- Keep form validation schemas close to the forms that use them.
- Avoid placing secrets or privileged logic in the browser.

## Styling Guidelines

- Prefer existing shared components and design tokens.
- Keep pages responsive across mobile and desktop.
- Avoid one-off styling when a shared component already fits.
- Keep text natural, concise, and product-ready.
- Validate important UI changes in the browser before committing.

## Troubleshooting

If API calls fail locally:

- Confirm the backend API is running.
- Confirm `VITE_API_URL` matches the backend URL.
- Confirm CORS allows the frontend dev origin.
- If using HTTPS locally, confirm the development certificate is trusted.
- Check the browser network tab for the actual request URL and response status.

If authentication fails:

- Confirm the backend JWT settings are configured.
- Confirm the frontend is calling the expected auth endpoint.
- Clear stale browser storage and sign in again.

If styles do not update:

- Restart the Vite dev server.
- Clear browser cache.
- Confirm the edited component is the one used by the current route.

## Security Checklist Before Publishing

Before making the repository public or deploying:

- Confirm no `.env` files are tracked.
- Confirm no API keys or tokens appear in source files.
- Confirm backend-only secrets are not referenced by `VITE_` variables.
- Review API base URLs.
- Review OAuth redirect URLs and allowed origins.
- Build from a clean checkout.

Useful checks:

```powershell
git status --short
git grep -n "sk-" -- .
git grep -n "password" -- .
git grep -n "secret" -- .
```

Manual review is still required. Browser bundles are public by design, so anything shipped to the frontend should be treated as visible to users.

## Deployment Notes

For production:

- Build with the production API URL.
- Serve the `dist` output through the hosting provider.
- Configure backend CORS for the production frontend origin.
- Keep environment variables in the hosting provider's configuration.
- Do not upload local `.env` files.
- Verify sign-in, protected routes, API calls, and payment flows after deployment.

## License

No license has been specified yet. Add a license before publishing if you want others to know how they may use the code.
