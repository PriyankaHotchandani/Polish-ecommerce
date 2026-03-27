'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface UserActionsMenuProps {
    userId: string
    userEmail: string
}

export default function UserActionsMenu({ userId, userEmail }: UserActionsMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement | null>(null)

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

    return (
        <div className="relative inline-flex" ref={menuRef}>
            <button
                type="button"
                onClick={() => setIsOpen((current) => !current)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-label="Open user actions"
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
                        href={`/admin/users/${userId}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        View Details
                    </Link>
                    <a
                        href={`mailto:${userEmail}`}
                        onClick={() => setIsOpen(false)}
                        className="block px-3.5 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
                    >
                        Send Email
                    </a>
                </div>
            )}
        </div>
    )
}
