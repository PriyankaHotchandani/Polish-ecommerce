'use client'

import { useEffect, useMemo, useState } from 'react'
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
    const supabase = useMemo(() => createClient(), [])
    const router = useRouter()
    const { getItemCount } = useCart()
    const itemCount = getItemCount()

    useEffect(() => {
        const resolveLocale = (rawLocale?: string | null): Locale => {
            return rawLocale?.toLowerCase() === 'pl' ? 'pl' : 'en'
        }

        // Synchronous best-guess name from the user object itself (metadata, then
        // the email local-part). Setting this in the same render as setUser avoids
        // the flash where the full email briefly shows before the profile resolves.
        const initialNameFor = (authUser: User): string => {
            const metadataName = (authUser.user_metadata?.full_name as string | undefined)
                || `${authUser.user_metadata?.first_name || ''} ${authUser.user_metadata?.last_name || ''}`.trim()
            return metadataName || authUser.email?.split('@')[0] || 'User'
        }

        // Async refinement: replace the initial name with the profile name if present.
        const refineDisplayName = async (authUser: User | null) => {
            if (!authUser) {
                return
            }

            try {
                const { data: profile } = await supabase
                    .from('users')
                    .select('first_name,last_name')
                    .eq('id', authUser.id)
                    .single()

                const nameFromProfile = `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
                if (nameFromProfile) {
                    setDisplayName(nameFromProfile)
                }
            } catch {
                // Keep the initial name on failure.
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

                // Set user and a resolved name together so the header never flashes
                // the raw email between the two updates.
                setUser(data.user)
                setDisplayName(data.user ? initialNameFor(data.user) : '')
                await refineDisplayName(data.user)
            } catch {
                await supabase.auth.signOut()
                setUser(null)
                setDisplayName('')
            }
        }

        getUser()

        // IMPORTANT: this callback must stay synchronous. supabase-js holds its auth
        // lock while notifying subscribers, so awaiting another Supabase call here
        // deadlocks signInWithPassword (the login button hangs forever). The name is
        // set synchronously from the user object; the profile refine is deferred.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const sessionUser = session?.user ?? null
            setUser(sessionUser)
            setDisplayName(sessionUser ? initialNameFor(sessionUser) : '')
            setTimeout(() => {
                void refineDisplayName(sessionUser)
            }, 0)
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
                    <Link href="/" className="nav-brand-badge" aria-label="BM Sp. z o.o.">
                        <img
                            src="/logos/bmspzoo-trim.png"
                            alt="BM Sp. z o.o."
                            className="nav-brand-badge-img"
                        />
                    </Link>
                    <div className="nav-links">
                        <Link href="/shop" className="nav-link nav-link-primary">{messages.nav.shop}</Link>
                    </div>
                </div>

                {/* Right: account links, cart, auth */}
                <div className="nav-right">
                    <Link href="/about" className="nav-link nav-link-about">{messages.nav.about}</Link>

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
                    <Link href="/cart" className="nav-cart" aria-label={messages.nav.cart}>
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
