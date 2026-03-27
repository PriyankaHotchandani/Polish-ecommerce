'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { usePathname } from 'next/navigation'

interface ProfileSummary {
    first_name: string | null
    last_name: string | null
    phone: string | null
    role: 'admin' | 'b2c_customer' | 'b2b_customer'
    company_name: string | null
}

export default function ProfileCompletenessPrompt() {
    const pathname = usePathname()
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [isAdminUser, setIsAdminUser] = useState(false)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        let mounted = true

        const loadProfileState = async () => {
            try {
                const { data, error } = await supabase.auth.getUser()

                if (!mounted || error || !data.user) {
                    setUserId(null)
                    setIsAdminUser(false)
                    setDismissed(false)
                    setVisible(false)
                    return
                }

                setUserId(data.user.id)
                const authRole = data.user.user_metadata?.role

                // Check if user has dismissed the prompt
                const dismissedKey = `profile_prompt_dismissed_v2_${data.user.id}`
                const isDismissed = sessionStorage.getItem(dismissedKey) === '1'

                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('first_name,last_name,phone,role,company_name')
                    .eq('id', data.user.id)
                    .single<ProfileSummary>()

                if (!mounted) {
                    return
                }

                if (authRole === 'admin' || profile?.role === 'admin') {
                    setIsAdminUser(true)
                    setDismissed(false)
                    setVisible(false)
                    return
                }

                setIsAdminUser(false)

                if (!profile) {
                    setDismissed(false)
                    setVisible(true)
                    return
                }

                // Check if any required field is missing or empty (including whitespace-only strings)
                const hasFirstName = profile.first_name && profile.first_name.trim() !== ''
                const hasLastName = profile.last_name && profile.last_name.trim() !== ''
                const hasPhone = profile.phone && profile.phone.trim() !== ''

                const missingCommonFields = !hasFirstName || !hasLastName || !hasPhone
                const missingB2BFields = profile.role === 'b2b_customer' && (!profile.company_name || profile.company_name.trim() === '')
                const shouldShow = missingCommonFields || missingB2BFields

                // If fields are now complete, clear the dismissal (so it won't show anymore)
                // If fields are still missing but was dismissed, respect the dismissal
                if (!shouldShow) {
                    // Fields are complete - clear dismissal flag and hide
                    sessionStorage.removeItem(dismissedKey)
                    setDismissed(false)
                    setVisible(false)
                } else if (isDismissed) {
                    // Fields missing but user dismissed - keep it hidden
                    setDismissed(true)
                    setVisible(false)
                } else {
                    // Fields missing and not dismissed - show the prompt
                    setDismissed(false)
                    setVisible(true)
                }
            } catch (err) {
                if (mounted) {
                    setUserId(null)
                    setIsAdminUser(false)
                    setDismissed(false)
                    setVisible(false)
                }
            }
        }

        loadProfileState()

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!mounted) {
                return
            }

            if (!session?.user) {
                setUserId(null)
                setIsAdminUser(false)
                setDismissed(false)
                setVisible(false)
                return
            }

            void loadProfileState()
        })

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [supabase])

    if (pathname.startsWith('/admin') || isAdminUser) {
        return null
    }

    if (!visible || dismissed) {
        return null
    }

    const dismissPrompt = () => {
        if (userId) {
            sessionStorage.setItem(`profile_prompt_dismissed_v2_${userId}`, '1')
        }
        setDismissed(true)
        setVisible(false)
    }

    return (
        <div className="mt-16 sm:mt-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-amber-900 shadow-sm">
                    <p className="text-sm">
                        Complete your profile to make checkout faster and keep your account details up to date.
                    </p>
                    <div className="flex shrink-0 items-center gap-3">
                        <Link
                            href="/account"
                            className="text-sm font-semibold text-amber-900 hover:text-amber-700"
                        >
                            Complete profile
                        </Link>
                        <button
                            onClick={dismissPrompt}
                            className="text-sm text-amber-800 hover:text-amber-600"
                        >
                            Dismiss
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
