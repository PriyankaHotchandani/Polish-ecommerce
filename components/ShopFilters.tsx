'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { useLocaleMessages } from '@/contexts/LocaleContext'

interface Category {
    id: string
    name: string
    slug: string
}

interface ShopFiltersProps {
    categories: Category[]
    activeFiltersCount: number
}

export default function ShopFilters({ categories, activeFiltersCount }: ShopFiltersProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { messages } = useLocaleMessages()

    const currentSearch = searchParams.get('search') || ''
    const currentCategory = searchParams.get('category') || ''
    const currentMinPrice = searchParams.get('minPrice') || ''
    const currentMaxPrice = searchParams.get('maxPrice') || ''
    const currentInStock = searchParams.get('inStock') === 'true'
    const currentSort = searchParams.get('sort') || 'newest'
    const [openMenu, setOpenMenu] = useState<'category' | 'sort' | null>(null)
    const [selectedCategory, setSelectedCategory] = useState(currentCategory)
    const [selectedSort, setSelectedSort] = useState(currentSort)
    const dropdownShellRef = useRef<HTMLFormElement | null>(null)
    const hasActiveFilters = activeFiltersCount > 0

    const sortOptions = [
        { value: 'newest', label: messages.shop.sortByNewest },
        { value: 'price-asc', label: messages.shop.sortByPriceLow },
        { value: 'price-desc', label: messages.shop.sortByPriceHigh },
        { value: 'name-asc', label: messages.shop.sortByName },
        { value: 'name-desc', label: messages.shopFilters.sortByNameDesc },
    ]

    const selectedCategoryLabel = selectedCategory
        ? (categories.find((category) => category.slug === selectedCategory)?.name || messages.shop.allProducts)
        : messages.shop.allProducts
    const selectedSortLabel = sortOptions.find((option) => option.value === selectedSort)?.label || messages.shop.sortByNewest

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownShellRef.current && !dropdownShellRef.current.contains(event.target as Node)) {
                setOpenMenu(null)
            }
        }

        if (openMenu) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openMenu])

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)

        const params = new URLSearchParams()
        const category = formData.get('category') as string
        const minPrice = formData.get('minPrice') as string
        const maxPrice = formData.get('maxPrice') as string
        const inStock = formData.get('inStock') as string
        const sort = formData.get('sort') as string

        if (currentSearch) params.set('search', currentSearch)
        if (category) params.set('category', category)
        if (minPrice) params.set('minPrice', minPrice)
        if (maxPrice) params.set('maxPrice', maxPrice)
        if (inStock) params.set('inStock', 'true')
        if (sort && sort !== 'newest') params.set('sort', sort)

        setIsOpen(false)
        startTransition(() => {
            router.push(`/shop?${params.toString()}`)
        })
    }

    const handleClearAll = () => {
        setIsOpen(false)
        setOpenMenu(null)
        startTransition(() => {
            router.push('/shop')
        })
    }

    return (
        <>
            <div className="flex items-center sm:justify-end">
                <button
                    onClick={() => setIsOpen(true)}
                    className={`group inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-[0.93rem] font-medium transition-all ${hasActiveFilters
                        ? 'border-[#163579]/20 bg-[#163579]/8 text-[#163579] hover:bg-[#163579]/12'
                        : 'border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    <span className="relative inline-flex items-center justify-center">
                        <svg
                            className={`h-[1.05rem] w-[1.05rem] ${hasActiveFilters ? 'text-[#163579]' : 'text-gray-700'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                            />
                        </svg>
                        {hasActiveFilters && (
                            <span className="absolute -right-1.5 -top-1.5 h-2.5 w-2.5 rounded-full bg-[#163579]" aria-hidden="true" />
                        )}
                    </span>
                    <span>{messages.common.filter}</span>
                </button>
            </div>

            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    <div
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    <div className="absolute inset-y-0 right-0 flex max-w-full">
                        <div className="w-screen max-w-[440px]">
                            <div className="relative flex h-full flex-col border-l border-slate-200 bg-white shadow-2xl">
                                <div className="border-b border-slate-200 bg-white px-5 py-4 text-slate-900">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-[1.28rem] font-semibold tracking-tight">{messages.shopFilters.filterProducts}</h2>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <form ref={dropdownShellRef} onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-24 pt-4">
                                    <input type="hidden" name="category" value={selectedCategory} />
                                    <input type="hidden" name="sort" value={selectedSort} />

                                    <div className="border-b border-gray-100 pb-4">
                                        <label htmlFor="category" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            {messages.shop.categories}
                                        </label>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setOpenMenu(openMenu === 'category' ? null : 'category')}
                                                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-left text-slate-900 transition hover:border-slate-300"
                                            >
                                                <span>{selectedCategoryLabel}</span>
                                                <svg
                                                    className={`h-4 w-4 text-slate-400 transition-transform ${openMenu === 'category' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {openMenu === 'category' && (
                                                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                                                    <div className="max-h-56 overflow-auto py-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedCategory('')
                                                                setOpenMenu(null)
                                                            }}
                                                            className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${selectedCategory === '' ? 'bg-[#163579]/8 text-[#163579]' : 'text-slate-700 hover:bg-slate-50'}`}
                                                        >
                                                            <span>{messages.shop.allProducts}</span>
                                                            {selectedCategory === '' && <span aria-hidden="true">•</span>}
                                                        </button>
                                                        {categories.map((cat) => (
                                                            <button
                                                                key={cat.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedCategory(cat.slug)
                                                                    setOpenMenu(null)
                                                                }}
                                                                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${selectedCategory === cat.slug ? 'bg-[#163579]/8 text-[#163579]' : 'text-slate-700 hover:bg-slate-50'}`}
                                                            >
                                                                <span>{cat.name}</span>
                                                                {selectedCategory === cat.slug && <span aria-hidden="true">•</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="border-b border-gray-100 py-4">
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            {messages.shop.priceRange}
                                        </label>
                                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                                            <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3">
                                                <span className="pr-2 text-sm font-medium text-gray-400">PLN</span>
                                                <input
                                                    type="number"
                                                    name="minPrice"
                                                    defaultValue={currentMinPrice}
                                                    placeholder={messages.shopFilters.min}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full py-2.5 text-slate-900 outline-none placeholder:text-gray-400"
                                                />
                                            </div>
                                            <span className="px-1 text-gray-300" aria-hidden="true">-</span>
                                            <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3">
                                                <span className="pr-2 text-sm font-medium text-gray-400">PLN</span>
                                                <input
                                                    type="number"
                                                    name="maxPrice"
                                                    defaultValue={currentMaxPrice}
                                                    placeholder={messages.shopFilters.max}
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full py-2.5 text-slate-900 outline-none placeholder:text-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-b border-gray-100 py-4">
                                        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            {messages.common.sort}
                                        </span>
                                        <div className="relative">
                                            <button
                                                type="button"
                                                onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
                                                className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-left text-slate-900 transition hover:border-slate-300"
                                            >
                                                <span>{selectedSortLabel}</span>
                                                <svg
                                                    className={`h-4 w-4 text-slate-400 transition-transform ${openMenu === 'sort' ? 'rotate-180' : ''}`}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                    aria-hidden="true"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </button>

                                            {openMenu === 'sort' && (
                                                <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                                                    <div className="max-h-56 overflow-auto py-1.5">
                                                        {sortOptions.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedSort(option.value)
                                                                    setOpenMenu(null)
                                                                }}
                                                                className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${selectedSort === option.value ? 'bg-[#163579]/8 text-[#163579]' : 'text-slate-700 hover:bg-slate-50'}`}
                                                            >
                                                                <span>{option.label}</span>
                                                                {selectedSort === option.value && <span aria-hidden="true">•</span>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="py-4">
                                        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                            {messages.common.filter}
                                        </span>
                                        <label className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
                                            <span className="text-sm font-medium text-gray-700">{messages.shopFilters.inStockOnly}</span>
                                            <input
                                                type="checkbox"
                                                name="inStock"
                                                value="true"
                                                defaultChecked={currentInStock}
                                                className="peer sr-only"
                                            />
                                            <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 transition-colors after:absolute after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#163579] peer-checked:after:translate-x-5" />
                                        </label>
                                    </div>

                                    <div className="absolute bottom-0 left-0 w-full border-t border-gray-100 bg-white p-3.5">
                                        <div className="grid grid-cols-10 gap-3">
                                            <button
                                                type="submit"
                                                disabled={isPending}
                                                className="col-span-7 rounded-lg bg-[#163579] px-4 py-2.5 text-[0.92rem] font-semibold text-white transition-colors hover:bg-[#122d67] disabled:opacity-50"
                                            >
                                                {isPending ? messages.shopFilters.applying : messages.shopFilters.applyFilters}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClearAll}
                                                disabled={isPending}
                                                className="col-span-3 bg-transparent px-1.5 py-2.5 text-[0.92rem] font-semibold text-gray-700 underline-offset-4 transition-colors hover:underline disabled:opacity-50"
                                            >
                                                {messages.shopFilters.reset}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
