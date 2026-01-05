'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Select, Textarea } from '@/components/ui';
import type { OllamaModel, ChatMessage, RagSeason } from '@/types';

// Icons
const IconRobot = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2a2 2 0 012 2v2a2 2 0 01-2 2 2 2 0 01-2-2V4a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14h6" />
    </svg>
);

const IconSend = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
);

const IconCheck = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const IconDatabase = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
);

const IconTerminal = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
);

const IconSparkles = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.813 1.912a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.813-1.912a2 2 0 001.272-1.272L12 3z" />
    </svg>
);

export default function TrainingPage() {
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [seasons, setSeasons] = useState<RagSeason[]>([]);
    const [selectedModel, setSelectedModel] = useState('');
    const [selectedSeason, setSelectedSeason] = useState('');

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saving' | 'saved' | 'error' | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchResources = async () => {
            try {
                const [modelsRes, seasonsRes] = await Promise.all([
                    fetch('/api/models'),
                    fetch('/api/rag?type=seasons')
                ]);

                if (modelsRes.ok) {
                    const data = await modelsRes.json();
                    setModels(data.models || []);
                    if (data.models && data.models.length > 0) {
                        setSelectedModel(data.models[0].name);
                    }
                }

                if (seasonsRes.ok) {
                    const data = await seasonsRes.json();
                    setSeasons(data.seasons || []);
                    if (data.seasons && data.seasons.length > 0) {
                        setSelectedSeason(data.seasons[0].id);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch resources:', error);
            }
        };
        fetchResources();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim() || !selectedModel || !selectedSeason) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            sessionId: 'training',
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        setAutoSaveStatus(null);

        const systemPrompt = `You are a strict Data Formatter for a RAG Knowledge Base.
        Your goal is to accept the user's raw text data and format it into clean, well-structured markdown chunks.
        Rules:
        1. Do NOT chat with the user.
        2. Do NOT add conversational fillers like "Here is the formatted text" or "Sure".
        3. Output ONLY the formatted content.
        4. Use headers, bullet points, and code blocks where appropriate to make the data retrieval-friendly.
        5. If the user provides a list of Q&A, format them clearly.`;

        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: selectedModel,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages.map(m => ({ role: m.role, content: m.content })),
                        { role: 'user', content: userMsg.content }
                    ],
                    temperature: 0.3,
                }),
            });

            if (!res.ok) throw new Error(res.statusText);
            if (!res.body) throw new Error('No response body');

            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            const assistantMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                sessionId: 'training',
                timestamp: new Date().toISOString()
            }]);

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue;
                    try {
                        const json = JSON.parse(line.slice(6));
                        if (json.message?.content) {
                            assistantContent += json.message.content;
                            setMessages(prev => prev.map(m =>
                                m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                            ));
                        }
                    } catch (e) {/* ignore parse errors */ }
                }
            }

            await addToQueue(assistantContent);

        } catch (error) {
            console.error('Chat failed:', error);
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Error: Failed to process request.',
                sessionId: 'training',
                timestamp: new Date().toISOString()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const addToQueue = async (content: string) => {
        setAutoSaveStatus('saving');
        try {
            const res = await fetch('/api/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'queue',
                    seasonId: selectedSeason,
                    content: content,
                    source: 'AI Training'
                }),
            });
            if (res.ok) {
                setAutoSaveStatus('saved');
                setTimeout(() => setAutoSaveStatus(null), 3000);
            }
        } catch (error) {
            console.error('Failed to queue:', error);
            setAutoSaveStatus('error');
        }
    };

    return (
        <div className="flex flex-col h-full bg-dots" style={{ maxHeight: '100vh', overflow: 'hidden' }}>
            {/* Header / Toolbar */}
            <div className="flex justify-between items-center p-md" style={{
                background: 'rgba(6, 13, 22, 0.85)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid var(--glass-border)',
                zIndex: 10
            }}>
                <div className="flex items-center gap-md">
                    <div style={{
                        width: 40, height: 40,
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--gradient-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: 'var(--shadow-glow)'
                    }}>
                        <div style={{ color: 'white' }}><IconSparkles /></div>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2 }}>Data Studio</h1>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Training & Formatting Pipeline</p>
                    </div>
                </div>

                <div className="flex items-center gap-md">
                    <div style={{ width: 220 }}>
                        <Select
                            options={seasons.map(s => ({ value: s.id, label: s.name }))}
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                        />
                    </div>
                    <div style={{ width: 200 }}>
                        <Select
                            options={models.map(m => ({ value: m.name, label: m.name }))}
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <div className="flex flex-col" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                {/* Chat Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: 'var(--space-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-lg)'
                }}>
                    {messages.length === 0 && (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0.5 }}>
                            <div className="pulse-slow" style={{
                                width: 80, height: 80,
                                borderRadius: '50%',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: 'var(--space-md)'
                            }}>
                                <IconTerminal />
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 500, marginBottom: 'var(--space-xs)' }}>Ready for Input</h3>
                            <p style={{ maxWidth: 400, textAlign: 'center' }}>Paste raw data, documentation, or Q&A pairs. AI will format and queue them for the RAG Knowledge Base.</p>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                gap: 'var(--space-md)',
                                width: '100%',
                                maxWidth: 1000,
                                margin: '0 auto',
                                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                animation: `fadeInUp 0.3s ease-out ${idx * 0.1}s both`
                            }}
                        >
                            {/* Avatar */}
                            <div style={{
                                width: 32, height: 32,
                                borderRadius: 'var(--radius-md)',
                                flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: msg.role === 'user' ? 'rgba(255,255,255,0.1)' : 'var(--gradient-primary)',
                                color: msg.role === 'user' ? 'var(--color-text-secondary)' : 'white',
                                boxShadow: msg.role === 'assistant' ? 'var(--shadow-glow)' : 'none'
                            }}>
                                {msg.role === 'user' ? <IconTerminal /> : <IconRobot />}
                            </div>

                            {/* Bubble */}
                            <div style={{
                                flex: 1,
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-lg)',
                                border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--glass-border)',
                                background: msg.role === 'user' ? 'rgba(0,0,0,0.3)' : 'var(--glass-bg)',
                                fontFamily: msg.role === 'user' ? 'var(--font-mono)' : 'inherit',
                                fontSize: msg.role === 'user' ? '0.875rem' : '1rem',
                                color: msg.role === 'user' ? 'var(--color-success)' : 'var(--color-text-primary)'
                            }}>
                                {msg.role === 'user' && (
                                    <div style={{
                                        fontSize: '0.7rem', color: 'var(--color-text-muted)',
                                        marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em',
                                        userSelect: 'none'
                                    }}>
                                        Raw Input
                                    </div>
                                )}
                                {msg.role === 'assistant' && (
                                    <div className="flex justify-between items-center" style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        marginBottom: '8px', paddingBottom: '8px'
                                    }}>
                                        <div style={{
                                            fontSize: '0.7rem', color: 'var(--color-accent)',
                                            textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }}>
                                            <IconSparkles /> Formatted Output
                                        </div>
                                        {idx === messages.length - 1 && autoSaveStatus && (
                                            <div className="animate-fadeIn" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                {autoSaveStatus === 'saving' && <span className="text-muted">Saving...</span>}
                                                {autoSaveStatus === 'saved' && <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: 4 }}><IconCheck /> Saved</span>}
                                                {autoSaveStatus === 'error' && <span style={{ color: 'var(--color-error)' }}>Save failed</span>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="markdown-body">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} style={{ height: 20 }} />
                </div>

                {/* Input Area */}
                <div style={{ padding: 'var(--space-md)', zIndex: 10 }}>
                    <div style={{
                        maxWidth: 900, margin: '0 auto',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        backdropFilter: 'blur(10px)',
                        padding: 'var(--space-sm)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px 8px 8px' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.5 }}></div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.5 }}></div>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', opacity: 0.5 }}></div>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginLeft: 8 }}>input.txt</div>
                        </div>
                        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <Textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={selectedSeason ? "// Paste your raw text here..." : "// Select a Season to start..."}
                                disabled={loading || !selectedSeason}
                                rows={3}
                                style={{
                                    flex: 1,
                                    background: 'transparent', border: 'none',
                                    fontFamily: 'var(--font-mono)', fontSize: '0.875rem',
                                    color: 'var(--color-text-primary)', resize: 'none', padding: 0
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />
                            <Button
                                type="submit"
                                disabled={loading || !input.trim() || !selectedSeason}
                                style={{ alignSelf: 'flex-end' }}
                                size="sm"
                            >
                                {loading ? <div className="spinner" /> : <IconSend />}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
