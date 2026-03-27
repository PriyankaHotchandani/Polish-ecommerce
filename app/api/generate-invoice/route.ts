import { NextResponse } from 'next/server'

export async function POST() {
    return NextResponse.json(
        {
            error: 'Automated invoice generation is disabled. Invoices must be uploaded and sent by an admin.',
        },
        { status: 410 }
    )
}
