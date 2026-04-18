import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'
import { readWorkbookSourceConfig } from '@/utils/sourceWorkbook'
import { translateUniqueMap } from '@/utils/deeplTranslation'
import type { Database } from '@/types/database.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StockFeedRow = {
    sku: string
    stan: number
    netto: number
    brutto: number
}

type InfoFeedRow = {
    sku: string
    ena: string | null
    cn: string | null
    waga: number | null
}

type NokautOfferRow = {
    co: string | null
    nazwa: string | null
    opis: string | null
    url_produktu: string | null
    zdjecie_glowne: string | null
    zdjecia_produktu_pozostale: string[]
    sku_nokaut: string | null
    brand: string | null
    category_path: string | null
}

type LogSyncRunParams = {
    p_status: 'success' | 'failed'
    p_updated_rows: number
    p_inventory_rows_parsed: number
    p_info_rows_parsed: number
    p_error_message?: string | null
}

type CategoryInsert = Database['public']['Tables']['categories']['Insert']
type ProductInsert = Database['public']['Tables']['products']['Insert']

function ensureEnv(name: string): string {
    const value = process.env[name]
    if (!value || value.trim() === '' || value === 'undefined' || value === 'null') {
        throw new Error(`Missing required environment variable: ${name}`)
    }

    return value
}

async function logSyncRun(
    supabase: ReturnType<typeof createServiceClient>,
    params: LogSyncRunParams
) {
    const { error } = await supabase
        .from('supplier_sync_runs')
        .insert({
            status: params.p_status,
            updated_rows: Math.max(0, params.p_updated_rows || 0),
            inventory_rows_parsed: Math.max(0, params.p_inventory_rows_parsed || 0),
            info_rows_parsed: Math.max(0, params.p_info_rows_parsed || 0),
            error_message: params.p_error_message || null,
        } as never)

    if (error) {
        console.error('Failed to insert supplier sync log:', error.message)
    }
}

function normalizeDecimal(value: string): number | null {
    const normalized = value.trim().replace(',', '.')
    if (!normalized) return null

    const parsed = Number.parseFloat(normalized)
    return Number.isFinite(parsed) ? parsed : null
}

function normalizeInteger(value: string): number | null {
    const parsed = Number.parseInt(value.trim(), 10)
    return Number.isFinite(parsed) ? parsed : null
}

function normalizeForTranslation(value: string | null): string {
    if (!value) return ''

    return decodeXmlEntities(value)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3500)
}

function decodeXmlEntities(value: string): string {
    return value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
}

function slugify(value: string): string {
    return value
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 120)
}

function smallHash(value: string): string {
    let hash = 0
    for (let index = 0; index < value.length; index++) {
        hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
    }

    return Math.abs(hash).toString(16).slice(0, 6)
}

function extractTagValue(source: string, tagName: string): string | null {
    const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i')
    const match = source.match(regex)
    if (!match) return null

    const value = match[1]?.trim()
    return value ? decodeXmlEntities(value) : null
}

function extractTagCdataValue(source: string, tagName: string): string | null {
    const cdataRegex = new RegExp(`<${tagName}>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tagName}>`, 'i')
    const cdataMatch = source.match(cdataRegex)
    if (cdataMatch) {
        const value = cdataMatch[1]?.trim()
        return value || null
    }

    return extractTagValue(source, tagName)
}

function extractPropertyValue(source: string, propertyName: string): string | null {
    const cdataRegex = new RegExp(`<property\\s+name=["']${propertyName}["']>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/property>`, 'i')
    const cdataMatch = source.match(cdataRegex)
    if (cdataMatch) {
        const value = cdataMatch[1]?.trim()
        return value ? decodeXmlEntities(value) : null
    }

    const regex = new RegExp(`<property\\s+name=["']${propertyName}["']>([\\s\\S]*?)<\\/property>`, 'i')
    const match = source.match(regex)
    if (!match) return null

    const value = match[1]?.trim()
    return value ? decodeXmlEntities(value) : null
}

function extractGalleryImages(offerXml: string): string[] {
    const galleryMatch = offerXml.match(/<gallery>([\s\S]*?)<\/gallery>/i)
    if (!galleryMatch) return []

    const gallery = galleryMatch[1]
    if (!gallery) return []

    const images = Array.from(gallery.matchAll(/<image>([\s\S]*?)<\/image>/gi))
        .map((entry) => decodeXmlEntities((entry[1] || '').trim()))
        .filter(Boolean)

    return Array.from(new Set(images))
}

function parseNokautFeed(content: string): NokautOfferRow[] {
    const offers = Array.from(content.matchAll(/<offer>([\s\S]*?)<\/offer>/gi))
    const rows: NokautOfferRow[] = []

    for (const offerMatch of offers) {
        const offerXml = offerMatch[0]
        if (!offerXml) continue

        const co = extractTagValue(offerXml, 'id')
        const nazwa = extractTagValue(offerXml, 'name')
        const opisRaw = extractTagCdataValue(offerXml, 'description')
        const urlProduktu = extractTagValue(offerXml, 'url')
        const zdjecieGlowne = extractTagValue(offerXml, 'image')
        const skuNokaut = extractPropertyValue(offerXml, 'mpn')
        const brand = extractTagValue(offerXml, 'producer')
        const categoryPath = extractTagValue(offerXml, 'category')
        const galleryImages = extractGalleryImages(offerXml)

        rows.push({
            co,
            nazwa,
            opis: opisRaw,
            url_produktu: urlProduktu,
            zdjecie_glowne: zdjecieGlowne,
            zdjecia_produktu_pozostale: galleryImages,
            sku_nokaut: skuNokaut,
            brand,
            category_path: categoryPath,
        })
    }

    return rows
}

function parseStockFeed(content: string): StockFeedRow[] {
    const rows: StockFeedRow[] = []
    const lines = content.split(/\r?\n/)

    for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) continue

        const parts = line.split('|').map((part) => part.trim())
        if (parts.length < 4) continue

        if (parts[0].toUpperCase() === 'SKU') continue

        const sku = parts[0]
        const stan = normalizeInteger(parts[1])
        const netto = normalizeDecimal(parts[2])
        const brutto = normalizeDecimal(parts[3])

        if (!sku || stan === null || netto === null || brutto === null) {
            continue
        }

        rows.push({
            sku,
            stan: Math.max(0, stan),
            netto,
            brutto,
        })
    }

    return rows
}

function parseInfoFeed(content: string): InfoFeedRow[] {
    const rows: InfoFeedRow[] = []
    const lines = content.split(/\r?\n/)

    for (const rawLine of lines) {
        const line = rawLine.trim()
        if (!line) continue

        const parts = line.split('|').map((part) => part.trim())
        if (parts.length < 4) continue

        const sku = parts[0]
        if (!sku || sku.toUpperCase() === 'SKU') continue

        const ena = parts[1] || null
        const cn = parts[2] || null
        const waga = normalizeDecimal(parts[3])

        rows.push({
            sku,
            ena,
            cn,
            waga,
        })
    }

    return rows
}

async function upsertCategories(
    supabase: ReturnType<typeof createServiceClient>,
    categoryPaths: string[],
    categoryTranslations: Map<string, string>
): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    const uniquePaths = Array.from(new Set(categoryPaths.map((path) => path.trim()).filter(Boolean)))

    if (uniquePaths.length === 0) {
        return map
    }

    const upserts = uniquePaths.map((categoryPath) => {
        const parts = categoryPath.split('/').map((part) => part.trim()).filter(Boolean)
        const leafName = parts[parts.length - 1] || categoryPath
        const slugBase = slugify(categoryPath) || slugify(leafName) || 'category'
        const slug = `${slugBase}-${smallHash(categoryPath)}`

        return {
            sourcePath: categoryPath,
            payload: {
                name: leafName,
                slug,
                name_translations: {
                    pl: leafName,
                    en: categoryTranslations.get(leafName) || leafName,
                },
                updated_at: new Date().toISOString(),
            },
        }
    })

    const categoryPayload: CategoryInsert[] = upserts.map((entry) => entry.payload)

    const { data, error } = await supabase
        .from('categories')
        .upsert(categoryPayload as never, { onConflict: 'slug' })
        .select('id, slug')

    if (error) {
        throw new Error(`Category upsert failed: ${error.message}`)
    }

    const typedRows = (data || []) as Array<{ id: string, slug: string }>
    const idBySlug = new Map(typedRows.map((row) => [row.slug, row.id]))

    for (const entry of upserts) {
        const categoryId = idBySlug.get(entry.payload.slug)
        if (categoryId) {
            map.set(entry.sourcePath, categoryId)
        }
    }

    return map
}

async function fetchExistingProductMeta(
    supabase: ReturnType<typeof createServiceClient>,
    skus: string[]
): Promise<Map<string, { slug: string }>> {
    const map = new Map<string, { slug: string }>()
    const uniqueSkus = Array.from(new Set(skus.filter(Boolean)))
    const chunkSize = 250

    for (let index = 0; index < uniqueSkus.length; index += chunkSize) {
        const chunk = uniqueSkus.slice(index, index + chunkSize)
        const { data, error } = await supabase
            .from('products')
            .select('sku, slug')
            .in('sku', chunk)

        if (error) {
            throw new Error(`Failed to load existing product metadata: ${error.message}`)
        }

        const typedRows = (data || []) as Array<{ sku: string, slug: string }>

        for (const row of typedRows) {
            if (row.sku) {
                map.set(row.sku, { slug: row.slug })
            }
        }
    }

    return map
}

function chunkArray<T>(values: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let index = 0; index < values.length; index += chunkSize) {
        chunks.push(values.slice(index, index + chunkSize))
    }

    return chunks
}

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.INVENTORY_SYNC_SECRET || process.env.CRON_SECRET
    if (!secret) {
        return false
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${secret}`) {
        return true
    }

    const syncHeader = request.headers.get('x-sync-secret')
    if (syncHeader === secret) {
        return true
    }

    return false
}

async function fetchText(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'Accept': 'text/plain,text/*,*/*',
            'User-Agent': 'Polish-ecommerce-inventory-sync/1.0',
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        throw new Error(`Feed request failed (${response.status}) for ${url}`)
    }

    return response.text()
}

async function runSync(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    ensureEnv('NEXT_PUBLIC_SUPABASE_URL')
    ensureEnv('SUPABASE_SERVICE_ROLE_KEY')

    const sourceConfig = await readWorkbookSourceConfig()
    const stockFeedUrl = process.env.SUPPLIER_STOCK_FEED_URL || sourceConfig.sourceUrls.stock
    const infoFeedUrl = process.env.SUPPLIER_INFO_FEED_URL || sourceConfig.sourceUrls.info
    const nokautFeedUrl = process.env.SUPPLIER_NOKAUT_FEED_URL || sourceConfig.sourceUrls.nokaut

    const supabase = createServiceClient()

    let stockRows: StockFeedRow[] = []
    let infoRows: InfoFeedRow[] = []
    let nokautRows: NokautOfferRow[] = []
    let updatedRows = 0

    try {
        const [nokautRaw, stockRaw, infoRaw] = await Promise.all([
            fetchText(nokautFeedUrl),
            fetchText(stockFeedUrl),
            fetchText(infoFeedUrl),
        ])

        nokautRows = parseNokautFeed(nokautRaw)
        stockRows = parseStockFeed(stockRaw)
        infoRows = parseInfoFeed(infoRaw)

        const stockBySku = new Map(stockRows.map((row) => [row.sku, row]))
        const infoBySku = new Map(infoRows.map((row) => [row.sku, row]))

        const allCategoryPaths = nokautRows
            .map((row) => row.category_path || '')
            .filter(Boolean)

        const categoryLeafNames = allCategoryPaths.map((path) => {
            const parts = path.split('/').map((part) => part.trim()).filter(Boolean)
            return parts[parts.length - 1] || path
        })

        const titleTranslations = await translateUniqueMap(
            nokautRows.map((row) => row.nazwa || ''),
            { sourceLang: 'PL', targetLang: 'EN' }
        )

        const descriptionTranslations = await translateUniqueMap(
            nokautRows.map((row) => normalizeForTranslation(row.opis)),
            { sourceLang: 'PL', targetLang: 'EN' }
        )

        const categoryTranslations = await translateUniqueMap(
            categoryLeafNames,
            { sourceLang: 'PL', targetLang: 'EN' }
        )

        const categoryIdByPath = await upsertCategories(supabase, allCategoryPaths, categoryTranslations)

        const skus = nokautRows
            .map((row) => row.sku_nokaut || '')
            .filter(Boolean)

        const existingBySku = await fetchExistingProductMeta(supabase, skus)

        const upsertPayload: ProductInsert[] = nokautRows
            .map((offer) => {
                const sku = offer.sku_nokaut?.trim() || ''
                const stock = stockBySku.get(sku)
                const info = infoBySku.get(sku)
                const categoryPath = offer.category_path || ''
                const categoryId = categoryIdByPath.get(categoryPath)
                const sourceTitle = offer.nazwa?.trim() || ''
                const sourceDescription = offer.opis?.trim() || null
                const sourceDescriptionForTranslation = normalizeForTranslation(sourceDescription)

                if (!sku || !sourceTitle || !categoryId) {
                    return null
                }

                const existing = existingBySku.get(sku)
                const computedSlug = slugify(`${sourceTitle}-${sku}`) || slugify(sku)

                const imageUrls = [
                    offer.zdjecie_glowne,
                    ...(offer.zdjecia_produktu_pozostale || []),
                ].filter(Boolean) as string[]

                const uniqueImageUrls = Array.from(new Set(imageUrls))
                const translatedTitle = titleTranslations.get(sourceTitle) || sourceTitle
                const translatedDescription = sourceDescriptionForTranslation
                    ? (descriptionTranslations.get(sourceDescriptionForTranslation) || sourceDescriptionForTranslation)
                    : null

                const payload: ProductInsert = {
                    sku,
                    title: sourceTitle,
                    slug: existing?.slug || computedSlug,
                    brand: offer.brand,
                    description: sourceDescription,
                    title_translations: {
                        pl: sourceTitle,
                        en: translatedTitle,
                    },
                    description_translations: translatedDescription
                        ? {
                            pl: sourceDescription,
                            en: translatedDescription,
                        }
                        : null,
                    price_retail: stock?.brutto ?? 0,
                    price_wholesale: stock?.netto ?? 0,
                    inventory_count: stock?.stan ?? 0,
                    category_id: categoryId,
                    image_urls: uniqueImageUrls.length > 0 ? uniqueImageUrls : null,
                    specifications: {
                        source_url_produktu: offer.url_produktu,
                        source_cn: info?.cn || null,
                        source_ena: info?.ena || null,
                        source_waga: info?.waga ?? null,
                    },
                    source_co: offer.co,
                    source_nazwa: offer.nazwa,
                    source_opis: offer.opis,
                    source_url_produktu: offer.url_produktu,
                    source_zdjecie_glowne: offer.zdjecie_glowne,
                    source_zdjecia_produktu_pozostale: offer.zdjecia_produktu_pozostale,
                    source_sku_nokaut: sku,
                    source_sku_stan: stock?.sku || null,
                    source_stan: stock?.stan ?? null,
                    source_netto: stock?.netto ?? null,
                    source_brutto: stock?.brutto ?? null,
                    source_sku_info: info?.sku || null,
                    source_ena: info?.ena || null,
                    source_cn: info?.cn || null,
                    source_waga: info?.waga ?? null,
                    updated_at: new Date().toISOString(),
                }

                return payload
            })
            .filter((row): row is ProductInsert => Boolean(row))

        const payloadChunks = chunkArray(upsertPayload, 200)

        for (const chunk of payloadChunks) {
            const { error } = await supabase
                .from('products')
                .upsert(chunk as never, { onConflict: 'sku' })

            if (error) {
                throw new Error(`Product upsert failed: ${error.message}`)
            }

            updatedRows += chunk.length
        }

        await logSyncRun(supabase, {
            p_status: 'success',
            p_updated_rows: updatedRows,
            p_inventory_rows_parsed: stockRows.length,
            p_info_rows_parsed: infoRows.length,
            p_error_message: null,
        })

        return NextResponse.json({
            success: true,
            updatedRows,
            inventoryRowsParsed: stockRows.length,
            infoRowsParsed: infoRows.length,
            nokautRowsParsed: nokautRows.length,
            sourceColumns: sourceConfig.columns,
            syncedAt: new Date().toISOString(),
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Inventory sync failed'

        await logSyncRun(supabase, {
            p_status: 'failed',
            p_updated_rows: updatedRows,
            p_inventory_rows_parsed: stockRows.length,
            p_info_rows_parsed: infoRows.length,
            p_error_message: message,
        })

        throw error
    }
}

export async function GET(request: NextRequest) {
    try {
        return await runSync(request)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Inventory sync failed'
        return NextResponse.json(
            {
                error: errorMessage,
                stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        return await runSync(request)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Inventory sync failed'
        return NextResponse.json(
            {
                error: errorMessage,
                stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
            },
            { status: 500 }
        )
    }
}
