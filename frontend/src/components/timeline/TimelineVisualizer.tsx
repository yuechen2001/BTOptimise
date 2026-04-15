/**
 * Timeline Visualizer Main Component
 *
 * Orchestrates all timeline sub-components and manages timeline state.
 * Supports Stories 1 (DIA), 2 (Grant Optimizer), and 6 (Wait-and-See).
 */

import { useState, useMemo, useEffect } from 'react';
import { useAppState } from '../../context/AppContext';
import { useTimelineProjection } from '../../hooks/useApi';
import type { TimelineConfig, IncomeGrowthScenario, TimelineSnapshot } from '../../types';
import TimelineConfigComponent from './TimelineConfig';
import TimelineSlider from './TimelineSlider';
import SnapshotDetails from './SnapshotDetails';
import AffordabilityChart from './AffordabilityChart';
import OptimalWindowsAlert from './OptimalWindowsAlert';
import ScenarioComparison from './ScenarioComparison';
import { getTimelineFromCache, saveTimelineToCache } from '../../utils/timelineCache';

export default function TimelineVisualizer() {
    const { state } = useAppState();
    const { sessionId, onboarding } = state;

    // Timeline configuration state
    const [config, setConfig] = useState<TimelineConfig>(() => {
        const currentYear = new Date().getFullYear();
        return {
            startYear: currentYear,
            endYear: currentYear + 5,
            intervalMonths: 6,
            incomeGrowthScenario: 'moderate' as IncomeGrowthScenario,
            includeOpportunityCost: false,
        };
    });

    // Selected snapshot state (which point in timeline user is viewing)
    const [selectedSnapshotIndex, setSelectedSnapshotIndex] = useState<number>(0);

    // Check cache first before fetching
    const cachedData = useMemo(() => {
        if (sessionId && onboarding.profile) {
            return getTimelineFromCache(sessionId, onboarding.profile);
        }
        return null;
    }, [sessionId, onboarding.profile]);

    // Fetch timeline projection
    const {
        data: timelineData,
        isLoading,
        error,
    } = useTimelineProjection(sessionId, cachedData ? null : config);

    // Use cached data if available, otherwise use fetched data
    const activeTimelineData = cachedData || timelineData;

    // Cache the fetched data
    useEffect(() => {
        if (timelineData && sessionId && onboarding.profile && !cachedData) {
            saveTimelineToCache(sessionId, onboarding.profile, timelineData);
        }
    }, [timelineData, sessionId, onboarding.profile, cachedData]);

    // Get current snapshot
    const currentSnapshot = useMemo<TimelineSnapshot | null>(() => {
        if (!activeTimelineData || !activeTimelineData.snapshots.length) return null;
        return activeTimelineData.snapshots[selectedSnapshotIndex] || activeTimelineData.snapshots[0];
    }, [activeTimelineData, selectedSnapshotIndex]);

    // Handle config change
    const handleConfigChange = (newConfig: Partial<TimelineConfig>) => {
        setConfig((prev) => ({ ...prev, ...newConfig }));
    };

    // Handle slider change
    const handleSliderChange = (index: number) => {
        setSelectedSnapshotIndex(index);
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

    if (isLoading && !cachedData) {
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

    if (!activeTimelineData || !activeTimelineData.snapshots.length) {
        return (
            <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
                <h1>Timeline Visualizer</h1>
                <p style={{ color: 'var(--clr-text-muted)', marginTop: '1rem' }}>
                    No timeline data available. Please try adjusting your configuration.
                </p>
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '2rem 1rem' }}>
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Timeline Visualizer</h1>
                <p style={{ color: 'var(--clr-text-muted)' }}>
                    Explore your financial journey and find the optimal time to apply for BTO
                </p>
            </div>

            {/* Configuration Controls */}
            <TimelineConfigComponent config={config} onConfigChange={handleConfigChange} profile={onboarding.profile} />

            {/* Optimal Windows Alert (Story 2) */}
            {activeTimelineData.optimalApplicationWindows.length > 0 && (
                <OptimalWindowsAlert windows={activeTimelineData.optimalApplicationWindows} />
            )}

            {/* Timeline Slider */}
            <div style={{ marginTop: '2rem' }}>
                <TimelineSlider
                    snapshots={activeTimelineData.snapshots}
                    milestones={activeTimelineData.milestones}
                    selectedIndex={selectedSnapshotIndex}
                    onIndexChange={handleSliderChange}
                />
            </div>

            {/* Current Snapshot Details */}
            {currentSnapshot && (
                <div style={{ marginTop: '2rem' }}>
                    <SnapshotDetails snapshot={currentSnapshot} config={config} />
                </div>
            )}

            {/* Affordability Chart */}
            <div style={{ marginTop: '2rem' }}>
                <AffordabilityChart
                    snapshots={activeTimelineData.snapshots}
                    selectedIndex={selectedSnapshotIndex}
                />
            </div>

            {/* Scenario Comparison (Story 6) */}
            {activeTimelineData.scenarioComparisons.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <ScenarioComparison comparisons={activeTimelineData.scenarioComparisons} />
                </div>
            )}

            {/* Assumptions Footer */}
            <div
                style={{
                    marginTop: '3rem',
                    padding: '1rem',
                    background: 'var(--clr-bg-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    color: 'var(--clr-text-muted)',
                }}
            >
                <strong>Projection Assumptions:</strong> Income growth {(activeTimelineData.assumptions.incomeGrowthRate * 100).toFixed(1)}% p.a., 
                CPF OA interest {(activeTimelineData.assumptions.cpfOAInterestRate * 100).toFixed(1)}% p.a., 
                Cash savings rate {(activeTimelineData.assumptions.cashSavingsRate * 100).toFixed(0)}% of monthly income
            </div>
        </div>
    );
}
