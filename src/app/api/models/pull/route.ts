import { NextRequest } from 'next/server';
import { pullModel } from '@/lib/ollama/client';
import { upsertModelMetadata } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const { name } = await request.json();

    if (!name) {
        return new Response(JSON.stringify({ error: 'Model name required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                await pullModel(name, (progress) => {
                    controller.enqueue(encoder.encode(JSON.stringify(progress) + '\n'));
                });

                // Add model to metadata after successful pull
                upsertModelMetadata({ name });

                controller.enqueue(encoder.encode(JSON.stringify({ status: 'success', done: true }) + '\n'));
                controller.close();
            } catch (error) {
                controller.enqueue(encoder.encode(JSON.stringify({ status: 'error', error: String(error) }) + '\n'));
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}
