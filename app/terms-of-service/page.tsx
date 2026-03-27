import { cookies } from 'next/headers'

type Locale = 'en' | 'pl'

export default async function TermsOfServicePage() {
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'

    const copy = locale === 'pl'
        ? {
            title: 'Regulamin',
            intro: 'Korzystanie ze sklepu oznacza akceptację poniższych zasad.',
            points: [
                'Ceny i dostępność produktów mogą ulegać zmianie bez uprzedzenia.',
                'Zamówienia hurtowe mogą podlegać indywidualnym warunkom handlowym.',
                'W przypadku pytań dotyczących warunków skontaktuj się z działem obsługi.',
            ],
        }
        : {
            title: 'Terms of Service',
            intro: 'By using the store, you agree to the following terms.',
            points: [
                'Product pricing and availability may change without prior notice.',
                'Wholesale orders may be subject to custom commercial terms.',
                'For questions regarding these terms, contact customer support.',
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
