'use client'

import { useEffect, useRef, useState } from 'react'

type WhyChooseCopy = {
    whyChooseTitle: string
    whyChooseFeatures: {
        catalogTitle: string
        catalogDescription: string
        pricingTitle: string
        pricingDescription: string
        deliveryTitle: string
        deliveryDescription: string
        supportTitle: string
        supportDescription: string
        qualityTitle: string
        qualityDescription: string
    }
}

type WhyChooseGridProps = {
    copy: WhyChooseCopy
}

type IconProps = {
    className?: string
}

const CatalogIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M3.75 6.75h16.5v10.5H3.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M9 6.75v10.5" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 11.25h5.25" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 14.25h3.75" />
    </svg>
)

const PricingIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M10.5 3.75h8.25a1.5 1.5 0 0 1 1.5 1.5v8.25a1.5 1.5 0 0 1-.44 1.06L12.56 21.8a1.5 1.5 0 0 1-2.12 0l-7.2-7.2a1.5 1.5 0 0 1 0-2.12L9.44 4.2a1.5 1.5 0 0 1 1.06-.45Z" />
        <circle cx="16.5" cy="7.5" r="1.35" strokeWidth={2.1} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M8.25 12h5.25" />
    </svg>
)

const DeliveryIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M2.25 7.5h11.25v7.5H2.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M13.5 10.5h3l2.25 2.25v2.25H13.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M6 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M16.5 18a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z" />
    </svg>
)

const SupportIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M4.5 12a7.5 7.5 0 0 1 15 0" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M4.5 12v4.5a2.25 2.25 0 0 0 2.25 2.25H9v-6.75H6.75A2.25 2.25 0 0 0 4.5 14.25" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M19.5 12v4.5a2.25 2.25 0 0 1-2.25 2.25H15v-6.75h2.25A2.25 2.25 0 0 1 19.5 14.25" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M9.75 19.5h4.5" />
    </svg>
)

const QualityIcon = ({ className }: IconProps) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="M12 3l7.5 3v6c0 5.25-3.75 8.25-7.5 9-3.75-.75-7.5-3.75-7.5-9V6L12 3Z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.1} d="m8.25 12.75 2.25 2.25 5.25-5.25" />
    </svg>
)

export default function WhyChooseGrid({ copy }: WhyChooseGridProps) {
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
                threshold: 0.2,
                rootMargin: '0px 0px -10% 0px',
            }
        )

        observer.observe(target)

        return () => observer.disconnect()
    }, [])

    const cards = [
        {
            title: copy.whyChooseFeatures.catalogTitle,
            description: copy.whyChooseFeatures.catalogDescription,
            Icon: CatalogIcon,
            layoutClass: 'md:col-span-2',
        },
        {
            title: copy.whyChooseFeatures.pricingTitle,
            description: copy.whyChooseFeatures.pricingDescription,
            Icon: PricingIcon,
            layoutClass: 'md:col-span-2',
        },
        {
            title: copy.whyChooseFeatures.deliveryTitle,
            description: copy.whyChooseFeatures.deliveryDescription,
            Icon: DeliveryIcon,
            layoutClass: 'md:col-span-2',
        },
        {
            title: copy.whyChooseFeatures.supportTitle,
            description: copy.whyChooseFeatures.supportDescription,
            Icon: SupportIcon,
            layoutClass: 'md:col-span-2 md:col-start-2',
        },
        {
            title: copy.whyChooseFeatures.qualityTitle,
            description: copy.whyChooseFeatures.qualityDescription,
            Icon: QualityIcon,
            layoutClass: 'md:col-span-2 md:col-start-4',
        },
    ]

    return (
        <section ref={sectionRef} className="bg-white py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">{copy.whyChooseTitle}</h2>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-6">
                    {cards.map(({ title, description, Icon, layoutClass }, index) => (
                        <article
                            key={title}
                            className={`group rounded-xl bg-gray-50 p-6 transition-all duration-300 ${layoutClass} ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                                } border border-transparent hover:border-[#163579]`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#163579]/8 text-[#163579]">
                                <Icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                            </div>

                            <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
                            <p className="text-slate-600 leading-relaxed">{description}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}
