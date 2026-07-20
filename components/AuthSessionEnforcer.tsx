'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

const REMEMBER_UNTIL_KEY = 'auth:remember-until'
const LAST_ACTIVITY_KEY = 'auth:last-activity'

// Standard e-commerce inactivity window: auto-logout after 30 minutes idle.
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000
const INACTIVITY_CHECK_INTERVAL_MS = 60 * 1000

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
    'pointerdown',
    'keydown',
    'scroll',
    'touchstart',
]

export default function AuthSessionEnforcer() {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        let isActive = true

        const signOutAndRedirect = async () => {
            const supabase = createClient()
            // signOut clears the Supabase auth tokens (sb-* cookies/localStorage).
            await supabase.auth.signOut()
            localStorage.removeItem(REMEMBER_UNTIL_KEY)
            localStorage.removeItem(LAST_ACTIVITY_KEY)

            if (!isActive) return

            if (!window.location.pathname.startsWith('/auth/')) {
                router.push('/auth/login')
            }

            router.refresh()
        }

        const hasAuthSession = () => {
            const supabase = createClient()
            return supabase.auth.getSession().then(({ data }) => Boolean(data.session))
        }

        const enforceRememberWindow = async () => {
            const rememberUntilRaw = localStorage.getItem(REMEMBER_UNTIL_KEY)

            if (!rememberUntilRaw) {
                return false
            }

            const rememberUntil = Number(rememberUntilRaw)

            if (!Number.isFinite(rememberUntil)) {
                localStorage.removeItem(REMEMBER_UNTIL_KEY)
                return false
            }

            if (Date.now() <= rememberUntil) {
                return false
            }

            await signOutAndRedirect()
            return true
        }

        const enforceInactivityTimeout = async () => {
            const lastActivityRaw = localStorage.getItem(LAST_ACTIVITY_KEY)
            const lastActivity = Number(lastActivityRaw)

            if (!lastActivityRaw || !Number.isFinite(lastActivity)) {
                localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
                return false
            }

            if (Date.now() - lastActivity <= INACTIVITY_TIMEOUT_MS) {
                return false
            }

            if (!(await hasAuthSession())) {
                return false
            }

            await signOutAndRedirect()
            return true
        }

        const runChecks = async () => {
            const rememberExpired = await enforceRememberWindow()
            if (!rememberExpired) {
                await enforceInactivityTimeout()
            }
        }

        const markActivity = () => {
            localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void runChecks()
            }
        }

        void runChecks()

        ACTIVITY_EVENTS.forEach((eventName) => {
            window.addEventListener(eventName, markActivity, { passive: true })
        })
        document.addEventListener('visibilitychange', handleVisibilityChange)

        const intervalId = window.setInterval(() => {
            void runChecks()
        }, INACTIVITY_CHECK_INTERVAL_MS)

        return () => {
            isActive = false
            ACTIVITY_EVENTS.forEach((eventName) => {
                window.removeEventListener(eventName, markActivity)
            })
            document.removeEventListener('visibilitychange', handleVisibilityChange)
            window.clearInterval(intervalId)
        }
    }, [pathname, router])

    return null
}
