import { NextRequest, NextResponse } from 'next/server';
import { listModels, deleteModel, warmupModel, unloadModel, getRunningModels } from '@/lib/ollama/client';
import {
    getAllModelMetadata,
    upsertModelMetadata,
    setDefaultModel as setDefault,
    getModelMetadata
} from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// GET /api/models - List all models with metadata
export async function GET() {
    try {
        const [modelsResult, runningResult, metadata] = await Promise.all([
            listModels(),
            getRunningModels().catch(() => ({ models: [] })),
            getAllModelMetadata(),
        ]);

        const runningNames = new Set((runningResult.models || []).map(m => m.name));
        const metadataMap = new Map(metadata.map(m => [m.name, m]));

        const models = (modelsResult.models || []).map(model => ({
            ...model,
            isRunning: runningNames.has(model.name),
            metadata: metadataMap.get(model.name) || null,
        }));

        return NextResponse.json({ models });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// DELETE /api/models - Delete a model
export async function DELETE(request: NextRequest) {
    try {
        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Model name required' }, { status: 400 });
        }

        await deleteModel(name);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// PATCH /api/models - Update model metadata
export async function PATCH(request: NextRequest) {
    try {
        const data = await request.json();
        const { name, action, ...metadata } = data;

        if (!name) {
            return NextResponse.json({ error: 'Model name required' }, { status: 400 });
        }

        switch (action) {
            case 'set-default':
                setDefault(name);
                return NextResponse.json({ success: true });

            case 'warmup':
                const warmupResult = await warmupModel(name, metadata.payload);
                return NextResponse.json(warmupResult);

            case 'unload':
                const unloadResult = await unloadModel(name);
                return NextResponse.json({ success: unloadResult });

            case 'update-metadata':
                upsertModelMetadata({ name, ...metadata });
                return NextResponse.json({ success: true });

            default:
                upsertModelMetadata({ name, ...metadata });
                return NextResponse.json({ success: true });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
