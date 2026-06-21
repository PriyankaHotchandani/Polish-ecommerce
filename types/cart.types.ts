import type { Product, Category } from './database.types'
import type { CartTotals } from '@/utils/pricing'

export type CartProduct = Product & { category?: Category | null }

export interface CartItem {
    product: CartProduct
    quantity: number
}

export interface Cart {
    items: CartItem[]
    addItem: (product: CartProduct, quantity?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    getItemCount: () => number
    getSubtotal: (userRole: 'b2c_customer' | 'b2b_customer' | null) => number
    getCartTotals: (userRole: 'b2c_customer' | 'b2b_customer' | null) => CartTotals
}
