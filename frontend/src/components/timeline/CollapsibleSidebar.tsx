/**
 * Collapsible Sidebar Component
 *
 * Responsive sidebar for timeline configuration:
 * - Desktop: 280px width sidebar on left (collapsible to 60px)
 * - Mobile: Full-width panel at top (collapsible accordion)
 * - Smooth transitions for open/close
 */

import type { ReactNode } from 'react';

interface CollapsibleSidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    children: ReactNode;
}

export default function CollapsibleSidebar({ isOpen, onToggle, children }: CollapsibleSidebarProps) {
    return (
        <>
            {/* Desktop Sidebar (>768px) */}
            <aside
                className="timeline-sidebar"
                style={{
                    position: 'fixed',
                    top: '80px', // Below header
                    left: 0,
                    height: 'calc(100vh - 80px)',
                    width: isOpen ? '280px' : '60px',
                    background: 'var(--clr-bg-secondary)',
                    borderRight: '1px solid var(--clr-border)',
                    transition: 'width 300ms ease',
                    zIndex: 100,
                    overflowY: 'hidden',
                    overflowX: 'hidden',
                }}
            >
                {/* Toggle Button */}
                <button
                    onClick={onToggle}
                    style={{
                        position: 'sticky',
                        top: 0,
                        width: '100%',
                        padding: '1rem',
                        background: 'var(--clr-bg-secondary)',
                        border: 'none',
                        borderBottom: '1px solid var(--clr-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isOpen ? 'space-between' : 'center',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--clr-text)',
                        zIndex: 10,
                    }}
                    aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isOpen ? (
                        <>
                            <span>⚙️ Configuration</span>
                            <span style={{ fontSize: '1.2rem' }}>‹</span>
                        </>
                    ) : (
                        <span style={{ fontSize: '1.2rem', transform: 'rotate(180deg)' }}>‹</span>
                    )}
                </button>

                {/* Sidebar Content */}
                <div
                    style={{
                        height: 'calc(100% - 60px)', // Subtract toggle button height
                        overflowY: isOpen ? 'auto' : 'hidden',
                        overflowX: 'hidden',
                        padding: isOpen ? '1rem' : '0.5rem',
                        opacity: isOpen ? 1 : 0,
                        visibility: isOpen ? 'visible' : 'hidden',
                        transition: 'opacity 200ms ease, visibility 200ms ease',
                    }}
                >
                    {children}
                </div>
            </aside>

            {/* Mobile Accordion (≤768px) */}
            <div
                className="timeline-sidebar-mobile"
                style={{
                    display: 'none', // Hidden on desktop, shown via CSS media query
                    width: '100%',
                    background: 'var(--clr-bg-secondary)',
                    borderBottom: '1px solid var(--clr-border)',
                }}
            >
                <button
                    onClick={onToggle}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        color: 'var(--clr-text)',
                    }}
                    aria-label={isOpen ? 'Collapse configuration' : 'Expand configuration'}
                >
                    <span>⚙️ Configuration</span>
                    <span style={{ fontSize: '1.2rem' }}>{isOpen ? '▲' : '▼'}</span>
                </button>

                {isOpen && (
                    <div
                        style={{
                            padding: '1rem',
                            borderTop: '1px solid var(--clr-border)',
                        }}
                    >
                        {children}
                    </div>
                )}
            </div>

            {/* Spacer for fixed sidebar on desktop */}
            <div
                className="timeline-sidebar-spacer"
                style={{
                    width: isOpen ? '280px' : '60px',
                    flexShrink: 0,
                    transition: 'width 300ms ease',
                }}
            />

            {/* Responsive Styles */}
            <style>{`
                @media (max-width: 768px) {
                    .timeline-sidebar {
                        display: none !important;
                    }
                    .timeline-sidebar-spacer {
                        display: none !important;
                    }
                    .timeline-sidebar-mobile {
                        display: block !important;
                    }
                }
                
                @media (min-width: 769px) {
                    .timeline-sidebar-mobile {
                        display: none !important;
                    }
                }
            `}</style>
        </>
    );
}
