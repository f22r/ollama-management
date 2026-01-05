import { exec } from 'child_process';
import { promisify } from 'util';
import type { SystemMetrics } from '@/types';

const execAsync = promisify(exec);

export async function getSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();

    // Get CPU usage
    const cpuData = await getCpuUsage();

    // Get memory usage
    const memoryData = await getMemoryUsage();

    // Get disk usage
    const diskData = await getDiskUsage();

    // Get network stats
    const networkData = await getNetworkStats();

    // Get GPU stats (if available)
    const gpuData = await getGpuStats();

    return {
        timestamp,
        cpu: cpuData,
        memory: memoryData,
        disk: diskData,
        network: networkData,
        gpu: gpuData,
    };
}

async function getCpuUsage(): Promise<{ usage: number; cores: number[] }> {
    try {
        // Get overall CPU usage from /proc/stat
        const { stdout } = await execAsync("grep 'cpu' /proc/stat | head -1");
        const parts = stdout.trim().split(/\s+/);
        const idle = parseInt(parts[4], 10);
        const total = parts.slice(1).reduce((sum, val) => sum + parseInt(val, 10), 0);
        const usage = Math.round(((total - idle) / total) * 100);

        // Get per-core usage
        const { stdout: coresStdout } = await execAsync("grep 'cpu[0-9]' /proc/stat");
        const coreLines = coresStdout.trim().split('\n');
        const cores = coreLines.map(line => {
            const coreParts = line.trim().split(/\s+/);
            const coreIdle = parseInt(coreParts[4], 10);
            const coreTotal = coreParts.slice(1).reduce((sum, val) => sum + parseInt(val, 10), 0);
            return Math.round(((coreTotal - coreIdle) / coreTotal) * 100);
        });

        return { usage, cores };
    } catch {
        return { usage: 0, cores: [] };
    }
}

async function getMemoryUsage(): Promise<{ used: number; total: number; usedPercent: number }> {
    try {
        const { stdout } = await execAsync("free -b | grep 'Mem:'");
        const parts = stdout.trim().split(/\s+/);
        const total = parseInt(parts[1], 10);
        const used = parseInt(parts[2], 10);
        const usedPercent = Math.round((used / total) * 100);

        return { used, total, usedPercent };
    } catch {
        return { used: 0, total: 0, usedPercent: 0 };
    }
}

async function getDiskUsage(): Promise<{ used: number; total: number; usedPercent: number }> {
    try {
        const { stdout } = await execAsync("df -B1 / | tail -1");
        const parts = stdout.trim().split(/\s+/);
        const total = parseInt(parts[1], 10);
        const used = parseInt(parts[2], 10);
        const usedPercent = Math.round((used / total) * 100);

        return { used, total, usedPercent };
    } catch {
        return { used: 0, total: 0, usedPercent: 0 };
    }
}

async function getNetworkStats(): Promise<{ rx: number; tx: number }> {
    try {
        const { stdout } = await execAsync("cat /proc/net/dev | grep -v 'lo:' | tail -n +3 | head -1");
        const parts = stdout.trim().split(/\s+/);
        const rx = parseInt(parts[1], 10);
        const tx = parseInt(parts[9], 10);

        return { rx, tx };
    } catch {
        return { rx: 0, tx: 0 };
    }
}

async function getGpuStats(): Promise<SystemMetrics['gpu'] | undefined> {
    try {
        const { stdout } = await execAsync(
            'nvidia-smi --query-gpu=name,memory.used,memory.total,utilization.gpu,temperature.gpu --format=csv,noheader,nounits'
        );

        const parts = stdout.trim().split(',').map(s => s.trim());
        if (parts.length >= 5) {
            return {
                name: parts[0],
                memoryUsed: parseInt(parts[1], 10) * 1024 * 1024, // Convert MiB to bytes
                memoryTotal: parseInt(parts[2], 10) * 1024 * 1024,
                utilization: parseInt(parts[3], 10),
                temperature: parseInt(parts[4], 10),
            };
        }
        return undefined;
    } catch {
        // nvidia-smi not available
        return undefined;
    }
}

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
}
