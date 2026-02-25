'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { generateSlug } from '@/utils/generateSlug'
import { validateRequired } from '@/utils/validation'
import Link from 'next/link'

interface Category {
    id: string
    name: string
}

export default function NewCategoryPage() {
    const router = useRouter()
    const supabase = createClient()

    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

    useEffect(() => {
        async function fetchCategories() {
            const { data } = await supabase
                .from('categories')
                .select('id, name')
                .order('name')

            if (data) setCategories(data)
        }
        fetchCategories()
    }, [supabase])

    // Auto-generate slug from name
    useEffect(() => {
        if (formData.name && !slugManuallyEdited) {
            const autoSlug = formData.name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '')

            setFormData(prev => ({ ...prev, slug: autoSlug }))
        }
    }, [formData.name, slugManuallyEdited])

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSlugChange = (value: string) => {
        setSlugManuallyEdited(true)
        handleChange('slug', value)
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        const nameError = validateRequired(formData.name, 'Name')
        if (nameError) newErrors.name = nameError

        const slugError = validateRequired(formData.slug, 'Slug')
        if (slugError) newErrors.slug = slugError

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            setError('Please fix the errors above')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const finalSlug = await generateSlug(formData.slug, 'categories')

            const { error: insertError } = await supabase
                .from('categories')
                .insert({
                    name: formData.name,
                    slug: finalSlug,
                    parent_id: formData.parent_id || null,
                })

            if (insertError) throw insertError

            router.push('/admin/categories')
        } catch (err: any) {
            console.error('Error creating category:', err)
            setError(err.message || 'Failed to create category')
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/categories"
                    className="text-green-600 hover:text-green-800 text-sm font-medium mb-2 inline-block"
                >
                    ← Back to Categories
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Add New Category</h1>
                <p className="text-gray-600 mt-2">Create a new product category</p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="e.g., Kitchen Appliances"
                        />
                        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            URL Slug *
                        </label>
                        <input
                            type="text"
                            value={formData.slug}
                            onChange={(e) => handleSlugChange(e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm ${errors.slug ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="kitchen-appliances"
                        />
                        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                        <p className="mt-1 text-xs text-gray-500">Auto-generated from name, but you can edit it</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parent Category (Optional)
                        </label>
                        <select
                            value={formData.parent_id}
                            onChange={(e) => handleChange('parent_id', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">None (Root Category)</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            Leave empty to create a root category, or select a parent to create a subcategory
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-3 pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : 'Create Category'}
                        </button>

                        <Link
                            href="/admin/categories"
                            className="px-6 py-3 text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    )
}
