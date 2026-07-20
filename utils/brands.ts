// Canonical brand catalog. Brand names are proper nouns — identical in every
// locale — so spelling and capitalization here must match the database exactly.
export const TOOL_BRANDS = ['Kraft&Dele', 'W.D.S', 'Alpenburg'] as const

export const HOUSEHOLD_BRANDS = ['Kinghoff', 'Klausberg', 'Kassel', 'Alpenburg'] as const

export const ALL_BRANDS = Array.from(
    new Set<string>([...TOOL_BRANDS, ...HOUSEHOLD_BRANDS])
)

export function isKnownBrand(value: string | null | undefined): value is string {
    return Boolean(value) && ALL_BRANDS.includes(value as string)
}
