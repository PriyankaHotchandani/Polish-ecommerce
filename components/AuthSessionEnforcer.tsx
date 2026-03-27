'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const REMEMBER_UNTIL_KEY = 'auth:remember-until'

export default function AuthSessionEnforcer() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const enforceRememberWindow = async () => {
            const rememberUntilRaw = localStorage.getItem(REMEMBER_UNTIL_KEY)

            if (!rememberUntilRaw) {
                return
            }

            const rememberUntil = Number(rememberUntilRaw)

            if (!Number.isFinite(rememberUntil)) {
                localStorage.removeItem(REMEMBER_UNTIL_KEY)
                return
            }

            if (Date.now() <= rememberUntil) {
                return
            }

            const supabase = createClient()
            await supabase.auth.signOut()
            localStorage.removeItem(REMEMBER_UNTIL_KEY)

            if (!pathname.startsWith('/auth/')) {
                router.push('/auth/login')
            }

            router.refresh()
        }

        void enforceRememberWindow()
    }, [pathname, router])

    return null
}
