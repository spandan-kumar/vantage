import React, { useMemo, useState } from 'react';
import { TASKS } from './data/tasks';
import { Task, Message, AssessmentResult, AssessmentMode, SkillCategory } from './types';
import ChatInterface from './components/ChatInterface';
import AssessmentReport from './components/AssessmentReport';
import { evaluateTranscript } from './services/gemini';
import { BrainCircuit, Users, Lightbulb, FileText, Loader2 } from 'lucide-react';

type AppState = 'SELECTION' | 'CHAT' | 'EVALUATING' | 'REPORT';
const HISTORY_STORAGE_KEY = 'vantage-assessment-history-v1';

interface HistoryEntry {
  id: string;
  timestamp: string;
  mode: AssessmentMode;
  skill: SkillCategory;
  overallScore: number | 'NA';
  overallConfidence: number;
  minimumEvidenceMet: boolean;
}

function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 20);
  } catch {
    return [];
  }
}

function App() {
  const [appState, setAppState] = useState<AppState>('SELECTION');
  const [assessmentMode, setAssessmentMode] = useState<AssessmentMode>('assessment');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());

  const handleStartTask = (task: Task) => {
    setSelectedTask(task);
    setAppState('CHAT');
  };

  const handleChatComplete = async (messages: Message[]) => {
    if (!selectedTask) return;
    
    setAppState('EVALUATING');
    try {
      const result = await evaluateTranscript(messages, selectedTask, assessmentMode);
      setAssessmentResult(result);
      const newEntry: HistoryEntry = {
        id: `${Date.now()}`,
        timestamp: new Date().toISOString(),
        mode: assessmentMode,
        skill: result.skill,
        overallScore: result.overallScore,
        overallConfidence: result.overallConfidence,
        minimumEvidenceMet: result.minimumEvidenceMet,
      };
      const nextHistory = [newEntry, ...history].slice(0, 20);
      setHistory(nextHistory);
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      setAppState('REPORT');
    } catch (error) {
      console.error("Failed to evaluate transcript:", error);
      alert("Failed to generate assessment. Please try again.");
      setAppState('CHAT');
    }
  };

  const handleReset = () => {
    setAppState('SELECTION');
    setSelectedTask(null);
    setAssessmentResult(null);
  };

  const skillHistory = useMemo(() => {
    if (!assessmentResult) return [];
    return history.filter((entry) => entry.skill === assessmentResult.skill).slice(0, 5);
  }, [assessmentResult, history]);

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'Collaboration': return <Users className="text-theme-accent" />;
      case 'Creativity': return <Lightbulb className="text-theme-accent" />;
      case 'Critical Thinking': return <FileText className="text-theme-accent" />;
      default: return <BrainCircuit className="text-theme-accent" />;
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text-main font-sans selection:bg-theme-accent/20">
      
      {/* Header */}
      <header className="bg-theme-primary text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrainCircuit size={20} />
            <h1 className="text-xl font-bold tracking-tight">Vantage Skills Assessment</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {appState === 'SELECTION' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-4xl font-extrabold tracking-tight text-theme-text-main">
                Measure Your Durable Skills
              </h2>
              <p className="text-lg text-theme-text-muted">
                Engage in simulated group tasks with AI teammates. Our Executive LLM will steer the conversation to elicit evidence of your skills, and an AI Evaluator will provide a detailed psychometric assessment.
              </p>
              <div className="inline-flex bg-theme-surface border border-theme-border rounded-md p-1">
                <button
                  onClick={() => setAssessmentMode('assessment')}
                  className={`px-3 py-1.5 text-sm rounded ${assessmentMode === 'assessment' ? 'bg-theme-accent text-white' : 'text-theme-text-muted'}`}
                >
                  Assessment Mode
                </button>
                <button
                  onClick={() => setAssessmentMode('practice')}
                  className={`px-3 py-1.5 text-sm rounded ${assessmentMode === 'practice' ? 'bg-theme-accent text-white' : 'text-theme-text-muted'}`}
                >
                  Practice Mode
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mt-12">
              {TASKS.map((task) => (
                <div 
                  key={task.id}
                  className="bg-theme-surface rounded-lg p-5 shadow-sm border border-theme-border hover:border-theme-accent transition-all flex flex-col h-full cursor-pointer group"
                  onClick={() => handleStartTask(task)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-theme-bg rounded-lg group-hover:bg-theme-accent/10 transition-colors">
                      {getSkillIcon(task.skill)}
                    </div>
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-theme-text-muted">{task.theme}</span>
                      <h3 className="font-bold text-theme-text-main leading-tight">{task.skill}</h3>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-semibold mb-2 text-theme-text-main">{task.title}</h4>
                  <p className="text-sm text-theme-text-muted flex-1 line-clamp-3 mb-6">
                    {task.description}
                  </p>
                  
                  <button className="w-full py-2.5 bg-transparent border border-theme-border text-theme-text-main font-semibold rounded-md group-hover:bg-theme-accent group-hover:text-white group-hover:border-theme-accent transition-colors">
                    Start Scenario
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {appState === 'CHAT' && selectedTask && (
          <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="mb-6 flex items-center justify-between">
              <div>
                  <h2 className="text-2xl font-bold text-theme-text-main">{selectedTask.title}</h2>
                  <p className="text-theme-text-muted">
                    Interact with your AI teammates to complete the task. Current mode:{' '}
                    <span className="font-semibold text-theme-text-main">
                      {assessmentMode === 'assessment' ? 'Assessment' : 'Practice'}
                    </span>
                  </p>
                </div>
              <button 
                onClick={handleReset}
                className="text-sm font-medium text-theme-text-muted hover:text-theme-text-main"
              >
                Cancel
              </button>
            </div>
            <ChatInterface task={selectedTask} assessmentMode={assessmentMode} onComplete={handleChatComplete} />
          </div>
        )}

        {appState === 'EVALUATING' && (
          <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 animate-in fade-in">
            <div className="w-16 h-16 bg-theme-accent/10 rounded-2xl flex items-center justify-center">
              <Loader2 size={32} className="text-theme-accent animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-theme-text-main">Analyzing Conversation</h2>
              <p className="text-theme-text-muted max-w-md mx-auto">
                Our AI Evaluator is reviewing the transcript against the pedagogical rubrics to measure your {selectedTask?.skill.toLowerCase()} skills...
              </p>
            </div>
          </div>
        )}

        {appState === 'REPORT' && assessmentResult && (
          <AssessmentReport result={assessmentResult} skillHistory={skillHistory} onReset={handleReset} />
        )}

      </main>
    </div>
  );
}

export default App;
