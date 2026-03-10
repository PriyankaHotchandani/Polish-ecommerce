import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import type { InvoiceData } from '@/components/InvoiceDocument'
import { generateInvoicePDF } from '@/utils/generateInvoicePDF'
import { getInvoiceTranslations } from '@/utils/invoiceTranslations'

function formatPaymentMethod(method: string | null, locale: string = 'pl'): string {
    if (!method) return getInvoiceTranslations(locale).paymentMethods.notSpecified

    const translations = getInvoiceTranslations(locale).paymentMethods
    const key = method as keyof typeof translations

    return translations[key] || method
}

function roundTo2(value: number): number {
    return Math.round(value * 100) / 100
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get order ID from request
        const { orderId } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
        }

        // Fetch order with items and user data
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select(
                `
                *,
                order_items (
                    *,
                    product:products (*)
                ),
                user:users (*)
            `
            )
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            // PGRST116 is "no rows found" for .single(); other errors should surface as server issues.
            const code = (orderError as any)?.code
            if (code === 'PGRST116' || !order) {
                return NextResponse.json({ error: 'Order not found' }, { status: 404 })
            }

            return NextResponse.json(
                {
                    error: 'Failed to fetch order for invoice',
                    details: orderError?.message,
                },
                { status: 500 }
            )
        }

        // Check permissions: user must own the order or be admin
        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        const isAdmin = currentUser?.role === 'admin'
        const isOwner = order.user_id === user.id

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // If invoice already exists, return existing URL
        if (order.invoice_url) {
            return NextResponse.json({
                success: true,
                invoiceUrl: order.invoice_url,
                invoiceNumber: order.invoice_number,
                message: 'Invoice already generated',
            })
        }

        // Generate invoice number
        const { data: invoiceNumberResult, error: invoiceNumberError } = await supabase.rpc(
            'generate_invoice_number'
        )

        if (invoiceNumberError || !invoiceNumberResult) {
            console.error('Error generating invoice number:', invoiceNumberError)
            return NextResponse.json(
                { error: 'Failed to generate invoice number' },
                { status: 500 }
            )
        }

        const invoiceNumber = invoiceNumberResult as string

        // Prepare invoice data
        const billingAddr = order.billing_address as any
        const shippingAddr = order.shipping_address as any
        const buyer = order.user as any
        const acceptLanguage = request.headers.get('accept-language') || ''
        const userLocale = acceptLanguage.toLowerCase().startsWith('en') ? 'en' : 'pl'
        const invoiceT = getInvoiceTranslations(userLocale)

        // Match checkout math:
        // subtotal = sum(order item net prices)
        // VAT = subtotal * 23%
        // total = subtotal + VAT + shipping
        const itemsNetSubtotal = roundTo2(
            order.order_items.reduce(
                (sum: number, item: any) => sum + Number(item.price_at_purchase) * item.quantity,
                0
            )
        )
        const vatAmount = roundTo2(itemsNetSubtotal * 0.23)
        const totalAmount = Number(order.total_amount)
        const inferredAdditional = roundTo2(totalAmount - itemsNetSubtotal - vatAmount)

        const additionalCharges = [] as Array<{ label: string; amount: number }>
        if (Math.abs(inferredAdditional) >= 0.01) {
            additionalCharges.push({
                label: inferredAdditional > 0 ? invoiceT.shipping : invoiceT.adjustment,
                amount: inferredAdditional,
            })
        }

        const invoiceData: InvoiceData = {
            invoiceNumber,
            orderNumber: order.id.slice(0, 8).toUpperCase(),
            issueDate: new Date(order.created_at).toLocaleDateString(userLocale === 'pl' ? 'pl-PL' : 'en-GB'),
            dueDate: new Date(
                new Date(order.created_at).getTime() + 14 * 24 * 60 * 60 * 1000
            ).toLocaleDateString(userLocale === 'pl' ? 'pl-PL' : 'en-GB'),
            seller: {
                name: 'BM SP. Z O.O.',
                address: 'ul. Przykładowa 123',
                city: 'Warsaw',
                postalCode: '00-001',
                nip: '1234567890',
                email: 'contact@bm.pl',
                phone: '+48 123 456 789',
            },
            buyer: {
                name: billingAddr?.fullName || `${buyer?.first_name || ''} ${buyer?.last_name || ''}`.trim(),
                companyName: buyer?.company_name || billingAddr?.companyName,
                nipNumber: buyer?.nip_number || billingAddr?.nipNumber,
                address: billingAddr?.street || shippingAddr?.street || '',
                city: billingAddr?.city || shippingAddr?.city || '',
                postalCode: billingAddr?.postalCode || shippingAddr?.postalCode || '',
                country: billingAddr?.country || shippingAddr?.country || 'Poland',
                email: billingAddr?.email || buyer?.email || '',
                phone: billingAddr?.phone || shippingAddr?.phone || buyer?.phone || '',
            },
            items: order.order_items.map((item: any) => ({
                sku: item.product.sku,
                title: item.product.title,
                quantity: item.quantity,
                price: Number(item.price_at_purchase),
                total: Number(item.price_at_purchase) * item.quantity,
            })),
            subtotal: itemsNetSubtotal,
            vatRate: 0.23,
            vatAmount,
            additionalCharges,
            total: totalAmount,
            paymentMethod: formatPaymentMethod(order.payment_method, userLocale),
        }

        // Generate PDF buffer with user's preferred locale
        const pdfBuffer = await generateInvoicePDF(invoiceData, userLocale)

        // Upload to Supabase Storage
        const fileName = `invoice-${invoiceNumber.replace(/\//g, '-')}.pdf`
        const filePath = `invoices/${order.user_id}/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('invoices')
            .upload(filePath, pdfBuffer, {
                contentType: 'application/pdf',
                upsert: false,
            })

        if (uploadError) {
            // If file already exists from a previous partial attempt, continue and reuse it.
            if ((uploadError as any).statusCode !== '409') {
                console.error('Error uploading invoice:', uploadError)
                return NextResponse.json(
                    { error: 'Failed to upload invoice', details: uploadError.message },
                    { status: 500 }
                )
            }
        }

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from('invoices').getPublicUrl(filePath)

        // Update order with invoice details through secure RPC.
        const { error: updateError } = await supabase.rpc('set_order_invoice_fields', {
            p_order_id: orderId,
            p_invoice_number: invoiceNumber,
            p_invoice_url: publicUrl,
            p_invoice_generated_at: new Date().toISOString(),
        })

        if (updateError) {
            // Retry with guaranteed-unique invoice number if unique constraint is hit.
            if ((updateError as any).code === '23505') {
                const fallbackInvoiceNumber = `${invoiceNumber}-${orderId.slice(0, 8).toUpperCase()}`
                const fallbackFileName = `invoice-${fallbackInvoiceNumber.replace(/\//g, '-')}.pdf`
                const fallbackFilePath = `invoices/${order.user_id}/${fallbackFileName}`

                const { error: fallbackUploadError } = await supabase.storage
                    .from('invoices')
                    .upload(fallbackFilePath, pdfBuffer, {
                        contentType: 'application/pdf',
                        upsert: false,
                    })

                if (fallbackUploadError && (fallbackUploadError as any).statusCode !== '409') {
                    console.error('Error uploading fallback invoice:', fallbackUploadError)
                    return NextResponse.json(
                        { error: 'Failed to upload invoice', details: fallbackUploadError.message },
                        { status: 500 }
                    )
                }

                const {
                    data: { publicUrl: fallbackPublicUrl },
                } = supabase.storage.from('invoices').getPublicUrl(fallbackFilePath)

                const { error: fallbackUpdateError } = await supabase.rpc('set_order_invoice_fields', {
                    p_order_id: orderId,
                    p_invoice_number: fallbackInvoiceNumber,
                    p_invoice_url: fallbackPublicUrl,
                    p_invoice_generated_at: new Date().toISOString(),
                })

                if (fallbackUpdateError) {
                    console.error('Error updating order with fallback invoice number:', fallbackUpdateError)
                    return NextResponse.json(
                        {
                            error: 'Failed to update order',
                            details: fallbackUpdateError.message,
                        },
                        { status: 500 }
                    )
                }

                return NextResponse.json({
                    success: true,
                    invoiceUrl: fallbackPublicUrl,
                    invoiceNumber: fallbackInvoiceNumber,
                    message: 'Invoice generated successfully',
                })
            }

            console.error('Error updating order:', updateError)
            return NextResponse.json(
                {
                    error: 'Failed to update order',
                    details: updateError.message,
                },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            invoiceUrl: publicUrl,
            invoiceNumber,
            message: 'Invoice generated successfully',
        })
    } catch (error) {
        console.error('Error generating invoice:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        )
    }
}
