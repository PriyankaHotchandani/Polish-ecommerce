'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { generateSlug } from '@/utils/generateSlug'
import { validateSKU, validatePrice, validateInventory, validateRequired } from '@/utils/validation'
import ImageUpload from '@/components/admin/ImageUpload'
import Link from 'next/link'

interface Category {
    id: string
    name: string
}

export default function NewProductPage() {
    const router = useRouter()
    const supabase = createClient()

    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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

    // Auto-generate slug from title
    useEffect(() => {
        if (formData.title && !slugManuallyEdited) {
            const autoSlug = formData.title
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '')

            setFormData(prev => ({ ...prev, slug: autoSlug }))
        }
    }, [formData.title, slugManuallyEdited])

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
    }

    const handleSlugChange = (value: string) => {
        setSlugManuallyEdited(true)
        handleChange('slug', value)
    }

    const handleSpecificationChange = (index: number, field: 'key' | 'value', value: string) => {
        const newSpecs = [...formData.specifications]
        newSpecs[index][field] = value
        setFormData(prev => ({ ...prev, specifications: newSpecs }))
    }

    const addSpecification = () => {
        setFormData(prev => ({
            ...prev,
            specifications: [...prev.specifications, { key: '', value: '' }]
        }))
    }

    const removeSpecification = (index: number) => {
        setFormData(prev => ({
            ...prev,
            specifications: prev.specifications.filter((_, i) => i !== index)
        }))
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        const skuError = validateSKU(formData.sku)
        if (skuError) newErrors.sku = skuError

        const titleError = validateRequired(formData.title, 'Title')
        if (titleError) newErrors.title = titleError

        const slugError = validateRequired(formData.slug, 'Slug')
        if (slugError) newErrors.slug = slugError

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

        setLoading(true)
        setError(null)

        try {
            // Generate unique slug if needed
            const finalSlug = await generateSlug(formData.slug, 'products')

            // Filter out empty specifications
            const specs = formData.specifications
                .filter(spec => spec.key && spec.value)
                .reduce((acc, spec) => {
                    acc[spec.key] = spec.value
                    return acc
                }, {} as Record<string, string>)

            // Create product
            const { data: product, error: insertError } = await supabase
                .from('products')
                .insert({
                    sku: formData.sku.toUpperCase(),
                    title: formData.title,
                    slug: finalSlug,
                    brand: formData.brand || null,
                    description: formData.description || null,
                    price_retail: parseFloat(formData.price_retail),
                    price_wholesale: parseFloat(formData.price_wholesale),
                    inventory_count: parseInt(formData.inventory_count),
                    category_id: formData.category_id,
                    specifications: Object.keys(specs).length > 0 ? specs : null,
                    image_urls: formData.image_urls.length > 0 ? formData.image_urls : null,
                })
                .select()
                .single()

            if (insertError) throw insertError

            // Success - redirect to products list
            router.push('/admin/products')
        } catch (err: any) {
            console.error('Error creating product:', err)
            setError(err.message || 'Failed to create product')
            setLoading(false)
        }
    }

    return (
        <div>
            <div className="mb-8">
                <Link
                    href="/admin/products"
                    className="text-green-600 hover:text-green-800 text-sm font-medium mb-2 inline-block"
                >
                    ← Back to Products
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
                <p className="text-gray-600 mt-2">Fill in the details to create a new product</p>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            SKU *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.sku}
                                            onChange={(e) => handleChange('sku', e.target.value)}
                                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.sku ? 'border-red-500' : 'border-gray-300'
                                                }`}
                                            placeholder="PROD-001"
                                        />
                                        {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Brand
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.brand}
                                            onChange={(e) => handleChange('brand', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                            placeholder="Brand name"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Product Title *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleChange('title', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.title ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="Product name"
                                    />
                                    {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
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
                                        placeholder="product-slug"
                                    />
                                    {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug}</p>}
                                    <p className="mt-1 text-xs text-gray-500">Auto-generated from title, but you can edit it</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleChange('description', e.target.value)}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        placeholder="Product description..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Pricing & Inventory */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Pricing & Inventory</h2>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Retail Price (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price_retail}
                                        onChange={(e) => handleChange('price_retail', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.price_retail ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {errors.price_retail && <p className="mt-1 text-sm text-red-600">{errors.price_retail}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Wholesale Price (PLN) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price_wholesale}
                                        onChange={(e) => handleChange('price_wholesale', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.price_wholesale ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {errors.price_wholesale && <p className="mt-1 text-sm text-red-600">{errors.price_wholesale}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Stock Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.inventory_count}
                                        onChange={(e) => handleChange('inventory_count', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.inventory_count ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0"
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
                                    className="text-sm text-green-600 hover:text-green-800 font-medium"
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
                                            placeholder="Key (e.g., Material)"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                        />
                                        <input
                                            type="text"
                                            value={spec.value}
                                            onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                                            placeholder="Value (e.g., Stainless Steel)"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
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
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Category</h2>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Category *
                                </label>
                                <select
                                    value={formData.category_id}
                                    onChange={(e) => handleChange('category_id', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.category_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                >
                                    <option value="">Choose a category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Creating...
                                    </>
                                ) : 'Create Product'}
                            </button>

                            <Link
                                href="/admin/products"
                                className="block w-full text-center text-gray-600 py-2 mt-3 hover:text-gray-900"
                            >
                                Cancel
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
