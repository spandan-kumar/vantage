import React, { useState } from 'react';
import { AssessmentResult } from '../types';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, MessageSquareQuote } from 'lucide-react';
import { cn } from '../lib/utils';

interface AssessmentReportProps {
  result: AssessmentResult;
  skillHistory: {
    id: string;
    timestamp: string;
    overallScore: number | 'NA';
    overallConfidence: number;
    minimumEvidenceMet: boolean;
    mode: 'assessment' | 'practice';
  }[];
  onReset: () => void;
}

export default function AssessmentReport({ result, skillHistory, onReset }: AssessmentReportProps) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);
  const reliabilityFlags = result.reliabilityFlags ?? [];
  const validityNotes = result.validityNotes ?? [];
  const fairnessChecks = result.fairnessChecks ?? [];
  const immediateActions = result.developmentPlan?.immediateActions ?? [];
  const nextActions = result.developmentPlan?.nextActions ?? [];
  const stretchActions = result.developmentPlan?.stretchActions ?? [];

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
              "w-2 rounded-t-sm transition-all",
              level <= score ? "bg-theme-accent" : "bg-theme-bg",
              level === 1 ? "h-2" : level === 2 ? "h-3" : level === 3 ? "h-4" : "h-5"
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header / Summary */}
      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-accent/10 text-theme-accent mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-3xl font-bold text-theme-text-main mb-2">Assessment Complete</h1>
        <p className="text-lg text-theme-text-muted mb-6">Skill Evaluated: <span className="font-semibold text-theme-text-main">{result.skill}</span></p>
        <div className="grid sm:grid-cols-3 gap-3 mb-6 text-left">
          <div className="bg-theme-bg rounded-md border border-theme-border p-3">
            <div className="text-xs uppercase tracking-wide text-theme-text-muted">Overall Score</div>
            <div className="text-xl font-semibold text-theme-text-main mt-1">
              {result.overallScore === 'NA' ? 'Insufficient Evidence' : `Level ${result.overallScore}`}
            </div>
          </div>
          <div className="bg-theme-bg rounded-md border border-theme-border p-3">
            <div className="text-xs uppercase tracking-wide text-theme-text-muted">Confidence</div>
            <div className="text-xl font-semibold text-theme-text-main mt-1">
              {Math.round(result.overallConfidence * 100)}%
            </div>
          </div>
          <div className="bg-theme-bg rounded-md border border-theme-border p-3">
            <div className="text-xs uppercase tracking-wide text-theme-text-muted">Mode</div>
            <div className="text-xl font-semibold text-theme-text-main mt-1">
              {result.assessmentMode === 'assessment' ? 'Assessment' : 'Practice'}
            </div>
          </div>
        </div>
        
        <div className="bg-theme-bg rounded-md p-6 text-left border border-theme-border">
          <h3 className="font-semibold text-theme-text-main mb-2 flex items-center gap-2">
            <AlertCircle size={18} className="text-theme-accent" />
            AI Evaluator Summary
          </h3>
          <p className="text-theme-text-main leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Dimensions Breakdown */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-theme-text-main px-2">Detailed Breakdown</h2>
        
        {result.dimensions.map((dim, idx) => {
          const isExpanded = expandedDim === dim.dimension;
          
          return (
            <div 
              key={idx} 
              className="bg-theme-surface rounded-lg shadow-sm border border-theme-border overflow-hidden transition-all hover:border-theme-accent"
            >
              <button
                onClick={() => setExpandedDim(isExpanded ? null : dim.dimension)}
                className="w-full px-6 py-4 flex items-center justify-between bg-theme-surface focus:outline-none"
              >
                <div className="flex items-center gap-6">
                  <div className="w-24 flex flex-col items-center gap-1">
                    {getScoreBars(dim.score)}
                    <span className={cn(
                      "text-xs font-bold px-2 py-1 rounded mt-1 uppercase tracking-wider",
                      getScoreColor(dim.score)
                    )}>
                      {dim.score === 'NA' ? 'No Evidence' : "Level " + dim.score}
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-theme-text-main text-lg">{dim.dimension}</h3>
                    <p className="text-sm text-theme-text-muted font-medium">{dim.levelName}</p>
                    <p className="text-xs text-theme-text-muted mt-1">
                      Confidence {Math.round(dim.confidence * 100)}% | Evidence signals {dim.evidenceCount}
                    </p>
                  </div>
                </div>
                <div className="text-theme-text-muted">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-theme-border bg-theme-bg/50">
                  <div className="grid md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <h4 className="text-xs font-bold text-theme-text-muted mb-2 uppercase tracking-wider">Feedback</h4>
                      <p className="text-theme-text-main text-sm leading-relaxed">{dim.feedback}</p>
                      <h4 className="text-xs font-bold text-theme-text-muted mt-4 mb-2 uppercase tracking-wider">Next Probe</h4>
                      <p className="text-theme-text-main text-sm leading-relaxed">{dim.nextProbe}</p>
                    </div>
                    <div className="bg-theme-surface p-4 rounded-md border border-theme-border shadow-sm relative">
                      <MessageSquareQuote size={24} className="text-theme-accent/20 absolute top-3 left-3" />
                      <h4 className="text-xs font-bold text-theme-text-muted mb-2 ml-8 uppercase tracking-wider">Evidence from Transcript</h4>
                      <p className="text-theme-text-main text-sm italic ml-8">"{dim.excerpt}"</p>
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
            {reliabilityFlags.map((flag, idx) => (
              <li key={`rel-${idx}`} className="bg-theme-bg border border-theme-border rounded p-2">{flag}</li>
            ))}
            {validityNotes.map((note, idx) => (
              <li key={`val-${idx}`} className="bg-theme-bg border border-theme-border rounded p-2">{note}</li>
            ))}
          </ul>
        </div>
        <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
          <h3 className="font-semibold text-theme-text-main mb-3">Fairness Checks</h3>
          <ul className="space-y-2 text-sm text-theme-text-main">
            {fairnessChecks.map((check, idx) => (
              <li key={`fair-${idx}`} className="bg-theme-bg border border-theme-border rounded p-2">{check}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <h3 className="font-semibold text-theme-text-main mb-3">Development Plan</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          <div className="bg-theme-bg border border-theme-border rounded p-3">
            <div className="font-semibold text-theme-text-main mb-2">Immediate</div>
            {immediateActions.map((item, idx) => (
              <p key={`imm-${idx}`} className="text-theme-text-main mb-1">{item}</p>
            ))}
          </div>
          <div className="bg-theme-bg border border-theme-border rounded p-3">
            <div className="font-semibold text-theme-text-main mb-2">Next</div>
            {nextActions.map((item, idx) => (
              <p key={`next-${idx}`} className="text-theme-text-main mb-1">{item}</p>
            ))}
          </div>
          <div className="bg-theme-bg border border-theme-border rounded p-3">
            <div className="font-semibold text-theme-text-main mb-2">Stretch</div>
            {stretchActions.map((item, idx) => (
              <p key={`stretch-${idx}`} className="text-theme-text-main mb-1">{item}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-theme-surface rounded-lg shadow-sm border border-theme-border p-5">
        <h3 className="font-semibold text-theme-text-main mb-3">Recent Skill Trend</h3>
        <div className="space-y-2 text-sm">
          {skillHistory.length === 0 && <p className="text-theme-text-muted">No history yet for this skill.</p>}
          {skillHistory.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between bg-theme-bg border border-theme-border rounded p-2">
              <div className="text-theme-text-main">
                {new Date(entry.timestamp).toLocaleString()} ({entry.mode})
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
