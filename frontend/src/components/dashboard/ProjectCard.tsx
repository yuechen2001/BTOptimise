import type { AffordabilityResult } from '../../types';
import { useAppState } from '../../context/AppContext';

interface Props {
  result: AffordabilityResult;
}

export default function ProjectCard({ result }: Props) {
  const { state, dispatch } = useAppState();
  const { project, selectedFlatType, indicativePrice, grant, loan, classification, classificationReason } = result;

  const isSelected = state.comparison.some(
    (c) => c.project.id === project.id && c.selectedFlatType === selectedFlatType,
  );
  const canAdd = state.comparison.length < 3;

  const classMap = {
    green: 'card--green',
    yellow: 'card--yellow',
    red: 'card--red',
  };

  const badgeMap = {
    green: 'badge--green',
    yellow: 'badge--yellow',
    red: 'badge--red',
  };

  const classLabel = {
    green: 'Affordable',
    yellow: 'Stretch',
    red: 'Out of Reach',
  };

  const classificationBadge = {
    Standard: 'badge--standard',
    Plus: 'badge--plus',
    Prime: 'badge--prime',
  };

  return (
    <div className={`card ${classMap[classification]}`}>
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 'var(--sp-md)' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.2rem' }}>
            {project.name}
          </h3>
          <div className="flex-gap">
            <span className="text-secondary" style={{ fontSize: '0.82rem' }}>{project.estate}</span>
            <span className={`badge ${classificationBadge[project.classification]}`}>
              {project.classification}
            </span>
          </div>
        </div>
        <span className={`badge ${badgeMap[classification]}`}>
          {classLabel[classification]}
        </span>
      </div>

      {/* Key metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-sm)', marginBottom: 'var(--sp-md)' }}>
        <div>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Flat Type
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{selectedFlatType}</div>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Indicative Price
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }} className="font-mono">
            ${indicativePrice.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Grant
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--clr-green)' }} className="font-mono">
            -${grant.totalGrant.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Monthly Loan
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }} className="font-mono">
            ${loan.monthlyInstalment.toLocaleString()}/mth
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ display: 'flex', gap: 'var(--sp-lg)', fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: 'var(--sp-md)' }}>
        <span>Launch: {project.launchDate}</span>
        <span>Est. Completion: {project.estimatedCompletion}</span>
      </div>

      {/* Reason */}
      <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', marginBottom: 'var(--sp-md)', lineHeight: 1.5 }}>
        {classificationReason}
      </p>

      {/* Compare toggle */}
      <button
        className={`btn btn--small ${isSelected ? 'btn--primary' : 'btn--secondary'}`}
        onClick={() => dispatch({ type: 'TOGGLE_COMPARISON', result })}
        disabled={!isSelected && !canAdd}
      >
        {isSelected ? 'Remove from Comparison' : 'Add to Compare'}
      </button>
    </div>
  );
}
