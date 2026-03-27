import { cookies } from 'next/headers'

type Locale = 'en' | 'pl'

export default async function ReturnsPage() {
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'

    const copy = locale === 'pl'
        ? {
            title: 'Zwroty',
            intro: 'Chcemy, aby zakupy były bezpieczne i wygodne.',
            points: [
                'Klienci detaliczni mogą zwrócić produkt w ciągu 14 dni od odbioru.',
                'Produkty powinny być kompletne i w stanie nienaruszonym.',
                'W celu zgłoszenia zwrotu skontaktuj się z działem wsparcia.',
            ],
        }
        : {
            title: 'Returns',
            intro: 'We want your shopping experience to feel safe and convenient.',
            points: [
                'Retail customers can return products within 14 days of delivery.',
                'Products should be complete and in original condition.',
                'To start a return, please contact our support team.',
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
