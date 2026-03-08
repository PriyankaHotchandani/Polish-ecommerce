'use client'

import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

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

type PaymentMethod = 'card' | 'transfer' | 'cash_on_delivery'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getSubtotal, clearCart } = useCart()
    const [userRole, setUserRole] = useState<'b2c_customer' | 'b2b_customer' | null>(null)
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [orderSuccess, setOrderSuccess] = useState(false)
    const [billingIsSameAsShipping, setBillingIsSameAsShipping] = useState(true)

    const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
        fullName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        postalCode: '',
        country: 'Poland'
    })

    const [billingAddress, setBillingAddress] = useState<BillingAddress>({
        fullName: '',
        email: '',
        phone: '',
        street: '',
        city: '',
        postalCode: '',
        country: 'Poland',
        companyName: '',
        nipNumber: ''
    })

    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')
    const [requireInvoice, setRequireInvoice] = useState(false)

    useEffect(() => {
        async function fetchUserData() {
            const supabase = createClient()
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
        }

        fetchUserData()
    }, [router])

    // Redirect if cart is empty (but not during order processing)
    useEffect(() => {
        if (!loading && items.length === 0 && !orderSuccess && !submitting) {
            router.push('/cart')
        }
    }, [items, loading, router, orderSuccess, submitting])

    const subtotal = getSubtotal(userRole)
    const vatRate = 0.23
    const vat = subtotal * vatRate
    const shippingCost = subtotal >= 500 ? 0 : 25 // Free shipping over 500 PLN
    const total = subtotal + vat + shippingCost

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            const supabase = createClient()

            const effectiveBillingAddress: BillingAddress = billingIsSameAsShipping
                ? {
                    ...shippingAddress,
                    companyName: billingAddress.companyName || undefined,
                    nipNumber: billingAddress.nipNumber || undefined,
                }
                : billingAddress

            // Prepare order items for atomic order creation with inventory check
            const orderItems = items.map(item => {
                const price = userRole === 'b2b_customer'
                    ? item.product.price_wholesale
                    : item.product.price_retail

                return {
                    product_id: item.product.id,
                    quantity: item.quantity,
                    price_at_purchase: Number(price)
                }
            })

            // Create order atomically with inventory validation and decrement
            const { data, error: rpcError } = await supabase
                .rpc('create_order_with_inventory_check', {
                    p_user_id: user.id,
                    p_total_amount: total,
                    p_is_b2b_invoice_required: requireInvoice,
                    p_shipping_address: shippingAddress,
                    p_billing_address: effectiveBillingAddress,
                    p_payment_method: paymentMethod,
                    p_order_items: orderItems
                })
                .single()

            if (rpcError) throw rpcError

            // Check if order creation succeeded
            if (!data.success) {
                throw new Error(data.error_message || 'Failed to create order')
            }

            const orderId = data.order_id

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
            // Provide user-friendly error messages
            let errorMsg = 'Failed to create order. Please try again.'
            if (err.message && err.message.includes('Insufficient stock')) {
                errorMsg = err.message + ' Please update your cart and try again.'
            } else if (err.message && err.message.includes('Product not found')) {
                errorMsg = 'One or more products in your cart is no longer available. Please update your cart.'
            } else if (err.message) {
                errorMsg = err.message
            }
            setError(errorMsg)
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading checkout...</p>
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
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
                    <p className="text-gray-600">Redirecting to confirmation page...</p>
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
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Shipping Address</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingAddress.fullName}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, fullName: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={shippingAddress.email}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone *
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            value={shippingAddress.phone}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Street Address *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingAddress.street}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            City *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingAddress.city}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Postal Code *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={shippingAddress.postalCode}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, postalCode: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Country *
                                        </label>
                                        <select
                                            value={shippingAddress.country}
                                            onChange={(e) => setShippingAddress({ ...shippingAddress, country: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        >
                                            <option value="Poland">Poland</option>
                                            <option value="Germany">Germany</option>
                                            <option value="Czech Republic">Czech Republic</option>
                                            <option value="Slovakia">Slovakia</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Billing Address */}
                            {userRole === 'b2b_customer' && (
                                <div className="bg-white rounded-lg shadow-sm p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-6">Billing Address</h2>

                                    <div className="mb-6">
                                        <label className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={billingIsSameAsShipping}
                                                onChange={(e) => setBillingIsSameAsShipping(e.target.checked)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                                Same as shipping address
                                            </span>
                                        </label>
                                    </div>

                                    {!billingIsSameAsShipping && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Company Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={billingAddress.companyName}
                                                    onChange={(e) => setBillingAddress({ ...billingAddress, companyName: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    NIP Number *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={billingAddress.nipNumber}
                                                    onChange={(e) => setBillingAddress({ ...billingAddress, nipNumber: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                />
                                            </div>

                                            {/* Add other billing address fields as needed */}
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
                                                Require VAT invoice
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {/* Payment Method */}
                            <div className="bg-white rounded-lg shadow-sm p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Method</h2>

                                <div className="space-y-3">
                                    <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="card"
                                            checked={paymentMethod === 'card'}
                                            onChange={() => setPaymentMethod('card')}
                                            className="w-4 h-4 text-green-600 border-gray-300 focus:ring-green-500"
                                        />
                                        <span className="ml-3 text-gray-900 font-medium">Credit/Debit Card</span>
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
                                        <span className="ml-3 text-gray-900 font-medium">Bank Transfer</span>
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
                                        <span className="ml-3 text-gray-900 font-medium">Cash on Delivery</span>
                                    </label>
                                </div>

                                <p className="mt-4 text-sm text-gray-500">
                                    Payment processing will be implemented in the next phase. Your order will be marked as pending.
                                </p>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

                                {/* Items */}
                                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                                    {items.map((item) => {
                                        const price = userRole === 'b2b_customer'
                                            ? item.product.price_wholesale
                                            : item.product.price_retail
                                        const itemTotal = Number(price) * item.quantity

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
                                                            <span className="text-gray-400 text-xs">No image</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {item.product.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                                    <p className="text-sm font-semibold text-gray-900 mt-1">
                                                        {itemTotal.toLocaleString('en-US', {
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
                                        <span>Subtotal</span>
                                        <span>
                                            {subtotal.toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>VAT (23%)</span>
                                        <span>
                                            {vat.toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-gray-700">
                                        <span>Shipping</span>
                                        <span>
                                            {shippingCost === 0 ? 'FREE' : `${shippingCost.toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}`}
                                        </span>
                                    </div>
                                    <div className="border-t pt-2 flex justify-between text-lg font-bold text-gray-900">
                                        <span>Total</span>
                                        <span>
                                            {total.toLocaleString('en-US', {
                                                style: 'currency',
                                                currency: 'PLN',
                                                currencyDisplay: 'code'
                                            }).replace('PLN', 'PLN ')}
                                        </span>
                                    </div>
                                </div>

                                {userRole === 'b2b_customer' && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                                        <p className="text-sm text-green-800 font-medium">
                                            🎉 Wholesale pricing applied
                                        </p>
                                    </div>
                                )}

                                {shippingCost === 0 && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                                        <p className="text-sm text-blue-800">
                                            Free shipping on orders over 500 PLN
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
                                            Processing Order...
                                        </>
                                    ) : 'Place Order'}
                                </button>

                                <Link
                                    href="/cart"
                                    className="block w-full text-center text-gray-600 py-2 mt-3 hover:text-gray-900"
                                >
                                    ← Back to Cart
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
