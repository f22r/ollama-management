import { NextResponse } from 'next/server';
import { getChatSessions, createChatSession } from '@/lib/db/queries';

export async function GET() {
    try {
        const sessions = getChatSessions();
        return NextResponse.json({ sessions });
    } catch (error) {
        console.error('Failed to get chat sessions:', error);
        return NextResponse.json({ error: 'Failed to get chat sessions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { model, title, systemPrompt, temperature, topP, topK, numCtx, seasonId } = body;

        if (!model) {
            return NextResponse.json({ error: 'Model is required' }, { status: 400 });
        }

        const session = createChatSession({ model, title, systemPrompt, temperature, topP, topK, numCtx, seasonId });
        return NextResponse.json({ session });
    } catch (error) {
        console.error('Failed to create chat session:', error);
        return NextResponse.json({ error: 'Failed to create chat session' }, { status: 500 });
    }
}
