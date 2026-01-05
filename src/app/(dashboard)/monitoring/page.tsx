'use client';

import { useEffect, useState } from 'react';
import { MetricCard, ProgressBar, Badge } from '@/components/ui';
import type { SystemMetrics } from '@/types';

export default function MonitoringPage() {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [history, setHistory] = useState<SystemMetrics[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await fetch('/api/system');
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                    setHistory(prev => [...prev.slice(-60), data]);
                }
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
        const interval = setInterval(fetchMetrics, 2000);
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
                <h1 className="page-title">System Monitor</h1>
                <p className="page-description">Real-time resource monitoring</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-4 mb-lg">
                <MetricCard
                    title="CPU Usage"
                    value={`${metrics?.cpu.usage || 0}%`}
                    status={metrics?.cpu.usage && metrics.cpu.usage > 80 ? 'warning' : 'success'}
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Memory"
                    value={`${metrics?.memory.usedPercent || 0}%`}
                    subtitle={metrics ? `${formatBytes(metrics.memory.used)} / ${formatBytes(metrics.memory.total)}` : ''}
                    status={metrics?.memory.usedPercent && metrics.memory.usedPercent > 80 ? 'warning' : 'success'}
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                    }
                />
                <MetricCard
                    title="Disk"
                    value={`${metrics?.disk.usedPercent || 0}%`}
                    subtitle={metrics ? `${formatBytes(metrics.disk.used)} / ${formatBytes(metrics.disk.total)}` : ''}
                    status={metrics?.disk.usedPercent && metrics.disk.usedPercent > 90 ? 'error' : 'success'}
                    icon={
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                        </svg>
                    }
                />
                {metrics?.gpu ? (
                    <MetricCard
                        title="GPU"
                        value={`${metrics.gpu.utilization}%`}
                        subtitle={`${metrics.gpu.temperature}°C | ${formatBytes(metrics.gpu.memoryUsed)} / ${formatBytes(metrics.gpu.memoryTotal)}`}
                        status={metrics.gpu.utilization > 90 ? 'warning' : 'success'}
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        }
                    />
                ) : (
                    <MetricCard
                        title="GPU"
                        value="N/A"
                        subtitle="Not detected"
                        icon={
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                        }
                    />
                )}
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-2 gap-lg">
                {/* CPU Cores */}
                <div className="card">
                    <div className="card-header">
                        <h3>CPU Cores</h3>
                        <Badge>{metrics?.cpu.cores.length || 0} cores</Badge>
                    </div>
                    <div className="grid grid-cols-4 gap-sm">
                        {metrics?.cpu.cores.map((usage, i) => (
                            <div key={i} className="p-sm" style={{ backgroundColor: 'var(--color-bg-dark)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                                <div className="text-muted" style={{ fontSize: '0.7rem' }}>Core {i}</div>
                                <div className="font-mono" style={{ color: usage > 80 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                                    {usage}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Network */}
                <div className="card">
                    <div className="card-header">
                        <h3>Network I/O</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-md">
                        <div className="metric">
                            <div className="metric-label">Received</div>
                            <div className="metric-value">{formatBytes(metrics?.network.rx || 0)}</div>
                        </div>
                        <div className="metric">
                            <div className="metric-label">Transmitted</div>
                            <div className="metric-value">{formatBytes(metrics?.network.tx || 0)}</div>
                        </div>
                    </div>
                </div>

                {/* GPU Details */}
                {metrics?.gpu && (
                    <div className="card">
                        <div className="card-header">
                            <h3>GPU Details</h3>
                            <Badge variant="success">{metrics.gpu.name}</Badge>
                        </div>
                        <div className="flex flex-col gap-md">
                            <ProgressBar
                                value={metrics.gpu.utilization}
                                label="Utilization"
                                status={metrics.gpu.utilization > 90 ? 'warning' : 'default'}
                            />
                            <ProgressBar
                                value={(metrics.gpu.memoryUsed / metrics.gpu.memoryTotal) * 100}
                                label="VRAM"
                                status={(metrics.gpu.memoryUsed / metrics.gpu.memoryTotal) > 0.9 ? 'error' : 'default'}
                            />
                            <div className="flex justify-between text-secondary" style={{ fontSize: '0.875rem' }}>
                                <span>Temperature</span>
                                <span className="font-mono" style={{ color: metrics.gpu.temperature > 80 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                                    {metrics.gpu.temperature}°C
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Resource History Chart */}
                <div className="card">
                    <div className="card-header">
                        <h3>CPU History (2min)</h3>
                    </div>
                    <div className="flex gap-xs" style={{ height: 80, alignItems: 'flex-end' }}>
                        {history.slice(-60).map((m, i) => (
                            <div
                                key={i}
                                style={{
                                    flex: 1,
                                    backgroundColor: m.cpu.usage > 80 ? 'var(--color-warning)' : 'var(--color-accent)',
                                    height: `${m.cpu.usage}%`,
                                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                    minWidth: 2,
                                }}
                            />
                        ))}
                    </div>
                </div>
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
