import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import ProductsFilterBar from '@/components/admin/ProductsFilterBar'
import ProductSkuCopy from '@/components/admin/ProductSkuCopy'
import ProductActionsMenu from '@/components/admin/ProductActionsMenu'

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

    const safeProducts = Array.isArray(products) ? products : []

    const getStockBadgeClass = (inventoryCount: number) => {
        if (inventoryCount === 0) return 'bg-red-100 text-red-700 border border-red-200 font-semibold'
        if (inventoryCount < 20) return 'bg-amber-100 text-amber-800 border border-amber-200'
        return 'bg-slate-100 text-slate-700 border border-slate-200'
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
                    className="inline-flex h-10 items-center rounded-md border border-[#163579] bg-[#163579] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#122d67]"
                >
                    + Add Product
                </Link>
            </div>

            {/* Filters */}
            <ProductsFilterBar
                initialSearch={params.search || ''}
                initialCategory={params.category || ''}
                categories={categories || []}
            />

            {/* Products Grid/Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {safeProducts.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 text-lg">No products found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            {params.search || params.category ? 'Try adjusting your filters' : 'Create your first product to get started'}
                        </p>
                        <Link
                            href="/admin/products/new"
                            className="inline-block mt-4 px-6 py-2 rounded-lg bg-[#163579] text-white font-semibold hover:bg-[#122d67] transition-colors"
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
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {safeProducts.map((product: any) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="w-16 h-16 rounded-md border border-gray-100 bg-gray-50 p-1 overflow-hidden">
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ProductSkuCopy sku={product.sku} />
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
                                            <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${getStockBadgeClass(Number(product.inventory_count || 0))}`}>
                                                {product.inventory_count} units
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <ProductActionsMenu productId={product.id} productSlug={product.slug} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            {safeProducts.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Products</p>
                            <p className="text-2xl font-bold text-gray-900">{safeProducts.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Low Stock</p>
                            <p className="text-2xl font-bold text-yellow-600">
                                {safeProducts.filter(p => p.inventory_count < 20 && p.inventory_count > 0).length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">
                                {safeProducts.filter(p => p.inventory_count === 0).length}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg. Price (B2C)</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(safeProducts.reduce((sum, p) => sum + Number(p.price_retail), 0) / safeProducts.length).toLocaleString('en-US', {
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
