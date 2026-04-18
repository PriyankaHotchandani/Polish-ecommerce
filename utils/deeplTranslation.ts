const DEFAULT_DEEPL_API_URL = 'https://api-free.deepl.com/v2/translate'
const GOOGLE_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single'

type DeepLTranslationResponse = {
    translations: Array<{
        text: string
    }>
}

type GoogleTranslateResponse = Array<
    Array<[string, string, unknown, unknown]>
>

export type TranslateTextOptions = {
    sourceLang?: 'PL' | 'EN'
    targetLang?: 'EN' | 'EN-GB' | 'EN-US' | 'PL'
    html?: boolean
}

function getDeepLConfig() {
    const apiKey = process.env.DEEPL_API_KEY
    const apiUrl = process.env.DEEPL_API_URL || DEFAULT_DEEPL_API_URL
    return { apiKey, apiUrl }
}

function normalizeLangCode(lang: string | undefined, fallback: 'pl' | 'en'): 'pl' | 'en' {
    if (!lang) return fallback
    return lang.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}

async function mapWithConcurrency<T, R>(
    items: T[],
    concurrency: number,
    worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
    const results = new Array<R>(items.length)
    let cursor = 0

    const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (true) {
            const index = cursor
            cursor += 1
            if (index >= items.length) {
                break
            }

            results[index] = await worker(items[index], index)
        }
    })

    await Promise.all(runners)
    return results
}

async function translateWithGooglePublic(
    text: string,
    sourceLang: 'pl' | 'en',
    targetLang: 'pl' | 'en'
): Promise<string> {
    const url = new URL(GOOGLE_TRANSLATE_ENDPOINT)
    url.searchParams.set('client', 'gtx')
    url.searchParams.set('sl', sourceLang)
    url.searchParams.set('tl', targetLang)
    url.searchParams.set('dt', 't')
    url.searchParams.set('q', text)

    const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
            'User-Agent': 'Polish-ecommerce-free-translate/1.0',
        },
        cache: 'no-store',
    })

    if (!response.ok) {
        const body = await response.text()
        throw new Error(`Free translation failed (${response.status}): ${body}`)
    }

    const json = await response.json() as GoogleTranslateResponse
    const translatedText = (json?.[0] || [])
        .map((segment) => segment?.[0] || '')
        .join('')
        .trim()

    return translatedText || text
}

export async function translateTexts(
    texts: string[],
    options: TranslateTextOptions = {}
): Promise<string[]> {
    const cleanTexts = texts.map((text) => text.trim())
    if (cleanTexts.length === 0) {
        return []
    }

    const { apiKey, apiUrl } = getDeepLConfig()

    if (!apiKey) {
        const sourceLang = normalizeLangCode(options.sourceLang, 'pl')
        const targetLang = normalizeLangCode(options.targetLang, 'en')

        return mapWithConcurrency(cleanTexts, 4, async (text, index) => {
            try {
                return await translateWithGooglePublic(text, sourceLang, targetLang)
            } catch {
                return cleanTexts[index]
            }
        })
    }

    const formData = new URLSearchParams()

    formData.set('auth_key', apiKey)
    formData.set('source_lang', options.sourceLang || 'PL')
    formData.set('target_lang', options.targetLang || 'EN')
    formData.set('preserve_formatting', '1')
    formData.set('split_sentences', 'nonewlines')

    if (options.html) {
        formData.set('tag_handling', 'html')
    }

    for (const text of cleanTexts) {
        formData.append('text', text)
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Polish-ecommerce-deepl-sync/1.0',
        },
        body: formData.toString(),
        cache: 'no-store',
    })

    if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`DeepL translation failed (${response.status}): ${responseText}`)
    }

    const json = await response.json() as DeepLTranslationResponse
    return json.translations.map((entry) => entry.text)
}

export async function translateUniqueMap(
    values: string[],
    options: TranslateTextOptions = {}
): Promise<Map<string, string>> {
    const uniqueValues = Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)))
    const translated = await translateTexts(uniqueValues, options)

    const map = new Map<string, string>()
    uniqueValues.forEach((value, index) => {
        map.set(value, translated[index] || value)
    })

    return map
}
