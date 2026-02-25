import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import type { Product, Category } from '@/types/database.types'
import ProductDetails from '@/components/ProductDetails'
import ProductImageGallery from '@/components/ProductImageGallery'
import Link from 'next/link'

interface ProductPageProps {
    params: Promise<{
        slug: string
    }>
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { slug } = await params
    const supabase = await createClient()

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

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Breadcrumb */}
                <nav className="mb-8 text-sm">
                    <Link href="/shop" className="text-green-600 hover:text-green-700">
                        Shop
                    </Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <Link href={`/shop?category=${category.slug}`} className="text-green-600 hover:text-green-700">
                        {category.name}
                    </Link>
                    <span className="mx-2 text-gray-400">/</span>
                    <span className="text-gray-600">{product.title}</span>
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
