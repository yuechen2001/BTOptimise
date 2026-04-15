/**
 * Snapshot Details Component
 *
 * Displays financial snapshot at the selected date:
 * - Projected income, CPF, cash savings
 * - Grant eligibility and amounts
 * - Maximum loan capacity
 * - DIA status (Story 1)
 */

import type { TimelineSnapshot, TimelineConfig } from '../../types';

interface SnapshotDetailsProps {
    snapshot: TimelineSnapshot;
    config: TimelineConfig;
}

export default function SnapshotDetails({ snapshot, config }: SnapshotDetailsProps) {
    const fmt = (n: number) => `$${n.toLocaleString()}`;

    // Check if DIA status changed
    const isDIAActive = snapshot.isDeferredIncome;
    const hasDIAConfig = config.assumeEmploymentDate && config.assumedStartingSalary;

    return (
        <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Financial Snapshot</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {/* Income Card */}
                <div className="card" style={{ background: 'white', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                        Household Income
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--clr-primary)' }}>
                        {fmt(snapshot.totalHouseholdIncome)}
                        <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>/month</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--clr-text-muted)' }}>
                        {snapshot.projectedPartnerMonthlyIncome
                            ? `You: ${fmt(snapshot.projectedMonthlyIncome)} + Partner: ${fmt(
                                  snapshot.projectedPartnerMonthlyIncome
                              )}`
                            : `Individual: ${fmt(snapshot.projectedMonthlyIncome)}`}
                    </div>

                    {/* DIA Badge (Story 1) */}
                    {isDIAActive && hasDIAConfig && (
                        <div
                            style={{
                                marginTop: '0.75rem',
                                padding: '0.5rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '6px',
                                fontSize: '0.8rem',
                                color: 'var(--clr-primary)',
                            }}
                        >
                            <strong>Deferred Income Assessment</strong>
                            <br />
                            Income assessed at $0 for grant calculation
                        </div>
                    )}
                </div>

                {/* CPF OA Card */}
                <div className="card" style={{ background: 'white', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                        CPF Ordinary Account
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#16a34a' }}>
                        {fmt(snapshot.projectedCPFOA)}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--clr-text-muted)' }}>
                        Earning 2.5% p.a. interest + contributions
                    </div>
                </div>

                {/* Cash Savings Card */}
                <div className="card" style={{ background: 'white', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                        Cash Savings
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0891b2' }}>
                        {fmt(snapshot.projectedCashSavings)}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--clr-text-muted)' }}>
                        Accumulated through monthly savings
                    </div>
                </div>

                {/* Grant Eligibility Card */}
                <div className="card" style={{ background: 'white', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                        Total Grants Eligible
                    </div>
                    <div
                        style={{
                            fontSize: '1.75rem',
                            fontWeight: 700,
                            color: snapshot.grants.totalGrant > 0 ? '#16a34a' : 'var(--clr-text-muted)',
                        }}
                    >
                        {fmt(snapshot.grants.totalGrant)}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--clr-text-muted)' }}>
                        {snapshot.grants.totalGrant > 0
                            ? `EHG: ${fmt(snapshot.grants.ehgAmount)}`
                            : 'Income exceeds grant ceiling'}
                    </div>
                </div>

                {/* Max Loan Card */}
                <div className="card" style={{ background: 'white', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                        Max HDB Loan
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--clr-primary)' }}>
                        {fmt(snapshot.maxLoan.maxLoanAmount)}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--clr-text-muted)' }}>
                        Monthly: ~{fmt(snapshot.maxLoan.monthlyInstalment)} (30% MSR)
                    </div>
                </div>

                {/* Age Card */}
                <div className="card" style={{ background: 'white', padding: '1.25rem' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: '0.5rem' }}>
                        Age at this Point
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>
                        {snapshot.age} years
                        {snapshot.partnerAge && <span style={{ fontSize: '1rem' }}> / {snapshot.partnerAge}</span>}
                    </div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--clr-text-muted)' }}>
                        {snapshot.partnerAge ? 'You & Partner' : 'Individual'}
                    </div>
                </div>
            </div>

            {/* Opportunity Cost (Story 6) */}
            {snapshot.opportunityCost && (
                <div
                    style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(251, 146, 60, 0.1)',
                        borderRadius: '8px',
                    }}
                >
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                        Opportunity Cost Analysis (Story 6)
                    </div>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '0.75rem',
                            fontSize: '0.85rem',
                        }}
                    >
                        <div>
                            <span style={{ color: 'var(--clr-text-muted)' }}>Rent Paid:</span>{' '}
                            <strong>{fmt(snapshot.opportunityCost.cumulativeRentPaid)}</strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--clr-text-muted)' }}>CPF Interest Gained:</span>{' '}
                            <strong style={{ color: '#16a34a' }}>
                                {fmt(snapshot.opportunityCost.cpfInterestGained)}
                            </strong>
                        </div>
                        <div>
                            <span style={{ color: 'var(--clr-text-muted)' }}>Net Opportunity Cost:</span>{' '}
                            <strong
                                style={{
                                    color:
                                        snapshot.opportunityCost.netOpportunityCost > 0
                                            ? 'var(--clr-red)'
                                            : '#16a34a',
                                }}
                            >
                                {fmt(Math.abs(snapshot.opportunityCost.netOpportunityCost))}
                                {snapshot.opportunityCost.netOpportunityCost > 0 ? ' loss' : ' gain'}
                            </strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Eligibility Status */}
            <div style={{ marginTop: '1rem', fontSize: '0.85rem' }}>
                <div
                    style={{
                        display: 'inline-block',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        background: snapshot.eligibility.canPurchaseBTO
                            ? 'rgba(22, 163, 74, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                        color: snapshot.eligibility.canPurchaseBTO ? '#16a34a' : '#ef4444',
                    }}
                >
                    {snapshot.eligibility.canPurchaseBTO ? '✓ Eligible for BTO' : '✗ Not Eligible'}
                    {snapshot.eligibility.reasons.length > 0 && (
                        <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
                            ({snapshot.eligibility.reasons[0]})
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
