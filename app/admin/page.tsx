import { createClient } from '@/utils/supabase/server'

export default async function AdminDashboard() {
    const supabase = await createClient()

    // Fetch key metrics
    const [ordersResult, productsResult, usersResult] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status', { count: 'exact' }),
        supabase.from('products').select('id, inventory_count', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
    ])

    const totalOrders = ordersResult.count || 0
    const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0
    const pendingOrders = ordersResult.data?.filter(o => o.status === 'pending').length || 0
    const totalProducts = productsResult.count || 0
    const lowStockProducts = productsResult.data?.filter(p => p.inventory_count < 10).length || 0
    const totalUsers = usersResult.count || 0

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Overview of your e-commerce platform</p>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* Total Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalOrders}</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <span className="text-3xl">📦</span>
                        </div>
                    </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {totalRevenue.toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN',
                                    currencyDisplay: 'code'
                                }).replace('PLN', 'PLN ')}
                            </p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <span className="text-3xl">💰</span>
                        </div>
                    </div>
                </div>

                {/* Pending Orders */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Pending Orders</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{pendingOrders}</p>
                        </div>
                        <div className="bg-yellow-100 rounded-full p-3">
                            <span className="text-3xl">⏳</span>
                        </div>
                    </div>
                </div>

                {/* Total Products */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Products</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalProducts}</p>
                        </div>
                        <div className="bg-purple-100 rounded-full p-3">
                            <span className="text-3xl">🛍️</span>
                        </div>
                    </div>
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Low Stock Products</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{lowStockProducts}</p>
                            <p className="text-xs text-gray-500 mt-1">Below 10 units</p>
                        </div>
                        <div className="bg-red-100 rounded-full p-3">
                            <span className="text-3xl">⚠️</span>
                        </div>
                    </div>
                </div>

                {/* Total Users */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 font-medium">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{totalUsers}</p>
                        </div>
                        <div className="bg-indigo-100 rounded-full p-3">
                            <span className="text-3xl">👥</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a
                        href="/admin/orders"
                        className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <span className="mr-2">📦</span>
                        View Orders
                    </a>
                    <a
                        href="/admin/products/new"
                        className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <span className="mr-2">➕</span>
                        Add Product
                    </a>
                    <a
                        href="/admin/categories/new"
                        className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <span className="mr-2">📁</span>
                        Add Category
                    </a>
                    <a
                        href="/admin/users"
                        className="flex items-center justify-center px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <span className="mr-2">👥</span>
                        Manage Users
                    </a>
                </div>
            </div>
        </div>
    )
}
