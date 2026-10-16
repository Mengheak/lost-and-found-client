# Lost & Found client

Next.js App Router, TypeScript, Tailwind CSS 4, Redux Toolkit, React Redux, and Lucide React.

## Development

```sh
npm install
npm run dev
npm run lint
npm run build
```

Open `/` for the starter page and `/design-system` for the component gallery and interactive Redux filter example. These are UI foundations; reporting, authentication, and API integration are not implemented yet.

## Structure

- `app/`: routes, metadata, root layout, and global base styles.
- `components/ui/`: shared Button, Input, Card, and Badge components.
- `components/layout/`: shared application shell.
- `components/providers/`: client providers mounted by the server root layout.
- `components/design-system/`: interactive component examples.
- `lib/`: application constants, route constants, types, and utilities.
- `store/`: store factory, typed hooks, and Redux slices.
- `styles/`: shared design tokens and component styles.
- `public/`: static assets, including the existing Lost & Found logo.

## Styling conventions

`styles/tokens.css` is the source of truth for colors, spacing, radii, shadows, and container width. Yellow `#FFD100` and ink `#20241F` match the original frontend logo. The source frontend's global stylesheet was unavailable, so supporting colors are documented defaults. Semantic Tailwind utilities such as `bg-primary`, `text-ink`, and `border-surface-border` map to the same tokens.

Barlow (the shared UI font, weights 400–800) and Geist Mono (for code) are loaded through `next/font` and served locally by Next.js. Builds need access to Google Fonts to download them. The Khmer/system fallback stack applies when a suitable font is installed; a Khmer font is not bundled. Use the shared typography scale and components before adding page-specific styles. Use CSS Modules for isolated page styling.

Layouts start with one column, switch to two at 40rem (640px), and three at 64rem (1024px). Containers cap at 72rem. Controls have at least 44px touch targets. Keyboard focus, input errors, disabled/loading states, skip navigation, and reduced motion are supported. The current theme is light only.

## State and icons

Use `useAppDispatch` and `useAppSelector` from `store/hooks.ts` in client components. Add reducers under `store/slices/` and register them in `store/index.ts`. The provider creates one store per mounted application; there is no server-wide singleton. Filters survive client navigation but reset on a full reload. Keep transient component state local and avoid reading Redux from Server Components. No persistence or backend is configured.

Import individual icons from `lucide-react`. Decorative icons use `aria-hidden`; icon-only controls must have an accessible label.

References: [Redux with Next.js](https://redux.js.org/usage/nextjs), [Lucide React](https://lucide.dev/guide/react/).

## Validation in this workspace

Lint, route type generation, TypeScript checking, and Redux filter update/reset/store-isolation checks passed. The production build hit a Turbopack CSS-worker process startup error on this Windows environment. The development server started, but the browser could not connect to localhost, so visual and browser interaction checks remain unverified.

