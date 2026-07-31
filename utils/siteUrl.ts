// Resolves the canonical site origin used for auth e-mail redirect links so the
// Supabase confirmation e-mail never points at localhost in production.
//
// Priority: explicit NEXT_PUBLIC_SITE_URL → Vercel-provided URL → the current
// browser origin (client only) → empty string.
export function getSiteUrl(): string {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL
    if (explicit) {
        return explicit.replace(/\/+$/, '')
    }

    const vercel = process.env.NEXT_PUBLIC_VERCEL_URL
    if (vercel) {
        const withProtocol = vercel.startsWith('http') ? vercel : `https://${vercel}`
        return withProtocol.replace(/\/+$/, '')
    }

    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin.replace(/\/+$/, '')
    }

    return ''
}
