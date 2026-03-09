'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

interface ProfileSummary {
    first_name: string | null
    last_name: string | null
    phone: string | null
    role: 'admin' | 'b2c_customer' | 'b2b_customer'
    company_name: string | null
}

export default function ProfileCompletenessPrompt() {
    const [visible, setVisible] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        let mounted = true

        const loadProfileState = async () => {
            try {
                const { data, error } = await supabase.auth.getUser()

                if (!mounted || error || !data.user) {
                    setUserId(null)
                    setDismissed(false)
                    setVisible(false)
                    return
                }

                setUserId(data.user.id)

                const dismissedKey = `profile_prompt_dismissed_v2_${data.user.id}`
                if (sessionStorage.getItem(dismissedKey) === '1') {
                    setDismissed(true)
                    setVisible(false)
                    return
                }

                setDismissed(false)

                const { data: profile, error: profileError } = await supabase
                    .from('users')
                    .select('first_name,last_name,phone,role,company_name')
                    .eq('id', data.user.id)
                    .single<ProfileSummary>()

                if (!mounted) {
                    return
                }

                if (!profile) {
                    setVisible(true)
                    return
                }

                const missingCommonFields = !profile.first_name || !profile.last_name || !profile.phone
                const missingB2BFields = profile.role === 'b2b_customer' && !profile.company_name
                const shouldShow = missingCommonFields || missingB2BFields
                
                setVisible(shouldShow)
            } catch (err) {
                if (mounted) {
                    setUserId(null)
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
        <div className="bg-yellow-50 border-b border-yellow-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-yellow-900">
                    Complete your profile to make checkout faster and keep your account details up to date.
                </p>
                <div className="flex items-center gap-3 shrink-0">
                    <Link
                        href="/account"
                        className="text-sm font-semibold text-yellow-900 hover:text-yellow-700"
                    >
                        Complete profile
                    </Link>
                    <button
                        onClick={dismissPrompt}
                        className="text-sm text-yellow-800 hover:text-yellow-600"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    )
}
