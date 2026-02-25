'use client'

import type { Product, Category } from '@/types/database.types'
import PriceDisplay from '@/components/PriceDisplay'
import AddToCartButton from '@/components/AddToCartButton'

interface ProductDetailsProps {
    product: Product & { category: Category }
}

export default function ProductDetails({ product }: ProductDetailsProps) {
    const specifications = product.specifications as Record<string, any> | null

    return (
        <>
            <div className="mb-4">
                <span className="text-sm text-gray-500 uppercase tracking-wide">
                    {product.category.name}
                </span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
            {product.brand && (
                <p className="text-lg text-gray-600 mb-4">by {product.brand}</p>
            )}

            <div className="mb-6">
                <span className="text-sm text-gray-500">SKU: {product.sku}</span>
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
                        ? `In Stock (${product.inventory_count} available)`
                        : 'Out of Stock'}
                </span>
            </div>

            {/* Add to Cart with Quantity Selector */}
            <div className="mb-6">
                <AddToCartButton product={product} showQuantity className="text-lg py-4" />
            </div>

            {/* Description */}
            {product.description && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                    <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
            )}

            {/* Specifications */}
            {specifications && Object.keys(specifications).length > 0 && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Specifications</h2>
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
