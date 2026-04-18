import path from 'path'
import { readFile } from 'fs/promises'
import * as xlsx from 'xlsx'

export type SourceColumnKey =
    | 'co'
    | 'nazwa'
    | 'opis'
    | 'url_produktu'
    | 'zdjecie_glowne'
    | 'zdjecia_produktu_pozostale'
    | 'sku_nokaut'
    | 'sku_stan'
    | 'stan'
    | 'netto'
    | 'brutto'
    | 'sku_info'
    | 'ena'
    | 'cn'
    | 'waga'

type SourceColumnDefinition = {
    key: SourceColumnKey
    header: string
    sourceUrl: string
    semanticKey: string
    index: number
}

export type WorkbookSourceConfig = {
    columns: SourceColumnDefinition[]
    sourceUrls: {
        nokaut: string
        stock: string
        info: string
    }
}

const COLUMN_KEYS: SourceColumnKey[] = [
    'co',
    'nazwa',
    'opis',
    'url_produktu',
    'zdjecie_glowne',
    'zdjecia_produktu_pozostale',
    'sku_nokaut',
    'sku_stan',
    'stan',
    'netto',
    'brutto',
    'sku_info',
    'ena',
    'cn',
    'waga',
]

function toCellValue(cell: unknown): string {
    if (cell === null || cell === undefined) return ''
    return String(cell).trim()
}

function findSourceUrl(definitions: SourceColumnDefinition[], key: SourceColumnKey): string {
    const url = definitions.find((column) => column.key === key)?.sourceUrl ?? ''
    if (!url) {
        throw new Error(`Missing source URL for workbook column key: ${key}`)
    }

    return url
}

export async function readWorkbookSourceConfig(): Promise<WorkbookSourceConfig> {
    const workbookPath = path.join(process.cwd(), 'public', 'dane.xlsx')
    const workbookBuffer = await readFile(workbookPath)
    const workbook = xlsx.read(workbookBuffer, { type: 'buffer' })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
        throw new Error('No worksheet found in public/dane.xlsx')
    }

    const worksheet = workbook.Sheets[firstSheetName]
    const rows = xlsx.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
    }) as unknown[][]

    if (rows.length < 3) {
        throw new Error('public/dane.xlsx must contain headers row, links row, and semantic mapping row')
    }

    const headers = rows[0].map(toCellValue)
    const linkRow = rows[1].map(toCellValue)
    const semanticRow = rows[2].map(toCellValue)

    if (headers.length < COLUMN_KEYS.length) {
        throw new Error('public/dane.xlsx has fewer columns than expected for source-of-truth mapping')
    }

    const columns: SourceColumnDefinition[] = COLUMN_KEYS.map((key, index) => ({
        key,
        header: headers[index] ?? '',
        sourceUrl: linkRow[index] ?? '',
        semanticKey: semanticRow[index] ?? '',
        index,
    }))

    return {
        columns,
        sourceUrls: {
            nokaut: findSourceUrl(columns, 'nazwa'),
            stock: findSourceUrl(columns, 'sku_stan'),
            info: findSourceUrl(columns, 'sku_info'),
        },
    }
}
