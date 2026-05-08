'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function RunInventorySyncButton() {
    const router = useRouter()
    const [isRunning, setIsRunning] = useState(false)
    const [message, setMessage] = useState<string | null>(null)
    const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | null>(null)

    const handleRunSync = async () => {
        setIsRunning(true)
        setMessage(null)
        setMessageType(null)

        try {
            const response = await fetch('/api/admin/sync-now', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const payload = await response.json().catch(() => ({}))

            if (!response.ok) {
                throw new Error(payload.error || 'Failed to start sync')
            }

            const statusText = payload.synced ? 'Sync completed successfully.' : 'Sync request accepted.'
            setMessage(payload.message || statusText)
            setMessageType('success')
            router.refresh()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to start sync'
            setMessage(errorMessage)
            setMessageType('error')
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
            <button
                type="button"
                onClick={handleRunSync}
                disabled={isRunning}
                className="inline-flex items-center justify-center rounded-md bg-[#163579] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#122d67] disabled:cursor-not-allowed disabled:opacity-70"
            >
                {isRunning ? 'Running sync…' : 'Run Sync Now'}
            </button>
            {message && (
                <p className={`text-xs font-medium ${messageType === 'error' ? 'text-red-700' : messageType === 'success' ? 'text-emerald-700' : 'text-slate-600'}`}>
                    {message}
                </p>
            )}
        </div>
    )
}