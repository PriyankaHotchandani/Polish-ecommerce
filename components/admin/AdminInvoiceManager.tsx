'use client'

import { useRef, useState } from 'react'

interface AdminInvoiceManagerProps {
    orderId: string
    customerEmail?: string | null
    existingInvoiceUrl?: string | null
    existingInvoiceNumber?: string | null
}

export default function AdminInvoiceManager({
    orderId,
    customerEmail,
    existingInvoiceUrl,
    existingInvoiceNumber,
}: AdminInvoiceManagerProps) {
    const [file, setFile] = useState<File | null>(null)
    const [invoiceNumber, setInvoiceNumber] = useState(existingInvoiceNumber || '')
    const [sendEmail, setSendEmail] = useState(Boolean(customerEmail))
    const [loading, setLoading] = useState(false)
    const [dragActive, setDragActive] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [invoiceUrl, setInvoiceUrl] = useState(existingInvoiceUrl || null)
    const [savedInvoiceNumber, setSavedInvoiceNumber] = useState(existingInvoiceNumber || null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const canSubmit = Boolean(file)

    const handleFileSelect = (selectedFile: File | null) => {
        if (!selectedFile) {
            setFile(null)
            return
        }

        const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')
        if (!isPdf) {
            setError('Please upload a PDF file.')
            return
        }

        setError(null)
        setFile(selectedFile)
    }

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        setError(null)
        setMessage(null)
        setLoading(true)

        try {
            const formData = new FormData()
            if (file) {
                formData.append('invoiceFile', file)
            }
            if (invoiceNumber.trim()) {
                formData.append('invoiceNumber', invoiceNumber.trim())
            }
            formData.append('sendEmail', sendEmail ? 'true' : 'false')

            const response = await fetch(`/api/admin/orders/${orderId}/invoice`, {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save invoice')
            }

            setInvoiceUrl(data.invoiceUrl || null)
            setSavedInvoiceNumber(data.invoiceNumber || null)
            setInvoiceNumber(data.invoiceNumber || invoiceNumber)
            setFile(null)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            if (data.emailSent) {
                setMessage('Invoice uploaded and emailed to customer.')
            } else if (sendEmail && data.emailError) {
                setMessage(`Invoice uploaded. Email not sent: ${data.emailError}`)
            } else {
                setMessage('Invoice uploaded successfully.')
            }
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : 'Unexpected error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            {invoiceUrl && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-sm text-gray-700">
                        Current invoice: {savedInvoiceNumber || 'Not numbered'}
                    </p>
                    <a
                        href={invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center text-sm font-medium text-[#163579] hover:text-[#102a63]"
                    >
                        Open uploaded invoice
                    </a>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                    <label htmlFor="invoice-file" className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        Invoice PDF
                    </label>
                    <input
                        id="invoice-file"
                        ref={fileInputRef}
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                        className="sr-only"
                    />
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                fileInputRef.current?.click()
                            }
                        }}
                        onDragOver={(event) => {
                            event.preventDefault()
                            setDragActive(true)
                        }}
                        onDragLeave={(event) => {
                            event.preventDefault()
                            setDragActive(false)
                        }}
                        onDrop={(event) => {
                            event.preventDefault()
                            setDragActive(false)
                            const droppedFile = event.dataTransfer.files?.[0] || null
                            handleFileSelect(droppedFile)
                        }}
                        className={`rounded-lg border-2 border-dashed p-6 text-center transition-colors ${dragActive
                            ? 'border-[#163579] bg-[#163579]/5'
                            : 'border-gray-300 bg-gray-50 hover:border-slate-400'
                            }`}
                    >
                        <div className="mx-auto mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-500">
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                                <path d="M12 16V7" strokeLinecap="round" />
                                <path d="m8.5 10.5 3.5-3.5 3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M20 16.5v1A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-1" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop PDF.</p>
                        {file && <p className="mt-2 text-xs text-slate-500">Selected: {file.name}</p>}
                    </div>
                </div>

                <div>
                    <label htmlFor="invoice-number" className="mb-1 block text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                        Invoice number (optional)
                    </label>
                    <input
                        id="invoice-number"
                        type="text"
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        placeholder="INV/2026/00001"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-[#163579] focus:outline-none focus:ring-2 focus:ring-[#163579]/20"
                    />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-[#163579] focus:ring-[#163579]/30"
                    />
                    Send invoice email to customer{customerEmail ? ` (${customerEmail})` : ''}
                </label>

                <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className={`w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors ${canSubmit
                        ? 'bg-[#163579] hover:bg-[#102a63]'
                        : 'bg-slate-300'
                        } disabled:cursor-not-allowed`}
                >
                    {loading ? 'Saving invoice...' : 'Upload invoice and update order'}
                </button>
            </form>

            {message && <p className="text-sm text-green-700">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            {!customerEmail && (
                <p className="text-xs text-amber-700">
                    Customer email is missing. You can still upload the invoice, but email delivery is unavailable.
                </p>
            )}
        </div>
    )
}
