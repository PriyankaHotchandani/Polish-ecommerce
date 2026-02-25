import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

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

export default async function OrdersPage() {
    const supabase = await createClient()

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?redirect=/orders')
    }

    // Fetch user's orders
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
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">My Orders</h1>
                    <p className="mt-2 text-gray-600">
                        View and track your order history
                    </p>
                </div>

                {!orders || orders.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
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
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h3>
                        <p className="text-gray-600 mb-6">
                            You haven&apos;t placed any orders. Start shopping to see your orders here.
                        </p>
                        <Link
                            href="/shop"
                            className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map((order) => {
                            const itemCount = order.order_items.length
                            const totalItems = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0)

                            return (
                                <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                    {/* Order Header */}
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">
                                                    Order placed: {new Date(order.created_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 mt-1">
                                                    Order #{order.id.slice(0, 8).toUpperCase()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status as keyof typeof statusColors]}`}>
                                                    {statusLabels[order.status as keyof typeof statusLabels]}
                                                </span>
                                                <Link
                                                    href={`/orders/${order.id}`}
                                                    className="text-green-600 hover:text-green-700 font-medium text-sm"
                                                >
                                                    View Details →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items Preview */}
                                    <div className="px-6 py-4">
                                        <div className="flex gap-4 overflow-x-auto pb-2">
                                            {order.order_items.slice(0, 4).map((item: any) => (
                                                <div key={item.id} className="flex-shrink-0">
                                                    <div className="w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
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
                                                </div>
                                            ))}
                                            {order.order_items.length > 4 && (
                                                <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                                                    <span className="text-gray-600 text-sm font-medium">
                                                        +{order.order_items.length - 4}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mt-4">
                                            <div>
                                                <p className="text-sm text-gray-600">
                                                    {totalItems} {totalItems === 1 ? 'item' : 'items'} • {itemCount} {itemCount === 1 ? 'product' : 'products'}
                                                </p>
                                                {order.is_b2b_invoice_required && (
                                                    <p className="text-xs text-blue-600 mt-1">📄 Invoice required</p>
                                                )}
                                            </div>
                                            <p className="text-xl font-bold text-gray-900">
                                                {Number(order.total_amount).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'PLN',
                                                    currencyDisplay: 'code'
                                                }).replace('PLN', 'PLN ')}
                                            </p>
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
