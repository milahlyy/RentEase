# Cloudflare Demo Deployment Checklist

Target demo domains:

- Web: `https://rentease.milahly.top`
- API Worker: `https://api-rentease.milahly.top`

Payment and escrow behavior are demo simulations. Do not present this deployment as real Midtrans production escrow.

## 1. Cloudflare Resources

Create or confirm these resources in the same Cloudflare account that manages `milahly.top`:

- D1 database: `rentease`
- R2 bucket: `rentease-assets`
- Worker API custom domain: `api-rentease.milahly.top`
- Web Worker custom domain: `rentease.milahly.top`

The repo config expects:

- API config: `apps/api/wrangler.toml`
- Web config: `apps/web/wrangler.jsonc`
- D1 migrations directory: `packages/db/migrations`

## 2. Secrets And Vars

Set these on the API Worker:

- `JWT_SECRET`: required, strong random value. Never use `change-me`.
- `ALLOWED_ORIGINS`: `https://rentease.milahly.top,http://localhost:3000,http://localhost:3001`

Only set these when their integrations are actually wired:

- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_CLIENT_KEY`
- `RESEND_API_KEY`

Set these on the web Worker build/deploy environment:

- `NEXT_PUBLIC_APP_URL=https://rentease.milahly.top`
- `NEXT_PUBLIC_API_URL=https://api-rentease.milahly.top`

## 3. Remote Database

From `apps/api`, apply migrations to the remote D1 database:

```bash
bunx wrangler d1 migrations apply rentease --remote
```

Seed demo data after migrations. For remote D1, prefer a remote seed/import path owned by the deployment operator. The local `bun seed` command targets local SQLite state and is not a remote production seeder.

Demo accounts expected by `docs/DEMO_FLOW.md`:

- Rendy: `rendy@rentease.local` / `password123`
- Siti: `siti@rentease.local` / `password123`

Rendy is the seeded demo admin through `users.is_admin = 1`.

## 4. Build And Deploy

Install dependencies first:

```bash
bun install
```

Validate packages:

```bash
bun lint
bun typecheck
```

Deploy API:

```bash
cd apps/api
bun run build
bunx wrangler deploy
```

Deploy web:

```bash
cd apps/web
bun run build
bun run deploy
```

## 5. Smoke Test

After deploy:

- Open `https://rentease.milahly.top` and confirm homepage loads.
- Call `https://api-rentease.milahly.top/health` and confirm `{ success: true }`.
- Login as Rendy from the web domain.
- Confirm requests include cookies and do not fail CORS.
- Search `KitchenAid`, open listing detail, and run the demo booking flow.
- Upload one listing or evidence photo and confirm `/assets/*` returns the image.

## 6. Launch Guardrails

- Keep UI copy as `Simulasi Pembayaran Platform` for payment actions.
- Keep WhatsApp unlock tied to owner acceptance plus payment simulation success.
- Do not enable real Midtrans production until callback signature validation and idempotent state transitions are implemented.
- Do not expose private KYC/dispute evidence through public `/assets/*`; current public asset serving is only acceptable for listing/avatar/demo evidence assets.
