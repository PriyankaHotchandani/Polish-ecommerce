import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

interface SearchParams {
    status?: string
    search?: string
}

export default async function AdminOrdersPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const supabase = await createClient()

    // Build query
    let query = supabase
        .from('orders')
        .select(`
            *,
            user:users(email, company_name),
            order_items(
                quantity,
                product:products(title, image_urls)
            )
        `)
        .order('created_at', { ascending: false })

    // Apply filters
    if (params.status && params.status !== 'all') {
        query = query.eq('status', params.status)
    }

    if (params.search) {
        // Search by order ID (partial match)
        query = query.ilike('id', `%${params.search}%`)
    }

    const { data: orders, error } = await query

    if (error) {
        console.error('Error fetching orders:', error)
    }

    const statusOptions = [
        { value: 'all', label: 'All Orders' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
    ]

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            processing: 'bg-blue-100 text-blue-800',
            shipped: 'bg-purple-100 text-purple-800',
            delivered: 'bg-green-100 text-green-800',
        }
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                <p className="text-gray-600 mt-2">View and manage all customer orders</p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <form method="GET" className="flex flex-col sm:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                            Search Order ID
                        </label>
                        <input
                            type="text"
                            name="search"
                            id="search"
                            defaultValue={params.search || ''}
                            placeholder="Enter order ID..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="sm:w-48">
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                            Status
                        </label>
                        <select
                            name="status"
                            id="status"
                            defaultValue={params.status || 'all'}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            {statusOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Submit */}
                    <div className="sm:self-end">
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </form>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {!orders || orders.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 text-lg">No orders found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {params.status || params.search ? 'Try adjusting your filters' : 'Orders will appear here once customers place them'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.map((order: any) => {
                                    const totalItems = order.order_items.reduce((sum: number, item: any) => sum + item.quantity, 0)
                                    const itemCount = order.order_items.length

                                    return (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                                                {order.id.substring(0, 8)}...
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.user?.email || 'Unknown'}
                                                </div>
                                                {order.user?.company_name && (
                                                    <div className="text-sm text-gray-500">
                                                        {order.user.company_name}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {totalItems} {totalItems === 1 ? 'item' : 'items'} • {itemCount} {itemCount === 1 ? 'product' : 'products'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                {Number(order.total_amount).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'PLN',
                                                    currencyDisplay: 'code'
                                                }).replace('PLN', 'PLN ')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Link
                                                    href={`/admin/orders/${order.id}`}
                                                    className="text-green-600 hover:text-green-900 font-medium"
                                                >
                                                    View Details →
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary Stats */}
            {orders && orders.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Showing Results</p>
                            <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Value</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN',
                                    currencyDisplay: 'code'
                                }).replace('PLN', 'PLN ')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Average Order</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(orders.reduce((sum, order) => sum + Number(order.total_amount), 0) / orders.length).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN',
                                    currencyDisplay: 'code'
                                }).replace('PLN', 'PLN ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
