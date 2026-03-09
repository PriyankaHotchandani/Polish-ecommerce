import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { InvoiceDocument } from '@/components/InvoiceDocument'
import type { InvoiceData } from '@/components/InvoiceDocument'

export async function generateInvoicePDF(invoiceData: InvoiceData, locale: string = 'pl'): Promise<Buffer> {
    const element = createElement(InvoiceDocument, { data: invoiceData, locale })
    const buffer = await renderToBuffer(element as any)
    return buffer
}
