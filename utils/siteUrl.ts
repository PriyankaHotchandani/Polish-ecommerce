// Resolves the canonical site origin used for auth e-mail redirect links so the
// Supabase confirmation e-mail never points at localhost in production.
//
// Priority: explicit NEXT_PUBLIC_SITE_URL → the origin of the request currently
// being served (set by the OpenNext worker) → the Vercel-provided URL, kept for
// preview deployments → the current browser origin (client only) → empty string.
//
// NOTE: NEXT_PUBLIC_SITE_URL is read through a computed key as well as directly,
// so it still resolves when it is configured as a Cloudflare Worker variable
// rather than a Workers Builds *build* variable. See utils/publicEnv.ts.
const INLINED_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL
const INLINED_VERCEL_URL = process.env.NEXT_PUBLIC_VERCEL_URL

function readRuntimeEnv(name: string): string | undefined {
    if (typeof process === 'undefined' || !process.env) {
        return undefined
    }

    const env = process.env as Record<string, string | undefined>
    return env[name]
}

function normalize(value: string): string {
    const withProtocol = value.startsWith('http') ? value : `https://${value}`
    return withProtocol.replace(/\/+$/, '')
}

export function getSiteUrl(): string {
    const explicit = INLINED_SITE_URL || readRuntimeEnv('NEXT_PUBLIC_SITE_URL') || readRuntimeEnv('SITE_URL')
    if (explicit) {
        return normalize(explicit)
    }

    // Set per-request by the OpenNext Cloudflare worker, so redirect links point at
    // whichever hostname actually served the request (custom domain or workers.dev).
    const workerOrigin = readRuntimeEnv('__NEXT_PRIVATE_ORIGIN')
    if (workerOrigin) {
        return normalize(workerOrigin)
    }

    const vercel = INLINED_VERCEL_URL || readRuntimeEnv('NEXT_PUBLIC_VERCEL_URL')
    if (vercel) {
        return normalize(vercel)
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, '')
    }

    return ''
}
