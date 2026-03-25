import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'
import HeroCenterPanel from '@/components/HeroCenterPanel'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

type Locale = 'en' | 'pl'

const MESSAGES = {
  en: enMessages,
  pl: plMessages,
} as const

export default async function Home() {
  const supabase = await createClient()
  const cookieStore = await cookies()
  const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
  const homeCopy = MESSAGES[locale].home
  const heroCopy = MESSAGES[locale].home.hero


  // Fetch featured products
  const { data: products } = await supabase
    .from('products')
    .select(`
            *,
            category:categories(*)
        `)
    .order('created_at', { ascending: false })
    .limit(9)

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section>
        <div className="grid min-h-screen gap-px bg-[#050b25] lg:grid-cols-[1fr_1.08fr_1fr]">
          <Link
            href="/shop?category=household"
            className="group relative overflow-hidden bg-slate-900"
          >
            <div className="hero-panel hero-panel-household">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
              >
                <source src="/household.mp4" type="video/mp4" />
              </video>
              <div className="hero-panel-overlay" />
              <div className="hero-panel-copy">
                <h2 className="hero-panel-heading">
                  {heroCopy.leftPanelHeading.split('\n').map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </h2>
              </div>
            </div>
          </Link>

          <HeroCenterPanel locale={locale} />

          <Link
            href="/shop?category=tools"
            className="group relative overflow-hidden bg-slate-900"
          >
            <div className="hero-panel hero-panel-tools">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                aria-hidden="true"
              >
                <source src="/tools.mp4" type="video/mp4" />
              </video>
              <div className="hero-panel-overlay" />
              <div className="hero-panel-copy">
                <h2 className="hero-panel-heading">
                  {heroCopy.rightPanelHeading.split('\n').map((line) => (
                    <span key={line}>
                      {line}
                      <br />
                    </span>
                  ))}
                </h2>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      {products && products.length > 0 && (
        <section className="featured-products-section">
          <div className="featured-products-shell">
            <div className="featured-products-heading-wrap">
              <span className="featured-products-kicker">Curated Collection</span>
              <h2 className="featured-products-heading">{homeCopy.featured}</h2>
              <p className="featured-products-subheading">
                Discover standout essentials selected for quality, finish, and daily performance.
              </p>
            </div>

            <div className="featured-products-grid">
              {products.map((product) => (
                <div key={product.id} className="featured-product-frame">
                  <ProductCard product={product} variant="featured" />
                </div>
              ))}
            </div>

            <div className="featured-products-cta-wrap">
              <Link
                href="/shop"
                className="featured-products-cta"
              >
                Explore Full Catalog
                <svg className="featured-products-cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
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
                Automatic VAT invoice generation for all orders - download instantly from your order page
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
