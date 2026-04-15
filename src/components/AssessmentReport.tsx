import React, { useState } from 'react';
import { AssessmentResult } from '../types';
import { ChevronDown, ChevronUp, CheckCircle2, AlertCircle, MessageSquareQuote } from 'lucide-react';
import { cn } from '../lib/utils';

interface AssessmentReportProps {
  result: AssessmentResult;
  onReset: () => void;
}

export default function AssessmentReport({ result, onReset }: AssessmentReportProps) {
  const [expandedDim, setExpandedDim] = useState<string | null>(null);

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
