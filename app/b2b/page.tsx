import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import B2BPortalLoginForm from '@/components/B2BPortalLoginForm'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

export default async function B2BPortalPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const copy = MESSAGES[locale].b2bPage as typeof enMessages.b2bPage

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const gatewayBenefits = [
        copy.benefits.wholesalePricing,
        copy.benefits.bulkDiscounts,
        copy.benefits.vatInvoices,
        copy.benefits.accountManager,
    ]

    console.log('B2B Portal - Auth user:', user?.id, user?.email)
    console.log('B2B Portal - Auth error:', authError)

    if (!user) {
        return (
            <div className="min-h-screen bg-white">
                <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
                    <section className="relative overflow-hidden bg-[linear-gradient(160deg,#0b1d5b_0%,#091748_45%,#070f33_100%)] px-8 py-16 text-white sm:px-12 lg:px-16">
                        <div className="pointer-events-none absolute -left-14 top-14 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
                        <div className="pointer-events-none absolute -right-16 bottom-10 h-52 w-52 rounded-full bg-blue-200/10 blur-3xl" />

                        <div className="relative mx-auto flex h-full w-full max-w-xl flex-col justify-center">
                            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-blue-100/70">{copy.portalEyebrow}</p>
                            <h1 className="max-w-lg text-4xl font-bold leading-tight sm:text-5xl">
                                {copy.wholesaleGatewayTitle}
                            </h1>
                            <p className="mt-5 max-w-lg text-base text-blue-100/85 sm:text-lg">
                                {copy.loginPrompt}
                            </p>

                            <div className="mt-10 space-y-3">
                                {gatewayBenefits.map((benefit, index) => (
                                    <div
                                        key={benefit}
                                        className="b2b-feature-item"
                                        style={{ ['--feature-delay' as string]: `${120 + index * 95}ms` }}
                                    >
                                        <span className="b2b-feature-icon" aria-hidden>
                                            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5">
                                                <path d="M5 10L8.2 13.1L15 6.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </span>
                                        <span className="b2b-feature-text">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="flex items-center bg-white px-8 py-16 sm:px-12 lg:px-16">
                        <div className="mx-auto w-full max-w-md">
                            <h2 className="text-3xl font-bold text-slate-900 sm:text-[2.15rem]">{copy.logIn}</h2>
                            <p className="mt-3 text-slate-600">{copy.partnerSignInHint}</p>

                            <div className="mt-8">
                                <B2BPortalLoginForm />
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        )
    }

    // Get user role
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, company_name')
        .eq('id', user.id)
        .maybeSingle()

    // Debug logging
    if (userError) {
        console.error('Error fetching user data in B2B portal:', userError)
    }

    console.log('B2B Portal - User data:', userData)

    if (!userData || (userData.role !== 'b2b_customer' && userData.role !== 'admin')) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {copy.accessRestrictedTitle}
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {copy.accessRestrictedDescription}
                    </p>
                    {userData && (
                        <p className="text-sm text-gray-500 mb-8">
                            {copy.accountTypeLabel} {userData.role}
                        </p>
                    )}
                    {!userData && (
                        <p className="text-sm text-gray-500 mb-8">
                            {copy.profileNotFound}
                        </p>
                    )}
                    <Link
                        href="/shop"
                        className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        {copy.continueShopping}
                    </Link>
                </div>
            </div>
        )
    }

    // User has B2B access
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">{copy.portalTitle}</h1>
                    <p className="mt-2 text-gray-600">
                        {copy.welcomeBack} {userData.company_name || user.email}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Wholesale Pricing</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {copy.active}
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                            {copy.wholesaleCardDescription}
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{copy.quickActionsTitle}</h3>
                        <Link
                            href="/shop"
                            className="block text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                            {copy.browseProductsArrow}
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{copy.accountDetailsTitle}</h3>
                        <div className="text-sm space-y-2">
                            <p className="text-gray-600">{copy.emailLabel} {user.email}</p>
                            {userData.company_name && (
                                <p className="text-gray-600">{copy.companyLabel} {userData.company_name}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        {copy.startShoppingTitle}
                    </h2>
                    <p className="text-gray-600 mb-6">
                        {copy.startShoppingDescription}
                    </p>
                    <Link
                        href="/shop"
                        className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        {copy.browseCatalog}
                    </Link>
                </div>
            </div>
        </div>
    )
}
