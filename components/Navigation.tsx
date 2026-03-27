'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import type { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useCart } from '@/contexts/CartContext'
import { useLocaleMessages, type Locale } from '@/contexts/LocaleContext'

interface NavigationProps {
    initialLocale: Locale
}

export default function Navigation({ initialLocale }: NavigationProps) {
    const [user, setUser] = useState<User | null>(null)
    const [displayName, setDisplayName] = useState('')
    const { locale, setLocale, messages } = useLocaleMessages()
    const supabase = createClient()
    const router = useRouter()
    const { getItemCount } = useCart()
    const itemCount = getItemCount()

    useEffect(() => {
        const resolveLocale = (rawLocale?: string | null): Locale => {
            return rawLocale?.toLowerCase() === 'pl' ? 'pl' : 'en'
        }

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

                if (data.user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('locale')
                        .eq('id', data.user.id)
                        .single()

                    if (profile?.locale) {
                        const profileLocale = resolveLocale(profile.locale)
                        setLocale(profileLocale)
                    }
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

    const handleLocaleChange = async (nextLocale: Locale) => {
        if (nextLocale === locale) {
            return
        }

        setLocale(nextLocale)

        if (user) {
            await supabase
                .from('users')
                .update({ locale: nextLocale })
                .eq('id', user.id)
        }

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
                        <Link href="/shop" className="nav-link">{messages.nav.shop}</Link>
                        <Link href="/b2b" className="nav-link">{messages.nav.b2b}</Link>
                        <Link href="/about" className="nav-link">{messages.nav.about}</Link>
                    </div>
                </div>

                {/* Right: account links, cart, auth */}
                <div className="nav-right">
                    <div className="nav-lang-toggle" role="group" aria-label={messages.nav.languageSelector}>
                        <button
                            type="button"
                            onClick={() => handleLocaleChange('en')}
                            aria-pressed={locale === 'en'}
                            className={`nav-lang-btn ${locale === 'en' ? 'is-active' : ''}`}
                        >
                            EN
                        </button>
                        <button
                            type="button"
                            onClick={() => handleLocaleChange('pl')}
                            aria-pressed={locale === 'pl'}
                            className={`nav-lang-btn ${locale === 'pl' ? 'is-active' : ''}`}
                        >
                            PL
                        </button>
                    </div>

                    {user && (
                        <>
                            <Link href="/account" className="nav-link">{messages.nav.myAccount}</Link>
                            <Link href="/orders" className="nav-link">{messages.nav.orders}</Link>
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
                        <div className="nav-user-actions">
                            <span className="nav-user-name">{displayName || user.email}</span>
                            <button onClick={handleSignOut} className="nav-signout-btn">
                                {messages.auth.signOut}
                            </button>
                        </div>
                    ) : (
                        <div className="nav-auth">
                            <Link href="/auth/login" className="nav-link">{messages.nav.login}</Link>
                            <Link href="/auth/signup" className="nav-signup-pill">
                                {messages.auth.signUp}
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
