type Locale = 'en' | 'pl'

type TranslationMap = {
    en?: string | null
    pl?: string | null
} | null | undefined

const TITLE_CASE_LOWER_WORDS = new Set([
    'a',
    'an',
    'and',
    'as',
    'at',
    'by',
    'for',
    'from',
    'in',
    'of',
    'on',
    'or',
    'the',
    'to',
    'with',
    'i',
    'w',
    'z',
    'na',
    'do',
    'od',
    'po',
    'u',
    'oraz',
])

function toTitleCaseWords(value: string): string {
    let wordIndex = 0

    return value
        .split(/(\s+|\/|-)/)
        .map((token) => {
            if (!token || /^\s+$/.test(token) || token === '/' || token === '-') {
                return token
            }

            if (/\d/.test(token)) {
                wordIndex += 1
                return token
            }

            if (/^[A-Z]{2,4}$/.test(token)) {
                wordIndex += 1
                return token
            }

            const lowerToken = token.toLocaleLowerCase()
            if (wordIndex > 0 && TITLE_CASE_LOWER_WORDS.has(lowerToken)) {
                wordIndex += 1
                return lowerToken
            }

            wordIndex += 1
            return lowerToken.charAt(0).toLocaleUpperCase() + lowerToken.slice(1)
        })
        .join('')
}

const CATEGORY_NAME_BY_SLUG: Record<string, { en: string; pl: string }> = {
    kitchenware: {
        en: 'Kitchenware',
        pl: 'Wyposazenie kuchni',
    },
    'power-tools': {
        en: 'Power Tools',
        pl: 'Elektronarzedzia',
    },
}

const PL_PRODUCT_TITLE_BY_SLUG: Record<string, string> = {
    'premium-stainless-steel-electric-kettle': 'Czajnik elektryczny ze stali nierdzewnej Premium',
    'non-stick-ceramic-frying-pan-28cm': 'Ceramiczna patelnia nieprzywierajaca 28 cm',
    'professional-5-piece-kitchen-knife-set': 'Profesjonalny zestaw 5 nozy kuchennych',
    'high-speed-smoothie-blender-1200w': 'Blender wysokiej mocy do smoothie 1200 W',
    'french-press-coffee-maker-1l': 'Zaparzacz French Press 1 l',
    'cordless-drill-driver-18v-li-ion': 'Wkretarko-wiertarka akumulatorowa 18 V Li-Ion',
    'angle-grinder-125mm-900w': 'Szlifierka katowa 125 mm 900 W',
    'rotary-hammer-drill-sds-plus-800w': 'Mlotowiertarka SDS-Plus 800 W',
    'circular-saw-190mm-1400w': 'Pilarka tarczowa 190 mm 1400 W',
    'orbital-sander-300w-with-dust-collection': 'Szlifierka oscylacyjna 300 W z odsysaniem pylu',
}

const PL_PRODUCT_DESCRIPTION_BY_SLUG: Record<string, string> = {
    'premium-stainless-steel-electric-kettle': 'Wysokiej jakosci czajnik elektryczny ze stali nierdzewnej z technologia szybkiego gotowania i automatycznym wylaczaniem. Idealny dla milosnikow herbaty i kawy.',
    'non-stick-ceramic-frying-pan-28cm': 'Profesjonalna patelnia ceramiczna z powloka nieprzywierajaca. Powloka bez PFOA, odpowiednia do wszystkich typow kuchenek, w tym indukcji.',
    'professional-5-piece-kitchen-knife-set': 'Wysokiej klasy zestaw nozy z niemieckiej stali nierdzewnej z ergonomicznymi uchwytami. Zawiera noz szefa kuchni, noz do chleba, noz uniwersalny, noz do obierania oraz drewniany blok.',
    'high-speed-smoothie-blender-1200w': 'Wydajny blender z silnikiem 1200 W i 6 ostrzami ze stali nierdzewnej. Idealny do smoothie, zup i masel orzechowych. Dzbanek bez BPA.',
    'french-press-coffee-maker-1l': 'Klasyczny zaparzacz French Press z zaroodpornym szklem borokrzemowym i stalowa ramka. Przygotowuje do 8 filizanek aromatycznej kawy.',
    'cordless-drill-driver-18v-li-ion': 'Profesjonalna wkretarko-wiertarka 18 V z silnikiem bezszczotkowym. W zestawie 2 akumulatory litowo-jonowe, ladowarka i walizka. Moment obrotowy 60 Nm.',
    'angle-grinder-125mm-900w': 'Kompaktowa i mocna szlifierka katowa 125 mm z silnikiem 900 W. Idealna do ciecia, szlifowania i polerowania metalu oraz kamienia.',
    'rotary-hammer-drill-sds-plus-800w': 'Wytrzymala mlotowiertarka SDS-Plus do betonu, muru i kamienia. 3 tryby: wiercenie, wiercenie z udarem oraz podkuwanie.',
    'circular-saw-190mm-1400w': 'Profesjonalna pilarka tarczowa z silnikiem 1400 W i tarcza 190 mm. Prowadnica laserowa oraz regulacja glebokosci i kata ciecia do 45 stopni.',
    'orbital-sander-300w-with-dust-collection': 'Ergonomiczna szlifierka oscylacyjna z systemem mikrofiltracji pylu. Plynna regulacja predkosci do precyzyjnego szlifowania drewna, metalu i tworzyw sztucznych.',
}

export function getLocalizedCategoryName(categoryName: string, categorySlug: string | null | undefined, locale: Locale): string {
    if (locale === 'en') {
        return toTitleCaseWords(categoryName)
    }

    if (categorySlug && CATEGORY_NAME_BY_SLUG[categorySlug]) {
        return toTitleCaseWords(CATEGORY_NAME_BY_SLUG[categorySlug].pl)
    }

    return toTitleCaseWords(categoryName)
}

function getTranslationFromMap(baseValue: string | null, translations: TranslationMap, locale: Locale): string | null {
    if (!baseValue && !translations) {
        return null
    }

    const localized = locale === 'pl' ? translations?.pl : translations?.en
    if (localized) {
        return localized
    }

    return baseValue
}

export function getLocalizedCategoryNameWithTranslations(
    categoryName: string,
    categorySlug: string | null | undefined,
    locale: Locale,
    translations?: TranslationMap
): string {
    const fromTranslations = getTranslationFromMap(categoryName, translations, locale)
    if (fromTranslations) {
        return toTitleCaseWords(fromTranslations)
    }

    if (locale === 'en') {
        return toTitleCaseWords(categoryName)
    }

    if (categorySlug && CATEGORY_NAME_BY_SLUG[categorySlug]) {
        return toTitleCaseWords(CATEGORY_NAME_BY_SLUG[categorySlug].pl)
    }

    return toTitleCaseWords(categoryName)
}

export function getLocalizedProductTitle(
    productTitle: string,
    productSlug: string,
    locale: Locale,
    translations?: TranslationMap
): string {
    const fromTranslations = getTranslationFromMap(productTitle, translations, locale)
    if (fromTranslations) {
        return fromTranslations
    }

    if (locale === 'pl' && PL_PRODUCT_TITLE_BY_SLUG[productSlug]) {
        return PL_PRODUCT_TITLE_BY_SLUG[productSlug]
    }

    return productTitle
}

export function getLocalizedProductDescription(
    productDescription: string | null,
    productSlug: string,
    locale: Locale,
    translations?: TranslationMap
): string | null {
    const fromTranslations = getTranslationFromMap(productDescription, translations, locale)
    if (!fromTranslations) {
        return null
    }

    if (locale === 'pl' && PL_PRODUCT_DESCRIPTION_BY_SLUG[productSlug]) {
        return PL_PRODUCT_DESCRIPTION_BY_SLUG[productSlug]
    }

    return fromTranslations
}

// Brand names are proper nouns and must render identically in every locale;
// the locale parameter is kept for call-site compatibility.
export function getLocalizedBrandName(
    brandName: string | null,
    locale: Locale
): string | null {
    void locale
    return brandName || null
}
