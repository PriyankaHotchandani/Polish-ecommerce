import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getPublicEnv } from '@/utils/publicEnv'

const SUPPORTED_LOCALES = ['en', 'pl'] as const

function resolveLocaleFromHeader(request: NextRequest): 'en' | 'pl' {
    const accepted = request.headers.get('accept-language')?.toLowerCase() || ''
    return accepted.includes('pl') ? 'pl' : 'en'
}

function extractLocaleFromPath(pathname: string): 'en' | 'pl' | null {
    const segment = pathname.split('/').filter(Boolean)[0]
    if (segment === 'en' || segment === 'pl') {
        return segment
    }

    return null
}

export async function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname
    const prefixedLocale = extractLocaleFromPath(pathname)

    if (prefixedLocale) {
        const targetPath = pathname.replace(`/${prefixedLocale}`, '') || '/'
        const redirectUrl = new URL(targetPath, request.url)
        redirectUrl.search = request.nextUrl.search

        const response = NextResponse.redirect(redirectUrl)
        response.cookies.set('locale', prefixedLocale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
        })

        return response
    }

    const response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const cookieLocale = request.cookies.get('locale')?.value
    const resolvedLocale = SUPPORTED_LOCALES.includes(cookieLocale as 'en' | 'pl')
        ? (cookieLocale as 'en' | 'pl')
        : resolveLocaleFromHeader(request)

    if (cookieLocale !== resolvedLocale) {
        response.cookies.set('locale', resolvedLocale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax',
        })
    }

    // If Supabase public env vars are missing, skip session refresh instead of crashing middleware.
    const publicEnv = getPublicEnv()
    if (!publicEnv) {
        return response
    }

    const hasSupabaseAuthCookie = request.cookies.getAll().some(({ name }) =>
        name.startsWith('sb-') && name.includes('auth-token')
    )

    if (!hasSupabaseAuthCookie) {
        return response
    }

    // Handle Supabase auth session refresh (prevents "Invalid Refresh Token" errors)
    const supabase = createServerClient(
        publicEnv.supabaseUrl,
        publicEnv.supabaseAnonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    // Refresh the session if it exists, but never fail request handling for auth refresh errors.
    try {
        await supabase.auth.getUser()
    } catch {
        return response
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}

// NOTE: Internationalization (i18n) with next-intl is configured in next.config.ts
// but requires app structure to be reorganized with [locale] folders.
// See: https://next-intl-docs.vercel.app/docs/getting-started/app-router
// To enable: restructure from app/page.tsx to app/[locale]/page.tsx
