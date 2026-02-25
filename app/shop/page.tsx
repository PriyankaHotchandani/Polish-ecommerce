import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'

export default async function ShopPage() {
    const supabase = await createClient()

    // Fetch products with their categories
    const { data: products, error } = await supabase
        .from('products')
        .select(`
      *,
      category:categories(*)
    `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching products:', error)
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Shop</h1>
                    <p className="mt-2 text-gray-600">
                        Browse our complete catalog of household products and professional tools
                    </p>
                </div>

                {products && products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No products found</p>
                        <p className="text-gray-400 text-sm mt-2">
                            Make sure you&apos;ve run the seed data script to populate the database
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
