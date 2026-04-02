import { useState, useEffect, useCallback } from 'react';
import type { FetchResponse, ScoredCandidate, UnifiedScore } from './types.ts';
import type { Annotation, AnnotationMap, AnnotationTag } from './annotations.ts';
import { TAG_LABELS } from './annotations.ts';
import { CandidateCard } from './CandidateCard.tsx';

type ShowFilter = 'all' | 'pass' | 'fail' | 'hard_fail' | 'not_scored';
type Tab = 'inspect' | 'analysis';

interface Meta {
  wikimedia: { categoryCount: number; categoryLabels: string[] };
  loc: { queryCount: number; queryLabels: string[] };
  europeana: { queryCount: number; queryLabels: string[]; hasApiKey: boolean };
  llmConfigured: boolean;
  passThreshold: number;
}

export function App() {
  const [tab, setTab] = useState<Tab>('inspect');
  const [provider, setProvider] = useState<'wikimedia' | 'loc' | 'europeana'>('wikimedia');
  const [queryIndex, setQueryIndex] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState<ShowFilter>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<FetchResponse | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationMap>({});
  const [scoring, setScoring] = useState(false);
  const [scoreProgress, setScoreProgress] = useState({ completed: 0, total: 0, status: '' });

  // Load meta + annotations on mount
  useEffect(() => {
    fetch('/api/meta')
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => {});
    fetch('/api/annotations')
      .then((r) => r.json())
      .then(setAnnotations)
      .catch(() => {});
  }, []);

  const doFetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        provider,
        queryIndex: String(queryIndex),
        page: String(page),
        limit: '25',
      });
      const res = await fetch(`/api/fetch?${params}`);
      const data: FetchResponse = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [provider, queryIndex, page]);

  const scoreAll = useCallback(async () => {
    if (!results || results.candidates.length === 0) return;
    setScoring(true);
    setScoreProgress({ completed: 0, total: results.candidates.length, status: 'Starting...' });

    const candidates = results.candidates.map((s) => ({
      key: `${s.candidate.provider}:${s.candidate.providerImageId}`,
      imageUrl: s.candidate.thumbnailUri ?? s.candidate.imageUri,
      candidate: s.candidate,
    }));

    try {
      setScoreProgress({
        completed: 0,
        total: candidates.length,
        status: 'Scoring... (CLIP + LLM in parallel)',
      });

      const response = await fetch('/api/score-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidates }),
      });

      const data = await response.json();

      setResults((prev) => {
        if (!prev) return prev;
        const updated = prev.candidates.map((s) => {
          const key = `${s.candidate.provider}:${s.candidate.providerImageId}`;
          const score = data.results[key];
          if (score && !score.error) {
            return { ...s, unifiedScore: score as UnifiedScore };
          }
          return s;
        });
        updated.sort((a, b) => {
          const sa = a.unifiedScore?.overall ?? -1;
          const sb = b.unifiedScore?.overall ?? -1;
          return sb - sa;
        });
        const hardFailed = updated.filter((s) => s.unifiedScore?.hardFail).length;
        return { ...prev, candidates: updated, stats: { ...prev.stats, hardFailed } };
      });
    } catch (err) {
      console.error('Scoring failed:', err);
    } finally {
      setScoring(false);
    }
  }, [results]);

  const handleAnnotate = useCallback(async (key: string, annotation: Annotation) => {
    setAnnotations((prev) => ({ ...prev, [key]: annotation }));
    await fetch(`/api/annotations/${encodeURIComponent(key)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(annotation),
    });
  }, []);

  const handleClearAnnotation = useCallback(async (key: string) => {
    setAnnotations((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    await fetch(`/api/annotations/${encodeURIComponent(key)}`, { method: 'DELETE' });
  }, []);

  const filteredCandidates: ScoredCandidate[] = results
    ? results.candidates.filter((s) => {
        if (showFilter === 'pass') return s.unifiedScore?.pass;
        if (showFilter === 'fail')
          return s.unifiedScore && !s.unifiedScore.pass && !s.unifiedScore.hardFail;
        if (showFilter === 'hard_fail') return s.unifiedScore?.hardFail;
        if (showFilter === 'not_scored') return !s.unifiedScore;
        return true;
      })
    : [];

  const annotationCount = Object.keys(annotations).length;
  const scoredCount = results?.candidates.filter((s) => s.unifiedScore).length ?? 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111',
        color: '#ddd',
        fontFamily: '-apple-system, system-ui, sans-serif',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: '#1a1a1a',
          borderBottom: '1px solid #333',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
          Pipeline Inspector
        </h1>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 2, background: '#222', borderRadius: 6, padding: 2 }}>
          <button
            onClick={() => setTab('inspect')}
            style={{
              padding: '4px 14px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: tab === 'inspect' ? '#069' : 'transparent',
              color: '#fff',
            }}
          >
            Inspect
          </button>
          <button
            onClick={() => setTab('analysis')}
            style={{
              padding: '4px 14px',
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              background: tab === 'analysis' ? '#069' : 'transparent',
              color: '#fff',
            }}
          >
            Analysis{annotationCount > 0 && ` (${annotationCount})`}
          </button>
        </div>

        {tab === 'inspect' && (
          <>
            {/* Provider */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['wikimedia', 'loc', 'europeana'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setProvider(p);
                    setQueryIndex(0);
                    setPage(1);
                  }}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 4,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    background: provider === p ? '#069' : '#333',
                    color: '#fff',
                  }}
                >
                  {p === 'wikimedia' ? 'Wiki' : p === 'loc' ? 'LOC' : 'Euro'}
                  {p === 'europeana' && meta && !meta.europeana.hasApiKey && ' (no key)'}
                </button>
              ))}
            </div>

            {/* Query selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <label>{provider === 'wikimedia' ? 'Category:' : 'Query:'}</label>
              <select
                value={queryIndex}
                onChange={(e) => {
                  setQueryIndex(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                style={{
                  background: '#333',
                  color: '#fff',
                  border: '1px solid #555',
                  borderRadius: 4,
                  padding: '3px 6px',
                  fontSize: 12,
                  maxWidth: 280,
                }}
              >
                {queryLabelsForProvider(provider, meta).map((label, i) => (
                  <option key={i} value={i}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Batch nav */}
            {provider !== 'wikimedia' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <label>Batch:</label>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{ ...pageBtnStyle, opacity: page <= 1 ? 0.4 : 1 }}
                >
                  &laquo;
                </button>
                <span style={{ minWidth: 18, textAlign: 'center' }}>{page}</span>
                <button onClick={() => setPage((p) => p + 1)} style={pageBtnStyle}>
                  &raquo;
                </button>
              </div>
            )}

            <button
              onClick={doFetch}
              disabled={loading}
              style={{
                padding: '6px 20px',
                borderRadius: 6,
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                background: '#069',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {loading ? 'Fetching...' : 'Fetch'}
            </button>

            {results && results.candidates.length > 0 && (
              <button
                onClick={scoreAll}
                disabled={scoring}
                style={{
                  padding: '6px 20px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: scoring ? 'wait' : 'pointer',
                  background: '#27a',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {scoring
                  ? `Scoring ${scoreProgress.completed}/${scoreProgress.total}`
                  : `Score All (${results.candidates.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Scoring progress bar */}
      {scoring && (
        <div
          style={{
            background: '#1a1a2e',
            padding: '6px 20px',
            fontSize: 12,
            color: '#9af',
            borderBottom: '1px solid #333',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{ flex: 1, height: 4, background: '#222', borderRadius: 2, overflow: 'hidden' }}
          >
            <div
              style={{
                width: `${scoreProgress.total > 0 ? (scoreProgress.completed / scoreProgress.total) * 100 : 0}%`,
                height: '100%',
                background: '#27a',
                borderRadius: 2,
                transition: 'width 0.3s',
              }}
            />
          </div>
          <span>{scoreProgress.status}</span>
        </div>
      )}

      {/* LLM warning */}
      {meta && !meta.llmConfigured && (
        <div
          style={{
            background: '#2a2000',
            padding: '6px 20px',
            fontSize: 11,
            color: '#da6',
            borderBottom: '1px solid #333',
          }}
        >
          LLM not configured — set OPENCODE_API_KEY in .env.local to enable metadata scoring via Big
          Pickle. Vision-only scoring will be used.
        </div>
      )}

      {tab === 'inspect' ? (
        <div style={{ display: 'flex', gap: 0 }}>
          {/* Sidebar */}
          <div
            style={{
              width: 220,
              minWidth: 220,
              padding: '16px 14px',
              borderRight: '1px solid #333',
              fontSize: 12,
            }}
          >
            <h3 style={{ fontSize: 13, marginTop: 0, marginBottom: 10 }}>Show</h3>
            {(['all', 'pass', 'fail', 'hard_fail', 'not_scored'] as const).map((f) => (
              <label
                key={f}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="showFilter"
                  checked={showFilter === f}
                  onChange={() => setShowFilter(f)}
                />
                <span style={{ fontSize: 11 }}>
                  {f === 'all'
                    ? 'All'
                    : f === 'pass'
                      ? 'Pass'
                      : f === 'fail'
                        ? 'Fail'
                        : f === 'hard_fail'
                          ? 'Hard fail'
                          : 'Not scored'}
                </span>
              </label>
            ))}

            {/* Stats */}
            {results && (
              <div style={{ marginTop: 16, padding: '10px', background: '#222', borderRadius: 6 }}>
                <h3 style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}>Stats</h3>
                <div style={{ marginBottom: 3 }}>
                  Fetched: <b>{results.stats.total}</b>
                </div>
                <div style={{ marginBottom: 3, color: '#9af' }}>
                  Scored: <b>{scoredCount}</b>
                </div>
                {scoredCount > 0 && (
                  <>
                    <div style={{ marginBottom: 3, color: '#2a7' }}>
                      Passed: <b>{results.candidates.filter((s) => s.unifiedScore?.pass).length}</b>
                    </div>
                    <div style={{ marginBottom: 3, color: '#c90' }}>
                      Failed:{' '}
                      <b>
                        {
                          results.candidates.filter(
                            (s) =>
                              s.unifiedScore && !s.unifiedScore.pass && !s.unifiedScore.hardFail
                          ).length
                        }
                      </b>
                    </div>
                    <div style={{ marginBottom: 3, color: '#c33' }}>
                      Hard fail: <b>{results.stats.hardFailed}</b>
                    </div>
                  </>
                )}
                {Object.keys(results.rejectedAtExtraction).length > 0 && (
                  <>
                    <h4 style={{ fontSize: 11, marginTop: 10, marginBottom: 4, color: '#888' }}>
                      Rejected at extraction
                    </h4>
                    {Object.entries(results.rejectedAtExtraction).map(([reason, count]) => (
                      <div key={reason} style={{ fontSize: 11, color: '#999', marginBottom: 2 }}>
                        {reason}: {count}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Scoring info */}
            <div style={{ marginTop: 16, padding: '10px', background: '#222', borderRadius: 6 }}>
              <h3 style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}>Scoring</h3>
              <div style={{ marginBottom: 3, fontSize: 11 }}>
                CLIP Vision: <b style={{ color: '#27a' }}>55%</b>
              </div>
              <div style={{ marginBottom: 3, fontSize: 11 }}>
                LLM Metadata:{' '}
                <b style={{ color: meta?.llmConfigured ? '#a07' : '#555' }}>
                  {meta?.llmConfigured ? '45%' : 'OFF'}
                </b>
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                Pass threshold: <b>{meta?.passThreshold ?? 55}</b>
              </div>
            </div>

            {/* Annotation count */}
            <div style={{ marginTop: 16, padding: '10px', background: '#222', borderRadius: 6 }}>
              <h3 style={{ fontSize: 13, marginTop: 0, marginBottom: 8 }}>Annotations</h3>
              <div style={{ marginBottom: 3 }}>
                Rated: <b>{annotationCount}</b>
              </div>
              <div style={{ marginBottom: 3, color: '#2a7' }}>
                Accepted:{' '}
                <b>{Object.values(annotations).filter((a) => a.verdict === 'accept').length}</b>
              </div>
              <div style={{ color: '#c33' }}>
                Rejected:{' '}
                <b>{Object.values(annotations).filter((a) => a.verdict === 'reject').length}</b>
              </div>
            </div>
          </div>

          {/* Main grid */}
          <div style={{ flex: 1, padding: 16 }}>
            {!results && !loading && (
              <div style={{ textAlign: 'center', color: '#666', marginTop: 60 }}>
                Select a provider and click <b>Fetch</b> to load candidates, then <b>Score All</b>{' '}
                to run unified scoring.
              </div>
            )}
            {results && filteredCandidates.length === 0 && (
              <div style={{ textAlign: 'center', color: '#666', marginTop: 60 }}>
                No candidates match the current filter.
              </div>
            )}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: 12,
              }}
            >
              {filteredCandidates.map((item, i) => {
                const key = `${item.candidate.provider}:${item.candidate.providerImageId}`;
                return (
                  <CandidateCard
                    key={`${key}-${i}`}
                    item={item}
                    annotation={annotations[key]}
                    onAnnotate={handleAnnotate}
                    onClearAnnotation={handleClearAnnotation}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <AnalysisView
          annotations={annotations}
          scoredCandidates={results?.candidates.filter((c) => c.unifiedScore != null) ?? []}
        />
      )}
    </div>
  );
}

// ─── Analysis View ───────────────────────────────────────────────────────────

function AnalysisView({
  annotations,
  scoredCandidates,
}: {
  annotations: AnnotationMap;
  scoredCandidates: ScoredCandidate[];
}) {
  const all = Object.values(annotations);
  if (all.length === 0 && scoredCandidates.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#666' }}>
        No data yet. Fetch some images, <b>Score All</b>, and annotate them.
      </div>
    );
  }

  // Annotation-based analysis
  const accepted = all.filter((a) => a.verdict === 'accept');
  const rejected = all.filter((a) => a.verdict === 'reject');

  const truePositive = all.filter((a) => a.pipelinePass && a.verdict === 'accept').length;
  const falsePositive = all.filter((a) => a.pipelinePass && a.verdict === 'reject').length;
  const trueNegative = all.filter((a) => !a.pipelinePass && a.verdict === 'reject').length;
  const falseNegative = all.filter((a) => !a.pipelinePass && a.verdict === 'accept').length;
  const agreement =
    all.length > 0 ? (((truePositive + trueNegative) / all.length) * 100).toFixed(1) : '0';

  const acceptedScores = accepted.map((a) => a.pipelineScore).sort((a, b) => a - b);
  const rejectedScores = rejected.map((a) => a.pipelineScore).sort((a, b) => a - b);
  const avgAccepted =
    acceptedScores.length > 0
      ? (acceptedScores.reduce((s, v) => s + v, 0) / acceptedScores.length).toFixed(1)
      : '-';
  const avgRejected =
    rejectedScores.length > 0
      ? (rejectedScores.reduce((s, v) => s + v, 0) / rejectedScores.length).toFixed(1)
      : '-';

  // Blind spots
  const blindSpotTags: Record<string, number> = {};
  all
    .filter((a) => a.pipelinePass && a.verdict === 'reject')
    .forEach((a) => {
      a.tags.forEach((t) => {
        blindSpotTags[t] = (blindSpotTags[t] ?? 0) + 1;
      });
    });
  const blindSpotSorted = Object.entries(blindSpotTags).sort(([, a], [, b]) => b - a);

  // Missed opportunities
  const missedTags: Record<string, number> = {};
  all
    .filter((a) => !a.pipelinePass && a.verdict === 'accept')
    .forEach((a) => {
      a.tags.forEach((t) => {
        missedTags[t] = (missedTags[t] ?? 0) + 1;
      });
    });
  const missedSorted = Object.entries(missedTags).sort(([, a], [, b]) => b - a);

  // Threshold sweep
  const thresholds = [30, 40, 45, 50, 55, 60, 65, 70];
  const thresholdData = thresholds.map((t) => {
    const wouldPass = all.filter((a) => a.pipelineScore >= t);
    const wouldFail = all.filter((a) => a.pipelineScore < t);
    const tp = wouldPass.filter((a) => a.verdict === 'accept').length;
    const fp = wouldPass.filter((a) => a.verdict === 'reject').length;
    const fn = wouldFail.filter((a) => a.verdict === 'accept').length;
    const precision = tp + fp > 0 ? ((tp / (tp + fp)) * 100).toFixed(0) : '-';
    const recall = tp + fn > 0 ? ((tp / (tp + fn)) * 100).toFixed(0) : '-';
    return { threshold: t, passCount: wouldPass.length, precision, recall };
  });

  // Provider breakdown
  const byProvider: Record<string, { accepted: number; rejected: number }> = {};
  all.forEach((a) => {
    if (!byProvider[a.provider]) byProvider[a.provider] = { accepted: 0, rejected: 0 };
    byProvider[a.provider][a.verdict === 'accept' ? 'accepted' : 'rejected'] += 1;
  });

  return (
    <div style={{ padding: '24px 40px', maxWidth: 900 }}>
      <h2 style={{ fontSize: 18, marginBottom: 20 }}>Analysis</h2>

      {/* Unified score distribution */}
      {scoredCandidates.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10, color: '#9af' }}>
            Unified Score Distribution — {scoredCandidates.length} scored
          </h3>
          <ScoreHistogram
            scores={scoredCandidates.map((c) => c.unifiedScore!.overall)}
            color="#27a"
          />

          {/* Vision vs LLM sub-score comparison */}
          {scoredCandidates.some((c) => c.unifiedScore!.metadataScore >= 0) && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 6 }}>
                Vision vs LLM sub-scores (each dot = 1 image)
              </div>
              <ScatterPlot
                candidates={scoredCandidates}
                annotations={annotations}
                xKey="visionScore"
                yKey="metadataScore"
                xLabel="Vision Score"
                yLabel="LLM Score"
              />
            </div>
          )}
        </div>
      )}

      {/* Confusion matrix */}
      {all.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>
            Pipeline vs Human — {all.length} annotations
          </h3>
          <table style={{ borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>Human: Accept</th>
                <th style={thStyle}>Human: Reject</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={thStyle}>Pipeline: Pass</td>
                <td style={{ ...tdStyle, background: '#1a3a2a', color: '#6d6' }}>{truePositive}</td>
                <td style={{ ...tdStyle, background: '#3a1a1a', color: '#d66' }}>
                  {falsePositive}
                </td>
              </tr>
              <tr>
                <td style={thStyle}>Pipeline: Fail</td>
                <td style={{ ...tdStyle, background: '#3a2a1a', color: '#da6' }}>
                  {falseNegative}
                </td>
                <td style={{ ...tdStyle, background: '#1a3a2a', color: '#6d6' }}>{trueNegative}</td>
              </tr>
            </tbody>
          </table>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>
            Agreement: <b>{agreement}%</b> &mdash; False positives:{' '}
            <b style={{ color: '#d66' }}>{falsePositive}</b> &mdash; False negatives:{' '}
            <b style={{ color: '#da6' }}>{falseNegative}</b>
          </div>
        </div>
      )}

      {/* Score distributions */}
      {all.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Score Distribution by Human Verdict</h3>
          <div style={{ display: 'flex', gap: 30 }}>
            <div>
              <div style={{ fontSize: 12, color: '#2a7', marginBottom: 4 }}>
                Accepted ({accepted.length})
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                Avg: <b>{avgAccepted}</b> | Range: {acceptedScores[0] ?? '-'} –{' '}
                {acceptedScores[acceptedScores.length - 1] ?? '-'}
              </div>
              <ScoreHistogram scores={acceptedScores} color="#2a7" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#c33', marginBottom: 4 }}>
                Rejected ({rejected.length})
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>
                Avg: <b>{avgRejected}</b> | Range: {rejectedScores[0] ?? '-'} –{' '}
                {rejectedScores[rejectedScores.length - 1] ?? '-'}
              </div>
              <ScoreHistogram scores={rejectedScores} color="#c33" />
            </div>
          </div>
        </div>
      )}

      {/* Blind spots */}
      {blindSpotSorted.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10, color: '#d66' }}>
            Blind spots — pipeline passed, you rejected
          </h3>
          {blindSpotSorted.map(([tag, count]) => (
            <div key={tag} style={{ fontSize: 12, marginBottom: 3 }}>
              <span style={{ display: 'inline-block', width: 160 }}>
                {TAG_LABELS[tag as AnnotationTag] ?? tag}
              </span>
              <b>{count}</b>
              <span
                style={{
                  display: 'inline-block',
                  width: count * 20,
                  height: 10,
                  background: '#d66',
                  borderRadius: 2,
                  marginLeft: 8,
                  verticalAlign: 'middle',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Missed opportunities */}
      {missedSorted.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10, color: '#da6' }}>
            Missed — pipeline failed, you accepted
          </h3>
          {missedSorted.map(([tag, count]) => (
            <div key={tag} style={{ fontSize: 12, marginBottom: 3 }}>
              <span style={{ display: 'inline-block', width: 160 }}>
                {TAG_LABELS[tag as AnnotationTag] ?? tag}
              </span>
              <b>{count}</b>
              <span
                style={{
                  display: 'inline-block',
                  width: count * 20,
                  height: 10,
                  background: '#da6',
                  borderRadius: 2,
                  marginLeft: 8,
                  verticalAlign: 'middle',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Threshold sweep */}
      {all.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Threshold Tuning</h3>
          <table style={{ borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={thStyle}>Threshold</th>
                <th style={thStyle}>Would pass</th>
                <th style={thStyle}>Precision</th>
                <th style={thStyle}>Recall</th>
              </tr>
            </thead>
            <tbody>
              {thresholdData.map((row) => (
                <tr
                  key={row.threshold}
                  style={{ background: row.threshold === 55 ? '#1a2a3a' : 'transparent' }}
                >
                  <td style={tdStyle}>
                    {row.threshold}
                    {row.threshold === 55 ? ' (current)' : ''}
                  </td>
                  <td style={tdStyle}>
                    {row.passCount} / {all.length}
                  </td>
                  <td style={tdStyle}>{row.precision}%</td>
                  <td style={tdStyle}>{row.recall}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Provider breakdown */}
      {Object.keys(byProvider).length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>By Provider</h3>
          {Object.entries(byProvider).map(([prov, counts]) => (
            <div key={prov} style={{ fontSize: 12, marginBottom: 4 }}>
              <b>{prov}</b>: {counts.accepted} accepted, {counts.rejected} rejected (
              {((counts.accepted / (counts.accepted + counts.rejected)) * 100).toFixed(0)}% accept
              rate)
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {all.some((a) => a.note) && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>Notes</h3>
          {all
            .filter((a) => a.note)
            .map((a) => (
              <div key={a.key} style={{ fontSize: 11, marginBottom: 6, color: '#aaa' }}>
                <span style={{ color: a.verdict === 'accept' ? '#2a7' : '#c33' }}>
                  {a.verdict.toUpperCase()}
                </span>{' '}
                [{a.pipelineScore}] <b>{a.title.slice(0, 50)}</b>:{' '}
                <span style={{ color: '#9af', fontStyle: 'italic' }}>{a.note}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

// ─── Score Histogram ─────────────────────────────────────────────────────────

function ScoreHistogram({ scores, color }: { scores: number[]; color: string }) {
  const buckets = [0, 0, 0, 0, 0, 0]; // <20, 20-39, 40-54, 55-69, 70-84, 85+
  for (const s of scores) {
    if (s < 20) buckets[0]++;
    else if (s < 40) buckets[1]++;
    else if (s < 55) buckets[2]++;
    else if (s < 70) buckets[3]++;
    else if (s < 85) buckets[4]++;
    else buckets[5]++;
  }
  const max = Math.max(1, ...buckets);
  const labels = ['<20', '20s', '40s', '55+', '70s', '85+'];

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'end', height: 50, marginTop: 6 }}>
      {buckets.map((count, i) => (
        <div
          key={i}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
        >
          <div style={{ fontSize: 9, color: '#888' }}>{count || ''}</div>
          <div
            style={{
              width: 28,
              height: Math.max(2, (count / max) * 36),
              background: color,
              borderRadius: 2,
            }}
          />
          <div style={{ fontSize: 9, color: '#666' }}>{labels[i]}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Scatter Plot ────────────────────────────────────────────────────────────

function ScatterPlot({
  candidates,
  annotations,
  xKey,
  yKey,
  xLabel,
  yLabel,
}: {
  candidates: ScoredCandidate[];
  annotations: AnnotationMap;
  xKey: 'visionScore' | 'metadataScore';
  yKey: 'visionScore' | 'metadataScore';
  xLabel: string;
  yLabel: string;
}) {
  const W = 300;
  const H = 200;
  const PAD = 30;

  return (
    <svg width={W} height={H} style={{ background: '#1a1a1a', borderRadius: 4 }}>
      <line x1={PAD} y1={H - PAD} x2={W - 10} y2={H - PAD} stroke="#444" />
      <line x1={PAD} y1={10} x2={PAD} y2={H - PAD} stroke="#444" />
      <text x={W / 2} y={H - 4} fill="#666" fontSize={9} textAnchor="middle">
        {xLabel}
      </text>
      <text
        x={4}
        y={H / 2}
        fill="#666"
        fontSize={9}
        textAnchor="middle"
        transform={`rotate(-90, 8, ${H / 2})`}
      >
        {yLabel}
      </text>

      {candidates.map((c, i) => {
        const u = c.unifiedScore!;
        const xVal = u[xKey];
        const yVal = u[yKey];
        if (xVal < 0 || yVal < 0) return null;

        const key = `${c.candidate.provider}:${c.candidate.providerImageId}`;
        const ann = annotations[key];

        const x = PAD + (xVal / 100) * (W - PAD - 10);
        const y = H - PAD - (yVal / 100) * (H - PAD - 10);

        const color = ann ? (ann.verdict === 'accept' ? '#2a7' : '#c33') : '#669';

        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={4}
            fill={color}
            opacity={0.8}
            stroke="#000"
            strokeWidth={0.5}
          >
            <title>{`${xLabel}: ${xVal}, ${yLabel}: ${yVal}${ann ? `, Human: ${ann.verdict}` : ''}`}</title>
          </circle>
        );
      })}
    </svg>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function queryLabelsForProvider(provider: string, meta: Meta | null): string[] {
  if (!meta) return ['Loading...'];
  switch (provider) {
    case 'wikimedia':
      return meta.wikimedia.categoryLabels.map((l, i) => `${i}. ${l}`);
    case 'loc':
      return meta.loc.queryLabels.map((l, i) => `${i}. ${l}`);
    case 'europeana':
      return meta.europeana.queryLabels.map((l, i) => `${i}. ${l}`);
    default:
      return [];
  }
}

const pageBtnStyle: React.CSSProperties = {
  background: '#333',
  color: '#fff',
  border: '1px solid #555',
  borderRadius: 4,
  padding: '2px 8px',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 700,
};

const thStyle: React.CSSProperties = {
  padding: '6px 14px',
  textAlign: 'left',
  borderBottom: '1px solid #333',
  fontSize: 12,
  color: '#aaa',
};

const tdStyle: React.CSSProperties = {
  padding: '6px 14px',
  textAlign: 'left',
  borderBottom: '1px solid #222',
  fontSize: 13,
};
