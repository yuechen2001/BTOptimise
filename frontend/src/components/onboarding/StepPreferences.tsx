import { useAppState } from '../../context/AppContext';
import type { FlatTypePreference, Region } from '../../types';

const FLAT_TYPES: FlatTypePreference[] = ['2-Room Flexi', '3-Room', '4-Room', '5-Room', '3Gen'];

const REGIONS: Region[] = [
  'Ang Mo Kio', 'Bedok', 'Bishan', 'Bukit Batok', 'Bukit Merah',
  'Bukit Panjang', 'Choa Chu Kang', 'Clementi', 'Geylang', 'Hougang',
  'Jurong East', 'Jurong West', 'Kallang/Whampoa', 'Marine Parade',
  'Pasir Ris', 'Punggol', 'Queenstown', 'Sembawang', 'Sengkang',
  'Serangoon', 'Tampines', 'Tengah', 'Toa Payoh', 'Woodlands', 'Yishun',
];

export default function StepPreferences() {
  const { state, dispatch } = useAppState();
  const p = state.onboarding.profile;

  const selectedFlatTypes = p.preferredFlatTypes ?? [];
  const selectedRegions = p.preferredRegions ?? [];

  function toggleFlatType(ft: FlatTypePreference) {
    const next = selectedFlatTypes.includes(ft)
      ? selectedFlatTypes.filter((x) => x !== ft)
      : [...selectedFlatTypes, ft];
    dispatch({ type: 'UPDATE_PROFILE', payload: { preferredFlatTypes: next } });
  }

  function toggleRegion(r: Region) {
    const next = selectedRegions.includes(r)
      ? selectedRegions.filter((x) => x !== r)
      : [...selectedRegions, r];
    dispatch({ type: 'UPDATE_PROFILE', payload: { preferredRegions: next } });
  }

  return (
    <div>
      <h2 className="section-title">Your Preferences</h2>
      <p className="section-subtitle">
        Select your preferred flat types and estates. Leave blank to see all available options.
      </p>

      {/* Flat types */}
      <div className="form-group">
        <label>Preferred flat types</label>
        <span className="hint">Select one or more, or leave empty for all</span>
        <div className="check-group">
          {FLAT_TYPES.map((ft) => (
            <label
              key={ft}
              className={`check-chip ${selectedFlatTypes.includes(ft) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedFlatTypes.includes(ft)}
                onChange={() => toggleFlatType(ft)}
              />
              {ft}
            </label>
          ))}
        </div>
      </div>

      {/* Regions */}
      <div className="form-group">
        <label>Preferred estates / towns</label>
        <span className="hint">Select one or more, or leave empty for all</span>
        <div className="check-group">
          {REGIONS.map((r) => (
            <label
              key={r}
              className={`check-chip ${selectedRegions.includes(r) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedRegions.includes(r)}
                onChange={() => toggleRegion(r)}
              />
              {r}
            </label>
          ))}
        </div>
      </div>

      {/* Optional budget cap */}
      <div className="form-group">
        <label>Maximum budget (optional)</label>
        <span className="hint">Hard ceiling in SGD — leave blank for no limit</span>
        <input
          className="form-input"
          type="number"
          min={0}
          step={10000}
          placeholder="e.g. 500000"
          value={p.maxBudget ?? ''}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_PROFILE',
              payload: { maxBudget: e.target.value ? Number(e.target.value) : undefined },
            })
          }
        />
      </div>
    </div>
  );
}
