import { useEffect, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import { getFlatVariantLabel, getResultIdentity } from '../../utils/resultIdentity';

function InfoTooltip({ text }: { text: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isFocusVisible, setIsFocusVisible] = useState(false);
    const wrapperRef = useRef<HTMLSpanElement | null>(null);
    const isTouchLikeDevice = () =>
        typeof window !== 'undefined' &&
        window.matchMedia('(hover: none), (pointer: coarse)').matches;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handlePointerDown = (event: PointerEvent) => {
            if (!wrapperRef.current?.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('pointerdown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('pointerdown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <span
            ref={wrapperRef}
            className={`metric-help${isOpen ? ' is-open' : ''}${
                isFocusVisible ? ' is-focus-visible' : ''
            }`}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                type="button"
                className="metric-help__button"
                aria-label={text}
                aria-expanded={isOpen}
                onFocus={(event) => {
                    setIsFocusVisible(event.currentTarget.matches(':focus-visible'));
                }}
                onBlur={() => setIsFocusVisible(false)}
                onClick={() => {
                    if (!isTouchLikeDevice()) {
                        return;
                    }
                    setIsOpen((current) => !current);
                }}
            >
                i
            </button>
            <span className="metric-help__tooltip" role="tooltip">
                {text}
            </span>
        </span>
    );
}

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
        borderLeft: '1px solid rgba(148, 163, 184, 0.35)',
    });

    const getCashFlowStageTooltip = (stage: string) => {
        const normalizedStage = stage.trim().toLowerCase();
        const shouldShowTooltip =
            normalizedStage.includes('option fee') ||
            normalizedStage.includes('signing of agreement') ||
            normalizedStage.includes('key collection');

        if (!shouldShowTooltip) {
            return null;
        }

        return 'Cash is the minimum amount you need to pay out-of-pocket, while CPF is the maximum amount that can be paid using CPF at this stage.';
    };

    const renderSectionHeader = (title: string, tooltipText?: string) => (
        <tr>
            <td
                colSpan={items.length + 1}
                style={{
                    background: '#f8fafc',
                    borderTop: '1px solid var(--clr-border)',
                    borderBottom: '1px solid var(--clr-border)',
                    padding: '1rem',
                }}
            >
                <div
                    style={{
                        alignItems: 'center',
                        fontSize: '0.95rem',
                        fontWeight: 800,
                        gap: '0.45rem',
                        letterSpacing: '0.04em',
                        display: 'inline-flex',
                        textTransform: 'uppercase',
                        color: 'var(--clr-text)',
                        marginBottom: 0,
                    }}
                >
                    {title}
                    {tooltipText ? <InfoTooltip text={tooltipText} /> : null}
                </div>
            </td>
        </tr>
    );

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
                        Side-by-side view of your shortlisted projects, grouped into overview,
                        financing, cash flow, and timeline. <br />
                        <em>Note that all calculations are based on the minimum price.</em>
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
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            fontWeight: 700,
                                            color: 'var(--clr-text)',
                                            marginBottom: '0.25rem',
                                            textTransform: 'none',
                                            letterSpacing: '-0.01em',
                                        }}
                                    >
                                        {item.project.name}
                                    </div>
                                    <div
                                        style={{
                                            fontWeight: 400,
                                            fontSize: '0.78rem',
                                            textTransform: 'none',
                                            letterSpacing: 0,
                                            color: 'var(--clr-text-secondary)',
                                        }}
                                    >
                                        {getFlatVariantLabel(item)}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            gap: '0.4rem',
                                            flexWrap: 'wrap',
                                            marginTop: '0.6rem',
                                        }}
                                    >
                                        <span
                                            className={`badge badge--${item.selectedFlat.affordability.colour}`}
                                        >
                                            {
                                                affordabilityLabel[
                                                    item.selectedFlat.affordability.status
                                                ]
                                            }
                                        </span>
                                        <span
                                            className={`badge badge--${item.project.classification.toLowerCase()}`}
                                        >
                                            {item.project.classification}
                                        </span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {renderSectionHeader('Overview')}
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
                        {renderSectionHeader('Financing')}
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
                        <tr>
                            <td>
                                <span className="metric-with-help">
                                    MSR Usage
                                    <InfoTooltip text="Mortgage Servicing Ratio" />
                                </span>
                            </td>
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
                        {renderSectionHeader('Cash Flow')}
                        {items[0].selectedFlat.financials.cashFlow.milestones.map((_, mi) => (
                            <tr key={`milestone-${mi}`}>
                                <td>
                                    <span className="metric-with-help">
                                        {items[0].selectedFlat.financials.cashFlow.milestones[mi].stage}
                                        {getCashFlowStageTooltip(
                                            items[0].selectedFlat.financials.cashFlow.milestones[mi]
                                                .stage
                                        ) ? (
                                            <InfoTooltip
                                                text={
                                                    getCashFlowStageTooltip(
                                                        items[0].selectedFlat.financials.cashFlow
                                                            .milestones[mi].stage
                                                    )!
                                                }
                                            />
                                        ) : null}
                                    </span>
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
                        {renderSectionHeader('Timeline')}
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
