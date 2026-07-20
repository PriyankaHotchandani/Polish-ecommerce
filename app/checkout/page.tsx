'use client'

import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import { getProductPriceBreakdown } from '@/utils/pricing'

interface ShippingAddress {
    fullName: string
    email: string
    phone: string
    street: string
    city: string
    postalCode: string
    country: string
}

interface BillingAddress extends ShippingAddress {
    companyName?: string
    nipNumber?: string
}

interface SavedAddress {
    id: string
    address_type: 'shipping' | 'billing' | 'both'
    label: string
    full_name: string
    company_name: string | null
    street: string
    city: string
    postal_code: string
    country: string
    phone: string
    is_default: boolean
}

type PaymentMethod = 'card' | 'transfer' | 'cash_on_delivery'

function normalizeAddressValue(value: string | undefined): string {
    return (value || '').trim()
}

function normalizeAddressComparable(value: string | undefined): string {
    return normalizeAddressValue(value).toLowerCase()
}

function addressesMatch(a: ShippingAddress, b: BillingAddress): boolean {
    return (
        normalizeAddressComparable(a.fullName) === normalizeAddressComparable(b.fullName) &&
        normalizeAddressComparable(a.phone) === normalizeAddressComparable(b.phone) &&
        normalizeAddressComparable(a.street) === normalizeAddressComparable(b.street) &&
        normalizeAddressComparable(a.city) === normalizeAddressComparable(b.city) &&
        normalizeAddressComparable(a.postalCode) === normalizeAddressComparable(b.postalCode) &&
        normalizeAddressComparable(a.country) === normalizeAddressComparable(b.country)
    )
}

function mapSavedToShippingAddress(address: SavedAddress, email: string): ShippingAddress {
    return {
        fullName: address.full_name,
        email,
        phone: address.phone,
        street: address.street,
        city: address.city,
        postalCode: address.postal_code,
        country: address.country,
    }
}

function mapSavedToBillingAddress(address: SavedAddress, email: string): BillingAddress {
    return {
        ...mapSavedToShippingAddress(address, email),
        companyName: address.company_name || '',
        nipNumber: '',
    }
}

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getCartTotals, clearCart } = useCart()
    const [userRole, setUserRole] = useState<'b2c_customer' | 'b2b_customer' | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [orderSuccess, setOrderSuccess] = useState(false)
    const [billingIsSameAsShipping, setBillingIsSameAsShipping] = useState(true)
    const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null)
    const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null)
    const [useSavedShippingAddress, setUseSavedShippingAddress] = useState(true)
    const [useSavedBillingAddress, setUseSavedBillingAddress] = useState(true)
    const supabase = useMemo(() => createClient(), [])
    const { messages, locale } = useLocaleMessages()
    const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        fullName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        postalCode: '',
        country: messages.savedAddresses.defaultCountry
    })

    const [billingAddress, setBillingAddress] = useState<BillingAddress>({
        fullName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        postalCode: '',
        country: messages.savedAddresses.defaultCountry,
        companyName: '',
        nipNumber: ''
    })

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null)
    const [requireInvoice, setRequireInvoice] = useState(false)

    const fetchUserData = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            router.push('/auth/login?redirect=/checkout')
            return
        }

        setUser(user)

        const { data: userData } = await supabase
            .from('users')
            .select('role, company_name, nip_number')
            .eq('id', user.id)
            .maybeSingle()

        const role = userData?.role || 'b2c_customer'
        setUserRole(role)

        const { data: savedAddressData } = await supabase
            .from('saved_addresses')
            .select('*')
            .eq('user_id', user.id)
            .order('is_default', { ascending: false })
            .order('updated_at', { ascending: false })

        const userSavedAddresses = (savedAddressData || []) as SavedAddress[]
        setSavedAddresses(userSavedAddresses)

        const shippingCandidates = userSavedAddresses.filter(
            (address) => address.address_type === 'shipping' || address.address_type === 'both'
        )
        const billingCandidates = userSavedAddresses.filter(
            (address) => address.address_type === 'billing' || address.address_type === 'both'
        )

        if (shippingCandidates.length > 0) {
            const selectedShipping = shippingCandidates[0]
            setSelectedShippingAddressId(selectedShipping.id)
            setUseSavedShippingAddress(true)
            setShippingAddress(mapSavedToShippingAddress(selectedShipping, user.email || ''))
        } else {
            setUseSavedShippingAddress(false)
        }

        if (billingCandidates.length > 0) {
            const selectedBilling = billingCandidates[0]
            setSelectedBillingAddressId(selectedBilling.id)
            setUseSavedBillingAddress(true)
            setBillingAddress((prev) => ({
                ...mapSavedToBillingAddress(selectedBilling, user.email || ''),
                nipNumber: prev.nipNumber || '',
            }))
        } else {
            setUseSavedBillingAddress(false)
        }

        // Pre-fill email
        setShippingAddress(prev => ({ ...prev, email: user.email || '' }))
        setBillingAddress(prev => ({ ...prev, email: user.email || '' }))

        // Pre-fill B2B company info
        if (role === 'b2b_customer' && userData) {
            setBillingAddress(prev => ({
                ...prev,
                companyName: userData.company_name || '',
                nipNumber: userData.nip_number || ''
            }))
            setRequireInvoice(true)
        }

        setLoading(false)
    }, [router, supabase])

    useEffect(() => {
        fetchUserData()
    }, [fetchUserData])

    // Redirect if cart is empty (but not during order processing)
    useEffect(() => {
        if (!loading && items.length === 0 && !orderSuccess && !submitting) {
            router.push('/cart')
        }
    }, [items, loading, router, orderSuccess, submitting])

    const cartTotals = useMemo(() => getCartTotals(), [getCartTotals])
    const { totalNet, totalVat, totalGross, discountPercent, discountAmount, finalTotal: cartFinalTotal } = cartTotals
    const shippingCost = useMemo(() => (totalGross >= 500 ? 0 : 25), [totalGross])
    const total = useMemo(() => cartFinalTotal + shippingCost, [cartFinalTotal, shippingCost])
    const shippingSavedAddresses = useMemo(
        () => savedAddresses.filter(
            (address) => address.address_type === 'shipping' || address.address_type === 'both'
        ),
        [savedAddresses]
    )
    const billingSavedAddresses = useMemo(
        () => savedAddresses.filter(
            (address) => address.address_type === 'billing' || address.address_type === 'both'
        ),
        [savedAddresses]
    )

    const saveAddressIfNew = useCallback(async (
        supabase: ReturnType<typeof createClient>,
        userId: string,
        address: BillingAddress,
        addressType: 'shipping' | 'billing',
        label: string
    ) => {
        const normalized = {
            full_name: normalizeAddressValue(address.fullName),
            street: normalizeAddressValue(address.street),
            city: normalizeAddressValue(address.city),
            postal_code: normalizeAddressValue(address.postalCode),
            country: normalizeAddressValue(address.country),
            phone: normalizeAddressValue(address.phone),
        }

        const { data: existingAddress } = await supabase
            .from('saved_addresses')
            .select('id')
            .eq('user_id', userId)
            .eq('address_type', addressType)
            .eq('full_name', normalized.full_name)
            .eq('street', normalized.street)
            .eq('city', normalized.city)
            .eq('postal_code', normalized.postal_code)
            .eq('country', normalized.country)
            .eq('phone', normalized.phone)
            .maybeSingle()

        if (existingAddress) {
            return
        }

        const { error: saveError } = await supabase.from('saved_addresses').insert({
            user_id: userId,
            address_type: addressType,
            label,
            full_name: address.fullName,
            company_name: address.companyName || null,
            street: address.street,
            city: address.city,
            postal_code: address.postalCode,
            country: address.country,
            phone: address.phone,
            is_default: false,
        })

        if (saveError) {
            throw saveError
        }
    }, [])

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            const checkoutSupabase = createClient()

            if (!paymentMethod) {
                throw new Error(messages.checkout.errors.selectPayment)
            }

            const selectedShippingAddress = useSavedShippingAddress
                ? shippingSavedAddresses.find((address) => address.id === selectedShippingAddressId)
                : null

            if (useSavedShippingAddress && !selectedShippingAddress) {
                throw new Error(messages.checkout.errors.selectShippingAddress)
            }

            const finalShippingAddress: ShippingAddress = selectedShippingAddress
                ? mapSavedToShippingAddress(selectedShippingAddress, user.email || '')
                : shippingAddress

            const selectedBillingAddress = !billingIsSameAsShipping && useSavedBillingAddress
                ? billingSavedAddresses.find((address) => address.id === selectedBillingAddressId)
                : null

            if (!billingIsSameAsShipping && useSavedBillingAddress && !selectedBillingAddress) {
                throw new Error(messages.checkout.errors.selectBillingAddress)
            }

            const effectiveBillingAddress: BillingAddress = billingIsSameAsShipping
                ? {
                    ...finalShippingAddress,
                    companyName: billingAddress.companyName || undefined,
                    nipNumber: billingAddress.nipNumber || undefined,
                }
                : selectedBillingAddress
                    ? {
                        ...mapSavedToBillingAddress(selectedBillingAddress, user.email || ''),
                        companyName: billingAddress.companyName || selectedBillingAddress.company_name || undefined,
                        nipNumber: billingAddress.nipNumber || undefined,
                    }
                    : billingAddress

            // Prepare order items for atomic order creation with inventory check
            const orderItems = items.map(item => {
                const basePrice = Number(item.product.price_retail)
                const breakdown = getProductPriceBreakdown(basePrice, item.product.category ?? null)

                return {
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price_at_purchase: breakdown.gross
                }
            })

            // Create order through server API to avoid browser-side RPC hangs.
            const orderResponse = await fetch('/api/checkout/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    total,
                    requireInvoice,
                    shippingAddress: finalShippingAddress,
                    billingAddress: effectiveBillingAddress,
                    paymentMethod,
                    orderItems,
                }),
            })

            const orderResult = await orderResponse.json()

            if (!orderResponse.ok || !orderResult?.success) {
                throw new Error(orderResult?.error || messages.checkout.errors.createOrder)
            }

            const orderId = orderResult.orderId as string

            // Show success message - set this BEFORE clearing cart to prevent flashing
            setOrderSuccess(true)

            // Clear cart after showing success
            clearCart()

            // Redirect to confirmation page after brief success display
            setTimeout(() => {
                router.replace(`/orders/${orderId}/confirmation`)
            }, 1000)

        } catch (err: any) {
            console.error('Order creation error:', err)

            // Provide user-friendly error messages with Supabase details when available.
            let errorMsg = messages.checkout.errors.createOrderRetry
            const rawMessage = err?.message || ''
            const code = err?.code ? ` [${err.code}]` : ''
            const details = err?.details ? ` ${err.details}` : ''

            if (rawMessage.includes('Insufficient stock')) {
                errorMsg = `${rawMessage} ${messages.checkout.errors.updateCartAndRetry}`
            } else if (rawMessage.includes('Product not found')) {
                errorMsg = messages.checkout.errors.productUnavailable
            } else if (rawMessage) {
                errorMsg = `${rawMessage}${code}${details}`.trim()
            }

            setError(errorMsg)
        } finally {
            // Always unlock submit button unless we've already moved to success screen.
            if (!orderSuccess) {
                setSubmitting(false)
            }
        }
    }, [
        useSavedShippingAddress,
        shippingSavedAddresses,
        selectedShippingAddressId,
        user,
        shippingAddress,
        billingIsSameAsShipping,
        useSavedBillingAddress,
        billingSavedAddresses,
        selectedBillingAddressId,
        billingAddress,
        items,
        userRole,
        requireInvoice,
        paymentMethod,
        total,
        saveAddressIfNew,
        clearCart,
        router,
        orderSuccess
    ])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">{messages.checkout.loading}</p>
            </div>
        )
    }

    if (items.length === 0 && !orderSuccess) {
        return null // Will redirect
    }

    // Show success overlay during order processing
    if (orderSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{messages.checkout.successTitle}</h2>
                    <p className="text-gray-600">{messages.checkout.redirecting}</p>
                    <div className="mt-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Forms Section */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Shipping Address */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Shipping Address</h2>
                                    {shippingSavedAddresses.length > 0 && (
                                        <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => setUseSavedShippingAddress(true)}
                                                className={`px-3 py-1.5 text-sm font-medium ${useSavedShippingAddress
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white text-gray-700'
                                                    }`}
                                            >
                                                {messages.savedAddresses.saved}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setUseSavedShippingAddress(false)}
                                                className={`px-3 py-1.5 text-sm font-medium ${!useSavedShippingAddress
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-white text-gray-700'
                                                    }`}
                                            >
                                                {messages.savedAddresses.addNew}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {useSavedShippingAddress && shippingSavedAddresses.length > 0 ? (
                                    <div className="space-y-3">
                                        {shippingSavedAddresses.map((address) => (
                                            <label
                                                key={address.id}
                                                className={`block p-4 border rounded-lg cursor-pointer transition ${selectedShippingAddressId === address.id
                                                    ? 'border-green-500 bg-green-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <input
                                                        type="radio"
                                                        name="saved-shipping-address"
                                                        checked={selectedShippingAddressId === address.id}
                                                        onChange={() => {
                                                            setSelectedShippingAddressId(address.id)
                                                            setShippingAddress(
                                                                mapSavedToShippingAddress(address, user?.email || '')
                                                            )
                                                        }}
                                                        className="mt-1 h-4 w-4 text-green-600"
                                                    />
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {address.label}
                                                            {address.is_default && (
                                                                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                                                    Default
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-700 mt-1">{address.full_name}</p>
                                                        <p className="text-sm text-gray-600">{address.street}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {address.postal_code} {address.city}, {address.country}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{address.phone}</p>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {messages.savedAddresses.fullName} *
                                            </label>
                                            <input
                                                type="text"
                                                required={!useSavedShippingAddress}
                                                value={shippingAddress.fullName}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {messages.profile.email} *
                                            </label>
                                            <input
                                                type="email"
                                                required={!useSavedShippingAddress}
                                                value={shippingAddress.email}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {messages.profile.phone} *
                                            </label>
                                            <input
                                                type="tel"
                                                required={!useSavedShippingAddress}
                                                value={shippingAddress.phone}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {messages.savedAddresses.street} *
                                            </label>
                                            <input
                                                type="text"
                                                required={!useSavedShippingAddress}
                                                value={shippingAddress.street}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {messages.savedAddresses.city} *
                                            </label>
                                            <input
                                                type="text"
                                                required={!useSavedShippingAddress}
                                                value={shippingAddress.city}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {messages.savedAddresses.postalCode} *
                                            </label>
                                            <input
                                                type="text"
                                                required={!useSavedShippingAddress}
                                                value={shippingAddress.postalCode}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                {messages.savedAddresses.country} *
                                            </label>
                                            <select
                                                value={shippingAddress.country}
                                                onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value={messages.checkout.countries.poland}>{messages.checkout.countries.poland}</option>
                                                <option value={messages.checkout.countries.germany}>{messages.checkout.countries.germany}</option>
                                                <option value={messages.checkout.countries.czechRepublic}>{messages.checkout.countries.czechRepublic}</option>
                                                <option value={messages.checkout.countries.slovakia}>{messages.checkout.countries.slovakia}</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Billing Address */}
                            {userRole === 'b2b_customer' && (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">{messages.checkout.billingAddress}</h2>

                                    <div className="mb-6">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={billingIsSameAsShipping}
                                                onChange={(e) => setBillingIsSameAsShipping(e.target.checked)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                {messages.checkout.sameAsShipping}
                                            </span>
                                        </label>
                                    </div>

                                    {!billingIsSameAsShipping && (
                                        <div className="space-y-4">
                                            {billingSavedAddresses.length > 0 && (
                                                <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseSavedBillingAddress(true)}
                                                        className={`px-3 py-1.5 text-sm font-medium ${useSavedBillingAddress
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-white text-gray-700'
                                                            }`}
                                                    >
                                                        {messages.savedAddresses.saved}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUseSavedBillingAddress(false)}
                                                        className={`px-3 py-1.5 text-sm font-medium ${!useSavedBillingAddress
                                                            ? 'bg-gray-900 text-white'
                                                            : 'bg-white text-gray-700'
                                                            }`}
                                                    >
                                                        {messages.savedAddresses.addNew}
                                                    </button>
                                                </div>
                                            )}

                                            {useSavedBillingAddress && billingSavedAddresses.length > 0 && (
                                                <div className="space-y-3">
                                                    {billingSavedAddresses.map((address) => (
                                                        <label
                                                            key={address.id}
                                                            className={`block p-4 border rounded-lg cursor-pointer transition ${selectedBillingAddressId === address.id
                                                                ? 'border-green-500 bg-green-50'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                                }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="saved-billing-address"
                                                                    checked={selectedBillingAddressId === address.id}
                                                                    onChange={() => {
                                                                        setSelectedBillingAddressId(address.id)
                                                                        setBillingAddress((prev) => ({
                                                                            ...mapSavedToBillingAddress(address, user?.email || ''),
                                                                            nipNumber: prev.nipNumber || '',
                                                                        }))
                                                                    }}
                                                                    className="mt-1 h-4 w-4 text-green-600"
                                                                />
                                                                <div>
                                                                    <p className="font-semibold text-gray-900">
                                                                        {address.label}
                                                                        {address.is_default && (
                                                                            <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                                                                {messages.savedAddresses.defaultLabel}
                                                                            </span>
                                                                        )}
                                                                    </p>
                                                                    <p className="text-sm text-gray-700 mt-1">
                                                                        {address.full_name}
                                                                    </p>
                                                                    <p className="text-sm text-gray-600">{address.street}</p>
                                                                    <p className="text-sm text-gray-600">
                                                                        {address.postal_code} {address.city}, {address.country}
                                                                    </p>
                                                                    <p className="text-sm text-gray-600">{address.phone}</p>
                                                                </div>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {(!useSavedBillingAddress || billingSavedAddresses.length === 0) && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {messages.savedAddresses.fullName} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required={!useSavedBillingAddress}
                                                            value={billingAddress.fullName}
                                                            onChange={(e) =>
                                                                setBillingAddress({ ...billingAddress, fullName: e.target.value })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {messages.profile.company} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={billingAddress.companyName}
                                                            onChange={(e) =>
                                                                setBillingAddress({ ...billingAddress, companyName: e.target.value })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {messages.profile.nip} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={billingAddress.nipNumber}
                                                            onChange={(e) =>
                                                                setBillingAddress({ ...billingAddress, nipNumber: e.target.value })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {messages.profile.phone} *
                                                        </label>
                                                        <input
                                                            type="tel"
                                                            required={!useSavedBillingAddress}
                                                            value={billingAddress.phone}
                                                            onChange={(e) =>
                                                                setBillingAddress({ ...billingAddress, phone: e.target.value })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {messages.savedAddresses.street} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required={!useSavedBillingAddress}
                                                            value={billingAddress.street}
                                                            onChange={(e) =>
                                                                setBillingAddress({ ...billingAddress, street: e.target.value })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {messages.savedAddresses.city} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required={!useSavedBillingAddress}
                                                            value={billingAddress.city}
                                                            onChange={(e) =>
                                                                setBillingAddress({ ...billingAddress, city: e.target.value })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                                            {messages.savedAddresses.postalCode} *
                                                        </label>
                                                        <input
                                                            type="text"
                                                            required={!useSavedBillingAddress}
                                                            value={billingAddress.postalCode}
                                                            onChange={(e) =>
                                                                setBillingAddress({ ...billingAddress, postalCode: e.target.value })
                                                            }
                                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="mt-6">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={requireInvoice}
                                                onChange={(e) => setRequireInvoice(e.target.checked)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                {messages.checkout.requireInvoice}
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">{messages.invoice.paymentMethod}</h2>

                                <div className="space-y-3">
                                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => setPaymentMethod('card')}
                                            required={!paymentMethod}
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-3 text-gray-900 font-medium">{messages.checkout.payment.card}</span>
                                    </label>

                                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="transfer"
                                            checked={paymentMethod === 'transfer'}
                                            onChange={() => setPaymentMethod('transfer')}
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-3 text-gray-900 font-medium">{messages.checkout.payment.transfer}</span>
                                    </label>

                                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cash_on_delivery"
                                            checked={paymentMethod === 'cash_on_delivery'}
                                            onChange={() => setPaymentMethod('cash_on_delivery')}
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-3 text-gray-900 font-medium">{messages.checkout.payment.cod}</span>
                                    </label>
                                </div>

                                <p className="mt-4 text-sm text-gray-500">
                                    {messages.checkout.paymentHint}
                                </p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">{messages.checkout.orderSummary}</h2>

                                {/* Items */}
                                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                                    {items.map((item) => {
                                        const basePrice = Number(item.product.price_retail)
                                        const breakdown = getProductPriceBreakdown(basePrice, item.product.category ?? null)
                                        const itemTotal = breakdown.gross * item.quantity

                                        return (
                                            <div key={item.product.id} className="flex gap-3">
                                                <div className="w-16 h-16 bg-gray-200 rounded-md flex-shrink-0 overflow-hidden">
                                                    {item.product.image_urls?.[0] ? (
                                                        <img
                                                            src={item.product.image_urls[0]}
                                                            alt={item.product.title}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex items-center justify-center h-full">
                                                            <span className="text-gray-400 text-xs">{messages.cartPage.noImage}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.product.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{messages.cart.quantity}: {item.quantity}</p>
                                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                                        {itemTotal.toLocaleString(numberLocale, {
                                                            style: 'currency',
                                                            currency: 'PLN',
                                                            currencyDisplay: 'code'
                                                        }).replace('PLN', 'PLN ')}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Totals */}
                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between text-gray-700">
                                        <span>{locale === 'pl' ? 'Netto' : 'Subtotal (excl. VAT)'}</span>
                                        <span>
                                            {totalNet.toLocaleString(numberLocale, {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>VAT (23%)</span>
                                        <span>
                                            {totalVat.toLocaleString(numberLocale, {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>{messages.cart.subtotal}</span>
                                        <span>
                                            {totalGross.toLocaleString(numberLocale, {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}
                                        </span>
                                    </div>
                                    {discountPercent > 0 && (
                                        <div className="flex justify-between text-emerald-700 font-medium">
                                            <span>
                                                {locale === 'pl'
                                                    ? `Rabat wolumenowy (${discountPercent}%)`
                                                    : `Volume discount (${discountPercent}%)`}
                                            </span>
                                            <span>
                                                -{discountAmount.toLocaleString(numberLocale, {
                                                    style: 'currency',
                                                    currency: 'PLN',
                                                    currencyDisplay: 'code'
                                                }).replace('PLN', 'PLN ')}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-700">
                                        <span>{messages.invoice.shipping}</span>
                                        <span>
                                            {shippingCost === 0 ? messages.checkout.freeShippingLabel : `${shippingCost.toLocaleString(numberLocale, {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}`}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                                        <span>{messages.cart.total}</span>
                                        <span>
                                            {total.toLocaleString(numberLocale, {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}
                                        </span>
                                    </div>
                                </div>

                                {discountPercent > 0 && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                                        <p className="text-sm text-green-800 font-medium">
                                            {messages.checkout.wholesaleApplied}
                                        </p>
                                    </div>
                                )}

                                {shippingCost === 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                                        <p className="text-sm text-blue-800">
                                            {messages.checkout.freeShippingHint}
                                        </p>
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors mt-6 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {submitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            {messages.checkout.processingOrder}
                                        </>
                                    ) : messages.checkout.placeOrder}
                                </button>

                                <Link
                                    href="/cart"
                                    className="block w-full text-center text-gray-600 py-2 mt-3 hover:text-gray-900"
                                >
                                    ← {messages.checkout.backToCart}
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
