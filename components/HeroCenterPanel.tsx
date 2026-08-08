'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

type Locale = 'en' | 'pl'

interface HeroCenterPanelProps {
    locale: Locale
}

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

export default function HeroCenterPanel({ locale }: HeroCenterPanelProps) {
    const copy = MESSAGES[locale].home.hero
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
                    setTypedText(copy.centerSubtext.slice(0, currentIndex))
                    setIsDeleting(false)

                    if (currentIndex === copy.centerSubtext.length) {
                        deleting = true
                        tick()
                        return
                    }

                    tick()
                    return
                }

                currentIndex -= 1
                setTypedText(copy.centerSubtext.slice(0, currentIndex))
                setIsDeleting(true)

                if (currentIndex === 0) {
                    deleting = false
                }

                tick()
            }, deleting ? (currentIndex === copy.centerSubtext.length ? 1500 : 22) : (currentIndex === 0 ? 320 : 38))
        }

        tick()

        return () => clearTimeout(timeoutId)
    }, [copy.centerSubtext])

    return (
        <div className="hero-center-panel">
            <div className="hero-center-bg" aria-hidden="true" />
            <div className="hero-center-grain" aria-hidden="true" />
            <div className="hero-center-bloom" aria-hidden="true" />
            <div className="hero-center-rings" aria-hidden="true" />

            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 py-14 text-center text-white sm:px-8 sm:py-16">
                <div className="hero-main-content">
                    <p className="hero-brand-kicker">{copy.centerKicker}</p>
                    <div className="hero-brand-name">
                        <span className="hero-brand-logo-badge">
                            <img
                                src="/logos/bmspzoo-trim.png"
                                alt="BM Sp. z o.o."
                                className="hero-brand-logo-badge-img"
                            />
                        </span>
                    </div>
                    <div className="hero-center-divider" aria-hidden="true" />

                    <h2 className="hero-headline">{copy.centerHeadline}</h2>

                    {/* translate="no" keeps browser auto-translate from rewrapping this
                        continuously-updating text node, which would crash React with a
                        removeChild error. */}
                    <p className="hero-tagline-copy hero-typed-copy notranslate" aria-live="polite" translate="no">
                        <span className="notranslate" translate="no">{typedText}</span>
                        <span className={`hero-typed-cursor${isDeleting ? ' is-soft' : ''}`} aria-hidden="true">|</span>
                    </p>

                    <Link href="/shop" className="hero-cta-btn">
                        <span>{copy.centerCta}</span>
                        <span className="hero-cta-arrow" aria-hidden="true">→</span>
                    </Link>
                </div>
            </div>
        </div>
    )
}
