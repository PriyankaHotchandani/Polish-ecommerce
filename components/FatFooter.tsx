'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocaleMessages } from '@/contexts/LocaleContext'

export default function FatFooter() {
    const pathname = usePathname()
    const { messages } = useLocaleMessages()

    if (pathname.startsWith('/admin')) {
        return null
    }

    const footer = messages.footer

    const shoppingLinks = [
        { href: '/shop?category=kitchenware', label: footer.shopping.household },
        { href: '/shop?category=power-tools', label: footer.shopping.tools },
        { href: '/shop?sort=newest', label: footer.shopping.newArrivals },
        { href: '/shop', label: footer.shopping.specialOffers },
    ]

    const portalLinks = [
        { href: '/auth/signup', label: footer.partner.applyAccount },
        { href: '/auth/login', label: footer.partner.login },
        { href: '/shop', label: footer.partner.bulkOrdering },
        { href: '/shop', label: footer.partner.volumeDiscounts },
    ]

    const supportLinks = [
        { href: '/contact', label: footer.customer.contact },
        { href: '/shipping-policy', label: footer.customer.shipping },
        { href: '/returns', label: footer.customer.returns },
        { href: '/about', label: footer.customer.about },
    ]

    return (
        <footer className="bg-slate-900 text-white">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="border-b border-white/10 py-10 lg:py-12">
                    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr] lg:items-center">
                        <h3 className="max-w-xl text-2xl font-bold leading-tight text-white sm:text-[1.9rem]">
                            {footer.newsletter.heading}
                        </h3>

                        <form
                            className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]"
                            onSubmit={(event) => event.preventDefault()}
                        >
                            <input
                                type="email"
                                required
                                placeholder={footer.newsletter.placeholder}
                                aria-label={footer.newsletter.placeholder}
                                className="h-12 w-full rounded-xl border border-white/20 bg-transparent px-4 text-white placeholder:text-white/55 outline-none transition focus:border-white/60"
                            />
                            <button
                                type="submit"
                                className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold uppercase tracking-[0.09em] text-slate-900 transition hover:bg-slate-100"
                            >
                                {footer.newsletter.button}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="py-14">
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                            <Link href="/" className="inline-flex items-center rounded-lg bg-white px-3.5 py-2 shadow-sm" aria-label="BM Sp. z o.o.">
                                <img src="/logos/bmspzoo-trim.png" alt="BM Sp. z o.o." className="h-6 w-auto" />
                            </Link>
                            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
                                {footer.brand.description}
                            </p>
                            <div className="mt-6 flex items-center gap-3">
                                <a href="#" aria-label="Facebook" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white/90 transition hover:border-white hover:text-white">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 8h-2a2 2 0 0 0-2 2v2H9v3h2v5h3v-5h2.2l.8-3H14v-1.7c0-.58.24-1.3 1.3-1.3H17V6h-1.7C13.14 6 12 7.34 12 9.2V12" />
                                    </svg>
                                </a>
                                <a href="#" aria-label="LinkedIn" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white/90 transition hover:border-white hover:text-white">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11v7M8 8v.01M12 18v-7m0 0h3a3 3 0 0 1 3 3v4" />
                                    </svg>
                                </a>
                                <a href="#" aria-label="Instagram" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/35 text-white/90 transition hover:border-white hover:text-white">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                        <rect x="3" y="3" width="18" height="18" rx="5" strokeWidth={2} />
                                        <circle cx="12" cy="12" r="3.2" strokeWidth={2} />
                                        <circle cx="17" cy="7" r="0.9" fill="currentColor" stroke="none" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{footer.shopping.title}</h4>
                            <ul className="mt-4 space-y-3 text-sm text-slate-200">
                                {shoppingLinks.map((link) => (
                                    <li key={link.href + link.label}>
                                        <Link href={link.href} className="transition hover:text-white">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{footer.partner.title}</h4>
                            <ul className="mt-4 space-y-3 text-sm text-slate-200">
                                {portalLinks.map((link) => (
                                    <li key={link.href + link.label}>
                                        <Link href={link.href} className="transition hover:text-white">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{footer.customer.title}</h4>
                            <ul className="mt-4 space-y-3 text-sm text-slate-200">
                                {supportLinks.map((link) => (
                                    <li key={link.href + link.label}>
                                        <Link href={link.href} className="transition hover:text-white">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="border-t border-white/10 py-5">
                    <div className="grid gap-4 text-xs text-slate-400 md:grid-cols-[1fr_auto_1fr] md:items-center">
                        <p className="text-center md:text-left">{footer.bottom.copyright}</p>

                        <div className="flex items-center justify-center gap-4">
                            <Link href="/privacy-policy" className="transition hover:text-slate-200">{footer.bottom.privacy}</Link>
                            <Link href="/terms-of-service" className="transition hover:text-slate-200">{footer.bottom.terms}</Link>
                        </div>

                        <div className="flex items-center justify-center gap-2 md:justify-end">
                            {footer.bottom.payments.map((method) => (
                                <span
                                    key={method}
                                    className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.08em] text-slate-300"
                                >
                                    {method}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}
