'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import type { UserRole } from '@/types/database.types'
import { useLocaleMessages } from '@/contexts/LocaleContext'

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [role, setRole] = useState<UserRole>('b2c_customer')
    const [companyName, setCompanyName] = useState('')
    const [nipNumber, setNipNumber] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()
    const { messages } = useLocaleMessages()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (password !== confirmPassword) {
            setError(messages.authErrors.passwordMismatch)
            return
        }

        if (password.length < 6) {
            setError(messages.authErrors.passwordMinLength)
            return
        }

        if (role === 'b2b_customer' && !companyName) {
            setError(messages.authErrors.companyRequired)
            return
        }

        setLoading(true)

        try {
            // Sign up the user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role,
                        company_name: role === 'b2b_customer' ? companyName : null,
                        nip_number: role === 'b2b_customer' ? nipNumber : null,
                    },
                },
            })

            if (authError) {
                setError(authError.message)
                setLoading(false)
                return
            }

            if (authData.user) {
                router.push('/')
                router.refresh()
            }
        } catch (err) {
            console.error('Signup error:', err)
            setError(messages.authErrors.unexpected)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {messages.auth.createAccount}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {messages.auth.hasAccount}{' '}
                        <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500">
                            {messages.auth.signIn}
                        </Link>
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-800">{error}</div>
                        </div>
                    )}

                    {/* Account Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {messages.auth.accountType}
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="role"
                                    value="b2c_customer"
                                    checked={role === 'b2c_customer'}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium text-gray-900">
                                        {messages.auth.retailCustomer}
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        {messages.auth.forPersonalShopping}
                                    </span>
                                </div>
                            </label>
                            <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                    type="radio"
                                    name="role"
                                    value="b2b_customer"
                                    checked={role === 'b2b_customer'}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="h-4 w-4 text-green-600 focus:ring-green-500"
                                />
                                <div className="ml-3">
                                    <span className="block text-sm font-medium text-gray-900">
                                        {messages.auth.businessCustomer}
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        {messages.auth.wholesalePricingAndBulk}
                                    </span>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* B2B Specific Fields */}
                    {role === 'b2b_customer' && (
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                                    {messages.auth.companyName} *
                                </label>
                                <input
                                    id="company-name"
                                    type="text"
                                    required
                                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    placeholder={messages.auth.companyPlaceholder}
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="nip-number" className="block text-sm font-medium text-gray-700">
                                    {messages.auth.nipOptional}
                                </label>
                                <input
                                    id="nip-number"
                                    type="text"
                                    className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                    placeholder="1234567890"
                                    value={nipNumber}
                                    onChange={(e) => setNipNumber(e.target.value)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Email and Password */}
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                {messages.auth.email} *
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                {messages.auth.password} *
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                                {messages.auth.confirmPassword} *
                            </label>
                            <input
                                id="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? messages.auth.creatingAccount : messages.auth.createAccountButton}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
