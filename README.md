# Lost & Found client

Next.js App Router, TypeScript, Tailwind CSS 4, Redux Toolkit, React Redux, and Lucide React.

## Development

```sh
npm install
npm run dev
npm run lint
npm run build
```

Open `/` or `/items` to browse live reports and `/items/[id]` for details. Sign-in, registration, and the account page are available at `/login`, `/register`, and `/account`. Reporting is not implemented yet.

## Structure

- `app/`: routes, metadata, root layout, and global base styles.
- `components/ui/`: shared Button, Input, Card, and Badge components.
- `components/layout/`: shared application shell.
- `components/providers/`: client providers mounted by the server root layout.
- `lib/`: application constants, route constants, types, and utilities.
- `store/`: store factory, typed hooks, and Redux slices.
- `styles/`: shared design tokens and component styles.
- `public/`: static assets, including the existing Lost & Found logo.

## Styling conventions

`styles/tokens.css` is the source of truth for colors, spacing, radii, shadows, and container width. Yellow `#FFD100` and ink `#20241F` match the original frontend logo. The source frontend's global stylesheet was unavailable, so supporting colors are documented defaults. Semantic Tailwind utilities such as `bg-primary`, `text-ink`, and `border-surface-border` map to the same tokens.

Barlow (the shared UI font, weights 400–800) and Geist Mono (for code) are loaded through `next/font` and served locally by Next.js. Builds need access to Google Fonts to download them. The Khmer/system fallback stack applies when a suitable font is installed; a Khmer font is not bundled. Use the shared typography scale and components before adding page-specific styles. Use CSS Modules for isolated page styling.

Layouts start with one column, switch to two at 40rem (640px), and three at 64rem (1024px). Containers cap at 72rem. Controls have at least 44px touch targets. Keyboard focus, input errors, disabled/loading states, skip navigation, and reduced motion are supported. The current theme is light only.

## State and icons

Use `useAppDispatch` and `useAppSelector` from `store/hooks.ts` in client components. Add reducers under `store/slices/` and register them in `store/index.ts`. The provider creates one store per mounted application; there is no server-wide singleton. Filters survive client navigation but reset on a full reload. Keep transient component state local and avoid reading Redux from Server Components. RTK Query handles the item and category API cache. No persistent storage is configured.

Import individual icons from `lucide-react`. Decorative icons use `aria-hidden`; icon-only controls must have an accessible label.

References: [Redux with Next.js](https://redux.js.org/usage/nextjs), [Lucide React](https://lucide.dev/guide/react/).

## Validation in this workspace

Lint, route type generation, TypeScript checking, and Redux filter update/reset/store-isolation checks passed. The production build hit a Turbopack CSS-worker process startup error on this Windows environment. Live HTTP integration checks passed for listing, keyword/type/category/status filters, pagination, item details, empty results, and missing-item responses. Browser verification confirmed that the Redux prerender error is resolved and the Lost items filter returns matching results. Full visual and responsive checks remain incomplete.


## Browse & Search Items

The Next.js read-only catalog proxy forwards requests to `API_BASE_URL` (default `http://localhost:8080`). Copy `.env.example` to `.env.local` to change it, then restart the frontend. Browser requests stay on the frontend origin; no CORS changes or credentials are needed for these public endpoints.

Search submits keywords against item names/descriptions. Type, category, and status changes reset pagination. Filters survive client navigation to details and back, but reset on full reload. Results use 12 items per page, newest first. The backend has no location-search parameter; locations are displayed when provided, with a map link for coordinates. Photos use the backend's signed URLs with missing/broken-image fallbacks. Active item queries refresh every five minutes to renew signed URLs.

The detail page shows descriptions, photo selection, category, status, date, brand, color, location, and reporter. Contact, claim, and reporting flows are intentionally deferred.


## Authentication

Email/password authentication uses RTK Query with a same-origin server endpoint at `/api/auth/[action]`. The server calls the existing backend login, register, refresh, logout, and current-user endpoints. Access and refresh tokens are never returned to browser JavaScript or stored in localStorage; they live in HttpOnly, SameSite=Lax cookies scoped to `/api/auth`. Production cookies require HTTPS. Authentication POSTs require an exact matching Origin and JSON content type. Reverse proxies must preserve the public request origin.

The account route renders only a public loading shell until the server validates the session. Anonymous visitors are redirected to sign-in; no private account data is embedded in public HTML. Session validation runs when mounted and every minute while subscribed. Expired access tokens are refreshed server-side. The refresh cookie lasts at most seven days, matching the backend default; the backend remains authoritative about token validity. Web Locks serialize authentication requests across tabs in supported browsers; browsers without Web Locks may require signing in again if two tabs race a single-use refresh token.

Registration follows backend password rules: at least eight Unicode characters and at most 72 UTF-8 bytes. The UI also checks password confirmation. Logout revokes all sessions on the backend, then clears cookies and cached frontend data. A transient logout failure retains the session for retry. Redux DevTools recording is disabled to avoid recording password-bearing mutation arguments. Password reset and Google sign-in are not included in this feature.

Run `npm test` for the authentication contract and security regression suite. It compiles the actual route in memory and simulates backend responses; no accounts are created. Login, registration, refresh, outage, logout, cookie, CSRF, and password-boundary cases are covered. Successful sign-in against a real user account still requires user acceptance testing; no personal credentials were used during development.
