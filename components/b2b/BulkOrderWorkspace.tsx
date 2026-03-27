'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useCart } from '@/contexts/CartContext'
import { parseCsvBulkOrder, parseManualBulkOrder, type BulkOrderRowIssue } from '@/utils/bulkOrderParser'
import { mergeBulkOrderRows, resolveBulkOrderRows, type ResolvedBulkOrderRow, type UnresolvedBulkOrderRow } from '@/utils/bulkOrderValidation'
import { downloadBulkOrderTemplateWorkbook, extractBulkOrderTextFromFile, getSampleManualRows } from '@/utils/bulkOrderSpreadsheet'
import type { Product } from '@/types/database.types'

interface BulkOrderCopy {
    title: string
    subtitle: string
    csvCardTitle: string
    csvHint: string
    csvInputLabel: string
    csvTemplateHint: string
    downloadSampleCsv: string
    pasteSampleRows: string
    manualCardTitle: string
    manualHint: string
    manualPlaceholder: string
    parseButton: string
    parsing: string
    parseSummary: string
    validRowsLabel: string
    blockedRowsLabel: string
    issuesLabel: string
    blockedNotFound: string
    blockedStock: string
    addValidItems: string
    addingToCart: string
    noValidRows: string
    backToPortal: string
}

interface BulkOrderWorkspaceProps {
    locale: 'en' | 'pl'
    copy: BulkOrderCopy
}

const QUERY_CHUNK_SIZE = 100
const PRODUCT_QUERY_TIMEOUT_MS = 12000

function chunkSkus(values: string[], chunkSize: number): string[][] {
    const chunks: string[][] = []
    for (let i = 0; i < values.length; i += chunkSize) {
        chunks.push(values.slice(i, i + chunkSize))
    }
    return chunks
}

export default function BulkOrderWorkspace({ locale, copy }: BulkOrderWorkspaceProps) {
    const router = useRouter()
    const { addItem } = useCart()
    const supabase = useMemo(() => createClient(), [])

    const [csvContent, setCsvContent] = useState('')
    const [manualContent, setManualContent] = useState('')
    const [issues, setIssues] = useState<BulkOrderRowIssue[]>([])
    const [validRows, setValidRows] = useState<ResolvedBulkOrderRow[]>([])
    const [blockedRows, setBlockedRows] = useState<UnresolvedBulkOrderRow[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isAdding, setIsAdding] = useState(false)

    const fetchProductsBySkus = async (skus: string[]): Promise<Product[]> => {
        const uniqueSkus = Array.from(new Set(skus))
        const skuChunks = chunkSkus(uniqueSkus, QUERY_CHUNK_SIZE)
        const allProducts: Product[] = []

        for (const skuChunk of skuChunks) {
            const queryPromise = supabase
                .from('products')
                .select('*')
                .in('sku', skuChunk)

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error('Product lookup timed out. Please try again.')), PRODUCT_QUERY_TIMEOUT_MS)
            })

            const result = await Promise.race([queryPromise, timeoutPromise]) as Awaited<typeof queryPromise>

            if (result.error) {
                throw new Error(result.error.message)
            }

            if (result.data?.length) {
                allProducts.push(...result.data)
            }
        }

        return allProducts
    }

    const onCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return
        const content = await extractBulkOrderTextFromFile(file)
        setCsvContent(content)
    }

    const handleDownloadSampleCsv = () => {
        downloadBulkOrderTemplateWorkbook(locale)
    }

    const handlePasteSampleRows = () => {
        setManualContent(getSampleManualRows(locale))
    }

    const handleParse = async () => {
        setIsParsing(true)
        const csvResult = parseCsvBulkOrder(csvContent)
        const manualResult = parseManualBulkOrder(manualContent)
        const combinedRows = [...csvResult.rows, ...manualResult.rows]
        const combinedIssues = [...csvResult.issues, ...manualResult.issues]

        try {
            const mergedRows = mergeBulkOrderRows(combinedRows)
            if (mergedRows.length === 0) {
                setIssues(combinedIssues)
                setValidRows([])
                setBlockedRows([])
                return
            }

            const skuList = mergedRows.map((row) => row.sku)
            const products = await fetchProductsBySkus(skuList)
            const { validRows: resolvedRows, blockedRows: unresolvedRows } = resolveBulkOrderRows(mergedRows, products)
            setIssues(combinedIssues)
            setValidRows(resolvedRows)
            setBlockedRows(unresolvedRows)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unexpected parsing error. Please retry.'
            setIssues([
                ...combinedIssues,
                { rowNumber: 0, message, rawLine: '', source: 'csv' },
            ])
            setValidRows([])
            setBlockedRows([])
        } finally {
            setIsParsing(false)
        }
    }

    const handleAddToCart = async () => {
        if (validRows.length === 0) return
        setIsAdding(true)

        for (const row of validRows) {
            addItem(row.product, row.quantity)
        }

        await new Promise((resolve) => setTimeout(resolve, 700))
        setIsAdding(false)
        router.push('/cart?bulk=1')
    }

    const hasPreview = validRows.length > 0 || blockedRows.length > 0 || issues.length > 0

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 md:pt-28 md:pb-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{copy.title}</h1>
                        <p className="mt-2 text-slate-600">{copy.subtitle}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push('/b2b')}
                        className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300"
                    >
                        {copy.backToPortal}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                        <h2 className="text-xl font-semibold text-slate-900">{copy.csvCardTitle}</h2>
                        <p className="mt-2 text-sm text-slate-600">{copy.csvHint}</p>
                        <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">
                            {copy.csvInputLabel}
                        </label>
                        <input
                            type="file"
                            accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                            onChange={onCsvUpload}
                            className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#163579] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
                        />
                        <p className="mt-3 text-xs text-slate-500">{copy.csvTemplateHint}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={handleDownloadSampleCsv}
                                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                            >
                                {copy.downloadSampleCsv}
                            </button>
                            <button
                                type="button"
                                onClick={handlePasteSampleRows}
                                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                            >
                                {copy.pasteSampleRows}
                            </button>
                        </div>
                    </section>

                    <section className="rounded-2xl bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                        <h2 className="text-xl font-semibold text-slate-900">{copy.manualCardTitle}</h2>
                        <p className="mt-2 text-sm text-slate-600">{copy.manualHint}</p>
                        <textarea
                            value={manualContent}
                            onChange={(event) => setManualContent(event.target.value)}
                            placeholder={copy.manualPlaceholder}
                            className="mt-4 h-44 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                        />
                    </section>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        onClick={handleParse}
                        disabled={isParsing || (!csvContent && !manualContent)}
                        className="rounded-md bg-[#163579] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102a63] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isParsing ? copy.parsing : copy.parseButton}
                    </button>
                    {hasPreview && (
                        <p className="text-sm text-slate-600">
                            {copy.parseSummary} {validRows.length + blockedRows.length} • {copy.validRowsLabel}: {validRows.length} • {copy.blockedRowsLabel}: {blockedRows.length} • {copy.issuesLabel}: {issues.length}
                        </p>
                    )}
                </div>

                {hasPreview && (
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h3 className="mb-3 text-lg font-semibold text-slate-900">{copy.validRowsLabel}</h3>
                            {validRows.length === 0 ? (
                                <p className="text-sm text-slate-500">{copy.noValidRows}</p>
                            ) : (
                                <div className="space-y-3">
                                    {validRows.map((row) => (
                                        <div key={row.sku} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                                            <p className="text-sm font-semibold text-slate-900">{row.sku}</p>
                                            <p className="text-xs text-slate-600">
                                                {row.product.title} • {row.quantity}
                                            </p>
                                            {row.notes && <p className="mt-1 text-xs text-slate-500">{row.notes}</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h3 className="mb-3 text-lg font-semibold text-slate-900">{copy.blockedRowsLabel}</h3>
                            {blockedRows.length === 0 ? (
                                <p className="text-sm text-slate-500">0</p>
                            ) : (
                                <div className="space-y-3">
                                    {blockedRows.map((row) => (
                                        <div key={`${row.sku}-${row.reason}`} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                                            <p className="text-sm font-semibold text-amber-900">{row.sku}</p>
                                            <p className="text-xs text-amber-800">
                                                {row.reason === 'not_found'
                                                    ? copy.blockedNotFound
                                                    : `${copy.blockedStock} ${row.availableStock ?? 0}`}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl bg-white p-6 shadow-sm">
                            <h3 className="mb-3 text-lg font-semibold text-slate-900">{copy.issuesLabel}</h3>
                            {issues.length === 0 ? (
                                <p className="text-sm text-slate-500">0</p>
                            ) : (
                                <div className="space-y-3">
                                    {issues.map((issue, index) => (
                                        <div key={`${issue.source}-${issue.rowNumber}-${index}`} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-700">
                                                {issue.source} #{issue.rowNumber}
                                            </p>
                                            <p className="mt-1 text-sm text-rose-900">{issue.message}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                <div className="mt-8">
                    <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={isAdding || validRows.length === 0}
                        className="inline-flex items-center rounded-md bg-[#163579] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102a63] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isAdding ? copy.addingToCart : copy.addValidItems}
                    </button>
                </div>
            </div>
        </div>
    )
}
