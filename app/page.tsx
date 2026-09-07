import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'
import HeroCenterPanel from '@/components/HeroCenterPanel'
import TrustIndicators from '@/components/TrustIndicators'
import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import type { Product, Category } from '@/types/database.types'
import { HOUSEHOLD_BRANDS, TOOL_BRANDS, getBrandInfo } from '@/utils/brands'

type Locale = 'en' | 'pl'

// The hero videos are too large for Cloudflare Workers' static-asset size limit,
// so they are served from external storage (e.g. an R2 bucket / CDN) via
// NEXT_PUBLIC_MEDIA_BASE_URL. When unset, falls back to the local /public path.
const MEDIA_BASE_URL = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || '').replace(/\/+$/, '')

const MESSAGES = {
  en: enMessages,
  pl: plMessages,
} as const

export default async function Home() {
  const cookieStore = await cookies()
  const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
  const homeCopy = MESSAGES[locale].home as typeof enMessages.home
  const heroCopy = homeCopy.hero

  let products: (Product & { category: Category })[] | null = null

  // Fetch featured products when Supabase config is available.
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createClient()
      const { data } = await supabase
        .from('products')
        .select(`
              *,
              category:categories(*)
          `)
        .order('created_at', { ascending: false })
        .limit(9)

      products = data
    } catch {
      products = null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section>
        <div className="grid gap-px bg-[#050b25] lg:min-h-screen lg:grid-cols-[1fr_1.08fr_1fr]">
          <Link
            href="/shop?group=household"
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
                <source src={`${MEDIA_BASE_URL}/household.mp4`} type="video/mp4" />
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
                <div className="hero-brand-badges">
                  {HOUSEHOLD_BRANDS.map((brand) => {
                    const info = getBrandInfo(brand)
                    return (
                      <span key={brand} className={`hero-brand-badge${info.dark ? ' is-dark' : ''}`}>
                        <img src={info.logo} alt={brand} className="hero-brand-badge-img" />
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>
          </Link>

          <HeroCenterPanel locale={locale} />

          <Link
            href="/shop?group=tools"
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
                <source src={`${MEDIA_BASE_URL}/tools.mp4`} type="video/mp4" />
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
                <div className="hero-brand-badges">
                  {TOOL_BRANDS.map((brand) => {
                    const info = getBrandInfo(brand)
                    return (
                      <span key={brand} className={`hero-brand-badge${info.dark ? ' is-dark' : ''}`}>
                        <img src={info.logo} alt={brand} className="hero-brand-badge-img" />
                      </span>
                    )
                  })}
                </div>
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
              <span className="featured-products-kicker">{homeCopy.featuredKicker}</span>
              <h2 className="featured-products-heading">{homeCopy.featured}</h2>
              <p className="featured-products-subheading">
                {homeCopy.featuredSubheading}
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
                {homeCopy.featuredCta}
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
              {homeCopy.b2b.badge}
            </div>
            <h2 className="mb-5 max-w-xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-[2.7rem]">
              {homeCopy.b2b.heading}
            </h2>
            <p className="max-w-xl text-lg leading-relaxed text-slate-200">
              {homeCopy.b2b.subtext}
            </p>

            <div className="mt-9">
              <Link
                href="/auth/signup"
                className="inline-flex items-center rounded-full border border-white/80 bg-white px-8 py-4 text-base font-bold text-slate-900 shadow-[0_10px_40px_rgba(255,255,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100"
              >
                {homeCopy.b2b.cta}
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
              <h3 className="mb-2 text-xl font-semibold text-white">{homeCopy.b2b.cards.wholesale.title}</h3>
              <p className="text-slate-300">
                {homeCopy.b2b.cards.wholesale.description}
              </p>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-6 text-left backdrop-blur-sm transition duration-300 hover:bg-white/[0.08]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M9 13h6M9 17h4" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">{homeCopy.b2b.cards.vat.title}</h3>
              <p className="text-slate-300">
                {homeCopy.b2b.cards.vat.description}
              </p>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/5 p-6 text-left backdrop-blur-sm transition duration-300 hover:bg-white/[0.08]">
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-300/12 text-cyan-200">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3V7Zm11 3h3l3 3v2h-6v-5Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 18.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm12 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-white">{homeCopy.b2b.cards.delivery.title}</h3>
              <p className="text-slate-300">
                {homeCopy.b2b.cards.delivery.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <TrustIndicators
        stats={[
          { value: '3500+', label: homeCopy.trustIndicators.products },
          { value: '24/7', label: homeCopy.trustIndicators.onlineShopping },
          { value: homeCopy.trustIndicators.fastValue, label: homeCopy.trustIndicators.shipping },
          { value: '100%', label: homeCopy.trustIndicators.satisfaction },
        ]}
      />

      {/* Final CTA */}
      <section className="pb-20 pt-6 sm:pb-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-800/40 bg-[linear-gradient(140deg,_#0f1b3d_0%,_#0b1634_52%,_#08102a_100%)] px-6 py-14 text-center shadow-[0_28px_70px_rgba(15,23,42,0.34)] sm:px-10 lg:px-14">
            <div className="pointer-events-none absolute -left-12 bottom-0 h-44 w-44 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-12 top-0 h-48 w-48 rounded-full bg-blue-200/10 blur-3xl" />

            <div className="relative">
              <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
                {homeCopy.finalCta.heading}
              </h2>
              <p className="mx-auto mb-9 max-w-2xl text-lg text-slate-200">
                {homeCopy.finalCta.subtext}
              </p>
              <div className="flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/auth/signup"
                  className="inline-flex items-center justify-center rounded-full border border-white/80 bg-white px-8 py-4 text-lg font-bold text-slate-900 shadow-[0_16px_35px_rgba(255,255,255,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-100"
                >
                  {homeCopy.finalCta.primaryButton}
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 px-8 py-4 text-lg font-semibold text-white transition-all duration-300 hover:bg-white/10"
                >
                  {homeCopy.finalCta.secondaryButton}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}