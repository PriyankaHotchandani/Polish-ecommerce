import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const messages = MESSAGES[locale]
    const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

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
                        href="/shop"
                        className="inline-block bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700"
                    >
                        {messages.cart.continueShopping}
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{messages.orderConfirmation.title}</h1>
                    <p className="text-gray-600 mb-6">{messages.orderConfirmation.subtitle}</p>
                    <div className="inline-block bg-gray-100 rounded-lg px-6 py-3">
                        <p className="text-sm text-gray-600">{messages.orderConfirmation.orderNumberLabel}</p>
                        <p className="text-xl font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">{messages.orderConfirmation.orderDetailsTitle}</h2>

                    <div className="space-y-4 mb-6">
                        {order.order_items.map((item: any) => (
                            <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                                <div className="w-20 h-20 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                                    {item.product.image_urls?.[0] ? (
                                        <img
                                            src={item.product.image_urls[0]}
                                            alt={item.product.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <span className="text-gray-400 text-xs">{messages.cartPage.noImage}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{item.product.title}</h3>
                                    <p className="text-sm text-gray-600">{messages.cart.quantity}: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">
                                        {messages.product.price}:{' '}
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

                    <div className="border-t pt-4 space-y-2">
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

                    {order.is_b2b_invoice_required && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                            <p className="text-sm text-blue-800">{messages.orderConfirmation.invoiceNotice}</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.orderConfirmation.nextTitle}</h2>
                    <ul className="space-y-3 text-gray-700">
                        {messages.orderConfirmation.nextSteps.map((step: string) => (
                            <li key={step} className="flex items-start">
                                <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/orders"
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                    >
                        {messages.ordersPage.viewAllOrders}
                    </Link>
                    <Link
                        href="/shop"
                        className="flex-1 bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                    >
                        {messages.cart.continueShopping}
                    </Link>
                </div>
            </div>
        </div>
    )
}
