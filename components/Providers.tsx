'use client'

import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/components/admin/Toast'

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <CartProvider>{children}</CartProvider>
        </ToastProvider>
    )
}
