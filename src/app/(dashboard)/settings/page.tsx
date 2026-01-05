'use client';

import { useState, useEffect } from 'react';
import { Button, Input, Toggle } from '@/components/ui';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        ollamaBaseUrl: process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || 'http://localhost:11434',
        logRetentionDays: 30,
        enableAlerts: true,
        cpuAlertThreshold: 80,
        memoryAlertThreshold: 80,
        diskAlertThreshold: 90,
        gpuAlertThreshold: 90,
        defaultKeepAlive: '5m',
        metricsInterval: 5,
    });

    useEffect(() => {
        const savedSettings = localStorage.getItem('ollama-dashboard-settings');
        if (savedSettings) {
            try {
                setSettings(JSON.parse(savedSettings));
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    }, []);

    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        // In production, this would save to a config file or database
        localStorage.setItem('ollama-dashboard-settings', JSON.stringify(settings));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            <div className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Settings</h1>
                        <p className="page-description">Configure dashboard behavior and thresholds</p>
                    </div>
                    <Button onClick={handleSave}>
                        {saved ? '✓ Saved' : 'Save Settings'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-lg">
                {/* Connection Settings */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Connection</h3>
                    <div className="flex flex-col gap-md">
                        <Input
                            label="Ollama Base URL"
                            value={settings.ollamaBaseUrl}
                            onChange={(e) => setSettings({ ...settings, ollamaBaseUrl: e.target.value })}
                            placeholder="http://localhost:11434"
                        />
                        <Input
                            label="Default Keep-Alive Duration"
                            value={settings.defaultKeepAlive}
                            onChange={(e) => setSettings({ ...settings, defaultKeepAlive: e.target.value })}
                            placeholder="5m"
                        />
                    </div>
                </div>

                {/* Data Retention */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>Data Retention</h3>
                    <div className="flex flex-col gap-md">
                        <Input
                            label="Log Retention (days)"
                            type="number"
                            value={settings.logRetentionDays}
                            onChange={(e) => setSettings({ ...settings, logRetentionDays: parseInt(e.target.value) })}
                        />
                        <Input
                            label="Metrics Polling Interval (seconds)"
                            type="number"
                            value={settings.metricsInterval}
                            onChange={(e) => setSettings({ ...settings, metricsInterval: parseInt(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Alerts */}
                <div className="card">
                    <div className="flex justify-between items-center mb-md">
                        <h3>Alerts</h3>
                        <Toggle
                            checked={settings.enableAlerts}
                            onChange={(checked) => setSettings({ ...settings, enableAlerts: checked })}
                            label="Enable"
                        />
                    </div>

                    {settings.enableAlerts && (
                        <div className="flex flex-col gap-md">
                            <div>
                                <label className="label">CPU Alert Threshold: {settings.cpuAlertThreshold}%</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.cpuAlertThreshold}
                                    onChange={(e) => setSettings({ ...settings, cpuAlertThreshold: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label className="label">Memory Alert Threshold: {settings.memoryAlertThreshold}%</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.memoryAlertThreshold}
                                    onChange={(e) => setSettings({ ...settings, memoryAlertThreshold: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label className="label">Disk Alert Threshold: {settings.diskAlertThreshold}%</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.diskAlertThreshold}
                                    onChange={(e) => setSettings({ ...settings, diskAlertThreshold: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div>
                                <label className="label">GPU Alert Threshold: {settings.gpuAlertThreshold}%</label>
                                <input
                                    type="range"
                                    min="50"
                                    max="100"
                                    value={settings.gpuAlertThreshold}
                                    onChange={(e) => setSettings({ ...settings, gpuAlertThreshold: parseInt(e.target.value) })}
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* About */}
                <div className="card">
                    <h3 style={{ marginBottom: 'var(--space-md)' }}>About</h3>
                    <div className="flex flex-col gap-sm">
                        <div className="flex justify-between">
                            <span className="text-secondary">Version</span>
                            <span className="font-mono">1.0.0</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary">Framework</span>
                            <span className="font-mono">Next.js 14</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-secondary">Database</span>
                            <span className="font-mono">SQLite</span>
                        </div>
                    </div>
                    <div className="mt-md text-muted" style={{ fontSize: '0.75rem' }}>
                        Built for Ollama monitoring and management. Ready for multi-user expansion.
                    </div>
                </div>
            </div>
        </div>
    );
}
