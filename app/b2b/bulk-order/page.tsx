import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import enMessages from '@/messages/en.json'
import plMessages from '@/messages/pl.json'
import BulkOrderWorkspace from '@/components/b2b/BulkOrderWorkspace'

type Locale = 'en' | 'pl'

const MESSAGES = {
    en: enMessages,
    pl: plMessages,
} as const

export default async function BulkOrderPage() {
    const supabase = await createClient()
    const cookieStore = await cookies()
    const locale: Locale = cookieStore.get('locale')?.value === 'pl' ? 'pl' : 'en'
    const copy = MESSAGES[locale].b2bPage.bulkOrder

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?redirect=/b2b/bulk-order')
    }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (!userData || (userData.role !== 'b2b_customer' && userData.role !== 'admin')) {
        redirect('/b2b')
    }

    return <BulkOrderWorkspace locale={locale} copy={copy} />
}
