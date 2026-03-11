import { useMemo, useState } from 'react';
import { projectCatalogue } from '../../data/projects';
import type { FlatTypePreference } from '../../types';

export default function OversubscriptionTable() {
  const [filter, setFilter] = useState<FlatTypePreference | 'all'>('all');

  const rows = useMemo(() => {
    const data: {
      project: string;
      estate: string;
      classification: string;
      flatType: string;
      applicants: number;
      units: number;
      ratio: number;
      launch: string;
    }[] = [];

    for (const p of projectCatalogue) {
      for (const o of p.oversubscription) {
        if (filter !== 'all' && o.flatType !== filter) continue;
        data.push({
          project: p.name,
          estate: p.estate,
          classification: p.classification,
          flatType: o.flatType,
          applicants: o.applicants,
          units: o.units,
          ratio: o.ratio,
          launch: p.launchDate,
        });
      }
    }

    return data.sort((a, b) => b.ratio - a.ratio);
  }, [filter]);

  const ratioColor = (ratio: number) => {
    if (ratio >= 10) return 'var(--clr-red)';
    if (ratio >= 5) return 'var(--clr-yellow)';
    return 'var(--clr-green)';
  };

  return (
    <div>
      <h2 className="section-title">Oversubscription Reference</h2>
      <p className="section-subtitle">
        Historical application-to-unit ratios from recent BTO exercises. Higher ratios indicate stronger competition.
      </p>

      {/* Filter */}
      <div className="form-group" style={{ maxWidth: 300, marginBottom: 'var(--sp-lg)' }}>
        <label>Filter by flat type</label>
        <select
          className="form-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value as FlatTypePreference | 'all')}
        >
          <option value="all">All flat types</option>
          <option value="2-Room Flexi">2-Room Flexi</option>
          <option value="3-Room">3-Room</option>
          <option value="4-Room">4-Room</option>
          <option value="5-Room">5-Room</option>
          <option value="3Gen">3Gen</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Project</th>
              <th>Estate</th>
              <th>Type</th>
              <th>Flat</th>
              <th className="text-right">Applicants</th>
              <th className="text-right">Units</th>
              <th className="text-right">Ratio</th>
              <th>Launch</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 500 }}>{r.project}</td>
                <td>{r.estate}</td>
                <td>
                  <span className={`badge badge--${r.classification.toLowerCase()}`}>
                    {r.classification}
                  </span>
                </td>
                <td>{r.flatType}</td>
                <td className="text-right font-mono">{r.applicants.toLocaleString()}</td>
                <td className="text-right font-mono">{r.units.toLocaleString()}</td>
                <td className="text-right font-mono" style={{ fontWeight: 700, color: ratioColor(r.ratio) }}>
                  {r.ratio.toFixed(1)}x
                </td>
                <td>{r.launch}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
