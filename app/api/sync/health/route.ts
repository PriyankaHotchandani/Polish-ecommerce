import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/service'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type LatestRunRow = {
    status: 'success' | 'failed' | 'skipped_lock'
    created_at: string
    updated_rows: number
    inventory_rows_parsed: number
    info_rows_parsed: number
    error_message: string | null
}

type LatestSuccessRow = {
    created_at: string
}

function isAuthorized(request: NextRequest): boolean {
    const secret = process.env.INVENTORY_SYNC_SECRET || process.env.CRON_SECRET
    if (!secret) return false

    const authHeader = request.headers.get('authorization')
    if (authHeader === `Bearer ${secret}`) return true

    const syncHeader = request.headers.get('x-sync-secret')
    return syncHeader === secret
}

export async function GET(request: NextRequest) {
    if (!isAuthorized(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceClient()

    const { data: latestRunRaw, error: latestRunError } = await supabase
        .from('supplier_sync_runs')
        .select('status, created_at, updated_rows, inventory_rows_parsed, info_rows_parsed, error_message')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const latestRun = latestRunRaw as LatestRunRow | null

    if (latestRunError) {
        return NextResponse.json(
            {
                ok: false,
                error: `Failed to read latest sync run: ${latestRunError.message}`,
            },
            { status: 500 }
        )
    }

    const { data: latestSuccessRaw, error: latestSuccessError } = await supabase
        .from('supplier_sync_runs')
        .select('created_at')
        .eq('status', 'success')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    const latestSuccess = latestSuccessRaw as LatestSuccessRow | null

    if (latestSuccessError) {
        return NextResponse.json(
            {
                ok: false,
                error: `Failed to read latest successful sync run: ${latestSuccessError.message}`,
            },
            { status: 500 }
        )
    }

    if (!latestRun) {
        return NextResponse.json(
            {
                ok: false,
                healthy: false,
                reason: 'no_sync_runs',
            },
            { status: 404 }
        )
    }

    const lastRunAtMs = new Date(latestRun.created_at).getTime()
    const lastRunAgeMinutes = Math.max(0, Math.floor((Date.now() - lastRunAtMs) / 60000))
    const healthy = latestRun.status === 'success' && lastRunAgeMinutes <= 10

    return NextResponse.json({
        ok: true,
        healthy,
        latestRun: {
            status: latestRun.status,
            createdAt: latestRun.created_at,
            ageMinutes: lastRunAgeMinutes,
            updatedRows: latestRun.updated_rows,
            inventoryRowsParsed: latestRun.inventory_rows_parsed,
            infoRowsParsed: latestRun.info_rows_parsed,
            errorMessage: latestRun.error_message,
        },
        latestSuccessfulFetchAt: latestSuccess?.created_at || null,
    })
}
