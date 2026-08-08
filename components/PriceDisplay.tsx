'use client'

import { useLocaleMessages } from '@/contexts/LocaleContext'
import { getProductPriceBreakdown, formatPlnPrice } from '@/utils/pricing'
import { isToolCategory } from '@/utils/categoryGroups'

interface PriceDisplayProps {
    price_retail: number
    category?: { slug: string; name: string } | null
    variant?: 'default' | 'featured'
    showBreakdown?: boolean
}

function PriceBreakdownLines({
    breakdown,
    category,
    locale,
    compact = false,
}: {
    breakdown: ReturnType<typeof getProductPriceBreakdown>
    category?: { slug: string; name: string } | null
    locale: 'en' | 'pl'
    compact?: boolean
}) {
    const isTools = isToolCategory(category)

    if (isTools) {
        return (
            <div className={`space-y-1 ${compact ? 'text-xs' : 'text-sm'} text-slate-500`}>
                <div className="flex justify-between gap-4">
                    <span>{locale === 'pl' ? 'Netto' : 'Net (excl. VAT)'}</span>
                    <span>{formatPlnPrice(breakdown.net, locale)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span>{locale === 'pl' ? 'VAT (23%)' : 'VAT (23%)'}</span>
                    <span>{formatPlnPrice(breakdown.vat, locale)}</span>
                </div>
                <p className="text-[0.7rem] text-slate-400 pt-0.5">
                    {locale === 'pl'
                        ? 'Cena zawiera VAT'
                        : 'Price includes VAT'}
                </p>
            </div>
        )
    }

    return (
        <div className={`space-y-1 ${compact ? 'text-xs' : 'text-sm'} text-slate-500`}>
            <div className="flex justify-between gap-4">
                <span>{locale === 'pl' ? 'Netto' : 'Net (excl. VAT)'}</span>
                <span>{formatPlnPrice(breakdown.net, locale)}</span>
            </div>
            <div className="flex justify-between gap-4">
                <span>{locale === 'pl' ? 'VAT (23%)' : 'VAT (23%)'}</span>
                <span>+ {formatPlnPrice(breakdown.vat, locale)}</span>
            </div>
        </div>
    )
}

export default function PriceDisplay({
    price_retail,
    category,
    variant = 'default',
    showBreakdown = false,
}: PriceDisplayProps) {
    const isFeatured = variant === 'featured'
    const { messages, locale } = useLocaleMessages()

    const breakdown = getProductPriceBreakdown(price_retail, category)

    return (
        <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-1">
                <span className={isFeatured ? 'text-[0.8rem] text-slate-500' : 'text-sm text-gray-600'}>{messages.product.price}</span>
                <span className={isFeatured ? 'price-value text-[1.12rem] leading-tight font-bold text-slate-900' : 'text-2xl font-bold text-gray-900'}>
                    {formatPlnPrice(breakdown.gross, locale)}
                </span>
            </div>
            {showBreakdown && (
                <PriceBreakdownLines breakdown={breakdown} category={category} locale={locale} />
            )}
        </div>
    )
}
