// Cloudflare Worker entrypoint.
//
// Wraps the Worker that `opennextjs-cloudflare build` generates (which only has a
// `fetch` handler) and adds a `scheduled` handler so Cloudflare Cron Triggers can
// drive the supplier inventory sync. This replaces the GitHub Actions schedule,
// which called the same endpoint over the public internet.
//
// The cron invokes the Next.js route in-process by handing a synthetic Request to
// the generated worker's own fetch handler. That keeps the sync logic in one place
// (app/api/sync/inventory/route.ts) and avoids a public round trip, so it does not
// consume a subrequest or depend on the site's own hostname resolving.

import openNextWorker from '../.open-next/worker.js'

// Durable Object classes the generated worker exports; they must remain exported
// from the Worker's entry module or wrangler cannot resolve the bindings.
export { DOQueueHandler } from '../.open-next/worker.js'
export { DOShardedTagCache } from '../.open-next/worker.js'
export { BucketCachePurge } from '../.open-next/worker.js'

// Cron expression -> sync mode. `full` re-imports the whole catalogue (products,
// categories, translations) and is far heavier, so it runs nightly; everything
// else is a quantity/price refresh. Keep in sync with `triggers.crons` in
// wrangler.jsonc: an expression missing here falls back to the light sync.
const FULL_SYNC_CRONS = new Set(['15 2 * * *'])

function resolveBaseUrl(env) {
    const configured = env.SYNC_BASE_URL || env.NEXT_PUBLIC_SITE_URL

    if (configured) {
        const withProtocol = configured.startsWith('http') ? configured : `https://${configured}`
        return withProtocol.replace(/\/+$/, '')
    }

    // The request never leaves the Worker, so the host only has to be a valid
    // absolute URL for Next's router to parse.
    return 'https://inventory-sync.internal'
}

async function runScheduledSync(event, env, ctx) {
    const secret = env.INVENTORY_SYNC_SECRET || env.CRON_SECRET

    if (!secret) {
        console.error(
            'Scheduled inventory sync skipped: neither INVENTORY_SYNC_SECRET nor CRON_SECRET ' +
            'is set on the Worker. Add it under Settings -> Variables and Secrets.'
        )
        return
    }

    const mode = FULL_SYNC_CRONS.has(event.cron) ? 'full' : 'inventory'
    const url = `${resolveBaseUrl(env)}/api/sync/inventory?mode=${mode}`
    const startedAt = Date.now()

    const request = new Request(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
            'User-Agent': 'cloudflare-cron/inventory-sync',
        },
    })

    try {
        const response = await openNextWorker.fetch(request, env, ctx)
        const body = await response.text()
        const durationMs = Date.now() - startedAt

        if (!response.ok) {
            // Thrown so the run is recorded as failed in the Cron Triggers dashboard.
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 500)}`)
        }

        console.log(
            `Inventory sync (${mode}) via cron "${event.cron}" succeeded in ${durationMs}ms: ${body.slice(0, 500)}`
        )
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Inventory sync (${mode}) via cron "${event.cron}" failed: ${message}`)
        throw error
    }
}

export default {
    fetch(request, env, ctx) {
        return openNextWorker.fetch(request, env, ctx)
    },

    async scheduled(event, env, ctx) {
        // Awaited rather than passed to waitUntil so Cloudflare records the run's
        // real outcome and duration against the Cron Trigger.
        await runScheduledSync(event, env, ctx)
    },
}
