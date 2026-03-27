import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import AdminNav from '@/components/admin/AdminNav'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/auth/login?redirect=/admin')
    }

    // Check if user has admin role
    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (!userData || userData.role !== 'admin') {
        // Non-admin users trying to access admin panel
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-slate-50">
            <AdminNav userEmail={user.email || ''} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}
