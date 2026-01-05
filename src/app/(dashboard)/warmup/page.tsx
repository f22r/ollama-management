'use client';

import { useEffect, useState } from 'react';
import { Button, Badge, Toggle, Input, Select, Modal } from '@/components/ui';
import type { WarmupConfig, ModelMetadata } from '@/types';

interface RunningModel {
    name: string;
    sizeVram: number;
    expiresAt: string;
}

export default function WarmupPage() {
    const [runningModels, setRunningModels] = useState<RunningModel[]>([]);
    const [configs, setConfigs] = useState<WarmupConfig[]>([]);
    const [metadata, setMetadata] = useState<ModelMetadata[]>([]);
    const [ollamaConnected, setOllamaConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [configModal, setConfigModal] = useState<string | null>(null);
    const [editConfig, setEditConfig] = useState<Partial<WarmupConfig>>({});

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const res = await fetch('/api/warmup');
            if (res.ok) {
                const data = await res.json();
                setRunningModels(data.runningModels || []);
                setConfigs(data.configs || []);
                setMetadata(data.metadata || []);
                setOllamaConnected(data.ollamaConnected);
            }
        } catch (error) {
            console.error('Failed to fetch warmup data:', error);
        } finally {
            setLoading(false);
        }
    };

    const warmupModel = async (model: string) => {
        try {
            await fetch('/api/warmup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'warmup', model }),
            });
            fetchData();
        } catch (error) {
            console.error('Warmup failed:', error);
        }
    };

    const unloadModel = async (model: string) => {
        try {
            await fetch('/api/warmup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'unload', model }),
            });
            fetchData();
        } catch (error) {
            console.error('Unload failed:', error);
        }
    };

    const saveConfig = async () => {
        if (!configModal) return;
        try {
            await fetch('/api/warmup', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: configModal, ...editConfig }),
            });
            setConfigModal(null);
            fetchData();
        } catch (error) {
            console.error('Save config failed:', error);
        }
    };

    const openConfigModal = (model: string) => {
        const config = configs.find(c => c.model === model);
        const meta = metadata.find(m => m.name === model);
        setEditConfig({
            pingInterval: config?.pingInterval || 0,
            warmupPayload: config?.warmupPayload || '{"prompt": "hello", "num_predict": 1}',
            fallbackStrategy: config?.fallbackStrategy || 'retry',
        });
        setConfigModal(model);
    };

    const updateMetadata = async (model: string, data: Partial<ModelMetadata>) => {
        try {
            await fetch('/api/models', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: model, action: 'update-metadata', ...data }),
            });
            fetchData();
        } catch (error) {
            console.error('Update metadata failed:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center" style={{ height: '50vh' }}>
                <div className="spinner" style={{ width: 40, height: 40 }} />
            </div>
        );
    }

    const runningNames = new Set(runningModels.map(m => m.name));
    const allModelNames = runningModels.map(m => m.name).concat(metadata.map(m => m.name));
    const allModels = Array.from(new Set(allModelNames));

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Warmup Manager</h1>
                <p className="page-description">Keep models warm and manage loading state</p>
            </div>

            {/* Connection Status */}
            <div className="card mb-lg">
                <div className="flex items-center gap-md">
                    <span className={`status-dot ${ollamaConnected ? 'online' : 'error'}`} />
                    <span>Ollama {ollamaConnected ? 'Connected' : 'Disconnected'}</span>
                </div>
            </div>

            {/* Running Models */}
            <div className="card mb-lg">
                <div className="card-header">
                    <h3>Currently Loaded Models</h3>
                    <Badge>{runningModels.length} loaded</Badge>
                </div>
                {runningModels.length > 0 ? (
                    <div className="flex flex-col gap-md">
                        {runningModels.map((model) => (
                            <div key={model.name} className="flex items-center justify-between p-md" style={{ backgroundColor: 'var(--color-bg-dark)', borderRadius: 'var(--radius-md)' }}>
                                <div className="flex items-center gap-md">
                                    <span className="status-dot online" />
                                    <div>
                                        <div className="font-mono">{model.name}</div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            VRAM: {formatBytes(model.sizeVram)} | Expires: {new Date(model.expiresAt).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-sm">
                                    <Button size="sm" variant="secondary" onClick={() => openConfigModal(model.name)}>
                                        Configure
                                    </Button>
                                    <Button size="sm" variant="danger" onClick={() => unloadModel(model.name)}>
                                        Unload
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-muted text-center p-lg">No models currently loaded</div>
                )}
            </div>

            {/* All Models Configuration */}
            <div className="card">
                <div className="card-header">
                    <h3>Model Keep-Alive Settings</h3>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Status</th>
                            <th>Keep-Alive Duration</th>
                            <th>Always Warm</th>
                            <th>Ping Interval</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metadata.map((model) => {
                            const isRunning = runningNames.has(model.name);
                            return (
                                <tr key={model.name}>
                                    <td className="font-mono">{model.name}</td>
                                    <td>
                                        {isRunning ? (
                                            <Badge variant="success">LOADED</Badge>
                                        ) : (
                                            <Badge>IDLE</Badge>
                                        )}
                                    </td>
                                    <td>
                                        <Select
                                            options={[
                                                { value: '5m', label: '5 minutes' },
                                                { value: '15m', label: '15 minutes' },
                                                { value: '30m', label: '30 minutes' },
                                                { value: '1h', label: '1 hour' },
                                                { value: '-1', label: 'Forever' },
                                            ]}
                                            value={model.keepAliveDuration}
                                            onChange={(e) => updateMetadata(model.name, { keepAliveDuration: e.target.value })}
                                            style={{ width: 120 }}
                                        />
                                    </td>
                                    <td>
                                        <Toggle
                                            checked={model.alwaysWarm}
                                            onChange={(checked) => updateMetadata(model.name, { alwaysWarm: checked })}
                                        />
                                    </td>
                                    <td>
                                        {model.pingInterval > 0 ? `${model.pingInterval}s` : 'Off'}
                                    </td>
                                    <td>
                                        <div className="flex gap-xs">
                                            {isRunning ? (
                                                <Button size="sm" variant="secondary" onClick={() => unloadModel(model.name)}>
                                                    Unload
                                                </Button>
                                            ) : (
                                                <Button size="sm" onClick={() => warmupModel(model.name)}>
                                                    Warm Up
                                                </Button>
                                            )}
                                            <Button size="sm" variant="ghost" onClick={() => openConfigModal(model.name)}>
                                                ⚙️
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Config Modal */}
            <Modal
                isOpen={!!configModal}
                onClose={() => setConfigModal(null)}
                title={`Configure ${configModal}`}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setConfigModal(null)}>Cancel</Button>
                        <Button onClick={saveConfig}>Save</Button>
                    </>
                }
            >
                <div className="flex flex-col gap-md">
                    <Input
                        label="Ping Interval (seconds)"
                        type="number"
                        value={editConfig.pingInterval || 0}
                        onChange={(e) => setEditConfig({ ...editConfig, pingInterval: parseInt(e.target.value) })}
                        placeholder="0 = disabled"
                    />
                    <div>
                        <label className="label">Warmup Payload</label>
                        <textarea
                            className="textarea font-mono"
                            rows={3}
                            value={editConfig.warmupPayload || ''}
                            onChange={(e) => setEditConfig({ ...editConfig, warmupPayload: e.target.value })}
                        />
                    </div>
                    <Select
                        label="Fallback Strategy"
                        options={[
                            { value: 'retry', label: 'Retry' },
                            { value: 'skip', label: 'Skip' },
                            { value: 'alert', label: 'Alert' },
                        ]}
                        value={editConfig.fallbackStrategy || 'retry'}
                        onChange={(e) => setEditConfig({ ...editConfig, fallbackStrategy: e.target.value as 'retry' | 'skip' | 'alert' })}
                    />
                </div>
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
