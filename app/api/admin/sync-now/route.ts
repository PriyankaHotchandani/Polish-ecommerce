import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

async function verifyAdmin() {
    const supabase = await createClient()
    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { supabase, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
    }

    const { data: currentUser, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (userError) {
        return {
            supabase,
            error: NextResponse.json({ error: `Failed to verify admin role: ${userError.message}` }, { status: 500 }),
        }
    }

    if (currentUser?.role !== 'admin') {
        return { supabase, error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
    }

    return { supabase, error: null }
}

export async function POST(request: NextRequest) {
    const { error } = await verifyAdmin()

    if (error) {
        return error
    }

    const secret = process.env.INVENTORY_SYNC_SECRET || process.env.CRON_SECRET
    if (!secret) {
        return NextResponse.json({ error: 'Missing inventory sync secret' }, { status: 500 })
    }

    const syncUrl = new URL('/api/sync/inventory?mode=inventory', request.url)
    const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${secret}`,
            'Content-Type': 'application/json',
        },
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
        return NextResponse.json(
            {
                error: payload?.error || 'Inventory sync failed',
                details: payload,
            },
            { status: response.status }
        )
    }

    return NextResponse.json({
        ok: true,
        synced: true,
        message: `Inventory sync completed. ${payload?.updatedRows ?? 0} products updated.`,
        details: payload,
    })
}