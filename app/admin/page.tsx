import { createClient } from '@/utils/supabase/server'
import AdminMetricsGrid from '@/components/admin/AdminMetricsGrid'
import Link from 'next/link'

type LatestSupplierSyncRun = {
    status: 'success' | 'failed'
    updated_rows: number
    inventory_rows_parsed: number
    info_rows_parsed: number
    error_message: string | null
    created_at: string
}

type RpcCallResult<T> = {
    data: T | null
    error: { message: string } | null
}

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

    const rpc = supabase.rpc as unknown as (
        fn: string,
        params?: Record<string, never>
    ) => Promise<RpcCallResult<LatestSupplierSyncRun[]>>

    const { data: latestSyncData } = await rpc('get_latest_supplier_sync_run')
    const latestSync = latestSyncData?.[0] || null

    const latestSyncDate = latestSync
        ? new Date(latestSync.created_at).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
        : null

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

            <section className="shop-card-reveal mb-8 rounded-2xl bg-white p-6 shadow-sm" style={{ animationDelay: '220ms' }}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-slate-900">Supplier Sync Status</h2>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700">
                        Auto once daily
                    </span>
                </div>

                {latestSync ? (
                    <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Last Run</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{latestSyncDate}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Status</p>
                            <p className={`mt-2 text-sm font-semibold ${latestSync.status === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
                                {latestSync.status === 'success' ? 'Success' : 'Failed'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Rows Parsed</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">
                                {latestSync.inventory_rows_parsed.toLocaleString('en-US')} / {latestSync.info_rows_parsed.toLocaleString('en-US')}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">stock / info feed</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Products Updated</p>
                            <p className="mt-2 text-sm font-semibold text-slate-900">{latestSync.updated_rows.toLocaleString('en-US')}</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-slate-600">No sync run recorded yet. The first cron execution will populate status here.</p>
                )}

                {latestSync?.error_message && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <p className="font-semibold">Last error</p>
                        <p className="mt-1 break-words">{latestSync.error_message}</p>
                    </div>
                )}
            </section>

            {/* Quick Actions */}
            <div className="shop-card-reveal rounded-2xl bg-white p-6 shadow-sm" style={{ animationDelay: '260ms' }}>
                <h2 className="mb-4 text-xl font-bold text-slate-900">Quick Actions</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link
                        href="/admin/orders"
                        className="shop-card-reveal group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                        style={{ animationDelay: '320ms' }}
                    >
                        <svg className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                            <path d="M4 7h16M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        View Orders
                    </Link>
                    <Link
                        href="/admin/products/new"
                        className="shop-card-reveal group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                        style={{ animationDelay: '380ms' }}
                    >
                        <svg className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Add Product
                    </Link>
                    <Link
                        href="/admin/categories/new"
                        className="shop-card-reveal group inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                        style={{ animationDelay: '440ms' }}
                    >
                        <svg className="h-4 w-4 text-slate-500 transition-colors group-hover:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                            <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l1.5 2H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Add Category
                    </Link>
                    <Link
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
                    </Link>
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
