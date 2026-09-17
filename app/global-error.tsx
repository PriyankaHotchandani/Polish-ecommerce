'use client'

import { useEffect } from 'react'

// Last-resort boundary: catches failures in the root layout itself, where
// app/error.tsx never gets a chance to render. It replaces <html>, so it can
// rely on nothing from the app shell — no fonts, no providers, no globals.css.
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Unhandled root layout error:', error)
    }, [error])

    return (
        <html lang="en">
            <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#ffffff' }}>
                <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
                    <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#050b25' }}>
                            Something went wrong
                        </h1>
                        <p style={{ marginTop: '12px', fontSize: '0.875rem', lineHeight: 1.6, color: '#4b5563' }}>
                            We couldn&apos;t load this page. This is usually temporary — please try again in a moment.
                        </p>
                        {error.digest && (
                            <p style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#9ca3af' }}>
                                {error.digest}
                            </p>
                        )}
                        <button
                            type="button"
                            onClick={reset}
                            style={{ marginTop: '32px', borderRadius: '6px', border: 'none', background: '#050b25', padding: '10px 20px', fontSize: '0.875rem', color: '#ffffff', cursor: 'pointer' }}
                        >
                            Try again
                        </button>
                    </div>
                </div>
            </body>
        </html>
    )
}
