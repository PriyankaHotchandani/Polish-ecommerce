import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import ProfileForm from '@/components/ProfileForm'
import SavedAddresses from '@/components/SavedAddresses'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

export default async function AccountPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const copy = MESSAGES[locale].account as typeof enMessages.account

    // Check if user is authenticated
    let authUser: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null

    try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
            redirect('/auth/login')
        }

        authUser = data.user
    } catch {
        redirect('/auth/login')
    }

    if (!authUser) {
        redirect('/auth/login')
    }

    // Fetch user profile from database
    const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single()

    let profile = existingProfile

    if (!profile) {
        const fullName = authUser.user_metadata?.full_name as string | undefined
        const [firstName, ...lastNameParts] = (fullName || '').split(' ').filter(Boolean)
        const metadataRole = authUser.user_metadata?.role
        const role = metadataRole === 'admin' || metadataRole === 'b2b_customer' || metadataRole === 'b2c_customer'
            ? metadataRole
            : 'b2c_customer'

        const { data: createdProfile, error: createError } = await supabase
            .from('users')
            .upsert({
                id: authUser.id,
                email: authUser.email ?? null,
                first_name: firstName || null,
                last_name: lastNameParts.length > 0 ? lastNameParts.join(' ') : null,
                role,
                company_name: authUser.user_metadata?.company_name ?? null,
                nip_number: authUser.user_metadata?.nip_number ?? null,
            }, { onConflict: 'id' })
            .select('*')
            .single()

        if (createError || !createdProfile) {
            return (
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="text-center">
                        <p className="text-gray-600 text-lg">Could not load your account profile</p>
                        <p className="text-sm text-gray-500 mt-2">{MESSAGES[locale].accountPage.profileLoadRetry}</p>
                        <Link
                            href="/"
                            className="text-green-600 hover:text-green-700 mt-4 inline-block font-medium"
                        >
                            ← {MESSAGES[locale].common.backToHome}
                        </Link>
                    </div>
                </div>
            )
        }

        profile = createdProfile
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{copy.title}</h1>
                <p className="text-gray-600 mt-2">{copy.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Sidebar with account info */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-green-600">
                                    {profile.first_name?.charAt(0)?.toUpperCase() ||
                                        profile.email?.charAt(0)?.toUpperCase() ||
                                        '?'}
                                </span>
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">
                                {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.first_name || 'User'}
                            </h2>

                            <p className="text-sm text-gray-600 mb-4">{profile.email}</p>

                            <div className="pt-4 border-t border-gray-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                    {copy.accountType}
                                </p>
                                <p className="text-sm font-semibold text-gray-900 mb-4">
                                    {profile.role === 'b2b_customer' ? copy.business : copy.retail}
                                </p>
                            </div>

                            {profile.role === 'b2b_customer' && profile.company_name && (
                                <div className="pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                        {MESSAGES[locale].profile.company}
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {profile.company_name}
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-200 mt-4">
                                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                    {copy.memberSince}
                                </p>
                                <p className="text-sm text-gray-900">
                                    {new Date(profile.created_at).toLocaleDateString(locale === 'pl' ? 'pl-PL' : 'en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">
                            {copy.quickLinks}
                        </h3>
                        <div className="space-y-2">
                            <Link
                                href="/orders"
                                className="block text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                                → {copy.viewOrders}
                            </Link>
                            <Link
                                href="/shop"
                                className="block text-sm text-green-600 hover:text-green-700 font-medium"
                            >
                                → {copy.continueShopping}
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <div className="lg:col-span-3 space-y-8">
                    <ProfileForm user={profile} />

                    {/* Saved Addresses Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <SavedAddresses userId={authUser.id} />
                    </div>
                </div>
            </div>
        </div>
    )
}
