# meienergy1

Award-style relaunch of the legacy `meienergy.de` website on Next.js.

## Stack

- Next.js App Router
- TypeScript
- Vitest
- Legacy content snapshot under `src/data/site-structure.json`
- Optional Sanity integration (project `wa2b6xby`, dataset `production`)

## Scripts

```bash
npm run dev
npm run lint
npm run test:unit
npm run test:integration
npm run build
npm run start
npm run sync:sanity
```

## Local setup

1. Install dependencies:

```bash
npm ci
```

2. Run development server:

```bash
npm run dev
```

3. Open:

`http://localhost:3000`

## Sanity (optional runtime source)

Set environment variables when enabling Sanity reads:

- `NEXT_PUBLIC_SANITY_PROJECT_ID=wa2b6xby`
- `NEXT_PUBLIC_SANITY_DATASET=production`
- `SANITY_API_READ_TOKEN=<token>`
- `SANITY_API_WRITE_TOKEN=<token>` (for `npm run sync:sanity`)

Without these values, the app uses the embedded legacy snapshot data.

### Initial content sync to Sanity

```bash
npm run sync:sanity
```

The script upserts `legacyPage` documents from `src/data/site-structure.json`.
