'use client'

import { useEffect, useMemo, useState } from 'react'

interface AdminMetricsGridProps {
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
    totalProducts: number
    lowStockProducts: number
    totalUsers: number
}

interface MetricCard {
    id: string
    label: string
    value: number
    isCurrency?: boolean
    helper?: string
    critical?: boolean
    icon: React.ReactNode
}

function easeOutCubic(t: number) {
    return 1 - Math.pow(1 - t, 3)
}

export default function AdminMetricsGrid({
    totalOrders,
    totalRevenue,
    pendingOrders,
    totalProducts,
    lowStockProducts,
    totalUsers,
}: AdminMetricsGridProps) {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        const start = performance.now()
        let frameId = 0

        const animate = (now: number) => {
            const elapsed = now - start
            const t = Math.min(elapsed / 500, 1)
            setProgress(easeOutCubic(t))

            if (t < 1) {
                frameId = requestAnimationFrame(animate)
            }
        }

        frameId = requestAnimationFrame(animate)
        return () => cancelAnimationFrame(frameId)
    }, [])

    const formatValue = (value: number, isCurrency?: boolean) => {
        const animatedValue = value * progress

        if (isCurrency) {
            return animatedValue
                .toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'PLN',
                    currencyDisplay: 'code',
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })
                .replace('PLN', 'PLN ')
        }

        return Math.round(animatedValue).toLocaleString('en-US')
    }

    const iconBadgeClassName = 'inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#163579]/8 text-[#163579]'

    const cards = useMemo<MetricCard[]>(() => [
        {
            id: 'orders',
            label: 'Total Orders',
            value: totalOrders,
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M4 7h16M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            id: 'revenue',
            label: 'Total Revenue',
            value: totalRevenue,
            isCurrency: true,
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M12 3v18M17.5 7.5c0-2-2.2-3.5-5.5-3.5S6.5 5.5 6.5 7.5 8.7 11 12 11s5.5 1.5 5.5 3.5S15.3 18 12 18s-5.5-1.5-5.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            id: 'pending',
            label: 'Pending Orders',
            value: pendingOrders,
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            id: 'products',
            label: 'Total Products',
            value: totalProducts,
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M4 9 12 4l8 5-8 5-8-5Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 9v6l8 5 8-5V9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            id: 'low-stock',
            label: 'Low Stock Products',
            value: lowStockProducts,
            helper: 'Below 10 units',
            critical: true,
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M12 3 3.5 19h17L12 3Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 9v4" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="16.5" r=".75" fill="currentColor" />
                </svg>
            ),
        },
        {
            id: 'users',
            label: 'Total Users',
            value: totalUsers,
            icon: (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="8" r="3" />
                    <path d="M20 19v-1a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 5.13a3 3 0 0 1 0 5.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ], [lowStockProducts, pendingOrders, totalOrders, totalProducts, totalRevenue, totalUsers])

    return (
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
                <article
                    key={card.id}
                    className="shop-card-reveal rounded-2xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(15,23,42,0.11)]"
                    style={{ animationDelay: `${80 + index * 70}ms` }}
                >
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
                        <span className={card.critical ? 'inline-flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700' : iconBadgeClassName}>
                            {card.icon}
                        </span>
                    </div>

                    <p className={`text-4xl font-extrabold tracking-tight ${card.critical ? 'text-amber-700' : 'text-slate-900'}`}>
                        {formatValue(card.value, card.isCurrency)}
                    </p>

                    {card.helper && (
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.08em] text-slate-500">{card.helper}</p>
                    )}
                </article>
            ))}
        </div>
    )
}
