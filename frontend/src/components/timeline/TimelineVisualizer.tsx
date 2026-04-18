/**
 * Timeline Visualizer Main Component
 *
 * Redesigned with collapsible sidebar and project-based timeline comparison.
 * Supports Stories 1 (DIA), 2 (Grant Optimizer), and 3 (Affordability Timeline).
 */

import { useState } from 'react';
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

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Selected milestone state for details panel
    const [selectedMilestone, setSelectedMilestone] = useState<{
        milestone: TimelineMilestone;
        projectName: string;
    } | null>(null);

    // Timeline configuration state
    const [config, setConfig] = useState<TimelineConfig>(() => {
        const currentYear = new Date().getFullYear();
        return {
            startYear: currentYear,
            endYear: currentYear + 5,
            intervalMonths: 6,
            incomeGrowthScenario: 'moderate' as IncomeGrowthScenario,
        };
    });

    // Fetch timeline projection (now includes selected projects)
    const {
        data: timelineData,
        isLoading,
        error,
        refetch,
    } = useTimelineProjection(
        sessionId, 
        config,
        timeline.length > 0 ? timeline : undefined
    );

    // Handle config save (triggers refetch)
    const handleConfigSave = (newConfig: TimelineConfig) => {
        setConfig(newConfig);
        refetch();
    };

    // Handle sidebar toggle
    const handleSidebarToggle = () => {
        setSidebarOpen((prev) => !prev);
    };

    // Handle project selection changes (triggers refetch)
    const handleProjectsChange = () => {
        refetch();
    };

    // Handle milestone click (shows details panel)
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

    // Close milestone details panel
    const handleCloseMilestoneDetails = () => {
        setSelectedMilestone(null);
    };

    // Early returns for loading/error/incomplete states
    if (!sessionId || !onboarding.completed) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Timeline Visualizer</h1>
                <p style={{ color: 'var(--clr-text-muted)', marginTop: '1rem' }}>
                    Please complete the onboarding process to view your personalized timeline.
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
                <h1>Timeline Visualizer</h1>
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
            <div style={{ flex: 1, padding: '2rem 1rem', overflow: 'auto' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{ marginBottom: '0.5rem' }}>Timeline Visualizer</h1>
                    <p style={{ color: 'var(--clr-text-muted)' }}>
                        Compare project timelines, payment schedules, and affordability milestones
                    </p>
                </div>

                {/* Stacked Project Timelines */}
                {timelineData?.projectTimelines && timelineData.projectTimelines.length > 0 && (
                    <>
                        <StackedTimelines 
                            projectTimelines={timelineData.projectTimelines}
                            onMilestoneClick={handleMilestoneClick}
                        />
                        
                        {/* Milestone Details Panel (shown when milestone clicked) */}
                        {selectedMilestone && (
                            <MilestoneDetailsPanel
                                milestone={selectedMilestone.milestone}
                                projectName={selectedMilestone.projectName}
                                onClose={handleCloseMilestoneDetails}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
