'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

interface PriceDisplayProps {
    price_retail: number
    price_wholesale: number
    variant?: 'default' | 'featured'
}

type UserRole = 'admin' | 'b2c_customer' | 'b2b_customer' | null
type UserRoleRow = { role: Exclude<UserRole, null> }

let cachedUserRole: UserRole | undefined
let cachedUserRolePromise: Promise<UserRole> | null = null

async function fetchUserRoleOnce(supabase: SupabaseClient<Database>): Promise<UserRole> {
    if (cachedUserRole !== undefined) {
        return cachedUserRole
    }

    if (cachedUserRolePromise) {
        return cachedUserRolePromise
    }

    cachedUserRolePromise = (async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                cachedUserRole = null
                return null
            }

            const { data: userData, error } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .maybeSingle<UserRoleRow>()

            if (error) {
                cachedUserRole = 'b2c_customer'
                return 'b2c_customer'
            }

            const resolvedRole: UserRole = userData?.role ?? 'b2c_customer'
            cachedUserRole = resolvedRole
            return resolvedRole
        } catch {
            cachedUserRole = 'b2c_customer'
            return 'b2c_customer'
        } finally {
            cachedUserRolePromise = null
        }
    })()

    return cachedUserRolePromise
}

export default function PriceDisplay({ price_retail, price_wholesale, variant = 'default' }: PriceDisplayProps) {
    const [userRole, setUserRole] = useState<UserRole>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = useMemo(() => createClient(), [])
    const isFeatured = variant === 'featured'
    const { messages, locale } = useLocaleMessages()

    useEffect(() => {
        let isMounted = true

        async function fetchUserRole() {
            try {
                const role = await fetchUserRoleOnce(supabase)
                if (isMounted) {
                    setUserRole(role)
                }
            } catch {
                if (isMounted) {
                    setUserRole('b2c_customer')
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false)
                }
            }
        }

        fetchUserRole()

        return () => {
            isMounted = false
        }
    }, [supabase])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(locale === 'pl' ? 'pl-PL' : 'en-US', {
            style: 'currency',
            currency: 'PLN',
            currencyDisplay: 'code',
            minimumFractionDigits: 2,
        }).format(price)
    }

    if (isLoading) {
        return (
            <div className="animate-pulse">
                <div className={`${isFeatured ? 'h-6 w-28' : 'h-8 w-24'} bg-gray-200 rounded`}></div>
            </div>
        )
    }

    // B2B Customer View - Show wholesale price prominently
    if (userRole === 'b2b_customer' || userRole === 'admin') {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <span className={`${isFeatured ? 'text-[1.12rem] leading-tight font-bold text-slate-900' : 'text-4xl leading-tight font-extrabold text-slate-950'}`}>
                        {formatPrice(price_wholesale)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${isFeatured ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-white text-slate-800 border-slate-800'}`}>
                        {messages.product.wholesalePrice}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`${isFeatured ? 'text-xs text-slate-500' : 'text-sm text-gray-500'} line-through`}>
                        {formatPrice(price_retail)}
                    </span>
                    <span className={`${isFeatured ? 'text-xs text-slate-500' : 'text-xs text-gray-400'}`}>{messages.product.retail}</span>
                </div>
                <div className={`${isFeatured ? 'text-xs text-slate-600 font-medium' : 'text-xs text-slate-600 font-medium'}`}>
                    {messages.product.youSave} {formatPrice(price_retail - price_wholesale)}
                </div>
            </div>
        )
    }

    // B2C Customer / Guest View - Show retail price only
    return (
        <div className="flex flex-col gap-1">
            <span className={isFeatured ? 'text-[0.8rem] text-slate-500' : 'text-sm text-gray-600'}>{messages.product.price}</span>
            <span className={isFeatured ? 'text-[1.12rem] leading-tight font-bold text-slate-900' : 'text-2xl font-bold text-gray-900'}>
                {formatPrice(price_retail)}
            </span>
        </div>
    )
}
