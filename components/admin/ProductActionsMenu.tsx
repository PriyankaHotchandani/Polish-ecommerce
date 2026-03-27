'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ProductActionsMenuProps {
    productId: string
    productSlug: string
}

export default function ProductActionsMenu({ productId, productSlug }: ProductActionsMenuProps) {
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
        const confirmed = window.confirm('Delete this product? This action cannot be undone.')
        if (!confirmed) return

        setDeleting(true)
        try {
            const { error } = await supabase.from('products').delete().eq('id', productId)
            if (error) throw error

            setIsOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Failed to delete product', error)
            window.alert('Failed to delete product. Please try again.')
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
                aria-label="Open product actions"
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
                        href={`/admin/products/${productId}/edit`}
                        onClick={() => setIsOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        role="menuitem"
                    >
                        Edit Product
                    </Link>
                    <Link
                        href={`/product/${productSlug}`}
                        target="_blank"
                        onClick={() => setIsOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                        role="menuitem"
                    >
                        View in Store
                    </Link>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="block w-full border-t border-slate-100 px-3.5 py-2.5 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        role="menuitem"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            )}
        </div>
    )
}
