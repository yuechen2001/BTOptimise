/**
 * Scenario Comparison Component
 *
 * Side-by-side table comparing "Apply Now" vs "Wait X months" scenarios (Story 6).
 * Shows grants, cash required, opportunity costs, and recommendations.
 */

import type { ScenarioComparison } from '../../types';

interface ScenarioComparisonProps {
    comparisons: ScenarioComparison[];
}

export default function ScenarioComparisonComponent({ comparisons }: ScenarioComparisonProps) {
    if (comparisons.length === 0) return null;

    const fmt = (n: number) => `$${n.toLocaleString()}`;

    // Find best scenario (highest grants - net opportunity cost)
    const bestScenario = comparisons.reduce((best, current) => {
        const currentValue = current.totalGrantsReceived - current.netOpportunityCost;
        const bestValue = best.totalGrantsReceived - best.netOpportunityCost;
        return currentValue > bestValue ? current : best;
    });

    const getAffordabilityColor = (level: string) => {
        switch (level) {
            case 'comfortable':
                return '#16a34a';
            case 'stretch':
                return '#f59e0b';
            default:
                return '#ef4444';
        }
    };

    const getAffordabilityLabel = (level: string) => {
        switch (level) {
            case 'comfortable':
                return 'Comfortable';
            case 'stretch':
                return 'Stretch';
            default:
                return 'Unaffordable';
        }
    };

    return (
        <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                Scenario Comparison (Story 6: Wait-and-See)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '1rem' }}>
                Compare different application timing strategies to find the optimal approach
            </p>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
                    <thead>
                        <tr style={{ background: 'var(--clr-bg-secondary)' }}>
                            <th
                                style={{
                                    padding: '0.75rem',
                                    textAlign: 'left',
                                    borderBottom: '2px solid var(--clr-border)',
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Scenario
                            </th>
                            {comparisons.map((scenario, idx) => (
                                <th
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        textAlign: 'center',
                                        borderBottom: '2px solid var(--clr-border)',
                                        fontWeight: 600,
                                        fontSize: '0.85rem',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.1)'
                                                : undefined,
                                    }}
                                >
                                    {scenario.scenarioName}
                                    {scenario.scenarioName === bestScenario.scenarioName && (
                                        <div
                                            style={{
                                                fontSize: '0.7rem',
                                                color: '#16a34a',
                                                fontWeight: 700,
                                                marginTop: '0.25rem',
                                            }}
                                        >
                                            ★ RECOMMENDED
                                        </div>
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Grants Row */}
                        <tr>
                            <td
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '1px solid var(--clr-border)',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Total Grants
                            </td>
                            {comparisons.map((scenario, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--clr-border)',
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        color: '#16a34a',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.05)'
                                                : undefined,
                                    }}
                                >
                                    {fmt(scenario.totalGrantsReceived)}
                                </td>
                            ))}
                        </tr>

                        {/* Cash Required Row */}
                        <tr>
                            <td
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '1px solid var(--clr-border)',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Cash Required
                            </td>
                            {comparisons.map((scenario, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--clr-border)',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.05)'
                                                : undefined,
                                    }}
                                >
                                    {fmt(scenario.totalCashRequired)}
                                </td>
                            ))}
                        </tr>

                        {/* Monthly Instalment Row */}
                        <tr>
                            <td
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '1px solid var(--clr-border)',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Monthly Payment
                            </td>
                            {comparisons.map((scenario, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--clr-border)',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.05)'
                                                : undefined,
                                    }}
                                >
                                    {fmt(scenario.monthlyInstalment)}
                                </td>
                            ))}
                        </tr>

                        {/* Rent Paid Row */}
                        <tr>
                            <td
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '1px solid var(--clr-border)',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Rent Paid Before Purchase
                            </td>
                            {comparisons.map((scenario, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--clr-border)',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        color: scenario.rentPaidBeforePurchase > 0 ? '#ef4444' : 'inherit',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.05)'
                                                : undefined,
                                    }}
                                >
                                    {scenario.rentPaidBeforePurchase > 0
                                        ? fmt(scenario.rentPaidBeforePurchase)
                                        : '-'}
                                </td>
                            ))}
                        </tr>

                        {/* CPF Interest Gained Row */}
                        <tr>
                            <td
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '1px solid var(--clr-border)',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                }}
                            >
                                CPF Interest Gained
                            </td>
                            {comparisons.map((scenario, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--clr-border)',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        color: '#16a34a',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.05)'
                                                : undefined,
                                    }}
                                >
                                    {scenario.cpfInterestGainedFromWaiting > 0
                                        ? `+${fmt(scenario.cpfInterestGainedFromWaiting)}`
                                        : '-'}
                                </td>
                            ))}
                        </tr>

                        {/* Net Opportunity Cost Row */}
                        <tr style={{ background: 'rgba(251, 146, 60, 0.05)' }}>
                            <td
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '2px solid var(--clr-border)',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Net Opportunity Cost
                            </td>
                            {comparisons.map((scenario, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '2px solid var(--clr-border)',
                                        textAlign: 'center',
                                        fontSize: '0.95rem',
                                        fontWeight: 700,
                                        color: scenario.netOpportunityCost > 0 ? '#ef4444' : '#16a34a',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.1)'
                                                : undefined,
                                    }}
                                >
                                    {scenario.netOpportunityCost > 0
                                        ? `-${fmt(scenario.netOpportunityCost)}`
                                        : `+${fmt(Math.abs(scenario.netOpportunityCost))}`}
                                </td>
                            ))}
                        </tr>

                        {/* Affordability Row */}
                        <tr>
                            <td
                                style={{
                                    padding: '0.75rem',
                                    borderBottom: '1px solid var(--clr-border)',
                                    fontWeight: 500,
                                    fontSize: '0.85rem',
                                }}
                            >
                                Affordability
                            </td>
                            {comparisons.map((scenario, idx) => (
                                <td
                                    key={idx}
                                    style={{
                                        padding: '0.75rem',
                                        borderBottom: '1px solid var(--clr-border)',
                                        textAlign: 'center',
                                        fontSize: '0.9rem',
                                        background:
                                            scenario.scenarioName === bestScenario.scenarioName
                                                ? 'rgba(22, 163, 74, 0.05)'
                                                : undefined,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: getAffordabilityColor(scenario.affordabilityLevel),
                                            fontWeight: 600,
                                        }}
                                    >
                                        {getAffordabilityLabel(scenario.affordabilityLevel)}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Summary */}
            <div
                style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'rgba(22, 163, 74, 0.1)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                }}
            >
                <strong style={{ color: '#16a34a' }}>Recommendation:</strong>{' '}
                <strong>{bestScenario.scenarioName}</strong> offers the best balance between grant amount and
                opportunity cost. 
                {bestScenario.rentPaidBeforePurchase > 0
                    ? ` While you'll pay ${fmt(bestScenario.rentPaidBeforePurchase)} in rent, you'll receive ${fmt(
                          bestScenario.totalGrantsReceived
                      )} in grants.`
                    : ` You'll secure ${fmt(bestScenario.totalGrantsReceived)} in grants immediately.`}
            </div>
        </div>
    );
}
