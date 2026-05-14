/**
 * Client-side translation utility using Google Translate API
 * No API key needed, cached results to avoid repeated calls
 */

const GOOGLE_TRANSLATE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single'
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

type CacheEntry = {
    text: string
    timestamp: number
}

type GoogleTranslateResponse = Array<Array<[string, string, unknown, unknown]>>

const translationCache = new Map<string, CacheEntry>()

function getCacheKey(text: string, sourceLang: string, targetLang: string): string {
    return `${sourceLang}_${targetLang}_${text}`
}

function isResponseCacheValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < CACHE_DURATION_MS
}

export async function translateText(
    text: string | null | undefined,
    targetLang: 'en' | 'pl' = 'en',
    sourceLang: 'pl' | 'en' = 'pl'
): Promise<string | null> {
    if (!text || text.trim() === '') {
        return text || null
    }

    // If already in target language, return as-is
    if (sourceLang === targetLang) {
        return text
    }

    const cacheKey = getCacheKey(text, sourceLang, targetLang)

    // Check cache first
    const cached = translationCache.get(cacheKey)
    if (cached && isResponseCacheValid(cached)) {
        return cached.text
    }

    try {
        const url = new URL(GOOGLE_TRANSLATE_ENDPOINT)
        url.searchParams.set('client', 'gtx')
        url.searchParams.set('sl', sourceLang)
        url.searchParams.set('tl', targetLang)
        url.searchParams.set('dt', 't')
        url.searchParams.set('q', text)

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'User-Agent': 'Polish-ecommerce/1.0',
            },
        })

        if (!response.ok) {
            console.warn(`Translation API returned ${response.status}`)
            return text
        }

        const json = (await response.json()) as GoogleTranslateResponse

        // Parse Google Translate response format
        if (Array.isArray(json) && json[0] && Array.isArray(json[0])) {
            const translated = json[0]
                .map((item) => {
                    if (Array.isArray(item) && item[0]) {
                        return String(item[0])
                    }
                    return ''
                })
                .join('')

            // Cache the result
            translationCache.set(cacheKey, {
                text: translated,
                timestamp: Date.now(),
            })

            return translated
        }

        return text
    } catch (error) {
        console.warn('Translation error:', error)
        return text
    }
}

export function getTranslationOrFallback(
    translations: { en?: string | null; pl?: string | null } | null | undefined,
    baseText: string | null | undefined,
    targetLocale: 'en' | 'pl'
): { text: string | null; needsTranslation: boolean } {
    // If we have DB translations, use them
    if (translations) {
        const dbTranslation = targetLocale === 'en' ? translations.en : translations.pl
        if (dbTranslation) {
            return { text: dbTranslation, needsTranslation: false }
        }
    }

    // Fall back to base text and mark as needing translation
    return { text: baseText || null, needsTranslation: targetLocale === 'en' && Boolean(baseText) }
}
