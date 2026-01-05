import { NextResponse } from 'next/server';
import { getSystemMetrics } from '@/lib/monitoring/system';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const metrics = await getSystemMetrics();
        return NextResponse.json(metrics);
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
