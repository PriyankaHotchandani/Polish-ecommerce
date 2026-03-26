import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import InvoiceButton from '@/components/InvoiceButton'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

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
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-sm p-8 max-w-md text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">{messages.orderDetail.notFoundTitle}</h1>
                    <p className="text-gray-600 mb-6">{messages.orderDetail.notFoundHint}</p>
                    <Link
                        href="/orders"
                        className="inline-block bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700"
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
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
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

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href="/orders"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    {messages.orderDetail.backToOrders}
                </Link>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
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

                    <div className="border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">{messages.orderDetail.orderStatus}</h2>
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            <div className="space-y-6">
                                {[
                                    { key: 'placed', active: true, title: messages.orderDetail.stepPlacedTitle, subtitle: messages.orderDetail.stepPlacedSubtitle },
                                    { key: 'processing', active: ['processing', 'shipped', 'delivered'].includes(order.status), title: messages.order.processing, subtitle: messages.orderDetail.stepProcessingSubtitle },
                                    { key: 'shipped', active: ['shipped', 'delivered'].includes(order.status), title: messages.order.shipped, subtitle: messages.orderDetail.stepShippedSubtitle },
                                    { key: 'delivered', active: order.status === 'delivered', title: messages.order.delivered, subtitle: messages.orderDetail.stepDeliveredSubtitle },
                                ].map((step) => (
                                    <div key={step.key} className="relative flex items-start">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step.active ? 'bg-green-500' : 'bg-gray-300'} z-10`}>
                                            {step.active ? (
                                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <p className="font-medium text-gray-900">{step.title}</p>
                                            <p className="text-sm text-gray-600">{step.subtitle}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{messages.orderDetail.orderItems}</h2>

                    <div className="space-y-4">
                        {order.order_items.map((item: any) => (
                            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                                <Link href={`/product/${item.product.slug}`} className="flex-shrink-0">
                                    <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                                        {item.product.image_urls?.[0] ? (
                                            <img
                                                src={item.product.image_urls[0]}
                                                alt={item.product.title}
                                                className="w-full h-full object-cover hover:opacity-75 transition-opacity"
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <span className="text-gray-400 text-xs">{messages.cartPage.noImage}</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/product/${item.product.slug}`} className="hover:text-green-600">
                                        <h3 className="font-semibold text-gray-900">{item.product.title}</h3>
                                    </Link>
                                    {item.product.brand && (
                                        <p className="text-sm text-gray-600">{item.product.brand}</p>
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
                        ))}
                    </div>

                    <div className="border-t pt-4 mt-6">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
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

                {(order.shipping_address || order.billing_address || order.payment_method) && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.orderDetail.deliveryPayment}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderAddressBlock(messages.orderDetail.shippingAddress, order.shipping_address as Address | null)}
                            {renderAddressBlock(messages.orderDetail.billingAddress, order.billing_address as Address | null)}
                        </div>
                        {order.payment_method && (
                            <p className="mt-4 text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">{messages.invoice.paymentMethod}:</span>{' '}
                                {messages.invoice.paymentMethods[paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels] || 'notSpecified']}
                            </p>
                        )}
                        <div className="mt-2">
                            <span className="text-sm font-semibold text-gray-900">{messages.orderDetail.paymentStatus}:</span>{' '}
                            {(() => {
                                const paymentStatusKey = (order.payment_status || 'pending') as keyof typeof paymentStatusLabels
                                return (
                                    <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.payment_status || 'pending']}`}>
                                        {paymentStatusLabels[paymentStatusKey]}
                                    </span>
                                )
                            })()}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.orderDetail.invoiceTitle}</h2>
                    <InvoiceButton
                        orderId={order.id}
                        existingInvoiceUrl={order.invoice_url}
                        existingInvoiceNumber={order.invoice_number}
                    />
                    {!order.invoice_url && (
                        <p className="text-sm text-gray-600 mt-3">{messages.orderDetail.invoiceHint}</p>
                    )}
                    {order.is_b2b_invoice_required && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                            <p className="text-sm text-blue-800 font-medium">{messages.orderDetail.invoiceRequiredBanner}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/shop"
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                    >
                        {messages.cart.continueShopping}
                    </Link>
                    <button
                        className="flex-1 bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        {messages.orderDetail.contactSupport}
                    </button>
                </div>
            </div>
        </div>
    )
}
