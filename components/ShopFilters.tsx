'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

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

    // Get current values from URL
    const currentSearch = searchParams.get('search') || ''
    const currentCategory = searchParams.get('category') || ''
    const currentMinPrice = searchParams.get('minPrice') || ''
    const currentMaxPrice = searchParams.get('maxPrice') || ''
    const currentInStock = searchParams.get('inStock') === 'true'
    const currentSort = searchParams.get('sort') || 'newest'

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
        startTransition(() => {
            router.push('/shop')
        })
    }

    return (
        <>
            {/* Filter Button */}
            <div className="flex items-center gap-3 sm:justify-end">
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-sm border border-gray-300"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {activeFiltersCount > 0 && (
                        <span className="px-2.5 py-0.5 bg-green-600 text-white text-sm font-bold rounded-full">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>

                {activeFiltersCount > 0 && (
                    <button
                        onClick={handleClearAll}
                        disabled={isPending}
                        className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        Clear All
                    </button>
                )}
            </div>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-white/45 backdrop-blur-[1px] transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Panel */}
                    <div className="absolute inset-y-0 right-0 max-w-full flex">
                        <div className="w-screen max-w-md">
                            <div className="h-full flex flex-col bg-white shadow-xl">
                                {/* Header */}
                                <div className="px-6 py-6 bg-green-600 text-white">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-2xl font-bold">Filter Products</h2>
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="p-2 hover:bg-green-700 rounded-lg transition-colors"
                                        >
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Filter Form */}
                                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                                    <div className="px-6 py-6 space-y-6">
                                        {/* Category Filter */}
                                        <div>
                                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                                Category
                                            </label>
                                            <select
                                                id="category"
                                                name="category"
                                                defaultValue={currentCategory}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">All Categories</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.slug}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Price Range */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Price Range (PLN)
                                            </label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <input
                                                        type="number"
                                                        name="minPrice"
                                                        defaultValue={currentMinPrice}
                                                        placeholder="Min"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <input
                                                        type="number"
                                                        name="maxPrice"
                                                        defaultValue={currentMaxPrice}
                                                        placeholder="Max"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sort */}
                                        <div>
                                            <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-2">
                                                Sort By
                                            </label>
                                            <select
                                                id="sort"
                                                name="sort"
                                                defaultValue={currentSort}
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="newest">Newest First</option>
                                                <option value="price-asc">Price: Low to High</option>
                                                <option value="price-desc">Price: High to Low</option>
                                                <option value="name-asc">Name: A to Z</option>
                                                <option value="name-desc">Name: Z to A</option>
                                            </select>
                                        </div>

                                        {/* In Stock Toggle */}
                                        <div>
                                            <label className="flex items-center space-x-3 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    name="inStock"
                                                    value="true"
                                                    defaultChecked={currentInStock}
                                                    className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                                />
                                                <span className="text-sm font-medium text-gray-700">Show In-Stock Items Only</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Footer Buttons */}
                                    <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                                        <div className="flex gap-3">
                                            <button
                                                type="submit"
                                                disabled={isPending}
                                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                                            >
                                                {isPending ? 'Applying...' : 'Apply Filters'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClearAll}
                                                disabled={isPending}
                                                className="px-6 py-3 bg-white text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-colors border border-gray-300 disabled:opacity-50"
                                            >
                                                Reset
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
