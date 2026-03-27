'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import { useMemo, useState } from 'react'

interface OrderUser {
    email?: string | null
    company_name?: string | null
    first_name?: string | null
    last_name?: string | null
    full_name?: string | null
}

interface ProductInfo {
    title?: string | null
}

interface OrderItem {
    quantity: number
    product?: ProductInfo | null
}

interface AdminOrder {
    id: string
    status: string
    created_at: string
    total_amount: number | string
    user?: OrderUser | null
    order_items: OrderItem[]
}

interface OrdersTriageTableProps {
    orders: AdminOrder[]
    hasActiveFilters: boolean
}

function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
        pending: 'bg-amber-100 text-amber-800 border border-amber-200',
        processing: 'bg-sky-100 text-sky-800 border border-sky-200',
        shipped: 'bg-indigo-100 text-indigo-800 border border-indigo-200',
        delivered: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    }

    return styles[status] || 'bg-slate-100 text-slate-700 border border-slate-200'
}

function formatCurrency(value: number | string) {
    return Number(value)
        .toLocaleString('en-US', {
            style: 'currency',
            currency: 'PLN',
            currencyDisplay: 'code',
        })
        .replace('PLN', 'PLN ')
}

function formatDisplayName(user: OrderUser | null | undefined) {
    const fullName = user?.full_name?.trim()
    if (fullName) return fullName

    const joinedName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim()
    if (joinedName) return joinedName

    if (user?.company_name?.trim()) return user.company_name.trim()

    const email = user?.email?.trim()
    if (!email) return 'Unknown Customer'

    const localPart = email.split('@')[0] || 'customer'
    return localPart
        .split(/[._-]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ')
}

function getInitials(name: string) {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length === 0) return 'CU'
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function OrdersTriageTable({ orders, hasActiveFilters }: OrdersTriageTableProps) {
    const router = useRouter()
    const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null)

    const enrichedOrders = useMemo(() => {
        return orders.map((order) => {
            const orderItems = Array.isArray(order.order_items) ? order.order_items : []
            const totalQuantity = orderItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            const uniqueTitles = Array.from(
                new Set(
                    orderItems
                        .map((item) => item.product?.title?.trim())
                        .filter((title): title is string => Boolean(title))
                )
            )

            const primaryProduct = uniqueTitles[0] || `${totalQuantity} ${totalQuantity === 1 ? 'item' : 'items'}`
            const additionalProductCount = Math.max(uniqueTitles.length - 1, 0)

            return {
                ...order,
                displayName: formatDisplayName(order.user),
                email: order.user?.email || 'No email',
                totalQuantity,
                primaryProduct,
                additionalProductCount,
            }
        })
    }, [orders])

    const handleRowOpen = (orderId: string) => {
        router.push(`/admin/orders/${orderId}`)
    }

    const handleCopyOrderId = async (event: MouseEvent<HTMLButtonElement>, orderId: string) => {
        event.stopPropagation()

        try {
            await navigator.clipboard.writeText(orderId)
            setCopiedOrderId(orderId)
            setTimeout(() => {
                setCopiedOrderId((current) => (current === orderId ? null : current))
            }, 1000)
        } catch (error) {
            console.error('Failed to copy order ID', error)
        }
    }

    if (orders.length === 0) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
                <p className="text-slate-500 text-lg">No orders found</p>
                <p className="text-slate-400 text-sm mt-2">
                    {hasActiveFilters ? 'Try adjusting your filters' : 'Orders will appear here once customers place them'}
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {enrichedOrders.map((order) => {
                            const displayOrderId = `#${order.id.slice(0, 8).toUpperCase()}`
                            const initials = getInitials(order.displayName)
                            const isCopied = copiedOrderId === order.id

                            return (
                                <tr
                                    key={order.id}
                                    onClick={() => handleRowOpen(order.id)}
                                    className="group cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-sm font-mono text-slate-900">
                                            <span>{displayOrderId}</span>
                                            <button
                                                type="button"
                                                onClick={(event) => handleCopyOrderId(event, order.id)}
                                                className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                                aria-label={`Copy order ID ${displayOrderId}`}
                                                title="Copy full order ID"
                                            >
                                                {isCopied ? (
                                                    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                                        <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                ) : (
                                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                        <rect x="9" y="9" width="10" height="10" rx="2" />
                                                        <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#163579]/10 text-xs font-bold text-[#163579]">
                                                {initials}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-slate-900">{order.displayName}</p>
                                                <p className="truncate text-xs text-slate-500">{order.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-slate-800">{order.primaryProduct}</span>
                                            {order.additionalProductCount > 0 && (
                                                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600">
                                                    + {order.additionalProductCount} more
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">
                                        {formatCurrency(order.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {new Date(order.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            onClick={(event) => event.stopPropagation()}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-700"
                                            aria-label="Open order actions"
                                            title="Open order details"
                                        >
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                                <circle cx="5" cy="12" r="1.75" />
                                                <circle cx="12" cy="12" r="1.75" />
                                                <circle cx="19" cy="12" r="1.75" />
                                            </svg>
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
