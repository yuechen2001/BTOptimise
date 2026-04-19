import { useMemo } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
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
        end.setMonth(end.getMonth() + 6);

        return { start, end };
    }, [milestones]);

    const getMilestonePosition = (date: string): number => {
        const milestoneDate = new Date(date).getTime();
        const startTime = timelineRange.start.getTime();
        const endTime = timelineRange.end.getTime();
        const position = ((milestoneDate - startTime) / (endTime - startTime)) * 100;
        return Math.max(0, Math.min(100, position));
    };

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

    const yearMarkers = useMemo(() => {
        const markers: Array<{ year: number; position: number }> = [];
        const startYear = timelineRange.start.getFullYear();
        const endYear = timelineRange.end.getFullYear();

        for (let year = startYear; year <= endYear; year++) {
            const yearDate = new Date(year, 0, 1);
            const yearTime = yearDate.getTime();
            const startTime = timelineRange.start.getTime();
            const endTime = timelineRange.end.getTime();
            const position = ((yearTime - startTime) / (endTime - startTime)) * 100;

            if (position >= 0 && position <= 100) {
                markers.push({ year, position });
            }
        }

        return markers;
    }, [timelineRange]);

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
                    {project.flatType}
                    {project.estimatedFloorArea && ` (${project.estimatedFloorArea} sqm)`}
                    {' • '}${project.price.toLocaleString()}
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

                {/* Estimated Completion Marker */}
                {(() => {
                    const completionMilestone = milestones.find(
                        (m) => m.type === 'key_collection_payment_due'
                    );
                    if (!completionMilestone) return null;
                    
                    const position = getMilestonePosition(completionMilestone.date);
                    return (
                        <div
                            style={{
                                position: 'absolute',
                                left: `${position}%`,
                                top: '65px',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                zIndex: 15,
                            }}
                        >
                            <div
                                style={{
                                    width: '2px',
                                    height: '20px',
                                    background: 'var(--clr-primary)',
                                }}
                            />
                            <span
                                style={{
                                    fontSize: '0.7rem',
                                    color: 'var(--clr-primary)',
                                    marginTop: '0.25rem',
                                    fontWeight: 600,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                Est. Completion
                            </span>
                        </div>
                    );
                })()}

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
