'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import type { UserRole } from '@/types/database.types'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import { getSiteUrl } from '@/utils/siteUrl'

export default function SignupPage() {
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState<UserRole>('b2c_customer')
    const [companyName, setCompanyName] = useState('')
    const [nipNumber, setNipNumber] = useState('')
    const [industryType, setIndustryType] = useState('')
    const [isIndustryMenuOpen, setIsIndustryMenuOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const industryDropdownRef = useRef<HTMLDivElement | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const supabase = createClient()
    const { messages } = useLocaleMessages()
    const redirectTarget = searchParams.get('redirect') || '/'

    const industryOptions = [
        { value: '', label: messages.auth.industryOptional },
        { value: 'construction', label: messages.auth.industryConstruction },
        { value: 'retailer', label: messages.auth.industryRetailer },
        { value: 'plumber', label: messages.auth.industryPlumber },
        { value: 'other', label: messages.auth.industryOther },
    ]

    const selectedIndustryLabel = industryOptions.find((option) => option.value === industryType)?.label ?? messages.auth.industryOptional

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (!industryDropdownRef.current?.contains(event.target as Node)) {
                setIsIndustryMenuOpen(false)
            }
        }

        document.addEventListener('mousedown', handleOutsideClick)
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick)
        }
    }, [])

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!firstName.trim() || !lastName.trim()) {
            setError(messages.authErrors.nameRequired)
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

        if (role === 'b2b_customer' && !nipNumber.trim()) {
            setError(messages.authErrors.nipRequired)
            return
        }

        setLoading(true)

        try {
            // Send the confirmation e-mail back to the production site (or the
            // configured NEXT_PUBLIC_SITE_URL) instead of localhost.
            const emailRedirectTo = `${getSiteUrl()}/auth/login?confirmed=1${redirectTarget !== '/' ? `&redirect=${encodeURIComponent(redirectTarget)}` : ''}`

            // Sign up the user
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo,
                    data: {
                        role,
                        first_name: firstName.trim(),
                        last_name: lastName.trim(),
                        full_name: `${firstName.trim()} ${lastName.trim()}`,
                        company_name: role === 'b2b_customer' ? companyName : null,
                        nip_number: role === 'b2b_customer' ? nipNumber : null,
                        industry_type: role === 'b2b_customer' && industryType ? industryType : null,
                    },
                },
            })

            if (authError) {
                setError(authError.message)
                setLoading(false)
                return
            }

            // If email confirmation is disabled, Supabase returns an active session
            // and we can log the user straight in. Otherwise there is no session yet,
            // so send them to the login page with a clear "check your email" notice —
            // never drop them on the home page unauthenticated.
            if (authData.session) {
                router.push(redirectTarget)
                router.refresh()
            } else {
                const params = new URLSearchParams({ registered: '1' })
                if (redirectTarget !== '/') {
                    params.set('redirect', redirectTarget)
                }
                router.push(`/auth/login?${params.toString()}`)
            }
        } catch (err) {
            console.error('Signup error:', err)
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
                            {messages.auth.signupPanelEyebrow}
                        </p>
                        <h1 className="max-w-md text-4xl font-bold leading-tight sm:text-5xl">
                            {messages.auth.signupPanelTitle}
                        </h1>
                        <p className="mt-5 max-w-md text-base leading-relaxed text-slate-200 sm:text-lg">
                            {messages.auth.signupPanelSubtitle}
                        </p>

                        <ul className="mt-10 space-y-4">
                            {[messages.auth.signupBenefitCheckout, messages.auth.signupBenefitTracking, messages.auth.signupBenefitPricing].map((benefit, index) => (
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
                            {messages.auth.createAccount}
                        </h2>
                        <p className="mt-3 text-sm text-slate-600">
                            {messages.auth.hasAccount}{' '}
                            <Link href="/auth/login" className="font-semibold text-[#163579] underline-offset-4 transition hover:underline">
                                {messages.auth.signIn}
                            </Link>
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="first-name" className="mb-2 block text-sm font-medium text-slate-700">
                                    {messages.auth.firstName} *
                                </label>
                                <input
                                    id="first-name"
                                    type="text"
                                    autoComplete="given-name"
                                    required
                                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                                    placeholder="Jan"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label htmlFor="last-name" className="mb-2 block text-sm font-medium text-slate-700">
                                    {messages.auth.lastName} *
                                </label>
                                <input
                                    id="last-name"
                                    type="text"
                                    autoComplete="family-name"
                                    required
                                    className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                                    placeholder="Kowalski"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="mb-3 block text-sm font-medium text-slate-700">
                                {messages.auth.accountType}
                            </label>

                            <div className="space-y-3">
                                <label
                                    className={`group relative block cursor-pointer rounded-xl p-4 transition-all duration-200 ease-in-out ${role === 'b2c_customer'
                                        ? 'border-2 border-[#163579] bg-[#163579]/[0.03]'
                                        : 'border border-gray-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="b2c_customer"
                                        checked={role === 'b2c_customer'}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                        className="sr-only"
                                    />

                                    <div className="pr-8">
                                        <span className="block text-sm font-semibold text-slate-900">
                                            {messages.auth.retailCustomer}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {messages.auth.forPersonalShopping}
                                        </span>
                                    </div>

                                    <span className={`absolute right-3 top-3 transition-all duration-200 ${role === 'b2c_customer' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        <svg className="h-5 w-5 text-[#163579]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                </label>

                                <label
                                    className={`group relative block cursor-pointer rounded-xl p-4 transition-all duration-200 ease-in-out ${role === 'b2b_customer'
                                        ? 'border-2 border-[#163579] bg-[#163579]/[0.03]'
                                        : 'border border-gray-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value="b2b_customer"
                                        checked={role === 'b2b_customer'}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                        className="sr-only"
                                    />

                                    <div className="pr-8">
                                        <span className="block text-sm font-semibold text-slate-900">
                                            {messages.auth.businessCustomer}
                                        </span>
                                        <span className="mt-1 block text-xs text-slate-500">
                                            {messages.auth.wholesalePricingAndBulk}
                                        </span>
                                    </div>

                                    <span className={`absolute right-3 top-3 transition-all duration-200 ${role === 'b2b_customer' ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                                        <svg className="h-5 w-5 text-[#163579]" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className={`grid transition-all duration-300 ease-in-out ${role === 'b2b_customer' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                            <div className="overflow-hidden">
                                <div className="space-y-4 pb-1 pt-1">
                                    <div>
                                        <label htmlFor="company-name" className="mb-2 block text-sm font-medium text-slate-700">
                                            {messages.auth.companyName} *
                                        </label>
                                        <input
                                            id="company-name"
                                            type="text"
                                            required={role === 'b2b_customer'}
                                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                                            placeholder={messages.auth.companyPlaceholder}
                                            value={companyName}
                                            onChange={(e) => setCompanyName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="nip-number" className="mb-2 block text-sm font-medium text-slate-700">
                                            {messages.auth.nipNumber} *
                                        </label>
                                        <input
                                            id="nip-number"
                                            type="text"
                                            required={role === 'b2b_customer'}
                                            className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-[#163579] focus:ring-2 focus:ring-[#163579]/15"
                                            placeholder="1234567890"
                                            value={nipNumber}
                                            onChange={(e) => setNipNumber(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="industry-type" className="mb-2 block text-sm font-medium text-slate-700">
                                            {messages.auth.industryType} <span className="text-slate-400">({messages.auth.industryOptional})</span>
                                        </label>
                                        <div ref={industryDropdownRef} className="relative">
                                            <button
                                                id="industry-type"
                                                type="button"
                                                onClick={() => setIsIndustryMenuOpen((prev) => !prev)}
                                                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-left text-slate-900 transition hover:border-slate-300 focus:border-[#163579] focus:outline-none focus:ring-2 focus:ring-[#163579]/15"
                                                aria-haspopup="listbox"
                                                aria-expanded={isIndustryMenuOpen}
                                            >
                                                <span>{selectedIndustryLabel}</span>
                                                <svg
                                                    className={`h-4 w-4 text-slate-400 transition-transform ${isIndustryMenuOpen ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {isIndustryMenuOpen && (
                                                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                                                    <div className="max-h-56 overflow-auto py-1.5" role="listbox" aria-labelledby="industry-type">
                                                        {industryOptions.map((option) => (
                                                            <button
                                                                key={option.value || 'none'}
                                                                type="button"
                                                                onClick={() => {
                                                                    setIndustryType(option.value)
                                                                    setIsIndustryMenuOpen(false)
                                                                }}
                                                                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${industryType === option.value ? 'bg-[#163579]/8 text-[#163579]' : 'text-slate-700 hover:bg-slate-50'}`}
                                                                role="option"
                                                                aria-selected={industryType === option.value}
                                                            >
                                                                <span>{option.label}</span>
                                                                {industryType === option.value && <span aria-hidden="true">•</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                                    {messages.auth.email} *
                                </label>
                                <input
                                    id="email"
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
                                    {messages.auth.password} *
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
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
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-[#163579] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#122d67] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? messages.auth.creatingAccount : messages.auth.createAccountButton}
                        </button>
                    </form>
                </section>
            </div>
        </div>
    )
}
