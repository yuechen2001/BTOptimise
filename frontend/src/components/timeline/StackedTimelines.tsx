/**
 * Stacked Timelines Component
 *
 * Container for multiple project timeline rows:
 * - Stacks ProjectTimelineRow components vertically
 * - Manages expanded state for milestone details
 * - Handles milestone click events
 * - Shows empty state when no projects selected
 */

import ProjectTimelineRow from './ProjectTimelineRow';
import type { ProjectTimeline, TimelineMilestone } from '../../types';

interface StackedTimelinesProps {
    projectTimelines: ProjectTimeline[];
    onMilestoneClick?: (milestone: TimelineMilestone, projectId: string) => void;
}

export default function StackedTimelines({ projectTimelines, onMilestoneClick }: StackedTimelinesProps) {
    const handleMilestoneClick = (milestone: TimelineMilestone, projectId: string) => {
        // Call parent handler if provided
        onMilestoneClick?.(milestone, projectId);
    };

    // Empty state
    if (projectTimelines.length === 0) {
        return (
            <div
                style={{
                    marginTop: '2rem',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    background: 'var(--clr-bg-secondary)',
                    borderRadius: '8px',
                    border: '2px dashed var(--clr-border)',
                }}
            >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    No Project Timelines Yet
                </h3>
                <p style={{ color: 'var(--clr-text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                    Select 1-3 projects from the Project Selector above to visualize their timelines, 
                    payment schedules, and affordability milestones side-by-side.
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginTop: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Project Timeline Comparison
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
                    Compare payment schedules, savings milestones, and affordability across {projectTimelines.length} project{projectTimelines.length > 1 ? 's' : ''}
                </p>
            </div>

            {/* Stacked Timeline Rows */}
            <div>
                {projectTimelines.map((projectTimeline) => (
                    <ProjectTimelineRow
                        key={projectTimeline.project.projectId}
                        projectTimeline={projectTimeline}
                        onMilestoneClick={(milestone) => 
                            handleMilestoneClick(milestone, projectTimeline.project.projectId)
                        }
                    />
                ))}
            </div>

            {/* Simplified Legend */}
            <div
                style={{
                    marginTop: '2rem',
                    padding: '1rem 1.5rem',
                    background: 'var(--clr-bg-secondary)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2rem',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                        style={{
                            width: '12px',
                            height: '12px',
                            background: '#EF4444',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 0 0 2px #EF4444',
                        }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Critical Events</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                        style={{
                            width: '12px',
                            height: '12px',
                            background: '#3B82F6',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 0 0 2px #3B82F6',
                        }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Payment Milestones</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                        style={{
                            width: '12px',
                            height: '12px',
                            background: '#10B981',
                            borderRadius: '50%',
                            border: '2px solid white',
                            boxShadow: '0 0 0 2px #10B981',
                        }}
                    />
                    <span style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>Savings Milestones</span>
                </div>

                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>
                    Hover over dots for details • Click to expand
                </div>
            </div>
        </div>
    );
}
