import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderStatusUpdater from '@/components/admin/OrderStatusUpdater'

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
    cash_on_delivery: 'Cash on Delivery',
}

const paymentStatusLabels: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed',
    refunded: 'Refunded',
}

const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
}

export default async function AdminOrderDetailPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    const { data: order, error } = await supabase
        .from('orders')
        .select(`
            *,
            user:users(email, company_name, nip_number, role),
            order_items(
                *,
                product:products(*)
            )
        `)
        .eq('id', id)
        .maybeSingle()

    if (error || !order) {
        notFound()
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
        }
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
    }

    const renderAddressBlock = (title: string, address: Address | null | undefined) => {
        if (!address) {
            return (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{title}: not provided</p>
                </div>
            )
        }

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
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/orders"
                        className="text-green-600 hover:text-green-800 text-sm font-medium mb-2 inline-block"
                    >
                        ← Back to Orders
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Order Details
                    </h1>
                    <p className="text-gray-600 mt-1 font-mono text-sm">
                        ID: {order.id}
                    </p>
                </div>
                <div>
                    <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status.toUpperCase()}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
                        <div className="space-y-4">
                            {order.order_items.map((item: any) => (
                                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-b-0 last:pb-0">
                                    {/* Product Image */}
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

                                    {/* Product Info */}
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">{item.product.title}</h3>
                                        {item.product.brand && (
                                            <p className="text-sm text-gray-600">{item.product.brand}</p>
                                        )}
                                        <p className="text-sm text-gray-600 mt-1">
                                            SKU: {item.product.sku}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <p className="text-sm text-gray-700">
                                                Quantity: <span className="font-semibold">{item.quantity}</span>
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                Price: <span className="font-semibold">
                                                    {Number(item.price_at_purchase).toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: 'PLN',
                                                        currencyDisplay: 'code'
                                                    }).replace('PLN', 'PLN ')} each
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Item Total */}
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
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

                        {/* Order Total */}
                        <div className="border-t pt-4 mt-4">
                            <div className="flex justify-between text-xl font-bold text-gray-900">
                                <span>Order Total</span>
                                <span>
                                    {Number(order.total_amount).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'PLN',
                                        currencyDisplay: 'code'
                                    }).replace('PLN', 'PLN ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Order Timeline */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Timeline</h2>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <span className="text-green-600 font-bold">✓</span>
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">Order Placed</p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(order.created_at).toLocaleString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            </div>

                            {order.status !== 'pending' && (
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold">⚙</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Processing</p>
                                        <p className="text-sm text-gray-600">Order is being prepared</p>
                                    </div>
                                </div>
                            )}

                            {(order.status === 'shipped' || order.status === 'delivered') && (
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 font-bold">📦</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Shipped</p>
                                        <p className="text-sm text-gray-600">Order is on its way</p>
                                    </div>
                                </div>
                            )}

                            {order.status === 'delivered' && (
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-bold">✓</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold text-gray-900">Delivered</p>
                                        <p className="text-sm text-gray-600">Order completed</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Fulfillment details */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Fulfillment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderAddressBlock('Shipping Address', order.shipping_address as Address | null)}
                            {renderAddressBlock('Billing Address', order.billing_address as Address | null)}
                        </div>
                        <div className="mt-4 text-sm text-gray-700">
                            <span className="font-semibold text-gray-900">Payment Method:</span>{' '}
                            {paymentMethodLabels[order.payment_method || ''] || 'Not specified'}
                        </div>
                        <div className="mt-2">
                            <span className="text-sm font-semibold text-gray-900">Payment Status:</span>{' '}
                            <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${
                                paymentStatusColors[order.payment_status || 'pending']
                            }`}>
                                {paymentStatusLabels[order.payment_status || 'pending']}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Management */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Update Status</h2>
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Customer</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium text-gray-900">{order.user?.email || 'N/A'}</p>
                            </div>
                            {order.user?.company_name && (
                                <div>
                                    <p className="text-sm text-gray-600">Company</p>
                                    <p className="font-medium text-gray-900">{order.user.company_name}</p>
                                </div>
                            )}
                            {order.user?.nip_number && (
                                <div>
                                    <p className="text-sm text-gray-600">NIP Number</p>
                                    <p className="font-medium text-gray-900">{order.user.nip_number}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">Customer Type</p>
                                <p className="font-medium text-gray-900">
                                    {order.user?.role === 'b2b_customer' ? 'B2B (Wholesale)' : 'B2C (Retail)'}
                                </p>
                            </div>
                            {order.is_b2b_invoice_required && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                    <p className="text-sm text-blue-800 font-medium">
                                        📄 VAT Invoice Required
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Information */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Order Info</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Order Date</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(order.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Last Updated</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(order.updated_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Items</p>
                                <p className="font-medium text-gray-900">
                                    {order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
