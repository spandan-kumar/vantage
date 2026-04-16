import React, { useMemo, useState } from 'react';
import {
  AssessmentResult,
  HistorySession,
  Recommendation,
  LocaleCalibrationSummary,
} from '../types';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, MessageSquareQuote } from 'lucide-react';
import { cn } from '../lib/utils';

interface TrendSeries {
  dimension: string;
  points: Array<{ timestamp: string; score: number | 'NA'; confidence: number }>;
}

interface AssessmentReportProps {
  result: AssessmentResult;
  skillHistory: HistorySession[];
  sessionHistory: HistorySession[];
  dimensionTrends: TrendSeries[];
  recommendations: Recommendation[];
  localeCalibration: LocaleCalibrationSummary | null;
  onReset: () => void;
}

function scoreToNumber(score: number | 'NA') {
  return score === 'NA' ? 0 : score;
}

function TrendLine({ points }: { points: Array<{ score: number | 'NA' }> }) {
  const numeric = points.map((point) => scoreToNumber(point.score));
  const width = 160;
  const height = 44;
  const max = 4;
  const min = 0;
  const coordinates = numeric.map((value, index) => {
    const x = points.length <= 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - ((value - min) / (max - min)) * height;
    return `${x},${y}`;
  });

  if (coordinates.length === 0) {
    return <div className="text-xs text-theme-text-muted">No trend data</div>;
  }

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke="var(--color-theme-accent)" strokeWidth="2" points={coordinates.join(' ')} />
      {coordinates.map((point, index) => {
        const [x, y] = point.split(',').map(Number);
        return <circle key={index} cx={x} cy={y} r="2.6" fill="var(--color-theme-accent)" />;
      })}
    </svg>
  );
}

export default function AssessmentReport({
  result,
  skillHistory,
  sessionHistory,
  dimensionTrends,
  recommendations,
  localeCalibration,
  onReset,
}: AssessmentReportProps) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const [showTurnEvidence, setShowTurnEvidence] = useState(false);

  const reliabilityFlags = result.reliabilityFlags ?? [];
  const validityNotes = result.validityNotes ?? [];
  const fairnessChecks = result.fairnessChecks ?? [];
  const immediateActions = result.developmentPlan?.immediateActions ?? [];
  const nextActions = result.developmentPlan?.nextActions ?? [];
  const stretchActions = result.developmentPlan?.stretchActions ?? [];

  const sortedHistory = useMemo(
    () => [...skillHistory].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))),
    [skillHistory]
  );

  const getScoreColor = (score: number | 'NA') => {
    if (score === 'NA') return 'bg-theme-bg text-theme-text-muted';
    if (score >= 3) return 'bg-theme-success text-white';
    if (score === 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreBars = (score: number | 'NA') => {
    if (score === 'NA') return null;
    return (
      <div className="flex gap-1 items-end h-6">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'w-2 rounded-t-sm transition-all',
              level <= score ? 'bg-theme-accent' : 'bg-theme-bg',
              level === 1 ? 'h-2' : level === 2 ? 'h-3' : level === 3 ? 'h-4' : 'h-5'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-accent/10 text-theme-accent mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-3xl font-bold text-theme-text-main mb-2">Assessment Complete</h1>
        <p className="text-lg text-theme-text-muted mb-6">
          Skill Evaluated: <span className="font-semibold text-theme-text-main">{result.skill}</span>
        </p>
        <div className="grid sm:grid-cols-4 gap-3 mb-6 text-left">
          <div className="bg-theme-bg rounded-md border border-theme-border p-3">
            <div className="text-xs uppercase tracking-wide text-theme-text-muted">Overall Score</div>
            <div className="text-xl font-semibold text-theme-text-main mt-1">
              {result.overallScore === 'NA' ? 'Insufficient Evidence' : `Level ${result.overallScore}`}
            </div>
          </div>
          <div className="bg-theme-bg rounded-md border border-theme-border p-3">
            <div className="text-xs uppercase tracking-wide text-theme-text-muted">Confidence</div>
            <div className="text-xl font-semibold text-theme-text-main mt-1">{Math.round(result.overallConfidence * 100)}%</div>
          </div>
          <div className="bg-theme-bg rounded-md border border-theme-border p-3">
            <div className="text-xs uppercase tracking-wide text-theme-text-muted">Mode</div>
            <div className="text-xl font-semibold text-theme-text-main mt-1">{result.assessmentMode}</div>
          </div>
          <div className="bg-theme-bg rounded-md border border-theme-border p-3">
            <div className="text-xs uppercase tracking-wide text-theme-text-muted">Locale</div>
            <div className="text-xl font-semibold text-theme-text-main mt-1">{result.locale ?? 'en-IN'}</div>
          </div>
        </div>

        <div className="bg-theme-bg rounded-md p-6 text-left border border-theme-border">
          <h3 className="font-semibold text-theme-text-main mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-theme-accent" />
            AI Evaluator Summary
          </h3>
          <p className="text-theme-text-main leading-relaxed">{result.summary}</p>
          <p className="mt-3 text-xs text-theme-text-muted">
            Artifact: {result.metadata?.artifactId ?? 'n/a'} | Scorer: {result.metadata?.scorerVersion ?? 'n/a'} | Policy:{' '}
            {result.metadata?.policyVersion ?? 'n/a'}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-theme-text-main px-2">Detailed Breakdown</h2>

        {result.dimensions.map((dimension, index) => {
          const isExpanded = expandedDim === dimension.dimension;

          return (
            <div
              key={index}
              className="bg-theme-surface rounded-lg shadow-sm border border-theme-border overflow-hidden transition-all hover:border-theme-accent"
            >
              <button
                onClick={() => setExpandedDim(isExpanded ? null : dimension.dimension)}
                className="w-full px-6 py-4 flex items-center justify-between bg-theme-surface focus:outline-none"
              >
                <div className="flex items-center gap-6">
                  <div className="w-24 flex flex-col items-center gap-1">
                    {getScoreBars(dimension.score)}
                    <span
                      className={cn(
                        'text-xs font-bold px-2 py-1 rounded mt-1 uppercase tracking-wider',
                        getScoreColor(dimension.score)
                      )}
                    >
                      {dimension.score === 'NA' ? 'No Evidence' : `Level ${dimension.score}`}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-theme-text-main text-lg">{dimension.dimension}</h3>
                    <p className="text-sm text-theme-text-muted font-medium">{dimension.levelName}</p>
                    <p className="text-xs text-theme-text-muted mt-1">
                      Confidence {Math.round(dimension.confidence * 100)}% | Evidence signals {dimension.evidenceCount}
                      {typeof dimension.scoreSpread === 'number' ? ` | Spread ${dimension.scoreSpread.toFixed(2)}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-theme-text-muted">{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-theme-border bg-theme-bg/50">
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <h4 className="text-xs font-bold text-theme-text-muted mb-2 uppercase tracking-wider">Feedback</h4>
                      <p className="text-theme-text-main text-sm leading-relaxed">{dimension.feedback}</p>
                      <h4 className="text-xs font-bold text-theme-text-muted mt-4 mb-2 uppercase tracking-wider">Next Probe</h4>
                      <p className="text-theme-text-main text-sm leading-relaxed">{dimension.nextProbe}</p>
                    </div>
                    <div className="bg-theme-surface p-4 rounded-md border border-theme-border shadow-sm relative">
                      <MessageSquareQuote size={24} className="text-theme-accent/20 absolute top-3 left-3" />
                      <h4 className="text-xs font-bold text-theme-text-muted mb-2 ml-8 uppercase tracking-wider">Evidence from Transcript</h4>
                      <p className="text-theme-text-main text-sm italic ml-8">"{dimension.excerpt || 'No direct quote captured.'}"</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
          <h3 className="font-semibold text-theme-text-main mb-3">Reliability & Validity</h3>
          <ul className="space-y-2 text-sm text-theme-text-main">
            {reliabilityFlags.map((flag, index) => (
              <li key={`rel-${index}`} className="bg-theme-bg border border-theme-border rounded p-2">
                {flag}
              </li>
            ))}
            {validityNotes.map((note, index) => (
              <li key={`val-${index}`} className="bg-theme-bg border border-theme-border rounded p-2">
                {note}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
          <h3 className="font-semibold text-theme-text-main mb-3">Fairness & Calibration</h3>
          <ul className="space-y-2 text-sm text-theme-text-main">
            {fairnessChecks.map((check, index) => (
              <li key={`fair-${index}`} className="bg-theme-bg border border-theme-border rounded p-2">
                {check}
              </li>
            ))}
          </ul>
          <div className="mt-3 bg-theme-bg border border-theme-border rounded p-3 text-xs text-theme-text-muted">
            Locale calibration:{' '}
            {localeCalibration
              ? `${localeCalibration.locale} | ratings ${localeCalibration.humanRatings} | artifacts ${localeCalibration.artifactCount} | raters ${localeCalibration.raterCount} | ${localeCalibration.calibrated ? 'calibrated' : 'not calibrated'}`
              : 'not available'}
          </div>
        </div>
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <h3 className="font-semibold text-theme-text-main mb-3">Development Plan</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="bg-theme-bg border border-theme-border rounded p-3">
            <div className="font-semibold text-theme-text-main mb-2">Immediate</div>
            {immediateActions.map((item, index) => (
              <p key={`immediate-${index}`} className="text-theme-text-main mb-1">
                {item}
              </p>
            ))}
          </div>
          <div className="bg-theme-bg border border-theme-border rounded p-3">
            <div className="font-semibold text-theme-text-main mb-2">Next</div>
            {nextActions.map((item, index) => (
              <p key={`next-${index}`} className="text-theme-text-main mb-1">
                {item}
              </p>
            ))}
          </div>
          <div className="bg-theme-bg border border-theme-border rounded p-3">
            <div className="font-semibold text-theme-text-main mb-2">Stretch</div>
            {stretchActions.map((item, index) => (
              <p key={`stretch-${index}`} className="text-theme-text-main mb-1">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <h3 className="font-semibold text-theme-text-main mb-3">Dimension Trend Lines</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {dimensionTrends.length === 0 && <p className="text-sm text-theme-text-muted">No trend data yet.</p>}
          {dimensionTrends.map((series) => (
            <div key={series.dimension} className="bg-theme-bg border border-theme-border rounded p-3">
              <div className="text-sm font-semibold text-theme-text-main mb-2">{series.dimension}</div>
              <TrendLine points={series.points} />
              <div className="text-xs text-theme-text-muted mt-2">{series.points.length} observations</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h3 className="font-semibold text-theme-text-main">Session History</h3>
          <span className="text-xs uppercase tracking-widest text-theme-text-muted">
            {sessionHistory.length} recorded session{sessionHistory.length === 1 ? '' : 's'}
          </span>
        </div>
        {sessionHistory.length === 0 ? (
          <p className="text-sm text-theme-text-muted">No sessions recorded yet for this account.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sessionHistory.slice(0, 6).map((session) => (
              <div key={session.id} className="rounded-xl border border-theme-border bg-theme-bg p-3 text-sm">
                <div className="font-semibold text-theme-text-main">{session.taskTitle}</div>
                <div className="text-xs text-theme-text-muted mt-1">
                  {session.createdAt.slice(0, 10)} | {session.assessmentMode} | {session.locale}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-theme-text-main border border-theme-border">
                    {session.overallScore === 'NA' ? 'No evidence' : `Score ${session.overallScore}`}
                  </span>
                  <span className="rounded-full bg-white px-2 py-1 text-xs text-theme-text-main border border-theme-border">
                    {Math.round(session.overallConfidence * 100)}% confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <h3 className="font-semibold text-theme-text-main mb-3">Recommended Next Scenarios</h3>
        <div className="space-y-2 text-sm">
          {recommendations.length === 0 && <p className="text-theme-text-muted">No recommendations available yet.</p>}
          {recommendations.map((recommendation, index) => (
            <div key={`${recommendation.dimension}-${index}`} className="bg-theme-bg border border-theme-border rounded p-3">
              <p className="font-semibold text-theme-text-main">{recommendation.dimension}</p>
              <p className="text-theme-text-muted">{recommendation.reason}</p>
              <p className="text-theme-text-main mt-1">Try: {recommendation.recommendedScenarioTitle}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <button
          onClick={() => setShowTurnEvidence((previous) => !previous)}
          className="w-full text-left font-semibold text-theme-text-main"
        >
          {showTurnEvidence ? 'Hide' : 'Show'} Turn-level Evidence Labels ({result.turnEvidence?.length || 0})
        </button>
        {showTurnEvidence && (
          <div className="mt-4 space-y-2 max-h-[320px] overflow-y-auto">
            {(result.turnEvidence || []).map((turn) => (
              <div key={`${turn.turnId}-${turn.turnIndex}`} className="bg-theme-bg border border-theme-border rounded p-3 text-sm">
                <p className="font-semibold text-theme-text-main">
                  Turn {turn.turnIndex} | Confidence {Math.round(turn.overallTurnConfidence * 100)}%
                </p>
                {turn.insufficientEvidence && <p className="text-theme-text-muted">Insufficient direct evidence.</p>}
                {turn.dimensionEvidence.map((evidence, idx) => (
                  <p key={idx} className="text-theme-text-main">
                    {evidence.dimension}: {Math.round(evidence.strength * 100)}% strength ({evidence.evidenceType})
                  </p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <h3 className="font-semibold text-theme-text-main mb-3">Recent Skill Sessions</h3>
        <div className="space-y-2 text-sm">
          {sortedHistory.length === 0 && <p className="text-theme-text-muted">No history yet for this skill.</p>}
          {sortedHistory.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between bg-theme-bg border border-theme-border rounded p-2">
              <div className="text-theme-text-main">
                {new Date(entry.createdAt).toLocaleString()} ({entry.assessmentMode}, {entry.locale})
              </div>
              <div className="text-theme-text-main font-semibold">
                {entry.overallScore === 'NA' ? 'NA' : `L${entry.overallScore}`} • {Math.round(entry.overallConfidence * 100)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-8 pb-12">
        <button
          onClick={onReset}
          className="px-6 py-2.5 bg-transparent border border-theme-border text-theme-text-main font-semibold rounded-md hover:bg-theme-bg transition-colors shadow-sm"
        >
          Try Another Scenario
        </button>
      </div>
    </div>
  );
}
