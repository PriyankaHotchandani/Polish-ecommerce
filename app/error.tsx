'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useLocaleMessages } from '@/contexts/LocaleContext'

// Route-level error boundary. Without one, any thrown server render surfaces as
// the bare "Application error: a server-side exception has occurred" screen.
//
// The root layout still renders around this boundary, so LocaleContext is
// available here. A failure in the layout itself is caught by global-error.tsx.
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const { messages } = useLocaleMessages()
    const copy = messages.errorPage

    useEffect(() => {
        // Surfaces in `wrangler tail` / the Workers dashboard logs.
        console.error('Unhandled application error:', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-6 py-20">
            <div className="w-full max-w-md text-center">
                <h1 className="text-2xl font-semibold text-[#050b25]">{copy.title}</h1>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{copy.description}</p>
                {error.digest && (
                    <p className="mt-2 font-mono text-xs text-gray-400">{error.digest}</p>
                )}
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={reset}
                        className="w-full rounded-md bg-[#050b25] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90 sm:w-auto"
                    >
                        {copy.retry}
                    </button>
                    <Link
                        href="/"
                        className="w-full rounded-md border border-gray-300 px-5 py-2.5 text-sm font-medium text-[#050b25] transition hover:bg-gray-50 sm:w-auto"
                    >
                        {copy.home}
                    </Link>
                </div>
            </div>
        </div>
    )
}
