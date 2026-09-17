// Precompiles public/dane.xlsx into a JSON module imported by the sync route.
//
// The route used to parse the workbook at request time with fs.readFile, which
// works on Node but not on Cloudflare Workers — there is no filesystem there, so
// every sync run failed with "[unenv] fs.readFile is not implemented yet!".
// The workbook is committed to the repo and only changes with a deploy, so
// resolving it at build time is equivalent and removes both the filesystem
// dependency and the XLSX parsing cost from every request.
//
// Run via `npm run generate:source-config` (wired into the build scripts).

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as xlsx from 'xlsx'

const COLUMN_KEYS = [
    'co', 'nazwa', 'opis', 'url_produktu', 'zdjecie_glowne',
    'zdjecia_produktu_pozostale', 'sku_nokaut', 'sku_stan', 'stan',
    'netto', 'brutto', 'sku_info', 'ena', 'cn', 'waga',
]

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workbookPath = path.join(rootDir, 'public', 'dane.xlsx')
const outputPath = path.join(rootDir, 'utils', 'generated', 'sourceWorkbookConfig.json')

const toCellValue = (cell) => (cell === null || cell === undefined ? '' : String(cell).trim())

function findSourceUrl(columns, key) {
    const url = columns.find((column) => column.key === key)?.sourceUrl ?? ''
    if (!url) {
        throw new Error(`Missing source URL for workbook column key: ${key}`)
    }
    return url
}

const workbook = xlsx.read(await readFile(workbookPath), { type: 'buffer' })
const firstSheetName = workbook.SheetNames[0]
if (!firstSheetName) {
    throw new Error('No worksheet found in public/dane.xlsx')
}

const rows = xlsx.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: '',
    blankrows: false,
})

if (rows.length < 3) {
    throw new Error('public/dane.xlsx must contain headers row, links row, and semantic mapping row')
}

const headers = rows[0].map(toCellValue)
const linkRow = rows[1].map(toCellValue)
const semanticRow = rows[2].map(toCellValue)

if (headers.length < COLUMN_KEYS.length) {
    throw new Error('public/dane.xlsx has fewer columns than expected for source-of-truth mapping')
}

const columns = COLUMN_KEYS.map((key, index) => ({
    key,
    header: headers[index] ?? '',
    sourceUrl: linkRow[index] ?? '',
    semanticKey: semanticRow[index] ?? '',
    index,
}))

const config = {
    columns,
    sourceUrls: {
        nokaut: findSourceUrl(columns, 'nazwa'),
        stock: findSourceUrl(columns, 'sku_stan'),
        info: findSourceUrl(columns, 'sku_info'),
    },
}

await mkdir(path.dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8')

console.log(`Wrote ${path.relative(rootDir, outputPath)} (${config.columns.length} columns)`)
