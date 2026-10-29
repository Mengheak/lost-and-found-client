# Lost & Found client

Next.js App Router, TypeScript, Tailwind CSS 4, Redux Toolkit, and React Redux.

## Run

```sh
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Copy `.env.example` to `.env.local` if the backend origin differs from `http://localhost:8080`. Tokens stay in HttpOnly cookies; browser requests use same-origin Next.js endpoints. No app tokens are stored in localStorage or exposed to JavaScript. Production requires HTTPS. Authentication and private operations require an exact matching Origin. Reverse proxies must preserve the public origin.

## Features and backend coverage

| Frontend                                        | Backend operations                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/`, `/items`                                   | Browse reports, keywords, type, category, status, brand, color, date range, pagination                                                                 |
| `/items/search`                                 | Semantic search by description, optional category and similarity threshold, up to 20 results                                                           |
| Search by image dialog                          | Photo search for open found reports                                                                                                                    |
| `/items/[id]`                                   | Report details, photos, map coordinates, reward, reporter profile, save, contact, and review                                                           |
| `/items/report`, `/my-reports`                  | Create, edit, delete, mark returned, close, reopen, text/photo search indexing                                                                         |
| `/saved-items`                                  | Paginated shortlist, save and remove reports                                                                                                           |
| `/notifications`                                | Paginated feed, mark one/all read, automatic polling                                                                                                   |
| `/messages`, `/messages/[id]`                   | Start/list conversations, paginated history, text and photo messages, participant profiles and reviews                                                 |
| `/users/[id]`                                   | Public member profile, average rating, paginated received reviews                                                                                      |
| `/login`, `/register`, `/account`               | Email/password and Google sign-in, profile/avatar editing, Google account linking, logout                                                              |
| `/forgot-password`, `/reset-password?token=...` | Request recovery email and reset password using a single-use link                                                                                      |
| `/admin`                                        | Search/page users, full user details, role changes, temporary/permanent bans, revoke bans, paginated moderation history, create/edit/delete categories |

Administration is shown only to administrators and checked in the server proxy as well as the backend. Destructive management actions have confirmation dialogs. Mock/development endpoints and alternative wire formats are not separate product features. Chat uses the existing authenticated REST endpoints and polling; no browser bearer token is required for a WebSocket connection.

## Backend configuration

The Java API, database, and object storage must run. Photo/semantic search and manual indexing also require the backend AI service and indexed reports.

Password recovery requires these backend runtime settings plus SMTP configuration:

```dotenv
PASSWORD_RESET_ENABLED=true
PASSWORD_RESET_FRONTEND_URL=http://localhost:3000/reset-password
```

The backend defaults recovery links to its own static page. Set the frontend URL above to use this application's reset screen. A successful reset revokes existing sessions, clears local session cookies/cache, and asks the user to sign in again. Passwords require at least eight Unicode characters and at most 72 UTF-8 bytes.

Google login and account linking require these backend runtime settings:

```dotenv
GOOGLE_LOGIN_ENABLED=true
GOOGLE_FRONTEND_URL=http://localhost:3000/auth/google/callback
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200
GOOGLE_COOKIE_SECURE=false
GOOGLE_COOKIE_SAME_SITE=lax
```

Keep the Google client ID and secret on the backend. The Google OAuth client callback is `http://localhost:8080/login/oauth2/code/google`. The browser-facing API and frontend must use the same hostname and protocol so Spring's `JSESSIONID` handshake cookie reaches completion; different localhost ports work. Do not mix `localhost` and `127.0.0.1`. Set `GOOGLE_API_PUBLIC_URL` in Next.js if it differs from the internal API origin. For production, use HTTPS, secure cookies, a shared hostname/reverse proxy, and trusted forwarded headers. Linking is explicitly started from Account and retains the current app session after completion.

## Behavior

Filters survive client navigation and reset on reload. Date range fields use local time and send ISO instants. Item/photo queries periodically renew signed image URLs. My reports preserves photos unless replacement/removal is selected; blank numeric/date values retain existing backend values. Zero removes a reward. Item type is immutable.

Saved lists and notification feeds page independently. The header's notification badge counts unread records on the latest page only, since the backend has no total unread-count endpoint. Notifications do not contain target IDs; their links open the relevant messages, reports, or profile screen.

Reviews use the signed-in author and a 1–5 score, with an optional comment of up to 2,000 characters. The backend prevents self-ratings and duplicate reviews for the same recipient/report. Reviews are available from reports and conversations so either participant can review the other. Similarity scores describe relevance, not ownership probability.

Private caches are scoped to the signed-in user and discarded when unused. Web Locks serialize authentication requests across tabs where supported. Failed mutations are never retried automatically; an uncertain result asks the user to refresh before retrying. Backend ownership, participant, administrator, and moderation rules remain authoritative.

## Verification

The contract suite covers authentication, session rotation, CSRF, private operations, administrator guards, allowlisted payloads, moderation conflicts, reviews, recovery, Google linking, search indexing, public profiles, advanced filters, image search, and semantic search. It simulates backend responses and does not modify real accounts.

Type checking and lint pass. Live public API and browser checks verified semantic search results, public profiles/reviews, recovery rendering, and signed-out access to private screens. Authenticated writes and Google/SMTP delivery still need acceptance testing with appropriately configured accounts/services.

The production build reproduces the existing Windows Turbopack CSS-worker process startup failure. Restricted-network builds also cannot download Google Fonts. These environment limitations are independent of the passing TypeScript and contract checks.

## Structure and styling

- `app/`: routes and fixed-origin backend proxies.
- `components/`: shared UI, authentication, items, messaging, and community/admin screens.
- `lib/`: contracts and validation; `feature-actions.ts` strictly maps additional private operations.
- `store/`: per-mounted-app Redux store and RTK Query APIs.
- `styles/`: design tokens and shared responsive styles.

Yellow `#FFD100` and ink `#20241F` follow the logo. Barlow and Geist Mono are loaded through `next/font`. Controls use shared accessible components, keyboard focus styles, loading/error states, and responsive grids. No additional external service or browser token storage is introduced.
