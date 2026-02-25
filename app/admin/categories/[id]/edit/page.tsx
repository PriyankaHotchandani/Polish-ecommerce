'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { validateRequired } from '@/utils/validation'
import Link from 'next/link'
import Modal from '@/components/admin/Modal'

interface Category {
    id: string
    name: string
    slug: string
    parent_id: string | null
}

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = params as any as { id: string }
    const categoryId = resolvedParams.id
    const router = useRouter()
    const supabase = createClient()

    const [category, setCategory] = useState<Category | null>(null)
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [productCount, setProductCount] = useState(0)
    const [showDeleteModal, setShowDeleteModal] = useState(false)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent_id: '',
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    useEffect(() => {
        async function loadData() {
            try {
                // Load the category being edited
                const { data: categoryData, error: categoryError } = await supabase
                    .from('categories')
                    .select('*')
                    .eq('id', categoryId)
                    .single()

                if (categoryError) throw categoryError
                if (!categoryData) throw new Error('Category not found')

                setCategory(categoryData)
                setFormData({
                    name: categoryData.name,
                    slug: categoryData.slug,
                    parent_id: categoryData.parent_id || '',
                })

                // Load all other categories (for parent selection)
                const { data: categoriesData } = await supabase
                    .from('categories')
                    .select('id, name, slug, parent_id')
                    .neq('id', categoryId) // Exclude current category
                    .order('name')

                if (categoriesData) setCategories(categoriesData)

                // Count products in this category
                const { count } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('category_id', categoryId)

                setProductCount(count || 0)

            } catch (err: any) {
                console.error('Error loading category:', err)
                setError(err.message || 'Failed to load category')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [categoryId, supabase])

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        const nameError = validateRequired(formData.name, 'Name')
        if (nameError) newErrors.name = nameError

        const slugError = validateRequired(formData.slug, 'Slug')
        if (slugError) newErrors.slug = slugError

        // Prevent self-parenting
        if (formData.parent_id === categoryId) {
            newErrors.parent_id = 'A category cannot be its own parent'
        }

        // Prevent circular reference (if parent is a child of this category)
        if (formData.parent_id) {
            const isCircular = checkCircularReference(formData.parent_id)
            if (isCircular) {
                newErrors.parent_id = 'Cannot create circular category reference'
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const checkCircularReference = (parentId: string): boolean => {
        // Check if the selected parent is actually a child of the current category
        const children = categories.filter(cat => cat.parent_id === categoryId)
        if (children.some(child => child.id === parentId)) {
            return true
        }
        // Check recursively for deeper nesting
        for (const child of children) {
            const nestedChildren = categories.filter(cat => cat.parent_id === child.id)
            if (nestedChildren.some(nc => nc.id === parentId)) {
                return true
            }
        }
        return false
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            setError('Please fix the errors above')
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const { error: updateError } = await supabase
                .from('categories')
                .update({
                    name: formData.name,
                    slug: formData.slug,
                    parent_id: formData.parent_id || null,
                })
                .eq('id', categoryId)

            if (updateError) throw updateError

            router.push('/admin/categories')
        } catch (err: any) {
            console.error('Error updating category:', err)
            setError(err.message || 'Failed to update category')
            setSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (productCount > 0) {
            setError(`Cannot delete category with ${productCount} products. Please reassign products first.`)
            setShowDeleteModal(false)
            return
        }

        setSubmitting(true)
        setError(null)

        try {
            const { error: deleteError } = await supabase
                .from('categories')
                .delete()
                .eq('id', categoryId)

            if (deleteError) throw deleteError

            router.push('/admin/categories')
        } catch (err: any) {
            console.error('Error deleting category:', err)
            setError(err.message || 'Failed to delete category')
            setSubmitting(false)
            setShowDeleteModal(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
        )
    }

    if (!category) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 text-lg">Category not found</p>
                <Link
                    href="/admin/categories"
                    className="text-green-600 hover:text-green-800 mt-4 inline-block"
                >
                    ← Back to Categories
                </Link>
            </div>
        )
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
                <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
                <p className="text-gray-600 mt-2">Update category information</p>
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
                            onChange={(e) => handleChange('slug', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm ${errors.slug ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="kitchen-appliances"
                        />
                        {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                        <p className="mt-1 text-xs text-yellow-600">⚠️ Changing the slug may break existing links</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Parent Category (Optional)
                        </label>
                        <select
                            value={formData.parent_id}
                            onChange={(e) => handleChange('parent_id', e.target.value)}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.parent_id ? 'border-red-500' : 'border-gray-300'
                                }`}
                        >
                            <option value="">None (Root Category)</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {errors.parent_id && <p className="mt-1 text-sm text-red-600">{errors.parent_id}</p>}
                    </div>

                    {/* Product Count Info */}
                    {productCount > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                ℹ️ This category contains <strong>{productCount}</strong> product{productCount !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                        <div className="flex items-center gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Updating...
                                    </>
                                ) : 'Update Category'}
                            </button>

                            <Link
                                href="/admin/categories"
                                className="px-6 py-3 text-gray-600 hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={submitting}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
                        >
                            Delete Category
                        </button>
                    </div>
                </div>
            </form>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Category"
            >
                <div className="space-y-4">
                    <p className="text-gray-700">
                        Are you sure you want to delete <strong>&quot;{category.name}&quot;</strong>?
                    </p>
                    {productCount > 0 ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">
                                ⚠️ This category contains <strong>{productCount}</strong> product{productCount !== 1 ? 's' : ''}.
                                You must reassign these products to another category before deleting.
                            </p>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">This action cannot be undone.</p>
                    )}
                    <div className="flex gap-3 justify-end pt-4">
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            className="px-4 py-2 text-gray-600 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={productCount > 0 || submitting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Deleting...' : 'Delete Category'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
