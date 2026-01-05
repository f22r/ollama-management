'use client';

import { useEffect, useState } from 'react';
import { MetricCard, Badge, Button, Tabs } from '@/components/ui';
import type { AnalyticsData, RequestLog } from '@/types';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [logs, setLogs] = useState<RequestLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState(24);

    useEffect(() => {
        fetchData();
    }, [timeRange]);

    const fetchData = async () => {
        try {
            const res = await fetch(`/api/analytics?hours=${timeRange}&logs=true`);
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data.analytics);
                setLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const cleanLogs = async () => {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'clean' }),
            });
            fetchData();
        } catch (error) {
            console.error('Failed to clean logs:', error);
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
                        <h1 className="page-title">Analytics</h1>
                        <p className="page-description">Request logging and performance metrics</p>
                    </div>
                    <div className="flex gap-sm">
                        <select
                            className="select"
                            value={timeRange}
                            onChange={(e) => setTimeRange(parseInt(e.target.value))}
                            style={{ width: 120 }}
                        >
                            <option value={1}>Last 1h</option>
                            <option value={6}>Last 6h</option>
                            <option value={24}>Last 24h</option>
                            <option value={168}>Last 7d</option>
                        </select>
                        <Button variant="secondary" onClick={fetchData}>Refresh</Button>
                        <Button variant="ghost" onClick={cleanLogs}>Clean Old Logs</Button>
                    </div>
                </div>
            </div>

            <Tabs
                tabs={[
                    { id: 'overview', label: 'Overview' },
                    { id: 'logs', label: 'Request Logs' },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

            {activeTab === 'overview' && (
                <>
                    {/* Metrics Cards */}
                    <div className="grid grid-cols-4 mb-lg">
                        <MetricCard
                            title="Total Requests"
                            value={analytics?.totalRequests || 0}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Error Rate"
                            value={`${(analytics?.errorRate || 0).toFixed(2)}%`}
                            status={analytics?.errorRate && analytics.errorRate > 5 ? 'error' : 'success'}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Total Tokens"
                            value={formatNumber(analytics?.totalTokens || 0)}
                            subtitle="Estimated"
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                            }
                        />
                        <MetricCard
                            title="Avg Payload"
                            value={formatBytes(analytics?.avgPayloadSize || 0)}
                            icon={
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                            }
                        />
                    </div>

                    {/* Latency Percentiles */}
                    <div className="card mb-lg">
                        <div className="card-header">
                            <h3>Latency Percentiles</h3>
                        </div>
                        <div className="grid grid-cols-3">
                            <div className="metric p-md" style={{ textAlign: 'center' }}>
                                <div className="metric-label">P50</div>
                                <div className="metric-value">{analytics?.latencyPercentiles.p50 || 0}ms</div>
                            </div>
                            <div className="metric p-md" style={{ textAlign: 'center' }}>
                                <div className="metric-label">P95</div>
                                <div className="metric-value" style={{ color: analytics?.latencyPercentiles.p95 && analytics.latencyPercentiles.p95 > 2000 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                                    {analytics?.latencyPercentiles.p95 || 0}ms
                                </div>
                            </div>
                            <div className="metric p-md" style={{ textAlign: 'center' }}>
                                <div className="metric-label">P99</div>
                                <div className="metric-value" style={{ color: analytics?.latencyPercentiles.p99 && analytics.latencyPercentiles.p99 > 5000 ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
                                    {analytics?.latencyPercentiles.p99 || 0}ms
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Request Rate Chart (simplified) */}
                    <div className="card">
                        <div className="card-header">
                            <h3>Request Rate</h3>
                        </div>
                        <div className="flex gap-xs" style={{ height: 100, alignItems: 'flex-end' }}>
                            {analytics?.requestRate.map((item, i) => (
                                <div
                                    key={i}
                                    style={{
                                        flex: 1,
                                        backgroundColor: 'var(--color-accent)',
                                        height: `${Math.max(5, (item.count / Math.max(...analytics.requestRate.map(r => r.count))) * 100)}%`,
                                        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                    }}
                                    title={`${item.time}: ${item.count} requests`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between text-muted mt-sm" style={{ fontSize: '0.7rem' }}>
                            <span>{analytics?.requestRate[0]?.time || ''}</span>
                            <span>{analytics?.requestRate[analytics.requestRate.length - 1]?.time || ''}</span>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'logs' && (
                <div className="card">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Model</th>
                                <th>Endpoint</th>
                                <th>Latency</th>
                                <th>TTFT</th>
                                <th>Tokens</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="text-muted font-mono" style={{ fontSize: '0.75rem' }}>
                                        {new Date(log.timestamp).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}
                                    </td>
                                    <td className="font-mono">{log.model || '-'}</td>
                                    <td className="font-mono">{log.endpoint}</td>
                                    <td className="font-mono">{log.latencyMs}ms</td>
                                    <td className="font-mono">{log.ttftMs !== null ? `${log.ttftMs}ms` : '-'}</td>
                                    <td className="font-mono">{log.tokensEstimated || '-'}</td>
                                    <td>
                                        {log.error ? (
                                            <Badge variant="error">ERROR</Badge>
                                        ) : (
                                            <Badge variant="success">OK</Badge>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
