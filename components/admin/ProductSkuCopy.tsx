'use client'

import { useState } from 'react'

interface ProductSkuCopyProps {
    sku: string
}

export default function ProductSkuCopy({ sku }: ProductSkuCopyProps) {
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(sku)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy SKU', error)
        }
    }

    return (
        <div className="relative inline-flex">
            <button
                type="button"
                onClick={handleCopy}
                className="font-mono text-sm text-slate-700 underline decoration-dotted underline-offset-4 transition-colors hover:text-[#163579]"
                title="Copy SKU"
            >
                {sku}
            </button>
            {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white shadow-md">
                    Copied!
                </span>
            )}
        </div>
    )
}
