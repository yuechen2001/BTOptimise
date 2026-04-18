import { useNavigate } from '@tanstack/react-router';
import { useAppState } from '../../context/AppContext';
import type { ProjectTimelineRequest } from '../../types';

interface ProjectSelectorProps {
    onProjectsChange?: () => void; // Callback to trigger timeline refetch
}

export default function ProjectSelector({ onProjectsChange }: ProjectSelectorProps) {
    const { state, dispatch } = useAppState();
    const navigate = useNavigate();
    const selectedProjects = state.timeline;

    const handleRemoveProject = (projectId: string) => {
        // Find the corresponding result in comparison array and toggle it
        const result = state.comparison.find((r) => r.project.projectCode === projectId);
        if (result) {
            dispatch({ type: 'TOGGLE_COMPARISON', result });
            onProjectsChange?.();
        }
    };

    const handleAddProject = () => {
        // TODO: Open modal to select from Dashboard projects
        alert(
            'Project selection modal coming in Phase 6! For now, projects are selected from the Dashboard.'
        );
    };

    return (
        <div
            style={{
                padding: '1rem',
                background: 'var(--clr-bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--clr-border)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                }}
            >
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    📋 Selected Projects ({selectedProjects.length}/3)
                </h3>
                {selectedProjects.length < 3 && (
                    <button
                        onClick={handleAddProject}
                        style={{
                            padding: '0.4rem 0.75rem',
                            background: 'var(--clr-accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'opacity 200ms ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    >
                        + Add Project
                    </button>
                )}
            </div>

            {/* Empty State */}
            {selectedProjects.length === 0 && (
                <div
                    style={{
                        padding: '1.5rem 1rem',
                        textAlign: 'center',
                        color: 'var(--clr-text-muted)',
                        border: '2px dashed var(--clr-border)',
                        borderRadius: '6px',
                    }}
                >
                    <p style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>🏠</p>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                        No projects selected
                    </p>
                    <p style={{ fontSize: '0.8rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                        Select projects from the Dashboard to compare timelines
                    </p>
                    <button
                        className="btn btn--primary btn--small"
                        onClick={() => navigate({ to: '/dashboard' })}
                        style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                    >
                        📋 Go to Dashboard
                    </button>
                </div>
            )}

            {/* Selected Projects List */}
            {selectedProjects.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selectedProjects.map((project) => (
                        <ProjectCard
                            key={project.projectId}
                            project={project}
                            onRemove={() => handleRemoveProject(project.projectId)}
                        />
                    ))}{' '}
                </div>
            )}
        </div>
    );
}

interface ProjectCardProps {
    project: ProjectTimelineRequest;
    onRemove: () => void;
}

function ProjectCard({ project, onRemove }: ProjectCardProps) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'var(--clr-bg-primary)',
                border: '1px solid var(--clr-border)',
                borderRadius: '6px',
                transition: 'box-shadow 200ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
        >
            {/* Project Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem',
                        flexWrap: 'wrap',
                    }}
                >
                    <h4
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            margin: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {project.projectName}
                    </h4>
                    <span
                        style={{
                            padding: '0.125rem 0.4rem',
                            background: getClassificationColor(project.classification),
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            flexShrink: 0,
                        }}
                    >
                        {project.classification}
                    </span>
                </div>
                <div
                    style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', lineHeight: 1.4 }}
                >
                    {project.flatType}
                </div>
            </div>

            {/* Remove Button */}
            <button
                onClick={onRemove}
                style={{
                    flexShrink: 0,
                    padding: '0.4rem',
                    background: 'transparent',
                    border: '1px solid var(--clr-border)',
                    borderRadius: '4px',
                    color: 'var(--clr-text-muted)',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 200ms ease',
                    lineHeight: 1,
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--clr-red)';
                    e.currentTarget.style.borderColor = 'var(--clr-red)';
                    e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--clr-border)';
                    e.currentTarget.style.color = 'var(--clr-text-muted)';
                }}
                title={`Remove ${project.projectName}`}
                aria-label={`Remove ${project.projectName}`}
            >
                ✕
            </button>
        </div>
    );
}

function getClassificationColor(classification?: string): string {
    switch (classification) {
        case 'Prime':
            return '#8B5CF6';
        case 'Plus':
            return '#3B82F6';
        case 'Standard':
            return '#10B981';
        default:
            return '#6B7280';
    }
}
