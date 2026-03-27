import { cookies } from 'next/headers'

type Locale = 'en' | 'pl'

export default async function ShippingPolicyPage() {
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'

    const copy = locale === 'pl'
        ? {
            title: 'Polityka wysyłki',
            intro: 'Realizujemy zamówienia na terenie całej Polski i Unii Europejskiej.',
            points: [
                'Standardowy czas wysyłki: 1-3 dni robocze dla produktów dostępnych w magazynie.',
                'Przy zamówieniach hurtowych termin dostawy ustalany jest indywidualnie.',
                'Po nadaniu przesyłki otrzymasz numer śledzenia e-mailem.',
            ],
        }
        : {
            title: 'Shipping Policy',
            intro: 'We ship orders across Poland and the European Union.',
            points: [
                'Standard delivery time: 1-3 business days for in-stock items.',
                'For wholesale orders, delivery dates are scheduled individually.',
                'You will receive a tracking number by email once your order ships.',
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
