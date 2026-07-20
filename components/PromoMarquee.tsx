'use client'

import { useLocaleMessages } from '@/contexts/LocaleContext'

export default function PromoMarquee() {
    const { messages } = useLocaleMessages()
    const text = messages.promoMarquee.discountTiers

    return (
        <div
            className="fixed bottom-0 inset-x-0 z-50 pointer-events-none"
            aria-hidden="true"
        >
            <div className="pointer-events-auto mx-auto max-w-full overflow-hidden border-t border-white/10 bg-[#0f172a]/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.18)]">
                <div className="relative flex h-9 items-center">
                    <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0f172a] to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0f172a] to-transparent z-10" />
                    <div className="flex animate-marquee whitespace-nowrap">
                        {[0, 1].map((copy) => (
                            <span
                                key={copy}
                                className="mx-8 text-[0.72rem] font-medium tracking-[0.12em] uppercase text-slate-300/90"
                            >
                                {text}
                                <span className="mx-8 text-emerald-400/80">•</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
