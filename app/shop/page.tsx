import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'
import ShopFilters from '@/components/ShopFilters'
import Link from 'next/link'

interface SearchParams {
    search?: string
    category?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sort?: string
}

export default async function ShopPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const supabase = await createClient()

    // Fetch all categories for filter
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')

    // Build query with filters
    let query = supabase
        .from('products')
        .select(`
            *,
            category:categories(*)
        `)

    // Apply search filter
    if (params.search) {
        query = query.or(`title.ilike.%${params.search}%,brand.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
    }

    // Apply category filter
    if (params.category) {
        const category = categories?.find(c => c.slug === params.category)
        if (category) {
            query = query.eq('category_id', category.id)
        }
    }

    // Apply price range filter
    if (params.minPrice) {
        query = query.gte('price_retail', parseFloat(params.minPrice))
    }
    if (params.maxPrice) {
        query = query.lte('price_retail', parseFloat(params.maxPrice))
    }

    // Apply in-stock filter
    if (params.inStock === 'true') {
        query = query.gt('inventory_count', 0)
    }

    // Apply sorting
    switch (params.sort) {
        case 'price-asc':
            query = query.order('price_retail', { ascending: true })
            break
        case 'price-desc':
            query = query.order('price_retail', { ascending: false })
            break
        case 'name-asc':
            query = query.order('title', { ascending: true })
            break
        case 'name-desc':
            query = query.order('title', { ascending: false })
            break
        case 'newest':
        default:
            query = query.order('created_at', { ascending: false })
            break
    }

    const { data: products, error } = await query

    if (error) {
        console.error('Error fetching products:', error)
    }

    const activeFiltersCount = [
        params.search,
        params.category,
        params.minPrice,
        params.maxPrice,
        params.inStock,
        params.sort && params.sort !== 'newest'
    ].filter(Boolean).length

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Shop</h1>
                    <p className="mt-2 text-gray-600">
                        Browse our complete catalog of household products and professional tools
                    </p>
                </div>

                {/* Search + Filters */}
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <form method="GET" action="/shop" className="flex-1">
                        <input type="hidden" name="category" value={params.category || ''} />
                        <input type="hidden" name="minPrice" value={params.minPrice || ''} />
                        <input type="hidden" name="maxPrice" value={params.maxPrice || ''} />
                        <input type="hidden" name="inStock" value={params.inStock || ''} />
                        <input type="hidden" name="sort" value={params.sort || ''} />
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    id="search"
                                    name="search"
                                    defaultValue={params.search || ''}
                                    placeholder="Search by name, brand, or SKU..."
                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pl-11 focus:border-transparent focus:ring-2 focus:ring-green-500"
                                />
                                <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button
                                type="submit"
                                className="rounded-lg bg-green-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-green-700"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    <ShopFilters categories={categories || []} activeFiltersCount={activeFiltersCount} />
                </div>

                {/* Results */}
                <div className="mb-6 flex items-center justify-between">
                    <p className="text-gray-600">
                        {products && products.length > 0 ? (
                            <span className="font-semibold text-gray-900">{products.length}</span>
                        ) : (
                            <span>No</span>
                        )} products found
                    </p>
                </div>

                {/* Products Grid */}
                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm">
                        <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
                        <p className="text-gray-600 mb-6">
                            Try adjusting your filters or search terms
                        </p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                        >
                            Clear Filters
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
