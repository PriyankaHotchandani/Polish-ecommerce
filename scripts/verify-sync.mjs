import path from 'path'
import xlsx from 'xlsx'
import { createClient } from '@supabase/supabase-js'

const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

for (const name of REQUIRED_ENV) {
    if (!process.env[name]) {
        console.error(`Missing required env: ${name}`)
        process.exit(1)
    }
}

const workbookPath = path.join(process.cwd(), 'public', 'dane.xlsx')
const workbook = xlsx.readFile(workbookPath)
const sheet = workbook.Sheets[workbook.SheetNames[0]]
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' })

if (!rows[0] || !rows[1] || !rows[2]) {
    console.error('dane.xlsx must include header row, links row, and semantic row.')
    process.exit(1)
}

const links = rows[1]
const nokautUrl = String(links[1] || '').trim()
const stockUrl = String(links[7] || '').trim()
const infoUrl = String(links[11] || '').trim()

if (!nokautUrl || !stockUrl || !infoUrl) {
    console.error('Could not resolve feed URLs from dane.xlsx row 2.')
    process.exit(1)
}

function toNum(v) {
    const n = Number.parseFloat(String(v).replace(',', '.'))
    return Number.isFinite(n) ? n : null
}

function parseStock(text) {
    const out = new Map()
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim()
        if (!line || line.toUpperCase().startsWith('SKU|')) continue
        const [sku, stan, netto, brutto] = line.split('|').map((x) => x?.trim() || '')
        if (!sku) continue
        out.set(sku, {
            sku,
            stan: Number.parseInt(stan, 10),
            netto: toNum(netto),
            brutto: toNum(brutto),
        })
    }
    return out
}

function parseInfo(text) {
    const out = new Map()
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trim()
        if (!line) continue
        const [sku, ena, cn, waga] = line.split('|').map((x) => x?.trim() || '')
        if (!sku) continue
        out.set(sku, {
            sku,
            ena: ena || null,
            cn: cn || null,
            waga: toNum(waga),
        })
    }
    return out
}

function decodeEntities(value) {
    return value
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
}

function extractTag(src, name) {
    const match = src.match(new RegExp(`<${name}>([\\s\\S]*?)<\\/${name}>`, 'i'))
    return match?.[1] ? decodeEntities(match[1].trim()) : null
}

function extractProperty(src, propName) {
    const cdata = src.match(new RegExp(`<property\\s+name=["']${propName}["']>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/property>`, 'i'))
    if (cdata?.[1]) return decodeEntities(cdata[1].trim())
    const plain = src.match(new RegExp(`<property\\s+name=["']${propName}["']>([\\s\\S]*?)<\\/property>`, 'i'))
    return plain?.[1] ? decodeEntities(plain[1].trim()) : null
}

function parseNokaut(xml) {
    const offers = Array.from(xml.matchAll(/<offer>([\s\S]*?)<\/offer>/gi)).map((m) => m[0])
    const out = new Map()
    for (const offer of offers) {
        const sku = extractProperty(offer, 'mpn')
        if (!sku) continue
        out.set(sku, {
            sku,
            co: extractTag(offer, 'id'),
            nazwa: extractTag(offer, 'name'),
            url: extractTag(offer, 'url'),
            image: extractTag(offer, 'image'),
        })
    }
    return out
}

async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'verify-sync/1.0' } })
    if (!res.ok) throw new Error(`Failed fetching ${url}: ${res.status}`)
    return await res.text()
}

function nearlyEqual(a, b, epsilon = 0.01) {
    if (a === null && b === null) return true
    if (a === null || b === null) return false
    return Math.abs(Number(a) - Number(b)) <= epsilon
}

function* chunk(values, size) {
    for (let i = 0; i < values.length; i += size) {
        yield values.slice(i, i + size)
    }
}

const [stockText, infoText, nokautXml] = await Promise.all([
    fetchText(stockUrl),
    fetchText(infoUrl),
    fetchText(nokautUrl),
])

const stock = parseStock(stockText)
const info = parseInfo(infoText)
const nokaut = parseNokaut(nokautXml)

const candidateSkus = Array.from(nokaut.keys()).filter((sku) => stock.has(sku) || info.has(sku))
const sampleSkus = candidateSkus.slice(0, 30)

if (sampleSkus.length === 0) {
    console.error('No sample SKUs resolved from feeds.')
    process.exit(1)
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
})

const dbRows = []
for (const group of chunk(sampleSkus, 100)) {
    const { data, error } = await supabase
        .from('products')
        .select('sku, source_co, source_nazwa, source_url_produktu, source_zdjecie_glowne, source_stan, source_netto, source_brutto, source_ena, source_cn, source_waga, inventory_count, price_wholesale, price_retail')
        .in('sku', group)

    if (error) {
        console.error('DB query failed:', error.message)
        process.exit(1)
    }

    dbRows.push(...(data || []))
}

const bySku = new Map(dbRows.map((r) => [r.sku, r]))
const mismatches = []

for (const sku of sampleSkus) {
    const db = bySku.get(sku)
    const s = stock.get(sku)
    const i = info.get(sku)
    const n = nokaut.get(sku)

    if (!db) {
        mismatches.push({ sku, field: 'db_row', expected: 'present', actual: 'missing' })
        continue
    }

    if (n && db.source_nazwa !== n.nazwa) mismatches.push({ sku, field: 'source_nazwa', expected: n.nazwa, actual: db.source_nazwa })
    if (n && db.source_url_produktu !== n.url) mismatches.push({ sku, field: 'source_url_produktu', expected: n.url, actual: db.source_url_produktu })
    if (n && db.source_zdjecie_glowne !== n.image) mismatches.push({ sku, field: 'source_zdjecie_glowne', expected: n.image, actual: db.source_zdjecie_glowne })
    if (n && db.source_co !== n.co) mismatches.push({ sku, field: 'source_co', expected: n.co, actual: db.source_co })

    if (s && db.source_stan !== s.stan) mismatches.push({ sku, field: 'source_stan', expected: s.stan, actual: db.source_stan })
    if (s && !nearlyEqual(db.source_netto, s.netto)) mismatches.push({ sku, field: 'source_netto', expected: s.netto, actual: db.source_netto })
    if (s && !nearlyEqual(db.source_brutto, s.brutto)) mismatches.push({ sku, field: 'source_brutto', expected: s.brutto, actual: db.source_brutto })

    if (i && db.source_ena !== i.ena) mismatches.push({ sku, field: 'source_ena', expected: i.ena, actual: db.source_ena })
    if (i && db.source_cn !== i.cn) mismatches.push({ sku, field: 'source_cn', expected: i.cn, actual: db.source_cn })
    if (i && !nearlyEqual(db.source_waga, i.waga, 0.001)) mismatches.push({ sku, field: 'source_waga', expected: i.waga, actual: db.source_waga })

    if (s && db.inventory_count !== s.stan) mismatches.push({ sku, field: 'inventory_count', expected: s.stan, actual: db.inventory_count })
    if (s && !nearlyEqual(db.price_wholesale, s.netto)) mismatches.push({ sku, field: 'price_wholesale', expected: s.netto, actual: db.price_wholesale })
    if (s && !nearlyEqual(db.price_retail, s.brutto)) mismatches.push({ sku, field: 'price_retail', expected: s.brutto, actual: db.price_retail })
}

console.log(`Verified SKUs: ${sampleSkus.length}`)
console.log(`Rows found in DB: ${dbRows.length}`)
console.log(`Mismatches: ${mismatches.length}`)

if (mismatches.length) {
    console.log('--- mismatch sample (first 50) ---')
    for (const row of mismatches.slice(0, 50)) {
        console.log(JSON.stringify(row))
    }
    process.exit(2)
}

console.log('All checked values match feed/source mappings.')
