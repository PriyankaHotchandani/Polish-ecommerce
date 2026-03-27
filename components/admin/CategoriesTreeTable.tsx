'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface CategoryInput {
    id: string
    name: string
    slug: string
    parent_id: string | null
    products?: Array<{ count?: number | null }>
}

interface CategoryNode {
    id: string
    name: string
    slug: string
    parent_id: string | null
    productCount: number
}

interface CategoriesTreeTableProps {
    categories: CategoryInput[]
}

function DragHandleIcon() {
    return (
        <svg className="h-4 w-4 text-slate-400" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="5" cy="3" r="1" />
            <circle cx="11" cy="3" r="1" />
            <circle cx="5" cy="8" r="1" />
            <circle cx="11" cy="8" r="1" />
            <circle cx="5" cy="13" r="1" />
            <circle cx="11" cy="13" r="1" />
        </svg>
    )
}

function CategoryActionsMenu({ categoryId, categorySlug }: { categoryId: string; categorySlug: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    const handleDelete = async () => {
        const confirmed = window.confirm('Delete this category? This can fail if it has child categories or linked products.')
        if (!confirmed) return

        setDeleting(true)
        try {
            const { error } = await supabase.from('categories').delete().eq('id', categoryId)
            if (error) throw error

            setIsOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Failed to delete category', error)
            window.alert('Failed to delete category. Remove linked child categories/products first.')
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="relative inline-flex" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label="Open category actions"
            >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.75" />
                    <circle cx="12" cy="12" r="1.75" />
                    <circle cx="12" cy="19" r="1.75" />
                </svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 z-20 mt-9 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.14)]">
                    <Link
                        href={`/admin/categories/${categoryId}/edit`}
                        onClick={() => setIsOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Edit Category
                    </Link>
                    <Link
                        href={`/admin/products?category=${categoryId}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        View Products
                    </Link>
                    <Link
                        href={`/shop?category=${categorySlug}`}
                        target="_blank"
                        onClick={() => setIsOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        View in Store
                    </Link>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="block w-full border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            )}
        </div>
    )
}

export default function CategoriesTreeTable({ categories }: CategoriesTreeTableProps) {
    const supabase = createClient()
    const router = useRouter()
    const [nodes, setNodes] = useState<CategoryNode[]>(() =>
        categories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            parent_id: category.parent_id,
            productCount: Number(category.products?.[0]?.count || 0),
        }))
    )

    const [draggingId, setDraggingId] = useState<string | null>(null)
    const [dropTargetId, setDropTargetId] = useState<string | null>(null)
    const [reparenting, setReparenting] = useState(false)

    const childrenMap = useMemo(() => {
        const map: Record<string, CategoryNode[]> = {}

        for (const node of nodes) {
            const key = node.parent_id || 'ROOT'
            if (!map[key]) map[key] = []
            map[key].push(node)
        }

        for (const key of Object.keys(map)) {
            map[key].sort((a, b) => a.name.localeCompare(b.name))
        }

        return map
    }, [nodes])

    const descendantsById = useMemo(() => {
        const cache = new Map<string, Set<string>>()

        const collect = (id: string): Set<string> => {
            if (cache.has(id)) return cache.get(id) as Set<string>

            const directChildren = childrenMap[id] || []
            const result = new Set<string>()
            for (const child of directChildren) {
                result.add(child.id)
                const nested = collect(child.id)
                for (const nestedId of nested) {
                    result.add(nestedId)
                }
            }

            cache.set(id, result)
            return result
        }

        for (const node of nodes) {
            collect(node.id)
        }

        return cache
    }, [childrenMap, nodes])

    const flattenedRows = useMemo(() => {
        const out: Array<{ node: CategoryNode; depth: number; parentName: string | null }> = []

        const walk = (parentId: string | null, depth: number, parentName: string | null) => {
            const key = parentId || 'ROOT'
            const children = childrenMap[key] || []

            for (const child of children) {
                out.push({ node: child, depth, parentName })
                walk(child.id, depth + 1, child.name)
            }
        }

        walk(null, 0, null)
        return out
    }, [childrenMap])

    const handleDrop = async (newParentId: string | null) => {
        if (!draggingId || reparenting) return
        if (draggingId === newParentId) return

        const descendants = descendantsById.get(draggingId)
        if (newParentId && descendants?.has(newParentId)) {
            window.alert('Cannot move a category into its own descendant.')
            return
        }

        const previousNodes = nodes
        setReparenting(true)
        setNodes((current) => current.map((node) => (node.id === draggingId ? { ...node, parent_id: newParentId } : node)))

        try {
            const { error } = await supabase
                .from('categories')
                .update({ parent_id: newParentId, updated_at: new Date().toISOString() })
                .eq('id', draggingId)

            if (error) throw error
            router.refresh()
        } catch (error) {
            console.error('Failed to move category', error)
            setNodes(previousNodes)
            window.alert('Failed to move category. Please try again.')
        } finally {
            setReparenting(false)
            setDraggingId(null)
            setDropTargetId(null)
        }
    }

    if (nodes.length === 0) {
        return null
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-3">
                <div
                    className={`rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors ${dropTargetId === 'ROOT'
                        ? 'border-[#163579] bg-[#163579]/8 text-[#163579]'
                        : 'border-slate-300 text-slate-500'
                        }`}
                    onDragOver={(event) => {
                        event.preventDefault()
                        setDropTargetId('ROOT')
                    }}
                    onDragLeave={() => setDropTargetId((current) => (current === 'ROOT' ? null : current))}
                    onDrop={(event) => {
                        event.preventDefault()
                        handleDrop(null)
                    }}
                >
                    Drag and drop categories to reorganize hierarchy. Drop here to move a category to root level.
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="w-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">&nbsp;</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Parent</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Slug</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Products</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {flattenedRows.map(({ node, depth, parentName }) => {
                            const isDragging = draggingId === node.id
                            const isDropTarget = dropTargetId === node.id && draggingId !== node.id
                            const lineOffset = depth * 24

                            return (
                                <tr
                                    key={node.id}
                                    draggable
                                    onDragStart={() => setDraggingId(node.id)}
                                    onDragEnd={() => {
                                        setDraggingId(null)
                                        setDropTargetId(null)
                                    }}
                                    onDragOver={(event) => {
                                        event.preventDefault()
                                        setDropTargetId(node.id)
                                    }}
                                    onDragLeave={() => setDropTargetId((current) => (current === node.id ? null : current))}
                                    onDrop={(event) => {
                                        event.preventDefault()
                                        handleDrop(node.id)
                                    }}
                                    className={`transition ${isDragging ? 'opacity-90 shadow-lg' : ''} ${isDropTarget ? 'bg-[#163579]/6' : 'hover:bg-gray-50'}`}
                                >
                                    <td className="px-4 py-4 align-middle">
                                        <span className="inline-flex cursor-grab items-center justify-center active:cursor-grabbing">
                                            <DragHandleIcon />
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 align-middle">
                                        <div className="relative flex items-center gap-2" style={{ paddingLeft: `${lineOffset}px` }}>
                                            {depth > 0 && (
                                                <span
                                                    className="pointer-events-none absolute h-4 w-4 border-b border-l border-slate-300"
                                                    style={{ left: `${Math.max(6, lineOffset - 12)}px`, top: '50%', transform: 'translateY(-55%)' }}
                                                    aria-hidden="true"
                                                />
                                            )}
                                            <span className={`text-sm ${depth === 0 ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'}`}>
                                                {node.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 align-middle text-sm text-slate-600">{parentName || 'Root'}</td>
                                    <td className="px-4 py-4 align-middle text-sm font-mono text-slate-700">{node.slug}</td>
                                    <td className="px-4 py-4 align-middle">
                                        <Link
                                            href={`/admin/products?category=${node.id}`}
                                            className="inline-flex rounded-full border border-[#163579]/20 bg-[#163579]/8 px-3 py-1 text-xs font-semibold text-[#163579] transition-colors hover:bg-[#163579]/14"
                                        >
                                            {node.productCount} products
                                        </Link>
                                    </td>
                                    <td className="px-4 py-4 text-right align-middle">
                                        <CategoryActionsMenu categoryId={node.id} categorySlug={node.slug} />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
