import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import B2BPortalLoginForm from '@/components/B2BPortalLoginForm'
import B2BCommandCenter from '@/components/b2b/B2BCommandCenter'

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

    if (userError) {
        console.error('Error fetching user data in B2B portal:', userError)
    }

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
                        className="inline-block rounded-md bg-[#163579] px-6 py-3 font-semibold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#102a63] hover:shadow-md"
                    >
                        {copy.continueShopping}
                    </Link>
                </div>
            </div>
        )
    }

    const { data: recentOrdersData } = await supabase
        .from('orders')
        .select(`
            id,
            created_at,
            total_amount,
            order_items (
                quantity,
                product:products (*)
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(2)

    const { data: latestInvoiceData } = await supabase
        .from('orders')
        .select('invoice_url, invoice_number, created_at')
        .eq('user_id', user.id)
        .not('invoice_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const dashboardCopy = locale === 'pl'
        ? {
            quickOrderTitle: 'Szybkie zamowienie',
            quickOrderHint: 'Masz gotowa liste SKU? Uruchom szybkie zamowienie bez przeklikiwania katalogu.',
            bulkOrderForm: 'Formularz zamowienia hurtowego',
            uploadCsv: 'Przeslij CSV',
            downloadTemplate: 'Pobierz szablon CSV',
            recentOrdersTitle: 'Ostatnie zamowienia',
            recentOrdersHint: 'Zamow ponownie poprzednie pozycje jednym kliknieciem.',
            noRecentOrders: 'Brak ostatnich zamowien do ponowienia.',
            reorder: 'Zamow ponownie',
            adding: 'Dodawanie...',
            added: 'Dodano',
            viewAllOrders: 'Wszystkie zamowienia',
            recentInvoicesTitle: 'Faktury i rozliczenia',
            creditTermsLabel: 'Warunki platnosci',
            creditTermsValue: 'Net 30',
            accountBalanceLabel: 'Saldo konta',
            accountBalanceValue: 'PLN 0.00',
            downloadLatestInvoice: 'Pobierz ostatnia fakture VAT',
            invoicePending: 'Ostatnia faktura oczekuje na przeslanie przez administratora.',
            supportTitle: 'Dedykowane wsparcie',
            supportHint: 'Twoj opiekun konta jest dostepny od razu, gdy potrzebujesz pomocy.',
            accountManagerLabel: 'Opiekun konta',
            accountManagerName: 'Anna Kowalska',
            accountManagerPhone: '+48 22 100 20 30',
            accountManagerEmail: 'anna.kowalska@bmspzoo.pl',
            callLabel: 'Telefon:',
            emailLabel: 'Email:',
            orderLabel: 'Zamowienie',
            productsLabel: 'produktow',
        }
        : {
            quickOrderTitle: 'Quick Order',
            quickOrderHint: 'Have a SKU list ready? Place replenishment orders without browsing the full catalog.',
            bulkOrderForm: 'Bulk Order Form',
            uploadCsv: 'Upload CSV',
            downloadTemplate: 'Download CSV Template',
            recentOrdersTitle: 'Recent Orders',
            recentOrdersHint: 'Reorder your latest purchases in a single click.',
            noRecentOrders: 'No recent orders available to reorder yet.',
            reorder: 'Reorder',
            adding: 'Adding...',
            added: 'Added',
            viewAllOrders: 'View all orders',
            recentInvoicesTitle: 'Invoices & Billing',
            creditTermsLabel: 'Credit terms',
            creditTermsValue: 'Net 30',
            accountBalanceLabel: 'Account balance',
            accountBalanceValue: 'PLN 0.00',
            downloadLatestInvoice: 'Download Latest VAT Invoice',
            invoicePending: 'Latest invoice is pending admin upload.',
            supportTitle: 'Dedicated Support',
            supportHint: 'Your account manager is one message away for urgent fulfillment support.',
            accountManagerLabel: 'Your Account Manager',
            accountManagerName: 'Anna Kowalska',
            accountManagerPhone: '+48 22 100 20 30',
            accountManagerEmail: 'anna.kowalska@bmspzoo.pl',
            callLabel: 'Call:',
            emailLabel: 'Email:',
            orderLabel: 'Order',
            productsLabel: 'products',
        }

    const recentOrders = (recentOrdersData || []).map((order) => ({
        id: order.id,
        createdAt: order.created_at,
        totalAmount: Number(order.total_amount),
        items: (order.order_items || []).map((item: any) => ({
            quantity: item.quantity,
            product: item.product || null,
        })),
    }))

    const latestInvoice = latestInvoiceData?.invoice_url
        ? {
            invoiceUrl: latestInvoiceData.invoice_url,
            invoiceNumber: latestInvoiceData.invoice_number,
        }
        : null

    // User has B2B access
    return (
        <div className="min-h-screen bg-gray-50 pt-24 md:pt-28">
            <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 md:pb-14 lg:px-8">
                <div className="mb-8">
                    <div className="mb-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">
                        {copy.active}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900">{copy.portalTitle}</h1>
                    <p className="mt-2 text-gray-600">
                        {copy.welcomeBack} {userData.company_name || user.email}
                    </p>
                </div>

                <B2BCommandCenter
                    locale={locale}
                    copy={dashboardCopy}
                    recentOrders={recentOrders}
                    latestInvoice={latestInvoice}
                />
            </div>
        </div>
    )
}
