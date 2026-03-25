'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface PriceDisplayProps {
    price_retail: number
    price_wholesale: number
    variant?: 'default' | 'featured'
}

type UserRole = 'admin' | 'b2c_customer' | 'b2b_customer' | null

export default function PriceDisplay({ price_retail, price_wholesale, variant = 'default' }: PriceDisplayProps) {
    const [userRole, setUserRole] = useState<UserRole>(null)
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()
    const isFeatured = variant === 'featured'

    useEffect(() => {
        async function fetchUserRole() {
            try {
                // Get current user session
                const { data: { user } } = await supabase.auth.getUser()

                if (!user) {
                    // Guest user - treat as B2C customer
                    setUserRole(null)
                    setIsLoading(false)
                    return
                }

                // Fetch user role from users table
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', user.id)
                    .maybeSingle()

                if (error) {
                    console.error('Error fetching user role:', error)
                    console.error('Error details:', JSON.stringify(error))
                    setUserRole('b2c_customer') // Default to B2C on error
                } else if (!userData) {
                    // User profile doesn't exist yet - default to B2C
                    console.warn('User profile not found, defaulting to B2C customer')
                    setUserRole('b2c_customer')
                } else {
                    setUserRole(userData.role || 'b2c_customer')
                }
            } catch (error) {
                console.error('Error in fetchUserRole:', error)
                setUserRole('b2c_customer')
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserRole()
    }, [supabase])

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('en-US', {
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
                    <span className={`${isFeatured ? 'text-[1.12rem] leading-tight font-bold text-slate-900' : 'text-2xl font-bold text-green-600'}`}>
                        {formatPrice(price_wholesale)}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isFeatured ? 'bg-slate-100 text-slate-700' : 'bg-green-100 text-green-800'}`}>
                        Wholesale Price
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`${isFeatured ? 'text-xs text-slate-500' : 'text-sm text-gray-500'} line-through`}>
                        {formatPrice(price_retail)}
                    </span>
                    <span className={`${isFeatured ? 'text-xs text-slate-500' : 'text-xs text-gray-400'}`}>Retail</span>
                </div>
                <div className={`${isFeatured ? 'text-xs text-slate-600 font-medium' : 'text-xs text-green-600 font-medium'}`}>
                    You save {formatPrice(price_retail - price_wholesale)}
                </div>
            </div>
        )
    }

    // B2C Customer / Guest View - Show retail price only
    return (
        <div className="flex flex-col gap-1">
            <span className={isFeatured ? 'text-[0.8rem] text-slate-500' : 'text-sm text-gray-600'}>Price</span>
            <span className={isFeatured ? 'text-[1.12rem] leading-tight font-bold text-slate-900' : 'text-2xl font-bold text-gray-900'}>
                {formatPrice(price_retail)}
            </span>
        </div>
    )
}
