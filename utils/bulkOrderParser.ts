import { validateSKU } from '@/utils/validation'

export interface BulkOrderInputRow {
    rowNumber: number
    sku: string
    quantity: number
    notes: string
    source: 'csv' | 'manual'
}

export interface BulkOrderRowIssue {
    rowNumber: number
    message: string
    rawLine: string
    source: 'csv' | 'manual'
}

export interface BulkOrderParseResult {
    rows: BulkOrderInputRow[]
    issues: BulkOrderRowIssue[]
}

function parseDelimitedLine(line: string, delimiter: ',' | ';'): string[] {
    const values: string[] = []
    let current = ''
    let insideQuotes = false

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i]
        const next = line[i + 1]

        if (char === '"') {
            // Escaped quote in CSV field.
            if (insideQuotes && next === '"') {
                current += '"'
                i += 1
                continue
            }

            insideQuotes = !insideQuotes
            continue
        }

        if (char === delimiter && !insideQuotes) {
            values.push(current.trim())
            current = ''
            continue
        }

        current += char
    }

    values.push(current.trim())
    return values
}

function detectDelimiter(line: string): ',' | ';' {
    let commaCount = 0
    let semicolonCount = 0
    let insideQuotes = false

    for (let i = 0; i < line.length; i += 1) {
        const char = line[i]
        const next = line[i + 1]

        if (char === '"') {
            if (insideQuotes && next === '"') {
                i += 1
                continue
            }

            insideQuotes = !insideQuotes
            continue
        }

        if (insideQuotes) {
            continue
        }

        if (char === ',') {
            commaCount += 1
        }

        if (char === ';') {
            semicolonCount += 1
        }
    }

    return semicolonCount > commaCount ? ';' : ','
}

export function parseCsvBulkOrder(content: string): BulkOrderParseResult {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    if (lines.length === 0) {
        return {
            rows: [],
            issues: [{ rowNumber: 0, message: 'CSV file is empty.', rawLine: '', source: 'csv' }],
        }
    }

    const delimiter = detectDelimiter(lines[0])
    const headerColumns = parseDelimitedLine(lines[0], delimiter).map((header) => header.toLowerCase())

    const skuIndex = headerColumns.indexOf('sku')
    const quantityIndex = headerColumns.indexOf('quantity')
    const notesIndex = headerColumns.indexOf('notes')

    if (skuIndex === -1 || quantityIndex === -1 || notesIndex === -1) {
        return {
            rows: [],
            issues: [{
                rowNumber: 1,
                message: 'CSV headers must include sku, quantity, and notes.',
                rawLine: lines[0],
                source: 'csv',
            }],
        }
    }

    const rows: BulkOrderInputRow[] = []
    const issues: BulkOrderRowIssue[] = []

    lines.slice(1).forEach((line, index) => {
        const rowNumber = index + 2
        const columns = parseDelimitedLine(line, delimiter)
        const sku = (columns[skuIndex] || '').trim()
        const quantityRaw = (columns[quantityIndex] || '').trim()
        const notes = (columns[notesIndex] || '').trim()

        const skuError = validateSKU(sku)
        if (skuError) {
            issues.push({ rowNumber, message: skuError, rawLine: line, source: 'csv' })
            return
        }

        const quantity = Number.parseInt(quantityRaw, 10)
        if (!Number.isFinite(quantity) || quantity <= 0) {
            issues.push({ rowNumber, message: 'Quantity must be a positive whole number.', rawLine: line, source: 'csv' })
            return
        }

        rows.push({ rowNumber, sku, quantity, notes, source: 'csv' })
    })

    return { rows, issues }
}

export function parseManualBulkOrder(content: string): BulkOrderParseResult {
    const lines = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)

    if (lines.length === 0) {
        return { rows: [], issues: [] }
    }

    const rows: BulkOrderInputRow[] = []
    const issues: BulkOrderRowIssue[] = []

    lines.forEach((line, index) => {
        const delimiter = detectDelimiter(line)
        const columns = parseDelimitedLine(line, delimiter)
        const rowNumber = index + 1
        const sku = (columns[0] || '').trim()
        const quantityRaw = (columns[1] || '').trim()
        const notes = (columns[2] || '').trim()

        const skuError = validateSKU(sku)
        if (skuError) {
            issues.push({ rowNumber, message: skuError, rawLine: line, source: 'manual' })
            return
        }

        const quantity = Number.parseInt(quantityRaw, 10)
        if (!Number.isFinite(quantity) || quantity <= 0) {
            issues.push({ rowNumber, message: 'Quantity must be a positive whole number.', rawLine: line, source: 'manual' })
            return
        }

        rows.push({ rowNumber, sku, quantity, notes, source: 'manual' })
    })

    return { rows, issues }
}
