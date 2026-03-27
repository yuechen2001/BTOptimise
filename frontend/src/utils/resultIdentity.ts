import type { ProjectAffordabilityResult } from '../types';

export function getFlatVariantLabel(result: ProjectAffordabilityResult): string {
    const { selectedFlat } = result;
    const area = selectedFlat.estimatedFloorArea ?? selectedFlat.estimatedInternalFloorArea;

    return area != null ? `${selectedFlat.type} (${area} sqm)` : selectedFlat.type;
}

export function getResultIdentity(result: ProjectAffordabilityResult): string {
    const { project, selectedFlat } = result;

    return [
        project.projectCode,
        selectedFlat.type,
        selectedFlat.estimatedFloorArea ?? 'na',
        selectedFlat.estimatedInternalFloorArea ?? 'na',
    ].join('::');
}
