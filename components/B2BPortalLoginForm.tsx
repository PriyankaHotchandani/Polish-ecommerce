'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useLocaleMessages } from '@/contexts/LocaleContext'

export default function B2BPortalLoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const { messages } = useLocaleMessages()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message)
                return
            }

            if (authData.user) {
                router.push('/b2b')
                router.refresh()
            }
        } catch {
            setError(messages.authErrors.unexpected)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form className="space-y-4" onSubmit={handleLogin}>
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="b2b-email" className="mb-2 block text-sm font-medium text-slate-700">
                    {messages.auth.email}
                </label>
                <input
                    id="b2b-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={messages.auth.email}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                />
            </div>

            <div>
                <label htmlFor="b2b-password" className="mb-2 block text-sm font-medium text-slate-700">
                    {messages.auth.password}
                </label>
                <input
                    id="b2b-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={messages.auth.password}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full rounded-lg bg-[#163579] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#122d67] disabled:opacity-50"
            >
                {loading ? messages.auth.signingIn : messages.b2bPage.logIn}
            </button>

            <p className="pt-1 text-sm text-slate-600">
                {messages.b2bPage.applyPrompt}{' '}
                <Link href="/auth/signup" className="font-semibold text-[#163579] underline-offset-4 hover:underline">
                    {messages.b2bPage.applyBusinessAccount}
                </Link>
            </p>
        </form>
    )
}
