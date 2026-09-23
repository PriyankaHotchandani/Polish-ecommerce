// Source-of-truth column/URL mapping, precompiled from public/dane.xlsx.
//
// This used to parse the workbook per request with fs.readFile. That works on
// Node but not on Cloudflare Workers, which have no filesystem — every sync run
// there failed with "[unenv] fs.readFile is not implemented yet!". The workbook
// is committed to the repo and only changes with a deploy, so it is compiled to
// JSON at build time by scripts/generate-source-config.mjs instead. Regenerate
// with `npm run generate:source-config` after editing public/dane.xlsx (the
// build scripts already do this).

import generatedConfig from '@/utils/generated/sourceWorkbookConfig.json'

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

const SOURCE_CONFIG = generatedConfig as WorkbookSourceConfig

/**
 * Async purely to preserve the previous call signature; the config is now a
 * compile-time constant, so this never touches the network or a filesystem.
 */
export async function readWorkbookSourceConfig(): Promise<WorkbookSourceConfig> {
    return SOURCE_CONFIG
}
