import { getDb } from './index';
import type { ModelMetadata, Preset, RagSeason, RagChunk, RequestLog, WarmupConfig, Alert } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// ==================== Model Metadata ====================

export function getModelMetadata(name: string): ModelMetadata | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM models WHERE name = ?').get(name) as any;
    if (!row) return null;
    return {
        name: row.name,
        isDefault: !!row.is_default,
        lastUsed: row.last_used,
        keepAliveDuration: row.keep_alive_duration,
        alwaysWarm: !!row.always_warm,
        pingInterval: row.ping_interval,
    };
}

export function getAllModelMetadata(): ModelMetadata[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM models').all() as any[];
    return rows.map(row => ({
        name: row.name,
        isDefault: !!row.is_default,
        lastUsed: row.last_used,
        keepAliveDuration: row.keep_alive_duration,
        alwaysWarm: !!row.always_warm,
        pingInterval: row.ping_interval,
    }));
}

export function upsertModelMetadata(metadata: Partial<ModelMetadata> & { name: string }): void {
    const db = getDb();
    db.prepare(`
    INSERT INTO models (name, is_default, last_used, keep_alive_duration, always_warm, ping_interval)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(name) DO UPDATE SET
      is_default = COALESCE(excluded.is_default, is_default),
      last_used = COALESCE(excluded.last_used, last_used),
      keep_alive_duration = COALESCE(excluded.keep_alive_duration, keep_alive_duration),
      always_warm = COALESCE(excluded.always_warm, always_warm),
      ping_interval = COALESCE(excluded.ping_interval, ping_interval)
  `).run(
        metadata.name,
        metadata.isDefault ? 1 : 0,
        metadata.lastUsed || null,
        metadata.keepAliveDuration || '5m',
        metadata.alwaysWarm ? 1 : 0,
        metadata.pingInterval || 0
    );
}

export function setDefaultModel(name: string): void {
    const db = getDb();
    db.prepare('UPDATE models SET is_default = 0').run();
    db.prepare('UPDATE models SET is_default = 1 WHERE name = ?').run(name);
}

export function updateLastUsed(name: string): void {
    const db = getDb();
    db.prepare('UPDATE models SET last_used = CURRENT_TIMESTAMP WHERE name = ?').run(name);
}

// ==================== Presets ====================

export function getPresets(model?: string): Preset[] {
    const db = getDb();
    let query = 'SELECT * FROM presets';
    const params: string[] = [];
    if (model) {
        query += ' WHERE model = ?';
        params.push(model);
    }
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(row => ({
        id: row.id,
        model: row.model,
        season: row.season,
        name: row.name,
        systemPrompt: row.system_prompt,
        temperature: row.temperature,
        topP: row.top_p,
        topK: row.top_k,
        numCtx: row.num_ctx,
    }));
}

export function getPreset(id: string): Preset | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM presets WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
        id: row.id,
        model: row.model,
        season: row.season,
        name: row.name,
        systemPrompt: row.system_prompt,
        temperature: row.temperature,
        topP: row.top_p,
        topK: row.top_k,
        numCtx: row.num_ctx,
    };
}

export function createPreset(preset: Omit<Preset, 'id'>): Preset {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO presets (id, model, season, name, system_prompt, temperature, top_p, top_k, num_ctx)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, preset.model, preset.season, preset.name, preset.systemPrompt, preset.temperature, preset.topP, preset.topK, preset.numCtx);
    return { id, ...preset };
}

export function updatePreset(id: string, preset: Partial<Preset>): void {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (preset.name !== undefined) { fields.push('name = ?'); values.push(preset.name); }
    if (preset.systemPrompt !== undefined) { fields.push('system_prompt = ?'); values.push(preset.systemPrompt); }
    if (preset.temperature !== undefined) { fields.push('temperature = ?'); values.push(preset.temperature); }
    if (preset.topP !== undefined) { fields.push('top_p = ?'); values.push(preset.topP); }
    if (preset.topK !== undefined) { fields.push('top_k = ?'); values.push(preset.topK); }
    if (preset.numCtx !== undefined) { fields.push('num_ctx = ?'); values.push(preset.numCtx); }

    if (fields.length > 0) {
        values.push(id);
        db.prepare(`UPDATE presets SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
}

export function deletePreset(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM presets WHERE id = ?').run(id);
}

// ==================== RAG Seasons ====================

export function getRagSeasons(model?: string): RagSeason[] {
    const db = getDb();
    let query = 'SELECT * FROM rag_seasons ORDER BY created_at DESC';
    const params: string[] = [];
    if (model) {
        query = 'SELECT * FROM rag_seasons WHERE model = ? ORDER BY created_at DESC';
        params.push(model);
    }
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(row => ({
        id: row.id,
        model: row.model,
        name: row.name,
        promptPolicy: row.prompt_policy,
        createdAt: row.created_at,
    }));
}

export function getRagSeason(id: string): RagSeason | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM rag_seasons WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
        id: row.id,
        model: row.model,
        name: row.name,
        promptPolicy: row.prompt_policy,
        createdAt: row.created_at,
    };
}

export function createRagSeason(season: Omit<RagSeason, 'id' | 'createdAt'>): RagSeason {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO rag_seasons (id, model, name, prompt_policy)
    VALUES (?, ?, ?, ?)
  `).run(id, season.model, season.name, season.promptPolicy);
    return { id, ...season, createdAt: new Date().toISOString() };
}

export function updateRagSeason(id: string, data: Partial<RagSeason>): void {
    const db = getDb();
    const fields: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.promptPolicy !== undefined) { fields.push('prompt_policy = ?'); values.push(data.promptPolicy); }

    if (fields.length > 0) {
        values.push(id);
        db.prepare(`UPDATE rag_seasons SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
}

export function deleteRagSeason(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM rag_seasons WHERE id = ?').run(id);
}

// ==================== RAG Chunks ====================

export function getRagChunks(seasonId: string, approvedOnly: boolean = false): RagChunk[] {
    const db = getDb();
    let query = 'SELECT * FROM rag_chunks WHERE season_id = ?';
    if (approvedOnly) query += ' AND approved = 1';
    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(seasonId) as any[];
    return rows.map(row => ({
        id: row.id,
        seasonId: row.season_id,
        content: row.content,
        source: row.source,
        approved: !!row.approved,
        createdAt: row.created_at,
    }));
}

export function createRagChunk(chunk: Omit<RagChunk, 'id' | 'createdAt'>): RagChunk {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO rag_chunks (id, season_id, content, source, approved)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, chunk.seasonId, chunk.content, chunk.source, chunk.approved ? 1 : 0);
    return { id, ...chunk, createdAt: new Date().toISOString() };
}

export function approveRagChunk(id: string): void {
    const db = getDb();
    db.prepare('UPDATE rag_chunks SET approved = 1 WHERE id = ?').run(id);
}

export function deleteRagChunk(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM rag_chunks WHERE id = ?').run(id);
}

// ==================== Approval Queue ====================

export function getApprovalQueue(seasonId?: string): { id: string; seasonId: string; content: string; source: string; createdAt: string }[] {
    const db = getDb();
    let query = 'SELECT * FROM approval_queue';
    const params: string[] = [];
    if (seasonId) {
        query += ' WHERE season_id = ?';
        params.push(seasonId);
    }
    query += ' ORDER BY created_at DESC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(row => ({
        id: row.id,
        seasonId: row.season_id,
        content: row.content,
        source: row.source,
        createdAt: row.created_at,
    }));
}

export function addToApprovalQueue(seasonId: string, content: string, source: string = 'chat'): string {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO approval_queue (id, season_id, content, source)
    VALUES (?, ?, ?, ?)
  `).run(id, seasonId, content, source);
    return id;
}

export function approveFromQueue(id: string): void {
    const db = getDb();
    const item = db.prepare('SELECT * FROM approval_queue WHERE id = ?').get(id) as any;
    if (item) {
        createRagChunk({
            seasonId: item.season_id,
            content: item.content,
            source: item.source,
            approved: true,
        });
        db.prepare('DELETE FROM approval_queue WHERE id = ?').run(id);
    }
}

export function rejectFromQueue(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM approval_queue WHERE id = ?').run(id);
}

export function approveAllFromQueue(seasonId?: string): void {
    const db = getDb();
    const items = getApprovalQueue(seasonId);

    if (items.length === 0) return;

    const insertChunk = db.prepare(`
        INSERT INTO rag_chunks (id, season_id, content, source, approved, created_at)
        VALUES (@id, @seasonId, @content, @source, 1, @createdAt)
    `);

    const deleteItem = db.prepare('DELETE FROM approval_queue WHERE id = ?');

    db.transaction(() => {
        for (const item of items) {
            insertChunk.run({
                id: uuidv4(),
                seasonId: item.seasonId,
                content: item.content,
                source: item.source,
                createdAt: new Date().toISOString()
            });
            deleteItem.run(item.id);
        }
    })();
}

// ==================== Request Logs ====================

export function logRequest(log: Omit<RequestLog, 'id' | 'timestamp'>): void {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO request_logs (id, model, endpoint, method, payload_size, response_size, latency_ms, ttft_ms, tokens_estimated, error, parameters)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, log.model, log.endpoint, log.method, log.payloadSize, log.responseSize, log.latencyMs, log.ttftMs, log.tokensEstimated, log.error, log.parameters);
}

export function getRequestLogs(limit: number = 100, offset: number = 0): RequestLog[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM request_logs ORDER BY timestamp DESC LIMIT ? OFFSET ?').all(limit, offset) as any[];
    return rows.map(row => ({
        id: row.id,
        timestamp: row.timestamp,
        model: row.model,
        endpoint: row.endpoint,
        method: row.method,
        payloadSize: row.payload_size,
        responseSize: row.response_size,
        latencyMs: row.latency_ms,
        ttftMs: row.ttft_ms,
        tokensEstimated: row.tokens_estimated,
        error: row.error,
        parameters: row.parameters,
    }));
}

export function getAnalytics(hours: number = 24): {
    requestRate: { time: string; count: number }[];
    latencyPercentiles: { p50: number; p95: number; p99: number };
    errorRate: number;
    totalRequests: number;
    totalTokens: number;
    avgPayloadSize: number;
} {
    const db = getDb();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Request rate by hour
    const rateRows = db.prepare(`
    SELECT strftime('%Y-%m-%d %H:00', timestamp) as time, COUNT(*) as count
    FROM request_logs
    WHERE timestamp >= ?
    GROUP BY time
    ORDER BY time
  `).all(since) as any[];

    // Latencies
    const latencies = db.prepare(`
    SELECT latency_ms FROM request_logs WHERE timestamp >= ? AND error IS NULL ORDER BY latency_ms
  `).all(since) as any[];

    const latencyValues = latencies.map((r: any) => r.latency_ms);
    const p50 = latencyValues[Math.floor(latencyValues.length * 0.5)] || 0;
    const p95 = latencyValues[Math.floor(latencyValues.length * 0.95)] || 0;
    const p99 = latencyValues[Math.floor(latencyValues.length * 0.99)] || 0;

    // Aggregates
    const stats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN error IS NOT NULL THEN 1 ELSE 0 END) as errors,
      SUM(tokens_estimated) as tokens,
      AVG(payload_size) as avg_payload
    FROM request_logs
    WHERE timestamp >= ?
  `).get(since) as any;

    return {
        requestRate: rateRows.map(r => ({ time: r.time, count: r.count })),
        latencyPercentiles: { p50, p95, p99 },
        errorRate: stats.total > 0 ? (stats.errors / stats.total) * 100 : 0,
        totalRequests: stats.total || 0,
        totalTokens: stats.tokens || 0,
        avgPayloadSize: stats.avg_payload || 0,
    };
}

export function cleanOldLogs(days: number): void {
    const db = getDb();
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('DELETE FROM request_logs WHERE timestamp < ?').run(cutoff);
    db.prepare('DELETE FROM system_metrics WHERE timestamp < ?').run(cutoff);
}

// ==================== Warmup Config ====================

export function getWarmupConfig(model: string): WarmupConfig | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM warmup_config WHERE model = ?').get(model) as any;
    if (!row) return null;
    return {
        model: row.model,
        pingInterval: row.ping_interval,
        warmupPayload: row.warmup_payload,
        fallbackStrategy: row.fallback_strategy as 'retry' | 'skip' | 'alert',
    };
}

export function getAllWarmupConfigs(): WarmupConfig[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM warmup_config').all() as any[];
    return rows.map(row => ({
        model: row.model,
        pingInterval: row.ping_interval,
        warmupPayload: row.warmup_payload,
        fallbackStrategy: row.fallback_strategy as 'retry' | 'skip' | 'alert',
    }));
}

export function upsertWarmupConfig(config: WarmupConfig): void {
    const db = getDb();
    db.prepare(`
    INSERT INTO warmup_config (model, ping_interval, warmup_payload, fallback_strategy)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(model) DO UPDATE SET
      ping_interval = excluded.ping_interval,
      warmup_payload = excluded.warmup_payload,
      fallback_strategy = excluded.fallback_strategy
  `).run(config.model, config.pingInterval, config.warmupPayload, config.fallbackStrategy);
}

// ==================== Alerts ====================

export function createAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'acknowledged'>): Alert {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO alerts (id, type, message, threshold, current_value)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, alert.type, alert.message, alert.threshold, alert.currentValue);
    return { id, ...alert, timestamp: new Date().toISOString(), acknowledged: false };
}

export function getAlerts(unacknowledgedOnly: boolean = false): Alert[] {
    const db = getDb();
    let query = 'SELECT * FROM alerts';
    if (unacknowledgedOnly) query += ' WHERE acknowledged = 0';
    query += ' ORDER BY timestamp DESC LIMIT 100';
    const rows = db.prepare(query).all() as any[];
    return rows.map(row => ({
        id: row.id,
        type: row.type,
        message: row.message,
        threshold: row.threshold,
        currentValue: row.current_value,
        timestamp: row.timestamp,
        acknowledged: !!row.acknowledged,
    }));
}

export function acknowledgeAlert(id: string): void {
    const db = getDb();
    db.prepare('UPDATE alerts SET acknowledged = 1 WHERE id = ?').run(id);
}

// ==================== Chat Sessions ====================

export function getChatSessions(): import('@/types').ChatSession[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM chat_sessions ORDER BY updated_at DESC').all() as any[];
    return rows.map(row => ({
        id: row.id,
        model: row.model,
        title: row.title,
        systemPrompt: row.system_prompt,
        temperature: row.temperature,
        topP: row.top_p,
        topK: row.top_k,
        numCtx: row.num_ctx,
        seasonId: row.season_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    }));
}

export function getChatSession(id: string): import('@/types').ChatSession | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
        id: row.id,
        model: row.model,
        title: row.title,
        systemPrompt: row.system_prompt,
        temperature: row.temperature,
        topP: row.top_p,
        topK: row.top_k,
        numCtx: row.num_ctx,
        seasonId: row.season_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function createChatSession(session: { model: string; title?: string; systemPrompt?: string; temperature?: number; topP?: number; topK?: number; numCtx?: number; seasonId?: string }): import('@/types').ChatSession {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO chat_sessions (id, model, title, system_prompt, temperature, top_p, top_k, num_ctx, season_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
        id,
        session.model,
        session.title || 'New Chat',
        session.systemPrompt || '',
        session.temperature ?? 0.7,
        session.topP ?? 0.9,
        session.topK ?? 40,
        session.numCtx ?? 4096,
        session.seasonId || null
    );
    return getChatSession(id)!;
}

export function updateChatSession(id: string, data: Partial<{ model: string; title: string; systemPrompt: string; temperature: number; topP: number; topK: number; numCtx: number }>): void {
    const db = getDb();
    const fields: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [];

    if (data.model !== undefined) { fields.push('model = ?'); values.push(data.model); }
    if (data.title !== undefined) { fields.push('title = ?'); values.push(data.title); }
    if (data.systemPrompt !== undefined) { fields.push('system_prompt = ?'); values.push(data.systemPrompt); }
    if (data.temperature !== undefined) { fields.push('temperature = ?'); values.push(data.temperature); }
    if (data.topP !== undefined) { fields.push('top_p = ?'); values.push(data.topP); }
    if (data.topK !== undefined) { fields.push('top_k = ?'); values.push(data.topK); }
    if (data.numCtx !== undefined) { fields.push('num_ctx = ?'); values.push(data.numCtx); }

    values.push(id);
    db.prepare(`UPDATE chat_sessions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

export function deleteChatSession(id: string): void {
    const db = getDb();
    db.prepare('DELETE FROM chat_sessions WHERE id = ?').run(id);
}

// ==================== Chat Messages ====================

export function getChatMessages(sessionId: string): import('@/types').ChatMessage[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM chat_messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId) as any[];
    return rows.map(row => ({
        id: row.id,
        sessionId: row.session_id,
        role: row.role,
        content: row.content,
        timestamp: row.timestamp,
    }));
}

export function addChatMessage(message: { sessionId: string; role: 'user' | 'assistant' | 'system'; content: string }): import('@/types').ChatMessage {
    const db = getDb();
    const id = uuidv4();
    db.prepare(`
    INSERT INTO chat_messages (id, session_id, role, content)
    VALUES (?, ?, ?, ?)
  `).run(id, message.sessionId, message.role, message.content);

    // Update session updated_at
    db.prepare('UPDATE chat_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(message.sessionId);

    return {
        id,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        timestamp: new Date().toISOString(),
    };
}

export function clearChatMessages(sessionId: string): void {
    const db = getDb();
    db.prepare('DELETE FROM chat_messages WHERE session_id = ?').run(sessionId);
}

