'use client';

import { useEffect, useState, useRef } from 'react';
import { Button, Select, Textarea, Input } from '@/components/ui';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { OllamaModel, Preset, ChatSession, ChatMessage, RagSeason } from '@/types';

// Icons
const IconSend = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
);

const IconStop = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
);

const IconPlus = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const IconX = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconSettings = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
);

const IconMenu = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const IconCopy = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
);

const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const IconTrash = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconChat = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
);

// Thinking/Reasoning Icons
const IconChevronDown = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
);

const IconChevronRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
);

const IconBrain = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const IconBookPlus = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h4" />
    </svg>
);

const IconGlobe = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

const IconPaperclip = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
);

// Thinking Component
const ThinkingBlock = ({ content, isStreaming }: { content: string, isStreaming?: boolean }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="thinking-block mb-md">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-xs text-muted hover-text-primary transition-colors"
                style={{ fontSize: '0.85rem', marginBottom: 'var(--space-xs)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
                {isExpanded ? <IconChevronDown /> : <IconChevronRight />}
                <IconBrain />
                <span>Thinking Process</span>
            </button>

            {isExpanded && (
                <div
                    className="p-md animate-fadeIn"
                    style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderLeft: '2px solid var(--color-accent)',
                        borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                        fontSize: '0.9rem',
                        color: 'var(--color-text-secondary)',
                        whiteSpace: 'pre-wrap',
                        fontStyle: 'italic'
                    }}
                >
                    {content}
                    {isStreaming && <span className="animate-pulse">_</span>}
                </div>
            )}
        </div>
    );
};

// Message Content Renderer
const FormattedMessage = ({ content, isStreaming }: { content: string, isStreaming?: boolean }) => {
    // Robust parsing for <think> tags (handling potential whitespace or case)
    const startTagRegex = /<\s*think\s*>/i;
    const endTagRegex = /<\s*\/\s*think\s*>/i;

    const startMatch = content.match(startTagRegex);
    const endMatch = content.match(endTagRegex);

    if (startMatch) {
        const startIndex = startMatch.index!;
        const startTagLength = startMatch[0].length;

        let endIndex = content.length;
        let endTagLength = 0;

        if (endMatch) {
            endIndex = endMatch.index!;
            endTagLength = endMatch[0].length;
        }

        const thinkingContent = content.substring(startIndex + startTagLength, endIndex);

        // Main content is everything before the start tag + everything after the end tag
        const beforeContent = content.substring(0, startIndex);
        const afterContent = endMatch ? content.substring(endIndex + endTagLength) : '';
        const mainContent = (beforeContent + afterContent).trim();

        // Check if we are still strictly in thinking mode (start tag exists, end tag doesn't)
        const isStrictlyThinking = !endMatch;

        return (
            <div>
                {/* Always render thinking block if start tag is found */}
                <ThinkingBlock content={thinkingContent} isStreaming={isStrictlyThinking && isStreaming} />

                {/* Render main content if it exists */}
                {mainContent && (
                    <div className="markdown-content mt-md">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{mainContent}</ReactMarkdown>
                    </div>
                )}

                {/* If no main content yet, but we have finished thinking, show nothing or placeholder? */}
                {/* If strictly thinking and streaming, ThinkingBlock handles the cursor. */}
            </div>
        );
    }

    // Fallback: Check for escaped tags just in case
    if (content.includes('&lt;think&gt;')) {
        // ... (Similar logic could be applied if needed, but usually API returns raw)
    }

    return (
        <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    );
};

// Typing indicator component
function TypingIndicator() {
    return (
        <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
        </div>
    );
}

// Format relative time
// Format to WIB (GMT+7)
function formatToWIB(dateStr: string): string {
    return new Date(dateStr).toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

export default function ChatPage() {
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [presets, setPresets] = useState<Preset[]>([]);
    const [seasons, setSeasons] = useState<RagSeason[]>([]); // New state
    const [selectedModel, setSelectedModel] = useState<string>('');
    const [selectedSeason, setSelectedSeason] = useState<string>(''); // New state
    const [renderThinking, setRenderThinking] = useState(true); // Toggle state

    // Enhanced Capabilities
    const [useWebSearch, setUseWebSearch] = useState(false);
    const [uploadedContext, setUploadedContext] = useState<{ name: string; text: string } | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sessions
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    const [input, setInput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [addedToQueueId, setAddedToQueueId] = useState<string | null>(null);

    const addToKnowledgeBase = async (content: string, messageId: string) => {
        if (!selectedSeason) {
            alert('Please select a RAG Season first (top right selector) to add this message to the queue.');
            return;
        }

        try {
            const res = await fetch('/api/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'queue',
                    seasonId: selectedSeason,
                    content: content,
                    source: 'chat-playground'
                })
            });

            if (res.ok) {
                setAddedToQueueId(messageId);
                setTimeout(() => setAddedToQueueId(null), 2000);
            } else {
                console.error('Failed to add to queue');
            }
        } catch (error) {
            console.error('Error adding to queue:', error);
        }
    };

    // Parameters
    const [systemPrompt, setSystemPrompt] = useState('');
    const [temperature, setTemperature] = useState(0.7);
    const [topP, setTopP] = useState(0.9);
    const [topK, setTopK] = useState(40);
    const [numCtx, setNumCtx] = useState(4096);
    const [showParams, setShowParams] = useState(false);
    const [showSessions, setShowSessions] = useState(true);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchModels();
        fetchPresets();
        fetchSeasons(); // New fetch
        fetchSessions();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamContent]);

    const fetchModels = async () => {
        try {
            const res = await fetch('/api/models');
            if (res.ok) {
                const data = await res.json();
                setModels(data.models || []);
                if (data.models?.length && !selectedModel) {
                    setSelectedModel(data.models[0].name);
                }
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        }
    };

    const fetchPresets = async () => {
        try {
            const res = await fetch('/api/presets');
            if (res.ok) {
                const data = await res.json();
                setPresets(data.presets || []);
            }
        } catch (error) {
            console.error('Failed to fetch presets:', error);
        }
    };

    const fetchSeasons = async () => {
        try {
            const res = await fetch('/api/rag?type=seasons');
            if (res.ok) {
                const data = await res.json();
                setSeasons(data.seasons || []);
            }
        } catch (error) {
            console.error('Failed to fetch seasons:', error);
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/chat-sessions');
            if (res.ok) {
                const data = await res.json();
                setSessions(data.sessions || []);
                if (data.sessions?.length && !activeSessionId) {
                    loadSession(data.sessions[0].id);
                }
            }
        } catch (error) {
            console.error('Failed to fetch sessions:', error);
        }
    };

    const loadSession = async (sessionId: string) => {
        try {
            const res = await fetch(`/api/chat-sessions/${sessionId}`);
            if (res.ok) {
                const data = await res.json();
                setActiveSessionId(sessionId);
                setMessages(data.messages || []);
                if (data.session) {
                    setSelectedModel(data.session.model);
                    setSelectedSeason(data.session.seasonId || ''); // Load season
                    setSystemPrompt(data.session.systemPrompt || '');
                    setTemperature(data.session.temperature);
                    setTopP(data.session.topP);
                    setTopK(data.session.topK);
                    setNumCtx(data.session.numCtx);
                }
                inputRef.current?.focus();
            }
        } catch (error) {
            console.error('Failed to load session:', error);
        }
    };

    const createNewSession = async () => {
        if (!selectedModel) return;
        try {
            const res = await fetch('/api/chat-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    seasonId: selectedSeason || undefined, // Send season
                    systemPrompt,
                    temperature,
                    topP,
                    topK,
                    numCtx
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(prev => [data.session, ...prev]);
                setActiveSessionId(data.session.id);
                setMessages([]);
                inputRef.current?.focus();
            }
        } catch (error) {
            console.error('Failed to create session:', error);
        }
    };

    const deleteSession = async (sessionId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await fetch(`/api/chat-sessions/${sessionId}`, { method: 'DELETE' });
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            if (activeSessionId === sessionId) {
                const remaining = sessions.filter(s => s.id !== sessionId);
                if (remaining.length > 0) {
                    loadSession(remaining[0].id);
                } else {
                    setActiveSessionId(null);
                    setMessages([]);
                }
            }
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const loadPreset = (presetId: string) => {
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setSystemPrompt(preset.systemPrompt);
            setTemperature(preset.temperature);
            setTopP(preset.topP);
            setTopK(preset.topK);
            setNumCtx(preset.numCtx);
        }
    };

    const copyMessage = async (content: string, id: string) => {
        await navigator.clipboard.writeText(content);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (res.ok) {
                const data = await res.json();
                setUploadedContext({ name: data.filename, text: data.text });
            } else {
                console.error('Upload failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const performWebSearch = async (query: string) => {
        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            if (res.ok) {
                const data = await res.json();
                return data.results.map((r: any) =>
                    `Source: [${r.title}](${r.link})\nContent:\n${r.content || r.snippet}`
                ).join('\n\n---\n\n');
            }
        } catch (error) {
            console.error('Search error:', error);
        }
        return '';
    };

    const sendMessage = async () => {
        if (!input.trim() || !selectedModel || isStreaming) return;

        if (!activeSessionId) {
            // New Session Logic
            let initialSystemPrompt = systemPrompt;
            // (Wait, we can't easily injection search into system prompt before creating session unless we do it here)
            // But search depends on user input.
            // Simplified: We will just prepend to user content for the first message.
        }

        // Execute Logic
        const originalUserContent = input.trim();
        let contextPrefix = '';

        if (useWebSearch) {
            const results = await performWebSearch(originalUserContent);
            if (results) {
                contextPrefix += `Internet Search Results:\n${results}\n\n`;
            }
        }

        if (uploadedContext) {
            contextPrefix += `Context from uploaded file (${uploadedContext.name}):\n${uploadedContext.text}\n\n`;
            setUploadedContext(null); // Clear after sending
        }

        if (!activeSessionId) {
            const res = await fetch('/api/chat-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    seasonId: selectedSeason || undefined,
                    systemPrompt,
                    temperature,
                    topP,
                    topK,
                    numCtx
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(prev => [data.session, ...prev]);
                setActiveSessionId(data.session.id);
                // We pass the ENHANCED content
                await sendMessageToSession(data.session.id, data.session.seasonId, originalUserContent, contextPrefix);
            }
        } else {
            await sendMessageToSession(activeSessionId, selectedSeason, originalUserContent, contextPrefix);
        }
    };

    const sendMessageToSession = async (sessionId: string, sessionSeasonId: string | undefined, userContent: string, contextPrefix: string) => {
        // 1. Save ORIGINAL content to DB (User History)
        await fetch(`/api/chat-sessions/${sessionId}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role: 'user', content: userContent }),
        });

        const userMessage: ChatMessage = {
            id: crypto.randomUUID(),
            sessionId,
            role: 'user',
            content: userContent,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsStreaming(true);
        setStreamContent('');

        abortControllerRef.current = new AbortController();

        // 3. Prepare LLM Payload with Context
        const messagesForLLM = [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
        }));

        // Inject context into the LAST message (current user message) for the LLM ONLY
        if (contextPrefix) {
            const lastMsg = messagesForLLM[messagesForLLM.length - 1];
            lastMsg.content = `Context:\n${contextPrefix}\n\nUser Question:\n${userContent}`;
        }

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    seasonId: sessionSeasonId, // Include seasonId in chat request
                    messages: messagesForLLM,
                    // Inject thinking instruction if enabled
                    systemPrompt: renderThinking
                        ? (systemPrompt ? `${systemPrompt}\n\n` : '') + 'IMPORTANT: You are a reasoning model. You MUST output your internal thought process enclosed in <think>...</think> tags. You MUST close the tag with </think> BEFORE starting your final answer. Example: <think>My thought process...</think> Final Answer.'
                        : systemPrompt,
                    temperature,
                    topP,
                    topK,
                    numCtx,
                }),
                signal: abortControllerRef.current.signal,
            });

            if (!response.ok) throw new Error('Chat failed');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const lines = decoder.decode(value).split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const chunk = JSON.parse(line);
                        if (chunk.message?.content) {
                            fullContent += chunk.message.content;
                            setStreamContent(fullContent);
                        }
                    } catch {
                        // Ignore parse errors
                    }
                }
            }

            await fetch(`/api/chat-sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'assistant', content: fullContent }),
            });

            const assistantMessage: ChatMessage = {
                id: crypto.randomUUID(),
                sessionId,
                role: 'assistant',
                content: fullContent,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, assistantMessage]);
            setStreamContent('');
            fetchSessions();
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Chat error:', error);
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const stopGeneration = () => {
        abortControllerRef.current?.abort();
    };

    const clearChat = async () => {
        if (activeSessionId) {
            await fetch(`/api/chat-sessions/${activeSessionId}/messages`, { method: 'DELETE' });
        }
        setMessages([]);
        setStreamContent('');
    };

    const activeSession = sessions.find(s => s.id === activeSessionId);

    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 3rem)', gap: 'var(--space-lg)' }}>
            {/* Sessions Sidebar */}
            {showSessions && (
                <div className="card animate-slideInLeft" style={{ width: 280, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}>
                    <div style={{ padding: 'var(--space-md) var(--space-lg)', borderBottom: '1px solid var(--glass-border)' }}>
                        <div className="flex items-center justify-between">
                            <h3 style={{ fontSize: '0.9rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                Chat History
                            </h3>
                            <Button variant="ghost" size="sm" onClick={createNewSession} title="New Chat">
                                <IconPlus />
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-xs" style={{ flex: 1, overflow: 'auto', padding: 'var(--space-md)' }}>
                        {sessions.length === 0 ? (
                            <div className="text-muted text-center" style={{ fontSize: '0.8rem', padding: 'var(--space-lg)' }}>
                                No conversations yet.
                                <br />Start chatting to create one!
                            </div>
                        ) : (
                            sessions.map((session, idx) => (
                                <div
                                    key={session.id}
                                    onClick={() => loadSession(session.id)}
                                    className="hover-bg"
                                    style={{
                                        padding: 'var(--space-sm) var(--space-md)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        backgroundColor: session.id === activeSessionId ? 'var(--color-accent-muted)' : 'transparent',
                                        border: session.id === activeSessionId ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 'var(--space-xs)',
                                        transition: 'all var(--transition-fast)',
                                        animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`,
                                    }}
                                >
                                    <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                                        <div style={{
                                            fontSize: '0.85rem',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            fontWeight: session.id === activeSessionId ? 500 : 400,
                                        }}>
                                            {session.title}
                                        </div>
                                        <div className="flex items-center gap-xs" style={{ marginTop: '2px' }}>
                                            <span className="badge badge-default" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>
                                                {session.model.split(':')[0]}
                                            </span>
                                            <span className="text-muted" style={{ fontSize: '0.65rem' }}>
                                                {formatToWIB(session.updatedAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => deleteSession(session.id, e)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: '4px',
                                            cursor: 'pointer',
                                            opacity: 0.4,
                                            color: 'var(--color-text-secondary)',
                                            transition: 'all var(--transition-fast)',
                                            borderRadius: 'var(--radius-sm)',
                                        }}
                                        className="hover-bg"
                                        title="Delete"
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
                                    >
                                        <IconX />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Header */}
                <div className="page-header animate-fadeInDown" style={{ marginBottom: 'var(--space-md)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-md">
                            <Button variant="ghost" onClick={() => setShowSessions(!showSessions)}>
                                <IconMenu />
                            </Button>
                            <div>
                                <h1 className="page-title" style={{ fontSize: '1.5rem' }}>Chat Playground</h1>
                                <p className="page-description">
                                    {activeSession ? (
                                        <span className="flex items-center gap-xs">
                                            <span className="status-dot online" style={{ width: 6, height: 6 }}></span>
                                            {activeSession.model}
                                        </span>
                                    ) : 'Select or start a new conversation'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-sm">
                            <Select
                                options={[
                                    { value: '', label: 'No Season (Pure Model)' },
                                    ...seasons.map(s => ({ value: s.id, label: `🍂 ${s.name}` }))
                                ]}
                                value={selectedSeason}
                                onChange={(e) => setSelectedSeason(e.target.value)}
                                style={{ width: 180 }}
                                title="RAG Season"
                            />
                            <Select
                                options={models.map(m => ({ value: m.name, label: m.name }))}
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                style={{ width: 200 }}
                            />

                            <div style={{ width: 1, backgroundColor: 'var(--glass-border)', height: '24px', alignSelf: 'center', margin: '0 4px' }} />

                            <Button
                                variant="ghost"
                                onClick={() => setRenderThinking(!renderThinking)}
                                className={renderThinking ? 'text-accent' : 'text-muted'}
                                title={renderThinking ? "Hide Thought Process" : "Show Thought Process"}
                            >
                                <IconBrain />
                            </Button>

                            <Button variant="ghost" onClick={() => setShowParams(!showParams)} className={showParams ? 'active' : ''}>
                                <IconSettings />
                            </Button>
                            <Button variant="secondary" onClick={clearChat}>
                                <IconTrash />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="card" style={{ flex: 1, overflow: 'auto', padding: 'var(--space-lg)' }}>
                    {messages.length === 0 && !streamContent ? (
                        <div className="empty-state">
                            <IconChat />
                            <h3>Start a conversation</h3>
                            <p className="text-muted">Select a model and send a message to begin</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-md">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`chat-message ${msg.role}`}
                                >
                                    <div className="chat-message-role">
                                        {msg.role === 'user' ? '👤 You' : '🤖 Assistant'}
                                    </div>
                                    <div className="chat-message-content">
                                        {msg.role === 'assistant' && renderThinking ? (
                                            <FormattedMessage content={msg.content} />
                                        ) : (
                                            msg.content
                                        )}
                                    </div>
                                    <div className="message-actions">
                                        <button
                                            className="btn btn-ghost btn-sm icon-btn"
                                            onClick={() => addToKnowledgeBase(msg.content, msg.id)}
                                            title="Add to Knowledge Base Queue"
                                            style={{ color: addedToQueueId === msg.id ? 'var(--color-accent)' : undefined }}
                                        >
                                            {addedToQueueId === msg.id ? <IconCheck /> : <IconBookPlus />}
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm icon-btn"
                                            onClick={() => copyMessage(msg.content, msg.id)}
                                            title="Copy message"
                                        >
                                            {copiedId === msg.id ? <IconCheck /> : <IconCopy />}
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {isStreaming && streamContent && (
                                <div className="chat-message assistant">
                                    <div className="chat-message-role">🤖 Assistant</div>
                                    <div className="chat-message-content">
                                        {renderThinking ? (
                                            <FormattedMessage content={streamContent} isStreaming={true} />
                                        ) : (
                                            streamContent
                                        )}
                                    </div>
                                </div>
                            )}
                            {isStreaming && !streamContent && (
                                <div className="chat-message assistant" style={{ paddingTop: 'var(--space-sm)', paddingBottom: 'var(--space-sm)' }}>
                                    <TypingIndicator />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>

                {/* Input with Toolbar */}
                <div className="flex flex-col gap-xs mt-md animate-fadeInUp" style={{ animationDelay: '0.2s', background: 'var(--color-bg-card)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}>

                    {/* Toolbar */}
                    <div className="flex justify-between items-center px-sm">
                        <div className="flex gap-sm">
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleUpload}
                                accept=".pdf,.txt,.md"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading || isStreaming}
                                className={uploadedContext ? 'text-success' : ''}
                                title={uploadedContext ? `Attached: ${uploadedContext.name}` : "Upload Document"}
                            >
                                {isUploading ? <div className="spinner" /> : <IconPaperclip />}
                                {uploadedContext && <span style={{ fontSize: '0.75rem', marginLeft: 4 }}>{uploadedContext.name}</span>}
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUseWebSearch(!useWebSearch)}
                                className={useWebSearch ? 'text-accent' : ''}
                                title={useWebSearch ? "Web Search Enabled" : "Enable Web Search"}
                                style={{
                                    background: useWebSearch ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                                    border: useWebSearch ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent'
                                }}
                            >
                                <IconGlobe /> <span style={{ fontSize: '0.75rem' }}>Web</span>
                            </Button>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                            {input.length} chars
                        </div>
                    </div>

                    <div className="flex gap-sm">
                        <textarea
                            ref={inputRef as any}
                            className="input"
                            style={{
                                border: 'none',
                                background: 'transparent',
                                boxShadow: 'none',
                                resize: 'none',
                                height: 'auto',
                                minHeight: '40px',
                                maxHeight: '200px',
                                padding: '8px 0'
                            }}
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            disabled={isStreaming}
                            rows={1}
                        />
                        <div className="flex gap-xs items-end">
                            <Button
                                onClick={() => sendMessage()}
                                disabled={!input.trim() || isStreaming || !selectedModel}
                                variant="primary"
                                size="icon"
                                loading={isStreaming}
                            >
                                {!isStreaming && <IconSend />}
                            </Button>
                            {isStreaming && (
                                <Button onClick={stopGeneration} variant="danger" size="icon">
                                    <IconStop />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Parameters Panel */}
            {showParams && (
                <div className="card animate-slideInRight" style={{ width: 320, overflow: 'auto' }}>
                    <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <IconSettings />
                        Parameters
                    </h3>

                    <div className="flex flex-col gap-lg">
                        <Select
                            label="Load Preset"
                            options={[
                                { value: '', label: 'Select preset...' },
                                ...presets.filter(p => p.model === selectedModel || !selectedModel).map(p => ({ value: p.id, label: p.name })),
                            ]}
                            onChange={(e) => loadPreset(e.target.value)}
                        />

                        <Textarea
                            label="System Prompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={4}
                            placeholder="You are a helpful assistant..."
                        />

                        <div>
                            <label className="label flex justify-between">
                                <span>Temperature</span>
                                <span className="font-mono text-accent">{temperature}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="2"
                                step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                            />
                            <div className="flex justify-between text-muted" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                                <span>Precise</span>
                                <span>Creative</span>
                            </div>
                        </div>

                        <div>
                            <label className="label flex justify-between">
                                <span>Top P</span>
                                <span className="font-mono text-accent">{topP}</span>
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={topP}
                                onChange={(e) => setTopP(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--color-accent)' }}
                            />
                        </div>

                        <Input
                            label="Top K"
                            type="number"
                            value={topK}
                            onChange={(e) => setTopK(parseInt(e.target.value))}
                        />

                        <Input
                            label="Context Length"
                            type="number"
                            value={numCtx}
                            onChange={(e) => setNumCtx(parseInt(e.target.value))}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
