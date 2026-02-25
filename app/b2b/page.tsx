import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function B2BPortalPage() {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('B2B Portal - Auth user:', user?.id, user?.email)
    console.log('B2B Portal - Auth error:', authError)

    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
                <div className="max-w-md w-full">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            B2B Wholesale Portal
                        </h1>
                        <p className="text-gray-600">
                            Please log in with a business account to access wholesale pricing and exclusive features
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-8">
                        <h2 className="text-xl font-semibold mb-4">B2B Benefits:</h2>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-start">
                                <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Exclusive wholesale pricing</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Bulk order discounts</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Automatic VAT invoices</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">Dedicated account manager</span>
                            </li>
                        </ul>
                        <div className="space-y-3">
                            <Link
                                href="/auth/login"
                                className="block w-full text-center bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                            >
                                Log In
                            </Link>
                            <Link
                                href="/auth/signup"
                                className="block w-full text-center bg-white border-2 border-green-600 text-green-600 py-3 px-4 rounded-lg font-semibold hover:bg-green-50 transition-colors"
                            >
                                Create Business Account
                            </Link>
                        </div>
                    </div>
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
                        Access Restricted
                    </h1>
                    <p className="text-gray-600 mb-4">
                        This area is only accessible to business customers with B2B accounts.
                    </p>
                    {userData && (
                        <p className="text-sm text-gray-500 mb-8">
                            Your account type: {userData.role}
                        </p>
                    )}
                    {!userData && (
                        <p className="text-sm text-gray-500 mb-8">
                            User profile not found. Please try logging out and back in.
                        </p>
                    )}
                    <Link
                        href="/shop"
                        className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        Continue Shopping
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
                    <h1 className="text-4xl font-bold text-gray-900">B2B Wholesale Portal</h1>
                    <p className="mt-2 text-gray-600">
                        Welcome back, {userData.company_name || user.email}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">Wholesale Pricing</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                            </span>
                        </div>
                        <p className="text-gray-600 text-sm">
                            You have access to exclusive wholesale prices across all products
                        </p>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                        <Link
                            href="/shop"
                            className="block text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                            Browse Products →
                        </Link>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
                        <div className="text-sm space-y-2">
                            <p className="text-gray-600">Email: {user.email}</p>
                            {userData.company_name && (
                                <p className="text-gray-600">Company: {userData.company_name}</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Start Shopping with Wholesale Prices
                    </h2>
                    <p className="text-gray-600 mb-6">
                        All products in our catalog are now available at wholesale prices. Visit the shop to start browsing.
                    </p>
                    <Link
                        href="/shop"
                        className="inline-block bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                        Browse Product Catalog
                    </Link>
                </div>
            </div>
        </div>
    )
}
