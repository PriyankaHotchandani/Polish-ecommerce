'use client'

import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/components/admin/Toast'
import { LocaleProvider, type Locale } from '@/contexts/LocaleContext'

export function Providers({ children, initialLocale }: { children: React.ReactNode, initialLocale: Locale }) {
    return (
        <LocaleProvider initialLocale={initialLocale}>
            <ToastProvider>
                <CartProvider>{children}</CartProvider>
            </ToastProvider>
        </LocaleProvider>
    )
}
