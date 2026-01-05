import { NextResponse } from 'next/server';
import { getChatSession, getChatMessages, updateChatSession, deleteChatSession } from '@/lib/db/queries';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = getChatSession(params.id);
        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
        }

        const messages = getChatMessages(params.id);
        return NextResponse.json({ session, messages });
    } catch (error) {
        console.error('Failed to get chat session:', error);
        return NextResponse.json({ error: 'Failed to get chat session' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        updateChatSession(params.id, body);
        const session = getChatSession(params.id);
        return NextResponse.json({ session });
    } catch (error) {
        console.error('Failed to update chat session:', error);
        return NextResponse.json({ error: 'Failed to update chat session' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        deleteChatSession(params.id);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete chat session:', error);
        return NextResponse.json({ error: 'Failed to delete chat session' }, { status: 500 });
    }
}
