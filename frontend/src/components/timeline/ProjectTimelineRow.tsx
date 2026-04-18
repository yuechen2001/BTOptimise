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
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Accordion from '@radix-ui/react-accordion';
import type { ProjectTimeline, TimelineMilestone } from '../../types';
import MilestoneTooltipContent from './MilestoneTooltipContent';

interface ProjectTimelineRowProps {
    projectTimeline: ProjectTimeline;
    onMilestoneClick?: (milestone: TimelineMilestone) => void;
}

export default function ProjectTimelineRow({
    projectTimeline,
    onMilestoneClick,
}: ProjectTimelineRowProps) {
    const { project, milestones, affordability } = projectTimeline;

    // Calculate timeline range (from today to furthest milestone + 6 months buffer)
    const timelineRange = useMemo(() => {
        const now = new Date();
        const start = new Date(now);
        start.setMonth(start.getMonth() - 1); // Start 1 month before today to prevent left clustering

        if (milestones.length === 0) {
            return { start, end: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) }; // 1 year default
        }

        const lastMilestone = milestones.reduce((latest, m) => {
            const mDate = new Date(m.date);
            const latestDate = new Date(latest.date);
            return mDate > latestDate ? m : latest;
        });

        const end = new Date(lastMilestone.date);
        end.setMonth(end.getMonth() + 6); // 6 months buffer

        return { start, end };
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
        if (
            type === 'dia_expires' ||
            type === 'ehg_disqualification' ||
            type === 'grant_tier_drop'
        ) {
            return '#EF4444'; // Red for critical
        }
        if (
            type === 'bto_launch' ||
            type === 'option_fee_due' ||
            type === 'signing_payment_due' ||
            type === 'key_collection_payment_due'
        ) {
            return '#3B82F6'; // Blue for payment milestones
        }
        if (
            type === 'cash_ready_option_fee' ||
            type === 'downpayment_saved' ||
            type === 'monthly_payment_affordable'
        ) {
            return '#10B981'; // Green for savings milestones
        }
        return '#6B7280'; // Gray for informational
    };

    // Calculate year markers for timeline
    const yearMarkers = useMemo(() => {
        const markers: Array<{ year: number; position: number }> = [];
        const startYear = timelineRange.start.getFullYear();
        const endYear = timelineRange.end.getFullYear();

        // Add marker for each year from start to end
        for (let year = startYear; year <= endYear; year++) {
            const yearDate = new Date(year, 0, 1); // January 1st of each year
            const yearTime = yearDate.getTime();
            const startTime = timelineRange.start.getTime();
            const endTime = timelineRange.end.getTime();
            const position = ((yearTime - startTime) / (endTime - startTime)) * 100;

            // Only add markers that fall within the timeline range
            if (position >= 0 && position <= 100) {
                markers.push({ year, position });
            }
        }

        return markers;
    }, [timelineRange]);

    // Check if project is affordable (all milestones)
    const isAffordable =
        affordability.canAffordOptionFee &&
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
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: 0 }}>
                            {project.projectName}
                        </h3>
                        <span
                            className={`badge badge--${project.classification.toLowerCase()}`}
                            style={{ flexShrink: 0 }}
                        >
                            {project.classification}
                        </span>
                    </div>
                    <div
                        style={{
                            padding: '0.5rem 1rem',
                            background: isAffordable
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                            color: isAffordable ? 'var(--clr-green)' : 'var(--clr-red)',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                        }}
                    >
                        {isAffordable ? '✓ Affordable' : '✗ Not Yet Affordable'}
                    </div>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
                    {project.flatType} • ${project.price.toLocaleString()}
                    {project.estimatedLaunchDate && (
                        <>
                            {' '}
                            • Launch:{' '}
                            {new Date(project.estimatedLaunchDate).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric',
                            })}
                        </>
                    )}
                </div>
            </div>

            {/* Timeline Visualization */}
            <div style={{ position: 'relative', height: '100px', marginBottom: '1rem' }}>
                {/* Timeline Bar */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50px',
                        left: 0,
                        right: 0,
                        height: '4px',
                        background: 'var(--clr-border)',
                        borderRadius: '2px',
                    }}
                />

                {/* Year Markers */}
                {yearMarkers.map(({ year, position }) => (
                    <div
                        key={year}
                        style={{
                            position: 'absolute',
                            left: `${position}%`,
                            top: '44px',
                            transform: 'translateX(-50%)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        {/* Year tick */}
                        <div
                            style={{
                                width: '1px',
                                height: '12px',
                                background: 'var(--clr-border)',
                            }}
                        />
                        {/* Year label */}
                        <span
                            style={{
                                fontSize: '0.7rem',
                                color: 'var(--clr-text-muted)',
                                marginTop: '0.25rem',
                                fontWeight: 500,
                            }}
                        >
                            {year}
                        </span>
                    </div>
                ))}

                {/* Today Marker */}
                <div
                    style={{
                        position: 'absolute',
                        left: '0%',
                        top: '30px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        zIndex: 15,
                    }}
                >
                    <div
                        style={{
                            width: '2px',
                            height: '25px',
                            background: 'var(--clr-primary)',
                        }}
                    />
                    <span
                        style={{
                            fontSize: '0.7rem',
                            color: 'var(--clr-primary)',
                            marginTop: '0.25rem',
                            fontWeight: 600,
                        }}
                    >
                        Today
                    </span>
                </div>

                {/* Milestone Markers */}
                {milestones.map((milestone, index) => {
                    const position = getMilestonePosition(milestone.date);
                    const color = getMilestoneColor(milestone.type);
                    const dotSize = milestone.significance === 'critical' ? 16 : 12;
                    const isCritical = milestone.significance === 'critical';

                    return (
                        <Tooltip.Root key={index} delayDuration={200}>
                            <Tooltip.Trigger asChild>
                                <div
                                    onClick={() => onMilestoneClick?.(milestone)}
                                    style={{
                                        position: 'absolute',
                                        left: `${position}%`,
                                        top: isCritical ? '10px' : '20px',
                                        transform: 'translateX(-50%)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        zIndex: isCritical ? 20 : 10,
                                    }}
                                >
                                    {/* Connecting line from label to dot */}
                                    {isCritical && (
                                        <div
                                            style={{
                                                width: '1px',
                                                height: '28px',
                                                background: color,
                                                opacity: 0.3,
                                                marginBottom: '2px',
                                            }}
                                        />
                                    )}
                                    {/* Milestone Dot */}
                                    <div
                                        className="milestone-dot"
                                        style={{
                                            width: `${dotSize}px`,
                                            height: `${dotSize}px`,
                                            background: color,
                                            border: `2px solid white`,
                                            borderRadius: '50%',
                                            boxShadow: `0 0 0 2px ${color}, 0 2px 8px rgba(0,0,0,0.2)`,
                                            animation: isCritical ? 'pulse 2s infinite' : 'none',
                                        }}
                                    />
                                    {/* Pin line connecting dot to timeline */}
                                    <div
                                        style={{
                                            width: '2px',
                                            height: isCritical ? '0px' : `${50 - 20 - dotSize}px`,
                                            background: color,
                                            opacity: 0.4,
                                            marginTop: '2px',
                                        }}
                                    />
                                </div>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                                <Tooltip.Content
                                    side="top"
                                    align="center"
                                    sideOffset={10}
                                    style={{
                                        zIndex: 10000,
                                    }}
                                >
                                    <MilestoneTooltipContent
                                        milestone={milestone}
                                        projectName={project.projectName}
                                    />
                                    <Tooltip.Arrow
                                        style={{
                                            fill: color,
                                        }}
                                    />
                                </Tooltip.Content>
                            </Tooltip.Portal>
                        </Tooltip.Root>
                    );
                })}
            </div>

            {/* Affordability Summary (Accordion) */}
            <Accordion.Root type="single" collapsible style={{ marginTop: '1rem' }}>
                <Accordion.Item value="affordability">
                    <Accordion.Header>
                        <Accordion.Trigger
                            style={{
                                all: 'unset',
                                boxSizing: 'border-box',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0.75rem 1rem',
                                background: 'var(--clr-bg-tertiary)',
                                border: '1px solid var(--clr-border)',
                                borderRadius: 'var(--radius-md)',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                color: 'var(--clr-text)',
                                transition: 'background 200ms ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--clr-bg-secondary)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'var(--clr-bg-tertiary)';
                            }}
                        >
                            <span style={{ paddingLeft: '1rem' }}>View Details</span>
                            <span
                                style={{
                                    fontSize: '1rem',
                                    transition: 'transform 200ms ease',
                                }}
                                className="accordion-chevron"
                            >
                                ▼
                            </span>
                        </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content
                        style={{
                            overflow: 'hidden',
                            fontSize: '0.85rem',
                        }}
                        className="accordion-content"
                    >
                        <div
                            style={{
                                padding: '1rem',
                                background: 'var(--clr-bg-tertiary)',
                                borderRadius: '0 0 var(--radius-md) var(--radius-md)',
                                overflowX: 'auto',
                            }}
                        >
                            <div
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                                    gap: '1rem',
                                    minWidth: '0',
                                }}
                            >
                                <div>
                                    <strong>Affordability Status:</strong>
                                    <div>
                                        Option Fee:{' '}
                                        {affordability.canAffordOptionFee
                                            ? '✓ Can Afford'
                                            : '✗ Cannot Afford'}
                                    </div>
                                    <div>
                                        Signing:{' '}
                                        {affordability.canAffordSigning
                                            ? '✓ Can Afford'
                                            : '✗ Cannot Afford'}
                                    </div>
                                    <div>
                                        Key Collection:{' '}
                                        {affordability.canAffordKeyCollection
                                            ? '✓ Can Afford'
                                            : '✗ Cannot Afford'}
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
                                        Key Collection: $
                                        {affordability.keyCollectionShortfall.toLocaleString()}
                                    </div>
                                </div>
                                <div>
                                    <strong>Total Cash Shortfall:</strong>
                                    <div
                                        style={{
                                            fontSize: '1.1rem',
                                            fontWeight: 600,
                                            color:
                                                affordability.cashShortfall > 0
                                                    ? 'var(--clr-red)'
                                                    : 'var(--clr-green)',
                                        }}
                                    >
                                        ${affordability.cashShortfall.toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Accordion.Content>
                </Accordion.Item>
            </Accordion.Root>

            {/* Pulse Animation for Critical Milestones */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.8; }
                }
                
                /* Accordion animations */
                .accordion-content[data-state='open'] {
                    animation: accordion-slide-down 200ms ease-out;
                }
                .accordion-content[data-state='closed'] {
                    animation: accordion-slide-up 200ms ease-out;
                }
                .accordion-chevron {
                    transform: rotate(0deg);
                }
                [data-state='open'] .accordion-chevron {
                    transform: rotate(180deg);
                }
            `}</style>
        </div>
    );
}
