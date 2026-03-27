'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { User as UserType } from '@/types/database.types'
import { useToast } from '@/components/admin/Toast'
import { useRouter } from 'next/navigation'
import { useLocaleMessages } from '@/contexts/LocaleContext'

interface ProfileFormProps {
    user: UserType
    onSaved?: () => void
}

export default function ProfileForm({ user, onSaved }: ProfileFormProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const { messages } = useLocaleMessages()

    const [formData, setFormData] = useState({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        company_name: user.company_name || '',
        nip_number: user.nip_number || '',
    })

    const supabase = createClient()
    const { addToast } = useToast()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            // Update user profile in database
            const { error: dbError } = await supabase
                .from('users')
                .update({
                    first_name: formData.first_name || null,
                    last_name: formData.last_name || null,
                    phone: formData.phone || null,
                    company_name: formData.company_name || null,
                    nip_number: formData.nip_number || null,
                })
                .eq('id', user.id)

            if (dbError) {
                throw new Error(`Failed to save profile: ${dbError.message}`)
            }

            // Update auth metadata in the background (fire and forget - non-blocking)
            const fullName = `${formData.first_name} ${formData.last_name}`.trim()
            setTimeout(() => {
                supabase.auth.updateUser({
                    data: {
                        first_name: formData.first_name || null,
                        last_name: formData.last_name || null,
                        full_name: fullName || null,
                    },
                }).catch((authError) => {
                    console.warn('Auth metadata update failed:', authError)
                })
            }, 0)

            addToast(messages.profile.profileUpdated, 'success')
            setIsEditing(false)

            // Call optional callback
            if (onSaved) {
                onSaved()
            }

            // Force a full page reload to update all components with fresh data
            setTimeout(() => {
                window.location.reload()
            }, 500)

        } catch (err: any) {
            console.error('Profile update error:', err)
            addToast(err.message || messages.common.error, 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="bg-white rounded-2xl shadow-sm p-6 md:p-7 transition-all duration-300">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">{messages.profile.personalInfo}</h2>
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-4 py-2 text-sm font-medium text-white bg-[#163579] rounded-md shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:bg-[#102a63] transition-all duration-200"
                        >
                            {messages.profile.editProfile}
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6 transition-opacity duration-200">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-2">
                                    {messages.profile.firstName}
                                </label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#163579]/20 focus:border-[#163579] transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-2">
                                    {messages.profile.lastName}
                                </label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#163579]/20 focus:border-[#163579] transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-2">
                                {messages.profile.email}
                            </label>
                            <input
                                type="email"
                                value={user.email || ''}
                                disabled
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-1">{messages.profile.emailNote}</p>
                        </div>

                        <div>
                            <label className="block text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-2">
                                {messages.profile.phone}
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#163579]/20 focus:border-[#163579] transition-colors"
                            />
                        </div>

                        {user.role === 'b2b_customer' && (
                            <>
                                <div>
                                    <label className="block text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-2">
                                        {messages.profile.company}
                                    </label>
                                    <input
                                        type="text"
                                        name="company_name"
                                        value={formData.company_name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#163579]/20 focus:border-[#163579] transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-[0.08em] font-semibold text-gray-500 mb-2">
                                        {messages.profile.nip}
                                    </label>
                                    <input
                                        type="text"
                                        name="nip_number"
                                        value={formData.nip_number}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#163579]/20 focus:border-[#163579] transition-colors"
                                    />
                                </div>
                            </>
                        )}

                        <div className="flex gap-4 pt-4 border-t border-gray-200">
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-[#163579] text-white rounded-md shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:bg-[#102a63] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? messages.profileForm.saving : messages.profile.saveChanges}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditing(false)
                                    setFormData({
                                        first_name: user.first_name || '',
                                        last_name: user.last_name || '',
                                        phone: user.phone || '',
                                        company_name: user.company_name || '',
                                        nip_number: user.nip_number || '',
                                    })
                                }}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                {messages.profile.cancel}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5 transition-opacity duration-200">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs uppercase tracking-[0.08em] text-gray-500 font-semibold mb-1.5">{messages.profile.firstName}</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {formData.first_name || '—'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.08em] text-gray-500 font-semibold mb-1.5">{messages.profile.lastName}</p>
                                <p className="text-lg font-semibold text-gray-900">
                                    {formData.last_name || '—'}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-[0.08em] text-gray-500 font-semibold mb-1.5">{messages.profile.email}</p>
                            <p className="text-lg font-semibold text-gray-900">{user.email || '—'}</p>
                        </div>

                        <div>
                            <p className="text-xs uppercase tracking-[0.08em] text-gray-500 font-semibold mb-1.5">{messages.profile.phone}</p>
                            <p className="text-lg font-semibold text-gray-900">
                                {formData.phone || '—'}
                            </p>
                        </div>

                        {user.role === 'b2b_customer' && (
                            <>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.08em] text-gray-500 font-semibold mb-1.5">{messages.profile.company}</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {formData.company_name || '—'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs uppercase tracking-[0.08em] text-gray-500 font-semibold mb-1.5">{messages.profile.nip}</p>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {formData.nip_number || '—'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    )
}
