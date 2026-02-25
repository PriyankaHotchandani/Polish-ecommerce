import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

interface SearchParams {
    search?: string
    category?: string
}

export default async function AdminProductsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const supabase = await createClient()

    // Build query
    let query = supabase
        .from('products')
        .select(`
            *,
            category:categories(name)
        `)
        .order('created_at', { ascending: false })

    // Apply filters
    if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,sku.ilike.%${params.search}%,brand.ilike.%${params.search}%`)
    }

    if (params.category) {
        query = query.eq('category_id', params.category)
    }

    const { data: products, error } = await query
    const { data: categories } = await supabase.from('categories').select('id, name').order('name')

    if (error) {
        console.error('Error fetching products:', error)
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                    <p className="text-gray-600 mt-2">Manage your product catalog</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                    + Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <form method="GET" className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                            Search
                        </label>
                        <input
                            type="text"
                            name="search"
                            id="search"
                            defaultValue={params.search || ''}
                            placeholder="Search by title, SKU, or brand..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div className="sm:w-64">
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            name="category"
                            id="category"
                            defaultValue={params.category || ''}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                            <option value="">All Categories</option>
                            {categories?.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="sm:self-end">
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </form>
            </div>

            {/* Products Grid/Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {!products || products.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 text-lg">No products found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {params.search || params.category ? 'Try adjusting your filters' : 'Create your first product to get started'}
                        </p>
                        <Link
                            href="/admin/products/new"
                            className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Add First Product
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pricing</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {products.map((product: any) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                                                {product.image_urls?.[0] ? (
                                                    <img
                                                        src={product.image_urls[0]}
                                                        alt={product.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                                                        No image
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{product.title}</div>
                                            {product.brand && <div className="text-sm text-gray-500">{product.brand}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                                            {product.sku}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {product.category?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="text-gray-900 font-semibold">
                                                B2C: {Number(product.price_retail).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'PLN',
                                                    currencyDisplay: 'code'
                                                }).replace('PLN', 'PLN ')}
                                            </div>
                                            <div className="text-gray-600 text-xs">
                                                B2B: {Number(product.price_wholesale).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'PLN',
                                                    currencyDisplay: 'code'
                                                }).replace('PLN', 'PLN ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${product.inventory_count === 0
                                                    ? 'bg-red-100 text-red-800'
                                                    : product.inventory_count < 10
                                                        ? 'bg-yellow-100 text-yellow-800'
                                                        : 'bg-green-100 text-green-800'
                                                }`}>
                                                {product.inventory_count} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                            <Link
                                                href={`/admin/products/${product.id}/edit`}
                                                className="text-green-600 hover:text-green-900 font-medium"
                                            >
                                                Edit
                                            </Link>
                                            <Link
                                                href={`/product/${product.slug}`}
                                                target="_blank"
                                                className="text-blue-600 hover:text-blue-900 font-medium"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            {products && products.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Products</p>
                            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Low Stock</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {products.filter(p => p.inventory_count < 10 && p.inventory_count > 0).length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">
                                {products.filter(p => p.inventory_count === 0).length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg. Price (B2C)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(products.reduce((sum, p) => sum + Number(p.price_retail), 0) / products.length).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'PLN',
                                    currencyDisplay: 'code'
                                }).replace('PLN', 'PLN ')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
