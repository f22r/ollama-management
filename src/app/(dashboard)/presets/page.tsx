'use client';

import { useEffect, useState } from 'react';
import { Button, Badge, Modal, Input, Textarea, Select } from '@/components/ui';
import type { Preset, OllamaModel } from '@/types';

const IconDownload = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

export default function PresetsPage() {
    const [presets, setPresets] = useState<Preset[]>([]);
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [editModal, setEditModal] = useState<Preset | null>(null);
    const [createModal, setCreateModal] = useState(false);
    const [formData, setFormData] = useState<Partial<Preset>>({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [presetsRes, modelsRes] = await Promise.all([
                fetch('/api/presets'),
                fetch('/api/models'),
            ]);
            if (presetsRes.ok) {
                const data = await presetsRes.json();
                setPresets(data.presets || []);
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

    const createPreset = async () => {
        if (!formData.name || !formData.model) return;
        try {
            await fetch('/api/presets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    season: formData.season || 'default',
                    temperature: formData.temperature ?? 0.7,
                    topP: formData.topP ?? 0.9,
                    topK: formData.topK ?? 40,
                    numCtx: formData.numCtx ?? 4096,
                }),
            });
            setCreateModal(false);
            setFormData({});
            fetchData();
        } catch (error) {
            console.error('Create failed:', error);
        }
    };

    const updatePreset = async () => {
        if (!editModal) return;
        try {
            await fetch('/api/presets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editModal.id, ...formData }),
            });
            setEditModal(null);
            setFormData({});
            fetchData();
        } catch (error) {
            console.error('Update failed:', error);
        }
    };

    const deletePreset = async (id: string) => {
        try {
            await fetch('/api/presets', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            fetchData();
        } catch (error) {
            console.error('Delete failed:', error);
        }
    };

    const openEditModal = (preset: Preset) => {
        setFormData({
            name: preset.name,
            systemPrompt: preset.systemPrompt,
            temperature: preset.temperature,
            topP: preset.topP,
            topK: preset.topK,
            numCtx: preset.numCtx,
        });
        setEditModal(preset);
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
                        <h1 className="page-title">Presets</h1>
                        <p className="page-description">Manage system prompts and parameter presets</p>
                    </div>
                    <Button onClick={() => { setFormData({}); setCreateModal(true); }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Preset
                    </Button>
                </div>
            </div>

            {presets.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                        </svg>
                        <h3>No presets yet</h3>
                        <p className="text-muted">Create your first preset to save prompt configurations</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-md">
                    {presets.map((preset) => (
                        <div key={preset.id} className="card">
                            <div className="flex justify-between items-start mb-md">
                                <div>
                                    <h3>{preset.name}</h3>
                                    <div className="flex gap-xs mt-xs">
                                        <Badge>{preset.model}</Badge>
                                        <Badge variant="default">{preset.season}</Badge>
                                    </div>
                                </div>
                                <div className="flex gap-xs">
                                    <Button size="sm" variant="ghost" onClick={() => window.open(`/api/export?type=preset&id=${preset.id}`, '_blank')}>
                                        <IconDownload />
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => openEditModal(preset)}>Edit</Button>
                                    <Button size="sm" variant="danger" onClick={() => deletePreset(preset.id)}>Delete</Button>
                                </div>
                            </div>

                            {preset.systemPrompt && (
                                <div className="mb-md">
                                    <div className="label">System Prompt</div>
                                    <div className="text-secondary" style={{ fontSize: '0.875rem', maxHeight: 60, overflow: 'hidden' }}>
                                        {preset.systemPrompt}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-4 gap-sm" style={{ fontSize: '0.75rem' }}>
                                <div>
                                    <div className="text-muted">Temp</div>
                                    <div className="font-mono">{preset.temperature}</div>
                                </div>
                                <div>
                                    <div className="text-muted">Top P</div>
                                    <div className="font-mono">{preset.topP}</div>
                                </div>
                                <div>
                                    <div className="text-muted">Top K</div>
                                    <div className="font-mono">{preset.topK}</div>
                                </div>
                                <div>
                                    <div className="text-muted">Context</div>
                                    <div className="font-mono">{preset.numCtx}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal
                isOpen={createModal}
                onClose={() => setCreateModal(false)}
                title="Create Preset"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setCreateModal(false)}>Cancel</Button>
                        <Button onClick={createPreset} disabled={!formData.name || !formData.model}>Create</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-md">
                    <Input
                        label="Name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                    <Input
                        label="Season"
                        value={formData.season || 'default'}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                    />
                    <Textarea
                        label="System Prompt"
                        value={formData.systemPrompt || ''}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                        rows={4}
                    />
                    <div className="grid grid-cols-2 gap-md">
                        <Input
                            label="Temperature"
                            type="number"
                            step="0.1"
                            value={formData.temperature ?? 0.7}
                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Top P"
                            type="number"
                            step="0.05"
                            value={formData.topP ?? 0.9}
                            onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Top K"
                            type="number"
                            value={formData.topK ?? 40}
                            onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) })}
                        />
                        <Input
                            label="Context Length"
                            type="number"
                            value={formData.numCtx ?? 4096}
                            onChange={(e) => setFormData({ ...formData, numCtx: parseInt(e.target.value) })}
                        />
                    </div>
                </div>
            </Modal>

            {/* Edit Modal */}
            <Modal
                isOpen={!!editModal}
                onClose={() => setEditModal(null)}
                title={`Edit ${editModal?.name}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setEditModal(null)}>Cancel</Button>
                        <Button onClick={updatePreset}>Save</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-md">
                    <Input
                        label="Name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Textarea
                        label="System Prompt"
                        value={formData.systemPrompt || ''}
                        onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                        rows={4}
                    />
                    <div className="grid grid-cols-2 gap-md">
                        <Input
                            label="Temperature"
                            type="number"
                            step="0.1"
                            value={formData.temperature ?? 0.7}
                            onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Top P"
                            type="number"
                            step="0.05"
                            value={formData.topP ?? 0.9}
                            onChange={(e) => setFormData({ ...formData, topP: parseFloat(e.target.value) })}
                        />
                        <Input
                            label="Top K"
                            type="number"
                            value={formData.topK ?? 40}
                            onChange={(e) => setFormData({ ...formData, topK: parseInt(e.target.value) })}
                        />
                        <Input
                            label="Context Length"
                            type="number"
                            value={formData.numCtx ?? 4096}
                            onChange={(e) => setFormData({ ...formData, numCtx: parseInt(e.target.value) })}
                        />
                    </div>
                </div>
            </Modal>
        </div>
    );
}
