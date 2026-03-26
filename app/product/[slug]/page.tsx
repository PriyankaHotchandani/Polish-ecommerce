import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Product, Category } from '@/types/database.types'
import ProductDetails from '@/components/ProductDetails'
import ProductImageGallery from '@/components/ProductImageGallery'
import Link from 'next/link'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import { getLocalizedCategoryName, getLocalizedProductTitle } from '@/utils/productLocalization'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

interface ProductPageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params
    const supabase = await createClient()
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const messages = MESSAGES[locale]

    const { data: product, error } = await supabase
        .from('products')
        .select(`
      *,
      category:categories(*)
    `)
        .eq('slug', slug)
        .single()

    if (error || !product) {
        notFound()
    }

    const category = product.category as Category
    const localizedCategoryName = getLocalizedCategoryName(category.name, category.slug, locale)
    const localizedProductTitle = getLocalizedProductTitle(product.title, product.slug, locale)

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm">
                    <Link href="/shop" className="text-green-600 hover:text-green-700">
                        {messages.nav.shop}
                    </Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <Link href={`/shop?category=${category.slug}`} className="text-green-600 hover:text-green-700">
                        {localizedCategoryName}
                    </Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-gray-600">{localizedProductTitle}</span>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Product Images */}
                    <div>
                        <ProductImageGallery
                            images={product.image_urls || []}
                            title={product.title}
                        />
                    </div>

                    {/* Product Info */}
                    <div>
                        <ProductDetails product={{ ...product, category }} />
                    </div>
                </div>
            </div>
        </div>
    )
}
