import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import UserActionsMenu from '@/components/admin/UserActionsMenu'

export default async function AdminUsersPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; role?: string }>
}) {
    const resolvedParams = await searchParams
    const search = resolvedParams.search || ''
    const roleFilter = resolvedParams.role || 'all'

    const supabase = await createClient()

    let query = supabase
        .from('users')
        .select(`
            *,
            orders(count)
        `)
        .order('created_at', { ascending: false })

    // Apply role filter
    if (roleFilter && roleFilter !== 'all') {
        query = query.eq('role', roleFilter)
    }

    // Apply search filter
    if (search) {
        query = query.or(`email.ilike.%${search}%,company_name.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`)
    }

    const { data: users, error } = await query

    if (error) {
        console.error('Error fetching users:', error)
    }

    // Calculate metrics
    const totalUsers = users?.length || 0
    const b2cUsers = users?.filter(u => u.role === 'b2c_customer').length || 0
    const b2bUsers = users?.filter(u => u.role === 'b2b_customer').length || 0
    const adminUsers = users?.filter(u => u.role === 'admin').length || 0

    const getRolePillClass = (role: string) => {
        if (role === 'admin') return 'bg-slate-800 text-white'
        if (role === 'b2b_customer') return 'bg-blue-100 text-blue-800'
        return 'bg-gray-100 text-gray-700'
    }

    const getRoleLabel = (role: string) => {
        if (role === 'admin') return 'Admin'
        if (role === 'b2b_customer') return 'B2B Customer'
        return 'B2C Customer'
    }

    const getDisplayName = (user: any) => {
        const joinedName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
        if (joinedName) return joinedName
        if (user.company_name) return user.company_name
        return user.email?.split('@')[0] || 'User'
    }

    const getInitials = (name: string) => {
        const parts = name.split(' ').filter(Boolean)
        if (parts.length === 0) return 'US'
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600 mt-2">Manage customer accounts and administrators</p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-sm text-gray-600">B2C Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{b2cUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-sm text-gray-600">B2B Customers</p>
                    <p className="text-2xl font-bold text-gray-900">{b2bUsers}</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <p className="text-sm text-gray-600">Administrators</p>
                    <p className="text-2xl font-bold text-gray-900">{adminUsers}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <form method="GET" className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            name="search"
                            defaultValue={search}
                            placeholder="Search by email, name, or company..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#163579]/20 focus:border-[#163579]"
                        />
                    </div>
                    <div>
                        <select
                            name="role"
                            defaultValue={roleFilter}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#163579]/20 focus:border-[#163579]"
                        >
                            <option value="all">All Roles</option>
                            <option value="b2c_customer">B2C Customer</option>
                            <option value="b2b_customer">B2B Customer</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-[#163579] text-white rounded-lg hover:bg-[#122d67] transition-colors font-semibold"
                    >
                        Search
                    </button>
                    {(search || roleFilter !== 'all') && (
                        <Link
                            href="/admin/users"
                            className="px-6 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg text-center"
                        >
                            Clear
                        </Link>
                    )}
                </form>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {!users || users.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 text-lg">
                            {search || roleFilter !== 'all' ? 'No users found matching your filters' : 'No users found'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Role
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Company (B2B)
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Orders
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((user: any) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                                                    {getInitials(getDisplayName(user))}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-semibold text-gray-900">
                                                        {getDisplayName(user)}
                                                    </div>
                                                    <div className="text-sm text-gray-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getRolePillClass(user.role)}`}>
                                                {getRoleLabel(user.role)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {user.company_name || <span className="text-gray-400">N/A</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-medium text-gray-900">
                                                {user.orders[0]?.count || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                            <UserActionsMenu userId={user.id} userEmail={user.email} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
