'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type OfferCopy = {
    offerTitle: string
    offer: {
        householdTitle: string
        householdDescription: string
        toolsTitle: string
        toolsDescription: string
        b2cTitle: string
        b2cDescription: string
        b2bTitle: string
        b2bDescription: string
    }
    offerCtas: {
        household: string
        tools: string
        b2c: string
        b2b: string
    }
}

type OfferGridProps = {
    copy: OfferCopy
}

type IconProps = {
    className?: string
}

const HouseholdIcon = ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M3 10.5L12 3l9 7.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5.25 9.75V21h13.5V9.75" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9.75 21v-5.25h4.5V21" />
    </svg>
)

const ToolsIcon = ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M14.7 6.3a3.75 3.75 0 0 0-4.95 4.95L4.5 16.5v3h3l5.25-5.25a3.75 3.75 0 0 0 4.95-4.95l-2.25 2.25-2.25-2.25 2.25-2.25Z" />
    </svg>
)

const B2CIcon = ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M2.25 3h1.5l1.8 10.2a2.25 2.25 0 0 0 2.22 1.8h8.73a2.25 2.25 0 0 0 2.22-1.8L20.25 6H6" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M8.25 20.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Zm8.25 0a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
    </svg>
)

const B2BIcon = ({ className }: IconProps) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M3.75 21h16.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M5.25 21V7.5A1.5 1.5 0 0 1 6.75 6h10.5a1.5 1.5 0 0 1 1.5 1.5V21" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.25} d="M9 10.5h1.5M13.5 10.5H15M9 14.25h1.5M13.5 14.25H15M11.25 21v-3h1.5v3" />
    </svg>
)

export default function OfferGrid({ copy }: OfferGridProps) {
    const sectionRef = useRef<HTMLElement | null>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const target = sectionRef.current
        if (!target) return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return
                setIsVisible(true)
                observer.disconnect()
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -8% 0px',
            }
        )

        observer.observe(target)

        return () => observer.disconnect()
    }, [])

    const cards = [
        {
            title: copy.offer.householdTitle,
            description: copy.offer.householdDescription,
            cta: copy.offerCtas.household,
            href: '/shop?category=kitchenware',
            Icon: HouseholdIcon,
        },
        {
            title: copy.offer.toolsTitle,
            description: copy.offer.toolsDescription,
            cta: copy.offerCtas.tools,
            href: '/shop?category=power-tools',
            Icon: ToolsIcon,
        },
        {
            title: copy.offer.b2cTitle,
            description: copy.offer.b2cDescription,
            cta: copy.offerCtas.b2c,
            href: '/shop',
            Icon: B2CIcon,
        },
        {
            title: copy.offer.b2bTitle,
            description: copy.offer.b2bDescription,
            cta: copy.offerCtas.b2b,
            href: '/auth/signup',
            Icon: B2BIcon,
        },
    ]

    return (
        <section ref={sectionRef} className="bg-gray-50 py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{copy.offerTitle}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cards.map(({ title, description, cta, href, Icon }, index) => (
                        <Link
                            key={title}
                            href={href}
                            className={`group relative flex h-full flex-col rounded-2xl bg-white p-8 shadow-[0_10px_30px_rgba(15,23,42,0.07)] transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.16)] ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
                                }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900/5 text-slate-900 transition-transform duration-300 group-hover:scale-105">
                                <Icon className="h-7 w-7" />
                            </div>

                            <h3 className="mb-3 text-xl font-semibold text-gray-900">{title}</h3>
                            <p className="text-gray-700 leading-relaxed">{description}</p>

                            <span className="featured-products-cta mt-auto self-start justify-start pt-6 text-left group-hover:text-[#0b2556]">
                                {cta}
                                <svg className="featured-products-cta-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}
