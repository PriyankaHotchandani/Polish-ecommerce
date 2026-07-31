import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { getShippingCost, VAT_RATE } from '@/utils/pricing'
import { COMPANY_DETAILS } from '@/utils/companyDetails'
import { generateInvoicePDF } from '@/utils/generateInvoicePDF'
import { sendMail } from '@/utils/mailer'
import type { InvoiceData } from '@/components/InvoiceDocument'

// PDF generation (@react-pdf/renderer) and nodemailer require the Node runtime.
export const runtime = 'nodejs'

type PaymentMethod = 'transfer' | 'cash_on_delivery'

interface OrderItemInput {
    product_id: string
    quantity: number
    price_at_purchase: number
}

interface CreateOrderRpcResult {
    order_id: string | null
    success: boolean
    error_message: string | null
}

interface CheckoutAddressPayload {
    fullName?: string
    phone?: string
    street?: string
    city?: string
    postalCode?: string
    country?: string
    companyName?: string
}

function normalizeAddressValue(value: string | undefined): string {
    return (value || '').trim()
}

function normalizeComparable(value: string | undefined): string {
    return normalizeAddressValue(value).toLowerCase()
}

function addressesMatch(a: CheckoutAddressPayload, b: CheckoutAddressPayload): boolean {
    return (
        normalizeComparable(a.fullName) === normalizeComparable(b.fullName) &&
        normalizeComparable(a.phone) === normalizeComparable(b.phone) &&
        normalizeComparable(a.street) === normalizeComparable(b.street) &&
        normalizeComparable(a.city) === normalizeComparable(b.city) &&
        normalizeComparable(a.postalCode) === normalizeComparable(b.postalCode) &&
        normalizeComparable(a.country) === normalizeComparable(b.country)
    )
}

async function saveAddressIfNew(
    supabase: Awaited<ReturnType<typeof createClient>>,
    userId: string,
    address: CheckoutAddressPayload,
    addressType: 'shipping' | 'billing',
    label: string
): Promise<void> {
    const normalized = {
        full_name: normalizeAddressValue(address.fullName),
        street: normalizeAddressValue(address.street),
        city: normalizeAddressValue(address.city),
        postal_code: normalizeAddressValue(address.postalCode),
        country: normalizeAddressValue(address.country) || 'Poland',
        phone: normalizeAddressValue(address.phone),
    }

    // Skip invalid/incomplete address payloads.
    if (!normalized.full_name || !normalized.street || !normalized.city || !normalized.postal_code || !normalized.phone) {
        return
    }

    const { data: existingAddress } = await supabase
        .from('saved_addresses')
        .select('id')
        .eq('user_id', userId)
        .eq('address_type', addressType)
        .eq('full_name', normalized.full_name)
        .eq('street', normalized.street)
        .eq('city', normalized.city)
        .eq('postal_code', normalized.postal_code)
        .eq('country', normalized.country)
        .eq('phone', normalized.phone)
        .maybeSingle()

    if (existingAddress) {
        return
    }

    await supabase.from('saved_addresses').insert({
        user_id: userId,
        address_type: addressType,
        label,
        full_name: normalized.full_name,
        company_name: normalizeAddressValue(address.companyName) || null,
        street: normalized.street,
        city: normalized.city,
        postal_code: normalized.postal_code,
        country: normalized.country,
        phone: normalized.phone,
        is_default: false,
    })
}

function money(n: number): string {
    return `${n.toFixed(2)} PLN`
}

/**
 * Builds a Proforma invoice for the freshly-created order and e-mails it to the
 * customer with the PDF attached. Bank transfer details are included so the
 * customer knows where to send the payment. Throws on failure; the caller must
 * swallow the error so checkout completion is never blocked.
 */
async function sendProformaEmail(params: {
    supabase: Awaited<ReturnType<typeof createClient>>
    orderId: string
    paymentMethod: PaymentMethod
    total: number
    buyerEmail: string
    shipping: CheckoutAddressPayload & { nipNumber?: string }
    billing: CheckoutAddressPayload & { nipNumber?: string }
    locale: 'en' | 'pl'
}): Promise<void> {
    const { supabase, orderId, paymentMethod, total, buyerEmail, shipping, billing, locale } = params
    const isPl = locale === 'pl'

    const { data: itemRows, error } = await supabase
        .from('order_items')
        .select('quantity, price_at_purchase, product:products(sku,title)')
        .eq('order_id', orderId)

    if (error) {
        throw error
    }

    const items = (itemRows || []).map((row) => {
        const product = (row as { product?: { sku?: string; title?: string } | null }).product
        const quantity = Number((row as { quantity: number }).quantity)
        const price = Number((row as { price_at_purchase: number }).price_at_purchase)
        return {
            sku: product?.sku || '',
            title: product?.title || '',
            quantity,
            price,
            total: price * quantity,
        }
    })

    const itemsGross = items.reduce((sum, item) => sum + item.total, 0)
    const shippingCost = getShippingCost(paymentMethod)
    const grand = Number(total)
    const discount = Math.round((itemsGross + shippingCost - grand) * 100) / 100
    const net = itemsGross / (1 + VAT_RATE)
    const vat = itemsGross - net

    const shippingLabel = isPl ? 'Dostawa' : 'Shipping'
    const additionalCharges: Array<{ label: string; amount: number }> = [
        { label: shippingLabel, amount: shippingCost },
    ]
    if (discount > 0.009) {
        additionalCharges.push({ label: isPl ? 'Rabat (Próg rabatowy)' : 'Discount (Discount Tier)', amount: -discount })
    }

    const shortId = orderId.slice(0, 8).toUpperCase()
    const now = new Date()
    const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const dateLocale = isPl ? 'pl-PL' : 'en-GB'

    const paymentLabel = paymentMethod === 'cash_on_delivery'
        ? (isPl ? 'Płatność przy odbiorze' : 'Cash on Delivery')
        : (isPl ? 'Przelew bankowy (Proforma)' : 'Bank Transfer (Proforma)')

    const invoiceData: InvoiceData = {
        invoiceNumber: `PROFORMA-${shortId}`,
        orderNumber: `#${shortId}`,
        issueDate: now.toLocaleDateString(dateLocale),
        dueDate: due.toLocaleDateString(dateLocale),
        seller: {
            name: COMPANY_DETAILS.name,
            address: COMPANY_DETAILS.address,
            city: COMPANY_DETAILS.city,
            postalCode: COMPANY_DETAILS.postalCode,
            nip: COMPANY_DETAILS.nip,
            email: COMPANY_DETAILS.email,
            phone: COMPANY_DETAILS.phone,
        },
        buyer: {
            name: shipping.fullName || buyerEmail,
            companyName: billing.companyName || shipping.companyName || undefined,
            nipNumber: billing.nipNumber || undefined,
            address: shipping.street || '',
            city: shipping.city || '',
            postalCode: shipping.postalCode || '',
            country: shipping.country || 'Poland',
            email: buyerEmail,
            phone: shipping.phone || '',
        },
        items,
        subtotal: net,
        vatRate: VAT_RATE,
        vatAmount: vat,
        additionalCharges,
        total: grand,
        paymentMethod: paymentLabel,
        bankDetails: paymentMethod === 'transfer'
            ? {
                bankName: COMPANY_DETAILS.bank.bankName,
                accountHolder: COMPANY_DETAILS.bank.accountHolder,
                iban: COMPANY_DETAILS.bank.iban,
                swift: COMPANY_DETAILS.bank.swift,
                reference: `#${shortId}`,
            }
            : undefined,
    }

    const pdf = await generateInvoicePDF(invoiceData, locale)

    const bank = COMPANY_DETAILS.bank
    const bankBlock = paymentMethod === 'transfer'
        ? `
        <h3 style="margin:24px 0 8px;">${isPl ? 'Dane do przelewu' : 'Bank transfer details'}</h3>
        <table style="border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:2px 12px 2px 0;color:#555;">${isPl ? 'Odbiorca' : 'Account holder'}</td><td><strong>${bank.accountHolder}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#555;">${isPl ? 'Bank' : 'Bank'}</td><td>${bank.bankName}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#555;">IBAN</td><td><strong>${bank.iban}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#555;">SWIFT/BIC</td><td>${bank.swift}</td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#555;">${isPl ? 'Tytuł przelewu' : 'Transfer title'}</td><td><strong>#${shortId}</strong></td></tr>
          <tr><td style="padding:2px 12px 2px 0;color:#555;">${isPl ? 'Kwota' : 'Amount'}</td><td><strong>${money(grand)}</strong></td></tr>
        </table>`
        : ''

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;color:#111;max-width:640px;">
        <h2>${isPl ? 'Dziękujemy za zamówienie' : 'Thank you for your order'} #${shortId}</h2>
        <p>${isPl
            ? 'W załączeniu przesyłamy fakturę proforma. Prosimy o dokonanie płatności przelewem na poniższe dane.'
            : 'Your proforma invoice is attached. Please complete your payment via bank transfer using the details below.'}</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:12px;">
          <thead><tr style="background:#163579;color:#fff;">
            <th align="left" style="padding:6px;">${isPl ? 'Produkt' : 'Item'}</th>
            <th align="right" style="padding:6px;">${isPl ? 'Ilość' : 'Qty'}</th>
            <th align="right" style="padding:6px;">${isPl ? 'Cena' : 'Price'}</th>
            <th align="right" style="padding:6px;">${isPl ? 'Razem' : 'Total'}</th>
          </tr></thead>
          <tbody>
            ${items.map((it) => `<tr>
              <td style="padding:6px;border-bottom:1px solid #eee;">${it.title}</td>
              <td align="right" style="padding:6px;border-bottom:1px solid #eee;">${it.quantity}</td>
              <td align="right" style="padding:6px;border-bottom:1px solid #eee;">${money(it.price)}</td>
              <td align="right" style="padding:6px;border-bottom:1px solid #eee;">${money(it.total)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        <p style="font-size:14px;margin-top:10px;">
          ${shippingLabel}: <strong>${money(shippingCost)}</strong><br/>
          ${isPl ? 'Do zapłaty' : 'Total due'}: <strong>${money(grand)}</strong>
        </p>
        ${bankBlock}
        <p style="color:#777;font-size:12px;margin-top:24px;">${COMPANY_DETAILS.name} · ${COMPANY_DETAILS.email}</p>
      </div>`

    await sendMail({
        to: buyerEmail,
        subject: `${isPl ? 'Faktura proforma' : 'Proforma invoice'} PROFORMA-${shortId}`,
        html,
        attachments: [{ filename: `proforma-${shortId}.pdf`, content: pdf, contentType: 'application/pdf' }],
    })
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const {
            total,
            requireInvoice,
            shippingAddress,
            billingAddress,
            paymentMethod,
            orderItems,
        }: {
            total: number
            requireInvoice: boolean
            shippingAddress: Record<string, unknown>
            billingAddress: Record<string, unknown>
            paymentMethod: PaymentMethod
            orderItems: OrderItemInput[]
        } = await request.json()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!paymentMethod) {
            return NextResponse.json({ error: 'Payment method is required' }, { status: 400 })
        }

        if (!Array.isArray(orderItems) || orderItems.length === 0) {
            return NextResponse.json({ error: 'Order items are required' }, { status: 400 })
        }

        const { data, error } = await supabase
            .rpc('create_order_with_inventory_check', {
                p_user_id: user.id,
                p_total_amount: total,
                p_is_b2b_invoice_required: requireInvoice,
                p_shipping_address: shippingAddress,
                p_billing_address: billingAddress,
                p_payment_method: paymentMethod,
                p_order_items: orderItems,
            })
            .single<CreateOrderRpcResult>()

        if (error) {
            return NextResponse.json(
                {
                    error: error.message || 'Failed to create order',
                    code: (error as any).code,
                    details: (error as any).details,
                },
                { status: 400 }
            )
        }

        if (!data?.success) {
            return NextResponse.json({ error: data?.error_message || 'Failed to create order' }, { status: 400 })
        }

        // Persist checkout addresses for future use server-side so navigation/redirect timing cannot drop it.
        try {
            const shipping = shippingAddress as CheckoutAddressPayload
            const billing = billingAddress as CheckoutAddressPayload

            await saveAddressIfNew(supabase, user.id, shipping, 'shipping', 'Checkout Shipping')

            if (!addressesMatch(shipping, billing)) {
                await saveAddressIfNew(supabase, user.id, billing, 'billing', 'Checkout Billing')
            }
        } catch (addressSaveError) {
            console.error('Server-side checkout address auto-save failed:', addressSaveError)
        }

        // Dispatch the Proforma / order-confirmation e-mail with the invoice PDF
        // attached. This must never block or fail the checkout completion — any
        // SMTP/rendering error is logged and swallowed.
        try {
            const locale = request.cookies.get('locale')?.value === 'pl' ? 'pl' : 'en'
            if (user.email && data.order_id) {
                await sendProformaEmail({
                    supabase,
                    orderId: data.order_id,
                    paymentMethod,
                    total,
                    buyerEmail: user.email,
                    shipping: shippingAddress as CheckoutAddressPayload & { nipNumber?: string },
                    billing: billingAddress as CheckoutAddressPayload & { nipNumber?: string },
                    locale,
                })
            }
        } catch (mailError) {
            console.error('Proforma e-mail dispatch failed (order still completed):', mailError)
        }

        return NextResponse.json({ success: true, orderId: data.order_id })
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
