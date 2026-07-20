'use client'

import Link from 'next/link'
import type { Product, Category } from '@/types/database.types'
import PriceDisplay from './PriceDisplay'
import AddToCartButton from './AddToCartButton'
import { useLocaleMessages } from '@/contexts/LocaleContext'
import {
    getLocalizedBrandName,
    getLocalizedCategoryNameWithTranslations,
    getLocalizedProductTitle,
} from '@/utils/productLocalization'
import { useProductTranslation } from '@/utils/useProductTranslation'

interface ProductCardProps {
    product: Product & { category?: Category }
    variant?: 'default' | 'featured'
}

export default function ProductCard({ product, variant = 'default' }: ProductCardProps) {
    const isFeatured = variant === 'featured'
    const imageUrl = product.image_urls?.[0]
    const { messages, locale } = useLocaleMessages()

    // Get base localized title from DB translations
    const baseLocalizedTitle = getLocalizedProductTitle(
        product.title,
        product.slug,
        locale,
        product.title_translations as { en?: string | null, pl?: string | null } | null
    )

    // Apply client-side translation if needed (for English locale and missing DB translations)
    const { title: clientTranslatedTitle } = useProductTranslation(
        product.title,
        product.description,
        product.title_translations as { en?: string | null, pl?: string | null } | null,
        product.description_translations as { en?: string | null, pl?: string | null } | null,
        locale
    )

    // Use client translation if available, otherwise fall back to base localized title
    const localizedTitle = clientTranslatedTitle || baseLocalizedTitle

    const localizedCategoryName = product.category
        ? getLocalizedCategoryNameWithTranslations(
            product.category.name,
            product.category.slug,
            locale,
            product.category.name_translations as { en?: string | null, pl?: string | null } | null
        )
        : null
    const localizedBrandName = getLocalizedBrandName(product.brand, locale)

    return (
        <div className={isFeatured ? 'product-card product-card-featured' : 'product-card product-card-default'}>
            <Link href={`/product/${product.slug}`} prefetch={false} className={isFeatured ? 'product-card-image-link product-card-image-link-featured' : ''}>
                <div className={isFeatured ? 'product-card-image-wrap product-card-image-wrap-featured' : 'aspect-square bg-gray-200 relative'}>
                    {product.is_promotional && (
                        <span className="absolute top-2 left-2 z-10 rounded-full bg-rose-500 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-white shadow-sm">
                            {locale === 'pl' ? 'Promocja' : 'Sale'}
                        </span>
                    )}
                    {imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={localizedTitle}
                            className={isFeatured ? 'product-card-image' : 'w-full h-full object-cover'}
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <div className={isFeatured ? 'product-card-empty-state' : 'flex items-center justify-center h-full'}>
                            <span className="text-gray-400">{messages.cartPage.noImage}</span>
                        </div>
                    )}
                </div>
            </Link>
            <div className={isFeatured ? 'product-card-body product-card-body-featured' : 'p-4'}>
                {product.category && (
                    <span className={isFeatured ? 'product-card-category product-card-category-featured' : 'text-xs text-gray-500 uppercase tracking-wide'}>
                        {localizedCategoryName}
                    </span>
                )}
                <Link href={`/product/${product.slug}`} prefetch={false} className={isFeatured ? 'product-card-title-link product-card-title-link-featured' : ''}>
                    <h3 className={isFeatured ? 'product-card-title product-card-title-featured' : 'mt-1 text-lg font-semibold text-gray-900 hover:text-green-600 line-clamp-2'}>
                        {localizedTitle}
                    </h3>
                </Link>
                {localizedBrandName && (
                    <p className={isFeatured ? 'product-card-brand product-card-brand-featured' : 'text-sm text-gray-500 mt-1'}>{localizedBrandName}</p>
                )}
                <div className={isFeatured ? 'product-card-price-wrap' : 'mt-4'}>
                    <PriceDisplay
                        price_retail={Number(product.price_retail)}
                        category={product.category ?? null}
                        variant={isFeatured ? 'featured' : 'default'}
                    />
                </div>
                <div className={isFeatured ? 'product-card-stock-wrap' : 'mt-4'}>
                    {isFeatured ? (
                        <span className={`product-card-stock ${product.inventory_count > 0 ? 'is-available' : 'is-unavailable'}`}>
                            <span className="product-card-stock-dot" aria-hidden="true" />
                            {product.inventory_count > 0 ? messages.product.inStock : messages.product.outOfStock}
                        </span>
                    ) : (
                        <span
                            className={`text-sm ${product.inventory_count > 0 ? 'text-green-600' : 'text-red-600'
                                }`}
                        >
                            {product.inventory_count > 0
                                ? `${messages.product.inStock} (${product.inventory_count})`
                                : messages.product.outOfStock}
                        </span>
                    )}
                </div>
                <div className={isFeatured ? 'product-card-cta-wrap' : 'mt-4'}>
                    <AddToCartButton product={product} />
                </div>
            </div>
        </div>
    )
}