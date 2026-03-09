// Invoice translations
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

export type InvoiceTranslations = typeof enMessages.invoice

const translations = {
    en: enMessages.invoice,
    pl: plMessages.invoice,
}

export function getInvoiceTranslations(locale: string = 'pl'): InvoiceTranslations {
    const normalizedLocale = locale.toLowerCase()
    return translations[normalizedLocale as keyof typeof translations] || translations.pl
}
