import { NextResponse } from 'next/server';
import { listModels, getRunningModels, checkOllamaHealth } from '@/lib/ollama/client';
import { getAllModelMetadata, getAnalytics } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [health, modelsResult, runningResult, metadata, analytics] = await Promise.all([
            checkOllamaHealth(),
            listModels().catch(() => ({ models: [] })),
            getRunningModels().catch(() => ({ models: [] })),
            getAllModelMetadata(),
            getAnalytics(24),
        ]);

        return NextResponse.json({
            ollama: {
                connected: health.ok,
                latency: health.latency,
            },
            models: modelsResult.models || [],
            runningModels: (runningResult.models || []).map(m => m.name),
            metadata,
            analytics: {
                totalRequests: analytics.totalRequests,
                errorRate: analytics.errorRate,
                latencyP50: analytics.latencyPercentiles.p50,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to get dashboard status' },
            { status: 500 }
        );
    }
}
