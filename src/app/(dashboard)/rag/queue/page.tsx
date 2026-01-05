'use client';

import { useEffect, useState } from 'react';
import { Button, Badge, Modal } from '@/components/ui';

interface QueueItem {
    id: string;
    seasonId: string;
    content: string;
    source: string;
    createdAt: string;
}

interface Season {
    id: string;
    name: string;
    model: string;
}

export default function ApprovalQueuePage() {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [queueRes, seasonsRes] = await Promise.all([
                fetch('/api/rag?type=queue'),
                fetch('/api/rag?type=seasons'),
            ]);
            if (queueRes.ok) {
                const data = await queueRes.json();
                setQueue(data.queue || []);
            }
            if (seasonsRes.ok) {
                const data = await seasonsRes.json();
                setSeasons(data.seasons || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const approveItem = async (id: string) => {
        try {
            await fetch('/api/rag', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'approve-queue', id }),
            });
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            console.error('Approve failed:', error);
        }
    };

    const rejectItem = async (id: string) => {
        try {
            await fetch('/api/rag', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'reject-queue', id }),
            });
            setSelectedItem(null);
            fetchData();
        } catch (error) {
            console.error('Reject failed:', error);
        }
    };

    const approveAll = async () => {
        if (!confirm('Approve all pending items for ALL seasons?')) return;
        try {
            await fetch('/api/rag', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'approve-all-queue' }),
            });
            fetchData();
        } catch (error) {
            console.error('Approve all failed:', error);
        }
    };

    const getSeasonName = (seasonId: string) => {
        const season = seasons.find(s => s.id === seasonId);
        return season ? `${season.name} (${season.model})` : 'Unknown';
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
                        <h1 className="page-title">Approval Queue</h1>
                        <p className="page-description">Review and approve chat messages for RAG inclusion</p>
                    </div>
                    {queue.length > 0 && (
                        <Button onClick={approveAll} variant="primary">
                            Approve All
                        </Button>
                    )}
                </div>
            </div>

            {queue.length === 0 ? (
                <div className="card">
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <h3>Queue is empty</h3>
                        <p className="text-muted">No items waiting for approval</p>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header">
                        <h3>Pending Items</h3>
                        <Badge>{queue.length} pending</Badge>
                    </div>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Season</th>
                                <th>Source</th>
                                <th>Content Preview</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <Badge>{getSeasonName(item.seasonId)}</Badge>
                                    </td>
                                    <td>{item.source}</td>
                                    <td style={{ maxWidth: 300 }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {item.content.substring(0, 100)}...
                                        </div>
                                    </td>
                                    <td className="text-muted">{new Date(item.createdAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' })}</td>
                                    <td>
                                        <div className="flex gap-xs">
                                            <Button size="sm" variant="ghost" onClick={() => setSelectedItem(item)}>
                                                View
                                            </Button>
                                            <Button size="sm" onClick={() => approveItem(item.id)}>
                                                Approve
                                            </Button>
                                            <Button size="sm" variant="danger" onClick={() => rejectItem(item.id)}>
                                                Reject
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* View Modal */}
            <Modal
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
                title="Review Content"
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setSelectedItem(null)}>Cancel</Button>
                        <Button variant="danger" onClick={() => selectedItem && rejectItem(selectedItem.id)}>Reject</Button>
                        <Button onClick={() => selectedItem && approveItem(selectedItem.id)}>Approve</Button>
                    </>
                }
            >
                {selectedItem && (
                    <div>
                        <div className="flex gap-sm mb-md">
                            <Badge>{getSeasonName(selectedItem.seasonId)}</Badge>
                            <Badge variant="default">{selectedItem.source}</Badge>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', maxHeight: 400, overflow: 'auto' }}>
                            {selectedItem.content}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
