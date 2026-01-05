// Ollama API Types

export interface OllamaModel {
    name: string;
    model: string;
    modified_at: string;
    size: number;
    digest: string;
    details: {
        parent_model: string;
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
}

export interface OllamaModelList {
    models: OllamaModel[];
}

export interface OllamaPullProgress {
    status: string;
    digest?: string;
    total?: number;
    completed?: number;
}

export interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    system?: string;
    template?: string;
    context?: number[];
    stream?: boolean;
    raw?: boolean;
    format?: string;
    options?: OllamaOptions;
    keep_alive?: string | number;
}

export interface OllamaGenerateResponse {
    model: string;
    created_at: string;
    response: string;
    done: boolean;
    context?: number[];
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaChatRequest {
    model: string;
    messages: OllamaChatMessage[];
    stream?: boolean;
    format?: string;
    options?: OllamaOptions;
    keep_alive?: string | number;
}

export interface OllamaChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
    images?: string[];
}

export interface OllamaChatResponse {
    model: string;
    created_at: string;
    message: OllamaChatMessage;
    done: boolean;
    total_duration?: number;
    load_duration?: number;
    prompt_eval_count?: number;
    prompt_eval_duration?: number;
    eval_count?: number;
    eval_duration?: number;
}

export interface OllamaOptions {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_ctx?: number;
    num_predict?: number;
    stop?: string[];
    seed?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
    mirostat?: number;
    mirostat_tau?: number;
    mirostat_eta?: number;
}

export interface OllamaRunningModel {
    name: string;
    model: string;
    size: number;
    digest: string;
    details: {
        parent_model: string;
        format: string;
        family: string;
        families: string[];
        parameter_size: string;
        quantization_level: string;
    };
    expires_at: string;
    size_vram: number;
}

export interface OllamaRunningModels {
    models: OllamaRunningModel[];
}

// Dashboard Types

export interface ModelMetadata {
    name: string;
    isDefault: boolean;
    lastUsed: string | null;
    keepAliveDuration: string;
    alwaysWarm: boolean;
    pingInterval: number;
}

export interface Preset {
    id: string;
    model: string;
    season: string;
    name: string;
    systemPrompt: string;
    temperature: number;
    topP: number;
    topK: number;
    numCtx: number;
}

export interface RagSeason {
    id: string;
    model: string;
    name: string;
    promptPolicy: string;
    createdAt: string;
}

export interface RagChunk {
    id: string;
    seasonId: string;
    content: string;
    source: string;
    approved: boolean;
    createdAt: string;
}

export interface RequestLog {
    id: string;
    timestamp: string;
    model: string;
    endpoint: string;
    method: string;
    payloadSize: number;
    responseSize: number;
    latencyMs: number;
    ttftMs: number | null;
    tokensEstimated: number;
    error: string | null;
    parameters: string;
}

export interface WarmupConfig {
    model: string;
    pingInterval: number;
    warmupPayload: string;
    fallbackStrategy: 'retry' | 'skip' | 'alert';
}

export interface SystemMetrics {
    timestamp: number;
    cpu: {
        usage: number;
        cores: number[];
    };
    memory: {
        used: number;
        total: number;
        usedPercent: number;
    };
    disk: {
        used: number;
        total: number;
        usedPercent: number;
    };
    network: {
        rx: number;
        tx: number;
    };
    gpu?: {
        name: string;
        memoryUsed: number;
        memoryTotal: number;
        utilization: number;
        temperature: number;
    };
}

export interface AnalyticsData {
    requestRate: { time: string; count: number }[];
    latencyPercentiles: { p50: number; p95: number; p99: number };
    ttftDistribution: { bucket: string; count: number }[];
    errorRate: number;
    totalRequests: number;
    totalTokens: number;
    avgPayloadSize: number;
}

export interface Alert {
    id: string;
    type: 'cpu' | 'memory' | 'disk' | 'gpu' | 'error';
    message: string;
    threshold: number;
    currentValue: number;
    timestamp: string;
    acknowledged: boolean;
}

export interface ChatSession {
    id: string;
    model: string;
    title: string;
    systemPrompt: string;
    temperature: number;
    topP: number;
    topK: number;
    numCtx: number;
    seasonId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatMessage {
    id: string;
    sessionId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

