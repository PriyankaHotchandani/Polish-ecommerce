import { createClient } from '@/utils/supabase/server'
import OrdersFilterBar from '@/components/admin/OrdersFilterBar'
import OrdersTriageTable from '@/components/admin/OrdersTriageTable'

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
            user:users(email, company_name, first_name, last_name),
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

    const safeOrders = Array.isArray(orders) ? orders : []
    const totalValue = safeOrders.reduce((sum, order: any) => sum + Number(order.total_amount || 0), 0)
    const averageOrderValue = safeOrders.length > 0 ? totalValue / safeOrders.length : 0

    const statusOptions = [
        { value: 'all', label: 'All Orders' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'shipped', label: 'Shipped' },
        { value: 'delivered', label: 'Delivered' },
    ]

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
                <p className="text-gray-600 mt-2">View and manage all customer orders</p>
            </div>

            {/* Summary Stats */}
            {safeOrders.length > 0 && (
                <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Showing Results</p>
                            <p className="text-2xl font-bold text-slate-900">{safeOrders.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Total Value</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {totalValue.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN',
                                    currencyDisplay: 'code'
                                }).replace('PLN', 'PLN ')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Average Order</p>
                            <p className="text-2xl font-bold text-slate-900">
                                {averageOrderValue.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN',
                                    currencyDisplay: 'code'
                                }).replace('PLN', 'PLN ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <OrdersFilterBar
                initialSearch={params.search || ''}
                initialStatus={params.status || 'all'}
                statusOptions={statusOptions}
            />

            {/* Orders Table */}
            <OrdersTriageTable
                orders={safeOrders}
                hasActiveFilters={Boolean(params.status || params.search)}
            />
        </div>
    )
}
