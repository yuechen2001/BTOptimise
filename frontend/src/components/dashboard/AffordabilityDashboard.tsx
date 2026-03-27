import { useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import { getResultIdentity } from '../../utils/resultIdentity';
import ProjectCard from './ProjectCard';

export default function AffordabilityDashboard() {
    const { state } = useAppState();
    const navigate = useNavigate();
    const results = state.results;
    const sortedResults = useMemo(() => {
        const affordabilityOrder = { green: 0, yellow: 1, red: 2 } as const;

        return [...results].sort((left, right) => {
            const colourDifference =
                affordabilityOrder[left.selectedFlat.affordability.colour] -
                affordabilityOrder[right.selectedFlat.affordability.colour];

            if (colourDifference !== 0) {
                return colourDifference;
            }

            const demandDifference =
                (left.selectedFlat.demandInfo.rate ?? Number.POSITIVE_INFINITY) -
                (right.selectedFlat.demandInfo.rate ?? Number.POSITIVE_INFINITY);

            if (demandDifference !== 0) {
                return demandDifference;
            }

            return left.project.name.localeCompare(right.project.name);
        });
    }, [results]);

    const counts = useMemo(() => {
        const green = results.filter((r) => r.selectedFlat.affordability.colour === 'green').length;
        const yellow = results.filter((r) => r.selectedFlat.affordability.colour === 'yellow').length;
        const red = results.filter((r) => r.selectedFlat.affordability.colour === 'red').length;
        return { green, yellow, red, total: results.length };
    }, [results]);

    const uniqueProjects = useMemo(() => {
        return new Set(results.map((r) => r.project.projectCode)).size;
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
                        {counts.total} project-flat combinations evaluated across {uniqueProjects}{' '}
                        projects.
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
                {sortedResults.map((r) => (
                    <ProjectCard
                        key={getResultIdentity(r)}
                        result={r}
                    />
                ))}
            </div>
        </div>
    );
}
