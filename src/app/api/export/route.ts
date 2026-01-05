import { NextRequest, NextResponse } from 'next/server';
import { getPreset, getRagSeason, getRagChunks } from '@/lib/db/queries';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
        return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    try {
        if (type === 'preset') {
            const preset = getPreset(id);
            if (!preset) return NextResponse.json({ error: 'Preset not found' }, { status: 404 });

            const exportData = {
                type: 'preset',
                version: 1,
                data: {
                    name: preset.name,
                    model: preset.model,
                    season: preset.season,
                    systemPrompt: preset.systemPrompt,
                    temperature: preset.temperature,
                    topP: preset.topP,
                    topK: preset.topK,
                    numCtx: preset.numCtx,
                }
            };

            const filename = `preset-${preset.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

            return new NextResponse(JSON.stringify(exportData, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        }

        if (type === 'season') {
            const season = getRagSeason(id);
            if (!season) return NextResponse.json({ error: 'Season not found' }, { status: 404 });

            const chunks = getRagChunks(id);

            const exportData = {
                type: 'season',
                version: 1,
                data: {
                    name: season.name,
                    model: season.model,
                    promptPolicy: season.promptPolicy
                },
                chunks: chunks.map(c => ({
                    source: c.source,
                    content: c.content,
                    approved: c.approved
                }))
            };

            const filename = `season-${season.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

            return new NextResponse(JSON.stringify(exportData, null, 2), {
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Disposition': `attachment; filename="${filename}"`
                }
            });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Export failed' }, { status: 500 });
    }
}
