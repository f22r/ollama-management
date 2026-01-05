'use client';

import { useEffect, useState } from 'react';
import { MetricCard, ProgressBar, Badge } from '@/components/ui';
import type { OllamaModel, SystemMetrics, AnalyticsData } from '@/types';

interface DashboardData {
    ollama: { connected: boolean; latency: number };
    models: OllamaModel[];
    runningModels: string[];
    analytics: { totalRequests: number; errorRate: number; latencyP50: number };
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statusRes, systemRes] = await Promise.all([
                    fetch('/api/status'),
                    fetch('/api/system'),
                ]);

                if (statusRes.ok) {
                    setData(await statusRes.json());
                }
                if (systemRes.ok) {
                    setSystemMetrics(await systemRes.json());
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

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
                <h1 className="page-title">Dashboard</h1>
                <p className="page-description">Ollama monitoring and management overview</p>
            </div>

            {/* Status Cards */}
            <div className="grid grid-cols-4 mb-lg">
                <MetricCard
                    title="Ollama Status"
                    value={data?.ollama.connected ? 'Connected' : 'Disconnected'}
                    status={data?.ollama.connected ? 'success' : 'error'}
                    subtitle={data?.ollama.connected ? `${data.ollama.latency}ms latency` : 'Check server'}
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Models Loaded"
                    value={data?.runningModels.length || 0}
                    subtitle={`${data?.models.length || 0} total available`}
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Requests (24h)"
                    value={data?.analytics.totalRequests || 0}
                    subtitle={`${(data?.analytics.errorRate || 0).toFixed(1)}% error rate`}
                    status={data?.analytics.errorRate && data.analytics.errorRate > 5 ? 'warning' : 'default'}
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Latency P50"
                    value={data?.analytics.latencyP50 || 0}
                    unit="ms"
                    status={data?.analytics.latencyP50 && data.analytics.latencyP50 > 1000 ? 'warning' : 'success'}
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
            </div>

            {/* System Resources */}
            <div className="grid grid-cols-2 gap-lg">
                <div className="card">
                    <div className="card-header">
                        <h3>System Resources</h3>
                    </div>
                    <div className="flex flex-col gap-md">
                        <ProgressBar
                            value={systemMetrics?.cpu.usage || 0}
                            label="CPU"
                            status={systemMetrics?.cpu.usage && systemMetrics.cpu.usage > 80 ? 'warning' : 'default'}
                        />
                        <ProgressBar
                            value={systemMetrics?.memory.usedPercent || 0}
                            label="Memory"
                            status={systemMetrics?.memory.usedPercent && systemMetrics.memory.usedPercent > 80 ? 'warning' : 'default'}
                        />
                        <ProgressBar
                            value={systemMetrics?.disk.usedPercent || 0}
                            label="Disk"
                            status={systemMetrics?.disk.usedPercent && systemMetrics.disk.usedPercent > 90 ? 'error' : 'default'}
                        />
                        {systemMetrics?.gpu && (
                            <ProgressBar
                                value={(systemMetrics.gpu.memoryUsed / systemMetrics.gpu.memoryTotal) * 100}
                                label={`GPU (${systemMetrics.gpu.name})`}
                                status={systemMetrics.gpu.utilization > 90 ? 'warning' : 'default'}
                            />
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h3>Running Models</h3>
                    </div>
                    {data?.runningModels.length ? (
                        <div className="flex flex-col gap-sm">
                            {data.runningModels.map((model) => (
                                <div key={model} className="flex items-center justify-between p-sm" style={{ backgroundColor: 'var(--color-bg-dark)', borderRadius: 'var(--radius-md)' }}>
                                    <div className="flex items-center gap-sm">
                                        <span className="status-dot online" />
                                        <span className="font-mono">{model}</span>
                                    </div>
                                    <Badge variant="success">LOADED</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-muted text-center p-lg">No models currently loaded</div>
                    )}
                </div>
            </div>

            {/* Available Models */}
            <div className="card mt-lg">
                <div className="card-header">
                    <h3>Available Models</h3>
                    <span className="text-muted">{data?.models.length || 0} models</span>
                </div>
                <table className="table">
                    <thead>
                        <tr>
                            <th>Model</th>
                            <th>Size</th>
                            <th>Family</th>
                            <th>Quantization</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data?.models.map((model) => (
                            <tr key={model.name}>
                                <td className="font-mono">{model.name}</td>
                                <td className="font-mono">{formatBytes(model.size)}</td>
                                <td>{model.details?.family || '-'}</td>
                                <td>{model.details?.quantization_level || '-'}</td>
                                <td>
                                    {data.runningModels.includes(model.name) ? (
                                        <Badge variant="success">LOADED</Badge>
                                    ) : (
                                        <Badge>IDLE</Badge>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
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
