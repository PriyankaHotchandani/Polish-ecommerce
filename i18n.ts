import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Supported locales
export const locales = ['en', 'pl'] as const
export type Locale = (typeof locales)[number]

export default getRequestConfig(async ({ locale }) => {
    // Validate explicit locale if present, then resolve a guaranteed default locale.
    if (locale && !locales.includes(locale as Locale)) notFound()
    const resolvedLocale: Locale = (locale as Locale) || 'en'

    return {
        locale: resolvedLocale,
        messages: (await import(`./messages/${resolvedLocale}.json`)).default
    }
})
