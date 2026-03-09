'use client'

import { useState } from 'react'

interface InvoiceButtonProps {
    orderId: string
    existingInvoiceUrl?: string | null
    existingInvoiceNumber?: string | null
    buttonText?: string
    className?: string
}

export default function InvoiceButton({
    orderId,
    existingInvoiceUrl,
    existingInvoiceNumber,
    buttonText,
    className,
}: InvoiceButtonProps) {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [invoiceUrl, setInvoiceUrl] = useState(existingInvoiceUrl)
    const [invoiceNumber, setInvoiceNumber] = useState(existingInvoiceNumber)

    const handleGenerateInvoice = async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/generate-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ orderId }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate invoice')
            }

            setInvoiceUrl(data.invoiceUrl)
            setInvoiceNumber(data.invoiceNumber)

            // Open the invoice in a new tab
            window.open(data.invoiceUrl, '_blank')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadInvoice = () => {
        if (invoiceUrl) {
            window.open(invoiceUrl, '_blank')
        }
    }

    if (invoiceUrl) {
        return (
            <div className="space-y-2">
                <button
                    onClick={handleDownloadInvoice}
                    className={
                        className ||
                        'flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium'
                    }
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    {buttonText || `Download Invoice ${invoiceNumber || ''}`}
                </button>
                {invoiceNumber && (
                    <p className="text-sm text-gray-600">Invoice Number: {invoiceNumber}</p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <button
                onClick={handleGenerateInvoice}
                disabled={loading}
                className={
                    className ||
                    'flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed'
                }
            >
                {loading ? (
                    <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                        </svg>
                        Generating...
                    </>
                ) : (
                    <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                        {buttonText || 'Generate Invoice'}
                    </>
                )}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    )
}
