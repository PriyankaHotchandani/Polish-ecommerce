import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

type PaymentMethod = 'card' | 'transfer' | 'cash_on_delivery'

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

        return NextResponse.json({ success: true, orderId: data.order_id })
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
