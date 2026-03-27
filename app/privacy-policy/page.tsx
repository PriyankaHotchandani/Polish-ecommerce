import { cookies } from 'next/headers'

type Locale = 'en' | 'pl'

export default async function PrivacyPolicyPage() {
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'

    const copy = locale === 'pl'
        ? {
            title: 'Polityka prywatności',
            intro: 'Szanujemy Twoją prywatność i chronimy dane osobowe.',
            points: [
                'Przetwarzamy dane wyłącznie w celach realizacji zamówień i obsługi konta.',
                'Nie sprzedajemy danych osobowych podmiotom trzecim.',
                'Masz prawo do wglądu, poprawiania i usunięcia swoich danych.',
            ],
        }
        : {
            title: 'Privacy Policy',
            intro: 'We respect your privacy and protect personal data.',
            points: [
                'We process data only to fulfill orders and support your account.',
                'We do not sell personal data to third parties.',
                'You have the right to access, correct, and request deletion of your data.',
            ],
        }

    return (
        <main className="min-h-screen bg-gray-50 pt-28 pb-16">
            <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 rounded-xl bg-white p-8 border border-slate-200">
                <h1 className="text-4xl font-bold text-slate-900">{copy.title}</h1>
                <p className="mt-4 text-slate-600">{copy.intro}</p>
                <ul className="mt-6 space-y-3 text-slate-700">
                    {copy.points.map((point) => (
                        <li key={point} className="flex items-start">
                            <span className="mr-3 mt-1.5 h-2 w-2 rounded-full bg-slate-900" />
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    )
}
