'use client'

import type { Product, Category } from '@/types/database.types'
import PriceDisplay from '@/components/PriceDisplay'
import AddToCartButton from '@/components/AddToCartButton'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import {
    getLocalizedBrandName,
    getLocalizedCategoryName,
    getLocalizedProductDescription,
    getLocalizedProductTitle,
} from '@/utils/productLocalization'

interface ProductDetailsProps {
    product: Product & { category: Category }
}

export default function ProductDetails({ product }: ProductDetailsProps) {
    const specifications = product.specifications as Record<string, any> | null
    const { messages, locale } = useLocaleMessages()
    const localizedCategoryName = getLocalizedCategoryName(product.category.name, product.category.slug, locale)
    const localizedTitle = getLocalizedProductTitle(product.title, product.slug, locale)
    const localizedDescription = getLocalizedProductDescription(product.description, product.slug, locale)
    const localizedBrandName = getLocalizedBrandName(product.brand, locale)

    return (
        <>
            <div className="mb-4">
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                    {localizedCategoryName}
                </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{localizedTitle}</h1>
            {localizedBrandName && (
                <p className="text-lg text-gray-600 mb-4">{messages.product.brand}: {localizedBrandName}</p>
            )}

            <div className="mb-6">
                <span className="text-sm text-gray-500">{messages.product.sku}: {product.sku}</span>
            </div>

            {/* Price */}
            <div className="bg-gray-100 rounded-lg p-6 mb-6">
                <PriceDisplay
                    price_retail={Number(product.price_retail)}
                    price_wholesale={Number(product.price_wholesale)}
                />
            </div>

            {/* Stock Status */}
            <div className="mb-6">
                <span
                    className={`text-lg font-medium ${product.inventory_count > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                >
                    {product.inventory_count > 0
                        ? `${messages.product.inStock} (${product.inventory_count} ${messages.product.available})`
                        : messages.product.outOfStock}
                </span>
            </div>

            {/* Add to Cart with Quantity Selector */}
            <div className="mb-6">
                <AddToCartButton product={product} showQuantity className="text-lg py-4" />
            </div>

            {/* Description */}
            {localizedDescription && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.product.description}</h2>
                    <p className="text-gray-700 leading-relaxed">{localizedDescription}</p>
                </div>
            )}

            {/* Specifications */}
            {specifications && Object.keys(specifications).length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">{messages.product.specifications}</h2>
                    <div className="bg-white rounded-lg border border-gray-200">
                        {Object.entries(specifications).map(([key, value], index) => (
                            <div
                                key={key}
                                className={`flex justify-between py-3 px-4 ${index !== Object.keys(specifications).length - 1
                                    ? 'border-b border-gray-200'
                                    : ''
                                    }`}
                            >
                                <span className="text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}
                                </span>
                                <span className="text-gray-900 font-medium">
                                    {Array.isArray(value) ? value.join(', ') : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
