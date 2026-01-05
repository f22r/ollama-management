import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, getRequestLogs, cleanOldLogs } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const hours = parseInt(searchParams.get('hours') || '24', 10);
        const page = parseInt(searchParams.get('page') || '0', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const includeLogs = searchParams.get('logs') === 'true';

        const analytics = getAnalytics(hours);

        let logs = null;
        if (includeLogs) {
            logs = getRequestLogs(limit, page * limit);
        }

        return NextResponse.json({ analytics, logs });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// POST /api/analytics - Clean old logs
export async function POST(request: NextRequest) {
    try {
        const { action, days } = await request.json();

        if (action === 'clean') {
            const retentionDays = days || parseInt(process.env.LOG_RETENTION_DAYS || '30', 10);
            cleanOldLogs(retentionDays);
            return NextResponse.json({ success: true, message: `Cleaned logs older than ${retentionDays} days` });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
