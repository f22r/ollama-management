import { NextRequest, NextResponse } from 'next/server';
import {
    getRagSeasons,
    createRagSeason,
    updateRagSeason,
    deleteRagSeason,
    getRagChunks,
    createRagChunk,
    approveRagChunk,
    deleteRagChunk,
    getApprovalQueue,
    addToApprovalQueue,
    approveFromQueue,
    rejectFromQueue,
    approveAllFromQueue,
} from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

// GET /api/rag - Get seasons, chunks, or queue
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const model = searchParams.get('model') || undefined;
        const seasonId = searchParams.get('seasonId') || undefined;
        const type = searchParams.get('type') || 'seasons';

        switch (type) {
            case 'seasons':
                return NextResponse.json({ seasons: getRagSeasons(model) });

            case 'chunks':
                if (!seasonId) {
                    return NextResponse.json({ error: 'Season ID required' }, { status: 400 });
                }
                const approvedOnly = searchParams.get('approved') === 'true';
                return NextResponse.json({ chunks: getRagChunks(seasonId, approvedOnly) });

            case 'queue':
                return NextResponse.json({ queue: getApprovalQueue(seasonId) });

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// POST /api/rag - Create season, chunk, or add to queue
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { type } = data;

        switch (type) {
            case 'season': {
                const { model, name, promptPolicy = '' } = data;
                if (!model || !name) {
                    return NextResponse.json({ error: 'Model and name required' }, { status: 400 });
                }
                const season = createRagSeason({ model, name, promptPolicy });
                return NextResponse.json({ season });
            }

            case 'chunk': {
                const { seasonId, content, source = 'manual', approved = false } = data;
                if (!seasonId || !content) {
                    return NextResponse.json({ error: 'Season ID and content required' }, { status: 400 });
                }
                const chunk = createRagChunk({ seasonId, content, source, approved });
                return NextResponse.json({ chunk });
            }

            case 'queue': {
                const { seasonId, content, source = 'chat' } = data;
                if (!seasonId || !content) {
                    return NextResponse.json({ error: 'Season ID and content required' }, { status: 400 });
                }
                const id = addToApprovalQueue(seasonId, content, source);
                return NextResponse.json({ id });
            }

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// PATCH /api/rag - Update season, approve chunk/queue item
export async function PATCH(request: NextRequest) {
    try {
        const data = await request.json();
        const { type, id } = data;

        switch (type) {
            case 'season': {
                const { name, promptPolicy } = data;
                updateRagSeason(id, { name, promptPolicy });
                return NextResponse.json({ success: true });
            }

            case 'approve-chunk': {
                approveRagChunk(id);
                return NextResponse.json({ success: true });
            }

            case 'approve-queue': {
                approveFromQueue(id);
                return NextResponse.json({ success: true });
            }

            case 'reject-queue': {
                rejectFromQueue(id);
                return NextResponse.json({ success: true });
            }

            case 'approve-all-queue': {
                const { seasonId } = data;
                approveAllFromQueue(seasonId);
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}

// DELETE /api/rag - Delete season or chunk
export async function DELETE(request: NextRequest) {
    try {
        const { type, id } = await request.json();

        switch (type) {
            case 'season':
                deleteRagSeason(id);
                return NextResponse.json({ success: true });

            case 'chunk':
                deleteRagChunk(id);
                return NextResponse.json({ success: true });

            default:
                return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
