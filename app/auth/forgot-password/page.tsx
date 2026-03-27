'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useLocaleMessages } from '@/contexts/LocaleContext'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sent, setSent] = useState(false)
    const { messages } = useLocaleMessages()
    const supabase = createClient()

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const redirectTo = `${window.location.origin}/auth/reset-password`
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

            if (resetError) {
                setError(resetError.message)
                return
            }

            setSent(true)
        } catch {
            setError(messages.authErrors.unexpected)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#eef1f7] px-4 pb-8 pt-24 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_26px_70px_rgba(15,23,42,0.14)] sm:p-10">
                <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                    {messages.auth.forgotPasswordTitle}
                </h1>
                <p className="mt-3 text-slate-600">
                    {messages.auth.forgotPasswordSubtitle}
                </p>

                <form className="mt-8 space-y-5" onSubmit={handleRequestReset}>
                    {sent && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {messages.auth.resetEmailSent}
                        </div>
                    )}

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-slate-700">
                            {messages.auth.email}
                        </label>
                        <input
                            id="forgot-email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                            placeholder={messages.auth.emailPlaceholder}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-lg bg-[#163579] px-4 py-3 font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#122d67] hover:shadow-[0_12px_26px_rgba(22,53,121,0.26)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? messages.auth.sendingResetLink : messages.auth.sendResetLink}
                    </button>
                </form>

                <p className="mt-5 text-sm text-slate-600">
                    <Link href="/auth/login" className="font-semibold text-[#163579] underline-offset-4 transition hover:underline">
                        {messages.auth.backToLogin}
                    </Link>
                </p>
            </div>
        </div>
    )
}
