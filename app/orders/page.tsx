import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import { getLocalizedProductTitle } from '@/utils/productLocalization'

type Locale = 'en' | 'pl'

const statusColors = {
    pending: 'bg-amber-100 text-amber-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-sky-100 text-sky-800',
    delivered: 'bg-emerald-100 text-emerald-800',
}

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

export default async function OrdersPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const messages = MESSAGES[locale]
    const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

    const statusLabels = {
        pending: messages.order.pending,
        processing: messages.order.processing,
        shipped: messages.order.shipped,
        delivered: messages.order.delivered,
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?redirect=/orders')
    }

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                product:products (*)
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching orders:', error)
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12 md:pt-28 md:pb-14">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{messages.order.myOrders}</h1>
                    <p className="mt-2 text-gray-600">{messages.ordersPage.subtitle}</p>
                </div>

                {!orders || orders.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <svg
                            className="mx-auto h-24 w-24 text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{messages.ordersPage.emptyTitle}</h3>
                        <p className="text-gray-600 mb-6">{messages.ordersPage.emptyHint}</p>
                        <Link
                            href="/shop"
                            className="inline-block bg-[#163579] text-white py-3 px-6 rounded-md shadow-sm hover:bg-[#102a63] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 font-semibold"
                        >
                            {messages.ordersPage.startShopping}
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order, index) => {
                            const itemCount = order.order_items.length
                            const totalItems = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0)
                            const primaryItem = order.order_items[0]
                            const primaryProduct = primaryItem?.product
                            const primaryTitle = primaryProduct
                                ? getLocalizedProductTitle(primaryProduct.title, primaryProduct.slug, locale)
                                : null

                            return (
                                <div
                                    key={order.id}
                                    className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 shop-card-reveal"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
                                            <div>
                                                <p className="text-[0.65rem] tracking-[0.12em] uppercase font-semibold text-gray-500 mb-1">
                                                    {messages.ordersPage.orderPlacedLabel.replace(':', '')}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {new Date(order.created_at).toLocaleDateString(numberLocale, {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-[0.65rem] tracking-[0.12em] uppercase font-semibold text-gray-500 mb-1">
                                                    {messages.order.total}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {Number(order.total_amount).toLocaleString(numberLocale, {
                                                        style: 'currency',
                                                        currency: 'PLN',
                                                        currencyDisplay: 'code',
                                                    }).replace('PLN', 'PLN ')}
                                                </p>
                                            </div>

                                            <div className="sm:text-right">
                                                <p className="text-[0.65rem] tracking-[0.12em] uppercase font-semibold text-gray-500 mb-1">
                                                    {messages.order.orderNumber.replace('#', '').trim()} #
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {order.id.slice(0, 8).toUpperCase()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-5 py-5 bg-white">
                                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                                            <div className="flex items-start gap-4 min-w-0">
                                                <div className="w-20 h-20 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                    {primaryProduct?.image_urls?.[0] ? (
                                                        <img
                                                            src={primaryProduct.image_urls[0]}
                                                            alt={primaryTitle || primaryProduct.title}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full px-1 text-center">
                                                            <span className="text-gray-400 text-[0.65rem]">{messages.cartPage.noImage}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                                        {primaryTitle || messages.ordersPage.productSingular}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Qty: {primaryItem?.quantity || 0}
                                                    </p>
                                                    {order.is_b2b_invoice_required && (
                                                        <p className="text-xs text-blue-700 mt-1">{messages.ordersPage.invoiceRequired}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-2">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                                                    {statusLabels[order.status as keyof typeof statusLabels]}
                                                </span>
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="inline-flex items-center justify-center px-3.5 py-1.5 text-sm font-medium rounded-md border border-[#163579] text-[#163579] bg-white hover:bg-[#163579]/5 transition-colors"
                                                >
                                                    {messages.order.viewDetails}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
