export const TOOL_CATEGORY_KEYWORDS = [
    'tool',
    'tools',
    'narzed',
    'wiert',
    'pil',
    'szlifier',
    'mlot',
    'warsztat',
    'spaw',
    'pomiar',
    'ogrod',
    'elektronarzed',
    'power',
] as const

export function isToolCategory(category: { slug: string; name: string } | null | undefined): boolean {
    if (!category) return false
    const normalized = `${category.slug} ${category.name}`.toLowerCase()
    return TOOL_CATEGORY_KEYWORDS.some((keyword) => normalized.includes(keyword))
}
