# ZipMart ⚡

**Instant grocery & essentials delivery — at your door in minutes.**

ZipMart is a quick-commerce platform (think 10-minute grocery delivery) built as an **npm-workspaces
monorepo**. It covers the full loop: customers order, nearby stores accept and pack, and delivery
partners bring it over — coordinated in real time.

## Repository structure

```
ZipMart/
├── package.json          # workspace root — scripts + workspace globs
├── package-lock.json     # THE lockfile (one for the whole repo)
├── apps/
│   ├── backend/          # API + realtime server
│   ├── admin-web/        # admin dashboard
│   ├── customer-web/     # customer storefront
│   ├── shop-web/         # store portal
│   └── delivery-web/     # delivery partner portal
├── packages/
│   ├── shared/           # @zipmart/shared  — API/socket config, domain types
│   └── tsconfig/         # @zipmart/tsconfig — shared TS bases
└── archive/              # inactive projects, not part of the workspace
```

| Workspace | Package | Role | Stack | Dev port |
|---|---|---|---|---|
| `apps/backend` | `@zipmart/backend` | API + realtime server (orders, auth, live tracking) | Node.js, Express, Socket.IO, MongoDB | 8000 |
| `apps/admin-web` | `@zipmart/admin-web` | Admin dashboard | React 18 + Vite + Tailwind | 5173 |
| `apps/customer-web` | `@zipmart/customer-web` | Customer web storefront | React 18 + Vite + Tailwind | 5174 |
| `apps/shop-web` | `@zipmart/shop-web` | Store web portal | React 18 + Vite + Tailwind | 5175 |
| `apps/delivery-web` | `@zipmart/delivery-web` | Delivery partner portal | React 18 + Vite + Tailwind | 5176 |
| `packages/shared` | `@zipmart/shared` | Backend URLs, socket factory, domain types | TypeScript | — |
| `packages/tsconfig` | `@zipmart/tsconfig` | Shared `tsconfig` bases | JSON | — |

### `archive/`

Projects that are not part of the active build. They are **excluded from the workspace** (the
globs only cover `apps/*` and `packages/*`), so they are never installed or built. Nothing was
deleted — move a folder back into `apps/` to revive it.

| Folder | Notes |
|---|---|
| `archive/customer-app` | Expo customer app (formerly `ZipMartCustomerAppV2`) |
| `archive/customer-app-v1` | Superseded first-generation Expo customer app |
| `archive/shop-app` | Expo store app |
| `archive/delivery-app` | Expo delivery partner app |
| `archive/_to_delete` | Old CSS from the pre-Tailwind customer web |

## Getting started

Requires **Node.js 20+**. Install once, from the repo root — this installs every workspace and
links `@zipmart/*` packages together:

```bash
npm install
```

Do **not** run `npm install` inside an individual app; that would create a nested lockfile and
break hoisting. To add a dependency to one app, target it from the root:

```bash
npm install axios -w apps/customer-web       # runtime dep for one app
npm install -D vitest -w apps/admin-web      # dev dep for one app
npm install -D prettier -w .                 # tooling for the whole repo
```

### Running

```bash
npm run dev              # backend + all 4 web apps, concurrently
npm run dev:web          # the 4 web apps only (no backend)

npm run dev:backend      # http://localhost:8000
npm run dev:admin        # http://localhost:5173
npm run dev:customer     # http://localhost:5174
npm run dev:shop         # http://localhost:5175
npm run dev:delivery     # http://localhost:5176
```

Ports are pinned in each app's `vite.config.ts` so all four can run at once.

### Other root scripts

| Script | Effect |
|---|---|
| `npm run build` | Builds every workspace that defines a `build` script |
| `npm run lint` | Lints every workspace that defines a `lint` script |
| `npm run typecheck` | Typechecks every workspace |
| `npm run clean` | Removes all `node_modules` and `dist` output |
| `npm start` | Starts the backend in production mode |

Anything can also be run for a single workspace with `-w`:

```bash
npm run build -w apps/admin-web
```

## Configuration

### Web apps

The backend origin is **not** hardcoded. `@zipmart/shared` resolves it once from `VITE_API_URL`
and every app imports it:

```ts
import { API_BASE_URL, SOCKET_URL, createSocket } from "@zipmart/shared";
```

| Export | Value |
|---|---|
| `SERVER_URL` | Backend origin, e.g. `http://localhost:8000` |
| `API_BASE_URL` | REST root — `SERVER_URL` + `/api` |
| `SOCKET_URL` | Socket.IO endpoint (same origin) |
| `apiUrl(path)` | Builds an absolute API URL |
| `createSocket(opts)` | Socket.IO client pointed at the backend |

Set `VITE_API_URL` per app (copy `.env.example` to `.env`) to point at a deployed backend. Unset,
it defaults to `http://localhost:8000`, so local development needs no configuration.

```bash
# apps/customer-web/.env
VITE_API_URL=https://api.zipmart.example
```

Vite inlines env vars at **build time**, so a deployed bundle must be rebuilt to change its backend.

### Backend

`apps/backend/.env` holds Mongo, Firebase, Razorpay and mail credentials. It is git-ignored — get
the values from another maintainer.

## Shared code

`packages/shared` is consumed as TypeScript source (no build step). Edits are picked up
immediately by Vite's dev server and typechecked by each app's `tsc -b`.

- `src/config.ts` — backend URL resolution
- `src/socket.ts` — `createSocket` / `getSharedSocket`
- `src/types.ts` — domain types (`Order`, `Product`, `Shop`, `DeliveryStatus`, …) mirroring the
  Mongoose schemas in `apps/backend/models`. **When a schema changes, update these too.**

Each app still owns its own `src/api.ts` — the four clients have genuinely different endpoints,
auth tokens and response shapes, so they were deliberately left unmerged.

## Notes

- Keep secrets out of git: signing keystores, `.env` files, and server service-account keys are
  ignored by `.gitignore`. Rotate any credentials that were previously committed.
- `apps/backend/invoices/` holds generated PDFs and is git-ignored.
- The archived Expo apps use the managed workflow with development builds; their `android/` and
  `ios/` folders are git-ignored and regenerated by `expo prebuild`.
- This is a **private** repository.

---

_Formerly "BellyBasket." See `CONVERSION_HANDOFF.md` for the bare-React-Native → Expo migration notes._
