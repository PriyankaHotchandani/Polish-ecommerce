'use client'

import { useCart } from '@/contexts/CartContext'
import Link from 'next/link'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import { getLocalizedBrandName, getLocalizedProductTitle } from '@/utils/productLocalization'

export default function CartPage() {
    const { items, updateQuantity, removeItem, clearCart, getItemCount, getSubtotal } = useCart()
    const searchParams = useSearchParams()
    const [userRole, setUserRole] = useState<'b2c_customer' | 'b2b_customer' | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [removingItems, setRemovingItems] = useState<Set<string>>(new Set())
    const [showBulkBanner, setShowBulkBanner] = useState(false)
    const [loading, setLoading] = useState(true)
    const { messages, locale } = useLocaleMessages()
    const numberLocale = locale === 'pl' ? 'pl-PL' : 'en-US'
    const rowRefs = useRef(new Map<string, HTMLDivElement>())
    const previousTopById = useRef(new Map<string, number>())

    useEffect(() => {
        async function fetchUserRole() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                setIsAuthenticated(true)
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()

                setUserRole(userData?.role || 'b2c_customer')
            } else {
                setIsAuthenticated(false)
                setUserRole('b2c_customer')
            }
            setLoading(false)
        }

        fetchUserRole()
    }, [])

    useEffect(() => {
        setShowBulkBanner(searchParams.get('bulk') === '1')
    }, [searchParams])

    useLayoutEffect(() => {
        const nextTopById = new Map<string, number>()

        items.forEach((item) => {
            const rowElement = rowRefs.current.get(item.product.id)
            if (!rowElement) return

            const nextTop = rowElement.getBoundingClientRect().top
            nextTopById.set(item.product.id, nextTop)

            const previousTop = previousTopById.current.get(item.product.id)
            if (previousTop === undefined) return

            const deltaY = previousTop - nextTop
            if (Math.abs(deltaY) < 0.5) return

            rowElement.style.transition = 'none'
            rowElement.style.transform = `translateY(${deltaY}px)`

            requestAnimationFrame(() => {
                rowElement.style.transition = 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)'
                rowElement.style.transform = 'translateY(0)'
            })
        })

        previousTopById.current = nextTopById
    }, [items])

    const setRowRef = (productId: string, element: HTMLDivElement | null) => {
        if (!element) {
            rowRefs.current.delete(productId)
            return
        }

        rowRefs.current.set(productId, element)
    }

    const handleRemoveItem = (productId: string) => {
        setRemovingItems((previous) => {
            const next = new Set(previous)
            next.add(productId)
            return next
        })

        setTimeout(() => {
            removeItem(productId)
            setRemovingItems((previous) => {
                const next = new Set(previous)
                next.delete(productId)
                return next
            })
        }, 300)
    }

    const subtotal = getSubtotal(userRole)
    const vatRate = 0.23 // 23% VAT
    const vat = subtotal * vatRate
    const total = subtotal + vat

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
                <p className="text-gray-600">{messages.cartPage.loading}</p>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 pt-24">
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
                            className="inline-block bg-[#163579] text-white px-6 py-3 rounded-lg hover:bg-[#122d67] transition-colors"
                        >
                            {messages.cart.continueShopping}
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <Link href="/shop" className="featured-products-cta">
                        {messages.cartPage.backToShop}
                        <svg className="featured-products-cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>

                    <div className="mt-4 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">
                            {messages.cart.title} ({getItemCount()} {getItemCount() === 1 ? messages.cartPage.itemSingular : messages.cartPage.itemPlural})
                        </h1>
                        <button
                            onClick={clearCart}
                            className="text-slate-500 hover:text-slate-800 text-sm font-medium transition-colors"
                        >
                            {messages.cartPage.clearCart}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_26px_rgba(15,23,42,0.06)] divide-y divide-gray-100">
                            {items.map((item) => {
                                const price = userRole === 'b2b_customer' ? item.product.price_wholesale : item.product.price_retail
                                const itemTotal = Number(price) * item.quantity
                                const isRemoving = removingItems.has(item.product.id)
                                const localizedTitle = getLocalizedProductTitle(item.product.title, item.product.slug, locale)
                                const localizedBrand = getLocalizedBrandName(item.product.brand, locale)

                                return (
                                    <div
                                        key={item.product.id}
                                        ref={(element) => setRowRef(item.product.id, element)}
                                        className={`overflow-hidden transition-all duration-300 ease-out ${isRemoving ? 'max-h-0 -translate-y-2 opacity-0 py-0' : 'max-h-[320px] opacity-100'}`}
                                    >
                                        <div className="flex gap-6 px-6 py-6">
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
                                                            className="text-lg font-semibold text-gray-900 hover:text-[#163579] transition-colors"
                                                        >
                                                            {localizedTitle}
                                                        </Link>
                                                        {localizedBrand && (
                                                            <p className="text-sm text-gray-600">{messages.product.brand}: {localizedBrand}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleRemoveItem(item.product.id)}
                                                        className="text-slate-400 hover:text-slate-800 transition-colors"
                                                        aria-label={`${messages.cart.remove} ${item.product.title}`}
                                                    >
                                                        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5l10 10M15 5L5 15" />
                                                        </svg>
                                                    </button>
                                                </div>

                                                <div className="flex items-center justify-between mt-4">
                                                    {/* Quantity Controls */}
                                                    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                            disabled={item.quantity <= 1}
                                                            className="w-8 h-8 rounded-md bg-gray-100 text-slate-700 flex items-center justify-center transition-colors hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-10 text-center font-medium text-slate-900">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                            disabled={item.quantity >= item.product.inventory_count}
                                                            className="w-8 h-8 rounded-md bg-gray-100 text-slate-700 flex items-center justify-center transition-colors hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed"
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
                                                            <p className="text-xs text-[#163579]">
                                                                {messages.cartPage.wholesalePricing}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        {showBulkBanner && (
                            <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-900">
                                <div className="flex items-start justify-between gap-3">
                                    <p>{messages.cartPage.bulkImportSuccess}</p>
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkBanner(false)}
                                        className="text-xs font-semibold uppercase tracking-[0.08em] text-emerald-800 hover:text-emerald-900"
                                    >
                                        {messages.cartPage.dismiss}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!isAuthenticated && (
                            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50/80 p-4 text-sm text-slate-700">
                                <span>{messages.cartPage.loginPrompt} </span>
                                <Link href="/auth/login" className="font-semibold text-[#163579] underline-offset-4 hover:underline">
                                    {messages.auth.signIn}
                                </Link>
                                <span> {messages.cartPage.loginPromptSuffix}</span>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_26px_rgba(15,23,42,0.06)] p-6 sticky top-28">
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
                                <div className="bg-[#163579]/[0.06] border border-[#163579]/20 rounded-lg p-3 mb-6">
                                    <p className="text-sm text-[#163579] font-medium">
                                        {messages.cartPage.wholesaleBanner}
                                    </p>
                                </div>
                            )}

                            <Link
                                href="/checkout"
                                className="block w-full bg-[#163579] text-white py-3 px-6 rounded-lg font-semibold hover:bg-[#122d67] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(22,53,121,0.24)] mb-4 text-center"
                            >
                                {messages.cart.checkout}
                            </Link>

                            <div className="mb-4 flex items-center justify-center text-[0.75rem] tracking-[0.04em] text-slate-400">
                                <span className="inline-flex items-center gap-1.5">
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.9} d="M12 2l7 4v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-4z" />
                                    </svg>
                                    {messages.cartPage.secureCheckout}
                                </span>
                            </div>

                            <div className="text-center">
                                <Link
                                    href="/shop"
                                    className="featured-products-cta"
                                >
                                    {messages.cart.continueShopping}
                                    <svg className="featured-products-cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
