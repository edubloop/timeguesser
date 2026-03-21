export type ExperimentCategory = 'visual' | 'interaction' | 'data' | 'qa';

export type ExperimentFlagId =
  | 'visual.scoreRevealV2'
  | 'interaction.photoOpenV2'
  | 'visual.mapTransitionV2'
  | 'qa.perfOverlay';

export interface ExperimentDefinition {
  id: ExperimentFlagId;
  category: ExperimentCategory;
  title: string;
  description: string;
  defaultEnabled: boolean;
  risk: 'low' | 'medium' | 'high';
  reviewBy: string;
}

export const EXPERIMENT_DEFINITIONS: readonly ExperimentDefinition[] = [
  {
    id: 'visual.scoreRevealV2',
    category: 'visual',
    title: 'Score Reveal v2',
    description: 'Enhanced score reveal choreography and pacing.',
    defaultEnabled: false,
    risk: 'medium',
    reviewBy: '2026-04-30',
  },
  {
    id: 'interaction.photoOpenV2',
    category: 'interaction',
    title: 'Photo Open v2',
    description: 'Alternative photo open interaction behavior.',
    defaultEnabled: false,
    risk: 'medium',
    reviewBy: '2026-04-30',
  },
  {
    id: 'visual.mapTransitionV2',
    category: 'visual',
    title: 'Map Transition v2',
    description: 'Experimental map transition timing and motion.',
    defaultEnabled: false,
    risk: 'medium',
    reviewBy: '2026-04-30',
  },
  {
    id: 'qa.perfOverlay',
    category: 'qa',
    title: 'Perf Overlay',
    description: 'Show experimental runtime perf diagnostics.',
    defaultEnabled: false,
    risk: 'low',
    reviewBy: '2026-04-30',
  },
];

export type ExperimentFlagsState = Record<ExperimentFlagId, boolean>;

export const EXPERIMENT_CATEGORY_LABELS: Record<ExperimentCategory, string> = {
  visual: 'Visual',
  interaction: 'Interaction',
  data: 'Data',
  qa: 'QA',
};

export function buildDefaultExperimentFlags(): ExperimentFlagsState {
  return EXPERIMENT_DEFINITIONS.reduce((acc, definition) => {
    acc[definition.id] = definition.defaultEnabled;
    return acc;
  }, {} as ExperimentFlagsState);
}

export const DEFAULT_EXPERIMENT_FLAGS = buildDefaultExperimentFlags();

export function normalizeExperimentFlags(value: unknown): ExperimentFlagsState {
  const base = buildDefaultExperimentFlags();
  if (!value || typeof value !== 'object') return base;
  const raw = value as Partial<Record<ExperimentFlagId, unknown>>;

  for (const definition of EXPERIMENT_DEFINITIONS) {
    const candidate = raw[definition.id];
    if (typeof candidate === 'boolean') {
      base[definition.id] = candidate;
    }
  }

  return base;
}
