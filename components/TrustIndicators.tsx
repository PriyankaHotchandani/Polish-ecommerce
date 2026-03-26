'use client'

import { useEffect, useRef, useState } from 'react'

interface TrustStat {
    value: string
    label: string
}

interface TrustIndicatorsProps {
    stats: TrustStat[]
}

export default function TrustIndicators({ stats }: TrustIndicatorsProps) {
    const sectionRef = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

        if (mediaQuery.matches) {
            setIsVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries
                if (entry?.isIntersecting) {
                    setIsVisible(true)
                    observer.disconnect()
                }
            },
            {
                threshold: 0.25,
            }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    return (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
            <div ref={sectionRef} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.06)]">
                <div className="grid grid-cols-2 divide-y divide-gray-200 sm:divide-y-0 md:grid-cols-4 md:divide-x">
                    {stats.map((stat, index) => (
                        <div
                            key={stat.label}
                            className={`px-6 py-8 text-center sm:px-8 motion-reduce:translate-y-0 motion-reduce:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
                                }`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="mb-2 text-4xl font-bold text-slate-950">{stat.value}</div>
                            <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
