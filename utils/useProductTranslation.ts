'use client'

import { useEffect, useState, useCallback } from 'react'
import { translateText, getTranslationOrFallback } from '@/utils/clientTranslation'

type TranslationMap = {
    en?: string | null
    pl?: string | null
} | null | undefined

interface UseProductTranslationResult {
    title: string | null
    description: string | null
    isLoading: boolean
}

export function useProductTranslation(
    baseTitle: string | null | undefined,
    baseDescription: string | null | undefined,
    titleTranslations: TranslationMap,
    descriptionTranslations: TranslationMap,
    targetLocale: 'en' | 'pl' = 'en'
): UseProductTranslationResult {
    const [translatedTitle, setTranslatedTitle] = useState<string | null>(null)
    const [translatedDescription, setTranslatedDescription] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Get initial values from DB translations or base text
    const { text: initialTitle, needsTranslation: titleNeedsTranslation } = getTranslationOrFallback(
        titleTranslations,
        baseTitle,
        targetLocale
    )

    const { text: initialDescription, needsTranslation: descNeedsTranslation } = getTranslationOrFallback(
        descriptionTranslations,
        baseDescription,
        targetLocale
    )

    // Set initial values immediately
    useEffect(() => {
        setTranslatedTitle(initialTitle)
        setTranslatedDescription(initialDescription)
    }, [initialTitle, initialDescription])

    // Translate in background if needed
    useEffect(() => {
        if (!titleNeedsTranslation && !descNeedsTranslation) {
            setIsLoading(false)
            return
        }

        setIsLoading(true)
        let cancelled = false

        const translateAsync = async () => {
            try {
                const results = await Promise.all([
                    titleNeedsTranslation ? translateText(baseTitle, targetLocale, 'pl') : Promise.resolve(null),
                    descNeedsTranslation ? translateText(baseDescription, targetLocale, 'pl') : Promise.resolve(null),
                ])

                if (!cancelled) {
                    if (titleNeedsTranslation && results[0]) {
                        setTranslatedTitle(results[0])
                    }
                    if (descNeedsTranslation && results[1]) {
                        setTranslatedDescription(results[1])
                    }
                    setIsLoading(false)
                }
            } catch (error) {
                console.warn('Translation failed:', error)
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        // Debounce translation by 100ms to batch requests
        const timer = setTimeout(translateAsync, 100)

        return () => {
            cancelled = true
            clearTimeout(timer)
        }
    }, [baseTitle, baseDescription, titleNeedsTranslation, descNeedsTranslation, targetLocale])

    return {
        title: translatedTitle,
        description: translatedDescription,
        isLoading,
    }
}
