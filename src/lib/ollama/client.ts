import type {
    OllamaModelList,
    OllamaRunningModels,
    OllamaGenerateRequest,
    OllamaGenerateResponse,
    OllamaChatRequest,
    OllamaChatResponse,
    OllamaPullProgress,
} from '@/types';
import { logRequest, updateLastUsed } from '@/lib/db/queries';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Helper to estimate tokens (rough approximation: ~4 chars per token)
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// ==================== Core API Functions ====================

export async function listModels(): Promise<OllamaModelList> {
    const start = Date.now();
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!response.ok) {
            throw new Error(`Failed to list models: ${response.statusText}`);
        }
        const data = await response.json();
        logRequest({
            model: '',
            endpoint: '/api/tags',
            method: 'GET',
            payloadSize: 0,
            responseSize: JSON.stringify(data).length,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: null,
            parameters: '{}',
        });
        return data;
    } catch (error) {
        logRequest({
            model: '',
            endpoint: '/api/tags',
            method: 'GET',
            payloadSize: 0,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: String(error),
            parameters: '{}',
        });
        throw error;
    }
}

export async function getRunningModels(): Promise<OllamaRunningModels> {
    const start = Date.now();
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/ps`);
        if (!response.ok) {
            throw new Error(`Failed to get running models: ${response.statusText}`);
        }
        const data = await response.json();
        logRequest({
            model: '',
            endpoint: '/api/ps',
            method: 'GET',
            payloadSize: 0,
            responseSize: JSON.stringify(data).length,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: null,
            parameters: '{}',
        });
        return data;
    } catch (error) {
        logRequest({
            model: '',
            endpoint: '/api/ps',
            method: 'GET',
            payloadSize: 0,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: String(error),
            parameters: '{}',
        });
        throw error;
    }
}

export async function pullModel(
    modelName: string,
    onProgress?: (progress: OllamaPullProgress) => void
): Promise<void> {
    const start = Date.now();
    const payload = JSON.stringify({ name: modelName });

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });

        if (!response.ok) {
            throw new Error(`Failed to pull model: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const lines = decoder.decode(value).split('\n').filter(Boolean);
            for (const line of lines) {
                try {
                    const progress: OllamaPullProgress = JSON.parse(line);
                    onProgress?.(progress);
                } catch {
                    // Ignore parse errors
                }
            }
        }

        logRequest({
            model: modelName,
            endpoint: '/api/pull',
            method: 'POST',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: null,
            parameters: payload,
        });
    } catch (error) {
        logRequest({
            model: modelName,
            endpoint: '/api/pull',
            method: 'POST',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: String(error),
            parameters: payload,
        });
        throw error;
    }
}

export async function deleteModel(modelName: string): Promise<void> {
    const start = Date.now();
    const payload = JSON.stringify({ name: modelName });

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/delete`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });

        if (!response.ok) {
            throw new Error(`Failed to delete model: ${response.statusText}`);
        }

        logRequest({
            model: modelName,
            endpoint: '/api/delete',
            method: 'DELETE',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: null,
            parameters: payload,
        });
    } catch (error) {
        logRequest({
            model: modelName,
            endpoint: '/api/delete',
            method: 'DELETE',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: null,
            tokensEstimated: 0,
            error: String(error),
            parameters: payload,
        });
        throw error;
    }
}

export async function* generateStream(
    request: OllamaGenerateRequest
): AsyncGenerator<OllamaGenerateResponse> {
    const start = Date.now();
    let ttft: number | null = null;
    let totalTokens = 0;
    const payload = JSON.stringify({ ...request, stream: true });

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });

        if (!response.ok) {
            throw new Error(`Failed to generate: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (ttft === null) {
                ttft = Date.now() - start;
            }

            const lines = decoder.decode(value).split('\n').filter(Boolean);
            for (const line of lines) {
                try {
                    const chunk: OllamaGenerateResponse = JSON.parse(line);
                    totalTokens += estimateTokens(chunk.response);
                    yield chunk;
                } catch {
                    // Ignore parse errors
                }
            }
        }

        updateLastUsed(request.model);
        logRequest({
            model: request.model,
            endpoint: '/api/generate',
            method: 'POST',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: ttft,
            tokensEstimated: totalTokens,
            error: null,
            parameters: JSON.stringify(request.options || {}),
        });
    } catch (error) {
        logRequest({
            model: request.model,
            endpoint: '/api/generate',
            method: 'POST',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: ttft,
            tokensEstimated: totalTokens,
            error: String(error),
            parameters: JSON.stringify(request.options || {}),
        });
        throw error;
    }
}

export async function* chatStream(
    request: OllamaChatRequest
): AsyncGenerator<OllamaChatResponse> {
    const start = Date.now();
    let ttft: number | null = null;
    let totalTokens = 0;
    const payload = JSON.stringify({ ...request, stream: true });

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
        });

        if (!response.ok) {
            throw new Error(`Failed to chat: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('No response body');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (ttft === null) {
                ttft = Date.now() - start;
            }

            const lines = decoder.decode(value).split('\n').filter(Boolean);
            for (const line of lines) {
                try {
                    const chunk: OllamaChatResponse = JSON.parse(line);
                    if (chunk.message?.content) {
                        totalTokens += estimateTokens(chunk.message.content);
                    }
                    yield chunk;
                } catch {
                    // Ignore parse errors
                }
            }
        }

        updateLastUsed(request.model);
        logRequest({
            model: request.model,
            endpoint: '/api/chat',
            method: 'POST',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: ttft,
            tokensEstimated: totalTokens,
            error: null,
            parameters: JSON.stringify(request.options || {}),
        });
    } catch (error) {
        logRequest({
            model: request.model,
            endpoint: '/api/chat',
            method: 'POST',
            payloadSize: payload.length,
            responseSize: 0,
            latencyMs: Date.now() - start,
            ttftMs: ttft,
            tokensEstimated: totalTokens,
            error: String(error),
            parameters: JSON.stringify(request.options || {}),
        });
        throw error;
    }
}

// ==================== Keep-Alive & Warmup ====================

export async function warmupModel(
    modelName: string,
    payload?: string
): Promise<{ success: boolean; loadTime: number }> {
    const start = Date.now();
    const defaultPayload = { prompt: 'hello', num_predict: 1 };
    const requestPayload = payload ? JSON.parse(payload) : defaultPayload;

    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                ...requestPayload,
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Warmup failed: ${response.statusText}`);
        }

        await response.json();
        return { success: true, loadTime: Date.now() - start };
    } catch (error) {
        return { success: false, loadTime: Date.now() - start };
    }
}

export async function unloadModel(modelName: string): Promise<boolean> {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelName,
                keep_alive: 0,
                prompt: '',
            }),
        });

        return response.ok;
    } catch {
        return false;
    }
}

export async function checkOllamaHealth(): Promise<{ ok: boolean; latency: number }> {
    const start = Date.now();
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        return { ok: response.ok, latency: Date.now() - start };
    } catch {
        return { ok: false, latency: Date.now() - start };
    }
}
