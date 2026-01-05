'use client';

import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    unit?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    status?: 'success' | 'warning' | 'error' | 'default';
    subtitle?: string;
}

export function MetricCard({ title, value, unit, icon, trend, status = 'default', subtitle }: MetricCardProps) {
    const statusColors = {
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        default: 'var(--color-accent)',
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-sm">
                <span className="text-secondary" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {title}
                </span>
                {icon && <span style={{ color: statusColors[status] }}>{icon}</span>}
            </div>
            <div className="metric-value" style={{ color: statusColors[status] }}>
                {value}
                {unit && <span style={{ fontSize: '0.875rem', marginLeft: '4px', color: 'var(--color-text-secondary)' }}>{unit}</span>}
            </div>
            {subtitle && <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '4px' }}>{subtitle}</div>}
        </div>
    );
}

interface ProgressBarProps {
    value: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    status?: 'success' | 'warning' | 'error' | 'default';
    size?: 'sm' | 'md';
}

export function ProgressBar({ value, max = 100, label, showValue = true, status = 'default', size = 'md' }: ProgressBarProps) {
    const percent = Math.min(100, (value / max) * 100);
    const colors = {
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        error: 'var(--color-error)',
        default: 'var(--color-accent)',
    };

    return (
        <div>
            {(label || showValue) && (
                <div className="flex justify-between mb-xs" style={{ fontSize: '0.75rem' }}>
                    {label && <span className="text-secondary">{label}</span>}
                    {showValue && <span className="font-mono text-muted">{percent.toFixed(1)}%</span>}
                </div>
            )}
            <div className="progress" style={{ height: size === 'sm' ? '3px' : '6px' }}>
                <div
                    className="progress-bar"
                    style={{
                        width: `${percent}%`,
                        backgroundColor: colors[status],
                    }}
                />
            </div>
        </div>
    );
}

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'error';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
    return <span className={`badge badge-${variant}`}>{children}</span>;
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'icon';
    loading?: boolean;
}

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    disabled,
    ...props
}: ButtonProps) {
    const sizeClass = size === 'sm' ? 'btn-sm' : size === 'icon' ? 'btn-icon' : '';

    return (
        <button
            className={`btn btn-${variant} ${sizeClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && <span className="spinner" />}
            {children}
        </button>
    );
}

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
    return (
        <label className="flex items-center gap-sm" style={{ cursor: 'pointer' }}>
            <div
                className={`toggle ${checked ? 'active' : ''}`}
                onClick={() => onChange(!checked)}
            />
            {label && <span className="text-secondary">{label}</span>}
        </label>
    );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: { value: string; label: string }[];
    label?: string;
}

export function Select({ options, label, ...props }: SelectProps) {
    return (
        <div>
            {label && <label className="label">{label}</label>}
            <select className="select" {...props}>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, ...props }: InputProps) {
    return (
        <div>
            {label && <label className="label">{label}</label>}
            <input className="input" {...props} />
        </div>
    );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export function Textarea({ label, ...props }: TextareaProps) {
    return (
        <div>
            {label && <label className="label">{label}</label>}
            <textarea className="textarea" {...props} />
        </div>
    );
}

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="modal-body">{children}</div>
                {footer && <div className="modal-footer">{footer}</div>}
            </div>
        </div>
    );
}

interface TabsProps {
    tabs: { id: string; label: string }[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
    return (
        <div className="tabs">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="empty-state">
            {icon}
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>{title}</h3>
            {description && <p className="text-muted">{description}</p>}
            {action && <div style={{ marginTop: 'var(--space-md)' }}>{action}</div>}
        </div>
    );
}
