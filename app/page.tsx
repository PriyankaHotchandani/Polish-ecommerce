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
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_#1f2d49_0%,_#111827_42%,_#070d1a_100%)] py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-8 h-64 w-64 rounded-full bg-blue-200/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:px-8">
          <div>
            <div className="mb-6 inline-flex items-center rounded-full border border-white/20 bg-slate-950/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              For Businesses
            </div>
            <h2 className="mb-5 max-w-xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.7rem]">
              Wholesale Pricing for B2B Customers
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-slate-200">
              Register as a business customer to unlock exclusive wholesale rates, streamlined invoicing, and priority logistics tailored for recurring procurement.
            </p>

            <div className="mt-9">
              <Link
                href="/b2b"
                className="inline-flex items-center rounded-full border border-white/80 bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-[0_10px_40px_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Learn More About B2B
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-5">
            <div className="rounded-2xl border border-white/12 bg-white/5 p-6 text-left backdrop-blur-sm transition duration-300 hover:bg-white/[0.08]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 8h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm4 9h4m-6 4h8" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Wholesale Pricing</h3>
              <p className="text-slate-300">
                Enjoy significant discounts on bulk orders with transparent net pricing built for business scale.
              </p>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-6 text-left backdrop-blur-sm transition duration-300 hover:bg-white/[0.08]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">VAT Invoices</h3>
              <p className="text-slate-300">
                Automatic VAT invoice generation for every order, ready to download instantly from your order page.
              </p>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-6 text-left backdrop-blur-sm transition duration-300 hover:bg-white/[0.08]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3V7Zm11 3h3l3 3v2h-6v-5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm12 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">Flexible Delivery</h3>
              <p className="text-slate-300">
                Priority shipping options and negotiated rates for large-volume orders and scheduled replenishment.
              </p>
            </div>
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
