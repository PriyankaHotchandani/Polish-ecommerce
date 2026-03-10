'use client'

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, ReactNode } from 'react'
import type { Product } from '@/types/database.types'
import type { CartItem, Cart } from '@/types/cart.types'

const CartContext = createContext<Cart | undefined>(undefined)

const CART_STORAGE_KEY = 'polish_ecommerce_cart'

type CartAction =
    | { type: 'LOAD_CART'; payload: CartItem[] }
    | { type: 'ADD_ITEM'; payload: { product: Product; quantity: number } }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
    | { type: 'CLEAR_CART' }

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
    switch (action.type) {
        case 'LOAD_CART':
            return action.payload

        case 'ADD_ITEM': {
            const { product, quantity } = action.payload

            const existingItemIndex = state.findIndex(
                (item) => item.product.id === product.id
            )

            if (existingItemIndex > -1) {
                const newState = [...state]
                const oldQuantity = newState[existingItemIndex].quantity
                newState[existingItemIndex] = {
                    ...newState[existingItemIndex],
                    quantity: oldQuantity + quantity
                }
                return newState
            } else {
                return [...state, { product, quantity }]
            }
        }

        case 'REMOVE_ITEM':
            return state.filter((item) => item.product.id !== action.payload)

        case 'UPDATE_QUANTITY': {
            const { productId, quantity } = action.payload
            if (quantity <= 0) {
                return state.filter((item) => item.product.id !== productId)
            }
            return state.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        }

        case 'CLEAR_CART':
            return []

        default:
            return state
    }
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, dispatch] = useReducer(cartReducer, [])
    const [isLoaded, setIsLoaded] = React.useState(false)

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY)
        if (savedCart) {
            try {
                const parsed = JSON.parse(savedCart)
                dispatch({ type: 'LOAD_CART', payload: parsed })
            } catch (error) {
                console.error('Failed to parse cart from localStorage:', error)
            }
        }
        setIsLoaded(true)
    }, [])

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
        }
    }, [items, isLoaded])

    const addItem = useCallback((product: Product, quantity: number = 1) => {
        dispatch({ type: 'ADD_ITEM', payload: { product, quantity } })
    }, [])

    const removeItem = useCallback((productId: string) => {
        dispatch({ type: 'REMOVE_ITEM', payload: productId })
    }, [])

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } })
    }, [])

    const clearCart = useCallback(() => {
        dispatch({ type: 'CLEAR_CART' })
    }, [])

    const getItemCount = useCallback(() => {
        return items.reduce((total, item) => total + item.quantity, 0)
    }, [items])

    const getSubtotal = useCallback((userRole: 'b2c_customer' | 'b2b_customer' | null) => {
        return items.reduce((total, item) => {
            const price =
                userRole === 'b2b_customer'
                    ? Number(item.product.price_wholesale)
                    : Number(item.product.price_retail)
            return total + price * item.quantity
        }, 0)
    }, [items])

    const value = useMemo<Cart>(() => ({
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getSubtotal,
    }), [items, addItem, removeItem, updateQuantity, clearCart, getItemCount, getSubtotal])

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
