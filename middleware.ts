import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Handle Supabase auth session refresh (prevents "Invalid Refresh Token" errors)
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value)
                        response.cookies.set(name, value, options as any)
                    })
                },
            },
        }
    )

    // Refresh the session if it exists
    await supabase.auth.getUser()

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}

// NOTE: Internationalization (i18n) with next-intl is configured in next.config.ts
// but requires app structure to be reorganized with [locale] folders.
// See: https://next-intl-docs.vercel.app/docs/getting-started/app-router
// To enable: restructure from app/page.tsx to app/[locale]/page.tsx
