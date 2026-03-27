'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

export type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

interface LocaleContextValue {
    locale: Locale
    setLocale: (locale: Locale) => void
    messages: typeof enMessages
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function getCookieLocale(): Locale | null {
    if (typeof document === 'undefined') return null
    const raw = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('locale='))
        ?.split('=')[1]

    return raw === 'pl' ? 'pl' : raw === 'en' ? 'en' : null
}

function runLocaleTransitionEffect() {
    if (typeof window === 'undefined') return
    const body = document.body
    if (!body) return

    body.classList.remove('locale-switching')
    // Force reflow so rapid toggles can restart the animation reliably.
    void body.offsetWidth
    body.classList.add('locale-switching')

    window.setTimeout(() => {
        body.classList.remove('locale-switching')
    }, 320)
}

export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale, children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(initialLocale)

    const setLocale = useCallback((nextLocale: Locale) => {
        runLocaleTransitionEffect()
        setLocaleState(nextLocale)

        if (typeof window !== 'undefined') {
            localStorage.setItem('locale', nextLocale)
            document.cookie = `locale=${nextLocale}; path=/; max-age=31536000; samesite=lax`
            document.documentElement.lang = nextLocale
            window.dispatchEvent(new CustomEvent('app-locale-change', { detail: nextLocale }))
        }
    }, [])

    useEffect(() => {
        const fromStorage = typeof window !== 'undefined' ? localStorage.getItem('locale') : null
        const fromCookie = getCookieLocale()
        const resolved: Locale = fromStorage === 'pl' || fromCookie === 'pl' ? 'pl' : 'en'

        if (resolved !== locale) {
            setLocaleState(resolved)
        }

        document.documentElement.lang = resolved
    }, [locale])

    useEffect(() => {
        const syncLocale = (event?: Event) => {
            const eventLocale = (event as CustomEvent<Locale> | undefined)?.detail
            const cookieLocale = getCookieLocale()
            const nextLocale: Locale = eventLocale === 'pl' || cookieLocale === 'pl' ? 'pl' : 'en'
            runLocaleTransitionEffect()
            setLocaleState(nextLocale)
            document.documentElement.lang = nextLocale
        }

        window.addEventListener('storage', syncLocale)
        window.addEventListener('app-locale-change', syncLocale as EventListener)

        return () => {
            window.removeEventListener('storage', syncLocale)
            window.removeEventListener('app-locale-change', syncLocale as EventListener)
        }
    }, [])

    const value = useMemo(() => ({
        locale,
        setLocale,
        messages: MESSAGES[locale] as typeof enMessages,
    }), [locale, setLocale])

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocaleMessages() {
    const context = useContext(LocaleContext)
    if (!context) {
        throw new Error('useLocaleMessages must be used within LocaleProvider')
    }

    return context
}
