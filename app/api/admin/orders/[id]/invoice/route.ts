import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024

async function sendInvoiceEmail(params: {
    to: string
    invoiceNumber: string
    invoiceUrl: string
    orderId: string
}) {
    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL || 'no-reply@bm-spzoo.pl'

    if (!apiKey) {
        throw new Error('Email provider is not configured (missing RESEND_API_KEY).')
    }

    const subject = `Invoice ${params.invoiceNumber} for order ${params.orderId.slice(0, 8).toUpperCase()}`
    const html = `
        <p>Hello,</p>
        <p>Your invoice <strong>${params.invoiceNumber}</strong> is ready.</p>
        <p>You can download it here: <a href="${params.invoiceUrl}">${params.invoiceUrl}</a></p>
        <p>Thank you for your order.</p>
    `

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from,
            to: [params.to],
            subject,
            html,
        }),
    })

    if (!response.ok) {
        const payload = await response.text()
        throw new Error(`Email API failed: ${payload}`)
    }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: currentUser } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (currentUser?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { id: orderId } = await context.params
        const formData = await request.formData()

        const file = formData.get('invoiceFile')
        const providedInvoiceNumber = (formData.get('invoiceNumber') as string | null)?.trim()
        const sendEmail = (formData.get('sendEmail') as string | null) === 'true'

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id,user_id,invoice_url,invoice_number,user:users(email)')
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        let invoiceUrl = order.invoice_url as string | null
        let invoiceNumber = providedInvoiceNumber || order.invoice_number || `INV-MANUAL-${order.id.slice(0, 8).toUpperCase()}`

        if (file && file instanceof File) {
            if (file.type !== 'application/pdf') {
                return NextResponse.json({ error: 'Only PDF files are allowed.' }, { status: 400 })
            }

            if (file.size > MAX_PDF_SIZE_BYTES) {
                return NextResponse.json({ error: 'PDF file is too large (max 10MB).' }, { status: 400 })
            }

            const arrayBuffer = await file.arrayBuffer()
            const fileBuffer = Buffer.from(arrayBuffer)
            const safeInvoice = invoiceNumber.replace(/[^a-zA-Z0-9-_/.]/g, '-')
            const filePath = `invoices/${order.user_id}/manual-${safeInvoice}.pdf`

            const { error: uploadError } = await supabase.storage
                .from('invoices')
                .upload(filePath, fileBuffer, {
                    contentType: 'application/pdf',
                    upsert: true,
                })

            if (uploadError) {
                return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from('invoices').getPublicUrl(filePath)

            invoiceUrl = publicUrl
        }

        if (!invoiceUrl) {
            return NextResponse.json({ error: 'Upload a PDF or provide an existing invoice URL first.' }, { status: 400 })
        }

        const { error: updateError } = await supabase.rpc('set_order_invoice_fields', {
            p_order_id: orderId,
            p_invoice_number: invoiceNumber,
            p_invoice_url: invoiceUrl,
            p_invoice_generated_at: new Date().toISOString(),
        })

        if (updateError) {
            return NextResponse.json({ error: `Failed to update order: ${updateError.message}` }, { status: 500 })
        }

        let emailSent = false
        let emailError: string | null = null

        const customerEmail = (order.user as { email?: string } | null)?.email
        if (sendEmail && customerEmail) {
            try {
                await sendInvoiceEmail({
                    to: customerEmail,
                    invoiceNumber,
                    invoiceUrl,
                    orderId,
                })
                emailSent = true
            } catch (mailError) {
                emailError = mailError instanceof Error ? mailError.message : 'Failed to send email.'
            }
        }

        return NextResponse.json({
            success: true,
            invoiceUrl,
            invoiceNumber,
            emailSent,
            emailError,
        })
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        )
    }
}
