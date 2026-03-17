import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import ProjectCard from './ProjectCard';

export default function AffordabilityDashboard() {
    const { state } = useAppState();
    const navigate = useNavigate();
    const results = state.results;

    const counts = useMemo(() => {
        const g = results.filter((r) => r.classification === 'green').length;
        const y = results.filter((r) => r.classification === 'yellow').length;
        const r = results.filter((r) => r.classification === 'red').length;
        return { green: g, yellow: y, red: r, total: results.length };
    }, [results]);

    if (!state.onboarding.completed || results.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--sp-2xl)' }}>
                <h2 className="section-title">No Results Yet</h2>
                <p className="section-subtitle">
                    Complete the onboarding form to see your personalised BTO affordability
                    dashboard.
                </p>
                <button className="btn btn--primary" onClick={() => navigate({ to: '/' })}>
                    Start Onboarding
                </button>
            </div>
        );
    }

    return (
        <div>
            <div className="flex-between" style={{ marginBottom: 'var(--sp-md)' }}>
                <div>
                    <h2 className="section-title">Your BTO Dashboard</h2>
                    <p className="section-subtitle" style={{ marginBottom: 0 }}>
                        {counts.total} project-flat combinations evaluated across{' '}
                        {new Set(results.map((r) => r.project.id)).size} projects.
                    </p>
                </div>
                {state.comparison.length > 0 && (
                    <button
                        className="btn btn--primary"
                        onClick={() => navigate({ to: '/compare' })}
                    >
                        Compare ({state.comparison.length}/3)
                    </button>
                )}
            </div>

            {/* Summary pills */}
            <div className="flex-gap" style={{ marginBottom: 'var(--sp-xl)' }}>
                <span className="badge badge--green">{counts.green} Affordable</span>
                <span className="badge badge--yellow">{counts.yellow} Stretch</span>
                <span className="badge badge--red">{counts.red} Out of Reach</span>
            </div>

            {/* Cards grid */}
            <div className="grid-cards">
                {results.map((r) => (
                    <ProjectCard key={`${r.project.id}-${r.selectedFlatType}`} result={r} />
                ))}
            </div>
        </div>
    );
}
