/**
 * Affordability Chart Component
 *
 * Recharts visualization showing affordability progression over time.
 * Displays how different flat types transition from unaffordable → stretch → comfortable.
 */

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { TimelineSnapshot } from '../../types';

interface AffordabilityChartProps {
    snapshots: TimelineSnapshot[];
    selectedIndex: number;
}

export default function AffordabilityChart({ snapshots, selectedIndex }: AffordabilityChartProps) {
    // Transform data for Recharts
    const chartData = useMemo(() => {
        return snapshots.map((snapshot, index) => {
            const date = new Date(snapshot.date);
            const dateLabel = date.toLocaleDateString('en-SG', { month: 'short', year: 'numeric' });

            // Get representative bands (4-Room Standard for simplicity)
            const standardBand = snapshot.affordabilityBands.find(
                (b) => b.flatType === '4-Room' && b.classification === 'Standard'
            );
            const plusBand = snapshot.affordabilityBands.find(
                (b) => b.flatType === '4-Room' && b.classification === 'Plus'
            );
            const primeBand = snapshot.affordabilityBands.find(
                (b) => b.flatType === '4-Room' && b.classification === 'Prime'
            );

            return {
                index,
                date: dateLabel,
                monthsFromNow: snapshot.monthsFromNow,
                grants: snapshot.grants.totalGrant,
                income: snapshot.totalHouseholdIncome,
                cpfOA: snapshot.projectedCPFOA / 1000, // Scale down for chart
                cashSavings: snapshot.projectedCashSavings / 1000,
                cashRequired4RmStd: standardBand ? standardBand.cashRequired / 1000 : 0,
                cashRequired4RmPlus: plusBand ? plusBand.cashRequired / 1000 : 0,
                cashRequired4RmPrime: primeBand ? primeBand.cashRequired / 1000 : 0,
            };
        });
    }, [snapshots]);

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;

        const data = payload[0].payload;

        return (
            <div
                style={{
                    background: 'white',
                    padding: '0.75rem',
                    border: '1px solid var(--clr-border)',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
            >
                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{data.date}</div>
                <div style={{ color: 'var(--clr-primary)' }}>
                    Grants: ${(data.grants || 0).toLocaleString()}
                </div>
                <div style={{ color: '#16a34a' }}>CPF OA: ${(data.cpfOA * 1000).toLocaleString()}</div>
                <div style={{ color: '#0891b2' }}>Cash: ${(data.cashSavings * 1000).toLocaleString()}</div>
            </div>
        );
    };

    return (
        <div>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Financial Progression</h3>

            <div
                style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    border: '1px solid var(--clr-border)',
                }}
            >
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            stroke="var(--clr-text-muted)"
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 12 }}
                            stroke="var(--clr-text-muted)"
                            label={{ value: 'Amount ($1,000s)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: '0.85rem' }} />

                        {/* Income Line */}
                        <Line
                            type="monotone"
                            dataKey="income"
                            stroke="#6366f1"
                            strokeWidth={2}
                            name="Monthly Income ($)"
                            dot={false}
                        />

                        {/* Grants Line */}
                        <Line
                            type="monotone"
                            dataKey="grants"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            name="Total Grants ($)"
                            dot={false}
                        />

                        {/* CPF OA Line */}
                        <Line
                            type="monotone"
                            dataKey="cpfOA"
                            stroke="#16a34a"
                            strokeWidth={2}
                            name="CPF OA ($k)"
                            dot={false}
                        />

                        {/* Cash Savings Line */}
                        <Line
                            type="monotone"
                            dataKey="cashSavings"
                            stroke="#0891b2"
                            strokeWidth={2}
                            name="Cash Savings ($k)"
                            dot={false}
                        />

                        {/* Selected Point Indicator */}
                        {chartData[selectedIndex] && (
                            <Line
                                type="monotone"
                                dataKey={(data: any) => (data.index === selectedIndex ? data.income : null)}
                                stroke="#ef4444"
                                strokeWidth={0}
                                dot={{ r: 6, fill: '#ef4444' }}
                                name="Current View"
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>

                <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--clr-text-muted)', textAlign: 'center' }}>
                    Track income growth, grant eligibility, and savings accumulation over time
                </div>
            </div>
        </div>
    );
}
