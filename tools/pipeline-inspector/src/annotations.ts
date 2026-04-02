export type Verdict = 'accept' | 'reject';

export const ANNOTATION_TAGS = [
  'not_guessable',
  'too_zoomed',
  'indoor_scene',
  'low_quality',
  'not_a_photo',
  'duplicate_feel',
  'wrong_era_feel',
  'good_era_clues',
  'distinctive_location',
  'good_street_scene',
  'interesting_subject',
] as const;

export type AnnotationTag = (typeof ANNOTATION_TAGS)[number];

export interface Annotation {
  key: string; // provider:providerImageId
  verdict: Verdict;
  tags: AnnotationTag[];
  note: string;
  pipelineScore: number;
  pipelinePass: boolean;
  pipelineHardFail: boolean;
  provider: string;
  year: number;
  title: string;
  timestamp: number;
}

export type AnnotationMap = Record<string, Annotation>;

export const TAG_LABELS: Record<AnnotationTag, string> = {
  not_guessable: 'Not guessable',
  too_zoomed: 'Too zoomed / cropped',
  indoor_scene: 'Indoor scene',
  low_quality: 'Low quality image',
  not_a_photo: 'Not a photograph',
  duplicate_feel: 'Feels like a duplicate',
  wrong_era_feel: 'Era feels wrong',
  good_era_clues: 'Good era clues',
  distinctive_location: 'Distinctive location',
  good_street_scene: 'Good street scene',
  interesting_subject: 'Interesting subject',
};
