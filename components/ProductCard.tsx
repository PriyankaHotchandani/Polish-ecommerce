'use client'

import Link from 'next/link'
import type { Product, Category } from '@/types/database.types'
import PriceDisplay from './PriceDisplay'
import AddToCartButton from './AddToCartButton'

interface ProductCardProps {
    product: Product & { category?: Category }
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <Link href={`/product/${product.slug}`}>
                <div className="aspect-square bg-gray-200 relative">
                    {product.image_urls && product.image_urls[0] ? (
                        <img
                            src={product.image_urls[0]}
                            alt={product.title}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400">No image</span>
                        </div>
                    )}
                </div>
            </Link>
            <div className="p-4">
                {product.category && (
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                        {product.category.name}
                    </span>
                )}
                <Link href={`/product/${product.slug}`}>
                    <h3 className="mt-1 text-lg font-semibold text-gray-900 hover:text-green-600 line-clamp-2">
                        {product.title}
                    </h3>
                </Link>
                {product.brand && (
                    <p className="text-sm text-gray-500 mt-1">{product.brand}</p>
                )}
                <div className="mt-4">
                    <PriceDisplay
                        price_retail={Number(product.price_retail)}
                        price_wholesale={Number(product.price_wholesale)}
                    />
                </div>
                <div className="mt-4">
                    <span
                        className={`text-sm ${product.inventory_count > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                    >
                        {product.inventory_count > 0
                            ? `In Stock (${product.inventory_count})`
                            : 'Out of Stock'}
                    </span>
                </div>
                <div className="mt-4">
                    <AddToCartButton product={product} />
                </div>
            </div>
        </div>
    )
}
