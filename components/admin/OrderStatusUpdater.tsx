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
    const [status, setStatus] = useState<OrderStatus>(currentStatus as OrderStatus)
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const statusOptions: { value: OrderStatus; label: string; icon: string }[] = [
        { value: 'pending', label: 'Pending', icon: '⏳' },
        { value: 'processing', label: 'Processing', icon: '⚙️' },
        { value: 'shipped', label: 'Shipped', icon: '📦' },
        { value: 'delivered', label: 'Delivered', icon: '✅' },
    ]

    const handleStatusChange = async (newStatus: OrderStatus) => {
        if (newStatus === status) return

        setError(null)
        setSuccess(false)
        setUpdating(true)

        try {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId)

            if (updateError) throw updateError

            setStatus(newStatus)
            setSuccess(true)

            // Refresh the page data
            router.refresh()

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000)
        } catch (err: any) {
            console.error('Error updating order status:', err)
            setError(err.message || 'Failed to update order status')
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="space-y-4">
            {/* Status Options */}
            <div className="space-y-2">
                {statusOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => handleStatusChange(option.value)}
                        disabled={updating || status === option.value}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border-2 transition-all ${status === option.value
                                ? 'border-green-500 bg-green-50 text-green-900'
                                : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                            } ${updating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        <span className="flex items-center">
                            <span className="text-xl mr-3">{option.icon}</span>
                            <span className="font-medium">{option.label}</span>
                        </span>
                        {status === option.value && (
                            <span className="text-green-600 font-bold">✓</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800 font-medium">
                        ✓ Status updated successfully!
                    </p>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{error}</p>
                </div>
            )}

            {/* Loading Indicator */}
            {updating && (
                <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Updating...</span>
                </div>
            )}

            {/* Quick Actions */}
            <div className="pt-4 border-t space-y-2">
                <p className="text-xs font-medium text-gray-700 mb-2">QUICK ACTIONS</p>
                {status === 'pending' && (
                    <button
                        onClick={() => handleStatusChange('processing')}
                        disabled={updating}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
                    >
                        → Mark as Processing
                    </button>
                )}
                {status === 'processing' && (
                    <button
                        onClick={() => handleStatusChange('shipped')}
                        disabled={updating}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                    >
                        → Mark as Shipped
                    </button>
                )}
                {status === 'shipped' && (
                    <button
                        onClick={() => handleStatusChange('delivered')}
                        disabled={updating}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
                    >
                        → Mark as Delivered
                    </button>
                )}
            </div>
        </div>
    )
}
