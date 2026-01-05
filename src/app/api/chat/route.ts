import { NextRequest } from 'next/server';
import { chatStream } from '@/lib/ollama/client';
import { getRagChunks, getRagSeasons } from '@/lib/db/queries';
import { hybridSearch } from '@/lib/rag/hybrid-search';
import type { OllamaChatMessage, OllamaOptions } from '@/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    const body = await request.json();
    const {
        model,
        messages,
        systemPrompt,
        temperature,
        topP,
        topK,
        numCtx,
        keepAlive,
        seasonId,
    } = body;

    if (!model || !messages) {
        return new Response(JSON.stringify({ error: 'Model and messages required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const chatMessages: OllamaChatMessage[] = [];

    // --- RAG Context Injection ---
    let ragContext = '';

    if (seasonId) {
        // 1. Get the last user message for the search query
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

        if (lastUserMessage) {
            // 2. Fetch chunks from the season
            const chunks = getRagChunks(seasonId, true);

            if (chunks.length > 0) {
                // 3. Perform hybrid search
                // Use a default embedding model if not specified in env (though env is preferred)
                const embeddingModel = process.env.EMBEDDING_MODEL || 'nomic-embed-text';

                const documents = chunks.map(c => ({
                    id: c.id,
                    content: c.content,
                    source: c.source
                }));

                const results = await hybridSearch(lastUserMessage.content, documents, {
                    topK: 5,
                    useSemanticSearch: true,
                    embeddingModel,
                });

                // 4. Format context
                if (results.length > 0) {
                    ragContext = `
Use the following context to answer the user's question. If the answer is not in the context, say so, but try to be helpful based on the context provided.

CONTEXT:
${results.map(r => `--- Source: ${r.source || 'Unknown'} ---\n${r.content}`).join('\n\n')}

END OF CONTEXT
`;
                }
            }
        }
    }

    // Add system prompt if provided
    let finalSystemPrompt = systemPrompt || '';

    // If we have RAG context, we prepend or append it to the system prompt
    if (ragContext) {
        if (finalSystemPrompt) {
            finalSystemPrompt = `${finalSystemPrompt}\n\n${ragContext}`;
        } else {
            finalSystemPrompt = ragContext;
        }
    } else if (seasonId) {
        // Check if the season has a prompt policy if no explicit system prompt passed (optional optimization)
        // ideally the frontend passes the season's prompt policy as 'systemPrompt', 
        // but we can fallback here if needed. For now let's assume frontend handles basic system prompt.
    }

    if (finalSystemPrompt) {
        chatMessages.push({ role: 'system', content: finalSystemPrompt });
    }

    // Add user messages
    chatMessages.push(...messages);

    const options: OllamaOptions = {};
    if (temperature !== undefined) options.temperature = temperature;
    if (topP !== undefined) options.top_p = topP;
    if (topK !== undefined) options.top_k = topK;
    if (numCtx !== undefined) options.num_ctx = numCtx;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of chatStream({
                    model,
                    messages: chatMessages,
                    stream: true,
                    options,
                    keep_alive: keepAlive,
                })) {
                    controller.enqueue(encoder.encode(JSON.stringify(chunk) + '\n'));
                }
                controller.close();
            } catch (error) {
                controller.enqueue(encoder.encode(JSON.stringify({ error: String(error) }) + '\n'));
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
