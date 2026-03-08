import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()

  // Fetch featured products
  const { data: products } = await supabase
    .from('products')
    .select(`
            *,
            category:categories(*)
        `)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCAzLjk5OVY0SDQyYzIuMjEgMCA0IDEuNzkgNCA0djJjMCAyLjIxLTEuNzkgNC00IDRoLTJ2MmMwIDIuMjEtMS43OSA0LTQgNGgtMnYtMmMwLTIuMjEgMS43OS00IDQtNHYtMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight">
              BM SP. Z O. O.
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-green-50 mb-4 font-light">
              Your Trusted Partner for Quality Products
            </p>
            <p className="text-lg text-green-100 max-w-2xl mx-auto">
              From household essentials to professional tools — wholesale and retail pricing available
            </p>
          </div>

          {/* Dual Category Entry Points */}
          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {/* Household Products */}
            <Link
              href="/shop?category=household"
              className="group relative overflow-hidden rounded-2xl bg-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 group-hover:from-blue-500/30 group-hover:to-purple-500/30 transition-all"></div>
              <div className="relative p-8 md:p-10">
                <div className="text-6xl mb-6">🏠</div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Household Products
                </h2>
                <p className="text-gray-600 mb-6">
                  Kitchen essentials, home organization, cleaning supplies, and everyday necessities
                </p>
                <div className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700">
                  Explore Collection
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Tools & Equipment */}
            <Link
              href="/shop?category=tools"
              className="group relative overflow-hidden rounded-2xl bg-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 group-hover:from-orange-500/30 group-hover:to-red-500/30 transition-all"></div>
              <div className="relative p-8 md:p-10">
                <div className="text-6xl mb-6">🔧</div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                  Tools & Equipment
                </h2>
                <p className="text-gray-600 mb-6">
                  Professional-grade power tools, hand tools, hardware, and construction equipment
                </p>
                <div className="inline-flex items-center text-green-600 font-semibold group-hover:text-green-700">
                  Browse Tools
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Action Button */}
          <div className="text-center mt-12">
            <Link
              href="/shop"
              className="inline-flex items-center px-8 py-4 bg-white text-green-700 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-green-50 transition-all duration-300 hover:scale-105"
            >
              View All Products
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {products && products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Featured Products
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our latest arrivals and customer favorites
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/shop"
              className="inline-flex items-center px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-600 hover:text-white transition-colors duration-300"
            >
              See Full Catalog
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </section>
      )}

      {/* B2B Benefits Section */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-2 bg-green-600 rounded-full text-sm font-semibold mb-4">
              FOR BUSINESSES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Wholesale Pricing for B2B Customers
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Register as a business customer to unlock exclusive wholesale rates and benefits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-8 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-3">Wholesale Pricing</h3>
              <p className="text-gray-300">
                Enjoy significant discounts on bulk orders with our competitive net pricing
              </p>
            </div>

            <div className="text-center p-8 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-5xl mb-4">📄</div>
              <h3 className="text-xl font-bold mb-3">VAT Invoices</h3>
              <p className="text-gray-300">
                Automatic VAT invoice generation with your company details and NIP number
              </p>
            </div>

            <div className="text-center p-8 bg-white/5 backdrop-blur rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <div className="text-5xl mb-4">🚚</div>
              <h3 className="text-xl font-bold mb-3">Flexible Delivery</h3>
              <p className="text-gray-300">
                Priority shipping options and special rates for large volume orders
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/b2b"
              className="inline-flex items-center px-8 py-4 bg-green-600 text-white rounded-full font-bold text-lg shadow-xl hover:bg-green-700 transition-all duration-300 hover:scale-105"
            >
              Learn More About B2B
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
            <p className="text-gray-600 font-medium">Products</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">24/7</div>
            <p className="text-gray-600 font-medium">Online Shopping</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">Fast</div>
            <p className="text-gray-600 font-medium">Shipping</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">100%</div>
            <p className="text-gray-600 font-medium">Satisfaction</p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-green-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Create an account today and start shopping with confidence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg shadow-lg hover:bg-green-700 transition-all duration-300 hover:shadow-xl"
            >
              Sign Up Now
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 border-2 border-green-600 rounded-lg font-bold text-lg hover:bg-green-50 transition-all duration-300"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
