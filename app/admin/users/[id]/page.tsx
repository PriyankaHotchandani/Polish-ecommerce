import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import RoleUpdater from '@/components/admin/RoleUpdater'

export default async function AdminUserDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const resolvedParams = await params
    const userId = resolvedParams.id
    const supabase = await createClient()

    // Get user data
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (userError || !user) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 text-lg">User not found</p>
                <Link
                    href="/admin/users"
                    className="text-green-600 hover:text-green-800 mt-4 inline-block"
                >
                    ← Back to Users
                </Link>
            </div>
        )
    }

    // Get orders for this user
    const { data: orders } = await supabase
        .from('orders')
        .select(`
            *,
            order_items(quantity, price_at_purchase)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    // Calculate stats
    const totalOrders = orders?.length || 0
    const totalSpent = orders?.reduce((sum, order) => {
        const orderTotal = order.order_items.reduce(
            (itemSum: number, item: any) => itemSum + item.quantity * item.price_at_purchase,
            0
        )
        return sum + orderTotal
    }, 0) || 0

    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/admin/users"
                    className="text-green-600 hover:text-green-800 text-sm font-medium mb-2 inline-block"
                >
                    ← Back to Users
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* User Info */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                {user.first_name} {user.last_name}
                            </h2>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600 mb-2">Role</p>
                            <RoleUpdater userId={user.id} currentRole={user.role} />
                        </div>

                        {user.role === 'b2b' && user.company_name && (
                            <>
                                <div>
                                    <p className="text-sm text-gray-600">Company Name</p>
                                    <p className="text-sm font-medium text-gray-900">{user.company_name}</p>
                                </div>
                                {user.tax_id && (
                                    <div>
                                        <p className="text-sm text-gray-600">Tax ID</p>
                                        <p className="text-sm font-medium text-gray-900">{user.tax_id}</p>
                                    </div>
                                )}
                            </>
                        )}

                        <div>
                            <p className="text-sm text-gray-600">Member Since</p>
                            <p className="text-sm font-medium text-gray-900">
                                {new Date(user.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mt-6 space-y-4">
                        <h3 className="text-lg font-bold text-gray-900">Statistics</h3>

                        <div>
                            <p className="text-sm text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-2xl font-bold text-green-600">
                                {totalSpent.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN'
                                })}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-600">Avg. Order Value</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {averageOrderValue.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN'
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Order History</h2>

                        {!orders || orders.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500">No orders yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order: any) => {
                                    const orderTotal = order.order_items.reduce(
                                        (sum: number, item: any) => sum + item.quantity * item.price_at_purchase,
                                        0
                                    )

                                    return (
                                        <div
                                            key={order.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:border-green-500 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-lg font-semibold text-green-600 hover:text-green-800"
                                                    >
                                                        Order #{order.id.slice(0, 8).toUpperCase()}
                                                    </Link>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {new Date(order.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {orderTotal.toLocaleString('en-US', {
                                                            style: 'currency',
                                                            currency: 'PLN'
                                                        })}
                                                    </p>
                                                    <span
                                                        className={`inline-block px-3 py-1 text-xs font-semibold rounded-full mt-1 ${order.status === 'pending'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : order.status === 'processing'
                                                                    ? 'bg-blue-100 text-blue-800'
                                                                    : order.status === 'shipped'
                                                                        ? 'bg-purple-100 text-purple-800'
                                                                        : order.status === 'delivered'
                                                                            ? 'bg-green-100 text-green-800'
                                                                            : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {order.status.toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100">
                                                <p className="text-sm text-gray-600">
                                                    {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
