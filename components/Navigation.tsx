'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'

export default function Navigation() {
    const [user, setUser] = useState<User | null>(null)
    const [displayName, setDisplayName] = useState('')
    const supabase = createClient()
    const router = useRouter()
    const { getItemCount } = useCart()
    const itemCount = getItemCount()

    useEffect(() => {
        const resolveDisplayName = async (authUser: User | null) => {
            if (!authUser) {
                setDisplayName('')
                return
            }

            try {
                const { data: profile } = await supabase
                    .from('users')
                    .select('first_name,last_name')
                    .eq('id', authUser.id)
                    .single()

                const nameFromProfile = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                const nameFromMetadata = (authUser.user_metadata?.full_name as string | undefined)
                    || `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim()

                setDisplayName(nameFromProfile || nameFromMetadata || authUser.email?.split('@')[0] || 'User')
            } catch {
                const nameFromMetadata = (authUser.user_metadata?.full_name as string | undefined)
                    || `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim()

                setDisplayName(nameFromMetadata || authUser.email?.split('@')[0] || 'User')
            }
        }

        const getUser = async () => {
            try {
                const { data, error } = await supabase.auth.getUser()

                if (error) {
                    await supabase.auth.signOut()
                    setUser(null)
                    setDisplayName('')
                    return
                }

                setUser(data.user)
                await resolveDisplayName(data.user)
            } catch {
                await supabase.auth.signOut()
                setUser(null)
                setDisplayName('')
            }
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const sessionUser = session?.user ?? null
            setUser(sessionUser)
            await resolveDisplayName(sessionUser)
        })

        return () => subscription.unsubscribe()
    }, [supabase])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
    }

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex items-center">
                            <span className="text-xl font-bold text-gray-900">BM SP. Z O. O.</span>
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/shop"
                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                Shop
                            </Link>
                            <Link
                                href="/b2b"
                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                B2B Portal
                            </Link>
                            <Link
                                href="/about"
                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-700 hover:text-gray-900"
                            >
                                About
                            </Link>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Account and Orders Links (for logged-in users) */}
                        {user && (
                            <>
                                <Link
                                    href="/account"
                                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Account
                                </Link>
                                <Link
                                    href="/orders"
                                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Orders
                                </Link>
                            </>
                        )}

                        {/* Cart Icon */}
                        <Link
                            href="/cart"
                            className="relative inline-flex items-center p-2 text-gray-700 hover:text-gray-900"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            {itemCount > 0 && (
                                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-green-600 rounded-full">
                                    {itemCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">{displayName || user.email}</span>
                                <button
                                    onClick={handleSignOut}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Sign Out
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
