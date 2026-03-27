import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import OrderStatusUpdater from '@/components/admin/OrderStatusUpdater'
import AdminInvoiceManager from '@/components/admin/AdminInvoiceManager'
import OrderIdDisplay from '@/components/admin/OrderIdDisplay'

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
            user:users(email, company_name, role),
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
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                    <p className="text-[15px] text-gray-600">{title}: not provided</p>
                </div>
            )
        }

        return (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <div className="text-[15px] text-gray-700 space-y-1.5">
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

    const timelineStages = [
        {
            key: 'pending',
            label: 'Placed',
            description: new Date(order.created_at).toLocaleString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        },
        {
            key: 'processing',
            label: 'Processing',
            description: 'Order is being prepared',
        },
        {
            key: 'shipped',
            label: 'Shipped',
            description: 'Handed over to carrier',
        },
        {
            key: 'delivered',
            label: 'Delivered',
            description: 'Order completed',
        },
    ] as const

    const activeStageIndex = Math.max(
        0,
        timelineStages.findIndex((stage) => stage.key === order.status)
    )

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link
                        href="/admin/orders"
                        className="text-[#163579] hover:text-[#102a63] text-sm font-semibold mb-2 inline-block"
                    >
                        ← Back to Orders
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Order Details
                    </h1>
                    <OrderIdDisplay orderId={order.id} />
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
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7">
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-5">Order Items</h2>
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
                                        <h3 className="text-lg font-semibold text-gray-900">{item.product.title}</h3>
                                        {item.product.brand && (
                                            <p className="text-[15px] text-gray-600">{item.product.brand}</p>
                                        )}
                                        <p className="text-[15px] text-gray-600 mt-1">
                                            SKU: {item.product.sku}
                                        </p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <p className="text-[15px] text-gray-700">
                                                Quantity: <span className="font-semibold">{item.quantity}</span>
                                            </p>
                                            <p className="text-[15px] text-gray-700">
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
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Order Timeline</h2>
                            <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                {order.status}
                            </span>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-5">
                            {timelineStages.map((stage, index) => {
                                const isCompleted = index < activeStageIndex
                                const isActive = index === activeStageIndex
                                const isLast = index === timelineStages.length - 1

                                return (
                                    <div key={stage.key} className="relative flex gap-4 pb-5 last:pb-0">
                                        {!isLast && (
                                            <span className={`absolute left-[19px] top-10 h-[calc(100%-1.5rem)] w-px ${isCompleted ? 'bg-[#163579]/45' : 'bg-slate-200'}`} aria-hidden="true" />
                                        )}

                                        <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${isCompleted
                                            ? 'border-[#163579] bg-[#163579] text-white'
                                            : isActive
                                                ? 'border-[#163579] bg-[#163579]/10 text-[#163579]'
                                                : 'border-slate-300 bg-white text-slate-400'
                                            }`}>
                                            {isCompleted ? (
                                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                                    <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            ) : (
                                                <span className="text-sm font-bold">{index + 1}</span>
                                            )}
                                        </div>

                                        <div className={`min-w-0 flex-1 rounded-xl border px-4 py-3 ${isActive
                                            ? 'border-[#163579]/25 bg-[#163579]/6'
                                            : 'border-slate-200 bg-white'
                                            }`}>
                                            <p className={`text-base font-semibold ${isActive ? 'text-[#163579]' : 'text-slate-900'}`}>
                                                {stage.label}
                                            </p>
                                            <p className="mt-1 text-[15px] text-slate-600">{stage.description}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Fulfillment details */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-7">
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-5">Fulfillment Details</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                            {renderAddressBlock('Shipping Address', order.shipping_address as Address | null)}
                            {renderAddressBlock('Billing Address', order.billing_address as Address | null)}
                        </div>
                        <div className="mt-5 text-[15px] text-gray-700">
                            <span className="font-semibold text-gray-900">Payment Method:</span>{' '}
                            {paymentMethodLabels[order.payment_method || ''] || 'Not specified'}
                        </div>
                        <div className="mt-2">
                            <span className="text-[15px] font-semibold text-gray-900">Payment Status:</span>{' '}
                            <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${paymentStatusColors[order.payment_status || 'pending']
                                }`}>
                                {paymentStatusLabels[order.payment_status || 'pending']}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Status Management */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">Update Status</h2>
                        <OrderStatusUpdater orderId={order.id} currentStatus={order.status} />
                    </div>

                    {/* Customer Information */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">Customer</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="text-base font-medium text-gray-900">{order.user?.email || 'N/A'}</p>
                            </div>
                            {order.user?.company_name && (
                                <div>
                                    <p className="text-sm text-gray-600">Company</p>
                                    <p className="text-base font-medium text-gray-900">{order.user.company_name}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-600">Customer Type</p>
                                <p className="text-base font-medium text-gray-900">
                                    {order.user?.role === 'b2b_customer' ? 'B2B (Wholesale)' : 'B2C (Retail)'}
                                </p>
                            </div>
                            {order.is_b2b_invoice_required && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                    <div className="flex items-center gap-2 text-sm text-blue-800 font-medium">
                                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                                            <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-5-5Z" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M14 2v5h5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M9 13h6M9 17h6" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <span>B2B Customer - VAT Invoice Required</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">Invoice</h2>
                        <AdminInvoiceManager
                            orderId={order.id}
                            customerEmail={order.user?.email || null}
                            existingInvoiceUrl={order.invoice_url}
                            existingInvoiceNumber={order.invoice_number}
                        />
                    </div>

                    {/* Order Information */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">Order Info</h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-600">Order Date</p>
                                <p className="text-base font-medium text-gray-900">
                                    {new Date(order.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Last Updated</p>
                                <p className="text-base font-medium text-gray-900">
                                    {new Date(order.updated_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Total Items</p>
                                <p className="text-base font-medium text-gray-900">
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
