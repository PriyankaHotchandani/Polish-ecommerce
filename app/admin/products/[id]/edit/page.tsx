'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { validateSKU, validatePrice, validateInventory, validateRequired } from '@/utils/validation'
import ImageUpload from '@/components/admin/ImageUpload'
import Link from 'next/link'
import Modal from '@/components/admin/Modal'

interface Category {
    id: string
    name: string
}

export default function EditProductPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const router = useRouter()
    const supabase = createClient()

    const [productId, setProductId] = useState<string>('')
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
    const [error, setError] = useState<string | null>(null)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const [formData, setFormData] = useState({
        sku: '',
        title: '',
        slug: '',
        brand: '',
        description: '',
        price_retail: '',
        price_wholesale: '',
        inventory_count: '',
        category_id: '',
        specifications: [{ key: '', value: '' }],
        image_urls: [] as string[],
    })

    const [errors, setErrors] = useState<Record<string, string>>({})
    const [initialSnapshot, setInitialSnapshot] = useState('')

    useEffect(() => {
        async function init() {
            const { id } = await params
            setProductId(id)

            // Fetch product and categories
            const [productResult, categoriesResult] = await Promise.all([
                supabase.from('products').select('*').eq('id', id).single(),
                supabase.from('categories').select('id, name').order('name')
            ])

            if (productResult.error || !productResult.data) {
                setError('Product not found')
                setLoading(false)
                return
            }

            const product = productResult.data

            // Convert specifications from JSONB to array
            const specs = product.specifications
                ? Object.entries(product.specifications).map(([key, value]) => ({ key, value: String(value) }))
                : [{ key: '', value: '' }]

            const preparedFormData = {
                sku: product.sku,
                title: product.title,
                slug: product.slug,
                brand: product.brand || '',
                description: product.description || '',
                price_retail: String(product.price_retail),
                price_wholesale: String(product.price_wholesale),
                inventory_count: String(product.inventory_count),
                category_id: product.category_id,
                specifications: specs,
                image_urls: product.image_urls || [],
            }

            setFormData(preparedFormData)
            setInitialSnapshot(JSON.stringify(preparedFormData))

            if (categoriesResult.data) {
                setCategories(categoriesResult.data)
            }

            setLoading(false)
        }

        init()
    }, [params, supabase])

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (saveState !== 'idle') {
            setSaveState('idle')
        }
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
        const newSpecs = [...formData.specifications]
        newSpecs[index][field] = value
        setFormData(prev => ({ ...prev, specifications: newSpecs }))
        if (saveState !== 'idle') {
            setSaveState('idle')
        }
    }

    const addSpecification = () => {
        setFormData(prev => ({
            ...prev,
            specifications: [...prev.specifications, { key: '', value: '' }]
        }))
        if (saveState !== 'idle') {
            setSaveState('idle')
        }
    }

    const removeSpecification = (index: number) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index)
        }))
        if (saveState !== 'idle') {
            setSaveState('idle')
        }
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        const skuError = validateSKU(formData.sku)
        if (skuError) newErrors.sku = skuError

        const titleError = validateRequired(formData.title, 'Title')
        if (titleError) newErrors.title = titleError

        const retailError = validatePrice(formData.price_retail)
        if (retailError) newErrors.price_retail = retailError

        const wholesaleError = validatePrice(formData.price_wholesale)
        if (wholesaleError) newErrors.price_wholesale = wholesaleError

        const inventoryError = validateInventory(formData.inventory_count)
        if (inventoryError) newErrors.inventory_count = inventoryError

        if (!formData.category_id) {
            newErrors.category_id = 'Please select a category'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!validate()) {
            setError('Please fix the errors above')
            return
        }

        setSaving(true)
        setSaveState('saving')
        setError(null)

        try {
            const specs = formData.specifications
                .filter(spec => spec.key && spec.value)
                .reduce((acc, spec) => {
                    acc[spec.key] = spec.value
                    return acc
                }, {} as Record<string, string>)

            const normalizedSku = formData.sku.toUpperCase()

            const [{ error: updateError }] = await Promise.all([
                supabase
                    .from('products')
                    .update({
                        sku: normalizedSku,
                        title: formData.title,
                        slug: formData.slug,
                        brand: formData.brand || null,
                        description: formData.description || null,
                        price_retail: parseFloat(formData.price_retail),
                        price_wholesale: parseFloat(formData.price_wholesale),
                        inventory_count: parseInt(formData.inventory_count),
                        category_id: formData.category_id,
                        specifications: Object.keys(specs).length > 0 ? specs : null,
                        image_urls: formData.image_urls.length > 0 ? formData.image_urls : null,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', productId),
                new Promise((resolve) => setTimeout(resolve, 1000)),
            ])

            if (updateError) throw updateError

            const savedFormData = {
                ...formData,
                sku: normalizedSku,
            }

            setFormData(savedFormData)
            setInitialSnapshot(JSON.stringify(savedFormData))
            setSaveState('saved')
            setTimeout(() => setSaveState('idle'), 2000)
            router.refresh()
        } catch (err: any) {
            console.error('Error updating product:', err)
            setError(err.message || 'Failed to update product')
            setSaveState('idle')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        setDeleting(true)

        try {
            const { error: deleteError } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)

            if (deleteError) throw deleteError

            router.push('/admin/products')
        } catch (err: any) {
            console.error('Error deleting product:', err)
            setError(err.message || 'Failed to delete product')
            setDeleting(false)
            setShowDeleteModal(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#163579] mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading product...</p>
                </div>
            </div>
        )
    }

    if (error && !formData.title) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600 text-lg">{error}</p>
                <Link href="/admin/products" className="text-[#163579] hover:text-[#102a63] mt-4 inline-block">
                    ← Back to Products
                </Link>
            </div>
        )
    }

    const hasUnsavedChanges = initialSnapshot !== '' && JSON.stringify(formData) !== initialSnapshot
    const labelClassName = 'mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500'
    const inputClassName = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition focus:border-[#163579] focus:outline-none focus:ring-2 focus:ring-[#163579]/20'

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/products"
                    className="text-[#163579] hover:text-[#102a63] text-sm font-semibold mb-2 inline-block"
                >
                    ← Back to Products
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
                <p className="text-gray-600 mt-2">Update product details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClassName}>
                                            SKU *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.sku}
                                            onChange={(e) => handleChange('sku', e.target.value)}
                                            className={`${inputClassName} ${errors.sku ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                                        />
                                        {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                                    </div>

                                    <div>
                                        <label className={labelClassName}>
                                            Brand
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={(e) => handleChange('brand', e.target.value)}
                                            className={inputClassName}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClassName}>
                                        Product Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className={`${inputClassName} ${errors.title ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
                                </div>

                                <div>
                                    <label className={labelClassName}>
                                        URL Slug
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.slug}
                                            className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 pr-11 font-mono text-sm text-gray-700"
                                            disabled
                                        />
                                        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400" aria-hidden="true">
                                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                                                <rect x="5" y="11" width="14" height="10" rx="2" />
                                                <path d="M8 11V8a4 4 0 1 1 8 0v3" strokeLinecap="round" />
                                            </svg>
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Slug cannot be changed after creation</p>
                                </div>

                                <div>
                                    <label className={labelClassName}>
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={4}
                                        className={inputClassName}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Inventory */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing & Inventory</h2>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClassName}>
                                        Retail Price (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price_retail}
                                        onChange={(e) => handleChange('price_retail', e.target.value)}
                                        className={`${inputClassName} ${errors.price_retail ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                                    />
                                    {errors.price_retail && <p className="mt-1 text-sm text-red-600">{errors.price_retail}</p>}
                                </div>

                                <div>
                                    <label className={labelClassName}>
                                        Wholesale Price (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price_wholesale}
                                        onChange={(e) => handleChange('price_wholesale', e.target.value)}
                                        className={`${inputClassName} ${errors.price_wholesale ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                                    />
                                    {errors.price_wholesale && <p className="mt-1 text-sm text-red-600">{errors.price_wholesale}</p>}
                                </div>

                                <div>
                                    <label className={labelClassName}>
                                        Stock Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.inventory_count}
                                        onChange={(e) => handleChange('inventory_count', e.target.value)}
                                        className={`${inputClassName} ${errors.inventory_count ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                                    />
                                    {errors.inventory_count && <p className="mt-1 text-sm text-red-600">{errors.inventory_count}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Specifications */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-gray-900">Specifications</h2>
                                <button
                                    type="button"
                                    onClick={addSpecification}
                                    className="text-sm text-[#163579] hover:text-[#122d67] font-medium"
                                >
                                    + Add Field
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.specifications.map((spec, index) => (
                                    <div key={index} className="flex gap-3">
                                        <input
                                            type="text"
                                            value={spec.key}
                                            onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                                            placeholder="Key"
                                            className={`flex-1 ${inputClassName}`}
                                        />
                                        <input
                                            type="text"
                                            value={spec.value}
                                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                                            placeholder="Value"
                                            className={`flex-1 ${inputClassName}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeSpecification(index)}
                                            className="px-3 py-2 text-red-600 hover:text-red-800"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Product Images</h2>
                            <ImageUpload
                                value={formData.image_urls}
                                onChange={(urls) => handleChange('image_urls', urls)}
                                maxImages={5}
                            />
                        </div>

                        {/* Danger Zone */}
                        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                            <h2 className="text-lg font-bold text-red-900">Danger Zone</h2>
                            <p className="mt-1 text-sm text-red-700">Deleting this product is permanent and cannot be undone.</p>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="mt-4 inline-flex items-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
                            >
                                Delete Product
                            </button>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-[120px] space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Category</h2>
                                <label className={labelClassName}>
                                    Select Category *
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => handleChange('category_id', e.target.value)}
                                    className={`${inputClassName} ${errors.category_id ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : ''}`}
                                >
                                    <option value="">Choose a category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={saving || !hasUnsavedChanges}
                                className={`w-full rounded-lg py-3 px-6 font-semibold text-white transition-colors flex items-center justify-center ${saveState === 'saved'
                                    ? 'bg-emerald-600'
                                    : 'bg-[#163579] hover:bg-[#122d67]'
                                    } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                            >
                                {saveState === 'saving' ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Saving...
                                    </>
                                ) : saveState === 'saved' ? (
                                    <>
                                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                                            <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Saved!
                                    </>
                                ) : (
                                    <>
                                        Save Changes
                                        {hasUnsavedChanges && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />}
                                    </>
                                )}
                            </button>

                            <Link
                                href="/admin/products"
                                className="block w-full text-center py-1 text-gray-500 hover:text-[#163579]"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>
            </form>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Product"
                footer={
                    <>
                        <button
                            onClick={() => setShowDeleteModal(false)}
                            disabled={deleting}
                            className="px-4 py-2 text-gray-700 hover:text-gray-900"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                        >
                            {deleting ? 'Deleting...' : 'Delete Product'}
                        </button>
                    </>
                }
            >
                <p className="text-gray-700">
                    Are you sure you want to delete <strong>{formData.title}</strong>?
                </p>
                <p className="text-gray-600 text-sm mt-2">
                    This action cannot be undone. The product will be permanently removed from your store.
                </p>
            </Modal>
        </div>
    )
}
