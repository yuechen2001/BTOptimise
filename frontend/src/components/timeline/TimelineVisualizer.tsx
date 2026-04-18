import { useState, useEffect } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { useAppState } from '../../context/AppContext';
import { useTimelineProjection } from '../../hooks/useApi';
import type { TimelineConfig, IncomeGrowthScenario, TimelineMilestone } from '../../types';
import CollapsibleSidebar from './CollapsibleSidebar';
import TimelineConfigComponent from './TimelineConfig';
import ProjectSelector from './ProjectSelector';
import StackedTimelines from './StackedTimelines';
import MilestoneDetailsPanel from './MilestoneDetailsPanel';

export default function TimelineVisualizer() {
    const { state } = useAppState();
    const { sessionId, onboarding, timeline } = state;

    const [sidebarOpen, setSidebarOpen] = useState(true);

    const [selectedMilestone, setSelectedMilestone] = useState<{
        milestone: TimelineMilestone;
        projectName: string;
    } | null>(null);

    const [config, setConfig] = useState<TimelineConfig>(() => {
        const currentYear = new Date().getFullYear();
        return {
            startYear: currentYear,
            endYear: currentYear + 5,
            intervalMonths: 6,
            incomeGrowthScenario: 'moderate' as IncomeGrowthScenario,
        };
    });

    const {
        data: timelineData,
        isLoading,
        error,
        refetch,
    } = useTimelineProjection(sessionId, config, timeline.length > 0 ? timeline : undefined);

    const handleConfigSave = (newConfig: TimelineConfig) => {
        setConfig(newConfig);
        refetch();
    };

    const handleSidebarToggle = () => {
        setSidebarOpen((prev) => !prev);
    };

    const handleProjectsChange = () => {
        refetch();
    };

    const handleMilestoneClick = (milestone: TimelineMilestone, projectId: string) => {
        const project = timelineData?.projectTimelines.find(
            (pt) => pt.project.projectId === projectId
        );
        if (project) {
            setSelectedMilestone({
                milestone,
                projectName: project.project.projectName,
            });
        }
    };

    const handleCloseMilestoneDetails = () => {
        setSelectedMilestone(null);
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedMilestone) {
                handleCloseMilestoneDetails();
            }
        };

        if (selectedMilestone) {
            document.addEventListener('keydown', handleEscape);
            // Lock body scroll when dialog is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [selectedMilestone]);

    if (!sessionId || !onboarding.completed) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 className="section-title">Timeline Visualizer</h2>
                <p className="section-subtitle">
                    Select up to 3 projects from the dashboard to visualize project-specific
                    timeline.
                </p>
                <a href="/onboarding" className="btn btn--primary" style={{ marginTop: '1.5rem' }}>
                    Complete Onboarding
                </a>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h2 className="section-title">Timeline Visualizer</h2>
                <div style={{ marginTop: '2rem' }}>
                    <div className="spinner" />
                    <p style={{ marginTop: '1rem', color: 'var(--clr-text-muted)' }}>
                        Generating your personalized timeline...
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Timeline Visualizer</h1>
                <div
                    style={{
                        marginTop: '2rem',
                        padding: '1.5rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '8px',
                        color: 'var(--clr-red)',
                    }}
                >
                    <p>Failed to generate timeline projection.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>{error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <Tooltip.Provider delayDuration={200}>
            <div style={{ display: 'flex', minHeight: 'calc(100vh - 80px)' }}>
                {/* Collapsible Sidebar */}
                <CollapsibleSidebar isOpen={sidebarOpen} onToggle={handleSidebarToggle}>
                    {/* Project Selector - At the top */}
                    <ProjectSelector onProjectsChange={handleProjectsChange} />

                    {/* Timeline Configuration */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <TimelineConfigComponent
                            config={config}
                            onSave={handleConfigSave}
                            profile={onboarding.profile}
                        />
                    </div>
                </CollapsibleSidebar>

                {/* Main Content Area */}
                <div style={{ flex: 1, padding: '1rem 1rem', overflow: 'auto' }}>
                    <div style={{ marginBottom: '2rem' }}>
                        <h1 style={{ marginBottom: '0.5rem' }}>Timeline Visualizer</h1>
                        <p style={{ color: 'var(--clr-text-muted)' }}>
                            Compare project timelines, payment schedules, and affordability
                            milestones
                        </p>
                    </div>

                    {/* Stacked Project Timelines */}
                    {timelineData?.projectTimelines && timelineData.projectTimelines.length > 0 && (
                        <>
                            <StackedTimelines
                                projectTimelines={timelineData.projectTimelines}
                                onMilestoneClick={handleMilestoneClick}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* Milestone Details Modal (shown when milestone clicked) */}
            {selectedMilestone && (
                <>
                    {/* Overlay */}
                    <div
                        onClick={handleCloseMilestoneDetails}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.5)',
                            animation: 'dialog-overlay-fade-in 150ms ease-out',
                            zIndex: 1000,
                        }}
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="milestone-dialog-title"
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90vw',
                            maxWidth: '600px',
                            maxHeight: '85vh',
                            overflow: 'auto',
                            background: 'var(--clr-bg-primary)',
                            borderRadius: 'var(--radius-lg)',
                            boxShadow: 'var(--shadow-lg)',
                            animation: 'dialog-content-fade-in 200ms ease-out',
                            zIndex: 1001,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <MilestoneDetailsPanel
                            milestone={selectedMilestone.milestone}
                            projectName={selectedMilestone.projectName}
                            onClose={handleCloseMilestoneDetails}
                        />
                    </div>
                </>
            )}
        </Tooltip.Provider>
    );
}
