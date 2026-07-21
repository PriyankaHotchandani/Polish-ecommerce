import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'
import ShopFilters from '@/components/ShopFilters'
import Link from 'next/link'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import { getLocalizedCategoryNameWithTranslations } from '@/utils/productLocalization'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

interface SearchParams {
    search?: string
    category?: string
    group?: string
    brand?: string
    minPrice?: string
    maxPrice?: string
    inStock?: string
    sort?: string
    page?: string
}

const PAGE_SIZE = 24

import { isToolCategory } from '@/utils/categoryGroups'
import { isKnownBrand, DEFAULT_BRAND } from '@/utils/brands'

type LocalizedCategory = {
    id: string
    name: string
    slug: string
    name_translations?: { en?: string | null, pl?: string | null } | null
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
    const currentPage = Math.max(1, Number.parseInt(params.page || '1', 10) || 1)
    const rangeFrom = (currentPage - 1) * PAGE_SIZE
    const rangeTo = rangeFrom + PAGE_SIZE - 1

    // Fetch all categories for filter
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug, name_translations')
        .order('name')

    const isToolCategoryRaw = isToolCategory

    const groupedCategoriesRaw = (categories || []).reduce(
        (groups, category) => {
            if (isToolCategoryRaw(category)) {
                groups.tools.push(category)
            } else {
                groups.household.push(category)
            }

            return groups
        },
        {
            household: [] as Array<{ id: string, name: string, slug: string, name_translations: unknown }>,
            tools: [] as Array<{ id: string, name: string, slug: string, name_translations: unknown }>,
        }
    )

    // Build query with filters
    let query = supabase
        .from('products')
        .select(`
            *,
            category:categories(id,name,slug,name_translations)
        `, { count: 'exact' })

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
    } else if (params.group === 'household' || params.group === 'tools') {
        const groupedIds = groupedCategoriesRaw[params.group].map((category) => category.id)
        if (groupedIds.length > 0) {
            query = query.in('category_id', groupedIds)
        }
    }

    // Apply brand filter. Products with a null/empty brand default to Alpenburg,
    // so the Alpenburg filter must also match those rows.
    const selectedBrand = isKnownBrand(params.brand) ? params.brand : null
    if (selectedBrand === DEFAULT_BRAND) {
        query = query.or('brand.eq.Alpenburg,brand.is.null,brand.eq.')
    } else if (selectedBrand) {
        query = query.eq('brand', selectedBrand)
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

    query = query.range(rangeFrom, rangeTo)

    const { data: products, count: productsCount, error } = await query
    const fetchErrorMessage = error?.message || null
    const normalizedProducts = (products || []).map((product) => ({
        ...product,
        category: Array.isArray(product.category) ? product.category[0] : product.category,
    }))

    const activeFiltersCount = [
        params.search,
        params.category,
        params.group,
        selectedBrand,
        params.minPrice,
        params.maxPrice,
        params.inStock,
        params.sort && params.sort !== 'newest'
    ].filter(Boolean).length

    const getCategoryLabel = (
        slug: string,
        name: string,
        translations?: { en?: string | null, pl?: string | null } | null
    ) => {
        if (slug === 'kitchenware') {
            return navCopy.household
        }

        if (slug === 'power-tools') {
            return navCopy.tools
        }

        return getLocalizedCategoryNameWithTranslations(
            name,
            slug,
            locale,
            translations
        )
    }

    const localizedCategories = (categories || []).map((category) => ({
        ...category,
        name: getCategoryLabel(
            category.slug,
            category.name,
            category.name_translations as { en?: string | null, pl?: string | null } | null
        ),
    })) as LocalizedCategory[]

    const groupedCategories = localizedCategories.reduce(
        (groups, category) => {
            if (isToolCategory(category)) {
                groups.tools.push(category)
            } else {
                groups.household.push(category)
            }

            return groups
        },
        {
            household: [] as LocalizedCategory[],
            tools: [] as LocalizedCategory[],
        }
    )

    const selectedIsToolCategory = params.group === 'tools' || (params.category
        ? groupedCategories.tools.some((category) => category.slug === params.category)
        : false)

    const selectedIsHouseholdCategory = params.group === 'household' || (params.category
        ? groupedCategories.household.some((category) => category.slug === params.category)
        : false)

    const selectedIsHouseholdMain = selectedIsHouseholdCategory
    const selectedIsToolsMain = selectedIsToolCategory

    const householdHeading = navCopy.household
    const toolsHeading = navCopy.tools

    const selectedCategory = (categories || []).find((category) => category.slug === params.category)
    const dynamicHeading = selectedCategory
        ? getCategoryLabel(
            selectedCategory.slug,
            selectedCategory.name,
            selectedCategory.name_translations as { en?: string | null, pl?: string | null } | null
        )
        : params.group === 'household'
            ? householdHeading
            : params.group === 'tools'
                ? toolsHeading
                : shopCopy.title

    const buildShopHref = (
        nextCategory?: string,
        nextPage?: number,
        nextGroup?: 'household' | 'tools' | null,
        preserveCurrentGroup = false
    ) => {
        const nextParams = new URLSearchParams()

        if (params.search) nextParams.set('search', params.search)
        if (nextCategory) {
            nextParams.set('category', nextCategory)
        } else if (nextGroup) {
            nextParams.set('group', nextGroup)
        } else if (preserveCurrentGroup && params.group && !nextCategory) {
            nextParams.set('group', params.group)
        }
        if (selectedBrand) nextParams.set('brand', selectedBrand)
        if (params.minPrice) nextParams.set('minPrice', params.minPrice)
        if (params.maxPrice) nextParams.set('maxPrice', params.maxPrice)
        if (params.inStock) nextParams.set('inStock', params.inStock)
        if (params.sort) nextParams.set('sort', params.sort)
        if (nextPage && nextPage > 1) nextParams.set('page', String(nextPage))

        const queryString = nextParams.toString()
        return queryString ? `/shop?${queryString}` : '/shop'
    }

    const totalPages = Math.max(1, Math.ceil((productsCount || 0) / PAGE_SIZE))
    const hasPreviousPage = currentPage > 1
    const hasNextPage = currentPage < totalPages
    const previousPageHref = buildShopHref(
        params.category,
        currentPage - 1,
        params.group === 'household' || params.group === 'tools' ? params.group : null,
        true
    )
    const nextPageHref = buildShopHref(
        params.category,
        currentPage + 1,
        params.group === 'household' || params.group === 'tools' ? params.group : null,
        true
    )

    return (
        <div className="min-h-screen bg-[#f3f4f6]">
            <div className="mx-auto max-w-[1520px] px-4 pb-14 pt-28 sm:px-6 lg:px-10 lg:pt-32">
                <div className="grid gap-10 lg:grid-cols-[minmax(220px,24%)_1fr] lg:gap-14">
                    <aside className="self-start border-b border-slate-200 pb-6 lg:sticky lg:top-28 lg:flex lg:max-h-[calc(100vh-8rem)] lg:flex-col lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8">
                        <p className="mb-6 text-[0.67rem] font-semibold uppercase tracking-[0.32em] text-slate-500">
                            {shopCopy.categories}
                        </p>

                        <nav className="divide-y divide-slate-200 border-y border-slate-200 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1" aria-label={shopCopy.categories}>
                            <Link
                                href={buildShopHref()}
                                className={`flex items-center justify-between rounded-lg px-3 py-4 text-[1.03rem] transition-colors ${!params.category && !params.group
                                    ? 'bg-slate-100 font-semibold text-slate-900'
                                    : 'font-medium text-slate-400 hover:text-slate-700'
                                    }`}
                            >
                                <span>{shopCopy.allProducts}</span>
                                {!params.category && !params.group && <span aria-hidden="true">&rarr;</span>}
                            </Link>

                            <details open={selectedIsHouseholdCategory} className="group rounded-lg">
                                <summary className="list-none marker:content-none">
                                    <div className={`flex items-center justify-between rounded-lg px-3 py-4 transition-colors ${selectedIsHouseholdMain ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                        <Link
                                            href={buildShopHref(undefined, undefined, 'household')}
                                            className={`inline-flex items-center gap-2 text-[1.03rem] font-semibold transition-colors ${selectedIsHouseholdMain
                                                ? 'text-[#163579]'
                                                : 'text-slate-900 hover:text-slate-950'
                                                }`}
                                        >
                                            {selectedIsHouseholdMain && <span className="h-2 w-2 rounded-full bg-[#163579]" aria-hidden="true" />}
                                            {householdHeading}
                                        </Link>
                                        <span className="text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true">&rsaquo;</span>
                                    </div>
                                </summary>
                                <div className="space-y-1 pb-3 pl-3 pr-2">
                                    {groupedCategories.household.map((category) => {
                                        const isActive = params.category === category.slug

                                        return (
                                            <Link
                                                key={category.id}
                                                href={buildShopHref(category.slug)}
                                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.96rem] transition-colors ${isActive
                                                    ? 'bg-slate-100 font-semibold text-slate-900'
                                                    : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                                    }`}
                                            >
                                                <span>{category.name}</span>
                                                {isActive && <span aria-hidden="true">&rarr;</span>}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </details>

                            <details open={selectedIsToolCategory} className="group rounded-lg">
                                <summary className="list-none marker:content-none">
                                    <div className={`flex items-center justify-between rounded-lg px-3 py-4 transition-colors ${selectedIsToolsMain ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                        <Link
                                            href={buildShopHref(undefined, undefined, 'tools')}
                                            className={`inline-flex items-center gap-2 text-[1.03rem] font-semibold transition-colors ${selectedIsToolsMain
                                                ? 'text-[#163579]'
                                                : 'text-slate-900 hover:text-slate-950'
                                                }`}
                                        >
                                            {selectedIsToolsMain && <span className="h-2 w-2 rounded-full bg-[#163579]" aria-hidden="true" />}
                                            {toolsHeading}
                                        </Link>
                                        <span className="text-slate-500 transition-transform group-open:rotate-90" aria-hidden="true">&rsaquo;</span>
                                    </div>
                                </summary>
                                <div className="space-y-1 pb-3 pl-3 pr-2">
                                    {groupedCategories.tools.map((category) => {
                                        const isActive = params.category === category.slug

                                        return (
                                            <Link
                                                key={category.id}
                                                href={buildShopHref(category.slug)}
                                                className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-[0.96rem] transition-colors ${isActive
                                                    ? 'bg-slate-100 font-semibold text-slate-900'
                                                    : 'font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                                                    }`}
                                            >
                                                <span>{category.name}</span>
                                                {isActive && <span aria-hidden="true">&rarr;</span>}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </details>
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
                                    <input type="hidden" name="group" value={params.group || ''} />
                                    <input type="hidden" name="brand" value={selectedBrand || ''} />
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
                                {productsCount && productsCount > 0 ? (
                                    <span className="font-semibold text-slate-900">{productsCount}</span>
                                ) : (
                                    <span>{shopCopy.none}</span>
                                )} {shopCopy.productsFoundLabel}
                            </p>
                        </div>

                        {fetchErrorMessage && (
                            <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                {shopCopy.loadError}
                            </div>
                        )}

                        {normalizedProducts.length > 0 ? (
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                {normalizedProducts.map((product, index) => (
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

                        {productsCount ? (
                            <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Pagination">
                                {hasPreviousPage ? (
                                    <Link
                                        href={previousPageHref}
                                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        {shopCopy.previousPage}
                                    </Link>
                                ) : (
                                    <span className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-400">
                                        {shopCopy.previousPage}
                                    </span>
                                )}

                                <span className="text-sm text-slate-600">
                                    {shopCopy.pageOf
                                        .replace('{current}', String(currentPage))
                                        .replace('{total}', String(totalPages))}
                                </span>

                                {hasNextPage ? (
                                    <Link
                                        href={nextPageHref}
                                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                    >
                                        {shopCopy.nextPage}
                                    </Link>
                                ) : (
                                    <span className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-2 text-sm text-slate-400">
                                        {shopCopy.nextPage}
                                    </span>
                                )}
                            </nav>
                        ) : null}
                    </section>
                </div>
            </div>
        </div>
    )
}
