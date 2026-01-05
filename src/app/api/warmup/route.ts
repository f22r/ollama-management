import { NextRequest, NextResponse } from 'next/server';
import { warmupModel, unloadModel, getRunningModels, checkOllamaHealth, listModels } from '@/lib/ollama/client';
import { getAllWarmupConfigs, upsertWarmupConfig, getWarmupConfig, getAllModelMetadata, upsertModelMetadata } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// GET /api/warmup - Get warmup status and configs
export async function GET() {
    try {
        // Fetch models from Ollama to sync
        const modelsData = await listModels().catch(() => ({ models: [] }));

        // Sync models to DB
        if (modelsData.models) {
            for (const model of modelsData.models) {
                upsertModelMetadata({ name: model.name });
            }
        }

        const [health, runningResult, configs, metadata] = await Promise.all([
            checkOllamaHealth(),
            getRunningModels().catch(() => ({ models: [] })),
            getAllWarmupConfigs(),
            getAllModelMetadata(),
        ]);

        const runningModels = (runningResult.models || []).map(m => ({
            name: m.name,
            sizeVram: m.size_vram,
            expiresAt: m.expires_at,
        }));

        return NextResponse.json({
            ollamaConnected: health.ok,
            runningModels,
            configs,
            metadata,
        });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// POST /api/warmup - Warmup or unload a model
export async function POST(request: NextRequest) {
    try {
        const { action, model, payload } = await request.json();

        if (!action || !model) {
            return NextResponse.json({ error: 'Action and model required' }, { status: 400 });
        }

        switch (action) {
            case 'warmup': {
                const config = getWarmupConfig(model);
                const result = await warmupModel(model, payload || config?.warmupPayload);
                return NextResponse.json(result);
            }

            case 'unload': {
                const success = await unloadModel(model);
                return NextResponse.json({ success });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// PATCH /api/warmup - Update warmup config
export async function PATCH(request: NextRequest) {
    try {
        const config = await request.json();

        if (!config.model) {
            return NextResponse.json({ error: 'Model name required' }, { status: 400 });
        }

        upsertWarmupConfig({
            model: config.model,
            pingInterval: config.pingInterval || 0,
            warmupPayload: config.warmupPayload || '{"prompt": "hello", "num_predict": 1}',
            fallbackStrategy: config.fallbackStrategy || 'retry',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
