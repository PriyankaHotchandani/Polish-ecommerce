'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface OrderStatusUpdaterProps {
    orderId: string
    currentStatus: string
}

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered'

export default function OrderStatusUpdater({ orderId, currentStatus }: OrderStatusUpdaterProps) {
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus as OrderStatus)
    const [savedStatus, setSavedStatus] = useState<OrderStatus>(currentStatus as OrderStatus)
    const [saving, setSaving] = useState(false)
    const [updated, setUpdated] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    const statusOptions: { value: OrderStatus; label: string; description: string }[] = [
        { value: 'pending', label: 'Pending', description: 'Awaiting fulfillment' },
        { value: 'processing', label: 'Processing', description: 'Being prepared now' },
        { value: 'shipped', label: 'Shipped', description: 'Handed to carrier' },
        { value: 'delivered', label: 'Delivered', description: 'Completed successfully' },
    ]

    const handleSubmit = async () => {
        if (selectedStatus === savedStatus || saving) return

        setError(null)
        setUpdated(false)
        setSaving(true)

        try {
            const [result] = await Promise.all([
                supabase
                    .from('orders')
                    .update({
                        status: selectedStatus,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', orderId),
                new Promise((resolve) => setTimeout(resolve, 1000)),
            ])

            const { error: updateError } = result

            if (updateError) throw updateError

            setSavedStatus(selectedStatus)
            setUpdated(true)

            router.refresh()
            setTimeout(() => setUpdated(false), 2000)
        } catch (err: any) {
            console.error('Error updating order status:', err)
            setError(err.message || 'Failed to update order status')
        } finally {
            setSaving(false)
        }
    }

    const buttonLabel = saving ? 'Saving...' : updated ? 'Updated!' : 'Update Status'
    const canSubmit = selectedStatus !== savedStatus && !saving

    return (
        <div className="space-y-5">
            <div className="space-y-2.5">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => setSelectedStatus(option.value)}
                        disabled={saving}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${selectedStatus === option.value
                            ? 'border-[#163579] bg-[#163579]/8 text-[#163579]'
                            : 'border-gray-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                            } ${saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    >
                        <span className="flex items-start justify-between">
                            <span>
                                <span className="block text-[15px] font-semibold">{option.label}</span>
                                <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                            </span>
                            {selectedStatus === option.value && (
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#163579] text-white" aria-hidden="true">
                                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            )}
                        </span>
                    </button>
                ))}
            </div>

            <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit && !saving}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${updated
                    ? 'bg-emerald-600'
                    : canSubmit || saving
                        ? 'bg-[#163579] hover:bg-[#122d67]'
                        : 'bg-slate-300'
                    } ${(saving || canSubmit || updated) ? '' : 'cursor-not-allowed'}`}
            >
                {saving && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" aria-hidden="true" />
                )}
                {updated && !saving && (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
                <span>{buttonLabel}</span>
            </button>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}
        </div>
    )
}
