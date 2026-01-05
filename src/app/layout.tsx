import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Ollama Management',
    description: 'Monitoring and Management System for Ollama LLM',
    icons: {
        icon: '/VenusLogo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
