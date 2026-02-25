'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface AdminNavProps {
    userEmail: string
}

export default function AdminNav({ userEmail }: AdminNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/orders', label: 'Orders', icon: '📦' },
        { href: '/admin/products', label: 'Products', icon: '🛍️' },
        { href: '/admin/categories', label: 'Categories', icon: '📁' },
        { href: '/admin/users', label: 'Users', icon: '👥' },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left: Logo and Nav Links */}
                    <div className="flex">
                        <Link
                            href="/admin"
                            className="flex items-center px-2 text-xl font-bold text-gray-900"
                        >
                            ⚙️ Admin Panel
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-4">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                                ? 'bg-green-100 text-green-900'
                                                : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className="mr-2">{item.icon}</span>
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right: User Menu */}
                    <div className="flex items-center space-x-4">
                        <Link
                            href="/"
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← Back to Store
                        </Link>
                        <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-700">{userEmail}</span>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="sm:hidden pb-3 space-y-1">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/admin' && pathname.startsWith(item.href))

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`block px-3 py-2 text-base font-medium rounded-md ${isActive
                                        ? 'bg-green-100 text-green-900'
                                        : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
