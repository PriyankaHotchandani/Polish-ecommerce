import { cookies } from 'next/headers'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'

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
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">{copy.title}</h1>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{copy.storyTitle}</h2>
                    <p className="text-gray-700 leading-relaxed mb-4">{copy.storyParagraph1}</p>
                    <p className="text-gray-700 leading-relaxed">{copy.storyParagraph2}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{copy.missionTitle}</h2>
                    <p className="text-gray-700 leading-relaxed">{copy.missionParagraph}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{copy.offerTitle}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{copy.offer.householdTitle}</h3>
                            <p className="text-gray-700 text-sm">{copy.offer.householdDescription}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{copy.offer.toolsTitle}</h3>
                            <p className="text-gray-700 text-sm">{copy.offer.toolsDescription}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{copy.offer.b2cTitle}</h3>
                            <p className="text-gray-700 text-sm">{copy.offer.b2cDescription}</p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{copy.offer.b2bTitle}</h3>
                            <p className="text-gray-700 text-sm">{copy.offer.b2bDescription}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{copy.whyChooseTitle}</h2>
                    <ul className="space-y-3">
                        {copy.bullets.map((item: string) => (
                            <li key={item} className="flex items-start">
                                <svg className="h-6 w-6 text-green-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="text-gray-700">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}
