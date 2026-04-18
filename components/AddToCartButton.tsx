'use client'

import { useState, useRef, useCallback } from 'react'
import { useCart } from '@/contexts/CartContext'
import type { Product } from '@/types/database.types'
import { useLocaleMessages } from '@/contexts/LocaleContext'

interface AddToCartButtonProps {
    product: Product
    className?: string
    showQuantity?: boolean
    disabled?: boolean
}

export default function AddToCartButton({
    product,
    className = '',
    showQuantity = false,
    disabled = false,
}: AddToCartButtonProps) {
    const { addItem } = useCart()
    const { messages } = useLocaleMessages()
    const [quantity, setQuantity] = useState(1)
    const [isAdding, setIsAdding] = useState(false)
    const [isAdded, setIsAdded] = useState(false)
    const isAddingRef = useRef(false)
    const lastAddTimeRef = useRef(0)

    const isOutOfStock = product.inventory_count === 0

    const handleAddToCart = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        const now = Date.now()
        const timeSinceLastAdd = now - lastAddTimeRef.current

        // Prevent rapid clicks within 1 second
        if (isAddingRef.current || isOutOfStock || (timeSinceLastAdd < 1000)) {
            return
        }

        isAddingRef.current = true
        lastAddTimeRef.current = now
        setIsAdding(true)
        setIsAdded(false)

        // Always add exactly 1 item from shop page, use quantity selector value from detail page
        const quantityToAdd = showQuantity ? quantity : 1
        addItem(product, quantityToAdd)

        // Visual feedback and cooldown
        setTimeout(() => {
            setIsAdding(false)
            setIsAdded(true)
        }, 500)

        setTimeout(() => {
            setIsAdded(false)
            isAddingRef.current = false
            // Reset quantity to 1 after adding on detail pages
            if (showQuantity) {
                setQuantity(1)
            }
        }, 1300)
    }, [product, quantity, showQuantity, addItem, isOutOfStock])

    return (
        <div className="flex items-center gap-2">
            {showQuantity && (
                <div className="flex items-center border border-gray-300 rounded-md">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setQuantity(Math.max(1, quantity - 1))
                        }}
                        className="px-3 py-2 hover:bg-gray-50 transition-colors"
                        disabled={quantity <= 1}
                        type="button"
                    >
                        −
                    </button>
                    <input
                        type="number"
                        min="1"
                        max={product.inventory_count}
                        value={quantity}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                        }}
                        onChange={(e) => {
                            const val = parseInt(e.target.value) || 1
                            setQuantity(Math.min(Math.max(1, val), product.inventory_count))
                        }}
                        className="w-16 text-center border-x border-gray-300 py-2 focus:outline-none"
                    />
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setQuantity(Math.min(product.inventory_count, quantity + 1))
                        }}
                        className="px-3 py-2 hover:bg-gray-50 transition-colors"
                        disabled={quantity >= product.inventory_count}
                        type="button"
                    >
                        +
                    </button>
                </div>
            )}
            <button
                onClick={handleAddToCart}
                disabled={disabled || isOutOfStock || isAdding}
                type="button"
                className={`flex-1 bg-slate-900 text-white py-2 px-4 rounded-md hover:bg-slate-950 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold ${className}`}
            >
                {isAdding ? (
                    <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {messages.common.loading}
                    </span>
                ) : isAdded ? (
                    <span className="flex items-center justify-center gap-2">
                        <span>{messages.cartPage.added}</span>
                        <span aria-hidden="true">✓</span>
                    </span>
                ) : isOutOfStock ? (
                    messages.product.outOfStock
                ) : (
                    messages.product.addToCart
                )}
            </button>
        </div>
    )
}
