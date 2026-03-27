'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/types/database.types'
import { downloadBulkOrderTemplateWorkbook } from '@/utils/bulkOrderSpreadsheet'

interface RecentOrderItem {
    quantity: number
    product: Product | null
}

interface RecentOrder {
    id: string
    createdAt: string
    totalAmount: number
    items: RecentOrderItem[]
}

interface CommandCenterCopy {
    quickOrderTitle: string
    quickOrderHint: string
    bulkOrderForm: string
    uploadCsv: string
    downloadTemplate: string
    recentOrdersTitle: string
    recentOrdersHint: string
    noRecentOrders: string
    reorder: string
    adding: string
    added: string
    viewAllOrders: string
    recentInvoicesTitle: string
    creditTermsLabel: string
    creditTermsValue: string
    accountBalanceLabel: string
    accountBalanceValue: string
    downloadLatestInvoice: string
    invoicePending: string
    supportTitle: string
    supportHint: string
    accountManagerLabel: string
    accountManagerName: string
    accountManagerPhone: string
    accountManagerEmail: string
    callLabel: string
    emailLabel: string
    orderLabel: string
    productsLabel: string
}

interface LatestInvoice {
    invoiceUrl: string
    invoiceNumber: string | null
}

interface B2BCommandCenterProps {
    locale: 'en' | 'pl'
    copy: CommandCenterCopy
    recentOrders: RecentOrder[]
    latestInvoice: LatestInvoice | null
}

type ReorderState = 'idle' | 'loading' | 'done'

export default function B2BCommandCenter({ locale, copy, recentOrders, latestInvoice }: B2BCommandCenterProps) {
    const { addItem } = useCart()
    const [reorderStates, setReorderStates] = useState<Record<string, ReorderState>>({})
    const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

    const handleDownloadTemplate = () => {
        downloadBulkOrderTemplateWorkbook(locale)
    }

    const handleReorder = async (order: RecentOrder) => {
        setReorderStates((prev) => ({ ...prev, [order.id]: 'loading' }))

        for (const item of order.items) {
            if (item.product) {
                addItem(item.product, item.quantity)
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
        setReorderStates((prev) => ({ ...prev, [order.id]: 'done' }))

        setTimeout(() => {
            setReorderStates((prev) => ({ ...prev, [order.id]: 'idle' }))
        }, 1500)
    }

    const cardClassName = 'rounded-2xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md'

    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className={cardClassName}>
                <div className="mb-5">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{copy.quickOrderTitle}</h2>
                    <p className="mt-2 text-sm text-slate-600">{copy.quickOrderHint}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/b2b/bulk-order"
                        className="inline-flex items-center rounded-md bg-[#163579] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102a63]"
                    >
                        {copy.bulkOrderForm}
                    </Link>
                    <Link
                        href="/b2b/bulk-order"
                        className="inline-flex items-center rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                        {copy.uploadCsv}
                    </Link>
                </div>

                <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#163579] transition hover:text-[#102a63]"
                >
                    <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                        <path d="M10 3v8m0 0l3-3m-3 3L7 8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4 13.5v1A1.5 1.5 0 0 0 5.5 16h9A1.5 1.5 0 0 0 16 14.5v-1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {copy.downloadTemplate}
                </button>
            </section>

            <section className={cardClassName}>
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight text-slate-900">{copy.recentOrdersTitle}</h2>
                        <p className="mt-2 text-sm text-slate-600">{copy.recentOrdersHint}</p>
                    </div>
                    <Link href="/orders" className="text-sm font-semibold text-[#163579] hover:text-[#102a63]">
                        {copy.viewAllOrders}
                    </Link>
                </div>

                {recentOrders.length === 0 ? (
                    <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{copy.noRecentOrders}</p>
                ) : (
                    <div className="space-y-3">
                        {recentOrders.map((order) => {
                            const totalUnits = order.items.reduce((sum, item) => sum + item.quantity, 0)
                            const state = reorderStates[order.id] ?? 'idle'

                            return (
                                <div key={order.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                                                {copy.orderLabel} #{order.id.slice(0, 8)}
                                            </p>
                                            <p className="mt-1 text-sm font-medium text-slate-900">
                                                {new Date(order.createdAt).toLocaleDateString(numberLocale)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {Number(order.totalAmount).toLocaleString(numberLocale, {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code',
                                            }).replace('PLN', 'PLN ')}
                                        </p>
                                    </div>

                                    <div className="mb-3 text-xs text-slate-500">
                                        {totalUnits} {copy.productsLabel}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => handleReorder(order)}
                                        disabled={state !== 'idle'}
                                        className="inline-flex min-w-[122px] items-center justify-center gap-2 rounded-md border border-[#163579] px-3.5 py-2 text-sm font-semibold text-[#163579] transition hover:bg-[#163579]/5 disabled:cursor-not-allowed disabled:opacity-80"
                                    >
                                        {state === 'loading' && (
                                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#163579]/30 border-t-[#163579]" />
                                        )}
                                        {state === 'done' && (
                                            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                                                <path d="M4.5 10.5L8 14l7.5-7.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                        <span>{state === 'loading' ? copy.adding : state === 'done' ? copy.added : copy.reorder}</span>
                                    </button>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            <section className={cardClassName}>
                <div className="mb-5">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{copy.recentInvoicesTitle}</h2>
                </div>

                <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                        <dt className="text-slate-600">{copy.creditTermsLabel}</dt>
                        <dd className="font-semibold text-slate-900">{copy.creditTermsValue}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
                        <dt className="text-slate-600">{copy.accountBalanceLabel}</dt>
                        <dd className="font-semibold text-slate-900">{copy.accountBalanceValue}</dd>
                    </div>
                </dl>

                <div className="mt-5">
                    {latestInvoice ? (
                        <Link
                            href={latestInvoice.invoiceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md border border-[#163579] px-4 py-2.5 text-sm font-semibold text-[#163579] transition hover:bg-[#163579]/5"
                        >
                            {copy.downloadLatestInvoice}
                        </Link>
                    ) : (
                        <p className="text-sm text-slate-500">{copy.invoicePending}</p>
                    )}
                </div>
            </section>

            <section className={cardClassName}>
                <div className="mb-5">
                    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{copy.supportTitle}</h2>
                    <p className="mt-2 text-sm text-slate-600">{copy.supportHint}</p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">{copy.accountManagerLabel}</p>
                    <p className="mt-1 text-base font-semibold text-slate-900">{copy.accountManagerName}</p>
                    <div className="mt-4 space-y-2 text-sm">
                        <p className="text-slate-700">
                            {copy.callLabel} <a href={`tel:${copy.accountManagerPhone}`} className="font-semibold text-[#163579]">{copy.accountManagerPhone}</a>
                        </p>
                        <p className="text-slate-700">
                            {copy.emailLabel}{' '}
                            <a href={`mailto:${copy.accountManagerEmail}`} className="font-semibold text-[#163579]">
                                {copy.accountManagerEmail}
                            </a>
                        </p>
                    </div>
                </div>
            </section>
        </div>
    )
}
