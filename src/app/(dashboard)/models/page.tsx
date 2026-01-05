'use client';

import { useEffect, useState } from 'react';
import { Button, Badge, Modal, Input, ProgressBar } from '@/components/ui';
import type { OllamaModel, ModelMetadata } from '@/types';

interface ModelWithMetadata extends OllamaModel {
    isRunning: boolean;
    metadata: ModelMetadata | null;
}

export default function ModelsPage() {
    const [models, setModels] = useState<ModelWithMetadata[]>([]);
    const [loading, setLoading] = useState(true);
    const [pullModalOpen, setPullModalOpen] = useState(false);
    const [pullName, setPullName] = useState('');
    const [pulling, setPulling] = useState(false);
    const [pullProgress, setPullProgress] = useState<{ status: string; progress: number } | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchModels();
        const interval = setInterval(fetchModels, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchModels = async () => {
        try {
            const res = await fetch('/api/models');
            if (res.ok) {
                const data = await res.json();
                setModels(data.models || []);
            }
        } catch (error) {
            console.error('Failed to fetch models:', error);
        } finally {
            setLoading(false);
        }
    };

    const pullModel = async () => {
        if (!pullName.trim()) return;
        setPulling(true);
        setPullProgress({ status: 'Starting...', progress: 0 });

        try {
            const response = await fetch('/api/models/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: pullName }),
            });

            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const lines = decoder.decode(value).split('\n').filter(Boolean);
                for (const line of lines) {
                    try {
                        const data = JSON.parse(line);
                        if (data.total && data.completed) {
                            setPullProgress({
                                status: data.status,
                                progress: (data.completed / data.total) * 100,
                            });
                        } else {
                            setPullProgress({ status: data.status, progress: 0 });
                        }
                    } catch { }
                }
            }

            setPullModalOpen(false);
            setPullName('');
            fetchModels();
        } catch (error) {
            console.error('Pull failed:', error);
        } finally {
            setPulling(false);
            setPullProgress(null);
        }
    };

    const deleteModel = async (name: string) => {
        try {
            const res = await fetch('/api/models', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                fetchModels();
            }
        } catch (error) {
            console.error('Delete failed:', error);
        }
        setDeleteConfirm(null);
    };

    const setDefault = async (name: string) => {
        try {
            await fetch('/api/models', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, action: 'set-default' }),
            });
            fetchModels();
        } catch (error) {
            console.error('Set default failed:', error);
        }
    };

    const warmupModel = async (name: string) => {
        try {
            const res = await fetch('/api/models', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, action: 'warmup' }),
            });
            if (res.ok) {
                fetchModels();
            }
        } catch (error) {
            console.error('Warmup failed:', error);
        }
    };

    const unloadModel = async (name: string) => {
        try {
            await fetch('/api/models', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, action: 'unload' }),
            });
            fetchModels();
        } catch (error) {
            console.error('Unload failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '50vh' }}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Models</h1>
                        <p className="page-description">Manage Ollama models</p>
                    </div>
                    <Button onClick={() => setPullModalOpen(true)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Pull Model
                    </Button>
                </div>
            </div>

            <div className="card">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Size</th>
                            <th>Family</th>
                            <th>Parameters</th>
                            <th>Last Used</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {models.map((model) => (
                            <tr key={model.name}>
                                <td>
                                    <div className="flex items-center gap-sm">
                                        <span className="font-mono">{model.name}</span>
                                        {model.metadata?.isDefault && <Badge variant="default">DEFAULT</Badge>}
                                    </div>
                                </td>
                                <td className="font-mono">{formatBytes(model.size)}</td>
                                <td>{model.details?.family || '-'}</td>
                                <td>{model.details?.parameter_size || '-'}</td>
                                <td className="text-muted">
                                    {model.metadata?.lastUsed
                                        ? new Date(model.metadata.lastUsed).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })
                                        : '-'}
                                </td>
                                <td>
                                    {model.isRunning ? (
                                        <Badge variant="success">LOADED</Badge>
                                    ) : (
                                        <Badge>IDLE</Badge>
                                    )}
                                </td>
                                <td>
                                    <div className="flex gap-xs">
                                        {model.isRunning ? (
                                            <Button size="sm" variant="secondary" onClick={() => unloadModel(model.name)}>
                                                Unload
                                            </Button>
                                        ) : (
                                            <Button size="sm" variant="secondary" onClick={() => warmupModel(model.name)}>
                                                Warm Up
                                            </Button>
                                        )}
                                        {!model.metadata?.isDefault && (
                                            <Button size="sm" variant="ghost" onClick={() => setDefault(model.name)}>
                                                Set Default
                                            </Button>
                                        )}
                                        <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(model.name)}>
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pull Modal */}
            <Modal
                isOpen={pullModalOpen}
                onClose={() => !pulling && setPullModalOpen(false)}
                title="Pull Model"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setPullModalOpen(false)} disabled={pulling}>
                            Cancel
                        </Button>
                        <Button onClick={pullModel} loading={pulling} disabled={!pullName.trim()}>
                            Pull
                        </Button>
                    </>
                }
            >
                <Input
                    label="Model Name"
                    placeholder="e.g., llama3.2, mistral:7b"
                    value={pullName}
                    onChange={(e) => setPullName(e.target.value)}
                    disabled={pulling}
                />
                {pullProgress && (
                    <div className="mt-md">
                        <ProgressBar value={pullProgress.progress} label={pullProgress.status} />
                    </div>
                )}
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Model"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={() => deleteConfirm && deleteModel(deleteConfirm)}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p>Are you sure you want to delete <strong className="font-mono">{deleteConfirm}</strong>?</p>
                <p className="text-muted mt-sm">This action cannot be undone.</p>
            </Modal>
        </div>
    );
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
