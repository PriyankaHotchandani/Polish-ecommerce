import { createClient } from '@/utils/supabase/server'
import AdminMetricsGrid from '@/components/admin/AdminMetricsGrid'
import Link from 'next/link'

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
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
                <p className="mt-2 text-slate-600">Overview of your e-commerce platform</p>
            </div>

            <AdminMetricsGrid
                totalOrders={totalOrders}
                totalRevenue={totalRevenue}
                pendingOrders={pendingOrders}
                totalProducts={totalProducts}
                lowStockProducts={lowStockProducts}
                totalUsers={totalUsers}
            />

            {/* Quick Actions */}
            <div className="shop-card-reveal rounded-2xl bg-white p-6 shadow-sm" style={{ animationDelay: '260ms' }}>
                <h2 className="mb-4 text-xl font-bold text-slate-900">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <a
                        href="/admin/orders"
                        className="shop-card-reveal group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                        style={{ animationDelay: '320ms' }}
                    >
                        <svg className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                            <path d="M4 7h16M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        View Orders
                    </a>
                    <a
                        href="/admin/products/new"
                        className="shop-card-reveal group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                        style={{ animationDelay: '380ms' }}
                    >
                        <svg className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Add Product
                    </a>
                    <a
                        href="/admin/categories/new"
                        className="shop-card-reveal group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                        style={{ animationDelay: '440ms' }}
                    >
                        <svg className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                            <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l1.5 2H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Add Category
                    </a>
                    <a
                        href="/admin/users"
                        className="shop-card-reveal group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                        style={{ animationDelay: '500ms' }}
                    >
                        <svg className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                            <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="10" cy="8" r="3" />
                            <path d="M20 19v-1a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M14 5.13a3 3 0 0 1 0 5.75" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Manage Users
                    </a>
                </div>
            </div>

            <Link
                href="/"
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-[#163579] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:bg-[#122d67]"
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path d="M3 12h18M3 12l4-4M3 12l4 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
                View Store
            </Link>
        </div>
    )
}
