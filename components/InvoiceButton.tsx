'use client'

import { useState } from 'react'

interface InvoiceButtonProps {
    orderId: string
    existingInvoiceUrl?: string | null
    existingInvoiceNumber?: string | null
    buttonText?: string
    className?: string
    generateButtonText?: string
    generatingText?: string
    downloadingText?: string
    invoiceNumberLabel?: string
}

export default function InvoiceButton({
    orderId: _orderId,
    existingInvoiceUrl,
    existingInvoiceNumber,
    buttonText,
    className,
    generateButtonText,
    generatingText,
    downloadingText,
    invoiceNumberLabel,
}: InvoiceButtonProps) {
    const [downloading, setDownloading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [invoiceUrl] = useState(existingInvoiceUrl)
    const [invoiceNumber] = useState(existingInvoiceNumber)

    const handleDownloadInvoice = async () => {
        if (invoiceUrl) {
            setDownloading(true)
            await new Promise((resolve) => setTimeout(resolve, 1000))
            window.open(invoiceUrl, '_blank')
            setDownloading(false)
        }
    }

    if (invoiceUrl) {
        return (
            <div className="space-y-2">
                <button
                    onClick={handleDownloadInvoice}
                    disabled={downloading}
                    className={
                        className ||
                        'flex items-center gap-2 px-4 py-2 bg-[#163579] text-white rounded-md shadow-sm hover:bg-[#102a63] transition-all duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed'
                    }
                >
                    {downloading ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                                <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                ></circle>
                                <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                ></path>
                            </svg>
                            {downloadingText || 'Downloading...'}
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            {buttonText || `Download Invoice ${invoiceNumber || ''}`}
                        </>
                    )}
                </button>
                {invoiceNumber && (
                    <p className="text-sm text-gray-600">{invoiceNumberLabel || 'Invoice Number'}: {invoiceNumber}</p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <button
                type="button"
                disabled
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-md border border-gray-200 font-medium cursor-not-allowed"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                </svg>
                {generateButtonText || buttonText || 'Invoice pending admin upload'}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}
