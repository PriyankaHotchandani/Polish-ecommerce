import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import OfferGrid from '@/components/about/OfferGrid'
import WhyChooseGrid from '@/components/about/WhyChooseGrid'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

export default async function AboutPage() {
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const copy = MESSAGES[locale].aboutPage as typeof enMessages.aboutPage

    return (
        <div className="min-h-screen bg-white">
            {/* Editorial Hero Section */}
            <section className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        {/* Left: Story Text */}
                        <div>
                            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                                {copy.storyTitle}
                            </h1>
                            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-justify">
                                {copy.storyParagraph1}
                            </p>
                            <p className="text-lg text-gray-700 leading-relaxed text-justify">
                                {copy.storyParagraph2}
                            </p>
                        </div>

                        {/* Right: Typographic Element / Image Placeholder */}
                        <div className="relative h-96 md:h-full flex items-center justify-center">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-9xl font-bold text-gray-100 select-none" style={{ wordWrap: 'break-word' }}>
                                    BM
                                </div>
                            </div>
                            <p className="relative text-center text-gray-500 text-sm max-w-xs px-4">
                                {copy.watermarkTagline}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Navy Mission Block */}
            <section className="bg-slate-900 text-white py-24">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-blue-200 text-sm font-semibold uppercase tracking-wide mb-4">{copy.missionTitle}</p>
                    <h2 className="text-4xl md:text-5xl font-bold leading-relaxed">
                        {copy.missionParagraph}
                    </h2>
                </div>
            </section>

            <OfferGrid copy={copy} />

            <WhyChooseGrid copy={copy} />
        </div>
    )
}
