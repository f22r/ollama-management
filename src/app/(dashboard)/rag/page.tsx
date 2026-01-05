'use client';

import { useEffect, useState } from 'react';
import { Button, Badge, Modal, Input, Textarea, Tabs, Select, Toggle } from '@/components/ui';
import type { RagSeason, RagChunk, OllamaModel } from '@/types';

// Icons
const IconPlus = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
);

const IconSearch = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <circle cx="11" cy="11" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
    </svg>
);

const IconDatabase = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
);

const IconX = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconBrain = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const IconDownload = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

interface SearchResult {
    id: string;
    content: string;
    source?: string;
    score: number;
    bm25Score: number;
    semanticScore: number;
    highlighted: string;
}

export default function RagPage() {
    const [seasons, setSeasons] = useState<RagSeason[]>([]);
    const [chunks, setChunks] = useState<RagChunk[]>([]);
    const [queueItems, setQueueItems] = useState<{ id: string; content: string; createdAt: string; source: string }[]>([]);
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [selectedSeason, setSelectedSeason] = useState<RagSeason | null>(null);
    const [loading, setLoading] = useState(true);
    const [createModal, setCreateModal] = useState(false);
    const [addChunkModal, setAddChunkModal] = useState(false);
    const [formData, setFormData] = useState<{ name?: string; model?: string; promptPolicy?: string; content?: string }>({});
    const [activeTab, setActiveTab] = useState('search');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [useSemanticSearch, setUseSemanticSearch] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedSeason) {
            fetchChunks(selectedSeason.id);
            fetchQueue(selectedSeason.id);
        }
    }, [selectedSeason]);

    // Debounced search
    useEffect(() => {
        if (!searchQuery.trim() || !selectedSeason) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(() => {
            performSearch();
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery, selectedSeason, useSemanticSearch]);

    const fetchData = async () => {
        try {
            const [seasonsRes, modelsRes] = await Promise.all([
                fetch('/api/rag?type=seasons'),
                fetch('/api/models'),
            ]);
            if (seasonsRes.ok) {
                const data = await seasonsRes.json();
                setSeasons(data.seasons || []);
            }
            if (modelsRes.ok) {
                const data = await modelsRes.json();
                setModels(data.models || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchChunks = async (seasonId: string) => {
        try {
            const res = await fetch(`/api/rag?type=chunks&seasonId=${seasonId}&approved=true`);
            if (res.ok) {
                const data = await res.json();
                setChunks(data.chunks || []);
            }
        } catch (error) {
            console.error('Failed to fetch chunks:', error);
        }
    };

    const fetchQueue = async (seasonId: string) => {
        try {
            const res = await fetch(`/api/rag?type=queue&seasonId=${seasonId}`);
            if (res.ok) {
                const data = await res.json();
                setQueueItems(data.queue || []);
            }
        } catch (error) {
            console.error('Failed to fetch queue:', error);
        }
    };

    const performSearch = async () => {
        if (!searchQuery.trim() || !selectedSeason) return;

        setIsSearching(true);
        try {
            const res = await fetch('/api/rag/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: searchQuery,
                    seasonId: selectedSeason.id,
                    topK: 10,
                    useSemanticSearch,
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setSearchResults(data.results || []);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    const createSeason = async () => {
        if (!formData.name || !formData.model) return;
        try {
            await fetch('/api/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'season',
                    model: formData.model,
                    name: formData.name,
                    promptPolicy: formData.promptPolicy || '',
                }),
            });
            setCreateModal(false);
            setFormData({});
            fetchData();
        } catch (error) {
            console.error('Create failed:', error);
        }
    };

    const deleteSeason = async (id: string) => {
        try {
            await fetch('/api/rag', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'season', id }),
            });
            if (selectedSeason?.id === id) {
                setSelectedSeason(null);
                setChunks([]);
            }
            fetchData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const addChunk = async () => {
        if (!formData.content || !selectedSeason) return;
        try {
            await fetch('/api/rag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'chunk',
                    seasonId: selectedSeason.id,
                    content: formData.content,
                    source: 'manual',
                    approved: true,
                }),
            });
            setAddChunkModal(false);
            setFormData({});
            fetchChunks(selectedSeason.id);
        } catch (error) {
            console.error('Add chunk failed:', error);
        }
    };

    const deleteChunk = async (id: string) => {
        try {
            await fetch('/api/rag', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'chunk', id }),
            });
            if (selectedSeason) fetchChunks(selectedSeason.id);
        } catch (error) {
            console.error('Delete chunk failed:', error);
        }
    };

    const approveQueueItem = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await fetch('/api/rag', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'approve-queue', id }),
            });
            if (selectedSeason) {
                fetchQueue(selectedSeason.id);
                fetchChunks(selectedSeason.id);
            }
        } catch (error) {
            console.error('Approve failed:', error);
        }
    };

    const rejectQueueItem = async (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        try {
            await fetch('/api/rag', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'reject-queue', id }),
            });
            if (selectedSeason) fetchQueue(selectedSeason.id);
        } catch (error) {
            console.error('Reject failed:', error);
        }
    };

    const approveAllQueue = async () => {
        if (!selectedSeason || queueItems.length === 0) return;
        if (!confirm('Approve all pending items?')) return;

        try {
            await fetch('/api/rag', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'approve-all-queue', seasonId: selectedSeason.id }),
            });
            fetchQueue(selectedSeason.id);
            fetchChunks(selectedSeason.id);
        } catch (error) {
            console.error('Approve all failed:', error);
        }
    };

    const renderHighlighted = (text: string) => {
        // Convert **term** to highlighted spans
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) =>
            i % 2 === 1 ? (
                <mark key={i} style={{
                    background: 'var(--color-accent-muted)',
                    color: 'var(--color-accent)',
                    padding: '0 2px',
                    borderRadius: '2px',
                }}>
                    {part}
                </mark>
            ) : part
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '50vh' }}>
                <div className="spinner spinner-lg" />
            </div>
        );
    }

    return (
        <div>
            <div className="page-header animate-fadeInDown">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">RAG Knowledge Base</h1>
                        <p className="page-description">Manage knowledge with hybrid BM25 + semantic search</p>
                    </div>
                    <Button onClick={() => { setFormData({}); setCreateModal(true); }}>
                        <IconPlus />
                        New Season
                    </Button>
                </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '320px 1fr', gap: 'var(--space-lg)' }}>
                {/* Seasons List */}
                <div className="card animate-slideInLeft">
                    <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <IconDatabase style={{ width: 20, height: 20 }} />
                        Seasons
                    </h3>
                    {seasons.length === 0 ? (
                        <div className="text-muted text-center p-lg">
                            No seasons yet.
                            <br />Create one to get started!
                        </div>
                    ) : (
                        <div className="flex flex-col gap-sm">
                            {seasons.map((season, idx) => (
                                <div
                                    key={season.id}
                                    className="hover-bg"
                                    style={{
                                        backgroundColor: selectedSeason?.id === season.id ? 'var(--color-accent-muted)' : 'rgba(6, 13, 22, 0.5)',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        border: selectedSeason?.id === season.id ? '1px solid rgba(0, 212, 255, 0.3)' : '1px solid transparent',
                                        padding: 'var(--space-md)',
                                        transition: 'all var(--transition-fast)',
                                        animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both`,
                                    }}
                                    onClick={() => setSelectedSeason(season)}
                                >
                                    <div className="flex justify-between items-center">
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className="font-medium" style={{ marginBottom: '4px' }}>{season.name}</div>
                                            <Badge>{season.model.split(':')[0]}</Badge>
                                        </div>
                                        <div className="flex gap-xs">
                                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); window.open(`/api/export?type=season&id=${season.id}`, '_blank'); }}>
                                                <IconDownload />
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); deleteSeason(season.id); }}>
                                                <IconX />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Season Details */}
                <div className="card animate-fadeIn">
                    {selectedSeason ? (
                        <>
                            <div className="card-header">
                                <div>
                                    <h3 style={{ marginBottom: 'var(--space-xs)' }}>{selectedSeason.name}</h3>
                                    <div className="flex gap-sm items-center">
                                        <Badge>{selectedSeason.model}</Badge>
                                        <span className="text-muted">{chunks.length} chunks</span>
                                    </div>
                                </div>
                                <Button onClick={() => setAddChunkModal(true)}>
                                    <IconPlus />
                                    Add Chunk
                                </Button>
                            </div>

                            {selectedSeason.promptPolicy && (
                                <div className="mb-md p-md" style={{ backgroundColor: 'rgba(0, 212, 255, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 212, 255, 0.1)' }}>
                                    <div className="label">Prompt Policy</div>
                                    <div className="text-secondary">{selectedSeason.promptPolicy}</div>
                                </div>
                            )}

                            <Tabs
                                tabs={[
                                    { id: 'search', label: '🔍 Search' },
                                    { id: 'chunks', label: `📄 Chunks (${chunks.length})` },
                                    { id: 'pending', label: `⏳ Pending (${queueItems.length})` },
                                ]}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                            />

                            {activeTab === 'search' && (
                                <div className="animate-fadeIn">
                                    {/* Search Input */}
                                    <div className="flex gap-md mb-md items-end">
                                        <div style={{ flex: 1 }}>
                                            <div className="label">Search Query</div>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    className="input"
                                                    placeholder="Search knowledge base..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    style={{ paddingLeft: '40px' }}
                                                />
                                                <IconSearch style={{
                                                    position: 'absolute',
                                                    left: '12px',
                                                    top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    opacity: 0.5,
                                                }} />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-sm" style={{ paddingBottom: '8px' }}>
                                            <IconBrain style={{ opacity: 0.5 }} />
                                            <Toggle
                                                checked={useSemanticSearch}
                                                onChange={setUseSemanticSearch}
                                                label="Semantic"
                                            />
                                        </div>
                                    </div>

                                    {/* Search Results */}
                                    {isSearching ? (
                                        <div className="flex items-center justify-center p-lg">
                                            <div className="spinner" />
                                        </div>
                                    ) : searchResults.length > 0 ? (
                                        <div className="flex flex-col gap-md">
                                            <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                                Found {searchResults.length} results
                                                {useSemanticSearch ? ' (hybrid search)' : ' (BM25)'}
                                            </div>
                                            {searchResults.map((result, idx) => (
                                                <div
                                                    key={result.id}
                                                    className="p-md hover-bg"
                                                    style={{
                                                        backgroundColor: 'rgba(6, 13, 22, 0.5)',
                                                        borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--glass-border)',
                                                        animation: `fadeInUp 0.2s ease-out ${idx * 0.05}s both`,
                                                    }}
                                                >
                                                    <div className="flex justify-between items-start mb-sm">
                                                        <div className="flex gap-sm items-center">
                                                            <Badge variant="success">
                                                                {(result.score * 100).toFixed(0)}%
                                                            </Badge>
                                                            {result.source && (
                                                                <Badge>{result.source}</Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                                            BM25: {result.bm25Score.toFixed(2)}
                                                            {useSemanticSearch && ` | Semantic: ${result.semanticScore.toFixed(2)}`}
                                                        </div>
                                                    </div>
                                                    <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                                                        {renderHighlighted(result.highlighted)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : searchQuery ? (
                                        <div className="text-muted text-center p-lg">
                                            No results found for &quot;{searchQuery}&quot;
                                        </div>
                                    ) : (
                                        <div className="text-muted text-center p-lg">
                                            Enter a search query to find relevant knowledge
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'chunks' && (
                                <div className="flex flex-col gap-sm animate-fadeIn">
                                    {chunks.map((chunk, idx) => (
                                        <div
                                            key={chunk.id}
                                            className="p-md hover-bg"
                                            style={{
                                                backgroundColor: 'rgba(6, 13, 22, 0.5)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--glass-border)',
                                                animation: `fadeInUp 0.2s ease-out ${idx * 0.03}s both`,
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-sm">
                                                <div className="flex gap-xs">
                                                    <Badge>{chunk.source}</Badge>
                                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {new Date(chunk.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => deleteChunk(chunk.id)}>
                                                    <IconX />
                                                </Button>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'hidden' }}>
                                                {chunk.content}
                                            </div>
                                        </div>
                                    ))}
                                    {chunks.length === 0 && (
                                        <div className="text-muted text-center p-lg">No approved chunks</div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'pending' && (
                                <div className="flex flex-col gap-sm animate-fadeIn">
                                    <div className="flex justify-between items-center mb-md">
                                        <div className="text-muted">{queueItems.length} items waiting for approval</div>
                                        {queueItems.length > 0 && (
                                            <Button size="sm" onClick={approveAllQueue}>
                                                Approve All
                                            </Button>
                                        )}
                                    </div>
                                    {queueItems.map((item, idx) => (
                                        <div
                                            key={item.id}
                                            className="p-md hover-bg"
                                            style={{
                                                backgroundColor: 'rgba(255, 165, 0, 0.05)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid rgba(255, 165, 0, 0.2)',
                                                animation: `fadeInUp 0.2s ease-out ${idx * 0.03}s both`,
                                            }}
                                        >
                                            <div className="flex justify-between items-start mb-sm">
                                                <div className="flex gap-xs">
                                                    <Badge variant="warning">Pending</Badge>
                                                    <Badge>{item.source}</Badge>
                                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                        {new Date(item.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}
                                                    </span>
                                                </div>
                                                <div className="flex gap-xs">
                                                    <Button size="sm" variant="success" onClick={(e) => approveQueueItem(item.id, e)}>
                                                        Approve
                                                    </Button>
                                                    <Button size="sm" variant="danger" onClick={(e) => rejectQueueItem(item.id, e)}>
                                                        Reject
                                                    </Button>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '0.875rem', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'hidden' }}>
                                                {item.content}
                                            </div>
                                        </div>
                                    ))}
                                    {queueItems.length === 0 && (
                                        <div className="text-muted text-center p-lg">
                                            No pending items in queue
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <IconDatabase />
                            <h3>Select a season</h3>
                            <p className="text-muted">Choose a season to view and search its knowledge base</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Season Modal */}
            <Modal
                isOpen={createModal}
                onClose={() => setCreateModal(false)}
                title="Create Season"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
                        <Button onClick={createSeason} disabled={!formData.name || !formData.model}>Create</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-md">
                    <Input
                        label="Name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Product Documentation"
                    />
                    <Select
                        label="Model"
                        options={[
                            { value: '', label: 'Select model...' },
                            ...models.map(m => ({ value: m.name, label: m.name })),
                        ]}
                        value={formData.model || ''}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                    <Textarea
                        label="Prompt Policy"
                        value={formData.promptPolicy || ''}
                        onChange={(e) => setFormData({ ...formData, promptPolicy: e.target.value })}
                        rows={3}
                        placeholder="Instructions for how to use this knowledge base..."
                    />
                </div>
            </Modal>

            {/* Add Chunk Modal */}
            <Modal
                isOpen={addChunkModal}
                onClose={() => setAddChunkModal(false)}
                title="Add Knowledge Chunk"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setAddChunkModal(false)}>Cancel</Button>
                        <Button onClick={addChunk} disabled={!formData.content}>Add</Button>
                    </>
                }
            >
                <Textarea
                    label="Content"
                    value={formData.content || ''}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    placeholder="Enter knowledge content..."
                />
            </Modal>
        </div>
    );
}
