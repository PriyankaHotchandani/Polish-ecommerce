import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import CategoriesTreeTable from '@/components/admin/CategoriesTreeTable'

export default async function AdminCategoriesPage() {
    const supabase = await createClient()

    const { data: categories, error } = await supabase
        .from('categories')
        .select(`
            *,
            parent:parent_id(name),
            products(count)
        `)
        .order('name')

    if (error) {
        console.error('Error fetching categories:', error)
    }

    const safeCategories = categories || []
    const rootCategories = safeCategories.filter((cat: any) => !cat.parent_id)
    const subcategoriesCount = safeCategories.length - rootCategories.length

    return (
        <div>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Category Management</h1>
                    <p className="text-gray-600 mt-2">Organize your product categories</p>
                </div>
                <Link
                    href="/admin/categories/new"
                    className="inline-flex h-10 items-center rounded-md border border-[#163579] bg-[#163579] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#122d67]"
                >
                    + Add Category
                </Link>
            </div>

            {/* Summary */}
            {safeCategories.length > 0 && (
                <div className="mb-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-slate-600">Total Categories</p>
                            <p className="text-2xl font-bold text-slate-900">{safeCategories.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Root Categories</p>
                            <p className="text-2xl font-bold text-slate-900">{rootCategories.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Subcategories</p>
                            <p className="text-2xl font-bold text-slate-900">{subcategoriesCount}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Categories List */}
            {safeCategories.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <p className="text-gray-500 text-lg">No categories found</p>
                    <Link
                        href="/admin/categories/new"
                        className="inline-block mt-4 px-6 py-2 rounded-lg bg-[#163579] text-white font-semibold hover:bg-[#122d67] transition-colors"
                    >
                        Create First Category
                    </Link>
                </div>
            ) : (
                <CategoriesTreeTable categories={safeCategories as any} />
            )}
        </div>
    )
}
