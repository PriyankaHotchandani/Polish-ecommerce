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
        <nav className="nav-bar">
            <div className="nav-inner">
                {/* Left: brand + nav links */}
                <div className="nav-left">
                    <Link href="/" className="nav-brand">
                        <span className="nav-brand-dot" aria-hidden="true" />
                        BM SP. Z O.O.
                    </Link>
                    <div className="nav-links">
                        <Link href="/shop" className="nav-link">Shop</Link>
                        <Link href="/b2b" className="nav-link">B2B Portal</Link>
                        <Link href="/about" className="nav-link">About</Link>
                    </div>
                </div>

                {/* Right: account links, cart, auth */}
                <div className="nav-right">
                    {user && (
                        <>
                            <Link href="/account" className="nav-link">Account</Link>
                            <Link href="/orders" className="nav-link">Orders</Link>
                        </>
                    )}

                    {/* Cart */}
                    <Link href="/cart" className="nav-cart" aria-label="Cart">
                        <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        {itemCount > 0 && (
                            <span className="nav-cart-badge">{itemCount}</span>
                        )}
                    </Link>

                    {user ? (
                        <div className="nav-right">
                            <span className="nav-user-name">{displayName || user.email}</span>
                            <button onClick={handleSignOut} className="nav-signout-btn">
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="nav-auth">
                            <Link href="/auth/login" className="nav-link">Login</Link>
                            <Link href="/auth/signup" className="nav-signup-pill">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
