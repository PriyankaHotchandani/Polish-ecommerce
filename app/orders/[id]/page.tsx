import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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

const paymentMethodLabels: Record<string, string> = {
    card: 'Card',
    transfer: 'Bank Transfer',
    cash_on_delivery: 'Cash on Delivery'
}

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded'
}

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800'
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800'
}

const statusLabels = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered'
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
                        href="/orders"
                        className="inline-block bg-green-600 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-700"
                    >
                        View All Orders
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
                    {address.nipNumber && <p>NIP: {address.nipNumber}</p>}
                    {address.street && <p>{address.street}</p>}
                    {(address.postalCode || address.city) && <p>{address.postalCode} {address.city}</p>}
                    {address.country && <p>{address.country}</p>}
                    {address.phone && <p>Phone: {address.phone}</p>}
                    {address.email && <p>Email: {address.email}</p>}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link
                    href="/orders"
                    className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Orders
                </Link>

                {/* Order Header */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                Order #{order.id.slice(0, 8).toUpperCase()}
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[order.status as keyof typeof statusColors]}`}>
                            {statusLabels[order.status as keyof typeof statusLabels]}
                        </span>
                    </div>

                    {/* Order Status Timeline */}
                    <div className="border-t pt-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Status</h2>
                        <div className="relative">
                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                            <div className="space-y-6">
                                <div className="relative flex items-start">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${order.status === 'pending' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'} z-10`}>
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Order Placed</p>
                                        <p className="text-sm text-gray-600">Your order has been received</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'} z-10`}>
                                        {order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered' ? (
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Processing</p>
                                        <p className="text-sm text-gray-600">We&apos;re preparing your order</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${order.status === 'shipped' || order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'} z-10`}>
                                        {order.status === 'shipped' || order.status === 'delivered' ? (
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Shipped</p>
                                        <p className="text-sm text-gray-600">Your order is on the way</p>
                                    </div>
                                </div>

                                <div className="relative flex items-start">
                                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${order.status === 'delivered' ? 'bg-green-500' : 'bg-gray-300'} z-10`}>
                                        {order.status === 'delivered' ? (
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        ) : (
                                            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="ml-4">
                                        <p className="font-medium text-gray-900">Delivered</p>
                                        <p className="text-sm text-gray-600">Your order has been delivered</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Order Items</h2>

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
                                                <span className="text-gray-400 text-xs">No image</span>
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
                                    <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">
                                        {Number(item.price_at_purchase).toLocaleString('en-US', {
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

                    <div className="border-t pt-4 mt-6">
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
                            <p className="text-sm text-blue-800 font-medium">
                                📄 VAT Invoice Required
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                Your invoice will be sent to your email within 24 hours.
                            </p>
                        </div>
                    )}
                </div>

                {(order.shipping_address || order.billing_address || order.payment_method) && (
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery & Payment</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderAddressBlock('Shipping Address', order.shipping_address as Address | null)}
                            {renderAddressBlock('Billing Address', order.billing_address as Address | null)}
                        </div>
                        {order.payment_method && (
                            <p className="mt-4 text-sm text-gray-700">
                                <span className="font-semibold text-gray-900">Payment Method:</span>{' '}
                                {paymentMethodLabels[order.payment_method] || order.payment_method}
                            </p>
                        )}
                        <div className="mt-2">
                            <span className="text-sm font-semibold text-gray-900">Payment Status:</span>{' '}
                            <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                                paymentStatusColors[order.payment_status || 'pending']
                            }`}>
                                {paymentStatusLabels[order.payment_status || 'pending']}
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/shop"
                        className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors text-center"
                    >
                        Continue Shopping
                    </Link>
                    <button
                        className="flex-1 bg-gray-200 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    )
}
