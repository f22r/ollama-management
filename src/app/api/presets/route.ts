import { NextRequest, NextResponse } from 'next/server';
import { getPresets, createPreset, updatePreset, deletePreset } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// GET /api/presets - List presets
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const model = searchParams.get('model') || undefined;

        const presets = getPresets(model);
        return NextResponse.json({ presets });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// POST /api/presets - Create preset
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { model, season = 'default', name, systemPrompt = '', temperature = 0.7, topP = 0.9, topK = 40, numCtx = 4096 } = data;

        if (!model || !name) {
            return NextResponse.json({ error: 'Model and name required' }, { status: 400 });
        }

        const preset = createPreset({ model, season, name, systemPrompt, temperature, topP, topK, numCtx });
        return NextResponse.json({ preset });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// PATCH /api/presets - Update preset
export async function PATCH(request: NextRequest) {
    try {
        const { id, ...data } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
        }

        updatePreset(id, data);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// DELETE /api/presets - Delete preset
export async function DELETE(request: NextRequest) {
    try {
        const { id } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'Preset ID required' }, { status: 400 });
        }

        deletePreset(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
