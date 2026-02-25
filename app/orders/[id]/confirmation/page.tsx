import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login')
    }

    // Fetch order with items
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
                    <h1 className="text-2xl font-bold text-red-600 mb-4">Order Not Found</h1>
                    <p className="text-gray-600 mb-6">
                        We couldn&apos;t find this order. It may have been deleted or you don&apos;t have permission to view it.
                    </p>
                    <Link
                        href="/shop"
                        className="inline-block bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Success Message */}
                <div className="bg-white rounded-lg shadow-sm p-8 text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                    <p className="text-gray-600 mb-6">
                        Thank you for your order. We&apos;ve received your order and will begin processing it shortly.
                    </p>
                    <div className="inline-block bg-gray-100 rounded-lg px-6 py-3">
                        <p className="text-sm text-gray-600">Order Number</p>
                        <p className="text-xl font-bold text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Order Details */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Order Details</h2>

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
                                            <span className="text-gray-400 text-xs">No image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{item.product.title}</h3>
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">
                                        Price: {Number(item.price_at_purchase).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'PLN',
                                            currencyDisplay: 'code'
                                        }).replace('PLN', 'PLN ')} each
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-900">
                                        {(Number(item.price_at_purchase) * item.quantity).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'PLN',
                                            currencyDisplay: 'code'
                                        }).replace('PLN', 'PLN ')}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <div className="flex justify-between text-lg font-bold text-gray-900">
                            <span>Total</span>
                            <span>
                                {Number(order.total_amount).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN',
                                    currencyDisplay: 'code'
                                }).replace('PLN', 'PLN ')}
                            </span>
                        </div>
                    </div>

                    {order.is_b2b_invoice_required && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                            <p className="text-sm text-blue-800">
                                📄 VAT invoice will be generated and sent to your email within 24 hours.
                            </p>
                        </div>
                    )}
                </div>

                {/* What's Next */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">What&apos;s Next?</h2>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>You&apos;ll receive an order confirmation email shortly.</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>We&apos;ll notify you when your order ships.</span>
                        </li>
                        <li className="flex items-start">
                            <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>You can track your order status in your account.</span>
                        </li>
                    </ul>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/orders"
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                    >
                        View All Orders
                    </Link>
                    <Link
                        href="/shop"
                        className="flex-1 bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-center"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    )
}
