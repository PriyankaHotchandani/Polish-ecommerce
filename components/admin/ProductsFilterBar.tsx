'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface CategoryOption {
    id: string
    name: string
}

interface ProductsFilterBarProps {
    initialSearch: string
    initialCategory: string
    categories: CategoryOption[]
}

export default function ProductsFilterBar({
    initialSearch,
    initialCategory,
    categories,
}: ProductsFilterBarProps) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    const [searchValue, setSearchValue] = useState(initialSearch)
    const [categoryValue, setCategoryValue] = useState(initialCategory)
    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const categoryDropdownRef = useRef<HTMLDivElement | null>(null)

    const selectedCategoryLabel = categoryValue
        ? (categories.find((category) => category.id === categoryValue)?.name || 'All Categories')
        : 'All Categories'

    useEffect(() => {
        setSearchValue(initialSearch)
    }, [initialSearch])

    useEffect(() => {
        setCategoryValue(initialCategory)
    }, [initialCategory])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
                setIsCategoryOpen(false)
            }
        }

        if (isCategoryOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isCategoryOpen])

    const updateQuery = (nextSearch: string, nextCategory: string) => {
        const nextParams = new URLSearchParams(searchParams.toString())

        const normalizedSearch = nextSearch.trim()
        if (normalizedSearch) {
            nextParams.set('search', normalizedSearch)
        } else {
            nextParams.delete('search')
        }

        if (nextCategory) {
            nextParams.set('category', nextCategory)
        } else {
            nextParams.delete('category')
        }

        const query = nextParams.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    }

    useEffect(() => {
        const timeout = setTimeout(() => {
            updateQuery(searchValue, categoryValue)
        }, 300)

        return () => clearTimeout(timeout)
    }, [searchValue])

    const handleCategoryChange = (nextCategory: string) => {
        setCategoryValue(nextCategory)
        setIsCategoryOpen(false)
        updateQuery(searchValue, nextCategory)
    }

    const controlClassName = 'h-12 w-full rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:border-[#163579] focus:outline-none focus:ring-2 focus:ring-[#163579]/20'

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div className="w-full md:flex-1 md:max-w-lg">
                    <label htmlFor="product-search" className="block text-sm font-semibold text-slate-700 mb-2">
                        Search
                    </label>
                    <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <svg className="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path d="m21 21-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
                                <circle cx="11" cy="11" r="6" />
                            </svg>
                        </div>
                        <input
                            id="product-search"
                            type="text"
                            value={searchValue}
                            onChange={(event) => setSearchValue(event.target.value)}
                            placeholder="Search by title, SKU, or brand"
                            className={`${controlClassName} pl-10 pr-3 placeholder:text-slate-400`}
                        />
                    </div>
                </div>

                <div className="w-full md:w-72" ref={categoryDropdownRef}>
                    <label htmlFor="product-category" className="block text-sm font-semibold text-slate-700 mb-2">
                        Category
                    </label>
                    <div className="relative">
                        <button
                            type="button"
                            id="product-category"
                            aria-haspopup="listbox"
                            aria-expanded={isCategoryOpen}
                            onClick={() => setIsCategoryOpen((current) => !current)}
                            className={`${controlClassName} flex items-center justify-between px-3.5 text-left transition hover:border-slate-300`}
                        >
                            <span>{selectedCategoryLabel}</span>
                            <svg
                                className={`h-4 w-4 text-slate-400 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isCategoryOpen && (
                            <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
                                <div className="max-h-56 overflow-auto py-1.5" role="listbox" aria-label="Product category options">
                                    <button
                                        type="button"
                                        onClick={() => handleCategoryChange('')}
                                        className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${categoryValue === '' ? 'bg-[#163579]/8 text-[#163579]' : 'text-slate-700 hover:bg-slate-50'}`}
                                    >
                                        <span>All Categories</span>
                                        {categoryValue === '' && <span aria-hidden="true">•</span>}
                                    </button>
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() => handleCategoryChange(category.id)}
                                            className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition ${categoryValue === category.id ? 'bg-[#163579]/8 text-[#163579]' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            <span>{category.name}</span>
                                            {categoryValue === category.id && <span aria-hidden="true">•</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
