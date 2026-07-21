// Canonical brand catalog. Brand names are proper nouns — identical in every
// locale — so spelling and capitalization here must match the database exactly.
export const TOOL_BRANDS = ['Kraft&Dele', 'W.D.S', 'Alpenburg'] as const

export const HOUSEHOLD_BRANDS = ['Kinghoff', 'Klausberg', 'Kassel', 'Alpenburg'] as const

export const ALL_BRANDS = Array.from(
    new Set<string>([...TOOL_BRANDS, ...HOUSEHOLD_BRANDS])
)

// Products with a null or empty brand default to this brand.
export const DEFAULT_BRAND = 'Alpenburg'

export interface BrandInfo {
    name: string
    logo: string
    // true when the logo artwork sits on a dark background (render on a dark chip)
    dark?: boolean
}

export const BRAND_INFO: Record<string, BrandInfo> = {
    'Kraft&Dele': { name: 'Kraft&Dele', logo: '/logos/kraftdele-trim.png' },
    'W.D.S': { name: 'W.D.S', logo: '/logos/wds-trim.png' },
    'Alpenburg': { name: 'Alpenburg', logo: '/logos/alpenburg-trim.png' },
    'Kinghoff': { name: 'Kinghoff', logo: '/logos/kinghoff-trim.png' },
    'Klausberg': { name: 'Klausberg', logo: '/logos/klausberg-trim.png' },
    'Kassel': { name: 'Kassel', logo: '/logos/kassel-trim.png' },
}

export function isKnownBrand(value: string | null | undefined): value is string {
    return Boolean(value) && ALL_BRANDS.includes(value as string)
}

// Any null/empty brand resolves to the default brand (Alpenburg).
export function normalizeBrand(value: string | null | undefined): string {
    const trimmed = (value || '').trim()
    return trimmed === '' ? DEFAULT_BRAND : trimmed
}

export function getBrandInfo(value: string | null | undefined): BrandInfo {
    const name = normalizeBrand(value)
    return BRAND_INFO[name] ?? { name, logo: '' }
}
