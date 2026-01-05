'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    {
        section: 'Overview',
        items: [
            { name: 'Dashboard', href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        ]
    },
    {
        section: 'AI',
        items: [
            { name: 'Chat Playground', href: '/chat', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
            { name: 'Models', href: '/models', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
            { name: 'Presets', href: '/presets', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
        ]
    },
    {
        section: 'RAG',
        items: [
            { name: 'Seasons', href: '/rag', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
            { name: 'Training', href: '/training', icon: 'M2 12a10 10 0 1 0 20 0 10 10 0 0 0-20 0zm0 0l4 4m0-8l-4 4m20 0l-4-4m0 8l4-4' },
            { name: 'Approval Queue', href: '/rag/queue', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
        ]
    },
    {
        section: 'Operations',
        items: [
            { name: 'Warmup Manager', href: '/warmup', icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
            { name: 'Analytics', href: '/analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { name: 'System Monitor', href: '/monitoring', icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
        ]
    },
    {
        section: 'Config',
        items: [
            { name: 'Settings', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
        ]
    },
];

// Ollama Llama Logo SVG
function OllamaLogo() {
    return (
        <svg width="32" height="32" viewBox="0 0 160 160" fill="none" className="ollama-logo">
            <defs>
                <linearGradient id="llamaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00d4ff" />
                    <stop offset="100%" stopColor="#7c3aed" />
                </linearGradient>
            </defs>
            {/* Llama head shape */}
            <ellipse cx="80" cy="90" rx="45" ry="50" fill="url(#llamaGradient)" />
            {/* Ears */}
            <ellipse cx="50" cy="45" rx="12" ry="25" fill="url(#llamaGradient)" transform="rotate(-15 50 45)" />
            <ellipse cx="110" cy="45" rx="12" ry="25" fill="url(#llamaGradient)" transform="rotate(15 110 45)" />
            {/* Inner ears */}
            <ellipse cx="50" cy="45" rx="6" ry="15" fill="#0a1628" transform="rotate(-15 50 45)" />
            <ellipse cx="110" cy="45" rx="6" ry="15" fill="#0a1628" transform="rotate(15 110 45)" />
            {/* Eyes */}
            <circle cx="60" cy="85" r="8" fill="#0a1628" />
            <circle cx="100" cy="85" r="8" fill="#0a1628" />
            <circle cx="62" cy="83" r="3" fill="white" />
            <circle cx="102" cy="83" r="3" fill="white" />
            {/* Nose/Snout */}
            <ellipse cx="80" cy="110" rx="20" ry="15" fill="#0a1628" opacity="0.3" />
            <ellipse cx="80" cy="108" rx="8" ry="5" fill="#0a1628" />
            {/* Mouth */}
            <path d="M70 120 Q80 128 90 120" stroke="#0a1628" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>
    );
}

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {/* <OllamaLogo /> */}
                    <img src="/VenusLogo.png" alt="Logo" className="ollama-logo" width="32" height="32" />
                    <div className="logo-text">
                        <span className="logo-title">Ollama</span>
                        <span className="logo-subtitle">Management</span>
                    </div>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navigation.map((group) => (
                    <div key={group.section} className="sidebar-section">
                        <div className="sidebar-section-title">{group.section}</div>
                        {group.items.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                                </svg>
                                <span>{item.name}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="status-indicator">
                    <span className="status-dot online pulse" id="ollama-status"></span>
                    <span className="status-label">Ollama Connected</span>
                </div>
                <div className="version-badge">v1.0.0</div>
            </div>
        </aside>
    );
}
