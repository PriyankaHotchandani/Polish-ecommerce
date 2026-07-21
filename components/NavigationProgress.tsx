'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function NavigationProgressInner() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [loading, setLoading] = useState(false)
    const safetyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

    const stop = () => {
        setLoading(false)
        document.body.classList.remove('app-navigating')
        if (safetyTimeout.current) {
            clearTimeout(safetyTimeout.current)
            safetyTimeout.current = null
        }
    }

    // A change to the path or query string means the navigation has completed,
    // so clear the loading cue. Resetting synchronously here is intentional.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        stop()
    }, [pathname, searchParams])

    useEffect(() => {
        const start = () => {
            setLoading(true)
            document.body.classList.add('app-navigating')
            if (safetyTimeout.current) {
                clearTimeout(safetyTimeout.current)
            }
            // Fail-safe: clear the cue if a navigation is cancelled and never resolves.
            safetyTimeout.current = setTimeout(stop, 10000)
        }

        const onClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) return
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

            const anchor = (event.target as HTMLElement | null)?.closest('a')
            if (!anchor) return

            const href = anchor.getAttribute('href')
            if (!href) return

            const target = anchor.getAttribute('target')
            if (target && target !== '_self') return
            if (anchor.hasAttribute('download')) return

            let url: URL
            try {
                url = new URL(href, window.location.href)
            } catch {
                return
            }

            if (url.origin !== window.location.origin) return
            // Same page (or hash-only) — no navigation to indicate.
            if (url.pathname === window.location.pathname && url.search === window.location.search) return

            start()
        }

        document.addEventListener('click', onClick, true)
        window.addEventListener('popstate', start)

        return () => {
            document.removeEventListener('click', onClick, true)
            window.removeEventListener('popstate', start)
            stop()
        }
    }, [])

    if (!loading) return null

    return (
        <div className="app-nav-progress" aria-hidden="true">
            <div className="app-nav-progress-bar" />
        </div>
    )
}

export default function NavigationProgress() {
    // useSearchParams requires a Suspense boundary.
    return (
        <Suspense fallback={null}>
            <NavigationProgressInner />
        </Suspense>
    )
}
