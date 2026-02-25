import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

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

    // Group categories by parent (for tree structure)
    const rootCategories = categories?.filter(cat => !cat.parent_id) || []
    const getChildren = (parentId: string) => {
        return categories?.filter(cat => cat.parent_id === parentId) || []
    }

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
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                    + Add Category
                </Link>
            </div>

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                {!categories || categories.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-gray-500 text-lg">No categories found</p>
                        <Link
                            href="/admin/categories/new"
                            className="inline-block mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Create First Category
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Category Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Parent
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Slug
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Products
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {rootCategories.map((category: any) => (
                                    <>
                                        {/* Parent Category */}
                                        <tr key={category.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-gray-900">
                                                    📁 {category.name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                —
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                                                {category.slug}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {category.products[0]?.count || 0} products
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                <Link
                                                    href={`/admin/categories/${category.id}/edit`}
                                                    className="text-green-600 hover:text-green-900 font-medium"
                                                >
                                                    Edit
                                                </Link>
                                            </td>
                                        </tr>

                                        {/* Child Categories */}
                                        {getChildren(category.id).map((child: any) => (
                                            <tr key={child.id} className="hover:bg-gray-50 bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 pl-8">
                                                        └─ {child.name}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                    {category.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-700">
                                                    {child.slug}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-3 py-1 inline-flex text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {child.products[0]?.count || 0} products
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                                    <Link
                                                        href={`/admin/categories/${child.id}/edit`}
                                                        className="text-green-600 hover:text-green-900 font-medium"
                                                    >
                                                        Edit
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            {categories && categories.length > 0 && (
                <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Categories</p>
                            <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Root Categories</p>
                            <p className="text-2xl font-bold text-gray-900">{rootCategories.length}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Subcategories</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {categories.length - rootCategories.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
