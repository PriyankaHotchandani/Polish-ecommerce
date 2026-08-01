import { isToolCategory } from '@/utils/categoryGroups'

export const VAT_RATE = 0.23

// Flat shipping rates per payment method (standard packages under 30 kg).
// Bank transfer is the primary method; cash on delivery costs slightly more.
// There is intentionally no free-shipping threshold.
export const SHIPPING_COST_TRANSFER = 28
export const SHIPPING_COST_COD = 30

export type ShippingPaymentMethod = 'transfer' | 'cash_on_delivery'

export function getShippingCost(paymentMethod: ShippingPaymentMethod | string | null | undefined): number {
    return paymentMethod === 'cash_on_delivery' ? SHIPPING_COST_COD : SHIPPING_COST_TRANSFER
}

export type PriceBreakdown = {
    net: number
    vat: number
    gross: number
    isVatInclusive: boolean
}

export type VolumeDiscount = {
    rate: number
    percent: number
}

export type CartTotals = {
    totalNet: number
    totalVat: number
    totalGross: number
    discountRate: number
    discountPercent: number
    discountAmount: number
    finalTotal: number
}

export function roundToolsPrice(basePrice: number): number {
    return Math.ceil((basePrice * 1.10) / 5) * 5
}

export function getProductPriceBreakdown(
    basePrice: number,
    category: { slug: string; name: string } | null | undefined
): PriceBreakdown {
    const price = Number(basePrice) || 0

    if (isToolCategory(category)) {
        const gross = roundToolsPrice(price)
        const net = gross / (1 + VAT_RATE)
        const vat = gross - net
        return { net, vat, gross, isVatInclusive: true }
    }

    const net = price
    const vat = net * VAT_RATE
    const gross = net + vat
    return { net, vat, gross, isVatInclusive: false }
}

export function getVolumeDiscount(cartGrossTotal: number): VolumeDiscount {
    if (cartGrossTotal > 8000) return { rate: 0.08, percent: 8 }
    if (cartGrossTotal > 6000) return { rate: 0.06, percent: 6 }
    if (cartGrossTotal > 4000) return { rate: 0.04, percent: 4 }
    if (cartGrossTotal > 2000) return { rate: 0.02, percent: 2 }
    return { rate: 0, percent: 0 }
}

export function getLineItemGross(
    basePrice: number,
    quantity: number,
    category: { slug: string; name: string } | null | undefined
): number {
    const breakdown = getProductPriceBreakdown(basePrice, category)
    return breakdown.gross * quantity
}

export function calculateCartTotals(
    items: Array<{
        product: {
            price_retail: number
            category?: { slug: string; name: string } | null
        }
        quantity: number
    }>
): CartTotals {
    let totalNet = 0
    let totalVat = 0
    let totalGross = 0

    for (const item of items) {
        const basePrice = Number(item.product.price_retail)
        const breakdown = getProductPriceBreakdown(basePrice, item.product.category ?? null)

        totalNet += breakdown.net * item.quantity
        totalVat += breakdown.vat * item.quantity
        totalGross += breakdown.gross * item.quantity
    }

    const { rate, percent } = getVolumeDiscount(totalGross)
    const discountAmount = totalGross * rate
    const finalTotal = totalGross - discountAmount

    return {
        totalNet,
        totalVat,
        totalGross,
        discountRate: rate,
        discountPercent: percent,
        discountAmount,
        finalTotal,
    }
}

export function formatPlnPrice(price: number, locale: 'en' | 'pl' = 'en'): string {
    return new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
        style: 'currency',
        currency: 'PLN',
        currencyDisplay: 'code',
        minimumFractionDigits: 2,
    }).format(price)
}
