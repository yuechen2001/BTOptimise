/**
 * Project Timeline Row Component
 *
 * Displays a single project's timeline with:
 * - Horizontal timeline bar spanning from today to key collection
 * - Milestone markers (BTO launch, option fee, signing, key collection, savings milestones)
 * - Color-coded milestones by type (critical, payment, savings)
 * - Click to expand milestone details
 */

import { useMemo } from 'react';
import type { ProjectTimeline, TimelineMilestone } from '../../types';

interface ProjectTimelineRowProps {
    projectTimeline: ProjectTimeline;
    onMilestoneClick?: (milestone: TimelineMilestone) => void;
    isExpanded?: boolean;
}

export default function ProjectTimelineRow({ 
    projectTimeline, 
    onMilestoneClick,
    isExpanded = false 
}: ProjectTimelineRowProps) {
    const { project, milestones, affordability } = projectTimeline;

    // Calculate timeline range (from today to furthest milestone + 6 months buffer)
    const timelineRange = useMemo(() => {
        const now = new Date();
        if (milestones.length === 0) {
            return { start: now, end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) }; // 1 year default
        }

        const lastMilestone = milestones.reduce((latest, m) => {
            const mDate = new Date(m.date);
            const latestDate = new Date(latest.date);
            return mDate > latestDate ? m : latest;
        });

        const end = new Date(lastMilestone.date);
        end.setMonth(end.getMonth() + 6); // 6 months buffer

        return { start: now, end };
    }, [milestones]);

    // Calculate position (0-100%) for a milestone date
    const getMilestonePosition = (date: string): number => {
        const milestoneDate = new Date(date).getTime();
        const startTime = timelineRange.start.getTime();
        const endTime = timelineRange.end.getTime();
        const position = ((milestoneDate - startTime) / (endTime - startTime)) * 100;
        return Math.max(0, Math.min(100, position)); // Clamp between 0-100%
    };

    // Get color for milestone type
    const getMilestoneColor = (type: string): string => {
        if (type === 'dia_expires' || type === 'ehg_disqualification' || type === 'grant_tier_drop') {
            return '#EF4444'; // Red for critical
        }
        if (type === 'bto_launch' || type === 'option_fee_due' || type === 'signing_payment_due' || type === 'key_collection_payment_due') {
            return '#3B82F6'; // Blue for payment milestones
        }
        if (type === 'cash_ready_option_fee' || type === 'downpayment_saved' || type === 'monthly_payment_affordable') {
            return '#10B981'; // Green for savings milestones
        }
        return '#6B7280'; // Gray for informational
    };

    // Get milestone title for tooltip
    const getMilestoneTitle = (milestone: TimelineMilestone): string => {
        const date = new Date(milestone.date).toLocaleDateString('en-SG', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric' 
        });
        let title = `${milestone.title} - ${date}`;
        if (milestone.paymentAmount) {
            title += `\nAmount: $${milestone.paymentAmount.toLocaleString()}`;
            if (milestone.cashAmount) title += ` (Cash: $${milestone.cashAmount.toLocaleString()})`;
        }
        if (milestone.canAfford !== undefined) {
            title += `\n${milestone.canAfford ? '✓ Can Afford' : '✗ Cannot Afford'}`;
        }
        title += `\n${milestone.description}`;
        return title;
    };

    // Check if project is affordable (all milestones)
    const isAffordable = affordability.canAffordOptionFee && 
                          affordability.canAffordSigning && 
                          affordability.canAffordKeyCollection;

    return (
        <div
            style={{
                marginBottom: '1.5rem',
                padding: '1.5rem',
                background: 'var(--clr-bg-secondary)',
                border: `2px solid ${isAffordable ? 'var(--clr-green)' : 'var(--clr-border)'}`,
                borderRadius: '8px',
                transition: 'box-shadow 300ms ease',
            }}
        >
            {/* Project Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                            {project.projectName}
                        </h3>
                        <span
                            style={{
                                padding: '0.25rem 0.75rem',
                                background: getClassificationColor(project.classification),
                                color: 'white',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                            }}
                        >
                            {project.classification}
                        </span>
                    </div>
                    <div style={{ 
                        padding: '0.5rem 1rem',
                        background: isAffordable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: isAffordable ? 'var(--clr-green)' : 'var(--clr-red)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                    }}>
                        {isAffordable ? '✓ Affordable' : '✗ Not Yet Affordable'}
                    </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
                    {project.flatType} • ${project.price.toLocaleString()}
                    {project.estimatedLaunchDate && <> • Launch: {project.estimatedLaunchDate}</>}
                </div>
            </div>

            {/* Timeline Visualization */}
            <div style={{ position: 'relative', height: '80px', marginBottom: '1rem' }}>
                {/* Timeline Bar */}
                <div
                    style={{
                        position: 'absolute',
                        top: '40px',
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'var(--clr-border)',
                        borderRadius: '2px',
                    }}
                />

                {/* Today Marker */}
                <div
                    style={{
                        position: 'absolute',
                        left: '0%',
                        top: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}
                >
                    <div
                        style={{
                            width: '2px',
                            height: '45px',
                            background: 'var(--clr-text-muted)',
                        }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginTop: '0.25rem' }}>
                        Today
                    </span>
                </div>

                {/* Milestone Markers */}
                {milestones.map((milestone, index) => {
                    const position = getMilestonePosition(milestone.date);
                    const color = getMilestoneColor(milestone.type);
                    const tooltipText = getMilestoneTitle(milestone);

                    return (
                        <div
                            key={index}
                            onClick={() => onMilestoneClick?.(milestone)}
                            style={{
                                position: 'absolute',
                                left: `${position}%`,
                                top: milestone.significance === "critical" ? '10px' : '28px',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                cursor: 'pointer',
                                zIndex: milestone.significance === "critical" ? 20 : 10,
                                transition: 'all 200ms ease',
                            }}
                            title={tooltipText}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1.3)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
                            }}
                        >
                            {/* Milestone Dot */}
                            <div
                                style={{
                                    width: milestone.significance === 'critical' ? '16px' : '12px',
                                    height: milestone.significance === 'critical' ? '16px' : '12px',
                                    background: color,
                                    border: `2px solid white`,
                                    borderRadius: '50%',
                                    boxShadow: `0 0 0 2px ${color}, 0 2px 8px rgba(0,0,0,0.2)`,
                                    animation: milestone.significance === 'critical' ? 'pulse 2s infinite' : 'none',
                                }}
                            />
                            {/* Short Label on hover */}
                            <span 
                                style={{ 
                                    fontSize: '0.65rem', 
                                    color: color,
                                    fontWeight: 600,
                                    textAlign: 'center',
                                    marginTop: '0.25rem',
                                    maxWidth: '80px',
                                    lineHeight: 1.2,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}
                            >
                                {milestone.title.replace(/Payment|Due|Assessment|Optimizer/g, '').trim()}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Affordability Summary (Collapsed by default) */}
            {isExpanded && (
                <div
                    style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'var(--clr-bg-tertiary)',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                            <strong>Affordability Status:</strong>
                            <div>
                                Option Fee: {affordability.canAffordOptionFee ? '✓ Can Afford' : '✗ Cannot Afford'}
                            </div>
                            <div>
                                Signing: {affordability.canAffordSigning ? '✓ Can Afford' : '✗ Cannot Afford'}
                            </div>
                            <div>
                                Key Collection: {affordability.canAffordKeyCollection ? '✓ Can Afford' : '✗ Cannot Afford'}
                            </div>
                        </div>
                        <div>
                            <strong>Cash Shortfalls:</strong>
                            <div style={{ fontSize: '0.85rem' }}>
                                Option: ${affordability.optionFeeShortfall.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                Signing: ${affordability.signingShortfall.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.85rem' }}>
                                Key Collection: ${affordability.keyCollectionShortfall.toLocaleString()}
                            </div>
                        </div>
                        <div>
                            <strong>Total Cash Shortfall:</strong>
                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: affordability.cashShortfall > 0 ? 'var(--clr-red)' : 'var(--clr-green)' }}>
                                ${affordability.cashShortfall.toLocaleString()}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pulse Animation for Critical Milestones */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                }
            `}</style>
        </div>
    );
}

/**
 * Helper: Get color for project classification
 */
function getClassificationColor(classification?: string): string {
    switch (classification) {
        case 'Prime':
            return '#8B5CF6'; // Purple
        case 'Plus':
            return '#3B82F6'; // Blue
        case 'Standard':
            return '#10B981'; // Green
        default:
            return '#6B7280'; // Gray
    }
}
