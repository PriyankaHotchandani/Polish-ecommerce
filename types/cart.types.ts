import type { Product } from './database.types'

export interface CartItem {
    product: Product
    quantity: number
}

export interface Cart {
    items: CartItem[]
    addItem: (product: Product, quantity?: number) => void
    removeItem: (productId: string) => void
    updateQuantity: (productId: string, quantity: number) => void
    clearCart: () => void
    getItemCount: () => number
    getSubtotal: (userRole: 'b2c_customer' | 'b2b_customer' | null) => number
}
