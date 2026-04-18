'use client'

import type { Product, Category, Json } from '@/types/database.types'
import PriceDisplay from '@/components/PriceDisplay'
import AddToCartButton from '@/components/AddToCartButton'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import {
    getLocalizedBrandName,
    getLocalizedCategoryNameWithTranslations,
    getLocalizedProductDescription,
    getLocalizedProductTitle,
} from '@/utils/productLocalization'

interface ProductDetailsProps {
    product: Product & { category: Category }
}

type ParsedDescriptionSection = {
    heading: string | null
    body: string
}

const DESCRIPTION_HEADINGS = [
    'PRODUCT FEATURES:',
    'TECHNICAL DATA:',
    'PRODUCT COMPOSITION:',
    'CECHY PRODUKTU:',
    'DANE TECHNICZNE:',
    'ZAWARTOSC ZESTAWU:',
]

function normalizeDescriptionText(raw: string): string {
    return raw
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<li>/gi, '\n• ')
        .replace(/<\/li>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/\r/g, '')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}

function parseDescriptionSections(text: string): ParsedDescriptionSection[] {
    const sections: ParsedDescriptionSection[] = []
    const upper = text.toUpperCase()

    const markers = DESCRIPTION_HEADINGS
        .map((heading) => ({
            heading,
            index: upper.indexOf(heading),
        }))
        .filter((entry) => entry.index >= 0)
        .sort((a, b) => a.index - b.index)

    if (markers.length === 0) {
        return [{ heading: null, body: text }]
    }

    const firstMarkerIndex = markers[0]?.index ?? 0
    const intro = text.slice(0, firstMarkerIndex).trim()
    if (intro) {
        sections.push({ heading: null, body: intro })
    }

    for (let i = 0; i < markers.length; i += 1) {
        const current = markers[i]
        const next = markers[i + 1]
        const start = current.index + current.heading.length
        const end = next ? next.index : text.length
        const body = text.slice(start, end).trim()

        if (body) {
            sections.push({
                heading: current.heading.replace(/:$/, ''),
                body,
            })
        }
    }

    return sections
}

function extractBullets(text: string): string[] {
    if (/[✅✔]/.test(text)) {
        return text
            .split(/[✅✔]/)
            .map((item) => item.trim())
            .filter(Boolean)
    }

    if (/[⚙🔧]/.test(text)) {
        return text
            .split(/[⚙🔧]/)
            .map((item) => item.trim())
            .filter(Boolean)
    }

    const lines = text
        .split(/\n+/)
        .map((line) => line.replace(/^[-•]\s*/, '').trim())
        .filter(Boolean)

    if (lines.length >= 3) {
        return lines
    }

    return []
}

function splitParagraphs(text: string): string[] {
    return text
        .split(/\n{2,}/)
        .map((part) => part.trim())
        .filter(Boolean)
}

export default function ProductDetails({ product }: ProductDetailsProps) {
    const specifications = product.specifications as Record<string, Json> | null
    const { messages, locale } = useLocaleMessages()
    const localizedCategoryName = getLocalizedCategoryNameWithTranslations(
        product.category.name,
        product.category.slug,
        locale,
        product.category.name_translations as { en?: string | null, pl?: string | null } | null
    )
    const localizedTitle = getLocalizedProductTitle(
        product.title,
        product.slug,
        locale,
        product.title_translations as { en?: string | null, pl?: string | null } | null
    )
    const localizedDescription = getLocalizedProductDescription(
        product.description,
        product.slug,
        locale,
        product.description_translations as { en?: string | null, pl?: string | null } | null
    )
    const localizedBrandName = getLocalizedBrandName(product.brand, locale)
    const normalizedDescription = localizedDescription ? normalizeDescriptionText(localizedDescription) : null
    const parsedDescriptionSections = normalizedDescription
        ? parseDescriptionSections(normalizedDescription)
        : []
    const sourceRows = [
        { label: messages.product.co, value: product.source_co },
        { label: messages.product.productUrl, value: product.source_url_produktu },
        { label: messages.product.ena, value: product.source_ena },
        { label: messages.product.cn, value: product.source_cn },
        { label: messages.product.weight, value: product.source_waga !== null ? `${product.source_waga}` : null },
    ].filter((row) => row.value)
    const specificationEntries = specifications
        ? Object.entries(specifications).filter(([key]) => !key.startsWith('source_'))
        : []

    return (
        <>
            <div className="mb-4">
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                    {localizedCategoryName}
                </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{localizedTitle}</h1>
            {(localizedBrandName || product.sku) && (
                <p className="mb-6 text-xs sm:text-sm text-gray-500 uppercase tracking-[0.16em]">
                    {localizedBrandName ? `${messages.product.brand}: ${localizedBrandName}` : messages.product.sku}
                    {localizedBrandName && <span className="mx-2 text-gray-300">•</span>}
                    {localizedBrandName ? `${messages.product.sku}: ${product.sku}` : `: ${product.sku}`}
                </p>
            )}

            {/* Price */}
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 mb-6">
                <PriceDisplay
                    price_retail={Number(product.price_retail)}
                    price_wholesale={Number(product.price_wholesale)}
                />
            </div>

            {/* Stock Status */}
            <div className="mb-6">
                {product.inventory_count > 0 ? (
                    <span className="inline-flex items-center gap-2 text-base font-medium text-gray-600">
                        <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" aria-hidden="true" />
                        {`${messages.product.inStock} (${product.inventory_count} ${messages.product.available})`}
                    </span>
                ) : (
                    <span className="text-base font-medium text-red-600">{messages.product.outOfStock}</span>
                )}
            </div>

            {/* Add to Cart with Quantity Selector */}
            <div className="mb-6">
                <AddToCartButton product={product} showQuantity className="text-base py-3 font-medium" />
            </div>

            {/* Description */}
            {localizedDescription && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.product.description}</h2>
                    <div className="rounded-xl border border-gray-100 bg-white p-5 text-gray-700">
                        {parsedDescriptionSections.map((section, sectionIndex) => {
                            const bullets = extractBullets(section.body)
                            const paragraphs = bullets.length > 0 ? [] : splitParagraphs(section.body)

                            return (
                                <div key={`${section.heading || 'intro'}-${sectionIndex}`} className={sectionIndex > 0 ? 'mt-6' : ''}>
                                    {section.heading && (
                                        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
                                            {section.heading}
                                        </h3>
                                    )}

                                    {bullets.length > 0 ? (
                                        <ul className="space-y-2 text-[1.02rem] leading-7 text-slate-700">
                                            {bullets.map((item, index) => (
                                                <li key={`${item.slice(0, 32)}-${index}`} className="flex items-start gap-2">
                                                    <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-[#163579]" aria-hidden="true" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="space-y-3 text-[1.04rem] leading-8 text-slate-700">
                                            {(paragraphs.length > 0 ? paragraphs : [section.body]).map((paragraph, index) => (
                                                <p key={`${paragraph.slice(0, 32)}-${index}`}>{paragraph}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {sourceRows.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.product.sourceAttributes}</h2>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        {sourceRows.map((row, index) => (
                            <div
                                key={row.label}
                                className={`flex justify-between items-baseline gap-4 py-3 px-4 ${index !== sourceRows.length - 1
                                    ? 'border-b border-gray-100'
                                    : ''
                                    }`}
                            >
                                <span className="text-sm text-gray-500">{row.label}</span>
                                <span className="text-sm font-semibold text-gray-900 text-right break-all">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Specifications */}
            {specificationEntries.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.product.specifications}</h2>
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                        {specificationEntries.map(([key, value], index) => (
                            <div
                                key={key}
                                className={`flex justify-between items-baseline gap-4 py-3 px-4 ${index !== specificationEntries.length - 1
                                    ? 'border-b border-gray-100'
                                    : ''
                                    }`}
                            >
                                <span className="text-sm text-gray-500 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-sm font-semibold text-gray-900 text-right">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
