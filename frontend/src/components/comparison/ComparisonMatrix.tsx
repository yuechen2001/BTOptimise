import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';

export default function ComparisonMatrix() {
  const { state, dispatch } = useAppState();
  const navigate = useNavigate();
  const items = state.comparison;

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 'var(--sp-2xl)' }}>
        <h2 className="section-title">Comparison Matrix</h2>
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

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 'var(--sp-lg)' }}>
        <div>
          <h2 className="section-title">Comparison Matrix</h2>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Side-by-side breakdown of your shortlisted projects.
          </p>
        </div>
        <div className="flex-gap">
          <button className="btn btn--ghost btn--small" onClick={() => dispatch({ type: 'CLEAR_COMPARISON' })}>
            Clear All
          </button>
          <button className="btn btn--secondary btn--small" onClick={() => navigate({ to: '/dashboard' })}>
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
                <th key={`${item.project.id}-${item.selectedFlatType}`}>
                  <div>{item.project.name}</div>
                  <div style={{ fontWeight: 400, fontSize: '0.72rem', textTransform: 'none', letterSpacing: 0 }}>
                    {item.selectedFlatType}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Classification */}
            <tr>
              <td style={{ fontWeight: 600 }}>Affordability</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-class`}>
                  <span className={`badge badge--${item.classification}`}>
                    {item.classification === 'green' ? 'Affordable' : item.classification === 'yellow' ? 'Stretch' : 'Out of Reach'}
                  </span>
                </td>
              ))}
            </tr>

            {/* Classification */}
            <tr>
              <td style={{ fontWeight: 600 }}>Project Classification</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-pclass`}>
                  <span className={`badge badge--${item.project.classification.toLowerCase()}`}>
                    {item.project.classification}
                  </span>
                </td>
              ))}
            </tr>

            {/* Estate */}
            <tr>
              <td>Estate</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-estate`}>{item.project.estate}</td>
              ))}
            </tr>

            {/* Price */}
            <tr>
              <td>Indicative Price</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-price`} className="font-mono">
                  {fmt(item.indicativePrice)}
                </td>
              ))}
            </tr>

            {/* Grant */}
            <tr>
              <td>Total Grant</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-grant`} className="font-mono" style={{ color: 'var(--clr-green)' }}>
                  -{fmt(item.grant.totalGrant)}
                </td>
              ))}
            </tr>

            {/* Effective price */}
            <tr>
              <td>Effective Price</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-eff`} className="font-mono" style={{ fontWeight: 600 }}>
                  {fmt(item.effectivePrice)}
                </td>
              ))}
            </tr>

            {/* Loan */}
            <tr>
              <td>HDB Loan Amount</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-loan`} className="font-mono">
                  {fmt(item.loan.maxLoanAmount)}
                </td>
              ))}
            </tr>

            {/* Monthly instalment */}
            <tr>
              <td>Monthly Instalment</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-mth`} className="font-mono">
                  {fmt(item.loan.monthlyInstalment)}/mth
                </td>
              ))}
            </tr>

            {/* MSR */}
            <tr>
              <td>MSR Usage</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-msr`}>
                  <span style={{ color: item.loan.msrUsed > 0.30 ? 'var(--clr-red)' : item.loan.msrUsed > 0.25 ? 'var(--clr-yellow)' : 'var(--clr-green)' }}>
                    {pct(item.loan.msrUsed)}
                  </span>
                </td>
              ))}
            </tr>

            {/* Milestones header */}
            <tr>
              <td colSpan={items.length + 1} style={{ background: '#f8fafc', fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Milestone Cash Flow
              </td>
            </tr>
            {items[0].milestones.map((_, mi) => (
              <tr key={`milestone-${mi}`}>
                <td>{items[0].milestones[mi].stage}</td>
                {items.map((item) => (
                  <td key={`${item.project.id}-${item.selectedFlatType}-m${mi}`} className="font-mono" style={{ fontSize: '0.82rem' }}>
                    <div>{fmt(item.milestones[mi].amountDue)}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--clr-text-muted)' }}>
                      CPF: {fmt(item.milestones[mi].cpfUsable)} / Cash: {fmt(item.milestones[mi].cashRequired)}
                    </div>
                  </td>
                ))}
              </tr>
            ))}

            {/* Totals */}
            <tr>
              <td style={{ fontWeight: 600 }}>Total Cash Needed</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-cash`} className="font-mono" style={{ fontWeight: 600 }}>
                  {fmt(item.totalCashNeeded)}
                </td>
              ))}
            </tr>
            <tr>
              <td style={{ fontWeight: 600 }}>Total CPF Needed</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-cpf`} className="font-mono" style={{ fontWeight: 600 }}>
                  {fmt(item.totalCpfNeeded)}
                </td>
              ))}
            </tr>

            {/* Clawback */}
            <tr>
              <td>Clawback (if resold after MOP)</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-claw`} className="font-mono" style={{ color: item.clawbackEstimate > 0 ? 'var(--clr-red)' : undefined }}>
                  {item.clawbackEstimate > 0 ? fmt(item.clawbackEstimate) : 'N/A'}
                </td>
              ))}
            </tr>

            {/* Completion */}
            <tr>
              <td>Est. Completion</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-comp`}>
                  {item.project.estimatedCompletion}
                </td>
              ))}
            </tr>

            {/* Wait time */}
            <tr>
              <td>Launch Date</td>
              {items.map((item) => (
                <td key={`${item.project.id}-${item.selectedFlatType}-launch`}>
                  {item.project.launchDate}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
