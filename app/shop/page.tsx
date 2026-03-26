import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'
import ShopFilters from '@/components/ShopFilters'
import Link from 'next/link'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import { getLocalizedCategoryName } from '@/utils/productLocalization'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

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
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const shopCopy = MESSAGES[locale].shop as typeof enMessages.shop
    const navCopy = MESSAGES[locale].nav as typeof enMessages.nav

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

    const getCategoryLabel = (slug: string, name: string) => {
        if (slug === 'kitchenware') {
            return navCopy.household
        }

        if (slug === 'power-tools') {
            return navCopy.tools
        }

        return getLocalizedCategoryName(name, slug, locale)
    }

    const localizedCategories = (categories || []).map((category) => ({
        ...category,
        name: getCategoryLabel(category.slug, category.name),
    }))

    const selectedCategory = (categories || []).find((category) => category.slug === params.category)
    const dynamicHeading = selectedCategory
        ? getCategoryLabel(selectedCategory.slug, selectedCategory.name)
        : shopCopy.title

    const buildShopHref = (nextCategory?: string) => {
        const nextParams = new URLSearchParams()

        if (params.search) nextParams.set('search', params.search)
        if (nextCategory) nextParams.set('category', nextCategory)
        if (params.minPrice) nextParams.set('minPrice', params.minPrice)
        if (params.maxPrice) nextParams.set('maxPrice', params.maxPrice)
        if (params.inStock) nextParams.set('inStock', params.inStock)
        if (params.sort) nextParams.set('sort', params.sort)

        const queryString = nextParams.toString()
        return queryString ? `/shop?${queryString}` : '/shop'
    }

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            <div className="mx-auto max-w-[1520px] px-4 pb-14 pt-28 sm:px-6 lg:px-10 lg:pt-32">
                <div className="grid gap-10 lg:grid-cols-[minmax(220px,24%)_1fr] lg:gap-14">
                    <aside className="self-start border-b border-slate-200 pb-6 lg:sticky lg:top-28 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                        <p className="mb-6 text-[0.67rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
                            {shopCopy.categories}
                        </p>

                        <nav className="divide-y divide-slate-200 border-y border-slate-200" aria-label={shopCopy.categories}>
                            <Link
                                href={buildShopHref()}
                                className={`flex items-center justify-between rounded-lg px-3 py-4 text-[1.03rem] transition-colors ${!params.category
                                    ? 'bg-slate-100 font-semibold text-slate-900'
                                    : 'font-medium text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                <span>{shopCopy.allProducts}</span>
                                {!params.category && <span aria-hidden="true">&rarr;</span>}
                            </Link>

                            {localizedCategories.map((category) => {
                                const isActive = params.category === category.slug

                                return (
                                    <Link
                                        key={category.id}
                                        href={buildShopHref(category.slug)}
                                        className={`flex items-center justify-between rounded-lg px-3 py-4 text-[1.03rem] transition-colors ${isActive
                                            ? 'bg-slate-100 font-semibold text-slate-900'
                                            : 'font-medium text-slate-400 hover:text-slate-700'
                                            }`}
                                    >
                                        <span>{category.name}</span>
                                        {isActive && <span aria-hidden="true">&rarr;</span>}
                                    </Link>
                                )
                            })}
                        </nav>
                    </aside>

                    <section>
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold leading-[0.95] text-slate-950 sm:text-5xl lg:text-[3.55rem]">
                                {dynamicHeading}
                            </h1>
                            <p className="mt-4 max-w-3xl text-[1.02rem] text-slate-600">
                                {shopCopy.description}
                            </p>
                        </div>

                        <div className="mb-8">
                            <div className="flex h-12 items-center rounded-full border border-slate-200 bg-white px-2.5 shadow-[0_6px_24px_rgba(15,23,42,0.06)] transition-all duration-200 focus-within:border-[#163579] focus-within:shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
                                <form method="GET" action="/shop" className="flex-1">
                                    <input type="hidden" name="category" value={params.category || ''} />
                                    <input type="hidden" name="minPrice" value={params.minPrice || ''} />
                                    <input type="hidden" name="maxPrice" value={params.maxPrice || ''} />
                                    <input type="hidden" name="inStock" value={params.inStock || ''} />
                                    <input type="hidden" name="sort" value={params.sort || ''} />

                                    <div className="relative">
                                        <svg
                                            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <input
                                            type="text"
                                            id="search"
                                            name="search"
                                            defaultValue={params.search || ''}
                                            placeholder={shopCopy.searchPlaceholder}
                                            className="h-10 w-full rounded-full bg-transparent pl-12 pr-4 text-[1rem] text-slate-900 outline-none placeholder:text-slate-400"
                                        />
                                    </div>
                                </form>

                                <div className="mx-2 h-6 w-px bg-slate-200" aria-hidden="true" />
                                <ShopFilters categories={localizedCategories} activeFiltersCount={activeFiltersCount} />
                            </div>
                        </div>

                        <div className="mb-6 flex items-center justify-between">
                            <p className="text-slate-600">
                                {products && products.length > 0 ? (
                                    <span className="font-semibold text-slate-900">{products.length}</span>
                                ) : (
                                    <span>{shopCopy.none}</span>
                                )} {shopCopy.productsFoundLabel}
                            </p>
                        </div>

                        {products && products.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {products.map((product, index) => (
                                    <div
                                        key={product.id}
                                        className="shop-card-reveal [&_.product-card-image-wrap-featured]:h-[20.8rem] lg:[&_.product-card-image-wrap-featured]:h-[22.2rem]"
                                        style={{ animationDelay: `${index * 70}ms` }}
                                    >
                                        <ProductCard product={product} variant="featured" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm">
                                <svg className="mx-auto mb-4 h-20 w-20 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <h3 className="mb-2 text-xl font-semibold text-slate-900">{shopCopy.noProducts}</h3>
                                <p className="mb-6 text-slate-600">
                                    {shopCopy.noProductsHint}
                                </p>
                                <Link
                                    href="/shop"
                                    className="inline-flex items-center rounded-xl bg-[#163579] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#122d67]"
                                >
                                    {shopCopy.clearFilters}
                                </Link>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    )
}
