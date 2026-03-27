import { cookies } from 'next/headers'

type Locale = 'en' | 'pl'

export default async function ContactPage() {
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'

    const copy = locale === 'pl'
        ? {
            title: 'Kontakt',
            subtitle: 'Skontaktuj się z naszym zespołem.',
            emailLabel: 'E-mail',
            email: 'support@bm-spzoo.pl',
            phoneLabel: 'Telefon',
            phone: '+48 22 000 00 00',
            hoursLabel: 'Godziny pracy',
            hours: 'Poniedziałek - Piątek, 8:00 - 18:00',
        }
        : {
            title: 'Contact Us',
            subtitle: 'Get in touch with our team.',
            emailLabel: 'Email',
            email: 'support@bm-spzoo.pl',
            phoneLabel: 'Phone',
            phone: '+48 22 000 00 00',
            hoursLabel: 'Working Hours',
            hours: 'Monday - Friday, 8:00 AM - 6:00 PM',
        }

    return (
        <main className="min-h-screen bg-gray-50 pt-28 pb-16">
            <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                <h1 className="text-4xl font-bold text-slate-900">{copy.title}</h1>
                <p className="mt-3 text-slate-600">{copy.subtitle}</p>

                <div className="mt-10 grid gap-6 sm:grid-cols-3">
                    <article className="rounded-xl bg-white p-6 border border-slate-200">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{copy.emailLabel}</h2>
                        <p className="mt-2 text-slate-900">{copy.email}</p>
                    </article>
                    <article className="rounded-xl bg-white p-6 border border-slate-200">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{copy.phoneLabel}</h2>
                        <p className="mt-2 text-slate-900">{copy.phone}</p>
                    </article>
                    <article className="rounded-xl bg-white p-6 border border-slate-200">
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{copy.hoursLabel}</h2>
                        <p className="mt-2 text-slate-900">{copy.hours}</p>
                    </article>
                </div>
            </section>
        </main>
    )
}
