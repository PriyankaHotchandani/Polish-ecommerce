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

### Scheduler

Inventory sync is scheduled with GitHub Actions every 5 minutes.

- Workflow file: `.github/workflows/sync-inventory.yml`
- Schedule: `*/5 * * * *`
- Route: `POST /api/sync/inventory`

Required GitHub repository secrets:

- `SYNC_BASE_URL` (example: `https://your-worker.workers.dev`)
- `INVENTORY_SYNC_SECRET` (must match app runtime env var)

The endpoint now uses a database lock (`supplier_sync_locks`) so overlapping runs are skipped safely.

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
