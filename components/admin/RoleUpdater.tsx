'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface RoleUpdaterProps {
    userId: string
    currentRole: 'b2c_customer' | 'b2b_customer' | 'admin'
}

export default function RoleUpdater({ userId, currentRole }: RoleUpdaterProps) {
    const router = useRouter()
    const supabase = createClient()
    const [role, setRole] = useState(currentRole)
    const [isUpdating, setIsUpdating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleRoleChange = async (newRole: 'b2c_customer' | 'b2b_customer' | 'admin') => {
        if (newRole === role) return

        setIsUpdating(true)
        setError(null)
        setSuccess(false)

        try {
            const { error: updateError } = await supabase
                .from('users')
                .update({ role: newRole })
                .eq('id', userId)

            if (updateError) throw updateError

            setRole(newRole)
            setSuccess(true)

            // Refresh the page data
            router.refresh()

            // Clear success message after 2 seconds
            setTimeout(() => setSuccess(false), 2000)
        } catch (err: any) {
            console.error('Error updating role:', err)
            setError(err.message || 'Failed to update role')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <button
                    onClick={() => handleRoleChange('b2c_customer')}
                    disabled={isUpdating || role === 'b2c_customer'}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${role === 'b2c_customer'
                            ? 'bg-blue-600 text-white cursor-default'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        } disabled:opacity-50`}
                >
                    B2C
                </button>
                <button
                    onClick={() => handleRoleChange('b2b_customer')}
                    disabled={isUpdating || role === 'b2b_customer'}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${role === 'b2b_customer'
                            ? 'bg-purple-600 text-white cursor-default'
                            : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                        } disabled:opacity-50`}
                >
                    B2B
                </button>
                <button
                    onClick={() => handleRoleChange('admin')}
                    disabled={isUpdating || role === 'admin'}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${role === 'admin'
                            ? 'bg-green-600 text-white cursor-default'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        } disabled:opacity-50`}
                >
                    Admin
                </button>
            </div>

            {isUpdating && (
                <p className="text-xs text-gray-600">Updating role...</p>
            )}

            {success && (
                <p className="text-xs text-green-600 font-medium">✓ Role updated successfully</p>
            )}

            {error && (
                <p className="text-xs text-red-600">{error}</p>
            )}

            <p className="text-xs text-gray-500">
                Click to change the user&apos;s role
            </p>
        </div>
    )
}
