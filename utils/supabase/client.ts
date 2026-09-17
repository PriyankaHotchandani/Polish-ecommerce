import { createBrowserClient } from '@supabase/ssr'
import { getPublicEnv } from '@/utils/publicEnv'

// Deliberately unroutable, so a misconfigured deployment fails fast and visibly
// at the network layer instead of quietly querying some real project.
const UNCONFIGURED_URL = 'https://supabase-not-configured.invalid'
const UNCONFIGURED_KEY = 'supabase-not-configured'

let warned = false

export function createClient() {
    // Resolved via `publicEnv` rather than read straight from `process.env`, so the
    // browser also works when the config only exists as a Cloudflare Worker
    // variable and was therefore never inlined into this bundle at build time.
    const publicEnv = getPublicEnv()

    if (!publicEnv) {
        // Callers build this during render (`useMemo`), including server-side
        // rendering of client components, so throwing here would take down every
        // page. Degrade loudly instead and let each caller surface its own error.
        if (!warned) {
            warned = true
            console.error(
                'Supabase is not configured: NEXT_PUBLIC_SUPABASE_URL / ' +
                'NEXT_PUBLIC_SUPABASE_ANON_KEY are missing. On Cloudflare they must be set ' +
                'as Workers Builds *build* variables as well as Worker variables. ' +
                'See README.md → "Environment variables on Cloudflare".'
            )
        }

        return createBrowserClient(UNCONFIGURED_URL, UNCONFIGURED_KEY)
    }

    return createBrowserClient(
        publicEnv.supabaseUrl,
        publicEnv.supabaseAnonKey
    )
}
