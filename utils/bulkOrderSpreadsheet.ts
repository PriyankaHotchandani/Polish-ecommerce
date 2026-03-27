import { read, utils, writeFileXLSX } from 'xlsx'

type Locale = 'en' | 'pl'

const HEADERS = [
    'sku',
    'quantity',
    'notes',
    'delivery_window',
    'warehouse',
    'priority',
    'purchase_order_ref',
    'cost_center',
    'requested_by',
    'phone',
    'email',
]

const EN_SAMPLE_ROWS = [
    ['SKU-1001', 12, 'Restock warehouse A', '2026-04-02', 'Warsaw-North', 'high', 'PO-2026-041', 'OPS-01', 'Anna Kowalska', '+48 501 200 300', 'anna@company.com'],
    ['SKU-2200', 4, 'Priority replenishment', '2026-04-01', 'Krakow-Central', 'urgent', 'PO-2026-042', 'OPS-01', 'Marek Nowak', '+48 501 200 301', 'marek@company.com'],
    ['SKU-9002', 2, 'Showroom pack', '2026-04-05', 'Poznan-West', 'normal', 'PO-2026-043', 'MKT-03', 'Ewa Wisniewska', '+48 501 200 302', 'ewa@company.com'],
    ['SKU-1500', 30, 'Monthly refill', '2026-04-03', 'Warsaw-North', 'normal', 'PO-2026-044', 'OPS-02', 'Piotr Zielinski', '+48 501 200 303', 'piotr@company.com'],
    ['SKU-4810', 16, 'Branch opening stock', '2026-04-07', 'Gdansk-Port', 'high', 'PO-2026-045', 'OPS-04', 'Katarzyna Lewandowska', '+48 501 200 304', 'katarzyna@company.com'],
    ['SKU-3301', 8, 'Maintenance kits', '2026-04-02', 'Lodz-South', 'normal', 'PO-2026-046', 'SERV-02', 'Tomasz Kowalczyk', '+48 501 200 305', 'tomasz@company.com'],
    ['SKU-7615', 24, 'Weekly replenishment', '2026-04-06', 'Wroclaw-Main', 'high', 'PO-2026-047', 'OPS-05', 'Magdalena Dabrowska', '+48 501 200 306', 'magda@company.com'],
    ['SKU-8400', 6, 'Client installation set', '2026-04-04', 'Warsaw-North', 'urgent', 'PO-2026-048', 'PROJ-09', 'Lukasz Wozniak', '+48 501 200 307', 'lukasz@company.com'],
    ['SKU-5552', 11, 'Spare components', '2026-04-08', 'Szczecin-East', 'normal', 'PO-2026-049', 'SERV-04', 'Joanna Kaminska', '+48 501 200 308', 'joanna@company.com'],
    ['SKU-1170', 20, 'Contract refill', '2026-04-09', 'Katowice-Central', 'high', 'PO-2026-050', 'OPS-06', 'Rafal Kaczmarek', '+48 501 200 309', 'rafal@company.com'],
]

const PL_SAMPLE_ROWS = [
    ['SKU-1001', 12, 'Uzupelnienie magazynu A', '2026-04-02', 'Warszawa-Polnoc', 'wysoki', 'PO-2026-041', 'OPS-01', 'Anna Kowalska', '+48 501 200 300', 'anna@firma.pl'],
    ['SKU-2200', 4, 'Pilna dostawa', '2026-04-01', 'Krakow-Centrum', 'pilny', 'PO-2026-042', 'OPS-01', 'Marek Nowak', '+48 501 200 301', 'marek@firma.pl'],
    ['SKU-9002', 2, 'Pakiet do showroomu', '2026-04-05', 'Poznan-Zachod', 'normalny', 'PO-2026-043', 'MKT-03', 'Ewa Wisniewska', '+48 501 200 302', 'ewa@firma.pl'],
    ['SKU-1500', 30, 'Miesieczne uzupelnienie', '2026-04-03', 'Warszawa-Polnoc', 'normalny', 'PO-2026-044', 'OPS-02', 'Piotr Zielinski', '+48 501 200 303', 'piotr@firma.pl'],
    ['SKU-4810', 16, 'Zapas na otwarcie oddzialu', '2026-04-07', 'Gdansk-Port', 'wysoki', 'PO-2026-045', 'OPS-04', 'Katarzyna Lewandowska', '+48 501 200 304', 'katarzyna@firma.pl'],
    ['SKU-3301', 8, 'Zestawy serwisowe', '2026-04-02', 'Lodz-Poludnie', 'normalny', 'PO-2026-046', 'SERW-02', 'Tomasz Kowalczyk', '+48 501 200 305', 'tomasz@firma.pl'],
    ['SKU-7615', 24, 'Cotygodniowe uzupelnienie', '2026-04-06', 'Wroclaw-Glowny', 'wysoki', 'PO-2026-047', 'OPS-05', 'Magdalena Dabrowska', '+48 501 200 306', 'magda@firma.pl'],
    ['SKU-8400', 6, 'Zestaw dla klienta', '2026-04-04', 'Warszawa-Polnoc', 'pilny', 'PO-2026-048', 'PROJ-09', 'Lukasz Wozniak', '+48 501 200 307', 'lukasz@firma.pl'],
    ['SKU-5552', 11, 'Komponenty zapasowe', '2026-04-08', 'Szczecin-Wschod', 'normalny', 'PO-2026-049', 'SERW-04', 'Joanna Kaminska', '+48 501 200 308', 'joanna@firma.pl'],
    ['SKU-1170', 20, 'Uzupelnienie kontraktowe', '2026-04-09', 'Katowice-Centrum', 'wysoki', 'PO-2026-050', 'OPS-06', 'Rafal Kaczmarek', '+48 501 200 309', 'rafal@firma.pl'],
]

export function getSampleManualRows(locale: Locale): string {
    const rows = locale === 'pl' ? PL_SAMPLE_ROWS : EN_SAMPLE_ROWS
    return rows.slice(0, 3).map((row) => `${row[0]},${row[1]},${row[2]}`).join('\n')
}

export function downloadBulkOrderTemplateWorkbook(locale: Locale): void {
    const rows = locale === 'pl' ? PL_SAMPLE_ROWS : EN_SAMPLE_ROWS
    const templateData = [HEADERS, ...rows]

    const instructionsData = locale === 'pl'
        ? [
            ['Instrukcje', 'Opis'],
            ['Cel', 'Uzyj arkusza Bulk Order Template do szybkiego uzupelniania SKU.'],
            ['Wymagane kolumny', 'sku, quantity, notes'],
            ['Dopuszczalne formaty', 'Mozesz zostawic dodatkowe kolumny, system je zignoruje.'],
            ['Separator', 'Obslugiwane sa przecinek i srednik.'],
            ['Wskazowka', 'Po wypelnieniu zapisz jako CSV i przeslij w formularzu Bulk Order.'],
        ]
        : [
            ['Instructions', 'Details'],
            ['Purpose', 'Use the Bulk Order Template sheet to replenish SKUs quickly.'],
            ['Required columns', 'sku, quantity, notes'],
            ['Accepted format', 'You can keep additional columns; the system will ignore them.'],
            ['Delimiter', 'Both comma and semicolon are supported.'],
            ['Tip', 'After editing, save as CSV and upload it in the Bulk Order form.'],
        ]

    const workbook = utils.book_new()
    const templateSheet = utils.aoa_to_sheet(templateData)
    const instructionsSheet = utils.aoa_to_sheet(instructionsData)

    templateSheet['!cols'] = [
        { wch: 16 },
        { wch: 10 },
        { wch: 32 },
        { wch: 16 },
        { wch: 18 },
        { wch: 10 },
        { wch: 18 },
        { wch: 14 },
        { wch: 18 },
        { wch: 16 },
        { wch: 24 },
    ]

    instructionsSheet['!cols'] = [{ wch: 22 }, { wch: 78 }]

    utils.book_append_sheet(workbook, templateSheet, 'Bulk Order Template')
    utils.book_append_sheet(workbook, instructionsSheet, 'Instructions')

    writeFileXLSX(workbook, 'bulk-order-template.xlsx')
}

export async function extractBulkOrderTextFromFile(file: File): Promise<string> {
    const lowerName = file.name.toLowerCase()
    const isSpreadsheet = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')

    if (!isSpreadsheet) {
        return file.text()
    }

    const buffer = await file.arrayBuffer()
    const workbook = read(buffer, { type: 'array' })
    const firstSheetName = workbook.SheetNames[0]

    if (!firstSheetName) {
        return ''
    }

    const firstSheet = workbook.Sheets[firstSheetName]
    return utils.sheet_to_csv(firstSheet, { FS: ',', RS: '\n' })
}
