'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useLocaleMessages } from '@/contexts/LocaleContext'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const REMEMBER_UNTIL_KEY = 'auth:remember-until'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const { messages } = useLocaleMessages()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { data: authData, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message)
            } else if (authData.user) {
                if (rememberMe) {
                    localStorage.setItem(REMEMBER_UNTIL_KEY, String(Date.now() + THIRTY_DAYS_MS))
                } else {
                    localStorage.removeItem(REMEMBER_UNTIL_KEY)
                }

                // Fetch user role from users table
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', authData.user.id)
                    .single()

                // Honour an explicit redirect target, otherwise route by role.
                const redirectParam = searchParams.get('redirect')
                if (redirectParam) {
                    router.push(redirectParam)
                } else if (userData?.role === 'admin') {
                    router.push('/admin')
                } else {
                    router.push('/')
                }
                router.refresh()
            }
        } catch (err) {
            setError(messages.authErrors.unexpected)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#eef1f7] px-4 pb-8 pt-24 sm:px-6 lg:px-8">
            <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_26px_70px_rgba(15,23,42,0.16)] lg:grid-cols-2">
                <section className="relative overflow-hidden bg-[linear-gradient(145deg,_#0f1f4a_0%,_#0b1738_58%,_#09102a_100%)] p-10 text-white sm:p-12 lg:p-14">
                    <div className="pointer-events-none absolute -left-16 top-20 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="pointer-events-none absolute -right-16 bottom-10 h-56 w-56 rounded-full bg-blue-200/10 blur-3xl" />

                    <div className="relative">
                        <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
                            {messages.auth.loginPanelEyebrow}
                        </p>
                        <h1 className="max-w-md text-4xl font-bold leading-tight sm:text-5xl">
                            {messages.auth.loginPanelTitle}
                        </h1>
                        <p className="mt-5 max-w-md text-base leading-relaxed text-slate-200 sm:text-lg">
                            {messages.auth.loginPanelSubtitle}
                        </p>

                        <ul className="mt-10 space-y-4">
                            {[messages.auth.loginBenefitDashboard, messages.auth.loginBenefitOrders, messages.auth.loginBenefitPricing].map((benefit, index) => (
                                <li
                                    key={benefit}
                                    className="b2b-feature-item"
                                    style={{ ['--feature-delay' as string]: `${120 + index * 95}ms` }}
                                >
                                    <span className="b2b-feature-icon" aria-hidden>
                                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                    <span className="b2b-feature-text text-[0.97rem] sm:text-base">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                <section className="p-8 sm:p-10 lg:p-12">
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                            {messages.auth.signInTitle}
                        </h2>
                        <p className="mt-3 text-sm text-slate-600">
                            {messages.auth.orPrefix}{' '}
                            <Link href="/auth/signup" className="font-semibold text-[#163579] underline-offset-4 transition hover:underline">
                                {messages.auth.createAccountLink}
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-5" onSubmit={handleLogin}>
                        {searchParams.get('reset') === 'success' && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {messages.auth.passwordResetSuccess}
                            </div>
                        )}

                        {searchParams.get('registered') === '1' && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {messages.auth.checkEmailToConfirm}
                            </div>
                        )}

                        {searchParams.get('confirmed') === '1' && (
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {messages.auth.emailConfirmedSignIn}
                            </div>
                        )}

                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email-address" className="mb-2 block text-sm font-medium text-slate-700">
                                {messages.auth.email}
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                                placeholder={messages.auth.emailPlaceholder}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
                                {messages.auth.password}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 pr-11 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                                    aria-label={showPassword ? messages.auth.hidePassword : messages.auth.showPassword}
                                >
                                    {showPassword ? (
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.88 5.09A9.77 9.77 0 0 1 12 4.8c5.25 0 8.84 3.74 10 7.2a11.8 11.8 0 0 1-3.03 4.57M6.1 6.1A11.85 11.85 0 0 0 2 12c.75 2.24 2.53 4.69 5.27 6.02" />
                                        </svg>
                                    ) : (
                                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s3.5-7.2 10-7.2S22 12 22 12s-3.5 7.2-10 7.2S2 12 2 12Z" />
                                            <circle cx="12" cy="12" r="3" strokeWidth={2} />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-[#163579] focus:ring-[#163579]/30"
                            />
                            <span>{messages.auth.rememberMe30Days}</span>
                        </label>

                        <div>
                            <Link href="/auth/forgot-password" className="text-sm text-slate-500 underline-offset-4 transition hover:text-[#163579] hover:underline">
                                {messages.auth.forgotPassword}
                            </Link>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#163579] px-4 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#122d67] hover:shadow-[0_12px_26px_rgba(22,53,121,0.26)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? messages.auth.signingIn : messages.auth.signIn}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    )
}
