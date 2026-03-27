import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import InvoiceButton from '@/components/InvoiceButton'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import { getLocalizedBrandName, getLocalizedProductTitle } from '@/utils/productLocalization'

type Address = {
    fullName?: string
    email?: string
    phone?: string
    street?: string
    city?: string
    postalCode?: string
    country?: string
    companyName?: string
    nipNumber?: string
}

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

const paymentMethodLabels = {
    card: 'card',
    transfer: 'transfer',
    cash_on_delivery: 'cash_on_delivery',
} as const

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
}

const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-sky-100 text-sky-800',
    delivered: 'bg-emerald-100 text-emerald-800',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const messages = MESSAGES[locale]
    const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

    const paymentStatusLabels = {
        pending: messages.order.pending,
        processing: messages.order.processing,
        completed: messages.orderDetail.paymentCompleted,
        failed: messages.orderDetail.paymentFailed,
        refunded: messages.orderDetail.paymentRefunded,
    }

    const statusLabels = {
        pending: messages.order.pending,
        processing: messages.order.processing,
        shipped: messages.order.shipped,
        delivered: messages.order.delivered,
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                product:products (*)
            )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24 pb-12 md:pt-28 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">{messages.orderDetail.notFoundTitle}</h1>
                    <p className="text-gray-600 mb-6">{messages.orderDetail.notFoundHint}</p>
                    <Link
                        href="/orders"
                        className="inline-block bg-[#163579] text-white py-2 px-6 rounded-md font-semibold hover:bg-[#102a63] transition-colors"
                    >
                        {messages.ordersPage.viewAllOrders}
                    </Link>
                </div>
            </div>
        )
    }

    const renderAddressBlock = (title: string, address: Address | null | undefined) => {
        if (!address) return null

        return (
            <div>
                <h3 className="text-xs uppercase tracking-[0.1em] font-semibold text-gray-500 mb-2">{title}</h3>
                <div className="text-sm text-gray-700 space-y-1">
                    {address.fullName && <p>{address.fullName}</p>}
                    {address.companyName && <p>{address.companyName}</p>}
                    {address.nipNumber && <p>{messages.invoice.nip}: {address.nipNumber}</p>}
                    {address.street && <p>{address.street}</p>}
                    {(address.postalCode || address.city) && <p>{address.postalCode} {address.city}</p>}
                    {address.country && <p>{address.country}</p>}
                    {address.phone && <p>{messages.profile.phone}: {address.phone}</p>}
                    {address.email && <p>{messages.profile.email}: {address.email}</p>}
                </div>
            </div>
        )
    }

    const orderStatusSteps = ['pending', 'processing', 'shipped', 'delivered'] as const
    const currentStepIndex = Math.max(orderStatusSteps.indexOf((order.status as typeof orderStatusSteps[number]) || 'pending'), 0)
    const subtotal = Number(order.total_amount) / 1.23
    const vatAmount = Number(order.total_amount) - subtotal

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 md:pt-28 md:pb-14">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                <Link
                    href="/orders"
                    className="inline-flex items-center text-gray-600 hover:text-[#163579] mb-6 transition-colors"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {messages.orderDetail.backToOrders}
                </Link>

                <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                {messages.order.orderNumber}{order.id.slice(0, 8).toUpperCase()}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                {messages.orderDetail.placedOn}{' '}
                                {new Date(order.created_at).toLocaleDateString(numberLocale, {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[order.status as keyof typeof statusColors]}`}>
                            {statusLabels[order.status as keyof typeof statusLabels]}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">{messages.orderDetail.orderStatus}</h2>
                            <div className="space-y-4">
                                <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-y-4 sm:gap-x-2">
                                    <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -translate-y-1/2" aria-hidden="true" />
                                    <div
                                        className="absolute left-0 top-1/2 h-1 bg-[#163579] -translate-y-1/2 transition-all duration-500"
                                        style={{ width: `${(currentStepIndex / (orderStatusSteps.length - 1)) * 100}%` }}
                                        aria-hidden="true"
                                    />

                                    {[
                                        { key: 'pending', title: messages.orderDetail.stepPlacedTitle, subtitle: messages.orderDetail.stepPlacedSubtitle },
                                        { key: 'processing', title: messages.order.processing, subtitle: messages.orderDetail.stepProcessingSubtitle },
                                        { key: 'shipped', title: messages.order.shipped, subtitle: messages.orderDetail.stepShippedSubtitle },
                                        { key: 'delivered', title: messages.order.delivered, subtitle: messages.orderDetail.stepDeliveredSubtitle },
                                    ].map((step, index) => {
                                        const isCompleted = index < currentStepIndex
                                        const isActive = index === currentStepIndex
                                        const isFuture = index > currentStepIndex

                                        return (
                                            <div key={step.key} className="relative z-20 h-10 w-10 rounded-full bg-white flex items-center justify-center justify-self-start sm:justify-self-center">
                                                {isCompleted && (
                                                    <span className="h-8 w-8 rounded-full bg-[#163579] border border-[#163579] flex items-center justify-center">
                                                        <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                )}

                                                {isActive && (
                                                    <span className="h-8 w-8 rounded-full border border-[#163579]/50 bg-white flex items-center justify-center animate-pulse">
                                                        <span className="h-4 w-4 rounded-full bg-[#163579]" aria-hidden="true" />
                                                    </span>
                                                )}

                                                {isFuture && (
                                                    <span className="h-8 w-8 rounded-full border-2 border-gray-300 bg-white" aria-hidden="true" />
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:gap-x-2">
                                    {[
                                        { key: 'pending', title: messages.orderDetail.stepPlacedTitle, subtitle: messages.orderDetail.stepPlacedSubtitle },
                                        { key: 'processing', title: messages.order.processing, subtitle: messages.orderDetail.stepProcessingSubtitle },
                                        { key: 'shipped', title: messages.order.shipped, subtitle: messages.orderDetail.stepShippedSubtitle },
                                        { key: 'delivered', title: messages.order.delivered, subtitle: messages.orderDetail.stepDeliveredSubtitle },
                                    ].map((step, index) => {
                                        const isFuture = index > currentStepIndex

                                        return (
                                            <div key={step.key} className="text-left sm:text-center">
                                                <p className={`text-sm font-semibold ${isFuture ? 'text-gray-500' : 'text-[#163579]'}`}>
                                                    {step.title}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1 max-w-[10rem] leading-relaxed sm:mx-auto">{step.subtitle}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">{messages.orderDetail.orderItems}</h2>

                            <div className="space-y-4">
                                {order.order_items.map((item: any) => {
                                    const productTitle = getLocalizedProductTitle(item.product.title, item.product.slug, locale)
                                    const productBrand = getLocalizedBrandName(item.product.brand, locale)

                                    return (
                                        <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                                            <Link href={`/product/${item.product.slug}`} className="flex-shrink-0">
                                                <div className="w-24 h-24 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
                                                    {item.product.image_urls?.[0] ? (
                                                        <img
                                                            src={item.product.image_urls[0]}
                                                            alt={productTitle}
                                                            className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <span className="text-gray-400 text-xs">{messages.cartPage.noImage}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Link>
                                            <div className="flex-1">
                                                <Link href={`/product/${item.product.slug}`} className="hover:text-[#163579] transition-colors">
                                                    <h3 className="font-semibold text-gray-900">{productTitle}</h3>
                                                </Link>
                                                {productBrand && (
                                                    <p className="text-sm text-gray-600">{productBrand}</p>
                                                )}
                                                <p className="text-sm text-gray-600 mt-1">{messages.cart.quantity}: {item.quantity}</p>
                                                <p className="text-sm text-gray-600">
                                                    {Number(item.price_at_purchase).toLocaleString(numberLocale, {
                                                        style: 'currency',
                                                        currency: 'PLN',
                                                        currencyDisplay: 'code',
                                                    }).replace('PLN', 'PLN ')} {messages.cartPage.each}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900">
                                                    {(Number(item.price_at_purchase) * item.quantity).toLocaleString(numberLocale, {
                                                        style: 'currency',
                                                        currency: 'PLN',
                                                        currencyDisplay: 'code',
                                                    }).replace('PLN', 'PLN ')}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="border-t pt-4 mt-6 space-y-2">
                                <div className="flex items-center justify-between text-sm text-gray-700">
                                    <span>{messages.invoice.subtotal}</span>
                                    <span>
                                        {subtotal.toLocaleString(numberLocale, {
                                            style: 'currency',
                                            currency: 'PLN',
                                            currencyDisplay: 'code',
                                        }).replace('PLN', 'PLN ')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-700">
                                    <span>{messages.invoice.vat} (23%)</span>
                                    <span>
                                        {vatAmount.toLocaleString(numberLocale, {
                                            style: 'currency',
                                            currency: 'PLN',
                                            currencyDisplay: 'code',
                                        }).replace('PLN', 'PLN ')}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-700">
                                    <span>{messages.invoice.shipping}</span>
                                    <span>{locale === 'pl' ? 'Darmowa' : 'Free'}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-100 mt-2">
                                    <span>{messages.order.total}</span>
                                    <span>
                                        {Number(order.total_amount).toLocaleString(numberLocale, {
                                            style: 'currency',
                                            currency: 'PLN',
                                            currencyDisplay: 'code',
                                        }).replace('PLN', 'PLN ')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {(order.shipping_address || order.billing_address || order.payment_method) && (
                            <div className="bg-white rounded-2xl shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.orderDetail.deliveryPayment}</h2>
                                <div className="space-y-5">
                                    {renderAddressBlock(messages.orderDetail.shippingAddress, order.shipping_address as Address | null)}
                                    {renderAddressBlock(messages.orderDetail.billingAddress, order.billing_address as Address | null)}
                                </div>

                                {order.payment_method && (
                                    <p className="mt-5 text-sm text-gray-700">
                                        <span className="text-xs uppercase tracking-[0.08em] font-semibold text-gray-500">{messages.invoice.paymentMethod}</span>
                                        <br />
                                        <span className="font-semibold text-gray-900">
                                            {messages.invoice.paymentMethods[paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels] || 'notSpecified']}
                                        </span>
                                    </p>
                                )}

                                <div className="mt-4">
                                    <span className="text-xs uppercase tracking-[0.08em] font-semibold text-gray-500">{messages.orderDetail.paymentStatus}</span>
                                    <div className="mt-1">
                                        {(() => {
                                            const paymentStatusKey = (order.payment_status || 'pending') as keyof typeof paymentStatusLabels
                                            return (
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.payment_status || 'pending']}`}>
                                                    {paymentStatusLabels[paymentStatusKey]}
                                                </span>
                                            )
                                        })()}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.orderDetail.invoiceTitle}</h2>
                            <InvoiceButton
                                orderId={order.id}
                                existingInvoiceUrl={order.invoice_url}
                                existingInvoiceNumber={order.invoice_number}
                                buttonText={locale === 'pl' ? 'Pobierz PDF' : 'Download PDF'}
                                generateButtonText={locale === 'pl' ? 'Faktura oczekuje na przesłanie przez administratora' : 'Invoice pending admin upload'}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#163579] text-white rounded-md shadow-sm hover:bg-[#102a63] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 font-medium"
                                downloadingText={locale === 'pl' ? 'Pobieranie...' : 'Downloading...'}
                                invoiceNumberLabel={locale === 'pl' ? 'Faktura #' : 'Invoice #'}
                            />
                            {!order.invoice_url && (
                                <p className="text-sm text-gray-600 mt-3">{messages.orderDetail.invoiceHint}</p>
                            )}
                            {order.is_b2b_invoice_required && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                                    <p className="text-sm text-blue-800 font-medium">{messages.orderDetail.invoiceRequiredBanner}</p>
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-sm text-gray-500">
                                    {locale === 'pl' ? 'Potrzebujesz pomocy z tym zamówieniem?' : 'Need help with this order?'}{' '}
                                    <button className="underline hover:text-[#163579] transition-colors" type="button">
                                        {messages.orderDetail.contactSupport}
                                    </button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
