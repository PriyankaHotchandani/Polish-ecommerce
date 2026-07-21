'use client'

import { CartProvider } from '@/contexts/CartContext'
import { ToastProvider } from '@/components/admin/Toast'
import { LocaleProvider, type Locale } from '@/contexts/LocaleContext'
import AuthSessionEnforcer from '@/components/AuthSessionEnforcer'
import NavigationProgress from '@/components/NavigationProgress'

export function Providers({ children, initialLocale }: { children: React.ReactNode, initialLocale: Locale }) {
    return (
        <LocaleProvider initialLocale={initialLocale}>
            <AuthSessionEnforcer />
            <NavigationProgress />
            <ToastProvider>
                <CartProvider>{children}</CartProvider>
            </ToastProvider>
        </LocaleProvider>
    )
}
