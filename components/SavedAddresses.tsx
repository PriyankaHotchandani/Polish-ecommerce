'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { SavedAddress, SavedAddressInsert } from '@/types/database.types'

interface AddressFormData {
    label: string
    address_type: 'shipping' | 'billing' | 'both'
    full_name: string
    company_name: string
    street: string
    city: string
    postal_code: string
    country: string
    phone: string
    is_default: boolean
}

export default function SavedAddresses({ userId }: { userId: string }) {
    const [addresses, setAddresses] = useState<SavedAddress[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState<AddressFormData>({
        label: '',
        address_type: 'both',
        full_name: '',
        company_name: '',
        street: '',
        city: '',
        postal_code: '',
        country: 'Poland',
        phone: '',
        is_default: false,
    })
    const [error, setError] = useState<string | null>(null)
    const supabase = useMemo(() => createClient(), [])

    useEffect(() => {
        loadAddresses()
    }, [userId])

    const loadAddresses = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('saved_addresses')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            setAddresses(data || [])
            setError(null)
        } catch (err) {
            console.error('Error loading addresses:', err)
            setError('Failed to load addresses')
        } finally {
            setLoading(false)
        }
    }, [supabase, userId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSubmitting(true)

        try {
            if (editingId) {
                // Update existing address
                const { error } = await supabase
                    .from('saved_addresses')
                    .update(formData)
                    .eq('id', editingId)

                if (error) throw error
            } else {
                // Insert new address
                const insertData: SavedAddressInsert = {
                    ...formData,
                    user_id: userId,
                    company_name: formData.company_name || null,
                }

                const { error } = await supabase
                    .from('saved_addresses')
                    .insert(insertData)

                if (error) throw error
            }

            // Reset form and reload addresses
            setShowForm(false)
            setEditingId(null)
            resetForm()
            await loadAddresses()
        } catch (err) {
            console.error('Error saving address:', err)
            setError('Failed to save address')
        } finally {
            setSubmitting(false)
        }
    }

    const handleEdit = (address: SavedAddress) => {
        setFormData({
            label: address.label,
            address_type: address.address_type,
            full_name: address.full_name,
            company_name: address.company_name || '',
            street: address.street,
            city: address.city,
            postal_code: address.postal_code,
            country: address.country,
            phone: address.phone,
            is_default: address.is_default,
        })
        setEditingId(address.id)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return

        try {
            const { error } = await supabase
                .from('saved_addresses')
                .delete()
                .eq('id', id)

            if (error) throw error
            await loadAddresses()
        } catch (err) {
            console.error('Error deleting address:', err)
            setError('Failed to delete address')
        }
    }

    const resetForm = () => {
        setFormData({
            label: '',
            address_type: 'both',
            full_name: '',
            company_name: '',
            street: '',
            city: '',
            postal_code: '',
            country: 'Poland',
            phone: '',
            is_default: false,
        })
        setEditingId(null)
        setError(null)
    }

    if (loading) {
        return <div className="text-gray-600">Loading addresses...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        Add New Address
                    </button>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            {/* Address Form */}
            {showForm && (
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingId ? 'Edit Address' : 'New Address'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address Label *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.label}
                                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                    placeholder="e.g., Home, Office, Warehouse"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address Type *
                                </label>
                                <select
                                    required
                                    value={formData.address_type}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            address_type: e.target.value as 'shipping' | 'billing' | 'both',
                                        })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                >
                                    <option value="both">Both (Shipping & Billing)</option>
                                    <option value="shipping">Shipping Only</option>
                                    <option value="billing">Billing Only</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Company Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={formData.company_name}
                                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Street Address *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.street}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    City *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Postal Code *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.postal_code}
                                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Country *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone *
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="is_default"
                                checked={formData.is_default}
                                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <label htmlFor="is_default" className="ml-2 text-sm text-gray-700">
                                Set as default address for this type
                            </label>
                        </div>

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting
                                    ? (editingId ? 'Updating...' : 'Saving...')
                                    : (editingId ? 'Update Address' : 'Save Address')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false)
                                    resetForm()
                                }}
                                disabled={submitting}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Addresses List */}
            <div className="space-y-4">
                {addresses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                        No saved addresses yet. Add one to make checkout faster!
                    </p>
                ) : (
                    addresses.map((address) => (
                        <div
                            key={address.id}
                            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-gray-900">{address.label}</h3>
                                        {address.is_default && (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                Default
                                            </span>
                                        )}
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                            {address.address_type === 'both'
                                                ? 'Shipping & Billing'
                                                : address.address_type === 'shipping'
                                                    ? 'Shipping'
                                                    : 'Billing'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p className="font-medium text-gray-900">{address.full_name}</p>
                                        {address.company_name && <p>{address.company_name}</p>}
                                        <p>{address.street}</p>
                                        <p>
                                            {address.postal_code} {address.city}, {address.country}
                                        </p>
                                        <p>{address.phone}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(address)}
                                        className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(address.id)}
                                        className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
