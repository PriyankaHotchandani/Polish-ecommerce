'use client'

import { useState } from 'react'

interface OrderIdDisplayProps {
    orderId: string
}

export default function OrderIdDisplay({ orderId }: OrderIdDisplayProps) {
    const [copied, setCopied] = useState(false)
    const shortId = orderId.slice(0, 8).toUpperCase()

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(orderId)
            setCopied(true)
            setTimeout(() => setCopied(false), 1200)
        } catch (error) {
            console.error('Failed to copy order ID', error)
        }
    }

    return (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
            <span className="text-sm font-mono font-semibold text-slate-700">Order #{shortId}</span>
            <div className="relative">
                <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Copy full order ID"
                    title="Copy full order ID"
                >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                        <rect x="9" y="9" width="10" height="10" rx="2" />
                        <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
                {copied && (
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-md">
                        Copied!
                    </span>
                )}
            </div>
        </div>
    )
}
