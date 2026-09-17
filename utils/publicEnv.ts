// Resolution of the *public* Supabase configuration in a way that works on both
// Vercel and Cloudflare Workers.
//
// Next.js replaces every `process.env.NEXT_PUBLIC_*` expression with a string
// literal at **build** time — in the browser bundle *and* in the server bundle.
// Vercel injects the project's dashboard environment variables into the build
// automatically, so this detail stayed invisible there. Cloudflare keeps the two
// environments separate: Workers Builds variables are what `next build` sees,
// while Worker "Variables and Secrets" only exist at request time. A value that
// is configured *only* at runtime therefore never reaches the bundle, the
// browser falls back to a placeholder project, and server renders blow up.
//
// Values are resolved in this order:
//   1. the build-time inlined value (set as a Workers Builds variable),
//   2. the runtime environment — OpenNext copies the Worker's vars and secrets
//      into `process.env` on each request (server only),
//   3. the config the server serialized into the HTML document (browser only).
//
// Both values are public by design: the URL is a hostname and the anon key is
// the key Supabase expects to ship to browsers, guarded by row level security.

export interface PublicEnv {
    supabaseUrl: string
    supabaseAnonKey: string
}

export const PUBLIC_ENV_WINDOW_KEY = '__PUBLIC_ENV__'

declare global {
    var __PUBLIC_ENV__: Partial<PublicEnv> | undefined
}

// Build-time inlined values. When the variable is absent from the build
// environment Next leaves the lookup intact in the server bundle, so on the
// server this already resolves at runtime; in the browser bundle it is folded
// to `undefined` and step 3 takes over.
const INLINED_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const INLINED_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Reads through a computed key so the build-time inliner cannot statically
// match — and therefore cannot freeze — the expression.
function readRuntimeEnv(name: string): string | undefined {
    if (typeof process === 'undefined' || !process.env) {
        return undefined
    }

    const env = process.env as Record<string, string | undefined>
    return env[name]
}

function readInjectedEnv(key: keyof PublicEnv): string | undefined {
    if (typeof window === 'undefined') {
        return undefined
    }

    return window[PUBLIC_ENV_WINDOW_KEY]?.[key]
}

function firstNonEmpty(...values: (string | undefined)[]): string | undefined {
    for (const value of values) {
        if (typeof value === 'string' && value.trim() !== '') {
            return value.trim()
        }
    }

    return undefined
}

export function getSupabaseUrl(): string | undefined {
    const url = firstNonEmpty(
        INLINED_SUPABASE_URL,
        readRuntimeEnv('NEXT_PUBLIC_SUPABASE_URL'),
        readRuntimeEnv('SUPABASE_URL'),
        readInjectedEnv('supabaseUrl'),
    )

    // Trailing slashes break the string-concatenated Storage/REST URLs below.
    return url?.replace(/\/+$/, '')
}

export function getSupabaseAnonKey(): string | undefined {
    return firstNonEmpty(
        INLINED_SUPABASE_ANON_KEY,
        readRuntimeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        readRuntimeEnv('SUPABASE_ANON_KEY'),
        readInjectedEnv('supabaseAnonKey'),
    )
}

/** True when both public values resolved, i.e. Supabase can be reached. */
export function hasPublicSupabaseConfig(): boolean {
    return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}

/** The public config, or `null` when it is not configured on this host. */
export function getPublicEnv(): PublicEnv | null {
    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()

    if (!supabaseUrl || !supabaseAnonKey) {
        return null
    }

    return { supabaseUrl, supabaseAnonKey }
}

/**
 * The public config, or a descriptive throw. Preferred over passing `undefined`
 * into the Supabase SDK, which fails much later with an opaque message.
 */
export function requirePublicEnv(): PublicEnv {
    const env = getPublicEnv()

    if (!env) {
        const missing = [
            getSupabaseUrl() ? null : 'NEXT_PUBLIC_SUPABASE_URL',
            getSupabaseAnonKey() ? null : 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        ].filter(Boolean).join(', ')

        throw new Error(
            `Missing Supabase configuration: ${missing}. On Cloudflare these must be set ` +
            `as Workers Builds *build* variables (so they are inlined into the browser ` +
            `bundle) as well as Worker variables (used at request time). See README.md ` +
            `→ "Environment variables on Cloudflare".`
        )
    }

    return env
}

/** Base URL of the public "media" Storage bucket, or `''` when unconfigured. */
export function getMediaBaseUrl(): string {
    const supabaseUrl = getSupabaseUrl()
    return supabaseUrl ? `${supabaseUrl}/storage/v1/object/public/media` : ''
}
