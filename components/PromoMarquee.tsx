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
            <div className="pointer-events-auto mx-auto max-w-full overflow-hidden border-t border-[#4f7dff]/30 bg-[#0b1327] backdrop-blur-md shadow-[0_-4px_24px_rgba(15,23,42,0.28)]">
                <div className="relative flex h-11 items-center">
                    <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#0b1327] to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#0b1327] to-transparent z-10" />
                    <div className="flex animate-marquee whitespace-nowrap">
                        {/* Even number of identical copies so the -50% keyframe loops
                            seamlessly; enough copies to exceed any viewport width. */}
                        {[0, 1, 2, 3, 4, 5].map((copy) => (
                            <span
                                key={copy}
                                className="mx-8 text-base sm:text-lg font-semibold tracking-[0.08em] uppercase text-white"
                            >
                                {text}
                                <span className="mx-8 text-emerald-400">•</span>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
