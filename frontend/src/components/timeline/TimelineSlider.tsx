/**
 * Timeline Slider Component
 *
 * Interactive slider with milestone markers for navigating the timeline.
 * Users can drag to see financial state at different points in time.
 */

import { useMemo } from 'react';
import type { TimelineSnapshot, TimelineMilestone } from '../../types';

interface TimelineSliderProps {
    snapshots: TimelineSnapshot[];
    milestones: TimelineMilestone[];
    selectedIndex: number;
    onIndexChange: (index: number) => void;
}

export default function TimelineSlider({
    snapshots,
    milestones,
    selectedIndex,
    onIndexChange,
}: TimelineSliderProps) {
    const currentSnapshot = snapshots[selectedIndex] || snapshots[0];

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
    };

    // Get milestone markers for visual display
    const milestoneMarkers = useMemo(() => {
        return milestones.map((milestone) => {
            // Find closest snapshot index for this milestone
            const closestIndex = snapshots.findIndex(
                (s) => Math.abs(s.monthsFromNow - milestone.monthsFromNow) < 3
            );
            if (closestIndex === -1) return null;

            const percentage = (closestIndex / (snapshots.length - 1)) * 100;
            return {
                ...milestone,
                percentage,
                index: closestIndex,
            };
        }).filter(Boolean);
    }, [milestones, snapshots]);

    // Get color based on significance
    const getSignificanceColor = (significance: string) => {
        switch (significance) {
            case 'critical':
                return 'var(--clr-red)';
            case 'important':
                return 'var(--clr-yellow)';
            default:
                return 'var(--clr-primary)';
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>Timeline</h3>
                <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
                    <strong>{formatDate(currentSnapshot.date)}</strong> 
                    {currentSnapshot.monthsFromNow > 0 && (
                        <span> ({currentSnapshot.monthsFromNow} months from now)</span>
                    )}
                    {currentSnapshot.monthsFromNow === 0 && <span> (Today)</span>}
                </div>
            </div>

            {/* Slider Container */}
            <div style={{ position: 'relative', paddingTop: '2rem', paddingBottom: '1rem' }}>
                {/* Milestone Markers */}
                <div style={{ position: 'absolute', top: '0', left: '0', right: '0', height: '1.5rem' }}>
                    {milestoneMarkers.map((marker, idx) => {
                        if (!marker) return null;
                        return (
                            <div
                                key={idx}
                                style={{
                                    position: 'absolute',
                                    left: `${marker.percentage}%`,
                                    transform: 'translateX(-50%)',
                                }}
                                title={`${marker.title}: ${marker.description}`}
                            >
                                <div
                                    style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: getSignificanceColor(marker.significance),
                                        border: '2px solid white',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    }}
                                />
                            </div>
                        );
                    })}
                </div>

                {/* Slider Track */}
                <div
                    style={{
                        position: 'relative',
                        height: '8px',
                        background: 'var(--clr-border)',
                        borderRadius: '4px',
                        marginTop: '1rem',
                    }}
                >
                    {/* Progress Bar */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            background: 'var(--clr-primary)',
                            borderRadius: '4px',
                            width: `${(selectedIndex / (snapshots.length - 1)) * 100}%`,
                        }}
                    />
                </div>

                {/* Range Input */}
                <input
                    type="range"
                    min="0"
                    max={snapshots.length - 1}
                    value={selectedIndex}
                    onChange={(e) => onIndexChange(parseInt(e.target.value))}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        left: 0,
                        width: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        height: '32px',
                    }}
                />

                {/* Date Labels */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '0.75rem',
                        fontSize: '0.8rem',
                        color: 'var(--clr-text-muted)',
                    }}
                >
                    <span>{formatDate(snapshots[0].date)}</span>
                    <span>{formatDate(snapshots[snapshots.length - 1].date)}</span>
                </div>
            </div>

            {/* Milestone Legend */}
            {milestoneMarkers.length > 0 && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--clr-bg-secondary)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Key Milestones
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.8rem' }}>
                        {milestoneMarkers.slice(0, 5).map((marker, idx) => {
                            if (!marker) return null;
                            return (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <div
                                        style={{
                                            width: '6px',
                                            height: '6px',
                                            borderRadius: '50%',
                                            background: getSignificanceColor(marker.significance),
                                        }}
                                    />
                                    <span>{marker.title}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
