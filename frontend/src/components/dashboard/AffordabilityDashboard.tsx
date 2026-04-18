import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import { getResultIdentity } from '../../utils/resultIdentity';
import ProjectCard from './ProjectCard';

export default function AffordabilityDashboard() {
    const { state } = useAppState();
    const navigate = useNavigate();
    const results = state.results;
    const [affordabilityFilter, setAffordabilityFilter] = useState<
        'all' | 'green' | 'yellow' | 'red'
    >('all');
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
    const filteredResults = useMemo(() => {
        if (affordabilityFilter === 'all') {
            return sortedResults;
        }

        return sortedResults.filter(
            (result) => result.selectedFlat.affordability.colour === affordabilityFilter
        );
    }, [sortedResults, affordabilityFilter]);

    const counts = useMemo(() => {
        const green = results.filter((r) => r.selectedFlat.affordability.colour === 'green').length;
        const yellow = results.filter(
            (r) => r.selectedFlat.affordability.colour === 'yellow'
        ).length;
        const red = results.filter((r) => r.selectedFlat.affordability.colour === 'red').length;
        return { green, yellow, red, total: results.length };
    }, [results]);
    const filterStyles = {
        all: {
            active: {
                background: 'var(--clr-primary)',
                color: '#fff',
                borderColor: 'var(--clr-primary)',
            },
            idle: {
                background: 'var(--clr-surface)',
                color: 'var(--clr-text)',
                borderColor: 'var(--clr-border)',
            },
        },
        green: {
            active: {
                background: 'var(--clr-green)',
                color: '#fff',
                borderColor: 'var(--clr-green)',
            },
            idle: {
                background: 'var(--clr-green-bg)',
                color: 'var(--clr-green)',
                borderColor: 'rgba(22, 163, 74, 0.25)',
            },
        },
        yellow: {
            active: {
                background: 'var(--clr-yellow)',
                color: '#fff',
                borderColor: 'var(--clr-yellow)',
            },
            idle: {
                background: 'var(--clr-yellow-bg)',
                color: 'var(--clr-yellow)',
                borderColor: 'rgba(202, 138, 4, 0.25)',
            },
        },
        red: {
            active: { background: 'var(--clr-red)', color: '#fff', borderColor: 'var(--clr-red)' },
            idle: {
                background: 'var(--clr-red-bg)',
                color: 'var(--clr-red)',
                borderColor: 'rgba(220, 38, 38, 0.2)',
            },
        },
    } as const;

    const getFilterButtonStyle = (filter: keyof typeof filterStyles) =>
        affordabilityFilter === filter ? filterStyles[filter].active : filterStyles[filter].idle;

    const uniqueProjects = useMemo(() => {
        return new Set(results.map((r) => r.project.projectCode)).size;
    }, [results]);

    if (!state.onboarding.completed) {
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

    if (results.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--sp-2xl)' }}>
                <h2 className="section-title">No Recommendations</h2>
                <p className="section-subtitle">
                    We could not find any project-flat matches for your current profile and
                    preferences. Try adjusting your preferences or financial details.
                </p>
                <button className="btn btn--primary" onClick={() => navigate({ to: '/' })}>
                    Update Onboarding
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
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        className="btn btn--secondary"
                        onClick={() => navigate({ to: '/timeline' })}
                    >
                        📊 View Timeline
                    </button>
                    {state.comparison.length > 0 && (
                        <button
                            className="btn btn--primary"
                            onClick={() => navigate({ to: '/compare' })}
                        >
                            Compare ({state.comparison.length}/3)
                        </button>
                    )}
                </div>
            </div>

            {/* Affordability filters */}
            <div
                className="flex-gap"
                style={{ marginBottom: 'var(--sp-xl)', flexWrap: 'wrap', alignItems: 'center' }}
            >
                <button
                    className={`btn btn--small ${affordabilityFilter === 'all' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setAffordabilityFilter('all')}
                    style={getFilterButtonStyle('all')}
                >
                    All ({counts.total})
                </button>
                <button
                    className={`btn btn--small ${affordabilityFilter === 'green' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setAffordabilityFilter('green')}
                    style={getFilterButtonStyle('green')}
                >
                    Affordable ({counts.green})
                </button>
                <button
                    className={`btn btn--small ${affordabilityFilter === 'yellow' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setAffordabilityFilter('yellow')}
                    style={getFilterButtonStyle('yellow')}
                >
                    Stretch ({counts.yellow})
                </button>
                <button
                    className={`btn btn--small ${affordabilityFilter === 'red' ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setAffordabilityFilter('red')}
                    style={getFilterButtonStyle('red')}
                >
                    Out of Reach ({counts.red})
                </button>
            </div>

            {/* Cards grid */}
            <div className="grid-cards">
                {filteredResults.map((r) => (
                    <ProjectCard key={getResultIdentity(r)} result={r} />
                ))}
            </div>
        </div>
    );
}
