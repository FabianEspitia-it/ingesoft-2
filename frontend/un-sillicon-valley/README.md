# UN Silicon Valley — Frontend

Web client for the **UN Silicon Valley** platform, a space for entrepreneurship
at the Universidad Nacional de Colombia (UNAL). It lets members read and publish
entries, browse success stories and projects, comment, and react. It talks to
the [backend API](../../backend) over HTTP.

## Tech stack

| Concern         | Technology                                             |
| --------------- | ------------------------------------------------------ |
| Framework       | [Next.js 16](https://nextjs.org/) (App Router)         |
| UI library      | [React 19](https://react.dev/)                         |
| Language        | TypeScript 5                                           |
| Styling         | [Tailwind CSS 4](https://tailwindcss.com/)             |
| Rich-text editor| [Tiptap 3](https://tiptap.dev/) + `tiptap-markdown`    |
| Icons           | [Remix Icon](https://remixicon.com/)                   |
| Bundler         | Turbopack                                              |
| Lint / format   | [Biome](https://biomejs.dev/)                          |
| Package manager | pnpm                                                   |

## Architecture

The app uses the **Next.js App Router**, so routes are defined by the folder
structure under `app/`. Server Components fetch data directly from the API;
Client Components handle interactivity (forms, editor, reactions).

```
app/                     # App Router routes (each folder = a route segment)
├── layout.tsx           # Root layout
├── page.tsx             # Home: recent entries
├── globals.css          # Global styles / Tailwind layer
├── login/               # Login
├── register/            # Sign up
├── auth/                # Auth flows (e.g. email verification)
├── entries/             # Entry list, detail ([id]) and creation (new)
├── success-stories/      # Success stories
├── featured/            # Featured content
├── search/              # Search
├── user/                # User profile ([id]) and profile edit
├── admin/               # Admin-only views
└── themes/              # Theme showcase

components/              # Reusable UI, grouped by domain
├── entries/             # Entry cards, EntryForm, editor, etc.
├── comments/            # Comment list and form
├── projects/            # Project components
├── user/                # Profile components
├── admin/ · auth/ · search/
├── layout/              # Header, footer, shell
├── views/               # Larger composed views
└── icons/               # Icon components

lib/
├── api.ts               # Typed API client (base URL from NEXT_PUBLIC_API_URL)
└── types/               # Shared TypeScript types
```

Key notes:

- **Server-first data fetching** — pages fetch from the API on the server with
  `no-store` so content is always fresh.
- **Single API client** — all requests go through `lib/api.ts`, which reads the
  backend base URL from `NEXT_PUBLIC_API_URL`.
- **Remote images** — cover images are served from Google Cloud Storage; the
  allowed remote hosts are configured in `next.config.ts`
  (`storage.googleapis.com`, `**.googleusercontent.com`).

## Running for development

### Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/installation)
- A running instance of the [backend API](../../backend)

### 1. Install dependencies

```bash
cd frontend/un-sillicon-valley
pnpm install
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
```

Set the backend URL:

| Variable              | Description                          | Example                   |
| --------------------- | ------------------------------------ | ------------------------- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend API          | `http://localhost:9999`   |

### 3. Run the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Lint and format

```bash
pnpm lint     # biome check
pnpm format   # biome format --write
pnpm check    # biome check --write
```

### Production build

```bash
pnpm build    # build
pnpm start    # serve the production build
```

## Deployment

The frontend is **deployed automatically to [Vercel](https://vercel.com/)** on
every commit to the `main` branch.

On push to `main`, Vercel:

1. Installs dependencies and runs `pnpm build`.
2. Builds an optimized production bundle (App Router, Turbopack).
3. Promotes the successful build to the production deployment.

Pull requests get their own **preview deployments** automatically. The only
required configuration is the `NEXT_PUBLIC_API_URL` environment variable, set in
the Vercel project settings to point at the deployed Cloud Run backend.
