import type { TimelineMilestone } from '../../types';

interface MilestoneDetailsPanelProps {
    milestone: TimelineMilestone;
    projectName: string;
    onClose: () => void;
}

export default function MilestoneDetailsPanel({
    milestone,
    projectName,
    onClose,
}: MilestoneDetailsPanelProps) {
    const getMilestoneIcon = (type: string): string => {
        switch (type) {
            case 'bto_launch':
                return '🏗️';
            case 'option_fee_due':
                return '💰';
            case 'signing_payment_due':
                return '📝';
            case 'key_collection_payment_due':
                return '🔑';
            case 'cash_ready_option_fee':
                return '💵';
            case 'downpayment_saved':
                return '🏦';
            case 'monthly_payment_affordable':
                return '📊';
            case 'dia_expires':
                return '⚠️';
            case 'ehg_disqualification':
                return '⛔';
            case 'grant_tier_drop':
                return '📉';
            default:
                return '📍';
        }
    };

    const getMilestoneTitle = (type: string): string => {
        switch (type) {
            case 'bto_launch':
                return 'BTO Launch';
            case 'option_fee_due':
                return 'Option Fee Payment Due';
            case 'signing_payment_due':
                return 'Signing Appointment Payment Due';
            case 'key_collection_payment_due':
                return 'Key Collection Payment Due';
            case 'cash_ready_option_fee':
                return 'Cash Ready for Option Fee';
            case 'downpayment_saved':
                return 'Full Downpayment Saved';
            case 'monthly_payment_affordable':
                return 'Monthly Payments Affordable';
            case 'dia_expires':
                return 'Deferred Income Assessment Expires';
            case 'ehg_disqualification':
                return 'Enhanced Housing Grant Disqualification Risk';
            case 'grant_tier_drop':
                return 'Grant Tier Drop Risk';
            case 'income_checkpoint':
                return 'Income Checkpoint';
            case 'cpf_checkpoint':
                return 'CPF Balance Checkpoint';
            default:
                return 'Milestone';
        }
    };

    const getMilestoneColor = (type: string): string => {
        if (
            type === 'dia_expires' ||
            type === 'ehg_disqualification' ||
            type === 'grant_tier_drop'
        ) {
            return '#EF4444'; // Red for critical
        }
        if (
            type === 'bto_launch' ||
            type === 'option_fee_due' ||
            type === 'signing_payment_due' ||
            type === 'key_collection_payment_due'
        ) {
            return '#3B82F6'; // Blue for payment milestones
        }
        if (
            type === 'cash_ready_option_fee' ||
            type === 'downpayment_saved' ||
            type === 'monthly_payment_affordable'
        ) {
            return '#10B981'; // Green for savings milestones
        }
        return '#6B7280'; // Gray for informational
    };

    const color = getMilestoneColor(milestone.type);
    const icon = getMilestoneIcon(milestone.type);
    const title = getMilestoneTitle(milestone.type);

    return (
        <div
            style={{
                padding: '1.5rem',
                background: 'var(--clr-bg-primary)',
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                }}
            >
                <div style={{ flex: 1 }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            marginBottom: '0.5rem',
                        }}
                    >
                        <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{title}</h3>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
                        {projectName} •{' '}
                        {new Date(milestone.date).toLocaleDateString('en-SG', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '0.5rem',
                        background: 'transparent',
                        border: '1px solid var(--clr-border)',
                        borderRadius: '6px',
                        color: 'var(--clr-text-muted)',
                        cursor: 'pointer',
                        fontSize: '1.2rem',
                        lineHeight: 1,
                        transition: 'all 200ms ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--clr-bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                    }}
                    aria-label="Close details"
                >
                    ✕
                </button>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {milestone.description}
            </p>

            {/* Payment Details (if applicable) */}
            {milestone.paymentAmount !== undefined && milestone.paymentAmount > 0 && (
                <div
                    style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'var(--clr-bg-secondary)',
                        borderRadius: '6px',
                    }}
                >
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        💰 Payment Breakdown
                    </h4>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                            gap: '1rem',
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--clr-text-muted)',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                Total Payment
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 600, color }}>
                                ${milestone.paymentAmount.toLocaleString()}
                            </div>
                        </div>
                        {milestone.cashAmount !== undefined && (
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--clr-text-muted)',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    Cash Required
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                    ${milestone.cashAmount.toLocaleString()}
                                </div>
                            </div>
                        )}
                        {milestone.cpfAmount !== undefined && (
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--clr-text-muted)',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    CPF OA Used
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                                    ${milestone.cpfAmount.toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Projected Balances */}
            {(milestone.projectedCashSavings !== undefined ||
                milestone.projectedCPFOA !== undefined) && (
                <div
                    style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: 'var(--clr-bg-secondary)',
                        borderRadius: '6px',
                    }}
                >
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>
                        📊 Projected Balances at Milestone
                    </h4>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                            gap: '1rem',
                        }}
                    >
                        {milestone.projectedCashSavings !== undefined && (
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--clr-text-muted)',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    💵 Cash Savings
                                </div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                                    ${milestone.projectedCashSavings.toLocaleString()}
                                </div>
                                {milestone.cashAmount !== undefined && (
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color:
                                                milestone.projectedCashSavings >=
                                                milestone.cashAmount
                                                    ? 'var(--clr-green)'
                                                    : 'var(--clr-red)',
                                            marginTop: '0.25rem',
                                        }}
                                    >
                                        {milestone.projectedCashSavings >= milestone.cashAmount
                                            ? '✓ Sufficient'
                                            : `✗ Short by $${(milestone.cashAmount - milestone.projectedCashSavings).toLocaleString()}`}
                                    </div>
                                )}
                            </div>
                        )}
                        {milestone.projectedCPFOA !== undefined && (
                            <div>
                                <div
                                    style={{
                                        fontSize: '0.8rem',
                                        color: 'var(--clr-text-muted)',
                                        marginBottom: '0.25rem',
                                    }}
                                >
                                    🏦 CPF-OA Balance
                                </div>
                                <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                                    ${milestone.projectedCPFOA.toLocaleString()}
                                </div>
                                {milestone.cpfAmount !== undefined && milestone.cpfAmount > 0 && (
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color:
                                                milestone.projectedCPFOA >= milestone.cpfAmount
                                                    ? 'var(--clr-green)'
                                                    : 'var(--clr-red)',
                                            marginTop: '0.25rem',
                                        }}
                                    >
                                        {milestone.projectedCPFOA >= milestone.cpfAmount
                                            ? '✓ Sufficient'
                                            : `✗ Short by $${(milestone.cpfAmount - milestone.projectedCPFOA).toLocaleString()}`}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Required Savings Rate */}
            {milestone.requiredMonthlySavingsRate !== undefined &&
                milestone.monthlyIncomeAtMilestone !== undefined && (
                    <div
                        style={{
                            marginBottom: '1.5rem',
                            padding: '1rem',
                            background: milestone.canAfford
                                ? 'rgba(16, 185, 129, 0.1)'
                                : 'rgba(255, 193, 7, 0.1)',
                            borderRadius: '6px',
                            border: `2px solid ${
                                milestone.canAfford
                                    ? 'rgba(16, 185, 129, 0.3)'
                                    : 'rgba(255, 193, 7, 0.5)'
                            }`,
                        }}
                    >
                        <h4
                            style={{
                                fontSize: '0.95rem',
                                fontWeight: 600,
                                marginBottom: '0.75rem',
                                color: milestone.canAfford
                                    ? 'var(--clr-green)'
                                    : 'var(--clr-accent)',
                            }}
                        >
                            💰 Required Monthly Savings
                        </h4>
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div
                                style={{
                                    fontSize: '2rem',
                                    fontWeight: 700,
                                    color: milestone.canAfford
                                        ? 'var(--clr-green)'
                                        : 'var(--clr-accent)',
                                }}
                            >
                                {Math.round(milestone.requiredMonthlySavingsRate * 100)}%
                            </div>
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--clr-text-muted)',
                                    marginTop: '0.25rem',
                                }}
                            >
                                of your household income
                            </div>
                        </div>
                        <div
                            style={{
                                padding: '0.75rem',
                                background: 'var(--clr-bg-primary)',
                                borderRadius: '4px',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'var(--clr-text-muted)',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                Monthly Savings Required
                            </div>
                            <div style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                                $
                                {(
                                    milestone.monthlyIncomeAtMilestone *
                                    milestone.requiredMonthlySavingsRate
                                ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div
                                style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--clr-text-muted)',
                                    marginTop: '0.25rem',
                                }}
                            >
                                Based on projected income of $
                                {milestone.monthlyIncomeAtMilestone.toLocaleString()} /month
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: '0.85rem',
                                color: 'var(--clr-text-secondary)',
                                marginTop: '0.75rem',
                                marginBottom: 0,
                                lineHeight: 1.5,
                            }}
                        >
                            {milestone.canAfford
                                ? '✓ Good news! Your current savings rate should allow you to meet this milestone comfortably.'
                                : '⚠️ To afford this milestone on time, you need to save this percentage of your income each month. Adjust your savings rate in the configuration panel.'}
                        </p>
                    </div>
                )}

            {/* Affordability Status (if applicable) */}
            {milestone.canAfford !== undefined && (
                <div
                    style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: milestone.canAfford
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                        borderRadius: '6px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>
                            {milestone.canAfford ? '✓' : '✗'}
                        </span>
                        <div>
                            <h4
                                style={{
                                    fontSize: '0.95rem',
                                    fontWeight: 600,
                                    color: milestone.canAfford
                                        ? 'var(--clr-green)'
                                        : 'var(--clr-red)',
                                    marginBottom: '0.25rem',
                                }}
                            >
                                {milestone.canAfford
                                    ? 'You Can Afford This!'
                                    : 'Not Yet Affordable'}
                            </h4>
                            <p
                                style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--clr-text-muted)',
                                    margin: 0,
                                }}
                            >
                                {milestone.canAfford
                                    ? 'Based on your projected savings and income at this date, you should be able to meet this payment.'
                                    : 'Based on your projected savings and income, you may not be able to meet this payment by this date. Consider adjusting your timeline or savings strategy.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Critical Warnings */}
            {milestone.significance === 'critical' && (
                <div
                    style={{
                        padding: '1rem',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid var(--clr-red)',
                        borderRadius: '6px',
                        color: 'var(--clr-red)',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <div>
                            <strong style={{ display: 'block', marginBottom: '0.25rem' }}>
                                Critical Event
                            </strong>
                            <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                                This is a time-sensitive event that may impact your eligibility or
                                grant amount. Plan your BTO application timing carefully to avoid
                                adverse outcomes.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
