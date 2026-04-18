import type { ProjectAffordabilityResult } from '../../types';
import { useAppState } from '../../context/AppContext';
import { getFlatVariantLabel, getResultIdentity } from '../../utils/resultIdentity';

interface Props {
    result: ProjectAffordabilityResult;
}

export default function ProjectCard({ result }: Props) {
    const { state, dispatch } = useAppState();
    const { project, selectedFlat } = result;
    const { financials, demandInfo } = selectedFlat;
    const affordability = selectedFlat.affordability;
    const resultIdentity = getResultIdentity(result);
    const flatVariantLabel = getFlatVariantLabel(result);

    const isSelected = state.comparison.some((c) => getResultIdentity(c) === resultIdentity);
    const canAdd = state.comparison.length < 3;

    const classificationBadge: Record<string, string> = {
        Standard: 'badge--standard',
        Plus: 'badge--plus',
        Prime: 'badge--prime',
    };

    const affordabilityLabel = {
        canAfford: 'Affordable',
        stretchRequired: 'Stretch',
        outOfReach: 'Out of Reach',
    };

    // Format launch date
    const formatLaunchDate = (dateStr: string | null): string => {
        if (!dateStr) return 'TBA';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className={`card card--${affordability.colour}`}>
            {/* Header */}
            <div className="flex-between" style={{ marginBottom: 'var(--sp-md)' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                        {project.name}
                    </h3>
                    <div className="flex-gap">
                        <span className="text-secondary" style={{ fontSize: '0.82rem' }}>
                            {project.estate}
                        </span>
                        <span
                            className={`badge ${classificationBadge[project.classification] || ''}`}
                        >
                            {project.classification}
                        </span>
                    </div>
                </div>
                <span className={`badge badge--${affordability.colour}`}>
                    {affordabilityLabel[affordability.status]}
                </span>
            </div>

            {/* Key metrics */}
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 'var(--sp-sm)',
                    marginBottom: 'var(--sp-md)',
                }}
            >
                <div>
                    <div
                        className="text-muted"
                        style={{
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Flat Type
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{flatVariantLabel}</div>
                </div>
                <div>
                    <div
                        className="text-muted"
                        style={{
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Price Range
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }} className="font-mono">
                        {selectedFlat.minIndicativePrice != null &&
                        selectedFlat.maxIndicativePrice != null
                            ? `$${selectedFlat.minIndicativePrice.toLocaleString()} - $${selectedFlat.maxIndicativePrice.toLocaleString()}`
                            : 'TBA'}
                    </div>
                </div>
                <div>
                    <div
                        className="text-muted"
                        style={{
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Grant
                    </div>
                    <div
                        style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--clr-green)' }}
                        className="font-mono"
                    >
                        -${financials.grants.totalGrant.toLocaleString()}
                    </div>
                </div>
                <div>
                    <div
                        className="text-muted"
                        style={{
                            fontSize: '0.72rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }}
                    >
                        Monthly Loan
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }} className="font-mono">
                        ${financials.loan.monthlyInstalment.toLocaleString()}/mth
                    </div>
                </div>
            </div>

            {/* Timeline & Application Rate */}
            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--sp-md)',
                    fontSize: '0.8rem',
                    color: 'var(--clr-text-secondary)',
                    marginBottom: 'var(--sp-md)',
                }}
            >
                <span>Launch: {formatLaunchDate(project.launchdate)}</span>
                <span>Est. Completion: {project.estimatedCompletion || 'TBA'}</span>
                {demandInfo.rate != null && (
                    <span
                        style={{
                            color: demandInfo.rate > 5 ? 'var(--clr-red)' : undefined,
                        }}
                    >
                        Demand: {demandInfo.rate.toFixed(1)}x
                    </span>
                )}
            </div>

            <p
                style={{
                    fontSize: '0.8rem',
                    color: 'var(--clr-text-secondary)',
                    marginBottom: 'var(--sp-md)',
                    lineHeight: 1.5,
                }}
            >
                {selectedFlat.affordability.status === 'stretchRequired'
                    ? `Stretch required. Monthly income buffer: $${financials.affordability.monthlyIncomeBuffer.toLocaleString()}.`
                    : financials.affordability.cashShortfall > 0
                      ? `Cash shortfall: $${financials.affordability.cashShortfall.toLocaleString()}.`
                      : `Monthly income buffer: $${financials.affordability.monthlyIncomeBuffer.toLocaleString()}.`}
            </p>

            {/* Action button */}
            <button
                className={`btn btn--small ${isSelected ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => {
                    // TOGGLE_COMPARISON now handles both comparison and timeline sync
                    dispatch({ type: 'TOGGLE_COMPARISON', result });
                }}
                disabled={!isSelected && !canAdd}
                style={{ width: '100%' }}
            >
                {isSelected ? 'Remove from Selection' : 'Select Project'}
            </button>
        </div>
    );
}
