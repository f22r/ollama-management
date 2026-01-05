import { create } from 'zustand';
import type { OllamaModel, ModelMetadata, SystemMetrics, Preset, RagSeason, Alert } from '@/types';

// ==================== Dashboard Store ====================

interface DashboardState {
    // Models
    models: OllamaModel[];
    modelMetadata: Map<string, ModelMetadata>;
    runningModels: string[];
    setModels: (models: OllamaModel[]) => void;
    setModelMetadata: (metadata: ModelMetadata[]) => void;
    setRunningModels: (models: string[]) => void;

    // Selected model
    selectedModel: string | null;
    setSelectedModel: (model: string | null) => void;

    // System metrics
    systemMetrics: SystemMetrics | null;
    setSystemMetrics: (metrics: SystemMetrics) => void;

    // Ollama status
    ollamaConnected: boolean;
    setOllamaConnected: (connected: boolean) => void;

    // Alerts
    alerts: Alert[];
    setAlerts: (alerts: Alert[]) => void;
    addAlert: (alert: Alert) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
    models: [],
    modelMetadata: new Map(),
    runningModels: [],
    setModels: (models) => set({ models }),
    setModelMetadata: (metadata) => {
        const map = new Map<string, ModelMetadata>();
        metadata.forEach(m => map.set(m.name, m));
        set({ modelMetadata: map });
    },
    setRunningModels: (models) => set({ runningModels: models }),

    selectedModel: null,
    setSelectedModel: (model) => set({ selectedModel: model }),

    systemMetrics: null,
    setSystemMetrics: (metrics) => set({ systemMetrics: metrics }),

    ollamaConnected: false,
    setOllamaConnected: (connected) => set({ ollamaConnected: connected }),

    alerts: [],
    setAlerts: (alerts) => set({ alerts }),
    addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts].slice(0, 50) })),
}));

// ==================== Chat Store ====================

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: number;
}

interface ChatState {
    messages: ChatMessage[];
    isStreaming: boolean;
    currentStreamContent: string;
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    updateStreamContent: (content: string) => void;
    setIsStreaming: (streaming: boolean) => void;
    clearMessages: () => void;

    // Parameters
    systemPrompt: string;
    temperature: number;
    topP: number;
    topK: number;
    numCtx: number;
    setSystemPrompt: (prompt: string) => void;
    setTemperature: (temp: number) => void;
    setTopP: (topP: number) => void;
    setTopK: (topK: number) => void;
    setNumCtx: (ctx: number) => void;
    loadPreset: (preset: Preset) => void;
}

export const useChatStore = create<ChatState>((set) => ({
    messages: [],
    isStreaming: false,
    currentStreamContent: '',
    addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
            ...message,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        }],
    })),
    updateStreamContent: (content) => set({ currentStreamContent: content }),
    setIsStreaming: (streaming) => set({ isStreaming: streaming, currentStreamContent: streaming ? '' : '' }),
    clearMessages: () => set({ messages: [], currentStreamContent: '' }),

    systemPrompt: '',
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    numCtx: 4096,
    setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),
    setTemperature: (temp) => set({ temperature: temp }),
    setTopP: (topP) => set({ topP }),
    setTopK: (topK) => set({ topK }),
    setNumCtx: (ctx) => set({ numCtx: ctx }),
    loadPreset: (preset) => set({
        systemPrompt: preset.systemPrompt,
        temperature: preset.temperature,
        topP: preset.topP,
        topK: preset.topK,
        numCtx: preset.numCtx,
    }),
}));

// ==================== RAG Store ====================

interface RagState {
    seasons: RagSeason[];
    selectedSeasonId: string | null;
    setSeasons: (seasons: RagSeason[]) => void;
    setSelectedSeasonId: (id: string | null) => void;
}

export const useRagStore = create<RagState>((set) => ({
    seasons: [],
    selectedSeasonId: null,
    setSeasons: (seasons) => set({ seasons }),
    setSelectedSeasonId: (id) => set({ selectedSeasonId: id }),
}));
