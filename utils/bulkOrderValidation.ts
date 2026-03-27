import type { Product } from '@/types/database.types'
import type { BulkOrderInputRow } from '@/utils/bulkOrderParser'

export interface MergedBulkOrderRow {
    sku: string
    quantity: number
    notes: string
    rowNumbers: number[]
    sources: Array<'csv' | 'manual'>
}

export interface ResolvedBulkOrderRow extends MergedBulkOrderRow {
    product: Product
}

export interface UnresolvedBulkOrderRow extends MergedBulkOrderRow {
    reason: 'not_found' | 'insufficient_stock'
    availableStock?: number
}

export function mergeBulkOrderRows(rows: BulkOrderInputRow[]): MergedBulkOrderRow[] {
    const merged = new Map<string, MergedBulkOrderRow>()

    for (const row of rows) {
        const key = row.sku.toUpperCase()
        const existing = merged.get(key)

        if (!existing) {
            merged.set(key, {
                sku: row.sku,
                quantity: row.quantity,
                notes: row.notes,
                rowNumbers: [row.rowNumber],
                sources: [row.source],
            })
            continue
        }

        existing.quantity += row.quantity
        existing.rowNumbers.push(row.rowNumber)
        existing.sources.push(row.source)
        if (row.notes) {
            existing.notes = existing.notes ? `${existing.notes}; ${row.notes}` : row.notes
        }
    }

    return Array.from(merged.values())
}

export function resolveBulkOrderRows(
    mergedRows: MergedBulkOrderRow[],
    products: Product[]
): { validRows: ResolvedBulkOrderRow[]; blockedRows: UnresolvedBulkOrderRow[] } {
    const productBySku = new Map(products.map((product) => [product.sku.toUpperCase(), product]))

    const validRows: ResolvedBulkOrderRow[] = []
    const blockedRows: UnresolvedBulkOrderRow[] = []

    for (const row of mergedRows) {
        const product = productBySku.get(row.sku.toUpperCase())

        if (!product) {
            blockedRows.push({ ...row, reason: 'not_found' })
            continue
        }

        if (product.inventory_count < row.quantity) {
            blockedRows.push({ ...row, reason: 'insufficient_stock', availableStock: product.inventory_count })
            continue
        }

        validRows.push({ ...row, product })
    }

    return { validRows, blockedRows }
}
