'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLocaleMessages } from '@/contexts/LocaleContext'

export default function CartPage() {
    const { items, updateQuantity, removeItem, clearCart, getItemCount, getSubtotal } = useCart()
    const [userRole, setUserRole] = useState<'b2c_customer' | 'b2b_customer' | null>(null)
    const [loading, setLoading] = useState(true)
    const { messages, locale } = useLocaleMessages()
    const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-US'

    useEffect(() => {
        async function fetchUserRole() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()

                setUserRole(userData?.role || 'b2c_customer')
            } else {
                setUserRole('b2c_customer')
            }
            setLoading(false)
        }

        fetchUserRole()
    }, [])

    const subtotal = getSubtotal(userRole)
    const vatRate = 0.23 // 23% VAT
    const vat = subtotal * vatRate
    const total = subtotal + vat

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">{messages.cartPage.loading}</p>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">{messages.cart.title}</h1>
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <svg
                            className="mx-auto h-16 w-16 text-gray-400 mb-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">{messages.cart.empty}</h2>
                        <p className="text-gray-600 mb-6">{messages.cartPage.emptyHint}</p>
                        <Link
                            href="/shop"
                            className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                        >
                            {messages.cart.continueShopping}
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {messages.cart.title} ({getItemCount()} {getItemCount() === 1 ? messages.cartPage.itemSingular : messages.cartPage.itemPlural})
                    </h1>
                    <button
                        onClick={clearCart}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                        {messages.cartPage.clearCart}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => {
                            const price = userRole === 'b2b_customer' ? item.product.price_wholesale : item.product.price_retail
                            const itemTotal = Number(price) * item.quantity

                            return (
                                <div
                                    key={item.product.id}
                                    className="bg-white rounded-lg shadow-sm p-6 flex gap-6"
                                >
                                    {/* Product Image */}
                                    <div className="flex-shrink-0">
                                        <div className="w-24 h-24 bg-gray-200 rounded-md overflow-hidden">
                                            {item.product.image_urls && item.product.image_urls[0] ? (
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
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-2">
                                            <div>
                                                <Link
                                                    href={`/product/${item.product.slug}`}
                                                    className="text-lg font-semibold text-gray-900 hover:text-green-600"
                                                >
                                                    {item.product.title}
                                                </Link>
                                                {item.product.brand && (
                                                    <p className="text-sm text-gray-600">{messages.product.brand}: {item.product.brand}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => removeItem(item.product.id)}
                                                className="text-red-600 hover:text-red-700 text-sm"
                                            >
                                                {messages.cart.remove}
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between mt-4">
                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    disabled={item.quantity <= 1}
                                                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    -
                                                </button>
                                                <span className="w-12 text-center font-medium">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    disabled={item.quantity >= item.product.inventory_count}
                                                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Price */}
                                            <div className="text-right">
                                                <p className="text-lg font-bold text-gray-900">
                                                    {itemTotal.toLocaleString(numberLocale, {
                                                        style: 'currency',
                                                        currency: 'PLN',
                                                        currencyDisplay: 'code'
                                                    }).replace('PLN', 'PLN ')}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {Number(price).toLocaleString(numberLocale, {
                                                        style: 'currency',
                                                        currency: 'PLN',
                                                        currencyDisplay: 'code'
                                                    }).replace('PLN', 'PLN ')} {messages.cartPage.each}
                                                </p>
                                                {userRole === 'b2b_customer' && Number(item.product.price_retail) > Number(item.product.price_wholesale) && (
                                                    <p className="text-xs text-green-600">
                                                        {messages.cartPage.wholesalePricing}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">{messages.cartPage.orderSummary}</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-gray-700">
                                    <span>{messages.cart.subtotal}</span>
                                    <span>
                                        {subtotal.toLocaleString(numberLocale, {
                                            style: 'currency',
                                            currency: 'PLN',
                                            currencyDisplay: 'code'
                                        }).replace('PLN', 'PLN ')}
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-700">
                                    <span>VAT (23%)</span>
                                    <span>
                                        {vat.toLocaleString(numberLocale, {
                                            style: 'currency',
                                            currency: 'PLN',
                                            currencyDisplay: 'code'
                                        }).replace('PLN', 'PLN ')}
                                    </span>
                                </div>
                                <div className="border-t pt-3 flex justify-between text-lg font-bold text-gray-900">
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

                            {userRole === 'b2b_customer' && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
                                    <p className="text-sm text-green-800 font-medium">
                                        {messages.cartPage.wholesaleBanner}
                                    </p>
                                </div>
                            )}

                            <Link
                                href="/checkout"
                                className="block w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors mb-3 text-center"
                            >
                                {messages.cart.checkout}
                            </Link>

                            <Link
                                href="/shop"
                                className="block w-full text-center bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                {messages.cart.continueShopping}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
