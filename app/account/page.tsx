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
                <div className="max-w-4xl mx-auto px-4 pt-24 pb-12 md:pt-28">
                    <div className="text-center">
                        <p className="text-gray-600 text-lg">Could not load your account profile</p>
                        <p className="text-sm text-gray-500 mt-2">{MESSAGES[locale].accountPage.profileLoadRetry}</p>
                        <Link
                            href="/"
                            className="text-[#163579] hover:text-[#102a63] mt-4 inline-block font-medium"
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
        <div className="bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 pt-24 pb-12 md:pt-28 md:pb-14">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{copy.title}</h1>
                    <p className="text-gray-600 mt-2">{copy.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-7">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-28">
                            <div className="text-center">
                                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-1 ring-[#163579]/10">
                                    <span className="text-3xl font-bold text-[#163579]">
                                        {profile.first_name?.charAt(0)?.toUpperCase() ||
                                            profile.email?.charAt(0)?.toUpperCase() ||
                                            '?'}
                                    </span>
                                </div>

                                <h2 className="text-2xl font-extrabold text-gray-900 mb-1 tracking-tight">
                                    {`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.first_name || 'User'}
                                </h2>

                                <p className="text-sm text-gray-500 mb-5">{profile.email}</p>

                                <div className="space-y-3 text-left">
                                    <div className="inline-flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A11.953 11.953 0 0112 15.75c2.45 0 4.727.737 6.879 2.054M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <div>
                                            <p className="text-[0.65rem] uppercase tracking-[0.1em] text-gray-500 font-semibold">
                                                {copy.accountType}
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {profile.role === 'b2b_customer' ? copy.business : copy.retail}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="inline-flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4.5 10h15M6.75 5.25h10.5A2.25 2.25 0 0119.5 7.5v10.75a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 18.25V7.5a2.25 2.25 0 012.25-2.25z" />
                                        </svg>
                                        <div>
                                            <p className="text-[0.65rem] uppercase tracking-[0.1em] text-gray-500 font-semibold">
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

                                    {profile.role === 'b2b_customer' && profile.company_name && (
                                        <div className="inline-flex w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M6 21V7.5A1.5 1.5 0 017.5 6h9A1.5 1.5 0 0118 7.5V21M9 9.75h6M9 13.5h6" />
                                            </svg>
                                            <div>
                                                <p className="text-[0.65rem] uppercase tracking-[0.1em] text-gray-500 font-semibold">
                                                    {MESSAGES[locale].profile.company}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {profile.company_name}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-4 mt-6">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.12em] mb-3 px-2">
                                {copy.quickLinks}
                            </h3>
                            <div className="space-y-1">
                                <Link
                                    href="/orders"
                                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#163579] transition-colors"
                                >
                                    <span>{copy.viewOrders}</span>
                                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </Link>
                                <Link
                                    href="/shop"
                                    className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#163579] transition-colors"
                                >
                                    <span>{copy.continueShopping}</span>
                                    <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 space-y-8">
                        <ProfileForm user={profile} />
                        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-7">
                            <SavedAddresses userId={authUser.id} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
