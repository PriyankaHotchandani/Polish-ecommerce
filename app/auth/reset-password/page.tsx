'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useLocaleMessages } from '@/contexts/LocaleContext'

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [status, setStatus] = useState<'loading' | 'ready' | 'invalid' | 'success'>('loading')
    const [submitting, setSubmitting] = useState(false)

    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = useMemo(() => createClient(), [])
    const { messages } = useLocaleMessages()

    useEffect(() => {
        const initializeRecoverySession = async () => {
            setError(null)

            try {
                const code = searchParams.get('code')

                if (code) {
                    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                    if (exchangeError) {
                        setStatus('invalid')
                        setError(exchangeError.message)
                        return
                    }

                    setStatus('ready')
                    return
                }

                const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash
                const hashParams = new URLSearchParams(hash)
                const accessToken = hashParams.get('access_token')
                const refreshToken = hashParams.get('refresh_token')
                const type = hashParams.get('type')

                if (accessToken && refreshToken && type === 'recovery') {
                    const { error: setSessionError } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    })

                    if (setSessionError) {
                        setStatus('invalid')
                        setError(setSessionError.message)
                        return
                    }

                    setStatus('ready')
                    return
                }

                const { data: { session } } = await supabase.auth.getSession()
                if (session) {
                    setStatus('ready')
                    return
                }

                setStatus('invalid')
            } catch {
                setStatus('invalid')
                setError(messages.authErrors.unexpected)
            }
        }

        void initializeRecoverySession()
    }, [messages.authErrors.unexpected, searchParams, supabase])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 6) {
            setError(messages.authErrors.passwordMinLength)
            return
        }

        setSubmitting(true)

        try {
            const { error: updateError } = await supabase.auth.updateUser({ password })

            if (updateError) {
                setError(updateError.message)
                return
            }

            setStatus('success')
            setTimeout(() => {
                router.push('/auth/login?reset=success')
                router.refresh()
            }, 900)
        } catch {
            setError(messages.authErrors.unexpected)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#eef1f7] px-4 pb-8 pt-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_26px_70px_rgba(15,23,42,0.14)] sm:p-10">
                <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    {messages.auth.resetPasswordTitle}
                </h1>

                {status === 'loading' && (
                    <p className="mt-4 text-slate-600">{messages.common.loading}</p>
                )}

                {status === 'invalid' && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error || messages.auth.invalidResetLink}
                    </div>
                )}

                {status === 'success' && (
                    <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {messages.auth.passwordResetSuccess}
                    </div>
                )}

                {status === 'ready' && (
                    <form className="mt-6 space-y-5" onSubmit={handleUpdatePassword}>
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-700">
                                {messages.auth.password}
                            </label>
                            <div className="relative">
                                <input
                                    id="new-password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
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

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-lg bg-[#163579] px-4 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#122d67] hover:shadow-[0_12px_26px_rgba(22,53,121,0.26)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? messages.auth.updatingPassword : messages.auth.setNewPassword}
                        </button>
                    </form>
                )}

                <p className="mt-6 text-sm text-slate-600">
                    <Link href="/auth/login" className="font-semibold text-[#163579] underline-offset-4 transition hover:underline">
                        {messages.auth.backToLogin}
                    </Link>
                </p>
            </div>
        </div>
    )
}
