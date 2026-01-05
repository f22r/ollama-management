import { NextResponse } from 'next/server';
import { addChatMessage, clearChatMessages, getChatSession, updateChatSession } from '@/lib/db/queries';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { role, content } = body;

        if (!role || !content) {
            return NextResponse.json({ error: 'Role and content are required' }, { status: 400 });
        }

        const session = getChatSession(params.id);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const message = addChatMessage({ sessionId: params.id, role, content });

        // Update session title from first user message if still "New Chat"
        if (session.title === 'New Chat' && role === 'user') {
            const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
            updateChatSession(params.id, { title });
        }

        return NextResponse.json({ message });
    } catch (error) {
        console.error('Failed to add chat message:', error);
        return NextResponse.json({ error: 'Failed to add chat message' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        clearChatMessages(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to clear chat messages:', error);
        return NextResponse.json({ error: 'Failed to clear chat messages' }, { status: 500 });
    }
}
