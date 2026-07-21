'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useLocaleMessages, type Locale } from '@/contexts/LocaleContext'

interface AdminNavProps {
    userEmail: string
}

export default function AdminNav({ userEmail }: AdminNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { locale, setLocale, messages } = useLocaleMessages()
    const adminCopy = messages.admin

    const handleLocaleChange = (nextLocale: Locale) => {
        if (nextLocale === locale) return
        setLocale(nextLocale)
        router.refresh()
    }

    const navItems = [
        {
            href: '/admin',
            label: adminCopy.dashboard,
            icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M4 13h6v7H4v-7Zm10-9h6v16h-6V4ZM4 4h6v5H4V4Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            href: '/admin/orders',
            label: adminCopy.orders,
            icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M4 7h16M7 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M9 12h6M9 16h4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            href: '/admin/products',
            label: adminCopy.products,
            icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M4 9 12 4l8 5-8 5-8-5Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M4 9v6l8 5 8-5V9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            href: '/admin/categories',
            label: adminCopy.categories,
            icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4l1.5 2H19.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
        {
            href: '/admin/users',
            label: adminCopy.users,
            icon: (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                    <path d="M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="10" cy="8" r="3" />
                    <path d="M20 19v-1a4 4 0 0 0-3-3.87" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 5.13a3 3 0 0 1 0 5.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ),
        },
    ]

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <nav className="border-b border-slate-200 bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Left: Logo and Nav Links */}
                    <div className="flex">
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-2 text-xl font-bold text-slate-900"
                        >
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#163579]/10 text-[#163579]">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
                                    <path d="M10.5 2h3l.6 2.3a7.9 7.9 0 0 1 2 .8l2.1-1.1 2.1 2.1-1.1 2.1c.3.6.6 1.3.8 2L23 10.5v3l-2.3.6a7.9 7.9 0 0 1-.8 2l1.1 2.1-2.1 2.1-2.1-1.1a7.9 7.9 0 0 1-2 .8L13.5 23h-3l-.6-2.3a7.9 7.9 0 0 1-2-.8l-2.1 1.1-2.1-2.1 1.1-2.1a7.9 7.9 0 0 1-.8-2L2 13.5v-3l2.3-.6a7.9 7.9 0 0 1 .8-2L4 5.8l2.1-2.1 2.1 1.1a7.9 7.9 0 0 1 2-.8L10.5 2Z" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </span>
                            {adminCopy.panel}
                        </Link>
                        <div className="hidden sm:ml-8 sm:flex sm:space-x-6">
                            {navItems.map((item) => {
                                const isActive = pathname === item.href ||
                                    (item.href !== '/admin' && pathname.startsWith(item.href))

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex h-16 items-center border-b-2 px-1 text-sm font-semibold transition-colors ${isActive
                                            ? 'border-[#163579] text-[#163579]'
                                            : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                            }`}
                                    >
                                        <span className={`mr-2 ${isActive ? 'text-[#163579]' : 'text-slate-400'}`}>{item.icon}</span>
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Right: User Menu */}
                    <div className="flex items-center space-x-4">
                        <div className="inline-flex items-center overflow-hidden rounded-md border border-slate-200" role="group" aria-label={messages.nav.languageSelector}>
                            <button
                                type="button"
                                onClick={() => handleLocaleChange('en')}
                                aria-pressed={locale === 'en'}
                                className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${locale === 'en' ? 'bg-[#163579] text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                            >
                                EN
                            </button>
                            <button
                                type="button"
                                onClick={() => handleLocaleChange('pl')}
                                aria-pressed={locale === 'pl'}
                                className={`px-2.5 py-1.5 text-xs font-semibold transition-colors ${locale === 'pl' ? 'bg-[#163579] text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}
                            >
                                PL
                            </button>
                        </div>
                        <Link
                            href="/"
                            className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-[#163579] hover:text-[#163579]"
                        >
                            {adminCopy.viewStore}
                        </Link>
                        <div className="flex items-center space-x-3">
                            <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700">{userEmail}</span>
                            <button
                                onClick={handleSignOut}
                                className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-colors hover:border-[#163579] hover:bg-[#163579] hover:text-white"
                            >
                                {adminCopy.signOut}
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
                                className={`block rounded-md px-3 py-2 text-base font-medium ${isActive
                                    ? 'bg-[#163579]/10 text-[#163579]'
                                    : 'text-slate-700 hover:bg-slate-100'
                                    }`}
                            >
                                <span className="mr-2 text-slate-400">{item.icon}</span>
                                {item.label}
                            </Link>
                        )
                    })}
                </div>
            </div>
        </nav>
    )
}
