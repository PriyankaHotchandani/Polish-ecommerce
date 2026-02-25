import { createClient } from '@/utils/supabase/client'

export async function generateSlug(title: string, table: 'products' | 'categories' = 'products'): Promise<string> {
    const supabase = createClient()

    // Convert title to URL-safe slug
    let slug = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens

    // Check if slug already exists
    const { data: existingRecords } = await supabase
        .from(table)
        .select('slug')
        .ilike('slug', `${slug}%`)

    if (!existingRecords || existingRecords.length === 0) {
        return slug
    }

    // If slug exists, append a number
    const slugs = existingRecords.map(record => record.slug)
    let counter = 1
    let newSlug = `${slug}-${counter}`

    while (slugs.includes(newSlug)) {
        counter++
        newSlug = `${slug}-${counter}`
    }

    return newSlug
}

export function validateSlug(slug: string): string | null {
    if (!slug || slug.length === 0) {
        return 'Slug is required'
    }

    if (slug.length < 3) {
        return 'Slug must be at least 3 characters'
    }

    if (slug.length > 100) {
        return 'Slug must be less than 100 characters'
    }

    // Check if slug contains only valid characters
    if (!/^[a-z0-9-]+$/.test(slug)) {
        return 'Slug can only contain lowercase letters, numbers, and hyphens'
    }

    // Check if slug starts or ends with hyphen
    if (slug.startsWith('-') || slug.endsWith('-')) {
        return 'Slug cannot start or end with a hyphen'
    }

    return null
}
