import { useState, useCallback } from 'react';
import type { ScoredCandidate } from './types';
import type { Annotation, AnnotationTag, Verdict } from './annotations';
import { ANNOTATION_TAGS, TAG_LABELS } from './annotations';

const PROVIDER_COLORS: Record<string, string> = {
  wikimedia: '#069',
  loc: '#b44',
  europeana: '#5a3',
};

const PROVIDER_LABELS: Record<string, string> = {
  wikimedia: 'Wiki',
  loc: 'LOC',
  europeana: 'Euro',
};

function scoreBadgeColor(score: number): string {
  if (score >= 55) return '#2a7';
  if (score >= 35) return '#c90';
  return '#c33';
}

function annotationKey(item: ScoredCandidate): string {
  return `${item.candidate.provider}:${item.candidate.providerImageId}`;
}

interface Props {
  item: ScoredCandidate;
  annotation?: Annotation;
  onAnnotate: (key: string, annotation: Annotation) => void;
  onClearAnnotation: (key: string) => void;
}

export function CandidateCard({ item, annotation, onAnnotate, onClearAnnotation }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [note, setNote] = useState(annotation?.note ?? '');
  const [selectedTags, setSelectedTags] = useState<Set<AnnotationTag>>(
    new Set(annotation?.tags ?? [])
  );
  const { candidate: c, unifiedScore: u } = item;
  const key = annotationKey(item);

  const saveAnnotation = useCallback(
    (verdict: Verdict) => {
      const ann: Annotation = {
        key,
        verdict,
        tags: [...selectedTags],
        note,
        pipelineScore: u?.overall ?? 0,
        pipelinePass: u?.pass ?? false,
        pipelineHardFail: u?.hardFail ?? false,
        provider: c.provider,
        year: c.year,
        title: c.title,
        timestamp: Date.now(),
      };
      onAnnotate(key, ann);
    },
    [key, selectedTags, note, u, c, onAnnotate]
  );

  const toggleTag = (tag: AnnotationTag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  const hasScore = u != null;
  const verdictBorder = annotation
    ? annotation.verdict === 'accept'
      ? '#2a7'
      : '#c33'
    : hasScore
      ? u.hardFail
        ? '#c33'
        : u.pass
          ? '#2a7'
          : '#c90'
      : '#444';

  return (
    <div
      style={{
        border: `2px solid ${verdictBorder}`,
        borderRadius: 8,
        overflow: 'hidden',
        background: '#1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      {/* Human verdict indicator */}
      {annotation && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            background: annotation.verdict === 'accept' ? '#2a7' : '#c33',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            textAlign: 'center',
            padding: '2px 0',
            letterSpacing: 0.5,
          }}
        >
          {annotation.verdict === 'accept' ? 'HUMAN: ACCEPT' : 'HUMAN: REJECT'}
        </div>
      )}

      {/* Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/10',
          background: '#111',
          overflow: 'hidden',
          marginTop: annotation ? 20 : 0,
        }}
      >
        {!imgError ? (
          <img
            src={c.thumbnailUri ?? c.imageUri}
            alt={c.title}
            loading="lazy"
            onError={() => setImgError(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
            }}
          >
            Image unavailable
          </div>
        )}
        {/* Provider badge */}
        <span
          style={{
            position: 'absolute',
            top: 6,
            left: 6,
            background: PROVIDER_COLORS[c.provider] ?? '#666',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: 4,
          }}
        >
          {PROVIDER_LABELS[c.provider] ?? c.provider}
        </span>
        {/* Unified score badge */}
        {hasScore && !u.hardFail && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              background: scoreBadgeColor(u.overall),
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 4,
              minWidth: 28,
              textAlign: 'center',
            }}
          >
            {u.overall}
          </span>
        )}
        {/* Status badge */}
        {hasScore && (
          <span
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: u.hardFail ? '#c33' : u.pass ? '#2a7' : '#c90',
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            {u.hardFail ? 'HARD FAIL' : u.pass ? 'PASS' : 'FAIL'}
          </span>
        )}
        {!hasScore && (
          <span
            style={{
              position: 'absolute',
              bottom: 6,
              right: 6,
              background: '#555',
              color: '#ccc',
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 3,
            }}
          >
            NOT SCORED
          </span>
        )}
      </div>

      {/* Metadata */}
      <div style={{ padding: '8px 10px', fontSize: 12, lineHeight: 1.4 }}>
        <div
          style={{
            fontWeight: 600,
            color: '#eee',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {c.title}
        </div>
        <div style={{ color: '#aaa', marginBottom: 4 }}>
          <span style={{ marginRight: 12 }}>
            Year: <b>{c.year}</b> ({c.yearSource}, {c.yearConfidence})
          </span>
          <span>
            Loc: {c.location.lat.toFixed(2)}, {c.location.lng.toFixed(2)} ({c.locationConfidence})
          </span>
        </div>

        {/* Score breakdown pills */}
        {hasScore && !u.hardFail && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            <span style={pill('#27a')}>V:{u.visionScore}</span>
            <span style={pill(u.metadataScore >= 0 ? '#a07' : '#555')}>
              LLM:{u.metadataScore >= 0 ? u.metadataScore : '—'}
            </span>
          </div>
        )}

        {/* Hard fail reasons */}
        {hasScore && u.hardFailReasons.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            {u.hardFailReasons.map((r, i) => (
              <span key={i} style={pill('#c33')}>
                {r}
              </span>
            ))}
          </div>
        )}

        {/* Warnings */}
        {hasScore && u.warnings.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            {u.warnings.map((w, i) => (
              <span key={i} style={pill('#996')}>
                {w}
              </span>
            ))}
          </div>
        )}

        {/* LLM reasoning */}
        {hasScore && u.llmReasoning && u.metadataScore >= 0 && (
          <div style={{ fontSize: 11, color: '#b9a', fontStyle: 'italic', marginBottom: 4 }}>
            &ldquo;{u.llmReasoning}&rdquo;
          </div>
        )}

        {/* Annotation tags (if annotated) */}
        {annotation && annotation.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
            {annotation.tags.map((t) => (
              <span key={t} style={pill('#558')}>
                {TAG_LABELS[t]}
              </span>
            ))}
          </div>
        )}
        {annotation?.note && (
          <div style={{ fontSize: 11, color: '#9af', fontStyle: 'italic', marginBottom: 4 }}>
            &ldquo;{annotation.note}&rdquo;
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          <button
            onClick={() => setShowAnnotation(!showAnnotation)}
            style={{
              background: 'none',
              border: '1px solid #555',
              color: '#aaa',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {showAnnotation ? 'Close' : annotation ? 'Edit rating' : 'Rate'}
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: '1px solid #555',
              color: '#aaa',
              fontSize: 11,
              padding: '2px 8px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {expanded ? 'Hide details' : 'Details'}
          </button>
          {annotation && (
            <button
              onClick={() => onClearAnnotation(key)}
              style={{
                background: 'none',
                border: '1px solid #533',
                color: '#a66',
                fontSize: 11,
                padding: '2px 8px',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Annotation panel */}
        {showAnnotation && (
          <div
            style={{
              marginTop: 8,
              padding: 10,
              background: '#222',
              borderRadius: 6,
              border: '1px solid #444',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: '#ccc', marginBottom: 6 }}>
              Tags
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
              {ANNOTATION_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 3,
                    cursor: 'pointer',
                    border: 'none',
                    fontWeight: 600,
                    background: selectedTags.has(tag) ? '#558' : '#333',
                    color: selectedTags.has(tag) ? '#cdf' : '#888',
                  }}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, fontWeight: 600, color: '#ccc', marginBottom: 4 }}>
              Note (optional)
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why accept or reject?"
              style={{
                width: '100%',
                background: '#333',
                color: '#ddd',
                border: '1px solid #555',
                borderRadius: 4,
                padding: '4px 8px',
                fontSize: 11,
                marginBottom: 8,
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  saveAnnotation('accept');
                  setShowAnnotation(false);
                }}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#2a7',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Accept
              </button>
              <button
                onClick={() => {
                  saveAnnotation('reject');
                  setShowAnnotation(false);
                }}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  borderRadius: 4,
                  border: 'none',
                  cursor: 'pointer',
                  background: '#c33',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Reject
              </button>
            </div>
          </div>
        )}

        {expanded && (
          <div style={{ marginTop: 8, fontSize: 11, color: '#888', overflowWrap: 'break-word' }}>
            {/* Vision sub-scores */}
            {hasScore && !u.hardFail && (
              <div style={{ marginBottom: 8, padding: 8, background: '#1a1a2e', borderRadius: 4 }}>
                <div style={{ fontWeight: 600, color: '#9af', marginBottom: 4 }}>Vision (CLIP)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px' }}>
                  <span>
                    Street scene: <b>{(u.visionDetail.streetScene * 100).toFixed(1)}%</b>
                  </span>
                  <span>
                    Era clues: <b>{(u.visionDetail.eraClues * 100).toFixed(1)}%</b>
                  </span>
                  <span>
                    Outdoor: <b>{(u.visionDetail.outdoor * 100).toFixed(1)}%</b>
                  </span>
                  <span>
                    Quality: <b>{(u.visionDetail.quality * 100).toFixed(1)}%</b>
                  </span>
                  <span>
                    Artwork:{' '}
                    <b style={{ color: u.visionDetail.isArtwork > 0.15 ? '#d66' : 'inherit' }}>
                      {(u.visionDetail.isArtwork * 100).toFixed(1)}%
                    </b>
                  </span>
                  <span>
                    Vision total: <b style={{ color: '#9af' }}>{u.visionScore}</b>
                  </span>
                </div>
              </div>
            )}
            {/* LLM details */}
            {hasScore && u.metadataScore >= 0 && (
              <div style={{ marginBottom: 8, padding: 8, background: '#2a1a2e', borderRadius: 4 }}>
                <div style={{ fontWeight: 600, color: '#b9a', marginBottom: 4 }}>
                  Metadata (LLM)
                </div>
                <div>
                  Score: <b>{u.metadataScore}</b>
                </div>
                <div style={{ fontStyle: 'italic', marginTop: 2 }}>{u.llmReasoning}</div>
              </div>
            )}
            {c.description && (
              <div style={{ marginBottom: 4 }}>
                <b>Description:</b> {c.description}
              </div>
            )}
            {c.tags && c.tags.length > 0 && (
              <div style={{ marginBottom: 4 }}>
                <b>Tags:</b> {c.tags.join(', ')}
              </div>
            )}
            <div style={{ marginBottom: 4 }}>
              <b>License:</b> {c.license}
            </div>
            {c.author && (
              <div style={{ marginBottom: 4 }}>
                <b>Author:</b> {c.author}
              </div>
            )}
            {c.institutionName && (
              <div style={{ marginBottom: 4 }}>
                <b>Institution:</b> {c.institutionName}
              </div>
            )}
            {c.originalUrl && (
              <div>
                <b>Source:</b>{' '}
                <a href={c.originalUrl} target="_blank" rel="noreferrer" style={{ color: '#69c' }}>
                  {c.originalUrl}
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function pill(bg: string): React.CSSProperties {
  return {
    background: bg,
    color: '#fff',
    fontSize: 10,
    fontWeight: 600,
    padding: '1px 6px',
    borderRadius: 3,
    whiteSpace: 'nowrap',
  };
}
