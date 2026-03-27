import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import { getFlatVariantLabel, getResultIdentity } from '../../utils/resultIdentity';

export default function ComparisonMatrix() {
    const { state, dispatch } = useAppState();
    const navigate = useNavigate();
    const items = state.comparison;

    if (items.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--sp-2xl)' }}>
                <h2 className="section-title">Comparison</h2>
                <p className="section-subtitle">
                    Select up to 3 projects from the dashboard to compare side by side.
                </p>
                <button className="btn btn--primary" onClick={() => navigate({ to: '/dashboard' })}>
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const fmt = (n: number) => `$${n.toLocaleString()}`;
    const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
    const affordabilityLabel = {
        canAfford: 'Affordable',
        stretchRequired: 'Stretch',
        outOfReach: 'Out of Reach',
    } as const;
    const columnTone = {
        green: {
            background: 'rgba(22, 163, 74, 0.08)',
        },
        yellow: {
            background: 'rgba(202, 138, 4, 0.08)',
        },
        red: {
            background: 'rgba(220, 38, 38, 0.08)',
        },
    } as const;

    const getColumnStyle = (colour: 'green' | 'yellow' | 'red') => ({
        background: columnTone[colour].background,
    });

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
        <div>
            <div className="flex-between" style={{ marginBottom: 'var(--sp-lg)' }}>
                <div>
                    <h2 className="section-title">Comparison</h2>
                    <p className="section-subtitle" style={{ marginBottom: 0 }}>
                        Side-by-side breakdown of your shortlisted projects.
                    </p>
                </div>
                <div className="flex-gap">
                    <button
                        className="btn btn--ghost btn--small"
                        onClick={() => dispatch({ type: 'CLEAR_COMPARISON' })}
                    >
                        Clear All
                    </button>
                    <button
                        className="btn btn--secondary btn--small"
                        onClick={() => navigate({ to: '/dashboard' })}
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>

            <div className="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th style={{ minWidth: 180 }}>Metric</th>
                            {items.map((item) => (
                                <th
                                    key={getResultIdentity(item)}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    <div>{item.project.name}</div>
                                    <div
                                        style={{
                                            fontWeight: 400,
                                            fontSize: '0.72rem',
                                            textTransform: 'none',
                                            letterSpacing: 0,
                                        }}
                                    >
                                        {getFlatVariantLabel(item)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Backend affordability */}
                        <tr>
                            <td style={{ fontWeight: 600 }}>Affordability</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-class`}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    <span
                                        className={`badge badge--${item.selectedFlat.affordability.colour}`}
                                    >
                                        {affordabilityLabel[item.selectedFlat.affordability.status]}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Project Classification */}
                        <tr>
                            <td style={{ fontWeight: 600 }}>Project Classification</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-pclass`}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    <span
                                        className={`badge badge--${item.project.classification.toLowerCase()}`}
                                    >
                                        {item.project.classification}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Estate */}
                        <tr>
                            <td>Estate</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-estate`}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {item.project.estate}
                                </td>
                            ))}
                        </tr>

                        {/* Demand */}
                        <tr>
                            <td>Demand</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-apprate`}
                                    style={{
                                        ...getColumnStyle(item.selectedFlat.affordability.colour),
                                        color:
                                            item.selectedFlat.demandInfo.rate > 5
                                                ? 'var(--clr-red)'
                                                : undefined,
                                    }}
                                >
                                    {item.selectedFlat.demandInfo.rate != null
                                        ? `${item.selectedFlat.demandInfo.rate.toFixed(1)}x (${item.selectedFlat.demandInfo.totalApplicants ?? 0}/${item.selectedFlat.demandInfo.totalUnits ?? 0})`
                                        : 'N/A'}
                                </td>
                            ))}
                        </tr>

                        <tr>
                            <td>Floor Area</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-area`}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {item.selectedFlat.estimatedFloorArea != null
                                        ? `${item.selectedFlat.estimatedFloorArea} sqm`
                                        : item.selectedFlat.estimatedInternalFloorArea != null
                                          ? `${item.selectedFlat.estimatedInternalFloorArea} sqm`
                                          : 'TBA'}
                                </td>
                            ))}
                        </tr>

                        {/* Price range */}
                        <tr>
                            <td>Price Range</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-price`}
                                    className="font-mono"
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {item.selectedFlat.minIndicativePrice != null &&
                                    item.selectedFlat.maxIndicativePrice != null
                                        ? `${fmt(item.selectedFlat.minIndicativePrice)} - ${fmt(item.selectedFlat.maxIndicativePrice)}`
                                        : 'TBA'}
                                </td>
                            ))}
                        </tr>

                        {/* Grant */}
                        <tr>
                            <td>Total Grant</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-grant`}
                                    className="font-mono"
                                    style={{
                                        ...getColumnStyle(item.selectedFlat.affordability.colour),
                                        color: 'var(--clr-green)',
                                    }}
                                >
                                    -{fmt(item.selectedFlat.financials.grants.totalGrant)}
                                </td>
                            ))}
                        </tr>

                        {/* Loan */}
                        <tr>
                            <td>HDB Loan Amount</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-loan`}
                                    className="font-mono"
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {fmt(item.selectedFlat.financials.loan.maxLoanAmount)}
                                </td>
                            ))}
                        </tr>

                        {/* Monthly instalment */}
                        <tr>
                            <td>Monthly Instalment</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-mth`}
                                    className="font-mono"
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {fmt(item.selectedFlat.financials.loan.monthlyInstalment)}/mth
                                </td>
                            ))}
                        </tr>

                        {/* MSR */}
                        <tr>
                            <td>MSR Usage</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-msr`}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    <span
                                        style={{
                                            color:
                                                item.selectedFlat.financials.loan.msrUsed > 0.3
                                                    ? 'var(--clr-red)'
                                                    : item.selectedFlat.financials.loan.msrUsed >
                                                        0.25
                                                      ? 'var(--clr-yellow)'
                                                      : 'var(--clr-green)',
                                        }}
                                    >
                                        {pct(item.selectedFlat.financials.loan.msrUsed)}
                                    </span>
                                </td>
                            ))}
                        </tr>

                        {/* Milestones header */}
                        <tr>
                            <td
                                colSpan={items.length + 1}
                                style={{
                                    background: '#f8fafc',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                }}
                            >
                                Milestone Cash Flow
                            </td>
                        </tr>
                        {items[0].selectedFlat.financials.cashFlow.milestones.map((_, mi) => (
                            <tr key={`milestone-${mi}`}>
                                <td>
                                    {items[0].selectedFlat.financials.cashFlow.milestones[mi].stage}
                                </td>
                                {items.map((item) => (
                                    <td
                                        key={`${getResultIdentity(item)}-m${mi}`}
                                        className="font-mono"
                                        style={{
                                            ...getColumnStyle(
                                                item.selectedFlat.affordability.colour
                                            ),
                                            fontSize: '0.82rem',
                                        }}
                                    >
                                        <div>
                                            Cash:{' '}
                                            {fmt(
                                                item.selectedFlat.financials.cashFlow.milestones[mi]
                                                    .amountCash
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.72rem',
                                                color: 'var(--clr-text-muted)',
                                            }}
                                        >
                                            CPF:{' '}
                                            {fmt(
                                                item.selectedFlat.financials.cashFlow.milestones[mi]
                                                    .amountCPF
                                            )}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}

                        {/* Totals */}
                        <tr>
                            <td style={{ fontWeight: 600 }}>Total Cash Required</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-cash`}
                                    className="font-mono"
                                    style={{
                                        ...getColumnStyle(item.selectedFlat.affordability.colour),
                                        fontWeight: 600,
                                    }}
                                >
                                    {fmt(item.selectedFlat.financials.cashFlow.totalCashRequired)}
                                </td>
                            ))}
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 600 }}>Total CPF Required</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-cpf`}
                                    className="font-mono"
                                    style={{
                                        ...getColumnStyle(item.selectedFlat.affordability.colour),
                                        fontWeight: 600,
                                    }}
                                >
                                    {fmt(item.selectedFlat.financials.cashFlow.totalCPFRequired)}
                                </td>
                            ))}
                        </tr>

                        <tr>
                            <td>Cash Shortfall</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-shortfall`}
                                    className="font-mono"
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {fmt(item.selectedFlat.financials.affordability.cashShortfall)}
                                </td>
                            ))}
                        </tr>

                        <tr>
                            <td>Monthly Income Buffer</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-buffer`}
                                    className="font-mono"
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {fmt(
                                        item.selectedFlat.financials.affordability
                                            .monthlyIncomeBuffer
                                    )}
                                </td>
                            ))}
                        </tr>

                        {/* Completion */}
                        <tr>
                            <td>Est. Completion</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-comp`}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {item.project.estimatedCompletion || 'TBA'}
                                </td>
                            ))}
                        </tr>

                        {/* Launch date */}
                        <tr>
                            <td>Launch Date</td>
                            {items.map((item) => (
                                <td
                                    key={`${getResultIdentity(item)}-launch`}
                                    style={getColumnStyle(item.selectedFlat.affordability.colour)}
                                >
                                    {formatLaunchDate(item.project.launchdate)}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
