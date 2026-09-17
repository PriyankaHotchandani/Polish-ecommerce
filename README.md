This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Cloudflare Workers

This app runs on Cloudflare Workers via the [OpenNext](https://opennext.js.org/cloudflare) adapter.

From a local machine: `npx wrangler login` then `npm run deploy`.

For the Cloudflare **Workers Builds** Git integration, set:

- **Build command:** `npm run build:cf`  (runs `opennextjs-cloudflare build` → `.open-next/`)
- **Deploy command:** `npx wrangler deploy`

The deploy command alone is not enough — without the build command the deploy
fails with `Could not find compiled Open Next config`.

### Environment variables on Cloudflare

This is the one thing that does **not** carry over from Vercel, and it silently
breaks the database if missed.

Next.js replaces every `process.env.NEXT_PUBLIC_*` expression with a literal
string at **build** time. Vercel injects the project's environment variables into
the build automatically, so one list covered everything. Cloudflare has two
separate places, and only one of them is visible to `next build`:

| Where | Cloudflare dashboard location | Visible to |
| --- | --- | --- |
| **Build** variables | Workers &rarr; your Worker &rarr; **Settings &rarr; Build** &rarr; *Variables and Secrets* | `next build` (inlined into the browser bundle) |
| **Runtime** variables & secrets | Workers &rarr; your Worker &rarr; **Settings &rarr; Variables and Secrets** | the Worker on every request (`process.env`) |

Setting a variable in only one place is what produces "no products load" plus
`Application error: a server-side exception has occurred` on every page.

**Set the two public values in _both_ places:**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mdwbxwsrbqxyefbuwstr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_hosted_anon_key
```

**Set the server-only secrets as _runtime_ variables** (they are never inlined,
so they do not belong in the build environment):

```bash
SUPABASE_SERVICE_ROLE_KEY=your_hosted_service_role_key
INVENTORY_SYNC_SECRET=your_random_secret_value
CRON_SECRET=same_value_as_INVENTORY_SYNC_SECRET
RESEND_API_KEY=your_resend_key          # transactional e-mail
NEXT_PUBLIC_SITE_URL=https://your-domain           # auth e-mail redirect links
```

Optional, all with working defaults: `DEEPL_API_KEY`, `DEEPL_API_URL`,
`RESEND_FROM_EMAIL`, `RESEND_REPLY_TO`, `RESEND_BCC`, the `SUPPLIER_*_FEED_URL`
overrides, and the `COMPANY_*` / `BANK_*` invoice details.

After changing **build** variables you must trigger a new deployment — the values
are baked into the bundle, so a restart alone does not pick them up.

`utils/publicEnv.ts` falls back to the runtime environment when a public value
was missing at build time, and the server passes it to the browser, so a
runtime-only configuration still works. Setting both is still recommended: it
keeps the values in the bundle and avoids the extra inline script.

Also update, outside Cloudflare:

- **Supabase &rarr; Authentication &rarr; URL Configuration**: set *Site URL* to the new
  Cloudflare domain and add it to *Redirect URLs*, otherwise confirmation and
  password-reset links still point at the Vercel domain.
- **GitHub repository secret `SYNC_BASE_URL`**: point it at the Cloudflare
  domain so the 5-minute inventory sync keeps running.

### Local development against the Worker runtime

`wrangler dev` does not read `.env`. Put the same values in `.dev.vars`
(gitignored) to exercise the Worker locally:

```bash
npm run preview
```

## Automated Source-of-Truth Product Sync

The application now synchronizes products using `public/dane.xlsx` as the source-of-truth mapping file.

The workbook drives feed endpoints and attribute mapping:

- Nokaut XML feed (product core data)
- Stock feed (`stany.txt`) for `STAN`, `NETTO`, `BRUTTO`
- Info feed (`info.txt`) for `ENA`, `CN`, `WAGA`

Sync updates categories and products by SKU, including the exact mapped source columns stored in the database:

- `source_co`, `source_nazwa`, `source_opis`, `source_url_produktu`
- `source_zdjecie_glowne`, `source_zdjecia_produktu_pozostale`
- `source_sku_nokaut`, `source_sku_stan`, `source_sku_info`
- `source_stan`, `source_netto`, `source_brutto`
- `source_ena`, `source_cn`, `source_waga`

It also writes translation-ready fields:

- `products.title_translations`
- `products.description_translations`
- `categories.name_translations`

True English translations are generated during sync using:

- DeepL if `DEEPL_API_KEY` is set.
- A free fallback translator (no card/no key) if `DEEPL_API_KEY` is not set.

### Required Environment Variables

Add these variables in your deployment environment:

```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
INVENTORY_SYNC_SECRET=your_random_secret_value
```

Optional (higher-quality translation provider):

```bash
DEEPL_API_KEY=your_deepl_api_key
```

Hosted Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://mdwbxwsrbqxyefbuwstr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_hosted_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_hosted_service_role_key
```

Optional overrides (defaults already point to the provided links):

```bash
SUPPLIER_NOKAUT_FEED_URL=https://sklep757254.shoparena.pl/console/integration/execute/name/Nokaut
SUPPLIER_STOCK_FEED_URL=https://vpn.gwalento.ovh/stany.txt
SUPPLIER_INFO_FEED_URL=https://vpn.gwalento.ovh/b2b/info.txt
SUPPLIER_E24_FEED_URL=https://e24files.com/saly-prajo-prod/offer/product/e0b71484-450a-43f4-ae3d-616e8f182905.xml
```

### Scheduler (Cloudflare Cron Triggers)

Inventory sync runs on Cloudflare Cron Triggers, declared in `wrangler.jsonc`:

| Cron | Mode | What it does |
| --- | --- | --- |
| `* * * * *` | `inventory` | Quantity/price refresh from the stock, info and E24 feeds |
| `15 2 * * *` | `full` | Full catalogue re-import: products, categories, translations |

One minute is the shortest interval Cloudflare allows, and Cron Triggers are
included on the Workers Free plan. Raise the first entry to `*/5 * * * *` if the
supplier feeds start rate-limiting — every run refetches them.

How it is wired:

- `worker/index.mjs` is the Worker entrypoint. It re-exports the Worker generated
  by `opennextjs-cloudflare build` and adds the `scheduled()` handler.
- `scheduled()` picks the mode from the cron expression (`FULL_SYNC_CRONS` must
  match the `15 2 * * *` entry in `wrangler.jsonc`), then calls
  `POST /api/sync/inventory` **in-process** — no public round trip, so it costs no
  subrequest and does not depend on the site's hostname.
- It authenticates with `INVENTORY_SYNC_SECRET` (or `CRON_SECRET`) from the
  Worker's runtime variables. Without one the run logs an error and stops.
- Overlapping runs are skipped by the `supplier_sync_locks` row lock, so a slow
  run cannot pile up behind the next tick.

Cron runs and their logs appear under **Workers → your Worker → Logs**, and the
schedule under **Settings → Triggers → Cron Triggers**. Follow them live with
`npx wrangler tail`.

Test the schedule locally without waiting for the clock:

```bash
npx wrangler dev --test-scheduled
curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"
```

#### Workers plan limits

A Worker invocation on the **Free** plan gets 10 ms CPU and 50 subrequests; the
**Paid** plan gets 30 s CPU (cron: 30 s under an hour interval) and 1,000+
subrequests. The `inventory` sync now issues roughly five subrequests per run
(feeds, one lock call, one `sync_supplier_inventory` RPC, one
`sync_supplier_promotional_flags` RPC, one log call), so the subrequest ceiling is
not a concern. CPU is the one to watch: parsing the Nokaut and E24 XML catalogues
can exceed 10 ms, which surfaces as **error 1102 "Worker exceeded CPU time limit"**
in the logs. If that happens on the free plan, either move to Workers Paid or drop
the `inventory` cron to a longer interval and let the nightly `full` run do the
catalogue work.

#### GitHub Actions (manual backup)

`.github/workflows/sync-inventory.yml` still calls the same endpoint but its
schedule is commented out, so the Cloudflare cron is the only scheduler. Run it by
hand from the Actions tab if the Worker cron is ever disabled. It needs the repo
secrets `SYNC_BASE_URL` (the Cloudflare domain) and `INVENTORY_SYNC_SECRET`.

### Manual Trigger

You can also run it manually:

```bash
curl -X POST https://your-domain.com/api/sync/inventory \
	-H "Authorization: Bearer $INVENTORY_SYNC_SECRET"
```

## Applying Supabase Migrations

The repo uses SQL migrations under `supabase/migrations/`.

If your Supabase project is linked locally, push migrations with:

```bash
npx supabase login
npx supabase link --project-ref mdwbxwsrbqxyefbuwstr
npx supabase db push
```

If the CLI still reports that no access token is provided, create a personal access token in the Supabase dashboard and set it before running `db push`:

```bash
export SUPABASE_ACCESS_TOKEN=your_supabase_access_token
npx supabase db push
```

If you are using the local Supabase stack, apply the SQL directly to the database container instead:

```bash
cat supabase/migrations/20260418113000_add_source_of_truth_product_fields.sql | docker exec -i supabase_db_polish-ecommerce psql -U postgres -d postgres
```

Repeat for any other pending migration files in timestamp order.

## Verify Excel-to-DB Mapping

After running sync, validate that product source columns match feed values:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url \
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key \
node scripts/verify-sync.mjs
```

The script checks a sample of SKUs against source feeds and validates mapped fields such as:

- `source_nazwa`, `source_url_produktu`, `source_zdjecie_glowne`, `source_co`
- `source_stan`, `source_netto`, `source_brutto`
- `source_ena`, `source_cn`, `source_waga`
- `inventory_count`, `price_wholesale`, `price_retail`

For quick manual spot checks in Supabase SQL editor:

```sql
select
	sku,
	source_nazwa,
	source_url_produktu,
	source_stan,
	source_netto,
	source_brutto,
	source_ena,
	source_cn,
	source_waga,
	inventory_count,
	price_wholesale,
	price_retail
from products
where sku in ('KD6502', 'KD109', 'KD130')
order by sku;
```
