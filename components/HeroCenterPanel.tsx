'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const subtext = 'Quality supplies to build, fix, and live well.'

export default function HeroCenterPanel() {
    const [typedText, setTypedText] = useState('')
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        let timeoutId: ReturnType<typeof setTimeout>
        let currentIndex = 0
        let deleting = false

        const tick = () => {
            timeoutId = setTimeout(() => {
                if (!deleting) {
                    currentIndex += 1
                    setTypedText(subtext.slice(0, currentIndex))
                    setIsDeleting(false)

                    if (currentIndex === subtext.length) {
                        deleting = true
                        tick()
                        return
                    }

                    tick()
                    return
                }

                currentIndex -= 1
                setTypedText(subtext.slice(0, currentIndex))
                setIsDeleting(true)

                if (currentIndex === 0) {
                    deleting = false
                }

                tick()
            }, deleting ? (currentIndex === subtext.length ? 1500 : 22) : (currentIndex === 0 ? 320 : 38))
        }

        setTypedText('')
        tick()

        return () => clearTimeout(timeoutId)
    }, [])

    return (
        <div className="hero-center-panel">
            <div className="hero-center-bg" aria-hidden="true" />
            <div className="hero-center-grain" aria-hidden="true" />
            <div className="hero-center-bloom" aria-hidden="true" />
            <div className="hero-center-rings" aria-hidden="true" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-14 text-center text-white sm:px-8 sm:py-16">
                <div className="hero-main-content">
                    <p className="hero-brand-kicker">Curated supply house</p>
                    <div className="hero-brand-name">BM SP. Z O.O.</div>
                    <div className="hero-center-divider" aria-hidden="true" />

                    <h2 className="hero-headline">Everything You Need</h2>

                    <p className="hero-tagline-copy hero-typed-copy" aria-live="polite">
                        {typedText}
                        <span className={`hero-typed-cursor${isDeleting ? ' is-soft' : ''}`} aria-hidden="true">|</span>
                    </p>

                    <Link href="/shop" className="hero-cta-btn">
                        <span>Shop All Products</span>
                        <span className="hero-cta-arrow" aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
